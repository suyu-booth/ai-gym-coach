/**
 * POST /api/push/fire
 *
 * Called by Upstash QStash at the scheduled time. Loads the stored push
 * subscription from Notion and dispatches a Web Push notification.
 *
 * Body: { id, title, body, tag }
 * Returns: { ok: true }
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getNotionClient, PAGE_ID } from "../_notion.js";

const SUBSCRIPTION_MARKER = "GYM_COACH_PUSH_SUB_V1:";

async function loadSubscription(notion: any) {
  if (!PAGE_ID) return null;
  let cursor: string | undefined;
  do {
    const resp: any = await notion.blocks.children.list({
      block_id: PAGE_ID, page_size: 100, start_cursor: cursor,
    });
    for (const block of resp.results) {
      if (block.type !== "code") continue;
      const text = block.code.rich_text?.[0]?.plain_text || "";
      if (text.startsWith(SUBSCRIPTION_MARKER)) {
        return JSON.parse(text.slice(SUBSCRIPTION_MARKER.length));
      }
    }
    cursor = resp.has_more ? resp.next_cursor : undefined;
  } while (cursor);
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
  const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
  const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:noreply@example.com";
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    return res.status(500).json({ error: "VAPID keys not set" });
  }

  try {
    // Dynamically import web-push so the bundle stays small / cold-start fast.
    const webpush = (await import("web-push")).default;
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

    const notion = getNotionClient();
    const sub = await loadSubscription(notion);
    if (!sub) {
      return res.status(404).json({ error: "No push subscription on file" });
    }

    const { id, title, body, tag } = req.body || {};
    const payload = JSON.stringify({
      title: title || "Timer",
      body: body || "Time's up.",
      tag: tag || id || "timer",
    });

    await webpush.sendNotification(sub, payload);
    res.json({ ok: true });
  } catch (err: any) {
    console.error("fire error:", err);
    res.status(500).json({ error: err.message || "fire failed" });
  }
}
