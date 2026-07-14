import { useState } from "preact/hooks";

interface ChecklistItem {
  id: string;
  label: string;
  detail: string;
  icon: string;
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: "save-recording",
    label: "Verify recording is saved",
    detail: "Check that your recording was saved to the incident log and cloud backup completed.",
    icon: "💾",
  },
  {
    id: "note-details",
    label: "Note officer details",
    detail: "Write down officer name, badge number, patrol car number, and time of stop while fresh.",
    icon: "📝",
  },
  {
    id: "identify-witnesses",
    label: "Identify witnesses",
    detail: "If passengers or bystanders were present, get their contact info for corroboration.",
    icon: "👥",
  },
  {
    id: "document-injuries",
    label: "Document any injuries or damage",
    detail: "Photograph any injuries, vehicle damage, or property damage immediately.",
    icon: "📸",
  },
  {
    id: "preserve-evidence",
    label: "Preserve all evidence",
    detail: "Do not delete anything. Keep your recording, citation, and any paperwork in a safe place.",
    icon: "🔒",
  },
  {
    id: "file-complaint",
    label: "Consider filing a complaint",
    detail: "If rights were violated, file a complaint with the department's internal affairs or civilian oversight board. Check deadlines.",
    icon: "📮",
  },
  {
    id: "contact-attorney",
    label: "Consult a civil rights attorney",
    detail: "If you believe your rights were violated, speak with a qualified attorney. Many offer free consultations.",
    icon: "⚖️",
  },
  {
    id: "medical-attention",
    label: "Seek medical attention if needed",
    detail: "If you were injured during the stop, seek medical care immediately and document it.",
    icon: "🏥",
  },
  {
    id: "save-citation",
    label: "Save citation and court info",
    detail: "If cited, note the court date, violation codes, and whether you plan to contest.",
    icon: "📄",
  },
];

interface AfterStopChecklistProps {
  violationCount: number;
  stateName: string;
}

export function AfterStopChecklist({ violationCount, stateName }: AfterStopChecklistProps) {
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [showComplaintInfo, setShowComplaintInfo] = useState(false);

  const toggle = (id: string) => {
    const next = new Set(checked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setChecked(next);
  };

  const progress = Math.round((checked.size / CHECKLIST_ITEMS.length) * 100);

  return (
    <div class="sg-checklist">
      <div class="sg-checklist-header">
        <div class="sg-checklist-title">After-Stop Checklist</div>
        <div class="sg-checklist-subtitle">
          {violationCount > 0
            ? `${violationCount} potential violation${violationCount > 1 ? "s" : ""} detected — follow these steps carefully.`
            : "No violations detected, but complete these steps to protect yourself."}
        </div>
        <div class="sg-checklist-progress-bar">
          <div class="sg-checklist-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div class="sg-checklist-progress-text">{checked.size} of {CHECKLIST_ITEMS.length} complete ({progress}%)</div>
      </div>

      <div class="sg-checklist-items">
        {CHECKLIST_ITEMS.map((item) => (
          <div
            key={item.id}
            class={`sg-checklist-item ${checked.has(item.id) ? "checked" : ""}`}
            onClick={() => toggle(item.id)}
          >
            <div class={`sg-checklist-box ${checked.has(item.id) ? "checked" : ""}`}>
              {checked.has(item.id) ? "✓" : ""}
            </div>
            <div class="sg-checklist-icon">{item.icon}</div>
            <div class="sg-checklist-body">
              <div class="sg-checklist-item-label">{item.label}</div>
              <div class="sg-checklist-item-detail">{item.detail}</div>
            </div>
          </div>
        ))}
      </div>

      {violationCount > 0 && (
        <div class="sg-checklist-action-box">
          <div class="sg-checklist-action-title">Filing a Complaint in {stateName}</div>
          <div class="sg-checklist-action-text">
            You can file a complaint with the police department's internal affairs
            division or your jurisdiction's civilian oversight board. Keep your
            StopGuard recording, the incident report, and any citation as evidence.
          </div>
          <button
            class="sg-checklist-expand-btn"
            onClick={() => setShowComplaintInfo(!showComplaintInfo)}
          >
            {showComplaintInfo ? "Hide details" : "How to file a complaint"}
          </button>
          {showComplaintInfo && (
            <div class="sg-checklist-action-detail">
              <ol>
                <li>Call or visit the police department's internal affairs office.</li>
                <li>Ask for the complaint form and filing deadline for your jurisdiction.</li>
                <li>Bring your StopGuard recording, transcript, and incident report.</li>
                <li>Include officer name/badge, date, time, location, and witness info.</li>
                <li>Keep a copy of your filed complaint and any case number.</li>
                <li>Follow up if you don't hear back within 30-60 days.</li>
              </ol>
            </div>
          )}
        </div>
      )}

      <div class="sg-checklist-disclaimer">
        This checklist is for guidance only. Always consult a licensed attorney
        for advice specific to your situation.
      </div>
    </div>
  );
}
