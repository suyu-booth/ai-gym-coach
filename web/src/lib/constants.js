// ─── DAY CONFIGURATION ─────────────────────────────────────
// Keyed by JS getDay(): Sunday=0, Monday=1, etc.
// Glyph names map into <Glyph name=...> (see components/Glyph.jsx).

import { palette } from "./theme.js";

export const DAY_CONFIG = {
  1: { key: "monday",   label: "Monday - Upper Push",   short: "Upper Push", color: palette.horizon, colorLight: "rgba(231,111,81,0.18)",  glyph: "sun-rising" },
  2: { key: "tuesday",  label: "Tuesday - Lower Body",  short: "Lower Body", color: palette.sand,    colorLight: "rgba(233,196,106,0.20)", glyph: "sun-noon" },
  4: { key: "thursday", label: "Thursday - Upper Pull", short: "Upper Pull", color: palette.coral,   colorLight: "rgba(244,162,97,0.18)",  glyph: "sun-arc" },
  0: { key: "sunday",   label: "Sunday - Bachata",      short: "Bachata",    color: "#b07a8c",       colorLight: "rgba(176,122,140,0.18)", glyph: "sun-set" },
};

// ─── EXERCISE LIBRARY ──────────────────────────────────────

export const EXERCISES = {
  monday: {
    warmup: ["Arm circles: 15 forward, 15 backward", "Band pull-aparts: 2 × 12", "Cat-cow stretches: 10 reps"],
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
    warmup: ["Glute bridges: 2 × 10", "Leg swings: 10 each leg", "Foam roll quads/IT band: 2 min"],
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
    warmup: ["Band pull-aparts: 2 × 15", "Shoulder dislocates with PVC: 10 reps", "Thoracic rotations: 8 each side"],
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
  schedule: "Tue/Thu/Mon @ 7am",
  gym: "LA Fitness",
  sessionDuration: 50,
  kneeProtocol: true,
  setupComplete: false,
};
