export default function handler(_req: any, res: any) {
  const manifest = {
    id: "/?source=pwa",
    name: "StopGuard — Traffic Stop Rights Monitor",
    short_name: "StopGuard",
    description: "Record traffic stops, transcribe in real-time, and get instant rights violation analysis based on your state's laws.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait-primary",
    background_color: "#0a0a0f",
    theme_color: "#0d7377",
    lang: "en-US",
    dir: "ltr",
    categories: ["legal", "utilities", "lifestyle"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    screenshots: [
      { src: "/screenshots/record.png", sizes: "1080x1920", type: "image/png", form_factor: "narrow", label: "Recording a traffic stop with live transcription" },
      { src: "/screenshots/rights.png", sizes: "1080x1920", type: "image/png", form_factor: "narrow", label: "Know your rights — state and federal law reference" },
      { src: "/screenshots/log.png", sizes: "1080x1920", type: "image/png", form_factor: "narrow", label: "Incident log with violation analysis" },
    ],
    shortcuts: [
      { name: "Start Recording", short_name: "Record", description: "Start recording a traffic stop", url: "/?action=record", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
      { name: "Know Your Rights", short_name: "Rights", description: "View your rights by state", url: "/?tab=rights", icons: [{ src: "/icon-192.png", sizes: "192x192" }] },
    ],
    file_handlers: [
      { action: "/?action=play", accept: { "audio/*": [".mp3", ".wav", ".m4a", ".ogg", ".aac"] }, icons: [{ src: "/icon-192.png", sizes: "192x192" }], launch_type: "single-client" },
    ],
    share_target: {
      action: "/?action=share",
      method: "POST",
      enctype: "multipart/form-data",
      params: { title: "title", text: "text", url: "url" },
    },
  };
  res.setHeader("Content-Type", "application/manifest+json");
  res.status(200).json(manifest);
}
