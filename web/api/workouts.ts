/**
 * GET /api/workouts?weeks=8
 * Fetches recent workouts from the Notion Workout Log database.
 * Returns { workouts: WorkoutSession[] }
 */

import type { VercelRequest, VercelResponse } from "@vercel/node";
import {
  getNotionClient, DATABASE_ID,
  getTitle, getRichText, getSelect, getNumber, getCheckbox, getDate,
  parseSetValue, dayTypeToKey, isBodyweightExercise, exerciseNameToId,
} from "./_notion.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const notion = getNotionClient();
    const weeks = parseInt(req.query.weeks as string) || 8;

    // Calculate cutoff date
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - weeks * 7);
    const cutoffStr = cutoff.toISOString().split("T")[0];

    // Query the Workout Log database
    const response = await notion.databases.query({
      database_id: DATABASE_ID,
      filter: {
        property: "Date",
        date: { on_or_after: cutoffStr },
      },
      sorts: [{ property: "Date", direction: "descending" }],
    });

    const workouts = [];

    for (const page of response.results) {
      if (!("properties" in page)) continue;

      const props = page.properties;
      const workoutName = getTitle(props, "Workout Name");
      const date = getDate(props, "Date");
      const dayType = getSelect(props, "Day Type");
      const duration = getNumber(props, "Duration");
      const difficulty = getSelect(props, "Difficulty");
      const energy = getSelect(props, "Energy");
      const kneeComfort = getSelect(props, "Knee Comfort");
      const mood = getSelect(props, "Mood");
      const sauna = getCheckbox(props, "Sauna");
      const notes = getRichText(props, "Workout Notes");

      if (!date || !dayType) continue;

      const dayKey = dayTypeToKey(dayType);

      // Find child database (Weight Tracking Log)
      let exercises: any[] = [];
      try {
        const blocks = await notion.blocks.children.list({ block_id: page.id });
        const childDb = blocks.results.find(
          (b: any) => b.type === "child_database"
        );

        if (childDb) {
          const rows = await notion.databases.query({
            database_id: childDb.id,
          });

          for (const row of rows.results) {
            if (!("properties" in row)) continue;
            const rp = row.properties;
            const exName = getTitle(rp, "Exercise");
            const suggested = getRichText(rp, "Suggested");
            const sxr = getRichText(rp, "Sets x Reps");
            const exNotes = getRichText(rp, "Notes");

            // Determine exercise ID from name
            const exId = exerciseNameToId(exName);
            const isBw = isBodyweightExercise(exId, exName);

            // Parse sets
            const sets = [];
            for (let i = 1; i <= 4; i++) {
              const setVal = getRichText(rp, `Set ${i}`);
              sets.push(parseSetValue(setVal, isBw));
            }

            // Parse suggested weight
            const targetWeight = isBw ? 0 : (parseFloat(suggested) || 0);

            exercises.push({
              id: exId,
              name: exName,
              targetWeight,
              unit: isBw ? "bodyweight" : "lbs",
              sets,
              notes: exNotes,
              isBodyweight: isBw,
              notionRowId: row.id,
            });
          }
        }
      } catch (err) {
        // If child DB read fails, continue with empty exercises
        console.error(`Failed to read exercises for ${workoutName}:`, err);
      }

      // Determine if completed (has any completed sets)
      const hasCompletedSets = exercises.some(
        (e: any) => e.sets.some((s: any) => s.completed)
      );

      workouts.push({
        id: page.id,
        dayKey,
        date,
        duration: duration ?? undefined,
        completed: hasCompletedSets || !!difficulty,
        exercises,
        difficulty: difficulty ? parseInt(difficulty) : undefined,
        energy: energy ?? undefined,
        kneeComfort: kneeComfort ?? undefined,
        mood: mood ?? undefined,
        notes: notes || undefined,
        sauna,
        notionPageId: page.id,
      });
    }

    res.json({ workouts });
  } catch (err: any) {
    console.error("Failed to fetch workouts:", err);
    res.status(500).json({ error: err.message || "Failed to fetch workouts" });
  }
}
