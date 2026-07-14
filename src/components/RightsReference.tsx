import { useState } from "preact/hooks";
import { getAllRights, RightInfo } from "../lib/rightsEngine";
import type { StateLaw } from "../lib/stateLaws";

const CATEGORY_LABELS: Record<string, string> = {
  "during-stop": "During the Stop",
  search: "Search & Seizure",
  silence: "Silence & Attorney",
  recording: "Recording Police",
  "after-stop": "After the Stop",
};

const CATEGORY_ICONS: Record<string, string> = {
  "during-stop": "🚗",
  search: "🔍",
  silence: "🤐",
  recording: "📹",
  "after-stop": "📋",
};

const RIGHT_ICONS: Record<string, string> = {
  "reason-stop": "🛑", "provide-docs": "📄", "refuse-search": "🚫",
  "right-silence": "🤐", "right-attorney": "⚖️", "right-record": "📹",
  "ask-leave": "🚪", miranda: "📋", complaint: "📮", "no-passenger-id": "👤",
  "state-officer-id": "🔵", "state-recording": "🎥", "state-stop-identify": "🪪",
};

interface RightsReferenceProps {
  stateLaw: StateLaw;
}

export function RightsReference({ stateLaw }: RightsReferenceProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const allRights = getAllRights(stateLaw);
  const categories = Object.keys(CATEGORY_LABELS);

  return (
    <div>
      <div
        style={{
          padding: "16px 16px 8px",
          fontSize: "13px",
          color: "var(--sg-text-2)",
          lineHeight: 1.5,
          borderBottom: "1px solid var(--sg-border)",
          marginBottom: "4px",
        }}
      >
        Rights for{" "}
        <strong style={{ color: "var(--sg-text)" }}>{stateLaw.name}</strong>.
        Federal constitutional rights apply to all states; state-specific rights
        are marked with the state name. Tap any card for details.
      </div>

      {/* State law summary banner */}
      <div class="sg-state-summary">
        <div class="sg-state-summary-row">
          <span class="sg-state-summary-label">Recording consent</span>
          <span class={`sg-state-summary-value ${stateLaw.recordingConsent === "all-party" ? "warning" : "success"}`}>
            {stateLaw.recordingConsent === "all-party" ? "All-party" : "One-party"}
          </span>
        </div>
        <div class="sg-state-summary-row">
          <span class="sg-state-summary-label">Stop-and-identify</span>
          <span class={`sg-state-summary-value ${stateLaw.hasStopAndIdentify ? "warning" : "neutral"}`}>
            {stateLaw.hasStopAndIdentify ? "Yes — must ID if detained" : "No statute"}
          </span>
        </div>
        <div class="sg-state-summary-row">
          <span class="sg-state-summary-label">Officer must ID</span>
          <span class={`sg-state-summary-value ${stateLaw.officerMustIdentify ? "success" : "neutral"}`}>
            {stateLaw.officerMustIdentify ? "Yes — state law" : "No state law"}
          </span>
        </div>
        <div class="sg-state-summary-row">
          <span class="sg-state-summary-label">Passenger must ID</span>
          <span class={`sg-state-summary-value ${stateLaw.passengerMustID ? "warning" : "neutral"}`}>
            {stateLaw.passengerMustID ? "May be required" : "Not required"}
          </span>
        </div>
      </div>

      {categories.map((cat) => {
        const rights = allRights.filter((r) => r.category === cat);
        if (rights.length === 0) return null;
        return (
          <div key={cat}>
            <div class="sg-rights-category">
              {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
            </div>
            <div class="sg-rights-list" style={{ paddingTop: 0 }}>
              {rights.map((right) => (
                <RightCard
                  key={right.id}
                  right={right}
                  icon={RIGHT_ICONS[right.id] || "⚖️"}
                  isOpen={expanded === right.id}
                  onToggle={() => setExpanded(expanded === right.id ? null : right.id)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Key statutes */}
      {stateLaw.keyStatutes.length > 0 && (
        <div>
          <div class="sg-rights-category">📚 Key {stateLaw.name} Statutes</div>
          <div class="sg-rights-list" style={{ paddingTop: 0 }}>
            <div class="sg-statute-list">
              {stateLaw.keyStatutes.map((statute, idx) => (
                <div key={idx} class="sg-statute-item">
                  <span class="sg-statute-icon">§</span>
                  <span class="sg-statute-text">{statute}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          padding: "20px 16px 32px",
          fontSize: "11px",
          color: "var(--sg-text-muted)",
          lineHeight: 1.5,
          textAlign: "center",
        }}
      >
        StopGuard is a decision-support tool, not legal advice. Laws change and
        vary by jurisdiction. Consult a licensed attorney for legal guidance
        specific to your situation.
      </div>
    </div>
  );
}

function RightCard({
  right, icon, isOpen, onToggle,
}: {
  right: RightInfo;
  icon: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const isStateSpecific = right.id.startsWith("state-");
  return (
    <div class="sg-right-card">
      <div class="sg-right-card-header" onClick={onToggle}>
        <span class="sg-right-card-icon">{icon}</span>
        <div class="sg-right-card-body">
          <div class="sg-right-card-title">
            {right.title}
            {isStateSpecific && (
              <span class="sg-state-tag">state-specific</span>
            )}
          </div>
          <div class="sg-right-card-summary">{right.summary}</div>
        </div>
        <span class={`sg-right-card-chevron ${isOpen ? "open" : ""}`}>▼</span>
      </div>
      <div class={`sg-right-card-detail ${isOpen ? "open" : ""}`}>
        <div class="sg-right-card-detail-inner">
          <div class="sg-right-detail-block">
            <div class="sg-right-detail-label">Details</div>
            <div class="sg-right-detail-text">{right.details}</div>
          </div>
          <div class="sg-right-detail-block">
            <div class="sg-right-detail-label">Legal Basis</div>
            <div class="sg-right-detail-legal">{right.legalBasis}</div>
          </div>
          <div class="sg-right-detail-block">
            <div class="sg-right-detail-label">What to Do</div>
            <div class="sg-right-detail-todo">{right.whatToDo}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
