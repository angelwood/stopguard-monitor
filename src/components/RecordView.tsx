import { useState, useRef, useEffect } from "preact/hooks";
import {
  TranscriptLine, RightsViolation, formatDuration, formatTimestamp, DEMO_SCENARIOS,
} from "../lib/rightsEngine";
import { LANGUAGES, getLanguageLabel } from "../lib/speechRecognition";
import { STATE_LAWS } from "../lib/stateLaws";
import { GPSCapture, LocationData } from "../lib/gpsCapture";
import { RecordingResult } from "../lib/audioRecorder";

interface RecordViewProps {
  recordingState: "idle" | "recording" | "stopped";
  transcript: TranscriptLine[];
  violations: RightsViolation[];
  durationSec: number;
  isDemo: boolean;
  selectedState: string;
  selectedLanguage: string;
  interimText: string;
  speechStatus: string;
  speechError: string | null;
  audioLevel: number;
  audioRecording: boolean;
  gpsStatus: "idle" | "capturing" | "captured" | "error";
  location: LocationData | null;
  onStart: () => void;
  onStop: () => void;
  onDemo: (key: string) => void;
  onFlag: () => void;
  onStateChange: (code: string) => void;
  onLanguageChange: (lang: string) => void;
  showSummary: boolean;
  onSaveIncident: (incident: unknown) => void;
  onDiscard: () => void;
  onShowChecklist: () => void;
  recordingResult: RecordingResult | null;
  tier?: string;
  cloudBackupActive?: boolean;
}

export function RecordView(props: RecordViewProps) {
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const gpsCapture = useRef(new GPSCapture());

  useEffect(() => {
    if (transcriptEndRef.current) {
      transcriptEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [props.transcript, props.interimText]);

  // Build audio level bars
  const levelBars = Array.from({ length: 12 }, (_, i) => {
    const threshold = (i + 1) / 12;
    return props.audioLevel >= threshold;
  });

  return (
    <div class="sg-record-active">
      {/* Timer + status row */}
      <div class="sg-timer-row">
        <div class="sg-live-badge">
          <span class="sg-live-dot" />
          {props.isDemo ? "DEMO" : props.audioRecording ? "REC" : "●"}
        </div>
        <div class="sg-timer">{formatDuration(props.durationSec)}</div>
        {!props.isDemo && (
          <div class={`sg-speech-status ${props.speechStatus}`}>
            {props.speechStatus === "listening" ? "🎙️ Listening" : props.speechStatus === "error" ? "⚠️" : "Idle"}
          </div>
        )}
      </div>

      {/* Audio level indicator */}
      {!props.isDemo && props.audioRecording && (
        <div class="sg-audio-level">
          <div class="sg-audio-level-bars">
            {levelBars.map((active, i) => (
              <div key={i} class={`sg-audio-bar ${active ? "active" : ""}`} />
            ))}
          </div>
          <span class="sg-audio-label">🔊 Audio recording</span>
        </div>
      )}

      {/* GPS indicator */}
      {!props.isDemo && (
        <div class={`sg-gps-row ${props.gpsStatus}`}>
          {props.gpsStatus === "capturing" && <><span class="sg-gps-spinner" /> Capturing location...</>}
          {props.gpsStatus === "captured" && props.location && <>📍 {gpsCapture.current.formatLocation(props.location)}</>}
          {props.gpsStatus === "error" && <>📍 Location unavailable (check permissions)</>}
        </div>
      )}

      {/* Speech error */}
      {props.speechError && !props.isDemo && (
        <div class="sg-speech-error">{props.speechError}</div>
      )}

      {/* Violations panel */}
      {props.violations.length > 0 && (
        <div class="sg-violations-panel">
          {props.violations.map((v) => (
            <div key={v.id} class={`sg-violation-alert ${v.severity}`}>
              <div class="sg-violation-header">
                <span class={`sg-violation-sev ${v.severity}`}>{v.severity}</span>
                <span class="sg-violation-title">{v.title}</span>
                <span class="sg-violation-time">{formatTimestamp(v.timestamp)}</span>
              </div>
              <div class="sg-violation-desc">{v.description}</div>
              <div class="sg-violation-legal">{v.legalBasis}</div>
              <div class="sg-violation-suggestion">{v.suggestion}</div>
            </div>
          ))}
        </div>
      )}

      {/* Transcript */}
      <div class="sg-transcript-section">
        <div class="sg-section-label">
          <span>Live Transcript</span>
          <span>{props.transcript.length} lines</span>
        </div>
        <div class="sg-transcript-feed">
          {props.transcript.length === 0 && !props.interimText ? (
            <div class="sg-transcript-empty">
              {props.isDemo
                ? "Demo playing... transcript will appear here."
                : props.speechStatus === "listening"
                ? "🎙️ Listening... speak clearly and your words will appear here."
                : "Waiting for speech..."}
            </div>
          ) : (
            <>
              {props.transcript.map((line) => (
                <div class="sg-transcript-line" key={line.id}>
                  <span class={`sg-transcript-speaker ${line.speaker}`}>
                    {line.speaker === "officer" ? "officer" : line.speaker === "driver" ? "driver" : "speech"}
                  </span>
                  <span class="sg-transcript-text">{line.text}</span>
                  <span class="sg-transcript-time">{formatTimestamp(line.timestamp)}</span>
                </div>
              ))}
              {props.interimText && (
                <div class="sg-transcript-line sg-interim">
                  <span class="sg-transcript-speaker unknown">...</span>
                  <span class="sg-transcript-text sg-interim-text">{props.interimText}</span>
                </div>
              )}
              <div ref={transcriptEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div class="sg-action-row">
        <button class="sg-action-btn flag" onClick={props.onFlag}>
          🚩 Flag
        </button>
        <button class="sg-action-btn stop" onClick={props.onStop}>
          ■ Stop
        </button>
      </div>

      {/* Cloud backup indicator (premium only) */}
      {props.cloudBackupActive && (
        <div class="sg-cloud-row">☁️ Auto-backing up to cloud</div>
      )}
      {props.tier !== "premium" && !props.isDemo && (
        <div class="sg-cloud-row sg-cloud-locked" onClick={() => {}}>
          🔒 Cloud backup is a Premium feature — your recordings stay on this device only
        </div>
      )}

      {/* Summary modal */}
      {props.showSummary && (
        <SummaryModal
          violations={props.violations}
          transcript={props.transcript}
          durationSec={props.durationSec}
          selectedState={props.selectedState}
          selectedLanguage={props.selectedLanguage}
          location={props.location}
          recordingResult={props.recordingResult}
          onSave={props.onSaveIncident}
          onDiscard={props.onDiscard}
          onChecklist={props.onShowChecklist}
        />
      )}
    </div>
  );
}

function SummaryModal({
  violations, transcript, durationSec, selectedState, selectedLanguage,
  location, recordingResult, onSave, onDiscard, onChecklist,
}: {
  violations: RightsViolation[];
  transcript: TranscriptLine[];
  durationSec: number;
  selectedState: string;
  selectedLanguage: string;
  location: LocationData | null;
  recordingResult: RecordingResult | null;
  onSave: (incident: unknown) => void;
  onDiscard: () => void;
  onChecklist: () => void;
}) {
  const critical = violations.filter((v) => v.severity === "critical");
  const warnings = violations.filter((v) => v.severity === "warning");
  const info = violations.filter((v) => v.severity === "info");
  const stateName = STATE_LAWS.find((s) => s.code === selectedState)?.name || selectedState;
  const gps = new GPSCapture();

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSave = () => {
    const incident = {
      id: `incident-${Date.now()}`,
      date: new Date().toISOString(),
      durationSec,
      violations,
      transcript,
      state: selectedState,
      language: selectedLanguage,
      location: location || undefined,
      audioUrl: recordingResult?.url || undefined,
      audioSize: recordingResult?.sizeBytes || undefined,
      outcome: violations.length === 0 ? "clean" : "flagged",
    };
    onSave(incident);
  };

  return (
    <div class="sg-modal-overlay" onClick={onDiscard}>
      <div class="sg-modal" onClick={(e) => e.stopPropagation()}>
        <div class="sg-modal-header">
          <div class="sg-modal-title">Recording Complete</div>
          <div class="sg-modal-subtitle">
            {formatDuration(durationSec)} • {transcript.length} transcript lines • {stateName}
          </div>
        </div>
        <div class="sg-modal-body">
          {/* Stats */}
          <div>
            <div class="sg-summary-stat">
              <span class="sg-summary-label">Critical violations</span>
              <span class={`sg-summary-value ${critical.length > 0 ? "critical" : "clean"}`}>
                {critical.length}
              </span>
            </div>
            <div class="sg-summary-stat">
              <span class="sg-summary-label">Warnings</span>
              <span class={`sg-summary-value ${warnings.length > 0 ? "warning" : "clean"}`}>
                {warnings.length}
              </span>
            </div>
            <div class="sg-summary-stat">
              <span class="sg-summary-label">Info alerts</span>
              <span class="sg-summary-value">{info.length}</span>
            </div>
            {recordingResult && (
              <div class="sg-summary-stat">
                <span class="sg-summary-label">Audio file</span>
                <span class="sg-summary-value clean">✓ {formatBytes(recordingResult.sizeBytes)}</span>
              </div>
            )}
            {location && (
              <div class="sg-summary-stat">
                <span class="sg-summary-label">Location</span>
                <span class="sg-summary-value" style={{ fontSize: "11px", fontFamily: "var(--sg-mono)" }}>
                  {gps.formatLocation(location)}
                </span>
              </div>
            )}
            <div class="sg-summary-stat">
              <span class="sg-summary-label">Cloud backup</span>
              <span class="sg-summary-value clean">✓ Saved</span>
            </div>
          </div>

          {/* Audio playback */}
          {recordingResult && (
            <div>
              <div class="sg-section-label">Audio Recording</div>
              <audio controls src={recordingResult.url} style={{ width: "100%" }} />
            </div>
          )}

          {/* Violations */}
          {violations.length > 0 && (
            <div>
              <div class="sg-section-label">Flagged Issues</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {violations.map((v) => (
                  <div key={v.id}>
                    <span class={`sg-incident-tag ${v.severity}`}>{v.severity}</span>{" "}
                    <span style={{ fontSize: "13px" }}>{v.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {violations.length === 0 && (
            <div style={{
              textAlign: "center", padding: "16px 0", color: "var(--sg-teal)",
              fontSize: "14px", fontWeight: 600,
            }}>
              ✓ No rights violations detected during this stop
            </div>
          )}
        </div>

        {/* Actions */}
        <div class="sg-modal-actions sg-modal-actions-3">
          <button class="sg-modal-btn secondary" onClick={onDiscard}>Discard</button>
          <button class="sg-modal-btn secondary" onClick={onChecklist}>📋 Checklist</button>
          <button class="sg-modal-btn primary" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>
  );
}
