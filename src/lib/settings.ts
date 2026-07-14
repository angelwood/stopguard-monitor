// StopGuard Settings Manager
// Persists all app settings to localStorage and provides a clean API.

export interface AppSettings {
  cloudBackup: boolean;
  autoDelete: boolean;
  autoDeleteDays: number;
  appLock: boolean;
  pin: string | null;
  selectedState: string;
  selectedLanguage: string;
}

const STORAGE_KEY = "stopguard-settings";

const DEFAULTS: AppSettings = {
  cloudBackup: true,
  autoDelete: false,
  autoDeleteDays: 60,
  appLock: false,
  pin: null,
  selectedState: "IL",
  selectedLanguage: "en-US",
};

export function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULTS, ...JSON.parse(stored) };
    }
  } catch { /* ignore */ }
  return { ...DEFAULTS };
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch { /* ignore */ }
}

export function updateSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
): AppSettings {
  const current = loadSettings();
  const updated = { ...current, [key]: value };
  saveSettings(updated);
  return updated;
}

export function clearAllData(): void {
  try {
    localStorage.removeItem("stopguard-incidents");
    localStorage.removeItem("stopguard-settings");
    localStorage.removeItem("stopguard-state");
    localStorage.removeItem("stopguard-language");
  } catch { /* ignore */ }
}
