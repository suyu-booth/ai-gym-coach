// ─── DAY CONFIGURATION ─────────────────────────────────────
// Keyed by JS getDay(): Sunday=0, Monday=1, etc.

export const DAY_CONFIG = {
  1: { key: "monday", label: "Monday - Upper Push", color: "#3B82F6", colorLight: "#1e3a5f", icon: "\u{1F4AA}" },
  2: { key: "tuesday", label: "Tuesday - Lower Body", color: "#22C55E", colorLight: "#1a3d2a", icon: "\u{1F9B5}" },
  4: { key: "thursday", label: "Thursday - Upper Pull", color: "#A855F7", colorLight: "#3b1d5e", icon: "\u{1F3CB}\u{FE0F}" },
  0: { key: "sunday", label: "Sunday - Bachata", color: "#EC4899", colorLight: "#4a1a30", icon: "\u{1F483}" },
};

// ─── EXERCISE LIBRARY ──────────────────────────────────────

export const EXERCISES = {
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

// ─── DISPLAY CONSTANTS ─────────────────────────────────────

export const DIFFICULTY_LABELS = ["", "Easy \u{1F60E}", "Moderate \u{1F642}", "Good \u{1F4AA}", "Hard \u{1F624}", "Max \u{1F525}"];
export const DIFFICULTY_COLORS = ["", "#22C55E", "#84CC16", "#EAB308", "#F97316", "#EF4444"];
export const ENERGY_OPTIONS = ["\u26A1 High", "\u{1F610} Medium", "\u{1F634} Low"];
export const KNEE_COMFORT_OPTIONS = ["\u2705 No pain", "\u26A0\uFE0F Mild discomfort", "\u{1F6D1} Pain"];
export const MOOD_OPTIONS = ["\u{1F60A} Great", "\u{1F60C} Good", "\u{1F610} Neutral", "\u{1F613} Tired"];

export const DEFAULT_PROFILE = {
  name: "",
  goals: "Stress-free weight loss + shoulder strength for cabaret lifts",
  schedule: "Tue/Thu/Mon @ 7am",
  gym: "LA Fitness",
  sessionDuration: 50,
  kneeProtocol: true,
  setupComplete: false,
};
