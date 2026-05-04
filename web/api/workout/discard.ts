/**
 * DELETE /api/workout/discard
 * Moves a workout page to Notion trash.
 *
 * Body: { pageId }
 * Returns: { ok: true }
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getNotionClient } from "../_notion.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const notion = getNotionClient();
    const { pageId } = req.body;

    if (!pageId) {
      return res.status(400).json({ error: "Missing pageId" });
    }

    await notion.pages.update({
      page_id: pageId,
      in_trash: true,
    } as any);

    res.json({ ok: true });
  } catch (err: any) {
    console.error("Failed to discard workout:", err);
    res.status(500).json({ error: err.message || "Failed to discard workout" });
  }
}
