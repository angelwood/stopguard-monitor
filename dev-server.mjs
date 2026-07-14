// Simple dev server for local testing
import { createServer } from "http";
import { readFileSync, existsSync } from "fs";
import { join, extname } from "path";

const ROOT = import.meta.dirname;
const PORT = process.env.PORT || 3000;

const MIME = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".manifest": "application/manifest+json",
};

const server = createServer((req, res) => {
  let path = req.url || "/";

  // Route API calls (simplified — for full API testing use Vercel)
  if (path.startsWith("/api/manifest")) {
    res.setHeader("Content-Type", "application/manifest+json");
    const manifest = {
      name: "StopGuard", short_name: "StopGuard",
      start_url: "/", display: "standalone",
      background_color: "#0a0a0f", theme_color: "#0d7377",
      icons: [{ src: "/icon-192.svg", sizes: "192x192", type: "image/svg+xml" }],
    };
    res.end(JSON.stringify(manifest));
    return;
  }

  // Serve from public/
  if (path === "/") path = "/index.html";
  const filePath = join(ROOT, "public", path);

  if (!existsSync(filePath)) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  const ext = extname(filePath);
  res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
  res.end(readFileSync(filePath));
});

server.listen(PORT, () => {
  console.log(`StopGuard dev server running at http://localhost:${PORT}`);
});
