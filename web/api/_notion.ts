/**
 * Shared Notion client and helpers for all API routes.
 * Uses @notionhq/client with env var NOTION_API.
 */

import { Client } from "@notionhq/client";
import { DAY_LABELS, DAY_TYPE_TO_KEY } from "./_schema.js";

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

const DANCE_WARMUP = [
  "Bachata basic step in place (side-to-side): 2 × 30s",
  "Hip circles: 15 each direction",
  "Shoulder rolls and arm swings: 10 each direction",
  "Body rolls (hip-to-shoulder wave): 10 reps",
];

const EXERCISES: Record<string, any> = {
  tuesday: {
    warmup: DANCE_WARMUP,
    exercises: [
      { id: "flat-db-bench-press",            name: "Flat DB Bench Press",                    sets: 4, reps: "8-10",         defaultWeight: 45,  unit: "lb DBs",    notes: "Elbows ~45°, full ROM, controlled eccentric",               increment: 5  },
      { id: "standing-db-arnold-press",        name: "Standing DB Arnold Press",               sets: 3, reps: "10-12",        defaultWeight: 25,  unit: "lb DBs",    notes: "Stand; brace abs; rotation trains rotator cuff for lifts",   increment: 5  },
      { id: "pec-deck-machine",                name: "Pec Deck Machine",                       sets: 3, reps: "12-15",        defaultWeight: 70,  unit: "lbs",       notes: "Pause 1s at full squeeze",                                   increment: 5  },
      { id: "single-arm-cable-lateral-raise",  name: "Single-Arm Cable Lateral Raise",         sets: 2, reps: "12-15/side",   defaultWeight: 10,  unit: "lbs",       notes: "Lead with elbow, no shrug",                                  increment: 5  },
      { id: "overhead-cable-tricep-extension", name: "Overhead Tricep Extension (cable rope)",  sets: 2, reps: "10-12",        defaultWeight: 40,  unit: "lbs",       notes: "Elbows tucked, full stretch overhead",                       increment: 5  },
      { id: "calf-raises",                     name: "Standing Calf Raise",                    sets: 4, reps: "12-15",        defaultWeight: 115, unit: "lbs",       notes: "Full stretch at bottom; 1s pause at top",                    increment: 10 },
    ],
    cooldown: "Cross-body shoulder stretch + doorway pec stretch, 30s × 2 each side",
    hasSauna: false,
  },
  wednesday: {
    warmup: DANCE_WARMUP,
    exercises: [
      { id: "chest-supported-db-row",    name: "Chest-Supported DB Row",               sets: 3, reps: "8-10",     defaultWeight: 40,  unit: "lb DBs", notes: "Chest on 45° incline bench; elbows back; squeeze 1s; no lumbar cheat", increment: 5  },
      { id: "neutral-grip-lat-pulldown", name: "Neutral-Grip Lat Pulldown",            sets: 3, reps: "10-12",    defaultWeight: 100, unit: "lbs",    notes: "Elbows to hips; lean back 15°",                                         increment: 5  },
      { id: "reverse-pec-deck",          name: "Reverse Pec Deck (rear delt machine)", sets: 3, reps: "12-15",    defaultWeight: 50,  unit: "lbs",    notes: "Lead with pinkies; no shrug; posture for Bachata frame",                 increment: 5  },
      { id: "db-hammer-curl",            name: "DB Hammer Curl (alternating)",         sets: 2, reps: "10-12",    defaultWeight: 25,  unit: "lb DBs", notes: "No swing; pause at top; grip strength for partner connection",          increment: 5  },
      { id: "pallof-press",              name: "Pallof Press (cable, half-kneeling)",  sets: 2, reps: "12/side",  defaultWeight: 25,  unit: "lbs",    notes: "Anti-rotation; switch sides; brace hard — core of Bachata frame", increment: 5  },
      { id: "cable-face-pull",           name: "Cable Face Pulls (rope, high)",        sets: 1, reps: "15",       defaultWeight: 35,  unit: "lbs",    notes: "Pull to forehead; elbows high; externally rotate at end",               increment: 5  },
      { id: "calf-raises",               name: "Standing Calf Raise",                  sets: 4, reps: "12-15",    defaultWeight: 115, unit: "lbs",    notes: "Full stretch at bottom; 1s pause at top",                               increment: 10 },
    ],
    cooldown: "Lat + biceps doorway stretch",
    hasSauna: true,
  },
  friday: {
    warmup: DANCE_WARMUP,
    exercises: [
      { id: "leg-press",             name: "Leg Press (high & wide foot)",     sets: 3, reps: "10-12",       defaultWeight: 185, unit: "lbs",       notes: "Stop at 90° knee bend; drive through heels; toes slightly out",                       increment: 10 },
      { id: "machine-hip-thrust",    name: "Machine Hip Thrust",               sets: 3, reps: "10-12",       defaultWeight: 95,  unit: "lbs",       notes: "Zero knee flexion under load; full lockout; chin tucked. If no machine, use DB on bench.", increment: 10 },
      { id: "seated-leg-curl",       name: "Seated Leg Curl",                  sets: 3, reps: "10-12",       defaultWeight: 70,  unit: "lbs",       notes: "Hip-flexed = hamstrings pre-stretched; 2s eccentric",                                      increment: 5  },
      { id: "hip-abduction-machine", name: "Hip Abduction Machine",            sets: 2, reps: "15",          defaultWeight: 90,  unit: "lbs",       notes: "Lean torso slightly forward; biases upper glute med for Bachata footwork",               increment: 5  },
      { id: "calf-raises",           name: "Standing Calf Raise",              sets: 4, reps: "12-15",       defaultWeight: 115, unit: "lbs",       notes: "Full stretch at bottom; 1s pause at top; gastrocnemius focus",                          increment: 10 },
      { id: "copenhagen-plank",      name: "Copenhagen Plank (adductor hold)", sets: 1, reps: "20-30s/side", defaultWeight: 0,   unit: "bodyweight", notes: "Top leg on bench; support on elbow; no hip drop; adductors drive Bachata side-step",    increment: 0, isBodyweight: true },
    ],
    cooldown: "Pigeon stretch + couch stretch, 45s/side",
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

// ─── Day key mapping (constants live in _schema.ts) ───────

export function dayTypeToKey(dayType: string): string {
  return DAY_TYPE_TO_KEY[dayType] || dayType.toLowerCase().split(" ")[0];
}

export function dayKeyToLabel(dayKey: string): string {
  return (DAY_LABELS as Record<string, string>)[dayKey] || dayKey;
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
