"""Exercise library — exact Python translation of JSX EXERCISES and DAY_CONFIG."""

from gym_coach.models import DayConfig, DayTemplate, ExerciseTemplate

# ─── DAY_CONFIG ──────────────────────────────────────────────
# Keyed by Python weekday: Monday=0 ... Sunday=6
# (JSX uses JS getDay(): Sunday=0, Monday=1, etc.)

DAY_CONFIG: dict[int, DayConfig] = {
    0: DayConfig(  # Monday
        key="monday",
        label="Monday - Upper Push",
        color="#3B82F6",
        color_light="#1e3a5f",
        icon="💪",
    ),
    1: DayConfig(  # Tuesday
        key="tuesday",
        label="Tuesday - Lower Body",
        color="#22C55E",
        color_light="#1a3d2a",
        icon="🦵",
    ),
    3: DayConfig(  # Thursday
        key="thursday",
        label="Thursday - Upper Pull",
        color="#A855F7",
        color_light="#3b1d5e",
        icon="🏋️",
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

# ─── EXERCISES ───────────────────────────────────────────────

EXERCISES: dict[str, DayTemplate] = {
    "monday": DayTemplate(
        warmup=[
            "Arm circles: 15 forward, 15 backward",
            "Band pull-aparts: 2 × 12",
            "Cat-cow stretches: 10 reps",
        ],
        exercises=[
            ExerciseTemplate(
                id="incline-db-press",
                name="Incline DB Press",
                sets=3,
                reps="10-12",
                defaultWeight=47.5,
                unit="lb DBs",
                increment=2.5,
                notes="Control descent",
            ),
            ExerciseTemplate(
                id="seated-shoulder-press",
                name="Seated Shoulder Press",
                sets=4,
                reps="10",
                defaultWeight=45,
                unit="lb DBs",
                increment=2.5,
                notes="Key lift for dance",
            ),
            ExerciseTemplate(
                id="cable-chest-fly",
                name="Cable Chest Fly",
                sets=3,
                reps="12",
                defaultWeight=30,
                unit="lbs/side",
                increment=5,
                notes="Squeeze at center",
            ),
            ExerciseTemplate(
                id="lateral-raises",
                name="Lateral Raises",
                sets=3,
                reps="15",
                defaultWeight=12,
                unit="lb DBs",
                increment=2.5,
                notes="Light weight, strict form",
            ),
            ExerciseTemplate(
                id="tricep-pushdowns",
                name="Tricep Pushdowns",
                sets=3,
                reps="12",
                defaultWeight=40,
                unit="lbs",
                increment=5,
                notes="",
            ),
            ExerciseTemplate(
                id="plank-hold",
                name="Plank Hold",
                sets=3,
                reps="30-45s",
                defaultWeight=0,
                unit="bodyweight",
                increment=0,
                notes="Core stability",
                isBodyweight=True,
            ),
            ExerciseTemplate(
                id="dead-bug",
                name="Dead Bug",
                sets=3,
                reps="10/side",
                defaultWeight=0,
                unit="bodyweight",
                increment=0,
                notes="Knee-friendly core",
                isBodyweight=True,
            ),
        ],
        cooldown="Shoulder + chest stretches",
        hasSauna=False,
    ),
    "tuesday": DayTemplate(
        warmup=[
            "Glute bridges: 2 × 10",
            "Leg swings: 10 each leg",
            "Foam roll quads/IT band: 2 min",
        ],
        exercises=[
            ExerciseTemplate(
                id="leg-press",
                name="Leg Press (high foot)",
                sets=3,
                reps="12",
                defaultWeight=195,
                unit="lbs",
                increment=10,
                notes="Reduces knee shear",
            ),
            ExerciseTemplate(
                id="romanian-deadlift",
                name="Romanian Deadlift",
                sets=3,
                reps="10",
                defaultWeight=75,
                unit="lbs",
                increment=5,
                notes="Hamstring focus",
            ),
            ExerciseTemplate(
                id="hip-thrust",
                name="Hip Thrust",
                sets=3,
                reps="12",
                defaultWeight=45,
                unit="lbs",
                increment=10,
                notes="Glute strength",
            ),
            ExerciseTemplate(
                id="leg-curl",
                name="Leg Curl",
                sets=3,
                reps="12",
                defaultWeight=65,
                unit="lbs",
                increment=5,
                notes="",
            ),
            ExerciseTemplate(
                id="calf-raises",
                name="Calf Raises",
                sets=3,
                reps="15",
                defaultWeight=120,
                unit="lbs",
                increment=10,
                notes="",
            ),
            ExerciseTemplate(
                id="hip-abduction",
                name="Side-lying Hip Abduction",
                sets=2,
                reps="15/side",
                defaultWeight=0,
                unit="bodyweight",
                increment=0,
                notes="Hip stability",
                isBodyweight=True,
            ),
        ],
        cooldown=None,
        hasSauna=True,
    ),
    "thursday": DayTemplate(
        warmup=[
            "Band pull-aparts: 2 × 15",
            "Shoulder dislocates with PVC: 10 reps",
            "Thoracic rotations: 8 each side",
        ],
        exercises=[
            ExerciseTemplate(
                id="lat-pulldown",
                name="Lat Pulldown",
                sets=3,
                reps="10-12",
                defaultWeight=100,
                unit="lbs",
                increment=5,
                notes="Full stretch at top",
            ),
            ExerciseTemplate(
                id="seated-cable-row",
                name="Seated Cable Row",
                sets=3,
                reps="12",
                defaultWeight=100,
                unit="lbs",
                increment=5,
                notes="Squeeze shoulder blades",
            ),
            ExerciseTemplate(
                id="face-pulls",
                name="Face Pulls",
                sets=4,
                reps="15",
                defaultWeight=40,
                unit="lbs",
                increment=5,
                notes="Shoulder health",
            ),
            ExerciseTemplate(
                id="rear-delt-fly",
                name="Rear Delt Fly",
                sets=3,
                reps="15",
                defaultWeight=15,
                unit="lb DBs",
                increment=2.5,
                notes="Posture balance",
            ),
            ExerciseTemplate(
                id="db-shrugs",
                name="DB Shrugs",
                sets=3,
                reps="12",
                defaultWeight=40,
                unit="lb DBs",
                increment=5,
                notes="Trap development",
            ),
            ExerciseTemplate(
                id="bicep-curls",
                name="Bicep Curls",
                sets=3,
                reps="12",
                defaultWeight=25,
                unit="lb DBs",
                increment=2.5,
                notes="",
            ),
        ],
        cooldown=None,
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
    return {"monday": 0, "tuesday": 1, "thursday": 3, "sunday": 6}.get(day_key, -1)


def parse_target_reps(reps_str: str) -> int:
    """Parse target reps from reps string for quick-log.

    "10-12" → 10 (take lower bound)
    "15" → 15
    "30-45s" → 30
    "10/side" → 10
    """
    # Strip non-numeric suffixes
    cleaned = reps_str.split("s")[0].split("/")[0]
    # Take the first number if range
    first = cleaned.split("-")[0]
    try:
        return int(first)
    except ValueError:
        return 12  # fallback
