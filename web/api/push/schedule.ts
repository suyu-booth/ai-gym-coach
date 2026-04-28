/**
 * POST /api/push/schedule
 *
 * Forwards a delayed push request to Upstash QStash, which calls back
 * `/api/push/fire` at endTime. Requires QSTASH_TOKEN env var.
 *
 * Body: { id, endTime, title, body, tag }
 * Returns: { ok: true } or { skipped: true } if QStash is not configured.
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = process.env.QSTASH_TOKEN;
  if (!token) {
    // Push backend not configured — Tier 2 (SW timeout) and Tier 1 (in-app) still work.
    return res.json({ skipped: true, reason: "QSTASH_TOKEN not configured" });
  }

  try {
    const { id, endTime, title, body, tag } = req.body || {};
    if (!id || !endTime) {
      return res.status(400).json({ error: "Missing id or endTime" });
    }

    const delaySec = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
    if (delaySec === 0) {
      return res.json({ ok: true, fired: "immediate" });
    }

    const host = req.headers.host || "";
    const proto = (req.headers["x-forwarded-proto"] as string) || "https";
    const callbackUrl = `${proto}://${host}/api/push/fire`;

    const resp = await fetch(`https://qstash.upstash.io/v2/publish/${encodeURIComponent(callbackUrl)}`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "Upstash-Delay": `${delaySec}s`,
        "Upstash-Deduplication-Id": String(id),
      },
      body: JSON.stringify({ id, title, body, tag }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      throw new Error(`QStash error ${resp.status}: ${txt}`);
    }

    res.json({ ok: true, delaySec });
  } catch (err: any) {
    console.error("schedule error:", err);
    res.status(500).json({ error: err.message || "schedule failed" });
  }
}
