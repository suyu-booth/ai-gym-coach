/**
 * PATCH /api/workout/set
 * Updates a single set column in the Weight Tracking Log child database.
 *
 * Body: { rowPageId, setIndex (1-4), weight, reps, isBodyweight }
 * Returns: { ok: true }
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getNotionClient, richTextProp, formatSetValue } from "../_notion.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "PATCH") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const notion = getNotionClient();
    const { rowPageId, setIndex, weight, reps, isBodyweight } = req.body;

    if (!rowPageId || !setIndex || setIndex < 1 || setIndex > 4) {
      return res.status(400).json({ error: "Missing rowPageId or invalid setIndex (1-4)" });
    }

    const formatted = formatSetValue(
      weight ?? null,
      reps ?? null,
      isBodyweight || false
    );

    const properties: any = {
      [`Set ${setIndex}`]: richTextProp(formatted),
    };

    await notion.pages.update({
      page_id: rowPageId,
      properties,
    });

    res.json({ ok: true });
  } catch (err: any) {
    console.error("Failed to update set:", err);
    res.status(500).json({ error: err.message || "Failed to update set" });
  }
}
