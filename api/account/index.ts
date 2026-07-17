// StopGuard Account API — Compatible with Vercel and Netlify
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

const DATA_DIR = join(process.cwd(), "data", "stopguard");
const ACCOUNTS_FILE = join(DATA_DIR, "accounts.json");
const SESSIONS_FILE = join(DATA_DIR, "sessions.json");

function ensureDataDir() {
  mkdirSync(DATA_DIR, { recursive: true });
}

function loadAccounts(): any[] {
  ensureDataDir();
  if (!existsSync(ACCOUNTS_FILE)) return [];
  try { return JSON.parse(readFileSync(ACCOUNTS_FILE, "utf-8")); } catch { return []; }
}

function saveAccounts(accounts: any[]) {
  ensureDataDir();
  writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
}

function loadSessions(): any[] {
  ensureDataDir();
  if (!existsSync(SESSIONS_FILE)) return [];
  try { return JSON.parse(readFileSync(SESSIONS_FILE, "utf-8")); } catch { return []; }
}

function saveSessions(sessions: any[]) {
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

function getAccountByToken(token: string): any | null {
  const sessions = loadSessions();
  const session = sessions.find((s: any) => {
    if (s.token !== token) return false;
    return new Date(s.expiresAt) > new Date();
  });
  if (!session) return null;
  const accounts = loadAccounts();
  return accounts.find((a: any) => a.id === session.accountId) || null;
}

function sanitizeAccount(account: any) {
  const { passwordHash, passwordSalt, ...safe } = account;
  return safe;
}

// --- Vercel handler (request, response) ---
// Vercel provides req and res like Express
export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  const method = req.method;

  // Vercel passes query params in req.query
  const action = req.query.action || "login";
  const token = req.query.token;

  const json = (status: number, body: any) => {
    res.status(status).json(body);
  };

  try {
    // Parse body for POST requests
    let body: any = {};
    if (method === "POST") {
      // Vercel auto-parses JSON body to req.body
      body = req.body || {};
      if (typeof body === "string") {
        try { body = JSON.parse(body); } catch { body = {}; }
      }
    }

    if (method === "POST") {
      const bAction = body.action || action;

      if (bAction === "register") {
        const { email, password, name } = body;
        if (!email || !password || !name) return json(400, { error: "Email, password, and name are required" });
        if (password.length < 8) return json(400, { error: "Password must be at least 8 characters" });
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(400, { error: "Invalid email address" });

        const accounts = loadAccounts();
        if (accounts.some((a: any) => a.email.toLowerCase() === email.toLowerCase())) {
          return json(409, { error: "An account with this email already exists" });
        }

        const salt = randomBytes(16).toString("hex");
        const passwordHash = hashPassword(password, salt);
        const now = new Date().toISOString();
        const account: any = {
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

        return json(201, { token: sessToken, account: sanitizeAccount(account) });
      }

      if (bAction === "login") {
        const { email, password } = body;
        if (!email || !password) return json(400, { error: "Email and password are required" });

        const accounts = loadAccounts();
        const account = accounts.find((a: any) => a.email.toLowerCase() === email.toLowerCase());
        if (!account || !verifyPassword(password, account.passwordHash, account.passwordSalt)) {
          return json(401, { error: "Invalid email or password" });
        }

        const now = new Date().toISOString();
        account.lastLogin = now;
        account.updatedAt = now;
        saveAccounts(accounts);

        const sessToken = generateToken();
        const sessions = loadSessions();
        const filtered = sessions.filter((s: any) => s.accountId !== account.id);
        filtered.push({ token: sessToken, accountId: account.id, createdAt: now,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() });
        saveSessions(filtered);

        return json(200, { token: sessToken, account: sanitizeAccount(account) });
      }

      if (bAction === "sync") {
        const { token: syncToken, incidents, settings } = body;
        if (!syncToken) return json(401, { error: "Authentication required" });
        const account = getAccountByToken(syncToken);
        if (!account) return json(401, { error: "Invalid or expired session" });

        if (incidents !== undefined) account.incidents = incidents;
        if (settings !== undefined) account.settings = settings;
        account.updatedAt = new Date().toISOString();

        const accounts = loadAccounts();
        const idx = accounts.findIndex((a: any) => a.id === account.id);
        if (idx >= 0) { accounts[idx] = account; saveAccounts(accounts); }

        return json(200, { account: sanitizeAccount(account) });
      }

      if (bAction === "updateSubscription") {
        const { authToken, provider, productId, purchaseToken } = body;
        if (!authToken) return json(401, { error: "Authentication required" });
        const account = getAccountByToken(authToken);
        if (!account) return json(401, { error: "Invalid or expired session" });

        account.subscription = {
          productId, provider, purchaseToken,
          status: "active",
          updatedAt: new Date().toISOString(),
        };
        account.updatedAt = new Date().toISOString();

        const accounts = loadAccounts();
        const idx = accounts.findIndex((a: any) => a.id === account.id);
        if (idx >= 0) { accounts[idx] = account; saveAccounts(accounts); }

        return json(200, { tier: "premium", subscription: account.subscription });
      }

      if (bAction === "getSubscription") {
        const { authToken } = body;
        if (!authToken) return json(401, { error: "Authentication required" });
        const account = getAccountByToken(authToken);
        if (!account) return json(401, { error: "Invalid or expired session" });

        const sub = account.subscription;
        if (sub && sub.status === "active") {
          if (sub.expiryDate && new Date(sub.expiryDate) < new Date()) {
            sub.status = "expired";
            const accounts = loadAccounts();
            const idx = accounts.findIndex((a: any) => a.id === account.id);
            if (idx >= 0) { accounts[idx] = account; saveAccounts(accounts); }
            return json(200, { tier: "free", status: "expired" });
          }
          return json(200, {
            tier: "premium",
            productId: sub.productId,
            expiryDate: sub.expiryDate,
          });
        }
        return json(200, { tier: "free", status: "never" });
      }

      return json(400, { error: "Unknown action" });
    }

    if (method === "GET") {
      if (!token) return json(401, { error: "Authentication required" });
      const account = getAccountByToken(token);
      if (!account) return json(401, { error: "Invalid or expired session" });

      if (action === "export") {
        return json(200, {
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
      return json(200, { account: sanitizeAccount(account) });
    }

    if (method === "DELETE") {
      if (!token) return json(401, { error: "Authentication required" });
      const account = getAccountByToken(token);
      if (!account) return json(401, { error: "Invalid or expired session" });

      const accounts = loadAccounts();
      saveAccounts(accounts.filter((a: any) => a.id !== account.id));
      const sessions = loadSessions();
      saveSessions(sessions.filter((s: any) => s.accountId !== account.id));

      return json(200, {
        deleted: true,
        message: "Account and all associated data have been permanently deleted.",
        deletedData: { account: account.email, incidentsCount: account.incidents.length, sessionsCleared: true },
      });
    }

    return json(405, { error: "Method not allowed" });
  } catch (err) {
    console.error("Account API error:", err);
    return json(500, { error: "Internal server error" });
  }
}
