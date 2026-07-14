// StopGuard Account Client
// Uses fetch for standalone deployment (Vercel, Netlify, etc.)

import { Tier } from "./tiers";

export interface AccountInfo {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  lastLogin: string | null;
  incidents: unknown[];
  settings: Record<string, unknown>;
  tier?: Tier;
  subscription?: {
    productId?: string;
    provider?: string;
    status?: string;
    expiryDate?: string;
  };
}

export interface AuthResult {
  token: string;
  account: AccountInfo;
}

const SESSION_KEY = "stopguard-session";
const TIER_KEY = "stopguard-tier";

// API base — adjust if deploying to a subpath
const API_BASE = "";

async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  return fetch(`${API_BASE}${path}`, options);
}

export function getStoredToken(): string | null {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    return JSON.parse(stored).token || null;
  } catch { return null; }
}

export function getStoredAccount(): AccountInfo | null {
  try {
    const stored = localStorage.getItem(SESSION_KEY);
    if (!stored) return null;
    return JSON.parse(stored).account || null;
  } catch { return null; }
}

export function storeSession(token: string, account: AccountInfo) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ token, account }));
  if (account.tier) localStorage.setItem(TIER_KEY, account.tier);
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(TIER_KEY);
}

export function getStoredTier(): Tier {
  try {
    return (localStorage.getItem(TIER_KEY) as Tier) || "free";
  } catch { return "free"; }
}

export function setStoredTier(tier: Tier) {
  localStorage.setItem(TIER_KEY, tier);
  const account = getStoredAccount();
  if (account) {
    account.tier = tier;
    const token = getStoredToken();
    if (token) storeSession(token, account);
  }
}

export async function register(email: string, password: string, name: string): Promise<AuthResult> {
  const res = await apiFetch("/api/account", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "register", email, password, name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Registration failed");
  storeSession(data.token, data.account);
  return data;
}

export async function login(email: string, password: string): Promise<AuthResult> {
  const res = await apiFetch("/api/account", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "login", email, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Login failed");
  storeSession(data.token, data.account);
  return data;
}

export async function getProfile(token: string): Promise<AccountInfo> {
  const res = await apiFetch(`/api/account?token=${encodeURIComponent(token)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to load profile");
  return data.account;
}

export async function syncData(
  token: string,
  incidents: unknown[],
  settings: Record<string, unknown>
): Promise<AccountInfo> {
  const res = await apiFetch("/api/account", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "sync", token, incidents, settings }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Sync failed");
  const current = getStoredAccount();
  if (current) storeSession(token, { ...current, ...data.account });
  return data.account;
}

export async function exportData(token: string): Promise<unknown> {
  const res = await apiFetch(`/api/account?action=export&token=${encodeURIComponent(token)}`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Export failed");
  return data;
}

export async function deleteAccount(token: string): Promise<{ deleted: boolean; message: string }> {
  const res = await apiFetch(`/api/account?token=${encodeURIComponent(token)}`, { method: "DELETE" });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Account deletion failed");
  clearSession();
  return data;
}

export async function updateSubscription(
  authToken: string,
  provider: string,
  productId: string,
  purchaseToken: string
): Promise<{ tier: Tier }> {
  const res = await apiFetch("/api/account", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "updateSubscription",
      authToken,
      provider,
      productId,
      purchaseToken,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Subscription update failed");
  if (data.tier) setStoredTier(data.tier);
  return data;
}

export async function getSubscription(authToken: string): Promise<{
  tier: Tier;
  productId?: string;
  expiryDate?: string;
}> {
  const res = await apiFetch("/api/account", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "getSubscription", authToken }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Failed to check subscription");
  return data;
}

export function downloadJSON(data: unknown, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
