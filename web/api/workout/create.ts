/**
 * POST /api/workout/create
 * Creates a new workout page in Notion with full structure:
 * - Page properties (Workout Name, Date, Day Type)
 * - Warm-up heading + bullet list
 * - Weight Tracking Log child database with exercise rows
 * - Exercise Details toggles
 * - Cool-down section
 *
 * Body: { dayKey, date, exercises: [{ id, name, targetWeight, unit, sets, notes, isBodyweight }] }
 * Returns: { pageId, childDbId, exerciseRowIds: { [exerciseId]: rowPageId } }
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getNotionClient, DATABASE_ID,
  getExerciseTemplate,
  titleProp, dateProp, selectProp, richTextProp,
  heading2Block, heading3Block, bulletBlock, paragraphBlock, toggleBlock,
  dayKeyToLabel, formatSetValue,
} from "../_notion.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const notion = getNotionClient();
    const { dayKey, date, exercises, weekNumber } = req.body;

    if (!dayKey || !date || !exercises) {
      return res.status(400).json({ error: "Missing dayKey, date, or exercises" });
    }

    const template = getExerciseTemplate(dayKey);
    if (!template) {
      return res.status(400).json({ error: `Unknown day key: ${dayKey}` });
    }

    const dayLabel = dayKeyToLabel(dayKey);
    const weekLabel = weekNumber ? `Week ${weekNumber} ` : "";
    const workoutName = `${weekLabel}${dayLabel}`;

    // ── Page properties
    const properties: any = {
      "Workout Name": titleProp(workoutName),
      "Date": dateProp(date),
      "Day Type": selectProp(dayLabel),
    };

    // ── Child blocks (warmup)
    const children: any[] = [];
    if (template.warmup && template.warmup.length > 0) {
      children.push(heading2Block("Warm-up (5 min)"));
      for (const item of template.warmup) {
        children.push(bulletBlock(item));
      }
    }

    // ── Create the page
    const page = await notion.pages.create({
      parent: { database_id: DATABASE_ID },
      properties,
      children,
    });

    const pageId = page.id;

    // ── Create child database (Weight Tracking Log)
    const db = await notion.databases.create({
      parent: { type: "page_id", page_id: pageId },
      title: [{ type: "text", text: { content: "Weight Tracking Log" } }],
      properties: {
        "Exercise": { title: {} },
        "Suggested": { rich_text: {} },
        "Sets x Reps": { rich_text: {} },
        "Set 1": { rich_text: {} },
        "Set 2": { rich_text: {} },
        "Set 3": { rich_text: {} },
        "Set 4": { rich_text: {} },
        "Notes": { rich_text: {} },
      },
    });

    const childDbId = db.id;

    // ── Populate exercise rows
    const exerciseRowIds: Record<string, string> = {};

    for (const ex of exercises) {
      // Find template exercise for sets x reps info
      const tmplEx = template.exercises.find((e: any) => e.id === ex.id);
      const setsXReps = tmplEx ? `${tmplEx.sets}x${tmplEx.reps}` : `${ex.sets?.length || 3}x12`;

      const suggested = ex.isBodyweight ? "" : String(
        ex.targetWeight === Math.floor(ex.targetWeight)
          ? Math.floor(ex.targetWeight)
          : ex.targetWeight
      );

      const rowProps: any = {
        "Exercise": titleProp(ex.name),
        "Suggested": richTextProp(suggested),
        "Sets x Reps": richTextProp(setsXReps),
        "Notes": richTextProp(ex.notes || ""),
      };

      // Pre-fill any completed sets
      if (ex.sets) {
        for (let i = 0; i < Math.min(ex.sets.length, 4); i++) {
          const s = ex.sets[i];
          if (s.completed) {
            rowProps[`Set ${i + 1}`] = richTextProp(
              formatSetValue(s.weight, s.reps, ex.isBodyweight)
            );
          }
        }
      }

      const row = await notion.pages.create({
        parent: { database_id: childDbId },
        properties: rowProps,
      });

      exerciseRowIds[ex.id] = row.id;
    }

    // ── Exercise Details toggles
    const detailBlocks: any[] = [heading2Block("Exercise Details")];
    for (const tmplEx of template.exercises) {
      const cues: any[] = [];
      if (tmplEx.notes) {
        cues.push(paragraphBlock(`\u{1F4A1} ${tmplEx.notes}`));
      }
      const weightStr = tmplEx.isBodyweight ? "" : ` @ ${tmplEx.defaultWeight} ${tmplEx.unit}`;
      cues.push(paragraphBlock(`${tmplEx.sets} \u00D7 ${tmplEx.reps}${weightStr}`));
      detailBlocks.push(toggleBlock(tmplEx.name, cues));
    }

    await notion.blocks.children.append({
      block_id: pageId,
      children: detailBlocks,
    });

    // ── Cooldown
    if (template.cooldown) {
      await notion.blocks.children.append({
        block_id: pageId,
        children: [
          heading3Block("Cool-down"),
          paragraphBlock(`\u{1F9D8} ${template.cooldown}`),
        ],
      });
    }

    res.json({ pageId, childDbId, exerciseRowIds });
  } catch (err: any) {
    console.error("Failed to create workout:", err);
    res.status(500).json({ error: err.message || "Failed to create workout" });
  }
}
