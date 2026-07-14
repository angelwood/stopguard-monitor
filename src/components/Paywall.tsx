import { useState } from "preact/hooks";
import { billing, BillingProvider, PurchaseResult } from "../lib/billing";
import { PREMIUM_PRODUCTS, PREMIUM_FEATURES, Tier } from "../lib/tiers";

interface PaywallProps {
  open: boolean;
  onClose: () => void;
  tier: Tier;
  onPurchased: () => void;
  trigger?: string; // what triggered the paywall (for analytics)
}

export function Paywall({ open, onClose, tier, onPurchased, trigger }: PaywallProps) {
  const [selectedPlan, setSelectedPlan] = useState<"monthly" | "yearly">("yearly");
  const [purchasing, setPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PurchaseResult | null>(null);

  if (!open) return null;
  if (tier === "premium") {
    return (
      <div class="sg-modal-overlay" onClick={onClose}>
        <div class="sg-modal sg-paywall-modal" onClick={(e) => e.stopPropagation()}>
          <div class="sg-paywall-already-premium">
            <div class="sg-paywall-check">✓</div>
            <div class="sg-paywall-already-title">You're already Premium</div>
            <div class="sg-paywall-already-sub">All premium features are unlocked. Thank you for supporting StopGuard.</div>
            <button class="sg-modal-btn primary" onClick={onClose} style={{ marginTop: "20px" }}>Close</button>
          </div>
        </div>
      </div>
    );
  }

  const provider = billing.getState().provider;
  const providerLabel = provider === "play_billing" ? "Google Play" : provider === "revenuecat" ? "Stripe" : "Unavailable";

  const handlePurchase = async () => {
    setPurchasing(true);
    setError(null);
    const productId = selectedPlan === "monthly"
      ? PREMIUM_PRODUCTS.monthly.id
      : PREMIUM_PRODUCTS.yearly.id;
    const result = await billing.purchase(productId);
    setResult(result);
    setPurchasing(false);
    if (result.success) {
      onPurchased();
    } else {
      setError(result.error || "Purchase failed");
    }
  };

  const handleRestore = async () => {
    setPurchasing(true);
    setError(null);
    const result = await billing.restorePurchases();
    setPurchasing(false);
    if (result.success) {
      onPurchased();
    } else {
      setError(result.error || "No active purchases found");
    }
  };

  return (
    <div class="sg-modal-overlay" onClick={onClose}>
      <div class="sg-modal sg-paywall-modal" onClick={(e) => e.stopPropagation()}>
        <div class="sg-paywall-header">
          <button class="sg-modal-close" onClick={onClose}>✕</button>
          <div class="sg-paywall-badge">⭐ PREMIUM</div>
          <div class="sg-paywall-title">Your evidence survives.</div>
          <div class="sg-paywall-subtitle">
            Cloud backup, unlimited storage, and multi-device sync.
            So your recordings are safe even if your phone isn't.
          </div>
        </div>

        <div class="sg-paywall-features">
          {PREMIUM_FEATURES.map((f) => (
            <div class="sg-paywall-feature" key={f.title}>
              <span class="sg-paywall-feature-icon">{f.icon}</span>
              <div class="sg-paywall-feature-body">
                <div class="sg-paywall-feature-title">{f.title}</div>
                <div class="sg-paywall-feature-desc">{f.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div class="sg-paywall-plans">
          <button
            class={`sg-paywall-plan ${selectedPlan === "monthly" ? "selected" : ""}`}
            onClick={() => setSelectedPlan("monthly")}
          >
            <div class="sg-paywall-plan-price">{PREMIUM_PRODUCTS.monthly.price}</div>
            <div class="sg-paywall-plan-period">per {PREMIUM_PRODUCTS.monthly.period}</div>
            <div class="sg-paywall-plan-desc">{PREMIUM_PRODUCTS.monthly.description}</div>
          </button>
          <button
            class={`sg-paywall-plan ${selectedPlan === "yearly" ? "selected" : ""}`}
            onClick={() => setSelectedPlan("yearly")}
          >
            <div class="sg-paywall-plan-price">{PREMIUM_PRODUCTS.yearly.price}</div>
            <div class="sg-paywall-plan-period">per {PREMIUM_PRODUCTS.yearly.period}</div>
            <div class="sg-paywall-plan-savings">{PREMIUM_PRODUCTS.yearly.savings}</div>
            <div class="sg-paywall-plan-desc">{PREMIUM_PRODUCTS.yearly.description}</div>
          </button>
        </div>

        {error && (
          <div class="sg-paywall-error">{error}</div>
        )}

        {provider === "none" && (
          <div class="sg-paywall-provider-warning">
            In-app purchase is only available in the Android app from Google Play.
            Visit the Play Store to upgrade.
          </div>
        )}

        <div class="sg-paywall-actions">
          <button
            class="sg-modal-btn primary sg-paywall-buy-btn"
            disabled={purchasing || provider === "none"}
            onClick={handlePurchase}
          >
            {purchasing ? "Processing..." : `Upgrade — ${selectedPlan === "monthly" ? PREMIUM_PRODUCTS.monthly.price + "/mo" : PREMIUM_PRODUCTS.yearly.price + "/yr"}`}
          </button>
          <button
            class="sg-paywall-restore"
            onClick={handleRestore}
            disabled={purchasing}
          >
            Restore purchases
          </button>
        </div>

        <div class="sg-paywall-footer">
          <span>Billed via {providerLabel}</span>
          <span>· Cancel anytime</span>
          <span>· No ads, no tracking</span>
        </div>
      </div>
    </div>
  );
}
