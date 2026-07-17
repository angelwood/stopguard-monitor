// StopGuard Terms of Service — Netlify serverless function
import type { Handler, HandlerEvent, HandlerContext, HandlerResponse } from "@netlify/functions";

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext): Promise<HandlerResponse> => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>StopGuard Terms of Service</title>
<style>
  body { font-family: -apple-system, system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; color: #1a1a2e; line-height: 1.7; background: #fafafa; }
  h1 { font-size: 28px; border-bottom: 3px solid #0d7377; padding-bottom: 10px; }
  h2 { font-size: 20px; color: #0d7377; margin-top: 32px; }
  p, li { font-size: 15px; }
  .callout { background: #e8f5f4; border-left: 4px solid #0d7377; padding: 16px; margin: 16px 0; border-radius: 4px; }
  .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 16px; margin: 16px 0; border-radius: 4px; }
  strong { color: #0d7377; }
  .meta { color: #666; font-size: 13px; }
</style>
</head>
<body>
<h1>StopGuard Terms of Service</h1>
<p class="meta">Last updated: July 11, 2025<br>Effective date: July 11, 2025</p>
<h2>1. Acceptance of Terms</h2>
<p>By creating an account or using StopGuard ("the Service"), you agree to these Terms of Service. If you do not agree, do not use the Service.</p>
<h2>2. Description of Service</h2>
<p>StopGuard is a mobile application that records audio during traffic stops, transcribes the interaction in real-time, and analyzes the transcript for potential rights violations based on state and federal law.</p>
<h2>3. Account Registration</h2>
<ul><li>You must provide a valid email address and create a password (minimum 8 characters).</li><li>You are responsible for maintaining the security of your account credentials.</li><li>You must be at least 13 years old to create an account.</li><li>One account per person. Sharing accounts is not permitted.</li></ul>
<h2>4. Account Deletion</h2>
<p>You may delete your account at any time from Settings > Account > Delete Account. Account deletion permanently removes all recordings, transcripts, location data, incident metadata, account info, email, and settings. Cannot be reversed or recovered.</p>
<h2>5. Acceptable Use</h2>
<ul><li>Use the Service only for documenting your own traffic stop interactions</li><li>Do not use the Service to record others without legal justification</li><li>Do not use the Service for illegal purposes</li><li>Do not attempt to access other users' accounts or data</li><li>Do not reverse engineer, decompile, or disassemble the app</li></ul>
<div class="warning"><strong>Important:</strong> Recording laws vary by state. StopGuard is designed for one-party consent recording. In all-party consent states, recording without all parties' knowledge may be illegal. You are responsible for complying with your local recording laws.</div>
<h2>6. Your Data and Privacy</h2>
<p>Your use of the Service is governed by our Privacy Policy. Key points: you own your recordings and data, we do not sell or share your data, you can export all your data at any time, you can delete your account and all data at any time, cloud backup is opt-in.</p>
<h2>7. Intellectual Property</h2>
<p>(c) 2025 StopGuard. All rights reserved. The StopGuard app, including its rights analysis engine, state law database, transcription system, and user interface, are the intellectual property of StopGuard.</p>
<h2>8. Disclaimer of Legal Advice</h2>
<div class="callout"><strong>StopGuard is not a lawyer.</strong> The rights analysis provided by StopGuard is for informational and educational purposes only. It does not constitute legal advice and does not create an attorney-client relationship. Always consult a licensed attorney for advice specific to your situation.</div>
<h2>9. Limitation of Liability</h2>
<p>StopGuard is provided "as is" without warranties of any kind. We are not liable for any failure of the recording system, inaccurate rights analysis, data loss, or legal outcomes resulting from use of the Service. You use the Service at your own risk.</p>
<h2>10. Service Changes</h2>
<p>We may update, modify, or discontinue the Service at any time. We will notify you of material changes.</p>
<h2>11. Termination</h2>
<p>We may suspend or terminate your account for violations of these Terms. You may terminate your account at any time by deleting it.</p>
<h2>12. Governing Law</h2>
<p>These Terms are governed by the laws of the State of Illinois, United States.</p>
<h2>13. Contact</h2>
<p>Questions about these Terms: legal@stopguard.app</p>
</body>
</html>`;
  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
    body: html,
  };
};
