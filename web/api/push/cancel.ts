/**
 * POST /api/push/cancel
 *
 * Cancels a previously-scheduled QStash delivery for a given timer id, using
 * the Upstash-Deduplication-Id we set when scheduling. Best-effort.
 *
 * Body: { id }
 * Returns: { ok: true }
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = process.env.QSTASH_TOKEN;
  if (!token) {
    return res.json({ skipped: true });
  }

  try {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ error: "Missing id" });

    // QStash doesn't expose a cancel-by-dedup endpoint, so we list pending
    // messages and DELETE any that match.
    const list = await fetch("https://qstash.upstash.io/v2/messages", {
      headers: { "Authorization": `Bearer ${token}` },
    });
    if (!list.ok) {
      return res.json({ ok: true, note: "list unavailable" });
    }
    const data: any = await list.json();
    const messages = data?.messages || data || [];
    const matches = messages.filter((m: any) => m.deduplicationId === String(id));
    for (const m of matches) {
      await fetch(`https://qstash.upstash.io/v2/messages/${m.messageId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });
    }
    res.json({ ok: true, cancelled: matches.length });
  } catch (err: any) {
    console.error("cancel error:", err);
    res.json({ ok: true, error: err.message });  // non-fatal
  }
}
