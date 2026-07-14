import { useState } from "preact/hooks";
import { formatDuration, formatTimestamp } from "../lib/rightsEngine";

interface IncidentData {
  id: string;
  date: string;
  durationSec: number;
  violations: { id: string; severity: string; title: string; timestamp: number }[];
  transcript: { id: string; speaker: string; text: string; timestamp: number }[];
  outcome: string;
  state?: string;
  language?: string;
}

interface IncidentLogProps {
  incidents: IncidentData[];
  onDelete: (id: string) => void;
  tier?: string;
  maxIncidents?: number;
  onUpgrade?: () => void;
}

export function IncidentLog({ incidents, onDelete, tier, maxIncidents, onUpgrade }: IncidentLogProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const isFreeTier = tier !== "premium";
  const limit = maxIncidents ?? 5;
  const atLimit = isFreeTier && incidents.length >= limit;

  if (incidents.length === 0) {
    return (
      <div class="sg-empty-state">
        <div class="sg-empty-state-icon">📋</div>
        <div class="sg-empty-state-text">No incidents recorded</div>
        <div class="sg-empty-state-sub">
          Record a traffic stop or try a demo scenario to see it here.
        </div>
      </div>
    );
  }

  return (
    <div class="sg-incidents">
      <div class="sg-rights-category" style={{ paddingBottom: "4px" }}>
        Recorded Incidents ({incidents.length}{isFreeTier ? `/${limit}` : ""})
      </div>

      {atLimit && (
        <div class="sg-incident-limit-banner" onClick={onUpgrade}>
          <div class="sg-incident-limit-text">
            ⚠️ You've reached the free tier limit of {limit} incidents. Older recordings may be overwritten.
          </div>
          <button class="sg-incident-limit-btn">Upgrade to Premium →</button>
        </div>
      )}
      {incidents.map((incident) => {
        const isOpen = expanded === incident.id;
        const date = new Date(incident.date);
        const dateStr = date.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        });
        const critical = incident.violations.filter(
          (v) => v.severity === "critical"
        );
        const warnings = incident.violations.filter(
          (v) => v.severity === "warning"
        );
        const isClean = incident.violations.length === 0;

        return (
          <div class="sg-incident-card" key={incident.id}>
            <div class="sg-incident-header">
              <span class="sg-incident-date">{dateStr}</span>
              <span class="sg-incident-duration">
                {formatDuration(incident.durationSec)}
              </span>
            </div>

            {incident.state && (
              <div class="sg-incident-meta" style={{ marginBottom: "8px" }}>
                <div class="sg-incident-meta-row">
                  <span class="sg-incident-meta-label">State:</span>
                  <span>{incident.state}</span>
                </div>
                {incident.language && (
                  <div class="sg-incident-meta-row">
                    <span class="sg-incident-meta-label">Language:</span>
                    <span>{incident.language}</span>
                  </div>
                )}
              </div>
            )}

            <div class="sg-incident-violations">
              {isClean ? (
                <span class="sg-incident-tag clean">No violations</span>
              ) : (
                <>
                  {critical.length > 0 && (
                    <span class="sg-incident-tag critical">
                      {critical.length} critical
                    </span>
                  )}
                  {warnings.length > 0 && (
                    <span class="sg-incident-tag warning">
                      {warnings.length} warning{warnings.length > 1 ? "s" : ""}
                    </span>
                  )}
                </>
              )}
            </div>

            {isOpen && (
              <div style={{ marginTop: "12px" }}>
                {incident.violations.length > 0 && (
                  <div style={{ marginBottom: "14px" }}>
                    <div
                      class="sg-section-label"
                      style={{ marginBottom: "8px" }}
                    >
                      Flagged Issues
                    </div>
                    {incident.violations.map((v) => (
                      <div
                        key={v.id}
                        style={{ marginBottom: "8px" }}
                      >
                        <span class={`sg-incident-tag ${v.severity}`}>
                          {v.severity}
                        </span>{" "}
                        <span style={{ fontSize: "13px" }}>{v.title}</span>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "var(--sg-text-muted)",
                            marginTop: "2px",
                            fontFamily: "var(--sg-mono)",
                          }}
                        >
                          at {formatTimestamp(v.timestamp)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div class="sg-section-label" style={{ marginBottom: "8px" }}>
                  Transcript
                </div>
                <div
                  class="sg-transcript-feed"
                  style={{ maxHeight: "240px" }}
                >
                  {incident.transcript.map((line) => (
                    <div class="sg-transcript-line" key={line.id}>
                      <span
                        class={`sg-transcript-speaker ${line.speaker}`}
                      >
                        {line.speaker}
                      </span>
                      <span class="sg-transcript-text">{line.text}</span>
                      <span class="sg-transcript-time">
                        {formatTimestamp(line.timestamp)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div class="sg-incident-actions">
              <button
                class="sg-incident-btn"
                onClick={() =>
                  setExpanded(isOpen ? null : incident.id)
                }
              >
                {isOpen ? "Hide details" : "View details"}
              </button>
              <button
                class="sg-incident-btn danger"
                onClick={() => {
                  if (
                    typeof window !== "undefined" &&
                    window.confirm("Delete this incident? This cannot be undone.")
                  ) {
                    onDelete(incident.id);
                  }
                }}
              >
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
