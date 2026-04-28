/**
 * Push registration + scheduling helper.
 *
 * Tier 1: in-page Notification + chime (fires while app is foregrounded).
 * Tier 2: Service Worker self-scheduled notification (best-effort while SW alive).
 * Tier 3: Web Push from server via QStash delayed delivery (fires when app closed).
 *
 * VITE_VAPID_PUBLIC_KEY must be set for Tier 3 to work.
 */

const VAPID_PUBLIC = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";

let _swReg = null;
let _subPromise = null;

function urlBase64ToUint8Array(base64) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const base = (base64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return null;
  if (_swReg) return _swReg;
  try {
    _swReg = await navigator.serviceWorker.register("/sw.js");
    return _swReg;
  } catch (err) {
    console.warn("SW registration failed:", err);
    return null;
  }
}

export async function requestNotificationPermission() {
  if (!("Notification" in window)) return "denied";
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

export function notificationsEnabled() {
  return typeof Notification !== "undefined" && Notification.permission === "granted";
}

async function ensurePushSubscription() {
  if (!VAPID_PUBLIC) return null;
  const reg = await registerServiceWorker();
  if (!reg) return null;
  if (_subPromise) return _subPromise;
  _subPromise = (async () => {
    let sub = await reg.pushManager.getSubscription();
    if (!sub) {
      sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      });
    }
    try {
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
    } catch (err) {
      console.warn("Push subscription upload failed:", err.message);
    }
    return sub;
  })();
  return _subPromise;
}

/**
 * Schedule a timer notification.
 * Fires via SW self-timeout (Tier 2) immediately; also fires via remote push
 * (Tier 3) if VAPID is configured — both with same `id`/`tag` so iOS dedupes.
 */
export async function scheduleTimer({ id, endTime, title, body, tag }) {
  if (!notificationsEnabled()) return;
  const reg = await registerServiceWorker();
  if (!reg) return;

  // Tier 2: SW-driven timeout (works while SW alive)
  reg.active?.postMessage({ type: "SCHEDULE", id, endTime, title, body, tag });

  // Tier 3: server-scheduled push (works when app fully closed)
  if (VAPID_PUBLIC) {
    try {
      await ensurePushSubscription();
      await fetch("/api/push/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, endTime, title, body, tag }),
      });
    } catch (err) {
      console.warn("Push schedule failed:", err.message);
    }
  }
}

export async function cancelTimer(id) {
  const reg = await registerServiceWorker();
  reg?.active?.postMessage({ type: "CANCEL", id });
  if (VAPID_PUBLIC) {
    try {
      await fetch("/api/push/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    } catch { /* ignore */ }
  }
}
