// Data Rights & Usage Transparency page
// Shows users exactly what data is collected, how it's used, and their rights.

interface DataRightsProps {
  hasAccount: boolean;
}

export function DataRights({ hasAccount }: DataRightsProps) {
  return (
    <div class="sg-data-rights">
      {/* Data collected */}
      <div class="sg-dr-section">
        <div class="sg-dr-section-header">
          <span class="sg-dr-icon">📋</span>
          <span class="sg-dr-section-title">What Data We Collect</span>
        </div>
        <div class="sg-dr-table">
          <div class="sg-dr-row sg-dr-header-row">
            <span>Data Type</span>
            <span>When</span>
            <span>Where Stored</span>
          </div>
          <div class="sg-dr-row">
            <span><strong>Audio recordings</strong></span>
            <span>During stop</span>
            <span>Device + cloud (opt-in)</span>
          </div>
          <div class="sg-dr-row">
            <span><strong>Transcripts</strong></span>
            <span>During stop</span>
            <span>Device + cloud (opt-in)</span>
          </div>
          <div class="sg-dr-row">
            <span><strong>GPS location</strong></span>
            <span>Record start</span>
            <span>Device + cloud (opt-in)</span>
          </div>
          <div class="sg-dr-row">
            <span><strong>Incident metadata</strong></span>
            <span>During/after stop</span>
            <span>Device + cloud (opt-in)</span>
          </div>
          <div class="sg-dr-row">
            <span><strong>Account info</strong></span>
            <span>Registration</span>
            <span>Server only</span>
          </div>
          <div class="sg-dr-row">
            <span><strong>App settings</strong></span>
            <span>When changed</span>
            <span>Device + cloud (if synced)</span>
          </div>
        </div>
      </div>

      {/* What we DON'T collect */}
      <div class="sg-dr-section">
        <div class="sg-dr-section-header">
          <span class="sg-dr-icon">🚫</span>
          <span class="sg-dr-section-title">What We Do NOT Collect</span>
        </div>
        <div class="sg-dr-never-grid">
          {[
            "Biometric data", "Advertising IDs", "Browsing history",
            "Contacts", "Photos (non-recording)", "Analytics/telemetry",
            "SMS or call logs", "Health data", "Financial data",
          ].map((item) => (
            <div class="sg-dr-never-item" key={item}>
              <span class="sg-dr-check">✗</span> {item}
            </div>
          ))}
        </div>
      </div>

      {/* How data is used */}
      <div class="sg-dr-section">
        <div class="sg-dr-section-header">
          <span class="sg-dr-icon">⚙️</span>
          <span class="sg-dr-section-title">How Your Data Is Used</span>
        </div>
        <div class="sg-dr-usage-list">
          <div class="sg-dr-usage-item">
            <span class="sg-dr-usage-icon">🎙️</span>
            <div>
              <div class="sg-dr-usage-title">Recording & Transcription</div>
              <div class="sg-dr-usage-desc">Audio is captured and transcribed on your device for real-time rights analysis.</div>
            </div>
          </div>
          <div class="sg-dr-usage-item">
            <span class="sg-dr-usage-icon">⚖️</span>
            <div>
              <div class="sg-dr-usage-title">Rights Analysis</div>
              <div class="sg-dr-usage-desc">Your transcript is analyzed against state and federal law to flag potential violations.</div>
            </div>
          </div>
          <div class="sg-dr-usage-item">
            <span class="sg-dr-usage-icon">☁️</span>
            <div>
              <div class="sg-dr-usage-title">Cloud Backup</div>
              <div class="sg-dr-usage-desc">When enabled, encrypted copies sync to your account for cross-device access.</div>
            </div>
          </div>
          <div class="sg-dr-usage-item">
            <span class="sg-dr-usage-icon">🔒</span>
            <div>
              <div class="sg-dr-usage-title">Evidence Preservation</div>
              <div class="sg-dr-usage-desc">Your recordings serve as legal evidence. We never delete without your action.</div>
            </div>
          </div>
        </div>
      </div>

      {/* Your rights */}
      <div class="sg-dr-section">
        <div class="sg-dr-section-header">
          <span class="sg-dr-icon">🛡️</span>
          <span class="sg-dr-section-title">Your Rights</span>
        </div>
        <div class="sg-dr-rights-list">
          <div class="sg-dr-right">
            <span class="sg-dr-right-label">Access</span>
            <span class="sg-dr-right-desc">View all data we hold about you</span>
          </div>
          <div class="sg-dr-right">
            <span class="sg-dr-right-label">Export</span>
            <span class="sg-dr-right-desc">Download all your data in JSON format</span>
          </div>
          <div class="sg-dr-right">
            <span class="sg-dr-right-label">Delete</span>
            <span class="sg-dr-right-desc">Delete recordings, incidents, or your entire account</span>
          </div>
          <div class="sg-dr-right">
            <span class="sg-dr-right-label">Opt-out</span>
            <span class="sg-dr-right-desc">Disable cloud backup. Keep everything local only</span>
          </div>
          <div class="sg-dr-right">
            <span class="sg-dr-right-label">Withdraw consent</span>
            <span class="sg-dr-right-desc">Delete account to stop all data processing</span>
          </div>
        </div>
      </div>

      {/* Encryption */}
      <div class="sg-dr-section">
        <div class="sg-dr-section-header">
          <span class="sg-dr-icon">🔐</span>
          <span class="sg-dr-section-title">Data Protection</span>
        </div>
        <div class="sg-dr-protection-grid">
          <div class="sg-dr-protection">
            <div class="sg-dr-protection-title">In Transit</div>
            <div class="sg-dr-protection-value">TLS 1.2+</div>
          </div>
          <div class="sg-dr-protection">
            <div class="sg-dr-protection-title">At Rest</div>
            <div class="sg-dr-protection-value">AES-256</div>
          </div>
          <div class="sg-dr-protection">
            <div class="sg-dr-protection-title">Passwords</div>
            <div class="sg-dr-protection-value">scrypt + salt</div>
          </div>
          <div class="sg-dr-protection">
            <div class="sg-dr-protection-title">Sessions</div>
            <div class="sg-dr-protection-value">256-bit, 30-day</div>
          </div>
        </div>
      </div>

      {/* Data sharing */}
      <div class="sg-dr-section">
        <div class="sg-dr-section-header">
          <span class="sg-dr-icon">🙅</span>
          <span class="sg-dr-section-title">Data Sharing</span>
        </div>
        <div class="sg-dr-sharing-box">
          <div class="sg-dr-sharing-main">
            <strong>We do not sell, rent, or share your data with any third party.</strong>
          </div>
          <div class="sg-dr-sharing-note">
            The only exception: if compelled by a valid court order. We will narrow the scope and notify you unless legally prohibited.
          </div>
        </div>
      </div>

      {/* Legal links */}
      <div class="sg-dr-section">
        <div class="sg-dr-legal-links">
          <a href="/v1/x/privacy" target="_blank" class="sg-dr-legal-link">
            📜 Full Privacy Policy
          </a>
          <a href="/v1/x/terms" target="_blank" class="sg-dr-legal-link">
            📋 Terms of Service
          </a>
        </div>
      </div>
    </div>
  );
}
