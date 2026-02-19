# AI Gym Coach — Implementation Plan

## Context

Build a Python backend for an AI Gym Coach app that syncs workouts to Notion, implements progressive overload, and plans weekly schedules. The user has an existing JSX frontend (React) that defines the feature spec — the Python backend must implement identical data models, exercise library, and progressive overload logic, while adding Notion integration and automated scheduling.

The user is a 32-year-old cabaret dancer (5'11", 24.6% BF, weak knees) training Mon/Tue/Thu 7-8 AM at LA Fitness with shoulder priority for partner lifting. Sunday is Bachata dance (tracked but no gym workout).

---

## JSX Feature Parity Checklist

The following features from the JSX must be fully realized in the Python backend:

### 1. Day Configuration (4 day types)
| Day | Key | Label | Icon | Color | Has Workout |
|-----|-----|-------|------|-------|-------------|
| Mon | `monday` | Monday - Upper Push | 💪 | #3B82F6 | Yes |
| Tue | `tuesday` | Tuesday - Lower Body | 🦵 | #22C55E | Yes |
| Thu | `thursday` | Thursday - Upper Pull | 🏋️ | #A855F7 | Yes |
| Sun | `sunday` | Sunday - Bachata | 💃 | #EC4899 | Tracked only |

Each day config also stores `colorLight` for gradient backgrounds (e.g. `#1e3a5f` for Monday).

### 2. Exact Exercise Library

**Monday — Upper Push** (`hasSauna: false`, `cooldown: "Shoulder + chest stretches"`):
- Warmup: Arm circles 15 fwd/bwd, Band pull-aparts 2x12, Cat-cow stretches 10 reps
- Exercises:

| ID | Name | Sets | Reps | Default Weight | Unit | Increment | Notes |
|----|------|------|------|----------------|------|-----------|-------|
| `incline-db-press` | Incline DB Press | 3 | 10-12 | 47.5 | lb DBs | 2.5 | Control descent |
| `seated-shoulder-press` | Seated Shoulder Press | 4 | 10 | 45 | lb DBs | 2.5 | Key lift for dance |
| `cable-chest-fly` | Cable Chest Fly | 3 | 12 | 30 | lbs/side | 5 | Squeeze at center |
| `lateral-raises` | Lateral Raises | 3 | 15 | 12 | lb DBs | 2.5 | Light weight, strict form |
| `tricep-pushdowns` | Tricep Pushdowns | 3 | 12 | 40 | lbs | 5 | |
| `plank-hold` | Plank Hold | 3 | 30-45s | 0 | bodyweight | 0 | Core stability (isBodyweight) |
| `dead-bug` | Dead Bug | 3 | 10/side | 0 | bodyweight | 0 | Knee-friendly core (isBodyweight) |

**Tuesday — Lower Body** (`hasSauna: true`, `cooldown: null`):
- Warmup: Glute bridges 2x10, Leg swings 10 each leg, Foam roll quads/IT band 2 min
- Exercises:

| ID | Name | Sets | Reps | Default Weight | Unit | Increment | Notes |
|----|------|------|------|----------------|------|-----------|-------|
| `leg-press` | Leg Press (high foot) | 3 | 12 | 195 | lbs | 10 | Reduces knee shear |
| `romanian-deadlift` | Romanian Deadlift | 3 | 10 | 75 | lbs | 5 | Hamstring focus |
| `hip-thrust` | Hip Thrust | 3 | 12 | 45 | lbs | 10 | Glute strength |
| `leg-curl` | Leg Curl | 3 | 12 | 65 | lbs | 5 | |
| `calf-raises` | Calf Raises | 3 | 15 | 120 | lbs | 10 | |
| `hip-abduction` | Side-lying Hip Abduction | 2 | 15/side | 0 | bodyweight | 0 | Hip stability (isBodyweight) |

**Thursday — Upper Pull** (`hasSauna: true`, `cooldown: null`):
- Warmup: Band pull-aparts 2x15, Shoulder dislocates with PVC 10 reps, Thoracic rotations 8 each side
- Exercises:

| ID | Name | Sets | Reps | Default Weight | Unit | Increment | Notes |
|----|------|------|------|----------------|------|-----------|-------|
| `lat-pulldown` | Lat Pulldown | 3 | 10-12 | 100 | lbs | 5 | Full stretch at top |
| `seated-cable-row` | Seated Cable Row | 3 | 12 | 100 | lbs | 5 | Squeeze shoulder blades |
| `face-pulls` | Face Pulls | 4 | 15 | 40 | lbs | 5 | Shoulder health |
| `rear-delt-fly` | Rear Delt Fly | 3 | 15 | 15 | lb DBs | 2.5 | Posture balance |
| `db-shrugs` | DB Shrugs | 3 | 12 | 40 | lb DBs | 5 | Trap development |
| `bicep-curls` | Bicep Curls | 3 | 12 | 25 | lb DBs | 2.5 | |

### 3. Progressive Overload Algorithm (must match JSX `getTargetWeight`)

```
function getTargetWeight(exercise, history, dayKey):
    if exercise.isBodyweight: return 0

    relevant = last 3 COMPLETED sessions for this dayKey
        → find the matching exercise by ID in each session

    if no relevant history: return exercise.defaultWeight

    lastSession = relevant[0]
    completedSets = sets where completed == true
    if no completedSets: return exercise.defaultWeight

    avgWeight = mean(completedSets.weight)
    allRepsHit = every completedSet has reps >= target reps
    lastDifficulty = relevant[0].difficulty  # from workout completion

    if relevant.length >= 2 AND allRepsHit AND (no difficulty OR difficulty <= 3):
        return round_to_half(avgWeight + exercise.increment)

    if lastDifficulty >= 5:
        return max(0, round_to_half(avgWeight - exercise.increment))

    return round_to_half(avgWeight)
```

Key details:
- Uses **difficulty rating** (1-5) from workout completion to gate increases/decreases
- Needs **2+ sessions** of meeting reps before increasing (not just 1)
- Rounds to nearest 0.5 lb: `round(value * 2) / 2`
- Each exercise has its own **increment** value (2.5 for DBs, 5 for cables, 10 for heavy machines)

### 4. Workout Completion Metadata

When a workout is completed, the following must be stored (and synced to Notion):

| Field | Type | Options |
|-------|------|---------|
| `difficulty` | int 1-5 | "Easy 😎", "Moderate 🙂", "Good 💪", "Hard 😤", "Max 🔥" |
| `energy` | string | "⚡ High", "😐 Medium", "😴 Low" |
| `kneeComfort` | string | "✅ No pain", "⚠️ Mild discomfort", "🛑 Pain" |
| `mood` | string | "😊 Great", "😌 Good", "😐 Neutral", "😓 Tired" |
| `notes` | string | Free text |
| `sauna` | boolean | Whether sauna was used |
| `duration` | int | Minutes elapsed |

Note: Difficulty is stored as an int (1-5) but has display labels with emojis. Energy, knee comfort, and mood are stored as the full emoji+text string (matching the JSX UI).

### 5. Workout Session Data Structure

Each workout session must track:
```
WorkoutSession:
    id: string (timestamp)
    dayKey: "monday" | "tuesday" | "thursday" | "sunday"
    date: "YYYY-MM-DD"
    startTime: timestamp
    endTime: timestamp
    duration: minutes
    warmupDone: boolean
    completed: boolean
    exercises: [
        {
            id: string (exercise slug)
            name: string
            targetWeight: float (computed by progressive overload)
            unit: string
            sets: [
                { weight: float|null, reps: int|null, completed: boolean }
            ]
            notes: string
            isBodyweight: boolean
        }
    ]
    # Completion metadata:
    difficulty: int (1-5)
    energy: string
    kneeComfort: string
    mood: string
    notes: string
    sauna: boolean
```

**Set completion rule**: A set is `completed: true` when both `weight` is not null AND `reps` is not null (for weighted exercises). For bodyweight exercises, only `reps` needs to be non-null. Weight and reps are always tracked as **separate fields** — both values must be preserved in Notion.

### 5a. Quick-Log Set

The JSX provides a "quick log" feature (⚡ button) that auto-fills a set with the exercise's `targetWeight` and parsed target reps (from the `reps` string, e.g. "10-12" → 10, or "12" → 12) in one action. This must be supported in the backend model and CLI.

### 5b. Rest Timer

After logging a set, a 90-second rest timer starts automatically. The timer counts down and can be skipped. This is a UI-only feature (not persisted to Notion) but must be supported in the CLI's interactive workout mode.

### 6. Weight Trend Analysis

`getWeightTrend(exercise, history, dayKey)` — returns last 3 sessions' average weights for an exercise, used for displaying progression arrows in the UI.

### 7. Weekly Progress Tracking

Count completed workouts in the current week (Monday through Sunday) vs. 3 planned. Must detect which day of the week it is to show "today's workout."

### 8. Profile Model

```
Profile:
    name: string
    goals: string (default: "Stress-free weight loss + shoulder strength for cabaret lifts")
    schedule: string (default: "Tue/Thu/Mon @ 7am")
    gym: string (default: "LA Fitness")
    sessionDuration: int (default: 50)
    kneeProtocol: boolean (default: true)
    setupComplete: boolean
```

---

## Notion Database Structure (from screenshots)

**Top-level "Workout Log" database columns:**
- `Workout Name` (title) — e.g., "Week 8 Monday Upper Push"
- `Date` (date)
- `Day Type` (select) — "Monday - Upper Push", "Tuesday - Lower Body", "Thursday - Upper Pull"
- `Duration` (number)

**Inside each workout page (child blocks):**
- Warm-up heading + bullet list of warmup exercises
- **Weight Tracking Log** (inline child database) with columns:
  - `Exercise` (title)
  - `Suggested` (text — target weight from progressive overload)
  - `Sets x Reps` (text — e.g., "3x10-12")
  - `Set 1`, `Set 2`, `Set 3`, `Set 4` (text — stores **weight × reps**, e.g. "47.5 × 12", or just reps for bodyweight e.g. "10")
  - `Notes` (text)
- Exercise Details heading + toggle blocks with form cues

**Important**: Each Set column must encode both weight and reps as `"weight × reps"` to preserve both values from the JSX data model. When reading back, parse on `" × "` to recover `SetLog.weight` and `SetLog.reps`. For bodyweight exercises, store just the rep count (e.g. `"10"`).

**Additional page-level properties to add** (for completion metadata):
- `Difficulty` (select: "1", "2", "3", "4", "5")
- `Energy` (select: "⚡ High", "😐 Medium", "😴 Low")
- `Knee Comfort` (select: "✅ No pain", "⚠️ Mild discomfort", "🛑 Pain")
- `Mood` (select: "😊 Great", "😌 Good", "😐 Neutral", "😓 Tired")
- `Sauna` (checkbox)
- `Workout Notes` (rich text)

We must use **both** the Notion Database API (query/create pages) and **Blocks API** (`blocks.children.list/append`) to read/write the nested exercise tables.

---

## Project Structure

```
ai-gym-coach/
├── pyproject.toml
├── LICENSE
├── src/
│   └── gym_coach/
│       ├── __init__.py
│       ├── cli.py                  # Typer CLI entry point
│       ├── config.py               # Config + state management (YAML + JSON)
│       ├── models.py               # Pydantic models (matching JSX data structures)
│       ├── exercises.py            # Exercise library (exact copy of JSX EXERCISES)
│       ├── progressive_overload.py # getTargetWeight + getWeightTrend algorithms
│       ├── notion_client.py        # Notion API wrapper (database + blocks)
│       ├── notion_reader.py        # Read workout history from Notion
│       ├── notion_writer.py        # Write workouts + completion data to Notion
│       ├── planner.py              # Weekly workout generation
│       └── scheduler.py            # Cron job setup
└── tests/
    └── (future)
```

## Dependencies (`pyproject.toml`)

- `httpx>=0.27.0` — HTTP client for Notion REST API (replaces `notion-client` SDK)
- `typer[all]>=0.15.0` — CLI framework
- `pydantic>=2.0` — Data validation
- `pyyaml>=6.0` — Config files
- `rich>=13.0` — Console output
- `python-dateutil>=2.9` — Date math
- `python-crontab>=3.0` — Cron scheduling

---

## Prerequisites — Notion Access

**Status: COMPLETED** — Notion API access has been verified.

- **API token**: Stored in env var `$NOTION_API` (starts with `ntn_...`)
- **AI Gym Coach page ID**: `30cfcd91-d09f-806c-8149-eee20d887057` — confirmed read/write access
- **Workout Log collection ID**: `4e387a50-855d-43b2-b2a6-a814bc3e05ab`
- **Method**: Use Notion REST API directly via `httpx` (not the `notion-client` Python SDK). All requests include `Authorization: Bearer $NOTION_API` and `Notion-Version: 2022-06-28` headers.
- **Scope**: Only modify the "AI Gym Coach" page and its sub-pages. Never touch other Notion pages.

---

## Implementation Steps

### Step 0: Verify Notion Access
- Use `httpx` / `curl` with `$NOTION_API` token to hit Notion REST API
- Query the Workout Log database
- Read a sample workout page's child blocks
- Find and query the Weight Tracking Log inline database
- Print parsed exercise data to confirm the schema matches our models
- **This step gates everything else** — if Notion access fails, we fix it before proceeding
- **Already completed** — access verified via curl, page ID and collection ID confirmed

### Step 1: Project Scaffolding
- Create `pyproject.toml` with `[project.scripts] coach = "gym_coach.cli:app"`
- Create package structure with all module files

### Step 2: Models (`models.py`)

Pydantic models that exactly mirror the JSX data structures:

- `DayConfig` — key, label, color, colorLight, icon (from JSX `DAY_CONFIG`)
- `ExerciseTemplate` — from JSX `EXERCISES[day].exercises[i]`: id, name, sets, reps, defaultWeight, unit, notes, increment, isBodyweight (default False)
- `DayTemplate` — from JSX `EXERCISES[day]`: warmup (list[str]), exercises (list[ExerciseTemplate]), cooldown (str|None), hasSauna (bool)
- `SetLog` — weight (float|None), reps (int|None), completed (bool, computed: True when weight is not None AND reps is not None for weighted; just reps not None for bodyweight)
- `ExerciseLog` — id, name, targetWeight, unit, sets (list[SetLog]), notes, isBodyweight
- `WorkoutSession` — id, dayKey, date, startTime, endTime, duration, warmupDone, completed, exercises (list[ExerciseLog]), difficulty, energy, kneeComfort, mood, notes, sauna
- `Profile` — name, goals, schedule, gym, sessionDuration, kneeProtocol, setupComplete
- `WeightTrendPoint` — date, avgWeight

### Step 3: Exercise Library (`exercises.py`)

Exact Python translation of JSX `EXERCISES` constant and `DAY_CONFIG`:

```python
DAY_CONFIG = {
    1: DayConfig(key="monday", label="Monday - Upper Push", color="#3B82F6", color_light="#1e3a5f", icon="💪"),
    2: DayConfig(key="tuesday", label="Tuesday - Lower Body", color="#22C55E", color_light="#1a3d2a", icon="🦵"),
    4: DayConfig(key="thursday", label="Thursday - Upper Pull", color="#A855F7", color_light="#3b1d5e", icon="🏋️"),
    0: DayConfig(key="sunday", label="Sunday - Bachata", color="#EC4899", color_light="#4a1a30", icon="💃"),
}

EXERCISES = {
    "monday": DayTemplate(
        warmup=["Arm circles: 15 forward, 15 backward", ...],
        exercises=[
            ExerciseTemplate(id="incline-db-press", name="Incline DB Press",
                           sets=3, reps="10-12", defaultWeight=47.5,
                           unit="lb DBs", increment=2.5, notes="Control descent"),
            ...  # all 7 exercises exactly as JSX
        ],
        cooldown="Shoulder + chest stretches",
        hasSauna=False,
    ),
    "tuesday": DayTemplate(...),  # all 6 exercises exactly as JSX
    "thursday": DayTemplate(...),  # all 6 exercises exactly as JSX
}
```

### Step 4: Progressive Overload (`progressive_overload.py`)

Direct port of JSX `getTargetWeight` and `getWeightTrend`:

- `get_target_weight(exercise: ExerciseTemplate, history: list[WorkoutSession], day_key: str) -> float`
  - Identical logic: 3-session lookback, avgWeight, allRepsHit, difficulty gating, increment/decrement, round-to-half
- `get_weight_trend(exercise: ExerciseTemplate, history: list[WorkoutSession], day_key: str) -> list[WeightTrendPoint]`
  - Returns last 3 sessions' {date, avgWeight}

### Step 5: Config (`config.py`)

**Config** (`~/.config/gym-coach/config.yaml`):
```yaml
notion_token: "secret_..."
database_id: "..."
profile:
  name: ""
  goals: "Stress-free weight loss + shoulder strength for cabaret lifts"
  schedule: "Tue/Thu/Mon @ 7am"
  gym: "LA Fitness"
  sessionDuration: 50
  kneeProtocol: true
  setupComplete: false
```

**State** (`~/.config/gym-coach/state.json`):
```json
{
  "current_week": 8,
  "last_sync": "2026-02-16T08:00:00",
  "workout_history": []
}
```

State file caches workout history locally (synced from Notion) so the progressive overload algorithm can run without hitting the API every time.

### Step 6: Notion Client (`notion_client.py`)

Thin wrapper around **Notion REST API** using `httpx` (not the `notion-client` SDK). Reads token from `$NOTION_API` env var. All requests use `Notion-Version: 2022-06-28` header.

- `query_database(database_id, filters)` — POST `/databases/{id}/query`
- `get_page(page_id)` — GET `/pages/{id}`
- `get_page_blocks(page_id)` — GET `/blocks/{id}/children` (paginated)
- `find_child_database(page_id)` — scan blocks for `child_database` type (the Weight Tracking Log)
- `query_child_database(db_id)` — get exercise rows from the inline table
- `create_page(database_id, properties, children)` — POST `/pages` with nested blocks
- `update_page_properties(page_id, properties)` — PATCH `/pages/{id}`
- `append_block_children(block_id, children)` — PATCH `/blocks/{id}/children`
- `update_block(block_id, data)` — PATCH `/blocks/{id}`
- `trash_page(page_id)` — PATCH `/pages/{id}` with `{"in_trash": true}`

### Step 7: Notion Reader (`notion_reader.py`)

- `fetch_recent_workouts(weeks=4) -> list[WorkoutSession]`
  - Queries top-level database sorted by date
  - For each page: reads properties + finds child database + parses exercise rows
  - Maps Notion data → `WorkoutSession` model
  - Parses `Set 1`-`Set 4` text columns into `SetLog` objects by splitting `"weight × reps"` format
  - Reads completion metadata from page properties (difficulty, energy, etc.)

- `parse_workout_page(page_id) -> WorkoutSession`
  - Reads page properties (name, date, day_type, duration, difficulty, energy, kneeComfort, mood, sauna, notes)
  - Finds child database block via `blocks.children.list`
  - Queries child database to get exercise rows
  - Converts each row to `ExerciseLog` with `SetLog` entries

### Step 8: Notion Writer (`notion_writer.py`)

- `create_workout(session: WorkoutSession) -> str (page_id)`
  Creates a page with:
  1. **Properties**: Workout Name (e.g., "Week 8 Monday Upper Push"), Date, Day Type, Duration
  2. **Child blocks**:
     - Heading "Warm-up (5 min)" + bullet items from warmup list
     - Inline child database "Weight Tracking Log" with rows for each exercise (Exercise, Suggested, Sets x Reps, Set 1-4, Notes)
     - Heading "Exercise Details" + toggle blocks with form cues

- `update_workout_completion(page_id, session: WorkoutSession)`
  - Updates page properties with completion metadata (difficulty, energy, kneeComfort, mood, sauna, notes, duration)
  - Updates Set 1-4 columns in the child database with actual weight × reps data

- `sync_set_data(page_id, exercise_id, sets: list[SetLog])`
  - Updates the Set 1-4 columns for a specific exercise row in the child database
  - Format: `"weight × reps"` (e.g. `"47.5 × 12"`) for weighted exercises, `"reps"` (e.g. `"10"`) for bodyweight

- `format_set_value(set_log: SetLog, is_bodyweight: bool) -> str`
  - Formats a SetLog into the Notion text column value
  - Weighted: `f"{weight} × {reps}"` | Bodyweight: `f"{reps}"` | Incomplete: `""`

- `parse_set_value(text: str, is_bodyweight: bool) -> SetLog`
  - Parses a Notion text column value back into a SetLog
  - Splits on `" × "` to recover weight and reps

### Step 9: Planner (`planner.py`)

- `plan_week(history: list[WorkoutSession], week_number: int) -> list[WorkoutSession]`
  - Generates 3 workout sessions for the coming Mon/Tue/Thu
  - For each day: loads the `DayTemplate`, computes `targetWeight` for each exercise using progressive overload
  - Names workouts as "Week {N} {Day Label}" (e.g., "Week 9 Monday Upper Push")
  - Returns unsaved `WorkoutSession` objects ready to be written to Notion

- `get_weekly_progress(history: list[WorkoutSession]) -> dict`
  - Counts completed workouts this week
  - Returns {completed: int, planned: 3, days_done: ["monday", ...]}

### Step 10: CLI (`cli.py`)

Typer commands:

- **`coach init`** — Prompts for Notion token + database ID, tests connection, discovers schema, writes config, marks setupComplete
- **`coach plan-week`** — Syncs recent history from Notion, runs progressive overload for each day, creates 3 workout pages in Notion for next week
- **`coach sync`** — Fetches all recent workouts from Notion, updates local state cache, displays summary
- **`coach review`** — Reads history, shows: weekly progress (X/3), weight trends per exercise, upcoming target weights, completion metadata trends (avg difficulty, knee comfort alerts)
- **`coach status`** — Quick view: today's day type, whether workout exists for today, next planned workout
- **`coach schedule`** — Sets up cron job to run `coach plan-week` every Sunday at 8 PM

### Step 11: Scheduler (`scheduler.py`)

- Uses `python-crontab` for cron entry
- Runs `coach plan-week` every Sunday evening
- Logs to `~/.config/gym-coach/scheduler.log`

---

## Implementation Sequence

**Phase A** — Scaffolding + Models + Exercise Library (Steps 1-3)
Create project structure, all Pydantic models, and the exercise library. These are the foundation everything else depends on.

**Phase B** — Progressive Overload (Step 4)
Port the JSX algorithm exactly. This can be tested with mock data before Notion integration exists.

**Phase C** — Config (Step 5)
Config and state management. Needed before Notion integration.

**Phase D** — Notion Integration (Steps 6-8)
Build client, reader, writer. Most complex part due to nested page structure with inline databases.

**Phase E** — Planner + CLI + Scheduler (Steps 9-11)
Wire everything together. Planner uses progressive overload + exercise library. CLI calls planner + Notion. Scheduler automates CLI.

---

## Verification

1. **Unit test progressive overload**: Mock 3 sessions of history, verify `get_target_weight` matches JSX behavior (increase when 2+ sessions meet reps and difficulty <= 3, decrease when difficulty >= 5, hold otherwise)
2. **`coach init`**: Run, provide Notion token + DB ID, confirm config file written and connection successful
3. **`coach sync`**: Fetch existing workouts from Notion, confirm exercise data parsed correctly from nested child databases
4. **`coach review`**: Display weight trends, weekly progress, completion metadata — verify data matches Notion
5. **`coach plan-week`**: Generate next week's workouts with computed target weights, create pages in Notion, verify page structure matches existing format (warmup + Weight Tracking Log table + exercise details)
6. **Manual Notion check**: Open Notion, confirm new pages have identical structure to existing ones (same columns, same nested layout)
7. **Progressive overload end-to-end**: After logging a workout with all reps hit at difficulty 3, run plan-week again — verify exactly one exercise per day has an increased target weight
