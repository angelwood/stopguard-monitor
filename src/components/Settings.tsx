import { useState } from "preact/hooks";
import { STATE_LAWS } from "../lib/stateLaws";
import { LANGUAGES, getLanguageLabel } from "../lib/speechRecognition";
import type { AppSettings } from "../lib/settings";
import type { AccountInfo } from "../lib/account";
import { Account } from "./Account";
import { DataRights } from "./DataRights";
import { PREMIUM_PRODUCTS } from "../lib/tiers";
import type { BillingState } from "../lib/billing";

interface SettingsProps {
  selectedState: string;
  selectedLanguage: string;
  onStateChange: (code: string) => void;
  onLanguageChange: (lang: string) => void;
  settings: AppSettings;
  onSettingChange: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  onDeleteAll: () => void;
  // Account
  account: AccountInfo | null;
  onLogin: (account: AccountInfo) => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  incidents: unknown[];
  // Billing
  tier?: string;
  billingState?: BillingState;
  onUpgrade?: () => void;
  onExportData?: () => void;
}

export function Settings({
  selectedState, selectedLanguage, onStateChange, onLanguageChange,
  settings, onSettingChange, onDeleteAll,
  account, onLogin, onLogout, onDeleteAccount, incidents,
  tier, billingState, onUpgrade, onExportData,
}: SettingsProps) {
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPlayStore, setShowPlayStore] = useState(false);
  const [showDataRights, setShowDataRights] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [pinSetup, setPinSetup] = useState(false);

  const stateLaw = STATE_LAWS.find((s) => s.code === selectedState);
  const isPremium = tier === "premium";

  // Data Rights view
  if (showDataRights) {
    return (
      <div class="sg-settings">
        <div class="sg-settings-back" onClick={() => setShowDataRights(false)}>
          ‹ Back to Settings
        </div>
        <DataRights hasAccount={!!account} />
      </div>
    );
  }

  return (
    <div class="sg-settings">
      {/* Account section */}
      <div class="sg-settings-section">
        <div class="sg-settings-label">Account</div>
        <div class="sg-settings-card">
          <Account
            account={account}
            onLogin={onLogin}
            onLogout={onLogout}
            onDeleteAccount={onDeleteAccount}
            incidents={incidents}
            settings={settings}
          />
        </div>
      </div>

      {/* Data Rights & Usage */}
      <div class="sg-settings-section">
        <div class="sg-settings-label">Data & Privacy</div>
        <div class="sg-settings-card">
          <div class="sg-setting-link" onClick={() => setShowDataRights(true)}>
            <span class="sg-setting-link-icon">📊</span>
            <div class="sg-setting-link-body">
              <div class="sg-setting-title">Data Usage & Your Rights</div>
              <div class="sg-setting-desc">See exactly what we collect, how it's used, and your rights</div>
            </div>
            <span class="sg-chevron">›</span>
          </div>
        </div>
      </div>

      {/* Subscription / Premium section */}
      <div class="sg-settings-section">
        <div class="sg-settings-label">Subscription</div>
        <div class="sg-settings-card">
          {isPremium ? (
            <div class="sg-subscription-active">
              <div class="sg-sub-premium-header">
                <span class="sg-sub-badge">⭐ PREMIUM</span>
                <span class="sg-sub-status">Active</span>
              </div>
              <div class="sg-sub-features-grid">
                <div class="sg-sub-feature">☁️ Cloud Backup</div>
                <div class="sg-sub-feature">∞ Unlimited Incidents</div>
                <div class="sg-sub-feature">📱 Multi-Device Sync</div>
                <div class="sg-sub-feature">⚡ Auto-Backup on Record</div>
                <div class="sg-sub-feature">📤 Data Export</div>
                <div class="sg-sub-feature">🗑️ Custom Retention</div>
              </div>
              {billingState?.productId && (
                <div class="sg-sub-plan-info">
                  Plan: {billingState.productId.includes("yearly") ? "Yearly" : "Monthly"}
                  {billingState?.expiryDate && ` · Renews: ${new Date(billingState.expiryDate).toLocaleDateString()}`}
                </div>
              )}
              <div class="sg-sub-manage">
                Manage your subscription in the Google Play Store
              </div>
            </div>
          ) : (
            <div class="sg-subscription-free">
              <div class="sg-sub-free-header">
                <span class="sg-sub-badge-free">FREE</span>
                <span>5 incident limit · No cloud backup</span>
              </div>
              <div class="sg-sub-upsell-body">
                <div class="sg-sub-upsell-title">Upgrade to Premium</div>
                <div class="sg-sub-upsell-desc">
                  Cloud backup, unlimited storage, multi-device sync. Your evidence survives even if your phone doesn't.
                </div>
                <div class="sg-sub-pricing">
                  <div class="sg-sub-price-option">
                    <span class="sg-sub-price">{PREMIUM_PRODUCTS.monthly.price}</span>/mo
                  </div>
                  <div class="sg-sub-price-option sg-sub-price-best">
                    <span class="sg-sub-price">{PREMIUM_PRODUCTS.yearly.price}</span>/yr
                    <span class="sg-sub-price-savings">{PREMIUM_PRODUCTS.yearly.savings}</span>
                  </div>
                </div>
                <button class="sg-modal-btn primary sg-sub-upgrade-btn" onClick={onUpgrade}>
                  Upgrade Now
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recording settings */}
      <div class="sg-settings-section">
        <div class="sg-settings-label">Recording</div>
        <div class="sg-settings-card">
          <div class="sg-setting-row">
            <div class="sg-setting-info">
              <div class="sg-setting-title">
                Cloud Auto-Backup
                {!isPremium && <span class="sg-premium-lock">⭐</span>}
              </div>
              <div class="sg-setting-desc">
                {isPremium
                  ? account
                    ? "Upload recordings to your account as you record"
                    : "Sign in to enable cloud backup across devices"
                  : "Premium feature — your recordings survive even if your phone doesn't"}
              </div>
            </div>
            <button
              class={`sg-toggle ${settings.cloudBackup && !!account && isPremium ? "on" : ""}`}
              disabled={!account || !isPremium}
              onClick={() => {
                if (!isPremium) { onUpgrade?.(); return; }
                account && onSettingChange("cloudBackup", !settings.cloudBackup);
              }}
            />
          </div>
          <div class="sg-setting-row">
            <div class="sg-setting-info">
              <div class="sg-setting-title">Auto-Delete Local Recordings</div>
              <div class="sg-setting-desc">Automatically delete recordings after a set period</div>
            </div>
            <button
              class={`sg-toggle ${settings.autoDelete ? "on" : ""}`}
              onClick={() => onSettingChange("autoDelete", !settings.autoDelete)}
            />
          </div>
          {settings.autoDelete && (
            <div class="sg-setting-row">
              <div class="sg-setting-info">
                <div class="sg-setting-title">Delete After</div>
              </div>
              <select
                class="sg-setting-select"
                value={settings.autoDeleteDays}
                onChange={(e) => onSettingChange("autoDeleteDays", Number((e.target as HTMLSelectElement).value))}
              >
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Security */}
      <div class="sg-settings-section">
        <div class="sg-settings-label">Security</div>
        <div class="sg-settings-card">
          <div class="sg-setting-row">
            <div class="sg-setting-info">
              <div class="sg-setting-title">App Lock (PIN)</div>
              <div class="sg-setting-desc">Require PIN to open the app and access recordings</div>
            </div>
            <button
              class={`sg-toggle ${settings.appLock ? "on" : ""}`}
              onClick={() => {
                if (!settings.appLock) {
                  setPinSetup(true);
                } else {
                  onSettingChange("appLock", false);
                  onSettingChange("pin", null);
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Region */}
      <div class="sg-settings-section">
        <div class="sg-settings-label">Region</div>
        <div class="sg-settings-card">
          <div class="sg-setting-row">
            <div class="sg-setting-info">
              <div class="sg-setting-title">State</div>
              <div class="sg-setting-desc">{stateLaw?.name} — affects rights analysis and legal references</div>
            </div>
            <select class="sg-setting-select" value={selectedState} onChange={(e) => onStateChange((e.target as HTMLSelectElement).value)}>
              {STATE_LAWS.map((s) => (<option key={s.code} value={s.code}>{s.name}</option>))}
            </select>
          </div>
          <div class="sg-setting-row">
            <div class="sg-setting-info">
              <div class="sg-setting-title">Language</div>
              <div class="sg-setting-desc">{getLanguageLabel(selectedLanguage)}</div>
            </div>
            <select class="sg-setting-select" value={selectedLanguage} onChange={(e) => onLanguageChange((e.target as HTMLSelectElement).value)}>
              {LANGUAGES.map((l) => (<option key={l.code} value={l.code}>{l.label}</option>))}
            </select>
          </div>
        </div>
      </div>

      {/* Legal */}
      <div class="sg-settings-section">
        <div class="sg-settings-label">Legal</div>
        <div class="sg-settings-card">
          <div class="sg-setting-link" onClick={() => setShowPrivacy(true)}>
            <span class="sg-setting-link-icon">🔒</span>
            <div class="sg-setting-link-body">
              <div class="sg-setting-title">Privacy Policy</div>
              <div class="sg-setting-desc">How your data is collected, used, and protected</div>
            </div>
            <span class="sg-chevron">›</span>
          </div>
          <div class="sg-setting-link" onClick={() => setShowTerms(true)}>
            <span class="sg-setting-link-icon">📋</span>
            <div class="sg-setting-link-body">
              <div class="sg-setting-title">Terms of Service</div>
              <div class="sg-setting-desc">Terms and copyright notice</div>
            </div>
            <span class="sg-chevron">›</span>
          </div>
          <div class="sg-setting-link" onClick={() => setShowPlayStore(true)}>
            <span class="sg-setting-link-icon">📱</span>
            <div class="sg-setting-link-body">
              <div class="sg-setting-title">Play Store Data Safety</div>
              <div class="sg-setting-desc">Data disclosures for Google Play submission</div>
            </div>
            <span class="sg-chevron">›</span>
          </div>
        </div>
      </div>

      {/* Data management */}
      <div class="sg-settings-section">
        <div class="sg-settings-label">Data Management</div>
        <div class="sg-settings-card">
          {!deleteConfirm ? (
            <div class="sg-setting-link sg-danger" onClick={() => setDeleteConfirm(true)}>
              <span class="sg-setting-link-icon">🗑️</span>
              <div class="sg-setting-link-body">
                <div class="sg-setting-title">Delete All Local Data</div>
                <div class="sg-setting-desc">Remove all recordings, transcripts, and settings from this device</div>
              </div>
              <span class="sg-chevron">›</span>
            </div>
          ) : (
            <div class="sg-delete-confirm">
              <div class="sg-delete-warning">⚠️ This will permanently delete all local recordings and data. This cannot be undone.</div>
              <div class="sg-delete-btns">
                <button class="sg-delete-cancel" onClick={() => setDeleteConfirm(false)}>Cancel</button>
                <button class="sg-delete-confirm-btn" onClick={() => { onDeleteAll(); setDeleteConfirm(false); }}>Delete Everything</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* About */}
      <div class="sg-settings-section">
        <div class="sg-settings-label">About</div>
        <div class="sg-settings-card sg-about">
          <div class="sg-about-logo">🛡️ StopGuard</div>
          <div class="sg-about-version">Version 1.0.0</div>
          <div class="sg-about-copy">(c) 2025 StopGuard. All rights reserved.</div>
          <div class="sg-about-disclaimer">
            StopGuard is a decision-support tool, not legal advice. Always consult a licensed attorney.
          </div>
        </div>
      </div>

      {/* PIN setup modal */}
      {pinSetup && (
        <div class="sg-modal-overlay" onClick={() => setPinSetup(false)}>
          <div class="sg-modal" style={{ maxWidth: "360px" }} onClick={(e) => e.stopPropagation()}>
            <div class="sg-modal-header">
              <div class="sg-modal-title">Create PIN</div>
              <div class="sg-modal-subtitle">Enter a 4-digit PIN to protect your recordings</div>
            </div>
            <div class="sg-modal-body">
              <PinInputForm
                onComplete={(pin) => {
                  onSettingChange("pin", pin);
                  onSettingChange("appLock", true);
                  setPinSetup(false);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Legal modals */}
              {showPrivacy && <LegalDocModal title="Privacy Policy" url="/api/privacy" onClose={() => setShowPrivacy(false)} />}
              {showTerms && <LegalDocModal title="Terms of Service" url="/api/terms" onClose={() => setShowTerms(false)} />}
      {showPlayStore && <PlayStoreModal onClose={() => setShowPlayStore(false)} />}
    </div>
  );
}

function PinInputForm({ onComplete }: { onComplete: (pin: string) => void }) {
  const [pin, setPin] = useState("");
  const [confirm, setConfirm] = useState("");
  const [stage, setStage] = useState<"enter" | "confirm">("enter");
  const [error, setError] = useState<string | null>(null);

  const handleDigit = (d: string) => {
    setError(null);
    if (stage === "enter") {
      const next = pin + d;
      setPin(next);
      if (next.length >= 4) setStage("confirm");
    } else {
      const next = confirm + d;
      setConfirm(next);
      if (next.length >= 4) {
        if (next === pin) {
          onComplete(next);
        } else {
          setError("PINs don't match. Try again.");
          setConfirm("");
          setStage("enter");
          setPin("");
        }
      }
    }
  };

  const display = stage === "confirm" ? confirm : pin;

  return (
    <div class="sg-pin-setup-form">
      <div class="sg-pin-lock-subtitle" style={{ marginBottom: "16px" }}>
        {stage === "enter" ? "Enter a 4-digit PIN" : "Confirm your PIN"}
      </div>
      <div class="sg-pin-dots" style={{ justifyContent: "center", marginBottom: "20px" }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} class={`sg-pin-dot ${i < display.length ? "filled" : ""}`} />
        ))}
      </div>
      {error && <div class="sg-pin-error" style={{ marginBottom: "12px" }}>{error}</div>}
      <div class="sg-pin-keypad" style={{ maxWidth: "280px", margin: "0 auto" }}>
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <button key={d} class="sg-pin-key" onClick={() => handleDigit(d)}>{d}</button>
        ))}
        <div class="sg-pin-key-spacer" />
        <button class="sg-pin-key" onClick={() => handleDigit("0")}>0</button>
        <button class="sg-pin-key sg-pin-delete" onClick={() => {
          if (stage === "confirm") setConfirm(confirm.slice(0, -1));
          else setPin(pin.slice(0, -1));
        }}>⌫</button>
      </div>
    </div>
  );
}

function LegalDocModal({ title, url, onClose }: { title: string; url: string; onClose: () => void }) {
  return (
    <div class="sg-modal-overlay" onClick={onClose}>
      <div class="sg-modal sg-legal-modal" onClick={(e) => e.stopPropagation()}>
        <div class="sg-modal-header">
          <div class="sg-modal-title">{title}</div>
          <button class="sg-modal-close" onClick={onClose}>✕</button>
        </div>
        <div class="sg-legal-body">
          <div class="sg-legal-loading">Loading...</div>
          <iframe src={url} class="sg-legal-frame" onLoad={(e) => {
            const frame = e.target as HTMLIFrameElement;
            const parent = frame.parentElement;
            if (parent) parent.querySelector(".sg-legal-loading")?.remove();
          }} />
        </div>
      </div>
    </div>
  );
}

function PlayStoreModal({ onClose }: { onClose: () => void }) {
  return (
    <div class="sg-modal-overlay" onClick={onClose}>
      <div class="sg-modal sg-legal-modal" onClick={(e) => e.stopPropagation()}>
        <div class="sg-modal-header">
          <div class="sg-modal-title">Play Store Data Safety</div>
          <button class="sg-modal-close" onClick={onClose}>✕</button>
        </div>
        <div class="sg-playstore-body">
          <p style={{ fontSize: "13px", color: "var(--sg-text-2)", marginBottom: "16px" }}>
            Reference for the Google Play Console Data Safety form.
          </p>
          <div class="sg-ps-section"><div class="sg-ps-label">Data Collected</div>
            <div class="sg-ps-item"><strong>Audio recordings</strong> — Personal — Audio — When recording</div>
            <div class="sg-ps-item"><strong>Transcripts</strong> — Personal — Other — Generated when recording</div>
            <div class="sg-ps-item"><strong>Location</strong> — Personal — Precise location — Start of recording</div>
            <div class="sg-ps-item"><strong>Account info</strong> — Personal — Email, name — At registration</div>
          </div>
          <div class="sg-ps-section"><div class="sg-ps-label">Data Use</div>
            <div class="sg-ps-item">App functionality (recording, transcription, rights analysis)</div>
            <div class="sg-ps-item">Account backup (cloud backup, opt-in only)</div>
          </div>
          <div class="sg-ps-section"><div class="sg-ps-label">Data Sharing</div>
            <div class="sg-ps-item"><span class="sg-ps-never">Not shared</span> with any third parties</div>
          </div>
          <div class="sg-ps-section"><div class="sg-ps-label">Data Encryption</div>
            <div class="sg-ps-item"><strong>Yes</strong> — TLS 1.2+ in transit, AES-256 at rest</div>
          </div>
          <div class="sg-ps-section"><div class="sg-ps-label">Data Deletion</div>
            <div class="sg-ps-item"><strong>Yes</strong> — Delete individual or all data via Settings</div>
            <div class="sg-ps-item"><strong>Account deletion</strong> — Permanently removes all data, cannot be undone</div>
          </div>
          <div class="sg-ps-section"><div class="sg-ps-label">Permissions</div>
            <div class="sg-ps-item">MICROPHONE, RECORD_AUDIO — audio recording</div>
            <div class="sg-ps-item">ACCESS_FINE_LOCATION — stop location</div>
            <div class="sg-ps-item">FOREGROUND_SERVICE — recording when screen off</div>
          </div>
          <div class="sg-ps-section"><div class="sg-ps-label">Content Rating</div>
            <div class="sg-ps-item">Everyone — No objectionable content in the app</div>
          </div>
          <div class="sg-ps-section"><div class="sg-ps-label">Target Audience</div>
            <div class="sg-ps-item">13+ — Designed for licensed drivers</div>
          </div>
          <div class="sg-ps-section"><div class="sg-ps-label">Privacy Policy URL</div>
            <div class="sg-ps-item">https://stopguard.app/privacy</div>
          </div>
        </div>
      </div>
    </div>
  );
}
