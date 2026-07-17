const CACHE_NAME = "stopguard-v2";
const STATIC_ASSETS = ["/", "/index.html", "/bundle.js", "/manifest.json", "/styles.css"];

// Install: cache static shell
self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {
        // If some assets fail (e.g. styles.css doesn't exist), continue anyway
        return cache.addAll(STATIC_ASSETS.filter(() => true));
      }).catch(() => {});
    })
  );
});

// Activate: clean up old caches
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: strategy routing
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);

  // Never cache: API routes (account, billing, sync, etc.)
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/.netlify/functions/")) {
    e.respondWith(
      fetch(e.request).catch(() => {
        // Return a meaningful offline response for API calls
        return new Response(
          JSON.stringify({ error: "You are offline. Please reconnect to use account features." }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        );
      })
    );
    return;
  }

  // Static assets: cache-first, with network fallback
  if (e.request.method === "GET") {
    e.respondWith(
      caches.match(e.request).then((cached) => {
        if (cached) return cached;
        return fetch(e.request).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then((c) => c.put(e.request, clone)).catch(() => {});
          }
          return res;
        }).catch(() => {
          // Fallback to offline page for navigation requests
          if (e.request.mode === "navigate") {
            return caches.match("/index.html");
          }
          return new Response("Offline", { status: 503 });
        });
      })
    );
    return;
  }
});

// Push notifications (placeholder for future feature)
self.addEventListener("push", (e) => {
  if (!e.data) return;
  const data = e.data.json();
  e.waitUntil(
    self.registration.showNotification(data.title || "StopGuard", {
      body: data.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: data.url || "/",
    })
  );
});

// Notification click handler
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = e.notification.data || "/";
  e.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});
