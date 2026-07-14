# StopGuard — Billing Setup Guide

How to configure Google Play Billing and RevenueCat for the StopGuard freemium model.

## Overview

StopGuard uses a **freemium** model:
- **Free:** Recording, transcription, rights analysis, 5 incident limit, local storage only
- **Premium ($2.99/mo or $24.99/yr):** Cloud backup, unlimited storage, multi-device sync, data export, auto-backup on record, custom retention, priority support

The app supports two billing paths:
1. **Google Play Billing** via the Digital Goods API (used when running as a TWA on Android)
2. **RevenueCat** web SDK via Stripe (fallback for browser/web — requires RevenueCat account)

Google Play requires Google Play Billing for digital goods sold through Android apps. The Digital Goods API lets a PWA/TWA access Play Billing from JavaScript.

---

## PHASE 1: Create Products in Google Play Console

### 1. Open your app in Play Console
Go to https://play.google.com/console → your app → **Monetize** → **Products** → **Subscriptions**

### 2. Create the monthly subscription
- **Product ID:** `stopguard_premium_monthly`
- **Name:** StopGuard Premium (Monthly)
- **Description:** Cloud backup, unlimited storage, multi-device sync
- **Base plan:** Auto-renewing monthly
- **Price:** $2.99 USD (set prices for other countries too)
- **Free trial:** Optional — consider 7-day free trial to boost conversions
- **Grace period:** 3 days (recommended)
- **Account hold:** Enable

### 3. Create the yearly subscription
- **Product ID:** `stopguard_premium_yearly`
- **Name:** StopGuard Premium (Yearly)
- **Description:** Everything in monthly — save 30%
- **Base plan:** Auto-renewing yearly
- **Price:** $24.99 USD
- **Free trial:** Optional — 7-day free trial
- **Grace period:** 7 days
- **Account hold:** Enable

### 4. Set up offers (optional but recommended)
- Add an **introductory price** for the yearly plan (e.g., $19.99 for the first year)
- This shows as a discounted price in the paywall

### 5. Link subscriptions to entitlements
In Play Console, under your subscription products, make sure both products grant the same entitlement ("Premium"). The app checks for entitlement, not specific product ID.

---

## PHASE 2: Set Up RevenueCat (for web/Stripe billing)

RevenueCat is only needed if you want to sell subscriptions through the web version of StopGuard (outside of Google Play). If you're only targeting the Play Store, you can skip this phase.

### 1. Create a RevenueCat account
Go to https://app.revenuecat.com → Sign up (free up to $10K MTR)

### 2. Create a project
- Project name: StopGuard
- Click **Create project**

### 3. Get your public API key
- Go to **Project Settings** → **API Keys**
- Copy the **Public API key** (starts with `appl_` or `rcb_`)
- This key goes in your app as `window.STOPGUARD_RC_API_KEY`

### 4. Configure Google Play in RevenueCat
- Go to **Integrations** → **Google Play**
- Enter your Google Play service account credentials
- RevenueCat will sync your subscription products automatically

### 5. Configure Stripe (for web billing)
- Go to **Integrations** → **Stripe**
- Connect your Stripe account
- Create products in Stripe matching your Play Store product IDs
- Map Stripe products to RevenueCat offerings

### 6. Create offerings
- Go to **Offerings** → Create offering "premium"
- Add two packages:
  - `monthly` → maps to `stopguard_premium_monthly`
  - `yearly` → maps to `stopguard_premium_yearly`
- Set the entitlement to "premium"

### 7. Set the public API key in your app
Add this to your `index.html` or set it via environment variable:
```html
<script>window.STOPGUARD_RC_API_KEY = "your_rc_public_api_key_here";</script>
```

Or better, inject it server-side in your API route that serves the HTML.

---

## PHASE 3: Configure the Digital Goods API

The Digital Goods API works automatically in Chrome on Android when your app is installed as a TWA. No additional configuration is needed in the code — the billing system detects it at runtime.

### Requirements for Digital Goods API to work:
1. The app must be running as a **Trusted Web Activity** (TWA) — not just a browser tab
2. The TWA must be **installed from Google Play** (not sideloaded)
3. Chrome must be version 101+ on the user's device
4. The `assetlinks.json` must be correctly deployed on your domain

### How it works in the code:
```typescript
// billing.ts checks for the Digital Goods API on init
if ("getDigitalGoodsService" in window) {
  // Use Google Play Billing
  digitalGoodsService = window.getDigitalGoodsService("https://play.google.com/billing");
}
```

When a user taps "Upgrade Now" in the paywall, the code:
1. Creates a `PaymentRequest` with the Play Billing payment method
2. Chrome shows the native Google Play purchase dialog
3. On success, the purchase is acknowledged
4. The subscription is synced to the StopGuard backend

---

## PHASE 4: Server-Side Purchase Verification

The StopGuard account API (`/api/account`) stores subscription status. For production, you should add server-side verification:

### Google Play RTDN (Real-Time Developer Notifications)
1. In Play Console, go to **Monetize** → **Setup** → **Notifications**
2. Set the RTDN endpoint to your server: `https://your-domain.vercel.app/api/play-webhook`
3. Create a Pub/Sub topic in Google Cloud Console
4. Google will notify your server when subscriptions start, renew, cancel, or expire
5. Your server updates the account's subscription status

### RevenueCat Webhooks
1. In RevenueCat, go to **Integrations** → **Webhooks**
2. Set the URL to: `https://your-domain.vercel.app/api/rc-webhook`
3. RevenueCat sends events for: initial purchase, renewal, cancellation, expiration
4. Your server updates the account's subscription status

### Current implementation
The current backend stores subscription status from the client-side purchase callback. This is sufficient for launch. For stronger security, add server-side verification before the next major release.

---

## PHASE 5: Test Purchases

### Testing Google Play Billing
1. In Play Console, go to **Setup** → **License Testing**
2. Add your tester email addresses
3. Install the app from **Internal Testing** track
4. Test purchases are free and don't charge real money
5. Test scenarios:
   - Buy monthly subscription
   - Buy yearly subscription
   - Cancel subscription → verify downgrade
   - Restore purchases after reinstall
   - Let subscription expire → verify downgrade

### Testing RevenueCat (web)
1. Use Stripe test mode (test API keys)
2. Use test card: `4242 4242 4242 4242`
3. Test the same scenarios as above

---

## PHASE 6: Play Store Data Safety Form Updates

Since you now collect payment data (indirectly through Google Play), update the data safety form:

### New data type to declare:
| Data Type | Category | Purpose | Shared | Encrypted | Deletable |
|-----------|----------|---------|-------|-----------|-----------|
| Purchase history | Financial | App functionality | No (Google handles) | Yes | Via Google Play |

### Note:
- StopGuard does NOT directly handle payment data
- Google Play handles all payment processing
- RevenueCat (if used for web) handles Stripe payments
- No credit card data touches StopGuard servers

---

## File Reference

| File | What it does |
|------|-------------|
| `src/lib/tiers.ts` | Free vs premium feature definitions, pricing |
| `src/lib/billing.ts` | Billing system (Digital Goods API + RevenueCat + fallback) |
| `src/components/Paywall.tsx` | Upgrade modal with pricing and purchase flow |
| `src/lib/account.ts` | Account client with subscription sync |
| `api/account/index.ts` | Backend — updateSubscription, getSubscription actions |
| `src/components/Settings.tsx` | Subscription management section |
| `src/components/App.tsx` | Feature gating, paywall triggers, billing init |

## Product IDs (must match exactly in Play Console and Stripe)

| Product | ID | Price |
|---------|----|-------|
| Monthly | `stopguard_premium_monthly` | $2.99/mo |
| Yearly | `stopguard_premium_yearly` | $24.99/yr |

## Pricing Logic

- Monthly: $2.99/month = $35.88/year
- Yearly: $24.99/year = save $10.89 (30%)
- Free tier: 5 incidents, local storage only, no cloud backup
- Premium tier: unlimited, cloud backup, multi-device sync, all features

The "your evidence survives" messaging is the core value prop. Cloud backup during a traffic stop is the feature people will pay for — their recording is safe even if the phone is confiscated, seized as evidence, or destroyed.
