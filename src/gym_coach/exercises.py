"""Exercise library — Tue/Wed/Fri split. Systematic redesign with Bachata dance carryover."""

from gym_coach.models import DayConfig, DayTemplate, ExerciseTemplate

# ─── DAY_CONFIG ──────────────────────────────────────────────
# Keyed by Python weekday: Monday=0 ... Sunday=6
# (JSX uses JS getDay(): Sunday=0, Monday=1, etc.)

DAY_CONFIG: dict[int, DayConfig] = {
    1: DayConfig(  # Tuesday
        key="tuesday",
        label="Tuesday - Upper Push",
        color="#e76f51",
        color_light="#4a1e14",
        icon="💪",
    ),
    2: DayConfig(  # Wednesday
        key="wednesday",
        label="Wednesday - Upper Pull",
        color="#f4a261",
        color_light="#4a2a14",
        icon="🏋️",
    ),
    4: DayConfig(  # Friday
        key="friday",
        label="Friday - Legs",
        color="#e9c46a",
        color_light="#3d3010",
        icon="🦵",
    ),
    6: DayConfig(  # Sunday
        key="sunday",
        label="Sunday - Bachata",
        color="#EC4899",
        color_light="#4a1a30",
        icon="💃",
    ),
}

# Lookup by day key string
DAY_CONFIG_BY_KEY: dict[str, DayConfig] = {cfg.key: cfg for cfg in DAY_CONFIG.values()}

# ─── DANCE WARMUP (shared across all three training days) ─────

DANCE_WARMUP = [
    "Bachata basic step in place (side-to-side): 2 × 30s",
    "Hip circles: 15 each direction",
    "Shoulder rolls and arm swings: 10 each direction",
    "Body rolls (hip-to-shoulder wave): 10 reps",
]

# ─── EXERCISES ───────────────────────────────────────────────

EXERCISES: dict[str, DayTemplate] = {
    "tuesday": DayTemplate(
        warmup=DANCE_WARMUP,
        exercises=[
            ExerciseTemplate(
                id="flat-db-bench-press",
                name="Flat DB Bench Press",
                sets=4,
                reps="8-10",
                defaultWeight=45,
                unit="lb DBs",
                increment=5,
                notes="Elbows ~45°, full ROM, controlled eccentric",
            ),
            ExerciseTemplate(
                id="standing-db-arnold-press",
                name="Standing DB Arnold Press",
                sets=3,
                reps="10-12",
                defaultWeight=25,
                unit="lb DBs",
                increment=5,
                notes="Stand; brace abs; rotation trains rotator cuff for lifts",
            ),
            ExerciseTemplate(
                id="pec-deck-machine",
                name="Pec Deck Machine",
                sets=3,
                reps="12-15",
                defaultWeight=70,
                unit="lbs",
                increment=5,
                notes="Pause 1s at full squeeze",
            ),
            ExerciseTemplate(
                id="single-arm-cable-lateral-raise",
                name="Single-Arm Cable Lateral Raise",
                sets=2,
                reps="12-15/side",
                defaultWeight=10,
                unit="lbs",
                increment=5,
                notes="Lead with elbow, no shrug",
            ),
            ExerciseTemplate(
                id="overhead-cable-tricep-extension",
                name="Overhead Tricep Extension (cable rope)",
                sets=2,
                reps="10-12",
                defaultWeight=40,
                unit="lbs",
                increment=5,
                notes="Elbows tucked, full stretch overhead",
            ),
            ExerciseTemplate(
                id="calf-raises",
                name="Standing Calf Raise",
                sets=4,
                reps="12-15",
                defaultWeight=115,
                unit="lbs",
                increment=10,
                notes="Full stretch at bottom; 1s pause at top",
            ),
        ],
        cooldown="Cross-body shoulder stretch + doorway pec stretch, 30s × 2 each side",
        hasSauna=False,
    ),
    "wednesday": DayTemplate(
        warmup=DANCE_WARMUP,
        exercises=[
            ExerciseTemplate(
                id="chest-supported-db-row",
                name="Chest-Supported DB Row",
                sets=3,
                reps="8-10",
                defaultWeight=40,
                unit="lb DBs",
                increment=5,
                notes="Chest on 45° incline bench; elbows back; squeeze 1s; no lumbar cheat",
            ),
            ExerciseTemplate(
                id="neutral-grip-lat-pulldown",
                name="Neutral-Grip Lat Pulldown",
                sets=3,
                reps="10-12",
                defaultWeight=100,
                unit="lbs",
                increment=5,
                notes="Elbows to hips; lean back 15°",
            ),
            ExerciseTemplate(
                id="reverse-pec-deck",
                name="Reverse Pec Deck (rear delt machine)",
                sets=3,
                reps="12-15",
                defaultWeight=50,
                unit="lbs",
                increment=5,
                notes="Lead with pinkies; no shrug; posture for Bachata frame",
            ),
            ExerciseTemplate(
                id="db-hammer-curl",
                name="DB Hammer Curl (alternating)",
                sets=2,
                reps="10-12",
                defaultWeight=25,
                unit="lb DBs",
                increment=5,
                notes="No swing; pause at top; grip strength for partner connection",
            ),
            ExerciseTemplate(
                id="pallof-press",
                name="Pallof Press (cable, half-kneeling)",
                sets=2,
                reps="12/side",
                defaultWeight=25,
                unit="lbs",
                increment=5,
                notes="Anti-rotation; switch sides; brace hard — core of Bachata frame",
            ),
            ExerciseTemplate(
                id="cable-face-pull",
                name="Cable Face Pulls (rope, high)",
                sets=1,
                reps="15",
                defaultWeight=35,
                unit="lbs",
                increment=5,
                notes="Pull to forehead; elbows high; externally rotate at end",
            ),
            ExerciseTemplate(
                id="calf-raises",
                name="Standing Calf Raise",
                sets=4,
                reps="12-15",
                defaultWeight=115,
                unit="lbs",
                increment=10,
                notes="Full stretch at bottom; 1s pause at top",
            ),
        ],
        cooldown="Lat + biceps doorway stretch",
        hasSauna=True,
    ),
    "friday": DayTemplate(
        warmup=DANCE_WARMUP,
        exercises=[
            ExerciseTemplate(
                id="leg-press",
                name="Leg Press (high & wide foot)",
                sets=3,
                reps="10-12",
                defaultWeight=185,
                unit="lbs",
                increment=10,
                notes="Stop at 90° knee bend; drive through heels; toes slightly out",
            ),
            ExerciseTemplate(
                id="machine-hip-thrust",
                name="Machine Hip Thrust",
                sets=3,
                reps="10-12",
                defaultWeight=95,
                unit="lbs",
                increment=10,
                notes="Zero knee flexion under load; full lockout; chin tucked. If no machine, use DB on bench.",
            ),
            ExerciseTemplate(
                id="seated-leg-curl",
                name="Seated Leg Curl",
                sets=3,
                reps="10-12",
                defaultWeight=70,
                unit="lbs",
                increment=5,
                notes="Hip-flexed = hamstrings pre-stretched; 2s eccentric",
            ),
            ExerciseTemplate(
                id="hip-abduction-machine",
                name="Hip Abduction Machine",
                sets=2,
                reps="15",
                defaultWeight=90,
                unit="lbs",
                increment=5,
                notes="Lean torso slightly forward; biases upper glute med for Bachata footwork",
            ),
            ExerciseTemplate(
                id="calf-raises",
                name="Standing Calf Raise",
                sets=4,
                reps="12-15",
                defaultWeight=115,
                unit="lbs",
                increment=10,
                notes="Full stretch at bottom; 1s pause at top; gastrocnemius focus",
            ),
            ExerciseTemplate(
                id="copenhagen-plank",
                name="Copenhagen Plank (adductor hold)",
                sets=1,
                reps="20-30s/side",
                defaultWeight=0,
                unit="bodyweight",
                increment=0,
                notes="Top leg on bench; support on elbow; no hip drop; adductors drive Bachata side-step",
                isBodyweight=True,
            ),
        ],
        cooldown="Pigeon stretch + couch stretch, 45s/side",
        hasSauna=True,
    ),
}


def get_day_config(day_key: str) -> DayConfig:
    """Get DayConfig by day key string, with fallback."""
    return DAY_CONFIG_BY_KEY.get(
        day_key,
        DayConfig(key=day_key, label=day_key, color="#888", color_light="#333", icon="🏃"),
    )


def get_today_day_key() -> str | None:
    """Return today's day key, or None if not a training day."""
    from datetime import date

    weekday = date.today().weekday()  # Monday=0 ... Sunday=6
    cfg = DAY_CONFIG.get(weekday)
    return cfg.key if cfg else None


def get_day_number(day_key: str) -> int:
    """Convert day key to Python weekday number."""
    return {"tuesday": 1, "wednesday": 2, "friday": 4, "sunday": 6}.get(day_key, -1)


def parse_target_reps(reps_str: str) -> int:
    """Parse target reps from reps string for quick-log.

    "10-12" → 10 (take lower bound)
    "15" → 15
    "30-45s" → 30
    "10/side" → 10
    "12/side" → 12
    "20-30s/side" → 20
    """
    # Strip non-numeric suffixes
    cleaned = reps_str.split("s")[0].split("/")[0]
    # Take the first number if range
    first = cleaned.split("-")[0]
    try:
        return int(first)
    except ValueError:
        return 12  # fallback
