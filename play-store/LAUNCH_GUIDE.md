# StopGuard — Play Store Launch Guide

Complete step-by-step guide to get StopGuard live on Google Play.

---

## PHASE 1: Deploy the PWA to Vercel

The PWA must be live at a public HTTPS URL before you can package it for the Play Store.

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Deploy from the stopguard-deploy directory
```bash
cd stopguard-deploy
vercel
```
Follow the prompts:
- **Framework:** Other
- **Build command:** `npm run build` (or leave blank if you pre-built)
- **Output directory:** `public`
- The `/api` folder is auto-detected as serverless functions

### 3. Set your production URL
```bash
vercel --prod
```
Your app is now live at `https://stopguard.vercel.app` (or whatever name Vercel assigns).

### 4. (Optional) Add a custom domain
If you have `stopguard.app` or another domain:
```bash
vercel domains add stopguard.app
```
Follow Vercel's DNS instructions, then update the `host` field in `twa-manifest.json`.

### 5. Verify the deployment
Check these URLs work:
- `https://YOUR-URL.vercel.app/` — the app loads
- `https://YOUR-URL.vercel.app/manifest.json` — PWA manifest
- `https://YOUR-URL.vercel.app/api/privacy` — privacy policy
- `https://YOUR-URL.vercel.app/api/terms` — terms of service
- `https://YOUR-URL.vercel.app/.well-known/assetlinks.json` — asset links
- `https://YOUR-URL.vercel.app/icon-192.png` — icon loads

### 6. Update all placeholder URLs
Replace `stopguard.app` with your actual Vercel URL in:
- `twa-manifest.json` — `host`, `iconUrl`, `maskableIconUrl`, `webManifestUrl`, `fullScopeUrl`, shortcut URLs
- `play-store/listing.md` — privacy policy and terms URLs
- `public/.well-known/assetlinks.json` — no change needed (uses package name, not URL)

---

## PHASE 2: Generate the AAB (Android App Bundle)

### Option A: PWABuilder (Easiest — No Android SDK needed)

1. Go to https://www.pwabuilder.com
2. Enter your deployed URL: `https://YOUR-URL.vercel.app`
3. Click **Analyze**
4. Fix any issues it flags (should be green if you deployed correctly)
5. Click **Package for Stores** → **Android**
6. Set:
   - **Package ID:** `app.stopguard.twa`
   - **App name:** StopGuard
   - **Signing key:** Create new or upload existing keystore
7. Download the generated `.aab` file

### Option B: Bubblewrap CLI (More control)

#### Prerequisites
- Node.js 18+
- Java JDK 17+
- Android SDK (Android Studio or command-line tools)

#### Steps
```bash
# Install Bubblewrap
npm install -g @bubblewrap/cli

# Initialize from your live manifest
bubblewrap init --manifest=https://YOUR-URL.vercel.app/manifest.json

# Answer prompts:
# - Package ID: app.stopguard.twa
# - App name: StopGuard
# - Use existing twa-manifest.json if prompted

# Build the AAB
bubblewrap build

# This produces: app-release-bundle.aab
```

#### Generate the Digital Asset Links file
```bash
bubblewrap assetlinks
```
This outputs the SHA256 fingerprint for your signing key. Update `public/.well-known/assetlinks.json` with this fingerprint, then redeploy to Vercel.

**This step is critical.** Without a valid assetlinks.json matching your signing key, the TWA will show the browser URL bar instead of running as a full-screen app.

---

## PHASE 3: Create a Google Play Console Account

1. Go to https://play.google.com/console
2. Sign in with a Google account
3. Pay the one-time **$25 registration fee**
4. Complete developer identity verification:
   - Name, address, phone number
   - Email contact (use support@stopguard.app or your real email)
   - Verify via phone and email
5. Wait for verification (usually 1-3 days, sometimes longer)

---

## PHASE 4: Create the App Listing

### 1. Create a new app
In Play Console:
- Click **Create app**
- App name: `StopGuard — Rights Monitor`
- Default language: English (United States)
- App type: **App** (not game)
- Pricing: **Free**

### 2. Store listing
Use the text from `play-store/listing.md`:
- App title, short description, full description
- Upload app icon (use `icon-512.png`, must be 512x512 PNG, 32-bit, no alpha)
- Upload feature graphic (1024x500 PNG — convert `play-store/feature-graphic.svg` to PNG)
- Add screenshots (minimum 2, recommended 3-8):
  - Phone screenshots: 1080x1920 or 16:9 aspect ratio
  - Take screenshots from the deployed app running on your phone or browser
  - Recommended screens to capture:
    1. Quick Start screen with the record button
    2. Active recording with live transcription
    3. Rights analysis alerts
    4. Know Your Rights tab with state cards
    5. Settings tab
    6. Incident log

### 3. App content questionnaire
Complete all required sections in Play Console:

#### Data safety form
Answer these exactly:

**Does your app collect or share any of the required user data types?**
→ Yes

**Data types collected:**
| Data Type | Category | Purpose | Shared | Encrypted in transit | Can user delete |
|-----------|----------|---------|-------|---------------------|-----------------|
| Audio recordings | Personal info | App functionality | No | Yes | Yes |
| Location (approximate) | Location | App functionality | No | Yes | Yes |
| Email addresses | Personal info | Account management | No | Yes | Yes |
| Other actions (recorded audio/transcripts) | App activity | App functionality | No | Yes | Yes |

**Is all user data encrypted in transit?**
→ Yes

**Is all user data encrypted at rest?**
→ Yes (AES-256)

**Can users request data deletion?**
→ Yes (in-app account deletion and individual incident deletion)

**Do you share data with third parties?**
→ No

**Do you use data for advertising?**
→ No

**Do you use data for analytics?**
→ No

#### Privacy policy
- URL: `https://YOUR-URL.vercel.app/api/privacy`

#### App permissions
Declare these permissions:
- `RECORD_AUDIO` — for recording traffic stops
- `ACCESS_FINE_LOCATION` — for GPS logging during stops
- `FOREGROUND_SERVICE` — for continuous recording
- `INTERNET` — for cloud backup (optional)
- `POST_NOTIFICATIONS` — for recording status notifications (Android 13+)

**Do NOT declare:**
- Camera (not used in current version)
- Contacts (never collected)
- SMS (no SOS feature)
- Biometrics (app lock uses device PIN/biometric prompt, no biometric data stored)

#### Content rating
- Fill out the IARC questionnaire
- No violence, no user-generated content visible to others, no online interactions
- Expected rating: **Everyone**

#### Target audience
- Target age group: **13 and older**
- The app is not directed at children under 13

#### Government apps
- This is not a government app → select "No"

#### Financial features
- No financial features → select "No"

#### Ads
- No ads → confirm

### 4. App access
- Make the app available without login for browsing rights reference
- Recording features require microphone permission (not account)
- Cloud backup requires account (optional feature)

---

## PHASE 5: Upload the AAB

### 1. Create a release
- Go to **Production** → **Create release**
- Or start with **Internal testing** → **Create release** (recommended for first upload)

### 2. Upload the AAB
- Upload the `.aab` file generated in Phase 2
- Release notes: "Initial release of StopGuard v1.0.0"

### 3. Review and roll out
- Review the release for any warnings
- Google reviews new apps (1-7 days typically)
- Once approved, your app is live on the Play Store

---

## PHASE 6: Post-Launch Checklist

- [ ] App is live and searchable on Google Play
- [ ] Privacy policy URL is accessible
- [ ] Terms of Service URL is accessible
- [ ] Assetlinks.json is served correctly (no browser bar in TWA)
- [ ] Recording works on a real device
- [ ] Transcription works in Chrome
- [ ] Cloud backup works with account login
- [ ] Data export works
- [ ] Account deletion works
- [ ] State switching updates rights reference
- [ ] Incident log persists between sessions

---

## PHASE 7: Publishing Future Updates

Once the app is live, any change to the PWA source needs to reach the Play Store too — the TWA wrapper just points at your live URL, but the Android package itself (version code, signing) has to be rebuilt and re-submitted.

1. Deploy the updated PWA (Phase 1) so the live URL reflects your changes.
2. Bump `appVersionName` and `appVersionCode` in `twa-manifest.json`.
3. Repackage it — regenerate the AAB the same way you did in Phase 2 (PWABuilder or `bubblewrap build`).
4. Publish it — upload the new AAB as a new release in Play Console (**Production** → **Create release**), add release notes, and submit for review.

---

## Quick Reference: File Locations

| What | Where |
|------|-------|
| Build output | `public/bundle.js` |
| PWA manifest | `public/manifest.json` |
| Service worker | `public/sw.js` |
| App icons | `public/icon-192.png`, `public/icon-512.png` |
| Asset links | `public/.well-known/assetlinks.json` |
| TWA config | `twa-manifest.json` |
| Store listing text | `play-store/listing.md` |
| Feature graphic | `play-store/feature-graphic.svg` |
| Privacy policy API | `api/privacy/index.ts` |
| Terms API | `api/terms/index.ts` |
| Account API | `api/account/index.ts` |
| Vercel config | `vercel.json` |

---

## Troubleshooting

### PWABuilder can't find the manifest
- Verify `https://YOUR-URL.vercel.app/manifest.json` returns JSON
- Check that `index.html` has `<link rel="manifest" href="/manifest.json">`

### TWA shows browser URL bar
- Your `assetlinks.json` SHA256 fingerprint doesn't match your signing key
- Run `bubblewrap assetlinks` to get the correct fingerprint
- Update `public/.well-known/assetlinks.json` and redeploy

### Google Play rejects the app
- Most common: incomplete data safety form
- Make sure every permission declared in the AAB is also declared in the data safety form
- Ensure privacy policy URL is live and accessible

### Microphone doesn't work in the TWA
- TWA runs in Chrome Custom Tabs, so microphone permissions are handled by the Android system
- The TWA should request RECORD_AUDIO permission — Bubblewrap handles this from the manifest
- If issues, verify `RECORD_AUDIO` is in the Android manifest (Bubblewrap generates this)

### Speech recognition doesn't work
- Web Speech API requires Chrome — it works in the TWA since it uses Chrome Custom Tabs
- On some Android devices, you may need Google app installed for speech services
- Test on a real device before launch
