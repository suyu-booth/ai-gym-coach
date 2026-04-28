/**
 * POST /api/push/subscribe
 *
 * Stores a Web Push subscription. We persist a single subscription on the
 * "AI Gym Coach" Notion page as a code block — no separate DB required.
 *
 * Body: a PushSubscription.toJSON() blob.
 * Returns: { ok: true }
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getNotionClient, PAGE_ID } from "../_notion.js";

const SUBSCRIPTION_MARKER = "GYM_COACH_PUSH_SUB_V1:";

async function findSubscriptionBlock(notion: any): Promise<{ id: string } | null> {
  if (!PAGE_ID) return null;
  let cursor: string | undefined;
  do {
    const resp: any = await notion.blocks.children.list({
      block_id: PAGE_ID, page_size: 100, start_cursor: cursor,
    });
    for (const block of resp.results) {
      if (block.type !== "code") continue;
      const text = block.code.rich_text?.[0]?.plain_text || "";
      if (text.startsWith(SUBSCRIPTION_MARKER)) return block;
    }
    cursor = resp.has_more ? resp.next_cursor : undefined;
  } while (cursor);
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!PAGE_ID) {
    return res.status(500).json({ error: "NOTION_PAGE_ID not set" });
  }

  try {
    const notion = getNotionClient();
    const body = req.body || {};
    if (!body.endpoint) {
      return res.status(400).json({ error: "Missing subscription endpoint" });
    }

    const payload = SUBSCRIPTION_MARKER + JSON.stringify(body);
    const existing = await findSubscriptionBlock(notion);

    if (existing) {
      await notion.blocks.update({
        block_id: existing.id,
        code: {
          language: "json",
          rich_text: [{ type: "text", text: { content: payload } }],
        },
      } as any);
    } else {
      await notion.blocks.children.append({
        block_id: PAGE_ID,
        children: [{
          object: "block",
          type: "code",
          code: {
            language: "json",
            rich_text: [{ type: "text", text: { content: payload } }],
          },
        }] as any,
      });
    }

    res.json({ ok: true });
  } catch (err: any) {
    console.error("subscribe error:", err);
    res.status(500).json({ error: err.message || "subscribe failed" });
  }
}
