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
import { PROPS, TRACK, TRACK_SET_COLS } from "./_schema.js";

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
        property: PROPS.DATE,
        date: { on_or_after: cutoffStr },
      },
      sorts: [{ property: PROPS.DATE, direction: "descending" }],
    });

    const workouts = [];

    for (const page of response.results) {
      if (!("properties" in page)) continue;

      const props = page.properties;
      const workoutName = getTitle(props, PROPS.WORKOUT_NAME);
      const date = getDate(props, PROPS.DATE);
      const dayType = getSelect(props, PROPS.DAY_TYPE);
      const duration = getNumber(props, PROPS.DURATION);
      const difficulty = getSelect(props, PROPS.DIFFICULTY);
      const energy = getSelect(props, PROPS.ENERGY);
      const kneeComfort = getSelect(props, PROPS.KNEE_COMFORT);
      const mood = getSelect(props, PROPS.MOOD);
      const sauna = getCheckbox(props, PROPS.SAUNA);
      const notes = getRichText(props, PROPS.WORKOUT_NOTES);

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
            const exName = getTitle(rp, TRACK.EXERCISE);
            const suggested = getRichText(rp, TRACK.SUGGESTED);
            const sxr = getRichText(rp, TRACK.SETS_X_REPS);
            const exNotes = getRichText(rp, TRACK.NOTES);

            // Determine exercise ID from name
            const exId = exerciseNameToId(exName);
            const isBw = isBodyweightExercise(exId, exName);

            // Parse sets
            const sets = [];
            for (let i = 0; i < 4; i++) {
              const setVal = getRichText(rp, TRACK_SET_COLS[i]);
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
