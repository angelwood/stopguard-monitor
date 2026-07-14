// StopGuard tier definitions — what's free vs premium
// Premium value prop: "Your evidence survives" — cloud backup is the killer feature

export type Tier = "free" | "premium";

export interface TierLimits {
  maxIncidents: number;        // -1 = unlimited
  cloudBackup: boolean;         // recordings survive phone loss/destruction
  multiDeviceSync: boolean;     // access incidents from any device
  dataExport: boolean;          // JSON download of all data
  advancedAnalysis: boolean;    // cross-incident pattern detection
  autoBackupOnRecord: boolean;  // upload starts immediately, before stop ends
  prioritySupport: boolean;
  customRetentionDays: boolean; // configurable auto-delete (30/60/90 days)
}

export const FREE_TIER: TierLimits = {
  maxIncidents: 5,
  cloudBackup: false,
  multiDeviceSync: false,
  dataExport: false,
  advancedAnalysis: false,
  autoBackupOnRecord: false,
  prioritySupport: false,
  customRetentionDays: false,
};

export const PREMIUM_TIER: TierLimits = {
  maxIncidents: -1,
  cloudBackup: true,
  multiDeviceSync: true,
  dataExport: true,
  advancedAnalysis: true,
  autoBackupOnRecord: true,
  prioritySupport: true,
  customRetentionDays: true,
};

export const PREMIUM_PRODUCTS = {
  monthly: {
    id: "stopguard_premium_monthly",
    price: "$2.99",
    period: "month",
    description: "Cloud backup, unlimited storage, multi-device sync",
  },
  yearly: {
    id: "stopguard_premium_yearly",
    price: "$24.99",
    period: "year",
    description: "Everything in monthly — save 30%",
    savings: "Save 30%",
  },
} as const;

export function getTierLimits(tier: Tier): TierLimits {
  return tier === "premium" ? PREMIUM_TIER : FREE_TIER;
}

export function isFeatureAvailable(tier: Tier, feature: keyof TierLimits): boolean {
  return getTierLimits(tier)[feature];
}

export function canAddIncident(tier: Tier, currentCount: number): boolean {
  const limits = getTierLimits(tier);
  if (limits.maxIncidents === -1) return true;
  return currentCount < limits.maxIncidents;
}

// Human-readable feature list for paywall
export const PREMIUM_FEATURES = [
  { icon: "☁️", title: "Cloud Backup", desc: "Recordings survive even if your phone is lost, seized, or destroyed" },
  { icon: "∞", title: "Unlimited Incidents", desc: "No cap on stored traffic stop recordings" },
  { icon: "📱", title: "Multi-Device Sync", desc: "Access your incidents from any device, anywhere" },
  { icon: "⚡", title: "Auto-Backup on Record", desc: "Upload starts immediately — evidence is safe before the stop ends" },
  { icon: "📊", title: "Advanced Analysis", desc: "Cross-incident pattern detection and detailed rights reports" },
  { icon: "📤", title: "Data Export", desc: "Download all your data as JSON anytime" },
  { icon: "🗑️", title: "Custom Retention", desc: "Set auto-delete after 30, 60, or 90 days" },
  { icon: "🎧", title: "Priority Support", desc: "Fast response from the StopGuard team" },
] as const;
