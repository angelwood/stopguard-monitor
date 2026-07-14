# StopGuard — Play Store Testing Guide

## The Three Testing Tracks

| Track | Who | Review Time | Requirements |
|-------|-----|-------------|--------------|
| **Internal testing** | Up to 100 emails you whitelist | Fastest (hours) | None — just upload AAB |
| **Closed testing** | Email list or Google Group | 1-3 days | **20 testers must install & use for 14 consecutive days** (new accounts) |
| **Open testing** | Anyone on Google Play | 1-3 days | App must be in good shape — public visible |

## The Problem with Closed Testing

Google requires **20 testers** to:
1. Accept the opt-in link
2. Install the app from Play Store
3. Actually use it
4. Do this for **14 consecutive days**

If even one day passes where a tester doesn't open the app, the clock can reset. If testers don't accept the invite within a few days, you're stuck.

## The Strategy: Internal Testing First

**Don't jump to closed testing yet.** Use internal testing to make sure the app actually works on real devices first. Internal testing is instant — no 14-day wait, no 20-tester requirement.

### Step 1: Internal Testing (do this now)

1. In Play Console → **Internal Testing** → **Create release**
2. Upload your AAB
3. Under **Testers**, add your own email + a few friends
4. Copy the **opt-in link**
5. Open the link on your phone, install, and test everything:
   - Recording starts/stops correctly
   - Transcription works
   - Rights analysis triggers
   - Incident saves to log
   - Settings persist
   - Account login/register works
   - Paywall shows correctly
   - State switching updates rights reference
   - Demo scenarios play correctly

Fix any bugs you find. Re-upload. Test again. Do this until it's solid.

### Step 2: Closed Testing (once internal is clean)

This is the gate you have to pass. Here's how to make testers cooperate:

#### Use a Google Group (easiest for managing 20+ testers)

1. Go to https://groups.google.com → **Create group**
2. Name it "StopGuard Beta Testers"
3. Set group type to "Email list"
4. Add your 20+ testers' emails as members
5. In Play Console → **Closed Testing** → **Create release**
6. Under testers, select **Google Groups** and paste the group email
7. Google automatically emails all group members with the opt-in link

#### Getting testers to actually cooperate

The biggest issue is testers ignoring the invite. Here's how to fix it:

1. **Send a personal message** (not just Google's automated email) — use the template below
2. **Tell them exactly what to do** — step by step, no ambiguity
3. **Give them a reason** — "You get free Premium for life as a founding tester"
4. **Set a deadline** — "I need you to do this by Friday"
5. **Follow up** — message them individually if they haven't installed after 2 days
6. **Make it take 2 minutes** — "Install, open it once, hit record, stop, done. That's it."

#### Who to ask for 20 testers

- Family members with Android phones
- Friends / coworkers
- Facebook/Instagram story: "Need 20 people to beta test my app — takes 2 minutes, you get free Premium"
- Reddit r/Android, r/beta_testing, r/AlphaAndBeta
- Discord servers you're in
- Classmates if you're in school
- Local community groups (especially relevant for a civil rights app — reach out to local activist groups, NAACP chapters, community organizations)

#### The 14-day clock

- Starts when 20 testers have installed the app
- They need to open the app at least once during the 14-day period
- Google checks for "active" testers — opening the app counts
- You can check tester status in Play Console → **Closed Testing** → **Tester feedback**
- If you're short on testers, add more emails to the Google Group

### Step 3: Production

After 14 days with 20 active testers:
1. Go to **Production** → **Create release**
2. Upload the same AAB (or an updated one)
3. Write release notes
4. Submit for Google's review (1-7 days)
5. Once approved, StopGuard is live on the Play Store

---

## Tester Invitation Templates

### Personal message (text/DM/WhatsApp — most effective)

```
Hey! I'm launching my app StopGuard on Google Play — it records traffic stops and analyzes your rights in real-time. I need beta testers to get it approved.

It takes literally 2 minutes:
1. Tap this link: [PASTE OPT-IN LINK]
2. Tap "Become a tester"
3. Install StopGuard from Play Store
4. Open it, tap the record button, tap stop, done

As a founding tester you get Premium free for life. I need this done by [DAY]. Thanks for real 🙏
```

### Group message (Discord/Slack/group chat)

```
@everyone I need 20 people to beta test StopGuard (my traffic stop rights app) for Google Play approval. Takes 2 minutes:

1. Open this link on your phone: [OPT-IN LINK]
2. Tap "Become a tester"
3. Install from Play Store
4. Open it once and hit record then stop

You get free Premium for life as a thank you. Need this by [DAY]. Who's in?
```

### Social media post

```
🚨 I need 20 Android users to beta test my new app StopGuard — it records traffic stops and tells you if your rights are being violated in real-time. Google requires 20 testers before they'll approve it for the Play Store.

Takes 2 minutes:
1. Open this link: [OPT-IN LINK]
2. Tap "Become a tester"
3. Install StopGuard from Play Store
4. Open it, hit record, stop, done

Founding testers get free Premium for life. Drop a 🔥 if you're in and I'll send you the link.
```

### Email template

```
Subject: Beta test StopGuard — 2 minutes, free Premium for life

Hey [NAME],

I'm launching StopGuard on Google Play — an app that records traffic stops and gives real-time rights violation analysis based on your state's laws.

Google requires 20 beta testers before they'll approve the app, and I'd love for you to be one of them. It takes 2 minutes:

1. Open this link on your Android phone: [OPT-IN LINK]
2. Tap "Become a tester"
3. Install StopGuard from the Play Store
4. Open the app, tap the record button, tap stop — that's it

As a founding tester, you'll get StopGuard Premium free for life (cloud backup, unlimited storage, multi-device sync — normally $2.99/mo).

I need this done by [DAY]. Thanks for the help!

— Angel
```

### Follow-up message (for non-responders)

```
Hey, did you get a chance to test StopGuard? Google won't let me publish until 20 people install it. Takes 2 min — here's the link again: [OPT-IN LINK]
```

---

## What Testers Need to Do (bare minimum)

1. Open the opt-in link on their Android phone
2. Tap "Become a tester"
3. Install StopGuard from Play Store
4. Open the app at least once
5. (Optional but helpful) Try recording, check the Rights tab, browse settings

That's it. They don't need to write reviews, fill out surveys, or do anything formal. Google just needs to see that 20 real people installed and opened the app over 14 days.

---

## Testing Checklist (for you — what to verify before each track)

### Internal testing checklist:
- [ ] App installs without errors
- [ ] Opens to QuickStart screen
- [ ] Record button starts recording (microphone permission prompt)
- [ ] Live transcription appears as you speak
- [ ] Stop button ends recording and shows summary
- [ ] Save incident works — appears in Log tab
- [ ] Demo scenarios play correctly
- [ ] Rights tab shows correct state info
- [ ] State switching updates rights content
- [ ] Language switching works
- [ ] Settings tab loads
- [ ] Account registration works
- [ ] Account login works
- [ ] Paywall shows when tapping upgrade
- [ ] Cloud backup toggle is locked on free tier
- [ ] Incident limit warning shows at 5 incidents
- [ ] PIN lock setup works
- [ ] Delete all data works
- [ ] Privacy policy opens in modal
- [ ] Terms of service opens in modal
- [ ] App works in portrait orientation
- [ ] App survives being backgrounded during recording
- [ ] App works offline (after initial load)

### Closed testing checklist:
- [ ] Same as internal — but on more devices
- [ ] Test on Samsung devices
- [ ] Test on Pixel devices
- [ ] Test on older Android (version 8+)
- [ ] Test with slow internet
- [ ] Test with no internet (offline mode)
- [ ] Verify purchase flow if testing billing
