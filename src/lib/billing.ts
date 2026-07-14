// StopGuard billing system
// Uses Google Play Billing via Digital Goods API (TWA/Chrome Android)
// Falls back to RevenueCat web SDK (Stripe) for web/browser
// Falls back to local-only mode if neither is available

import { Tier } from "./tiers";
import { PREMIUM_PRODUCTS } from "./tiers";

export type BillingProvider = "play_billing" | "revenuecat" | "none";
export type SubscriptionStatus = "active" | "expired" | "never" | "unknown";

export interface PurchaseResult {
  success: boolean;
  productId?: string;
  error?: string;
  provider: BillingProvider;
}

export interface BillingState {
  provider: BillingProvider;
  tier: Tier;
  status: SubscriptionStatus;
  productId?: string;
  expiryDate?: string;
  isLoading: boolean;
}

type Listener = (state: BillingState) => void;

class BillingManager {
  private state: BillingState = {
    provider: "none",
    tier: "free",
    status: "never",
    isLoading: false,
  };
  private listeners: Set<Listener> = new Set();
  private initialized = false;

  // Digital Goods API types (Chrome on Android, TWA)
  private digitalGoodsService: any = null;
  private paymentRequestApi: any = null;

  // RevenueCat SDK (loaded dynamically for web)
  private revenueCat: any = null;

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  getState(): BillingState {
    return { ...this.state };
  }

  private setState(updates: Partial<BillingState>) {
    this.state = { ...this.state, ...updates };
    this.listeners.forEach((l) => l(this.state));
  }

  async init(): Promise<void> {
    if (this.initialized) return;
    this.initialized = true;

    this.setState({ isLoading: true });

    // Try Digital Goods API first (Play Store TWA / Chrome Android)
    if (await this.initDigitalGoods()) {
      this.setState({ provider: "play_billing", isLoading: false });
      await this.checkPlayBillingStatus();
      return;
    }

    // Try RevenueCat web SDK (Stripe backend)
    if (await this.initRevenueCat()) {
      this.setState({ provider: "revenuecat", isLoading: false });
      await this.checkRevenueCatStatus();
      return;
    }

    // No billing provider available — local-only mode
    this.setState({ provider: "none", isLoading: false });
  }

  // ─── Google Play Billing via Digital Goods API ───

  private async initDigitalGoods(): Promise<boolean> {
    try {
      if (!("getDigitalGoodsService" in window)) return false;
      this.digitalGoodsService = (window as any).getDigitalGoodsService("https://play.google.com/billing");
      if (!this.digitalGoodsService) return false;

      // Check if Payment Request API is also available (needed for purchases)
      if (!("PaymentRequest" in window)) return false;

      return true;
    } catch {
      return false;
    }
  }

  private async checkPlayBillingStatus(): Promise<void> {
    try {
      // Query existing purchases
      const existingPurchases = await this.digitalGoodsService.listPurchases();
      if (existingPurchases && existingPurchases.length > 0) {
        const latest = existingPurchases[0];
        const isValid = await this.verifyPlayBillingPurchase(latest);
        if (isValid) {
          this.setState({
            tier: "premium",
            status: "active",
            productId: latest.itemId,
            expiryDate: latest.expiryTime,
          });
        } else {
          this.setState({ tier: "free", status: "expired" });
        }
      }
    } catch {
      // No existing purchases
    }
  }

  private async verifyPlayBillingPurchase(purchase: any): Promise<boolean> {
    try {
      // Acknowledge the purchase (required by Play Billing)
      if (purchase.acknowledged === false) {
        await this.digitalGoodsService.acknowledge(purchase.purchaseToken, "receipt");
      }
      // Full verification should happen server-side with RTDN (Real-time Developer Notifications)
      // For now, check expiry
      if (purchase.expiryTime) {
        return new Date(purchase.expiryTime) > new Date();
      }
      return true;
    } catch {
      return false;
    }
  }

  async purchasePlayBilling(productId: string): Promise<PurchaseResult> {
    if (!this.digitalGoodsService) {
      return { success: false, error: "Play Billing not available", provider: "none" };
    }

    try {
      // Use PaymentRequest API to initiate the purchase
      const paymentMethodData = [
        {
          supportedMethods: "https://play.google.com/billing",
          data: { sku: productId },
        },
      ];
      const paymentDetails = {
        total: {
          label: "StopGuard Premium",
          amount: { currency: "USD", value: "0" }, // Actual price set in Play Console
        },
      };

      const request = new PaymentRequest(paymentMethodData as any, paymentDetails as any);
      const response = await request.show();

      // Verify the purchase
      const purchaseToken = response.details?.purchaseToken || response.details?.token;
      if (purchaseToken) {
        await this.digitalGoodsService.acknowledge(purchaseToken, "receipt");
      }

      await response.complete("success");

      this.setState({
        tier: "premium",
        status: "active",
        productId,
      });

      // Notify server
      await this.syncToServer("play_billing", productId, purchaseToken);

      return { success: true, productId, provider: "play_billing" };
    } catch (err: any) {
      if (err.name === "AbortError") {
        return { success: false, error: "Purchase cancelled", provider: "play_billing" };
      }
      return { success: false, error: err.message || "Purchase failed", provider: "play_billing" };
    }
  }

  // ─── RevenueCat (Web/Stripe fallback) ───

  private async initRevenueCat(): Promise<boolean> {
    try {
      // RevenueCat web SDK is loaded dynamically
      // In production, the RC_PUBLIC_API_KEY would be set via environment variable
      const apiKey = (window as any).STOPGUARD_RC_API_KEY;
      if (!apiKey) return false;

      // Dynamic import — will fail gracefully if SDK isn't installed
      const rcModule = await import("https://js.revenuecat.com/web/v1/index.js").catch(() => null);
      if (!rcModule) return false;

      this.revenueCat = rcModule;
      await this.revenueCat.initialize(apiKey);
      return true;
    } catch {
      return false;
    }
  }

  private async checkRevenueCatStatus(): Promise<void> {
    try {
      const customerInfo = await this.revenueCat.getCustomerInfo();
      if (customerInfo?.entitlements?.active?.["premium"]) {
        const entitlement = customerInfo.entitlements.active["premium"];
        this.setState({
          tier: "premium",
          status: "active",
          productId: entitlement.productIdentifier,
          expiryDate: entitlement.expirationDate,
        });
      }
    } catch {
      // Not logged in or no purchases
    }
  }

  async purchaseRevenueCat(productId: string): Promise<PurchaseResult> {
    if (!this.revenueCat) {
      return { success: false, error: "RevenueCat not initialized", provider: "none" };
    }

    try {
      const result = await this.revenueCat.purchaseProduct(productId);
      if (result?.customerInfo?.entitlements?.active?.["premium"]) {
        this.setState({
          tier: "premium",
          status: "active",
          productId,
        });
        return { success: true, productId, provider: "revenuecat" };
      }
      return { success: false, error: "Purchase did not complete", provider: "revenuecat" };
    } catch (err: any) {
      return { success: false, error: err.message || "Purchase failed", provider: "revenuecat" };
    }
  }

  // ─── Public API ───

  async purchase(productId: string): Promise<PurchaseResult> {
    this.setState({ isLoading: true });
    try {
      if (this.state.provider === "play_billing") {
        return await this.purchasePlayBilling(productId);
      } else if (this.state.provider === "revenuecat") {
        return await this.purchaseRevenueCat(productId);
      } else {
        return {
          success: false,
          error: "No billing provider available. Use StopGuard on Android (Play Store) to upgrade.",
          provider: "none",
        };
      }
    } finally {
      this.setState({ isLoading: false });
    }
  }

  async restorePurchases(): Promise<PurchaseResult> {
    this.setState({ isLoading: true });
    try {
      if (this.state.provider === "play_billing") {
        await this.checkPlayBillingStatus();
        if (this.state.tier === "premium") {
          return { success: true, provider: "play_billing" };
        }
        return { success: false, error: "No active purchases found", provider: "play_billing" };
      } else if (this.state.provider === "revenuecat") {
        await this.checkRevenueCatStatus();
        if (this.state.tier === "premium") {
          return { success: true, provider: "revenuecat" };
        }
        return { success: false, error: "No active subscriptions found", provider: "revenuecat" };
      }
      return { success: false, error: "No billing provider", provider: "none" };
    } finally {
      this.setState({ isLoading: false });
    }
  }

  // Sync purchase to our backend for cross-device verification
  private async syncToServer(provider: BillingProvider, productId: string, token: string): Promise<void> {
    try {
      const token_auth = localStorage.getItem("stopguard-token");
      if (!token_auth) return;

      await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updateSubscription",
          provider,
          productId,
          purchaseToken: token,
          authToken: token_auth,
        }),
      });
    } catch {
      // Non-critical — purchase is still valid locally
    }
  }

  // Server-side subscription check (called on login)
  async checkServerSubscription(authToken: string): Promise<void> {
    try {
      const res = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "getSubscription", authToken }),
      });
      const data = await res.json();
      if (data.tier === "premium") {
        this.setState({
          tier: "premium",
          status: "active",
          productId: data.productId,
          expiryDate: data.expiryDate,
        });
      }
    } catch {
      // Server check failed — use local state
    }
  }

  getAvailableProducts() {
    return PREMIUM_PRODUCTS;
  }
}

// Singleton
export const billing = new BillingManager();

// Augment global type for Digital Goods API
declare global {
  interface Window {
    getDigitalGoodsService?: (provider: string) => any;
    STOPGUARD_RC_API_KEY?: string;
  }
}
