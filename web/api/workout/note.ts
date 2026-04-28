/**
 * PATCH /api/workout/note
 * Updates the Notes column for a single exercise row in the Weight Tracking Log child DB.
 *
 * Body: { rowPageId, notes }
 * Returns: { ok: true }
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getNotionClient, richTextProp } from "../_notion.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const notion = getNotionClient();
    const { rowPageId, notes } = req.body;

    if (!rowPageId) {
      return res.status(400).json({ error: "Missing rowPageId" });
    }

    await notion.pages.update({
      page_id: rowPageId,
      properties: {
        Notes: richTextProp(notes || ""),
      },
    });

    res.json({ ok: true });
  } catch (err: any) {
    console.error("Failed to update note:", err);
    res.status(500).json({ error: err.message || "Failed to update note" });
  }
}
