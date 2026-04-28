/**
 * POST /api/week/plan
 *
 * MANUAL TRIGGER ONLY — never invoke from cron / scheduled job.
 *
 * Reads recent workouts from Notion, computes targets via the same progressive-
 * overload logic the Python `coach plan-week` uses, then writes 3 new pages
 * (Mon / Tue / Thu of the next ISO week) to the Workout Log database.
 *
 * Body: {} (empty)
 * Returns: { created: [{ date, dayKey, pageId }] }
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getNotionClient, DATABASE_ID,
  getExerciseTemplate,
  titleProp, dateProp, selectProp, richTextProp,
  heading2Block, heading3Block, bulletBlock, paragraphBlock, toggleBlock,
  dayKeyToLabel,
  getTitle, getRichText, getSelect, getNumber, getDate,
  parseSetValue, isBodyweightExercise,
} from "../_notion.js";

const DAY_KEYS = ["tuesday", "wednesday", "friday"] as const;
const DAY_OFFSET: Record<string, number> = { tuesday: 2, wednesday: 3, friday: 5 };

function getNextWeekDate(dayKey: string): string {
  const today = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const nextMonday = new Date(monday);
  nextMonday.setDate(monday.getDate() + 7);
  const offset = DAY_OFFSET[dayKey] - 1;
  const target = new Date(nextMonday);
  target.setDate(nextMonday.getDate() + offset);
  return target.toISOString().split("T")[0];
}

function dayTypeToKey(dayType: string | null): string {
  if (!dayType) return "";
  const first = dayType.split(" ")[0].toLowerCase();
  return ["tuesday", "wednesday", "friday", "sunday"].includes(first) ? first : "";
}

async function fetchHistory(notion: any, dbId: string) {
  const since = new Date();
  since.setDate(since.getDate() - 8 * 7);
  const sinceStr = since.toISOString().split("T")[0];

  const all: any[] = [];
  let cursor: string | undefined;
  do {
    const resp: any = await notion.databases.query({
      database_id: dbId,
      filter: { property: "Date", date: { on_or_after: sinceStr } },
      sorts: [{ property: "Date", direction: "descending" }],
      page_size: 100,
      start_cursor: cursor,
    });
    all.push(...resp.results);
    cursor = resp.has_more ? resp.next_cursor : undefined;
  } while (cursor);

  // Hydrate each page with its child Weight Tracking Log rows.
  const sessions: any[] = [];
  for (const page of all) {
    const props = page.properties || {};
    const dayKey = dayTypeToKey(getSelect(props, "Day Type"));
    if (!dayKey) continue;
    const date = getDate(props, "Date");
    const difficultyStr = getSelect(props, "Difficulty");
    const difficulty = difficultyStr ? parseInt(difficultyStr) : null;

    // Find child DB block
    const blocks: any = await notion.blocks.children.list({ block_id: page.id, page_size: 100 });
    const childDb = blocks.results.find((b: any) => b.type === "child_database");
    const exercises: any[] = [];
    if (childDb) {
      const rows: any = await notion.databases.query({ database_id: childDb.id, page_size: 100 });
      for (const row of rows.results) {
        const rp = row.properties || {};
        const name = getTitle(rp, "Exercise");
        if (!name) continue;
        const id = name.toLowerCase().replace(/\s*\(.*?\)/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        const isBw = isBodyweightExercise(id, name);
        const sets: any[] = [];
        for (let i = 1; i <= 4; i++) {
          const text = getRichText(rp, `Set ${i}`);
          const parsed = parseSetValue(text, isBw);
          if (text || sets.length < 4) sets.push(parsed);
        }
        exercises.push({ id, name, sets, isBodyweight: isBw });
      }
    }
    sessions.push({ date, dayKey, completed: true, difficulty, exercises });
  }
  return sessions;
}

function getTargetWeight(exercise: any, history: any[], dayKey: string): number {
  if (exercise.isBodyweight) return 0;
  const relevant = history
    .filter((w) => w.dayKey === dayKey && w.completed)
    .slice(0, 3)
    .map((w) => w.exercises.find((e: any) => e.id === exercise.id))
    .filter(Boolean);

  if (relevant.length === 0) return exercise.defaultWeight;

  const last = relevant[0];
  const completed = last.sets.filter((s: any) => s.completed);
  if (completed.length === 0) return exercise.defaultWeight;

  const avg = completed.reduce((a: number, s: any) => a + (s.weight || 0), 0) / completed.length;
  const allRepsHit = completed.every((s: any) => s.reps >= (parseInt(exercise.reps) || 12));
  const lastDifficulty = history.find((w) => w.dayKey === dayKey && w.completed)?.difficulty;

  if (relevant.length >= 2 && allRepsHit && (!lastDifficulty || lastDifficulty <= 3)) {
    return Math.round((avg + exercise.increment) * 2) / 2;
  }
  if (lastDifficulty >= 5) {
    return Math.max(0, Math.round((avg - exercise.increment) * 2) / 2);
  }
  return Math.round(avg * 2) / 2;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const notion = getNotionClient();
    if (!DATABASE_ID) {
      return res.status(500).json({ error: "NOTION_DATABASE_ID not set" });
    }

    const history = await fetchHistory(notion, DATABASE_ID);

    const created: { date: string; dayKey: string; pageId: string }[] = [];

    for (const dayKey of DAY_KEYS) {
      const template = getExerciseTemplate(dayKey);
      if (!template) continue;

      const date = getNextWeekDate(dayKey);
      const dayLabel = dayKeyToLabel(dayKey);

      // Build exercises with targets
      const exercises = template.exercises.map((ex: any) => ({
        ...ex,
        targetWeight: getTargetWeight(ex, history, dayKey),
      }));

      // Create the page
      const children: any[] = [];
      if (template.warmup?.length) {
        children.push(heading2Block("Warm-up (5 min)"));
        for (const w of template.warmup) children.push(bulletBlock(w));
      }

      const page: any = await notion.pages.create({
        parent: { database_id: DATABASE_ID },
        properties: {
          "Workout Name": titleProp(dayLabel),
          "Date": dateProp(date),
          "Day Type": selectProp(dayLabel),
        },
        children,
      });

      const pageId = page.id;

      // Child DB
      const db: any = await notion.databases.create({
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

      for (const ex of exercises) {
        const suggested = ex.isBodyweight ? "" : String(
          ex.targetWeight === Math.floor(ex.targetWeight) ? Math.floor(ex.targetWeight) : ex.targetWeight
        );
        await notion.pages.create({
          parent: { database_id: db.id },
          properties: {
            "Exercise": titleProp(ex.name),
            "Suggested": richTextProp(suggested),
            "Sets x Reps": richTextProp(`${ex.sets}x${ex.reps}`),
            "Notes": richTextProp(ex.notes || ""),
          },
        });
      }

      // Detail toggles
      const detail: any[] = [heading2Block("Exercise Details")];
      for (const ex of template.exercises) {
        const cues: any[] = [];
        if (ex.notes) cues.push(paragraphBlock(`\u{1F4A1} ${ex.notes}`));
        const w = ex.isBodyweight ? "" : ` @ ${ex.defaultWeight} ${ex.unit}`;
        cues.push(paragraphBlock(`${ex.sets} × ${ex.reps}${w}`));
        detail.push(toggleBlock(ex.name, cues));
      }
      await notion.blocks.children.append({ block_id: pageId, children: detail });

      if (template.cooldown) {
        await notion.blocks.children.append({
          block_id: pageId,
          children: [heading3Block("Cool-down"), paragraphBlock(`\u{1F9D8} ${template.cooldown}`)],
        });
      }

      created.push({ date, dayKey, pageId });
    }

    res.json({ created });
  } catch (err: any) {
    console.error("Failed to plan week:", err);
    res.status(500).json({ error: err.message || "Failed to plan week" });
  }
}
