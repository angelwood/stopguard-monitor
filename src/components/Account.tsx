import { useState } from "preact/hooks";
import {
  register, login, exportData, deleteAccount, downloadJSON,
  getStoredToken, getStoredAccount, clearSession,
  type AccountInfo,
} from "../lib/account";

interface AccountProps {
  account: AccountInfo | null;
  onLogin: (account: AccountInfo) => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  incidents: unknown[];
  settings: Record<string, unknown>;
}

export function Account({ account, onLogin, onLogout, onDeleteAccount, incidents, settings }: AccountProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === "register") {
        const result = await register(email, password, name);
        onLogin(result.account);
      } else {
        const result = await login(email, password);
        onLogin(result.account);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    const token = getStoredToken();
    if (!token) return;
    setExportLoading(true);
    try {
      const data = await exportData(token);
      downloadJSON(data, `stopguard-export-${new Date().toISOString().split("T")[0]}.json`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setExportLoading(false);
    }
  };

  const handleDelete = async () => {
    const token = getStoredToken();
    if (!token) return;
    setLoading(true);
    try {
      await deleteAccount(token);
      onDeleteAccount();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Deletion failed");
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  // --- Logged in view ---
  if (account) {
    return (
      <div class="sg-account-logged-in">
        <div class="sg-account-card">
          <div class="sg-account-avatar">
            {account.name.charAt(0).toUpperCase()}
          </div>
          <div class="sg-account-info">
            <div class="sg-account-name">{account.name}</div>
            <div class="sg-account-email">{account.email}</div>
            <div class="sg-account-since">
              Member since {new Date(account.createdAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div class="sg-account-stats">
          <div class="sg-account-stat">
            <div class="sg-account-stat-num">{incidents.length}</div>
            <div class="sg-account-stat-label">Incidents</div>
          </div>
          <div class="sg-account-stat">
            <div class="sg-account-stat-num">{account.incidents?.length || 0}</div>
            <div class="sg-account-stat-label">Cloud Backed Up</div>
          </div>
        </div>

        <div class="sg-account-actions">
          <button class="sg-account-btn" onClick={handleExport} disabled={exportLoading}>
            {exportLoading ? "Exporting..." : "📥 Export My Data"}
          </button>
          <button class="sg-account-btn" onClick={onLogout}>
            🚪 Sign Out
          </button>
          {!showDeleteConfirm ? (
            <button class="sg-account-btn sg-danger-btn" onClick={() => setShowDeleteConfirm(true)}>
              🗑️ Delete Account
            </button>
          ) : (
            <div class="sg-account-delete-confirm">
              <div class="sg-delete-warning-text">
                This permanently deletes your account and ALL data. This cannot be undone.
              </div>
              <div class="sg-delete-confirm-btns">
                <button class="sg-account-btn" onClick={() => setShowDeleteConfirm(false)}>
                  Cancel
                </button>
                <button class="sg-account-btn sg-danger-confirm" onClick={handleDelete} disabled={loading}>
                  {loading ? "Deleting..." : "Yes, Delete Everything"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Login/Register view ---
  return (
    <div class="sg-account-auth">
      <div class="sg-auth-tabs">
        <button
          class={`sg-auth-tab ${mode === "login" ? "active" : ""}`}
          onClick={() => { setMode("login"); setError(null); }}
        >
          Sign In
        </button>
        <button
          class={`sg-auth-tab ${mode === "register" ? "active" : ""}`}
          onClick={() => { setMode("register"); setError(null); }}
        >
          Create Account
        </button>
      </div>

      <form class="sg-auth-form" onSubmit={handleSubmit}>
        {mode === "register" && (
          <div class="sg-auth-field">
            <label class="sg-auth-label">Name</label>
            <input
              class="sg-auth-input"
              type="text"
              placeholder="Your name"
              value={name}
              onInput={(e) => setName((e.target as HTMLInputElement).value)}
              required
              autoComplete="name"
            />
          </div>
        )}
        <div class="sg-auth-field">
          <label class="sg-auth-label">Email</label>
          <input
            class="sg-auth-input"
            type="email"
            placeholder="you@example.com"
            value={email}
            onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
            required
            autoComplete="email"
          />
        </div>
        <div class="sg-auth-field">
          <label class="sg-auth-label">Password</label>
          <input
            class="sg-auth-input"
            type="password"
            placeholder={mode === "register" ? "At least 8 characters" : "Your password"}
            value={password}
            onInput={(e) => setPassword((e.target as HTMLInputElement).value)}
            required
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            minLength={mode === "register" ? 8 : undefined}
          />
        </div>

        {error && <div class="sg-auth-error">{error}</div>}

        <button class="sg-auth-submit" type="submit" disabled={loading}>
          {loading ? "Please wait..." : mode === "register" ? "Create Account" : "Sign In"}
        </button>
      </form>

      {mode === "register" && (
        <div class="sg-auth-note">
          By creating an account, you agree to our{" "}
          <a href="/v1/x/terms" target="_blank">Terms of Service</a> and{" "}
          <a href="/v1/x/privacy" target="_blank">Privacy Policy</a>.
        </div>
      )}
    </div>
  );
}
