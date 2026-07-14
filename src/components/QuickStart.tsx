import { useState } from "preact/hooks";
import { STATE_LAWS } from "../lib/stateLaws";

interface QuickStartProps {
  selectedState: string;
  audioSupported: boolean;
  onStart: () => void;
  onDemo: (key: string) => void;
  onOpenSettings: () => void;
  onOpenRights: () => void;
}

export function QuickStart({
  selectedState, audioSupported, onStart, onDemo, onOpenSettings, onOpenRights,
}: QuickStartProps) {
  const [showDemos, setShowDemos] = useState(false);
  const stateLaw = STATE_LAWS.find((s) => s.code === selectedState);

  return (
    <div class="sg-quickstart">
      {/* Giant start button — the whole point */}
      <div class="sg-quickstart-main">
        <div class="sg-quickstart-shield">🛡️</div>
        <div class="sg-quickstart-title">StopGuard</div>
        <div class="sg-quickstart-state">{stateLaw?.name}</div>

        <button
          class="sg-quickstart-btn"
          onClick={onStart}
          disabled={!audioSupported}
        >
          <span class="sg-quickstart-btn-icon">⏺</span>
          <span class="sg-quickstart-btn-text">START RECORDING</span>
        </button>

        {!audioSupported && (
          <div class="sg-quickstart-warning">
            ⚠️ Audio recording not supported in this browser. Use Chrome or Safari.
          </div>
        )}

        <div class="sg-quickstart-hint">
          Tap to start recording with live transcription and rights analysis
        </div>
      </div>

      {/* Quick access row */}
      <div class="sg-quickstart-actions">
        <button class="sg-quickstart-action" onClick={onOpenRights}>
          <span class="sg-quickstart-action-icon">⚖️</span>
          <span>Know Your Rights</span>
        </button>
        <button class="sg-quickstart-action" onClick={() => setShowDemos(!showDemos)}>
          <span class="sg-quickstart-action-icon">🎬</span>
          <span>Try Demo</span>
        </button>
        <button class="sg-quickstart-action" onClick={onOpenSettings}>
          <span class="sg-quickstart-action-icon">⚙️</span>
          <span>Settings</span>
        </button>
      </div>

      {/* Collapsible demos */}
      {showDemos && (
        <div class="sg-quickstart-demos">
          <div class="sg-quickstart-demo-label">Demo Scenarios</div>
          <button class="sg-quickstart-demo-btn" onClick={() => onDemo("violation-scenario")}>
            🚨 Multiple Violations — see how alerts fire
          </button>
          <button class="sg-quickstart-demo-btn" onClick={() => onDemo("clean-scenario")}>
            ✅ Proper Stop — no violations detected
          </button>
        </div>
      )}

      {/* Footer status */}
      <div class="sg-quickstart-footer">
        <div class="sg-quickstart-footer-item">
          <span class="sg-quickstart-footer-dot active" /> Ready
        </div>
        <div class="sg-quickstart-footer-item">☁️ Cloud backup on</div>
        <div class="sg-quickstart-footer-item">🔒 {stateLaw?.recordingConsent === "all-party" ? "All-party" : "One-party"} consent</div>
      </div>
    </div>
  );
}
