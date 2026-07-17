// StopGuard Privacy Policy — Netlify serverless function
import type { Handler, HandlerEvent, HandlerContext, HandlerResponse } from "@netlify/functions";

export const handler: Handler = async (event: HandlerEvent, context: HandlerContext): Promise<HandlerResponse> => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>StopGuard Privacy Policy</title>
<style>
  body { font-family: -apple-system, system-ui, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; color: #1a1a2e; line-height: 1.7; background: #fafafa; }
  h1 { font-size: 28px; border-bottom: 3px solid #0d7377; padding-bottom: 10px; }
  h2 { font-size: 20px; color: #0d7377; margin-top: 32px; }
  h3 { font-size: 16px; margin-top: 24px; }
  p, li { font-size: 15px; }
  table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  th, td { padding: 10px 14px; text-align: left; border: 1px solid #e0e0e0; font-size: 14px; }
  th { background: #0d7377; color: #fff; }
  tr:nth-child(even) { background: #f5f5f5; }
  .callout { background: #e8f5f4; border-left: 4px solid #0d7377; padding: 16px; margin: 16px 0; border-radius: 4px; }
  strong { color: #0d7377; }
  .meta { color: #666; font-size: 13px; }
</style>
</head>
<body>
<h1>StopGuard Privacy Policy</h1>
<p class="meta">Last updated: July 11, 2025<br>Effective date: July 11, 2025</p>
<div class="callout"><strong>Your privacy is our core mission.</strong> StopGuard was built to protect your rights during traffic stops. We apply the same principle to your data: we collect the minimum needed, encrypt it, and give you full control to delete it.</div>
<h2>1. Information We Collect</h2>
<h3>1.1 Data You Provide</h3>
<table>
<tr><th>Data Type</th><th>What It Includes</th><th>When Collected</th></tr>
<tr><td>Account Information</td><td>Email address, display name</td><td>When you create an account</td></tr>
<tr><td>Audio Recordings</td><td>Audio of your traffic stop interaction</td><td>When you press record during a stop</td></tr>
<tr><td>Transcripts</td><td>Text transcription of your recording</td><td>Automatically generated during recording</td></tr>
<tr><td>Location Data</td><td>GPS coordinates (latitude, longitude, accuracy)</td><td>Captured at the start of each recording</td></tr>
<tr><td>Incident Metadata</td><td>Date, duration, state, detected violations, flagged moments</td><td>Generated during and after each stop</td></tr>
<tr><td>App Settings</td><td>Selected state, language, security preferences, auto-delete settings</td><td>When you configure the app</td></tr>
</table>
<h3>1.2 Data We Do NOT Collect</h3>
<table>
<tr><th>Category</th><th>Status</th></tr>
<tr><td>Biometric data</td><td>Not collected</td></tr>
<tr><td>Advertising identifiers (GAID/IDFA)</td><td>Not collected</td></tr>
<tr><td>Browsing history</td><td>Not collected</td></tr>
<tr><td>Contacts</td><td>Not collected</td></tr>
<tr><td>Photos and videos (non-recording)</td><td>Not collected</td></tr>
<tr><td>Analytics/telemetry</td><td>Not collected</td></tr>
<tr><td>SMS or call logs</td><td>Not collected</td></tr>
</table>
<h2>2. How We Use Your Information</h2>
<table>
<tr><th>Purpose</th><th>Data Used</th><th>Legal Basis (GDPR)</th></tr>
<tr><td>App functionality (recording, transcription, rights analysis)</td><td>Audio, transcripts, location, incident metadata</td><td>Contract performance (Art. 6(1)(b))</td></tr>
<tr><td>Cloud backup and sync across devices</td><td>All incident data, account info</td><td>Contract performance (Art. 6(1)(b))</td></tr>
<tr><td>Account management and authentication</td><td>Email, password (hashed), name</td><td>Contract performance (Art. 6(1)(b))</td></tr>
<tr><td>Legal evidence preservation</td><td>Audio recordings, transcripts, location, timestamps</td><td>Legitimate interest (Art. 6(1)(f))</td></tr>
</table>
<p>We do <strong>not</strong> use your data for: advertising or marketing, profiling or behavioral tracking, selling or sharing data with third parties, training AI or machine learning models, law enforcement sharing (unless compelled by valid court order).</p>
<h2>3. How Your Data Is Stored and Protected</h2>
<h3>3.1 Storage</h3>
<ul><li><strong>Local storage:</strong> Recordings are stored on your device first. They work offline.</li><li><strong>Cloud backup (opt-in):</strong> When enabled, encrypted copies are synced to your account on our servers.</li><li><strong>No third-party servers:</strong> Your data never touches advertising networks, analytics providers, or data brokers.</li></ul>
<h3>3.2 Encryption</h3>
<ul><li><strong>In transit:</strong> TLS 1.2+ encryption for all data transmission</li><li><strong>At rest:</strong> AES-256 encryption for stored data</li><li><strong>Passwords:</strong> Hashed using scrypt with random salt (never stored in plaintext)</li><li><strong>Session tokens:</strong> 256-bit cryptographically random, expire after 30 days</li></ul>
<h3>3.3 Retention</h3>
<table>
<tr><th>Data Type</th><th>Default Retention</th><th>User Control</th></tr>
<tr><td>Audio recordings (local)</td><td>Until manually deleted or auto-delete triggers</td><td>Auto-delete after 30/60/90 days (configurable)</td></tr>
<tr><td>Audio recordings (cloud)</td><td>Until account deletion or manual deletion</td><td>Delete anytime from app</td></tr>
<tr><td>Account information</td><td>Until account deletion</td><td>Delete account anytime</td></tr>
<tr><td>Session data</td><td>30 days from login</td><td>Automatic expiry</td></tr>
</table>
<h2>4. Your Rights</h2>
<table>
<tr><th>Right</th><th>Description</th><th>How to Exercise</th></tr>
<tr><td>Access</td><td>View all data we hold about you</td><td>Settings > Account > Export My Data</td></tr>
<tr><td>Portability</td><td>Download all your data in JSON format</td><td>Settings > Account > Export My Data</td></tr>
<tr><td>Deletion</td><td>Delete individual recordings or your entire account</td><td>Settings > Data Management, or Account > Delete Account</td></tr>
<tr><td>Rectification</td><td>Correct your account information</td><td>Settings > Account > Edit Profile</td></tr>
<tr><td>Opt-out</td><td>Disable cloud backup, keep all data local-only</td><td>Settings > Recording > Cloud Auto-Backup toggle</td></tr>
<tr><td>Withdraw Consent</td><td>Stop all data collection and processing</td><td>Delete account (permanently removes all data)</td></tr>
</table>
<h3>4.1 Account Deletion</h3>
<p>When you delete your account: All audio recordings, transcripts, location data, incident metadata, account info, email, and settings are permanently deleted. All active sessions are invalidated. Deletion is immediate and cannot be undone.</p>
<h2>5. Data Sharing</h2>
<p><strong>We do not sell, rent, or share your data with any third party.</strong> The only exceptions: valid court order (we will narrow the scope and notify you unless legally prohibited), or your explicit consent to share a recording with an attorney.</p>
<h2>6. Children's Privacy</h2>
<p>StopGuard is designed for licensed drivers aged 13 and older. We do not knowingly collect data from children under 13.</p>
<h2>7. International Users (GDPR / CCPA)</h2>
<h3>GDPR (European Economic Area)</h3>
<p>You have the rights listed in Section 4, plus: right to object to processing (Art. 21), right to restrict processing (Art. 18), right to lodge a complaint with your supervisory authority.</p>
<h3>CCPA (California)</h3>
<p>Right to know what personal information is collected, right to delete, right to opt-out of sale (we do not sell data), right to non-discrimination.</p>
<h2>8. Third-Party Services</h2>
<p>StopGuard does not integrate with any third-party analytics, advertising, or tracking services.</p>
<h2>9. Changes to This Policy</h2>
<p>We will notify you of material changes through the app.</p>
<h2>10. Contact</h2>
<p>For privacy questions or data requests: privacy@stopguard.app</p>
</body>
</html>`;
  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
    body: html,
  };
};
