/* AI Gym Coach service worker.
 * Handles two paths to fire timer notifications:
 *   1. Web Push (`push` event) — works when app is fully closed.
 *   2. Self-scheduled `setTimeout` driven by a `SCHEDULE` postMessage —
 *      fires while the SW is still alive (works for short timers ~1 min,
 *      best-effort on iOS where SWs are aggressively killed).
 */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let payload = { title: "Timer", body: "Time's up.", tag: "timer" };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch (_) { /* ignore */ }

  const opts = {
    body: payload.body,
    tag: payload.tag,
    renotify: true,
    silent: false,
    badge: "/icon-192.png",
    data: payload,
  };
  event.waitUntil(self.registration.showNotification(payload.title, opts));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of all) {
      if (c.focus) return c.focus();
    }
    if (self.clients.openWindow) return self.clients.openWindow("/");
  })());
});

// Pending in-SW timeouts (best-effort; SW may be killed before firing).
const _pending = new Map();

self.addEventListener("message", (event) => {
  const msg = event.data || {};
  if (msg.type === "SCHEDULE") {
    const { id, endTime, title, body, tag } = msg;
    const delay = Math.max(0, endTime - Date.now());
    if (_pending.has(id)) clearTimeout(_pending.get(id));
    const handle = setTimeout(() => {
      self.registration.showNotification(title || "Timer", {
        body: body || "Time's up.",
        tag: tag || id,
        renotify: true,
        silent: false,
        badge: "/icon-192.png",
      });
      _pending.delete(id);
    }, delay);
    _pending.set(id, handle);
  } else if (msg.type === "CANCEL") {
    const handle = _pending.get(msg.id);
    if (handle) {
      clearTimeout(handle);
      _pending.delete(msg.id);
    }
  }
});
