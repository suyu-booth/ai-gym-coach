/**
 * POST /api/workout/complete
 * Updates workout page properties with completion metadata.
 *
 * Body: { pageId, difficulty, energy, kneeComfort, mood, notes, sauna, duration }
 * Returns: { ok: true }
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getNotionClient,
  selectProp, numberProp, checkboxProp, richTextProp,
} from "../_notion.js";
import { PROPS } from "../_schema.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const notion = getNotionClient();
    const { pageId, difficulty, energy, kneeComfort, mood, notes, sauna, duration } = req.body;

    if (!pageId) {
      return res.status(400).json({ error: "Missing pageId" });
    }

    const properties: any = {};

    if (difficulty !== undefined && difficulty !== null) {
      properties[PROPS.DIFFICULTY] = selectProp(String(difficulty));
    }
    if (energy) {
      properties[PROPS.ENERGY] = selectProp(energy);
    }
    if (kneeComfort) {
      properties[PROPS.KNEE_COMFORT] = selectProp(kneeComfort);
    }
    if (mood) {
      properties[PROPS.MOOD] = selectProp(mood);
    }
    if (notes) {
      properties[PROPS.WORKOUT_NOTES] = richTextProp(notes);
    }
    if (duration !== undefined && duration !== null) {
      properties[PROPS.DURATION] = numberProp(duration);
    }
    properties[PROPS.SAUNA] = checkboxProp(sauna || false);

    if (Object.keys(properties).length > 0) {
      await notion.pages.update({
        page_id: pageId,
        properties,
      });
    }

    res.json({ ok: true });
  } catch (err: any) {
    console.error("Failed to complete workout:", err);
    res.status(500).json({ error: err.message || "Failed to complete workout" });
  }
}
