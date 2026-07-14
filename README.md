# StopGuard — Deployable PWA

Traffic stop recording and rights analysis app. Records audio, transcribes in real-time, and flags potential rights violations based on state and federal law.

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Build the frontend
npm run build

# 3. Run locally (optional, for testing)
npm run dev
# → Opens at http://localhost:3000
```

## Deploy to Netlify (recommended)

### Option A: Connect to GitHub (auto-deploys on push)

1. Go to https://app.netlify.com → **Add new site** → **Import an existing project**
2. Select your GitHub repo: `angelwood/stopguard`
3. Netlify auto-detects settings from `netlify.toml`:
   - **Build command:** `node build.mjs`
   - **Publish directory:** `public`
   - **Functions directory:** `api`
4. Click **Deploy site**
5. Your app is live at `https://stopguard.netlify.app` (or similar)

Every time you push to GitHub, Netlify auto-deploys. No CLI, no manual steps.

### Option B: Netlify CLI

```bash
npm install -g netlify-cli
netlify login
netlify deploy --build
# For production:
netlify deploy --build --prod
```

### Option C: Drag and drop

1. Run `npm run build` locally
2. Go to https://app.netlify.com/drop
3. Drag the `public` folder onto the page
4. Done (note: this won't include the API functions — use Option A or B for full functionality)

## Deploy to Vercel (alternative)

```bash
npm install -g vercel
vercel
# Framework: Other
# Build command: npm run build
# Output directory: public
```

## Get the AAB for Google Play

Once your PWA is live at a public URL:

### Option A: PWABuilder (easiest)
1. Go to https://www.pwabuilder.com
2. Enter your deployed URL: `https://your-site.netlify.app`
3. Click "Package for Stores" → Android
4. Download the generated AAB
5. Upload to Google Play Console

### Option B: Bubblewrap CLI
```bash
npm install -g @bubblewrap/cli
bubblewrap init --manifest=https://your-site.netlify.app/manifest.json
bubblewrap build
# → produces app-release-bundle.aab
```

See `play-store/LAUNCH_GUIDE.md` for the full step-by-step Play Store submission guide.
See `play-store/BILLING_SETUP.md` for setting up Google Play Billing and RevenueCat.

## Project Structure

```
stopguard/
├── api/                    # Serverless API functions (Netlify/Vercel)
│   ├── account/index.ts    # Account register, login, sync, subscription, export, delete
│   ├── privacy/index.ts    # Privacy policy (HTML)
│   ├── terms/index.ts      # Terms of service (HTML)
│   └── manifest/index.ts   # PWA manifest
├── public/                 # Build output (served as static)
│   ├── bundle.js           # Compiled app
│   ├── index.html          # App shell
│   ├── sw.js               # Service worker
│   ├── manifest.json       # PWA manifest (static copy)
│   ├── icon-192.png        # App icon
│   ├── icon-512.png        # App icon
│   └── .well-known/
│       └── assetlinks.json # TWA Digital Asset Links
├── src/                    # Source code
│   ├── components/         # UI components (Preact TSX)
│   ├── lib/                # Business logic (billing, tiers, rights engine, etc.)
│   ├── main.tsx            # App entry point
│   ├── styles.css          # All styles
│   └── index.html          # HTML template
├── play-store/             # Play Store packaging
│   ├── LAUNCH_GUIDE.md     # Full Play Store submission guide
│   ├── BILLING_SETUP.md    # Google Play Billing + RevenueCat setup
│   ├── listing.md          # Store listing text
│   └── feature-graphic.svg # 1024x500 feature graphic
├── build.mjs               # Build script (esbuild)
├── dev-server.mjs          # Local dev server
├── netlify.toml            # Netlify configuration
├── twa-manifest.json       # Bubblewrap TWA config
├── package.json
└── vercel.json             # Vercel config (alternative host)
```

## Freemium Model

**Free tier:**
- Recording, transcription, rights analysis
- 5 incident limit
- Local storage only

**Premium ($2.99/mo or $24.99/yr):**
- Cloud backup — recordings survive even if phone is lost or destroyed
- Unlimited incident storage
- Multi-device sync
- Auto-backup on record (starts uploading immediately)
- Data export (JSON download)
- Custom retention periods (30/60/90 days)
- Priority support

Billing uses Google Play Billing (via Digital Goods API) on Android, with RevenueCat/Stripe as a web fallback. See `play-store/BILLING_SETUP.md`.

## Play Store Compliance

✅ Privacy Policy at `/api/privacy`
✅ Terms of Service at `/api/terms`
✅ PWA Manifest at `/manifest.json`
✅ Account creation and deletion in-app
✅ Data export (JSON download)
✅ No analytics, no tracking, no ads
✅ Encryption (TLS 1.2+, AES-256, scrypt passwords)
✅ GDPR/CCPA compliant data rights
✅ In-app purchase via Google Play Billing

## Important Notes

- The account API uses file-based JSON storage. For production with many users, replace with a real database (PostgreSQL, MongoDB, etc.)
- Audio recording requires HTTPS and microphone permission
- Speech recognition uses the browser's Web Speech API (Chrome/Safari)
- GPS requires location permission
- Recording laws vary by state — the app shows your state's consent law, but you are responsible for legal compliance

## License

(c) 2025 StopGuard. All rights reserved.
