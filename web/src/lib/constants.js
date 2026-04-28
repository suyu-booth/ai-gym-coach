// ─── DAY CONFIGURATION ─────────────────────────────────────
// Keyed by JS getDay(): Sunday=0, Monday=1, etc.
// Glyph names map into <Glyph name=...> (see components/Glyph.jsx).

import { palette } from "./theme.js";

export const DAY_CONFIG = {
  2: { key: "tuesday",   label: "Tuesday - Upper Push",   short: "Upper Push", color: palette.horizon, colorLight: "rgba(231,111,81,0.18)",  glyph: "sun-rising" },
  3: { key: "wednesday", label: "Wednesday - Upper Pull", short: "Upper Pull", color: palette.coral,   colorLight: "rgba(244,162,97,0.18)",  glyph: "sun-arc" },
  5: { key: "friday",    label: "Friday - Legs",          short: "Legs",       color: palette.sand,    colorLight: "rgba(233,196,106,0.20)", glyph: "sun-noon" },
  0: { key: "sunday",    label: "Sunday - Bachata",       short: "Bachata",    color: "#b07a8c",       colorLight: "rgba(176,122,140,0.18)", glyph: "sun-set" },
};

// ─── DANCE WARMUP (shared) ─────────────────────────────────

const DANCE_WARMUP = [
  "Bachata basic step in place (side-to-side): 2 × 30s",
  "Hip circles: 15 each direction",
  "Shoulder rolls and arm swings: 10 each direction",
  "Body rolls (hip-to-shoulder wave): 10 reps",
];

// ─── EXERCISE LIBRARY ──────────────────────────────────────

export const EXERCISES = {
  tuesday: {
    warmup: DANCE_WARMUP,
    exercises: [
      { id: "flat-db-bench-press",            name: "Flat DB Bench Press",                  sets: 4, reps: "8-10",       defaultWeight: 45,  unit: "lb DBs", notes: "Elbows ~45°, full ROM, controlled eccentric",              increment: 5  },
      { id: "standing-db-arnold-press",        name: "Standing DB Arnold Press",             sets: 3, reps: "10-12",      defaultWeight: 25,  unit: "lb DBs", notes: "Stand; brace abs; rotation trains rotator cuff for lifts", increment: 5  },
      { id: "pec-deck-machine",                name: "Pec Deck Machine",                     sets: 3, reps: "12-15",      defaultWeight: 70,  unit: "lbs",    notes: "Pause 1s at full squeeze",                                 increment: 5  },
      { id: "single-arm-cable-lateral-raise",  name: "Single-Arm Cable Lateral Raise",       sets: 2, reps: "12-15/side", defaultWeight: 10,  unit: "lbs",    notes: "Lead with elbow, no shrug",                                increment: 5  },
      { id: "overhead-cable-tricep-extension", name: "Overhead Tricep Extension (cable rope)", sets: 2, reps: "10-12",   defaultWeight: 40,  unit: "lbs",    notes: "Elbows tucked, full stretch overhead",                     increment: 5  },
      { id: "calf-raises",                     name: "Standing Calf Raise",                  sets: 4, reps: "12-15",      defaultWeight: 115, unit: "lbs",    notes: "Full stretch at bottom; 1s pause at top",                  increment: 10 },
    ],
    cooldown: "Cross-body shoulder stretch + doorway pec stretch, 30s × 2 each side",
    hasSauna: false,
  },
  wednesday: {
    warmup: DANCE_WARMUP,
    exercises: [
      { id: "chest-supported-db-row",   name: "Chest-Supported DB Row",              sets: 3, reps: "8-10",    defaultWeight: 40,  unit: "lb DBs", notes: "Chest on 45° incline bench; elbows back; squeeze 1s; no lumbar cheat",  increment: 5  },
      { id: "neutral-grip-lat-pulldown", name: "Neutral-Grip Lat Pulldown",          sets: 3, reps: "10-12",   defaultWeight: 100, unit: "lbs",    notes: "Elbows to hips; lean back 15°",                                         increment: 5  },
      { id: "reverse-pec-deck",          name: "Reverse Pec Deck (rear delt machine)", sets: 3, reps: "12-15", defaultWeight: 50,  unit: "lbs",    notes: "Lead with pinkies; no shrug; posture for Bachata frame",                increment: 5  },
      { id: "db-hammer-curl",            name: "DB Hammer Curl (alternating)",        sets: 2, reps: "10-12",  defaultWeight: 25,  unit: "lb DBs", notes: "No swing; pause at top; grip strength for partner connection",          increment: 5  },
      { id: "pallof-press",              name: "Pallof Press (cable, half-kneeling)", sets: 2, reps: "12/side", defaultWeight: 25, unit: "lbs",    notes: "Anti-rotation; switch sides; brace hard — core of Bachata frame",       increment: 5  },
      { id: "cable-face-pull",           name: "Cable Face Pulls (rope, high)",       sets: 1, reps: "15",      defaultWeight: 35, unit: "lbs",    notes: "Pull to forehead; elbows high; externally rotate at end",               increment: 5  },
      { id: "calf-raises",               name: "Standing Calf Raise",                 sets: 4, reps: "12-15",  defaultWeight: 115, unit: "lbs",   notes: "Full stretch at bottom; 1s pause at top",                               increment: 10 },
    ],
    cooldown: "Lat + biceps doorway stretch",
    hasSauna: true,
  },
  friday: {
    warmup: DANCE_WARMUP,
    exercises: [
      { id: "leg-press",             name: "Leg Press (high & wide foot)",       sets: 3, reps: "10-12",     defaultWeight: 185, unit: "lbs",    notes: "Stop at 90° knee bend; drive through heels; toes slightly out",                    increment: 10 },
      { id: "machine-hip-thrust",    name: "Machine Hip Thrust",                 sets: 3, reps: "10-12",     defaultWeight: 95,  unit: "lbs",    notes: "Zero knee flexion under load; full lockout; chin tucked. If no machine, use DB on bench.", increment: 10 },
      { id: "seated-leg-curl",       name: "Seated Leg Curl",                    sets: 3, reps: "10-12",     defaultWeight: 70,  unit: "lbs",    notes: "Hip-flexed = hamstrings pre-stretched; 2s eccentric",                              increment: 5  },
      { id: "hip-abduction-machine", name: "Hip Abduction Machine",              sets: 2, reps: "15",        defaultWeight: 90,  unit: "lbs",    notes: "Lean torso slightly forward; biases upper glute med for Bachata footwork",         increment: 5  },
      { id: "calf-raises",           name: "Standing Calf Raise",                sets: 4, reps: "12-15",     defaultWeight: 115, unit: "lbs",    notes: "Full stretch at bottom; 1s pause at top; gastrocnemius focus",                    increment: 10 },
      { id: "copenhagen-plank",      name: "Copenhagen Plank (adductor hold)",   sets: 1, reps: "20-30s/side", defaultWeight: 0, unit: "bodyweight", notes: "Top leg on bench; support on elbow; no hip drop; adductors drive Bachata side-step", increment: 0, isBodyweight: true },
    ],
    cooldown: "Pigeon stretch + couch stretch, 45s/side",
    hasSauna: true,
  },
};

// ─── DISPLAY CONSTANTS ─────────────────────────────────────
// Notion-bound option values (with emojis) MUST stay intact for the API.
// `display` is the label rendered in the editorial UI.

export const DIFFICULTY_LABELS = ["", "Easy \u{1F60E}", "Moderate \u{1F642}", "Good \u{1F4AA}", "Hard \u{1F624}", "Max \u{1F525}"];
export const DIFFICULTY_NAMES = ["", "Easy", "Moderate", "Good", "Hard", "Max"];

export const ENERGY_OPTIONS = [
  { value: "⚡ High",   display: "High" },
  { value: "\u{1F610} Medium", display: "Medium" },
  { value: "\u{1F634} Low",  display: "Low" },
];
export const KNEE_COMFORT_OPTIONS = [
  { value: "✅ No pain", display: "No pain" },
  { value: "⚠️ Mild discomfort", display: "Mild" },
  { value: "\u{1F6D1} Pain", display: "Pain" },
];
export const MOOD_OPTIONS = [
  { value: "\u{1F60A} Great", display: "Great" },
  { value: "\u{1F60C} Good",  display: "Good" },
  { value: "\u{1F610} Neutral", display: "Neutral" },
  { value: "\u{1F613} Tired", display: "Tired" },
];

export const DEFAULT_PROFILE = {
  name: "",
  goals: "Stress-free weight loss + shoulder strength for cabaret lifts",
  schedule: "Tue/Wed/Fri @ 7am",
  gym: "LA Fitness",
  sessionDuration: 50,
  kneeProtocol: true,
  setupComplete: false,
};
