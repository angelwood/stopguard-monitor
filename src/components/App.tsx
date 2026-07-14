import { useState, useRef, useEffect, useCallback } from "preact/hooks";
import { RecordView } from "./RecordView";
import { RightsReference } from "./RightsReference";
import { IncidentLog } from "./IncidentLog";
import { Settings } from "./Settings";
import { AfterStopChecklist } from "./AfterStopChecklist";
import { PinLock } from "./PinLock";
import { QuickStart } from "./QuickStart";
import { Paywall } from "./Paywall";
import {
  TranscriptLine, RightsViolation, analyzeTranscript, formatDuration,
  DEMO_SCENARIOS,
} from "../lib/rightsEngine";
import { SpeechTranscriber, RecognitionStatus } from "../lib/speechRecognition";
import { getStateLaw } from "../lib/stateLaws";
import { AudioRecorder, RecordingResult } from "../lib/audioRecorder";
import { GPSCapture, LocationData } from "../lib/gpsCapture";
import { AppSettings, loadSettings, saveSettings, clearAllData } from "../lib/settings";
import {
  getStoredToken, getStoredAccount, storeSession, clearSession, syncData,
  getStoredTier, setStoredTier, getSubscription,
  type AccountInfo,
} from "../lib/account";
import { billing, BillingState } from "../lib/billing";
import { Tier, getTierLimits, canAddIncident, PREMIUM_PRODUCTS } from "../lib/tiers";

type Tab = "record" | "rights" | "incidents" | "settings";
type RecordingState = "idle" | "recording" | "stopped";
type LockState = "unlocked" | "locked" | "setup-pin";

interface Incident {
  id: string;
  date: string;
  durationSec: number;
  violations: RightsViolation[];
  transcript: TranscriptLine[];
  state: string;
  language: string;
  outcome: string;
  location?: LocationData | null;
  audioUrl?: string;
  audioSize?: number;
}

export function App() {
  // --- Core state ---
  const [tab, setTab] = useState<Tab>("record");
  const [recordingState, setRecordingState] = useState<RecordingState>("idle");
  const [isDemo, setIsDemo] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const [violations, setViolations] = useState<RightsViolation[]>([]);
  const [durationSec, setDurationSec] = useState(0);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [showSummary, setShowSummary] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);

  // --- Settings ---
  const [settings, setSettings] = useState<AppSettings>(loadSettings());
  const [lockState, setLockState] = useState<LockState>("unlocked");

  // --- Account ---
  const [account, setAccount] = useState<AccountInfo | null>(null);

  // --- Billing / Tier ---
  const [tier, setTier] = useState<Tier>(getStoredTier());
  const [billingState, setBillingState] = useState<BillingState>(billing.getState());
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallTrigger, setPaywallTrigger] = useState<string>("");

  // --- Speech recognition state ---
  const [interimText, setInterimText] = useState("");
  const [speechStatus, setSpeechStatus] = useState<RecognitionStatus>("idle");
  const [speechError, setSpeechError] = useState<string | null>(null);

  // --- Audio recording state ---
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioRecording, setAudioRecording] = useState(false);
  const [recordingResult, setRecordingResult] = useState<RecordingResult | null>(null);

  // --- GPS state ---
  const [location, setLocation] = useState<LocationData | null>(null);
  const [gpsStatus, setGpsStatus] = useState<"idle" | "capturing" | "captured" | "error">("idle");

  // --- Refs ---
  const timerRef = useRef<number | null>(null);
  const demoTimeoutsRef = useRef<number[]>([]);
  const violationsRef = useRef<RightsViolation[]>([]);
  const transcriberRef = useRef<SpeechTranscriber | null>(null);
  const audioRecorderRef = useRef<AudioRecorder | null>(null);
  const durationRef = useRef(0);
  const locationRef = useRef<LocationData | null>(null);
  const settingsRef = useRef(settings);
  const accountRef = useRef(account);
  const incidentsRef = useRef(incidents);
  const tierRef = useRef(tier);
  durationRef.current = durationSec;
  violationsRef.current = violations;
  settingsRef.current = settings;
  accountRef.current = account;
  incidentsRef.current = incidents;
  tierRef.current = tier;

  // --- Init: load incidents, check lock state, check account, init billing ---
  useEffect(() => {
    try {
      const stored = localStorage.getItem("stopguard-incidents");
      if (stored) setIncidents(JSON.parse(stored));
    } catch { /* ignore */ }

    const s = loadSettings();
    setSettings(s);
    if (s.appLock && s.pin) {
      setLockState("locked");
    } else if (s.appLock && !s.pin) {
      setLockState("setup-pin");
    }

    // Check for existing account session
    const storedAccount = getStoredAccount();
    const storedToken = getStoredToken();
    if (storedAccount && storedToken) {
      setAccount(storedAccount);
      if (storedAccount.tier) {
        setTier(storedAccount.tier);
        setStoredTier(storedAccount.tier);
      }
    }

    // Initialize billing system
    const unsub = billing.subscribe(setBillingState);
    billing.init().then(async () => {
      // Check server-side subscription if logged in
      if (storedToken) {
        try {
          const sub = await getSubscription(storedToken);
          if (sub.tier === "premium") {
            setTier("premium");
            setStoredTier("premium");
          } else if (sub.tier === "free" && getStoredTier() === "premium") {
            // Subscription expired
            setTier("free");
            setStoredTier("free");
          }
        } catch { /* server check failed — use local state */ }
      }
      // Also check billing provider's local state
      const state = billing.getState();
      if (state.tier === "premium") {
        setTier("premium");
        setStoredTier("premium");
      }
    });

    return () => { unsub(); };
  }, []);

  // --- Cloud sync: when incidents or settings change and user is logged in + premium ---
  const syncToCloud = useCallback(() => {
    const token = getStoredToken();
    if (!token || !accountRef.current) return;
    const limits = getTierLimits(tierRef.current);
    if (!limits.cloudBackup) return; // Premium only
    if (!settingsRef.current.cloudBackup) return;
    syncData(token, incidentsRef.current, settingsRef.current as unknown as Record<string, unknown>)
      .catch(() => { /* silent fail — local data is primary */ });
  }, []);

  useEffect(() => {
    if (incidents.length > 0 && account) {
      syncToCloud();
    }
  }, [incidents, account, syncToCloud]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2800);
  };

  const saveIncidentsList = (list: Incident[]) => {
    setIncidents(list);
    try { localStorage.setItem("stopguard-incidents", JSON.stringify(list)); } catch { /* ignore */ }
  };

  // --- Timer for real recordings ---
  useEffect(() => {
    if (recordingState === "recording" && !isDemo) {
      timerRef.current = window.setInterval(() => {
        setDurationSec((d) => d + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    };
  }, [recordingState, isDemo]);

  // --- Rights analysis ---
  useEffect(() => {
    if (recordingState !== "recording") return;
    const stateLaw = getStateLaw(settings.selectedState);
    const newViolations = analyzeTranscript(
      transcript, durationSec, violationsRef.current, stateLaw
    );
    if (newViolations.length > 0) {
      setViolations((prev) => [...prev, ...newViolations]);
      const top = newViolations[0];
      const icon = top.severity === "critical" ? "🚨" : top.severity === "warning" ? "⚠️" : "ℹ️";
      showToast(`${icon} ${top.title}`);
    }
  }, [transcript, durationSec, recordingState, settings.selectedState]);

  // --- Start real recording ---
  const startRealRecording = useCallback(async () => {
    setRecordingState("recording");
    setIsDemo(false);
    setTranscript([]);
    setViolations([]);
    setDurationSec(0);
    setInterimText("");
    setSpeechError(null);
    setShowSummary(false);
    setShowChecklist(false);
    setLocation(null);
    setRecordingResult(null);
    setGpsStatus("capturing");

    const gps = new GPSCapture();
    if (gps.isSupported()) {
      gps.capture().then((loc) => {
        setLocation(loc);
        locationRef.current = loc;
        setGpsStatus("captured");
      }).catch(() => setGpsStatus("error"));
    } else {
      setGpsStatus("error");
    }

    const transcriber = new SpeechTranscriber(settings.selectedLanguage, {
      onInterim: (text) => setInterimText(text),
      onFinal: (text, confidence) => {
        setInterimText("");
        const ts = durationRef.current;
        const newLine: TranscriptLine = {
          id: `speech-${Date.now()}-${Math.random()}`,
          speaker: "unknown",
          text, timestamp: ts, confidence,
        };
        setTranscript((prev) => [...prev, newLine]);
      },
      onError: (error, message) => {
        setSpeechError(message);
        if (error === "permission-denied" || error === "no-mic") setSpeechStatus("error");
      },
      onStatusChange: (status) => setSpeechStatus(status),
    });
    transcriberRef.current = transcriber;
    transcriber.start();

    const recorder = new AudioRecorder({
      onStatusChange: (status) => setAudioRecording(status === "recording"),
      onLevel: (level) => setAudioLevel(level),
    });
    audioRecorderRef.current = recorder;
    try {
      await recorder.start();
    } catch {
      setSpeechError((prev) => prev || "Audio recording unavailable. Speech-to-text may still work.");
    }
  }, [settings.selectedLanguage]);

  const stopRecording = () => {
    setRecordingState("stopped");
    setShowSummary(true);
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (transcriberRef.current) { transcriberRef.current.stop(); transcriberRef.current = null; }
    if (audioRecorderRef.current) {
      const result = audioRecorderRef.current.stop();
      if (result) setRecordingResult(result);
      audioRecorderRef.current = null;
    }
    demoTimeoutsRef.current.forEach((t) => clearTimeout(t));
    demoTimeoutsRef.current = [];
    setInterimText("");
    setAudioLevel(0);
    setAudioRecording(false);
  };

  const startDemo = (scenarioKey: string) => {
    const scenario = DEMO_SCENARIOS?.[scenarioKey];
    if (!scenario) return;
    setRecordingState("recording");
    setIsDemo(true);
    setTranscript([]);
    setViolations([]);
    setDurationSec(0);
    setInterimText("");
    setShowSummary(false);
    setShowChecklist(false);
    setGpsStatus("idle");
    setLocation(null);

    let cumulativeDelay = 0;
    scenario.lines.forEach((line, idx) => {
      cumulativeDelay += line.delay * 400;
      const timeout = window.setTimeout(() => {
        const newLine: TranscriptLine = {
          id: `demo-${idx}-${Date.now()}`,
          speaker: line.speaker, text: line.text,
          timestamp: line.simulatedTimestamp,
        };
        setTranscript((prev) => [...prev, newLine]);
        setDurationSec(line.simulatedTimestamp);
      }, cumulativeDelay);
      demoTimeoutsRef.current.push(timeout);
    });
  };

  const flagMoment = () => {
    showToast(`🚩 Flagged at ${formatDuration(durationSec)}`);
  };

  const saveIncident = (incident: Incident) => {
    // Check free tier limit
    if (!canAddIncident(tier, incidents.length)) {
      setShowSummary(false);
      openPaywall("incident-limit");
      showToast("Free tier: 5 incidents max. Upgrade for unlimited.");
      return;
    }
    saveIncidentsList([incident, ...incidents]);
    setRecordingState("idle");
    setIsDemo(false);
    setShowSummary(false);
    setShowChecklist(false);
    setTranscript([]);
    setViolations([]);
    setDurationSec(0);
    setRecordingResult(null);
    showToast("✓ Saved to incident log");
  };

  const discardRecording = () => {
    if (transcriberRef.current) { transcriberRef.current.stop(); transcriberRef.current = null; }
    if (audioRecorderRef.current) { audioRecorderRef.current.destroy(); audioRecorderRef.current = null; }
    if (recordingResult) URL.revokeObjectURL(recordingResult.url);
    setRecordingState("idle");
    setIsDemo(false);
    setShowSummary(false);
    setShowChecklist(false);
    setTranscript([]);
    setViolations([]);
    setDurationSec(0);
    setInterimText("");
    setAudioLevel(0);
    setAudioRecording(false);
    setRecordingResult(null);
    setLocation(null);
    setGpsStatus("idle");
  };

  const deleteIncident = (id: string) => {
    saveIncidentsList(incidents.filter((i) => i.id !== id));
    showToast("Incident deleted");
  };

  // --- Paywall helpers ---
  const openPaywall = (trigger: string) => {
    setPaywallTrigger(trigger);
    setShowPaywall(true);
  };

  const handlePurchased = () => {
    setTier("premium");
    setStoredTier("premium");
    setShowPaywall(false);
    showToast("⭐ Premium unlocked. Your evidence now survives.");
  };

  // --- Settings handlers ---
  const handleStateChange = (code: string) => {
    const updated = { ...settings, selectedState: code };
    setSettings(updated);
    saveSettings(updated);
    showToast(`State: ${getStateLaw(code).name}`);
  };

  const handleLanguageChange = (lang: string) => {
    const updated = { ...settings, selectedLanguage: lang };
    setSettings(updated);
    saveSettings(updated);
    if (transcriberRef.current) transcriberRef.current.setLanguage(lang);
    showToast("Language updated");
  };

  const handleSettingChange = <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    // Gate premium settings
    if (key === "cloudBackup" && value === true && tier !== "premium") {
      openPaywall("cloud-backup-toggle");
      return;
    }
    if (key === "autoDeleteDays" && tier !== "premium") {
      openPaywall("custom-retention");
      return;
    }
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    saveSettings(updated);
  };

  const handlePinSetup = (pin: string) => {
    handleSettingChange("pin", pin);
    setLockState("unlocked");
    showToast("PIN lock enabled");
  };

  const handleUnlock = () => setLockState("unlocked");

  const handleDeleteAll = () => {
    clearAllData();
    setIncidents([]);
    setSettings(loadSettings());
    setLockState("unlocked");
    showToast("All data deleted");
  };

  // --- Account handlers ---
  const handleLogin = (acct: AccountInfo) => {
    setAccount(acct);
    if (acct.tier) {
      setTier(acct.tier);
      setStoredTier(acct.tier);
    }
    showToast(`Welcome, ${acct.name}`);
  };

  const handleLogout = () => {
    clearSession();
    setAccount(null);
    setTier("free");
    showToast("Signed out");
  };

  const handleDeleteAccount = () => {
    clearSession();
    setAccount(null);
    setTier("free");
    clearAllData();
    setIncidents([]);
    setSettings(loadSettings());
    showToast("Account and all data deleted");
  };

  const handleExportData = () => {
    if (tier !== "premium") {
      openPaywall("data-export");
      return;
    }
  };

  const violationCount = violations.length;
  const stateLaw = getStateLaw(settings.selectedState);
  const audioRecorderCheck = useRef(new AudioRecorder());
  const audioSupported = audioRecorderCheck.current.isSupported();
  const tierLimits = getTierLimits(tier);

  // --- PIN lock screen ---
  if (lockState === "locked") {
    return <PinLock expectedPin={settings.pin || ""} onUnlock={handleUnlock} isSetup={false} onSetupComplete={() => {}} />;
  }
  if (lockState === "setup-pin") {
    return <PinLock expectedPin="" onUnlock={() => {}} isSetup={true} onSetupComplete={handlePinSetup} />;
  }

  return (
    <div class="sg-app">
      <div class="sg-header">
        <div class="sg-header-row">
          <div>
            <div class="sg-logo">
              <span class="sg-logo-shield">🛡️</span>
              <span>StopGuard</span>
              {account && <span class="sg-header-account">· {account.name}</span>}
              {tier === "premium" && <span class="sg-premium-badge">⭐</span>}
            </div>
            <div class="sg-subtitle">{stateLaw.name} • Traffic Stop Rights</div>
          </div>
          <div class="sg-header-status">
            <span class={`sg-status-dot ${recordingState === "recording" ? "active" : ""}`} />
            <span>{recordingState === "recording" ? "REC" : "Ready"}</span>
          </div>
        </div>
      </div>

      <div class="sg-content">
        {tab === "record" && recordingState === "idle" && (
          <QuickStart
            selectedState={settings.selectedState}
            audioSupported={audioSupported}
            onStart={startRealRecording}
            onDemo={startDemo}
            onOpenSettings={() => setTab("settings")}
            onOpenRights={() => setTab("rights")}
          />
        )}
        {tab === "record" && recordingState !== "idle" && !showChecklist && (
          <RecordView
            recordingState={recordingState}
            transcript={transcript}
            violations={violations}
            durationSec={durationSec}
            isDemo={isDemo}
            selectedState={settings.selectedState}
            selectedLanguage={settings.selectedLanguage}
            interimText={interimText}
            speechStatus={speechStatus}
            speechError={speechError}
            audioLevel={audioLevel}
            audioRecording={audioRecording}
            gpsStatus={gpsStatus}
            location={location}
            onStart={startRealRecording}
            onStop={stopRecording}
            onDemo={startDemo}
            onFlag={flagMoment}
            onStateChange={handleStateChange}
            onLanguageChange={handleLanguageChange}
            showSummary={showSummary}
            onSaveIncident={saveIncident}
            onDiscard={discardRecording}
            onShowChecklist={() => setShowChecklist(true)}
            recordingResult={recordingResult}
            tier={tier}
            cloudBackupActive={tierLimits.cloudBackup && settings.cloudBackup && !!account}
          />
        )}
        {tab === "record" && showChecklist && (
          <AfterStopChecklist violationCount={violationCount} stateName={stateLaw.name} />
        )}
        {tab === "rights" && <RightsReference stateLaw={stateLaw} />}
        {tab === "incidents" && (
          <IncidentLog
            incidents={incidents}
            onDelete={deleteIncident}
            tier={tier}
            maxIncidents={tierLimits.maxIncidents}
            onUpgrade={() => openPaywall("incident-limit")}
          />
        )}
        {tab === "settings" && (
          <Settings
            selectedState={settings.selectedState}
            selectedLanguage={settings.selectedLanguage}
            onStateChange={handleStateChange}
            onLanguageChange={handleLanguageChange}
            settings={settings}
            onSettingChange={handleSettingChange}
            onDeleteAll={handleDeleteAll}
            account={account}
            onLogin={handleLogin}
            onLogout={handleLogout}
            onDeleteAccount={handleDeleteAccount}
            incidents={incidents}
            tier={tier}
            billingState={billingState}
            onUpgrade={() => openPaywall("settings")}
            onExportData={handleExportData}
          />
        )}
      </div>

      <div class="sg-tabbar">
        <button class={`sg-tab ${tab === "record" ? "active" : ""}`} onClick={() => { setTab("record"); setShowChecklist(false); }}>
          <span class="sg-tab-icon">⏺</span>
          <span>Record</span>
          {recordingState === "recording" && violationCount > 0 && (
            <span class="sg-tab-badge">{violationCount}</span>
          )}
        </button>
        <button class={`sg-tab ${tab === "rights" ? "active" : ""}`} onClick={() => setTab("rights")}>
          <span class="sg-tab-icon">⚖️</span>
          <span>Rights</span>
        </button>
        <button class={`sg-tab ${tab === "incidents" ? "active" : ""}`} onClick={() => setTab("incidents")}>
          <span class="sg-tab-icon">📋</span>
          <span>Log</span>
          {incidents.length > 0 && (
            <span class="sg-tab-badge" style={{ background: "var(--sg-blue)" }}>{incidents.length}</span>
          )}
          {tier === "free" && incidents.length >= tierLimits.maxIncidents && (
            <span class="sg-tab-dot" style={{ background: "var(--sg-gold)" }} />
          )}
        </button>
        <button class={`sg-tab ${tab === "settings" ? "active" : ""}`} onClick={() => setTab("settings")}>
          <span class="sg-tab-icon">⚙️</span>
          <span>Settings</span>
          {!account && <span class="sg-tab-dot" />}
        </button>
      </div>

      {showPaywall && (
        <Paywall
          open={showPaywall}
          onClose={() => setShowPaywall(false)}
          tier={tier}
          onPurchased={handlePurchased}
          trigger={paywallTrigger}
        />
      )}

      {toast && <div class="sg-toast">{toast}</div>}
    </div>
  );
}
