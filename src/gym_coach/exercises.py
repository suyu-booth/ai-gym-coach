"""Exercise library — exact Python translation of the JSX EXERCISES and DAY_CONFIG constants."""

from gym_coach.models import DayConfig, DayTemplate, ExerciseTemplate

# ─── DAY_CONFIG ───────────────────────────────────────────────
DAY_CONFIG: dict[int, DayConfig] = {
    1: DayConfig(
        key="monday",
        label="Monday - Upper Push",
        color="#3B82F6",
        color_light="#1e3a5f",
        icon="\U0001f4aa",  # 💪
    ),
    2: DayConfig(
        key="tuesday",
        label="Tuesday - Lower Body",
        color="#22C55E",
        color_light="#1a3d2a",
        icon="\U0001f9b5",  # 🦵
    ),
    4: DayConfig(
        key="thursday",
        label="Thursday - Upper Pull",
        color="#A855F7",
        color_light="#3b1d5e",
        icon="\U0001f3cb\ufe0f",  # 🏋️
    ),
    0: DayConfig(
        key="sunday",
        label="Sunday - Bachata",
        color="#EC4899",
        color_light="#4a1a30",
        icon="\U0001f483",  # 💃
    ),
}

DAY_KEY_TO_NUMBER: dict[str, int] = {cfg.key: num for num, cfg in DAY_CONFIG.items()}


def get_day_config(day_key: str) -> DayConfig:
    """Look up DayConfig by key string."""
    num = DAY_KEY_TO_NUMBER.get(day_key)
    if num is not None:
        return DAY_CONFIG[num]
    return DayConfig(key=day_key, label=day_key, color="#888888", color_light="#333333", icon="\U0001f3c3")


# ─── EXERCISES ────────────────────────────────────────────────
EXERCISES: dict[str, DayTemplate] = {
    "monday": DayTemplate(
        warmup=[
            "Arm circles: 15 forward, 15 backward",
            "Band pull-aparts: 2 \u00d7 12",
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
                notes="Control descent",
                increment=2.5,
            ),
            ExerciseTemplate(
                id="seated-shoulder-press",
                name="Seated Shoulder Press",
                sets=4,
                reps="10",
                defaultWeight=45,
                unit="lb DBs",
                notes="Key lift for dance",
                increment=2.5,
            ),
            ExerciseTemplate(
                id="cable-chest-fly",
                name="Cable Chest Fly",
                sets=3,
                reps="12",
                defaultWeight=30,
                unit="lbs/side",
                notes="Squeeze at center",
                increment=5,
            ),
            ExerciseTemplate(
                id="lateral-raises",
                name="Lateral Raises",
                sets=3,
                reps="15",
                defaultWeight=12,
                unit="lb DBs",
                notes="Light weight, strict form",
                increment=2.5,
            ),
            ExerciseTemplate(
                id="tricep-pushdowns",
                name="Tricep Pushdowns",
                sets=3,
                reps="12",
                defaultWeight=40,
                unit="lbs",
                notes="",
                increment=5,
            ),
            ExerciseTemplate(
                id="plank-hold",
                name="Plank Hold",
                sets=3,
                reps="30-45s",
                defaultWeight=0,
                unit="bodyweight",
                notes="Core stability",
                increment=0,
                isBodyweight=True,
            ),
            ExerciseTemplate(
                id="dead-bug",
                name="Dead Bug",
                sets=3,
                reps="10/side",
                defaultWeight=0,
                unit="bodyweight",
                notes="Knee-friendly core",
                increment=0,
                isBodyweight=True,
            ),
        ],
        cooldown="Shoulder + chest stretches",
        hasSauna=False,
    ),
    "tuesday": DayTemplate(
        warmup=[
            "Glute bridges: 2 \u00d7 10",
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
                notes="Reduces knee shear",
                increment=10,
            ),
            ExerciseTemplate(
                id="romanian-deadlift",
                name="Romanian Deadlift",
                sets=3,
                reps="10",
                defaultWeight=75,
                unit="lbs",
                notes="Hamstring focus",
                increment=5,
            ),
            ExerciseTemplate(
                id="hip-thrust",
                name="Hip Thrust",
                sets=3,
                reps="12",
                defaultWeight=45,
                unit="lbs",
                notes="Glute strength",
                increment=10,
            ),
            ExerciseTemplate(
                id="leg-curl",
                name="Leg Curl",
                sets=3,
                reps="12",
                defaultWeight=65,
                unit="lbs",
                notes="",
                increment=5,
            ),
            ExerciseTemplate(
                id="calf-raises",
                name="Calf Raises",
                sets=3,
                reps="15",
                defaultWeight=120,
                unit="lbs",
                notes="",
                increment=10,
            ),
            ExerciseTemplate(
                id="hip-abduction",
                name="Side-lying Hip Abduction",
                sets=2,
                reps="15/side",
                defaultWeight=0,
                unit="bodyweight",
                notes="Hip stability",
                increment=0,
                isBodyweight=True,
            ),
        ],
        cooldown=None,
        hasSauna=True,
    ),
    "thursday": DayTemplate(
        warmup=[
            "Band pull-aparts: 2 \u00d7 15",
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
                notes="Full stretch at top",
                increment=5,
            ),
            ExerciseTemplate(
                id="seated-cable-row",
                name="Seated Cable Row",
                sets=3,
                reps="12",
                defaultWeight=100,
                unit="lbs",
                notes="Squeeze shoulder blades",
                increment=5,
            ),
            ExerciseTemplate(
                id="face-pulls",
                name="Face Pulls",
                sets=4,
                reps="15",
                defaultWeight=40,
                unit="lbs",
                notes="Shoulder health",
                increment=5,
            ),
            ExerciseTemplate(
                id="rear-delt-fly",
                name="Rear Delt Fly",
                sets=3,
                reps="15",
                defaultWeight=15,
                unit="lb DBs",
                notes="Posture balance",
                increment=2.5,
            ),
            ExerciseTemplate(
                id="db-shrugs",
                name="DB Shrugs",
                sets=3,
                reps="12",
                defaultWeight=40,
                unit="lb DBs",
                notes="Trap development",
                increment=5,
            ),
            ExerciseTemplate(
                id="bicep-curls",
                name="Bicep Curls",
                sets=3,
                reps="12",
                defaultWeight=25,
                unit="lb DBs",
                notes="",
                increment=2.5,
            ),
        ],
        cooldown=None,
        hasSauna=True,
    ),
}
