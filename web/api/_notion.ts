/**
 * Shared Notion client and helpers for all API routes.
 * Uses @notionhq/client with env var NOTION_API.
 */

import { Client } from "@notionhq/client";

// ─── Notion client singleton ──────────────────────────────

let _client: Client | null = null;

export function getNotionClient(): Client {
  if (!_client) {
    const token = process.env.NOTION_API;
    if (!token) throw new Error("NOTION_API env var not set");
    _client = new Client({ auth: token });
  }
  return _client;
}

export const DATABASE_ID = process.env.NOTION_DATABASE_ID || "";
export const PAGE_ID = process.env.NOTION_PAGE_ID || "";

// ─── Exercise library (matches frontend constants.js) ─────

const EXERCISES: Record<string, any> = {
  monday: {
    warmup: ["Arm circles: 15 forward, 15 backward", "Band pull-aparts: 2 \u00D7 12", "Cat-cow stretches: 10 reps"],
    exercises: [
      { id: "incline-db-press", name: "Incline DB Press", sets: 3, reps: "10-12", defaultWeight: 47.5, unit: "lb DBs", notes: "Control descent", increment: 2.5 },
      { id: "seated-shoulder-press", name: "Seated Shoulder Press", sets: 4, reps: "10", defaultWeight: 45, unit: "lb DBs", notes: "Key lift for dance", increment: 2.5 },
      { id: "cable-chest-fly", name: "Cable Chest Fly", sets: 3, reps: "12", defaultWeight: 30, unit: "lbs/side", notes: "Squeeze at center", increment: 5 },
      { id: "lateral-raises", name: "Lateral Raises", sets: 3, reps: "15", defaultWeight: 12, unit: "lb DBs", notes: "Light weight, strict form", increment: 2.5 },
      { id: "tricep-pushdowns", name: "Tricep Pushdowns", sets: 3, reps: "12", defaultWeight: 40, unit: "lbs", notes: "", increment: 5 },
      { id: "plank-hold", name: "Plank Hold", sets: 3, reps: "30-45s", defaultWeight: 0, unit: "bodyweight", notes: "Core stability", increment: 0, isBodyweight: true },
      { id: "dead-bug", name: "Dead Bug", sets: 3, reps: "10/side", defaultWeight: 0, unit: "bodyweight", notes: "Knee-friendly core", increment: 0, isBodyweight: true },
    ],
    cooldown: "Shoulder + chest stretches",
    hasSauna: false,
  },
  tuesday: {
    warmup: ["Glute bridges: 2 \u00D7 10", "Leg swings: 10 each leg", "Foam roll quads/IT band: 2 min"],
    exercises: [
      { id: "leg-press", name: "Leg Press (high foot)", sets: 3, reps: "12", defaultWeight: 195, unit: "lbs", notes: "Reduces knee shear", increment: 10 },
      { id: "romanian-deadlift", name: "Romanian Deadlift", sets: 3, reps: "10", defaultWeight: 75, unit: "lbs", notes: "Hamstring focus", increment: 5 },
      { id: "hip-thrust", name: "Hip Thrust", sets: 3, reps: "12", defaultWeight: 45, unit: "lbs", notes: "Glute strength", increment: 10 },
      { id: "leg-curl", name: "Leg Curl", sets: 3, reps: "12", defaultWeight: 65, unit: "lbs", notes: "", increment: 5 },
      { id: "calf-raises", name: "Calf Raises", sets: 3, reps: "15", defaultWeight: 120, unit: "lbs", notes: "", increment: 10 },
      { id: "hip-abduction", name: "Side-lying Hip Abduction", sets: 2, reps: "15/side", defaultWeight: 0, unit: "bodyweight", notes: "Hip stability", increment: 0, isBodyweight: true },
    ],
    cooldown: null,
    hasSauna: true,
  },
  thursday: {
    warmup: ["Band pull-aparts: 2 \u00D7 15", "Shoulder dislocates with PVC: 10 reps", "Thoracic rotations: 8 each side"],
    exercises: [
      { id: "lat-pulldown", name: "Lat Pulldown", sets: 3, reps: "10-12", defaultWeight: 100, unit: "lbs", notes: "Full stretch at top", increment: 5 },
      { id: "seated-cable-row", name: "Seated Cable Row", sets: 3, reps: "12", defaultWeight: 100, unit: "lbs", notes: "Squeeze shoulder blades", increment: 5 },
      { id: "face-pulls", name: "Face Pulls", sets: 4, reps: "15", defaultWeight: 40, unit: "lbs", notes: "Shoulder health", increment: 5 },
      { id: "rear-delt-fly", name: "Rear Delt Fly", sets: 3, reps: "15", defaultWeight: 15, unit: "lb DBs", notes: "Posture balance", increment: 2.5 },
      { id: "db-shrugs", name: "DB Shrugs", sets: 3, reps: "12", defaultWeight: 40, unit: "lb DBs", notes: "Trap development", increment: 5 },
      { id: "bicep-curls", name: "Bicep Curls", sets: 3, reps: "12", defaultWeight: 25, unit: "lb DBs", notes: "", increment: 2.5 },
    ],
    cooldown: null,
    hasSauna: true,
  },
};

export function getExerciseTemplate(dayKey: string) {
  return EXERCISES[dayKey] || null;
}

// ─── Property extractors (port of Python notion_reader.py) ─

export function getTitle(props: any, key: string): string {
  const arr = props?.[key]?.title;
  return arr?.[0]?.text?.content || "";
}

export function getRichText(props: any, key: string): string {
  const arr = props?.[key]?.rich_text;
  return arr?.[0]?.text?.content || "";
}

export function getSelect(props: any, key: string): string | null {
  return props?.[key]?.select?.name || null;
}

export function getNumber(props: any, key: string): number | null {
  const val = props?.[key]?.number;
  return val !== undefined && val !== null ? val : null;
}

export function getCheckbox(props: any, key: string): boolean {
  return props?.[key]?.checkbox || false;
}

export function getDate(props: any, key: string): string | null {
  return props?.[key]?.date?.start || null;
}

// ─── Set value parsing/formatting ─────────────────────────

export function parseSetValue(text: string, isBodyweight: boolean): { weight: number | null; reps: number | null; completed: boolean } {
  const trimmed = (text || "").trim();
  if (!trimmed) return { weight: null, reps: null, completed: false };

  if (isBodyweight) {
    const reps = parseInt(trimmed);
    if (isNaN(reps)) return { weight: null, reps: null, completed: false };
    return { weight: 0, reps, completed: true };
  }

  // Weighted: "47.5 \u00D7 12" or "47.5 x 12"
  const parts = trimmed.split(/\s*[\u00D7x]\s*/);
  if (parts.length === 2) {
    const weight = parseFloat(parts[0]);
    const reps = parseInt(parts[1]);
    if (!isNaN(weight) && !isNaN(reps)) {
      return { weight, reps, completed: true };
    }
  }

  return { weight: null, reps: null, completed: false };
}

export function formatSetValue(weight: number | null, reps: number | null, isBodyweight: boolean): string {
  if (weight === null && reps === null) return "";
  if (isBodyweight) return reps !== null ? String(reps) : "";
  if (weight !== null && reps !== null) {
    const w = weight === Math.floor(weight) ? Math.floor(weight) : weight;
    return `${w} \u00D7 ${reps}`;
  }
  return "";
}

// ─── Notion property builders (port of Python notion_writer.py) ─

export function titleProp(text: string) {
  return { title: [{ type: "text", text: { content: text } }] };
}

export function richTextProp(text: string) {
  return { rich_text: [{ type: "text", text: { content: text } }] };
}

export function selectProp(name: string) {
  return { select: { name } };
}

export function numberProp(value: number) {
  return { number: value };
}

export function checkboxProp(value: boolean) {
  return { checkbox: value };
}

export function dateProp(dateStr: string) {
  return { date: { start: dateStr } };
}

// ─── Notion block builders ─────────────────────────────────

export function heading2Block(text: string) {
  return {
    object: "block" as const,
    type: "heading_2" as const,
    heading_2: { rich_text: [{ type: "text" as const, text: { content: text } }] },
  };
}

export function heading3Block(text: string) {
  return {
    object: "block" as const,
    type: "heading_3" as const,
    heading_3: { rich_text: [{ type: "text" as const, text: { content: text } }] },
  };
}

export function bulletBlock(text: string) {
  return {
    object: "block" as const,
    type: "bulleted_list_item" as const,
    bulleted_list_item: { rich_text: [{ type: "text" as const, text: { content: text } }] },
  };
}

export function paragraphBlock(text: string) {
  return {
    object: "block" as const,
    type: "paragraph" as const,
    paragraph: { rich_text: [{ type: "text" as const, text: { content: text } }] },
  };
}

export function toggleBlock(title: string, children: any[]) {
  return {
    object: "block" as const,
    type: "toggle" as const,
    toggle: {
      rich_text: [{ type: "text" as const, text: { content: title } }],
      children,
    },
  };
}

// ─── Day key mapping ───────────────────────────────────────

const DAY_TYPE_MAP: Record<string, string> = {
  "Monday - Upper Push": "monday",
  "Tuesday - Lower Body": "tuesday",
  "Thursday - Upper Pull": "thursday",
  "Sunday - Bachata": "sunday",
};

const DAY_LABELS: Record<string, string> = {
  monday: "Monday - Upper Push",
  tuesday: "Tuesday - Lower Body",
  thursday: "Thursday - Upper Pull",
  sunday: "Sunday - Bachata",
};

export function dayTypeToKey(dayType: string): string {
  return DAY_TYPE_MAP[dayType] || dayType.toLowerCase().split(" ")[0];
}

export function dayKeyToLabel(dayKey: string): string {
  return DAY_LABELS[dayKey] || dayKey;
}

// ─── Exercise name → ID mapping ─────────────────────────────

const NAME_TO_ID: Record<string, string> = {};
for (const day of Object.values(EXERCISES)) {
  for (const ex of day.exercises) {
    NAME_TO_ID[ex.name.toLowerCase()] = ex.id;
  }
}

export function exerciseNameToId(name: string): string {
  const lower = name.toLowerCase();
  // Exact match first
  if (NAME_TO_ID[lower]) return NAME_TO_ID[lower];
  // Fallback: slugify the name
  return lower.replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// ─── Bodyweight detection ──────────────────────────────────

const BODYWEIGHT_IDS = new Set(["plank-hold", "dead-bug", "hip-abduction"]);

export function isBodyweightExercise(exerciseId: string, exerciseName: string): boolean {
  if (BODYWEIGHT_IDS.has(exerciseId)) return true;
  const lower = exerciseName.toLowerCase();
  return lower.includes("plank") || lower.includes("dead bug") || lower.includes("abduction");
}
