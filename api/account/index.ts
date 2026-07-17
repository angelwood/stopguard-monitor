// StopGuard Account API — Netlify serverless function
import type { Handler, HandlerEvent, HandlerContext, HandlerResponse } from "@netlify/functions";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

const DATA_DIR = join(process.cwd(), "data", "stopguard");
const ACCOUNTS_FILE = join(DATA_DIR, "accounts.json");
const SESSIONS_FILE = join(DATA_DIR, "sessions.json");

interface Subscription {
  productId?: string;
  provider?: string;
  purchaseToken?: string;
  status: "active" | "expired" | "never";
  expiryDate?: string;
  updatedAt?: string;
}

interface Account {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  passwordSalt: string;
  createdAt: string;
  updatedAt: string;
  lastLogin: string | null;
  incidents: unknown[];
  settings: Record<string, unknown>;
  subscription?: Subscription;
}

interface Session {
  token: string;
  accountId: string;
  createdAt: string;
  expiresAt: string;
}

function ensureDataDir() {
  mkdirSync(DATA_DIR, { recursive: true });
}

function loadAccounts(): Account[] {
  ensureDataDir();
  if (!existsSync(ACCOUNTS_FILE)) return [];
  try { return JSON.parse(readFileSync(ACCOUNTS_FILE, "utf-8")); } catch { return []; }
}

function saveAccounts(accounts: Account[]) {
  ensureDataDir();
  writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
}

function loadSessions(): Session[] {
  ensureDataDir();
  if (!existsSync(SESSIONS_FILE)) return [];
  try { return JSON.parse(readFileSync(SESSIONS_FILE, "utf-8")); } catch { return []; }
}

function saveSessions(sessions: Session[]) {
  ensureDataDir();
  writeFileSync(SESSIONS_FILE, JSON.stringify(sessions, null, 2));
}

function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, 64).toString("hex");
}

function verifyPassword(password: string, hash: string, salt: string): boolean {
  const testHash = hashPassword(password, salt);
  const a = Buffer.from(testHash, "hex");
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

function generateToken(): string {
  return randomBytes(32).toString("hex");
}

function getAccountByToken(token: string): Account | null {
  const sessions = loadSessions();
  const session = sessions.find((s) => {
    if (s.token !== token) return false;
    return new Date(s.expiresAt) > new Date();
  });
  if (!session) return null;
  const accounts = loadAccounts();
  return accounts.find((a) => a.id === session.accountId) || null;
}

function sanitizeAccount(account: Account) {
  const { passwordHash, passwordSalt, ...safe } = account;
  return safe;
}

// Netlify helper: parse query params
function getQueryParam(event: HandlerEvent, key: string): string | null {
  const url = new URL(event.path, `https://${event.headers.host || "localhost"}`);
  // Netlify passes query params separately
  const raw = event.queryStringParameters?.[key] || event.multiValueQueryStringParameters?.[key]?.[0];
  return raw || null;
}

// Netlify helper: parse JSON body
function parseBody(event: HandlerEvent): any {
  if (!event.body) return {};
  try { return JSON.parse(event.body); } catch { return {}; }
}

// Netlify helper: build response
function jsonResponse(statusCode: number, body: unknown): HandlerResponse {
  return {
    statusCode,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext): Promise<HandlerResponse> => {
  const method = event.httpMethod;
  const action = getQueryParam(event, "action") || "login";
  const token = getQueryParam(event, "token");

  try {
    if (method === "POST") {
      const body = parseBody(event);
      const bAction = body.action || action;

      if (bAction === "register") {
        const { email, password, name } = body;
        if (!email || !password || !name) return jsonResponse(400, { error: "Email, password, and name are required" });
        if (password.length < 8) return jsonResponse(400, { error: "Password must be at least 8 characters" });
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return jsonResponse(400, { error: "Invalid email address" });

        const accounts = loadAccounts();
        if (accounts.some((a) => a.email.toLowerCase() === email.toLowerCase())) {
          return jsonResponse(409, { error: "An account with this email already exists" });
        }

        const salt = randomBytes(16).toString("hex");
        const passwordHash = hashPassword(password, salt);
        const now = new Date().toISOString();
        const account: Account = {
          id: randomBytes(16).toString("hex"),
          email: email.toLowerCase(),
          name, passwordHash, passwordSalt: salt,
          createdAt: now, updatedAt: now, lastLogin: now,
          incidents: [], settings: {},
        };
        accounts.push(account);
        saveAccounts(accounts);

        const sessToken = generateToken();
        const sessions = loadSessions();
        sessions.push({ token: sessToken, accountId: account.id, createdAt: now,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() });
        saveSessions(sessions);

        return jsonResponse(201, { token: sessToken, account: sanitizeAccount(account) });
      }

      if (bAction === "login") {
        const { email, password } = body;
        if (!email || !password) return jsonResponse(400, { error: "Email and password are required" });

        const accounts = loadAccounts();
        const account = accounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
        if (!account || !verifyPassword(password, account.passwordHash, account.passwordSalt)) {
          return jsonResponse(401, { error: "Invalid email or password" });
        }

        const now = new Date().toISOString();
        account.lastLogin = now;
        account.updatedAt = now;
        saveAccounts(accounts);

        const sessToken = generateToken();
        const sessions = loadSessions();
        const filtered = sessions.filter((s) => s.accountId !== account.id);
        filtered.push({ token: sessToken, accountId: account.id, createdAt: now,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() });
        saveSessions(filtered);

        return jsonResponse(200, { token: sessToken, account: sanitizeAccount(account) });
      }

      if (bAction === "sync") {
        const { token: syncToken, incidents, settings } = body;
        if (!syncToken) return jsonResponse(401, { error: "Authentication required" });
        const account = getAccountByToken(syncToken);
        if (!account) return jsonResponse(401, { error: "Invalid or expired session" });

        if (incidents !== undefined) account.incidents = incidents;
        if (settings !== undefined) account.settings = settings;
        account.updatedAt = new Date().toISOString();

        const accounts = loadAccounts();
        const idx = accounts.findIndex((a) => a.id === account.id);
        if (idx >= 0) { accounts[idx] = account; saveAccounts(accounts); }

        return jsonResponse(200, { account: sanitizeAccount(account) });
      }

      if (bAction === "updateSubscription") {
        const { authToken, provider, productId, purchaseToken } = body;
        if (!authToken) return jsonResponse(401, { error: "Authentication required" });
        const account = getAccountByToken(authToken);
        if (!account) return jsonResponse(401, { error: "Invalid or expired session" });

        account.subscription = {
          productId,
          provider,
          purchaseToken,
          status: "active",
          updatedAt: new Date().toISOString(),
        };
        account.updatedAt = new Date().toISOString();

        const accounts = loadAccounts();
        const idx = accounts.findIndex((a) => a.id === account.id);
        if (idx >= 0) { accounts[idx] = account; saveAccounts(accounts); }

        return jsonResponse(200, { tier: "premium", subscription: account.subscription });
      }

      if (bAction === "getSubscription") {
        const { authToken } = body;
        if (!authToken) return jsonResponse(401, { error: "Authentication required" });
        const account = getAccountByToken(authToken);
        if (!account) return jsonResponse(401, { error: "Invalid or expired session" });

        const sub = account.subscription;
        if (sub && sub.status === "active") {
          if (sub.expiryDate && new Date(sub.expiryDate) < new Date()) {
            sub.status = "expired";
            const accounts = loadAccounts();
            const idx = accounts.findIndex((a) => a.id === account.id);
            if (idx >= 0) { accounts[idx] = account; saveAccounts(accounts); }
            return jsonResponse(200, { tier: "free", status: "expired" });
          }
          return jsonResponse(200, {
            tier: "premium",
            productId: sub.productId,
            expiryDate: sub.expiryDate,
          });
        }
        return jsonResponse(200, { tier: "free", status: "never" });
      }

      return jsonResponse(400, { error: "Unknown action" });
    }

    if (method === "GET") {
      if (!token) return jsonResponse(401, { error: "Authentication required" });
      const account = getAccountByToken(token);
      if (!account) return jsonResponse(401, { error: "Invalid or expired session" });

      if (action === "export") {
        return jsonResponse(200, {
          exportDate: new Date().toISOString(),
          account: { id: account.id, email: account.email, name: account.name,
            createdAt: account.createdAt, lastLogin: account.lastLogin },
          incidents: account.incidents,
          settings: account.settings,
          dataTypes: {
            audioRecordings: "Stored as Blob URLs in browser. Server stores metadata only.",
            transcripts: "Stored with each incident.",
            locationData: "GPS coordinates captured at recording start, stored with incident.",
            accountInfo: "Email, name, account creation date.",
            usageData: "No analytics or tracking data collected.",
          },
        });
      }
      return jsonResponse(200, { account: sanitizeAccount(account) });
    }

    if (method === "DELETE") {
      if (!token) return jsonResponse(401, { error: "Authentication required" });
      const account = getAccountByToken(token);
      if (!account) return jsonResponse(401, { error: "Invalid or expired session" });

      const accounts = loadAccounts();
      saveAccounts(accounts.filter((a) => a.id !== account.id));
      const sessions = loadSessions();
      saveSessions(sessions.filter((s) => s.accountId !== account.id));

      return jsonResponse(200, {
        deleted: true,
        message: "Account and all associated data have been permanently deleted.",
        deletedData: { account: account.email, incidentsCount: account.incidents.length, sessionsCleared: true },
      });
    }

    return jsonResponse(405, { error: "Method not allowed" });
  } catch (err) {
    console.error("Account API error:", err);
    return jsonResponse(500, { error: "Internal server error" });
  }
};
