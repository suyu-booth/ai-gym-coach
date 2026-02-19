"""Pydantic models matching the JSX data structures exactly."""

from __future__ import annotations

from pydantic import BaseModel, Field


# ─── Day Configuration ───────────────────────────────────────


class DayConfig(BaseModel):
    """Per-day metadata (colors, icons, labels) from JSX DAY_CONFIG."""

    key: str
    label: str
    color: str
    color_light: str
    icon: str


# ─── Exercise Templates ──────────────────────────────────────


class ExerciseTemplate(BaseModel):
    """Static definition of an exercise from the JSX EXERCISES constant."""

    id: str
    name: str
    sets: int
    reps: str  # e.g. "10-12", "15", "30-45s", "10/side"
    default_weight: float = Field(alias="defaultWeight", default=0)
    unit: str
    notes: str = ""
    increment: float = 0
    is_bodyweight: bool = Field(alias="isBodyweight", default=False)

    model_config = {"populate_by_name": True}


class DayTemplate(BaseModel):
    """Full day workout template from JSX EXERCISES[dayKey]."""

    warmup: list[str]
    exercises: list[ExerciseTemplate]
    cooldown: str | None = None
    has_sauna: bool = Field(alias="hasSauna", default=False)

    model_config = {"populate_by_name": True}


# ─── Workout Logging ─────────────────────────────────────────


class SetLog(BaseModel):
    """A single set's recorded data. Tracks weight and reps separately.

    Completion rule (matches JSX):
    - Weighted exercises: completed when weight is not None AND reps is not None
    - Bodyweight exercises: completed when reps is not None
    """

    weight: float | None = None
    reps: int | None = None
    completed: bool = False


class ExerciseLog(BaseModel):
    """An exercise as logged during a workout session."""

    id: str
    name: str
    target_weight: float = Field(alias="targetWeight", default=0)
    unit: str
    sets: list[SetLog]
    notes: str = ""
    is_bodyweight: bool = Field(alias="isBodyweight", default=False)

    model_config = {"populate_by_name": True}


class WorkoutSession(BaseModel):
    """A complete workout session — matches JSX state shape."""

    id: str
    day_key: str = Field(alias="dayKey")
    date: str  # "YYYY-MM-DD"
    start_time: int | None = Field(alias="startTime", default=None)  # epoch ms
    end_time: int | None = Field(alias="endTime", default=None)  # epoch ms
    duration: int | None = None  # minutes
    warmup_done: bool = Field(alias="warmupDone", default=False)
    completed: bool = False
    exercises: list[ExerciseLog] = []

    # Completion metadata
    difficulty: int | None = None  # 1-5
    energy: str | None = None  # "⚡ High", "😐 Medium", "😴 Low"
    knee_comfort: str | None = Field(alias="kneeComfort", default=None)
    mood: str | None = None  # "😊 Great", "😌 Good", "😐 Neutral", "😓 Tired"
    notes: str | None = None
    sauna: bool = False

    # Notion page ID (set after syncing)
    notion_page_id: str | None = None

    model_config = {"populate_by_name": True}


# ─── Profile ─────────────────────────────────────────────────


class Profile(BaseModel):
    """User profile — matches JSX DEFAULT_PROFILE."""

    name: str = ""
    goals: str = "Stress-free weight loss + shoulder strength for cabaret lifts"
    schedule: str = "Tue/Thu/Mon @ 7am"
    gym: str = "LA Fitness"
    session_duration: int = Field(alias="sessionDuration", default=50)
    knee_protocol: bool = Field(alias="kneeProtocol", default=True)
    setup_complete: bool = Field(alias="setupComplete", default=False)

    model_config = {"populate_by_name": True}


# ─── Trend Analysis ──────────────────────────────────────────


class WeightTrendPoint(BaseModel):
    """A single data point in weight trend history."""

    date: str
    avg_weight: float = Field(alias="avgWeight")

    model_config = {"populate_by_name": True}


# ─── Display Labels ──────────────────────────────────────────

DIFFICULTY_LABELS: dict[int, str] = {
    1: "Easy 😎",
    2: "Moderate 🙂",
    3: "Good 💪",
    4: "Hard 😤",
    5: "Max 🔥",
}

DIFFICULTY_COLORS: dict[int, str] = {
    1: "#22C55E",
    2: "#84CC16",
    3: "#EAB308",
    4: "#F97316",
    5: "#EF4444",
}

ENERGY_OPTIONS: list[str] = ["⚡ High", "😐 Medium", "😴 Low"]
KNEE_COMFORT_OPTIONS: list[str] = ["✅ No pain", "⚠️ Mild discomfort", "🛑 Pain"]
MOOD_OPTIONS: list[str] = ["😊 Great", "😌 Good", "😐 Neutral", "😓 Tired"]
