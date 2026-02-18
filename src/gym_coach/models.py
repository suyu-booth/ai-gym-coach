"""Pydantic data models — mirrors the JSX frontend data structures exactly."""

from __future__ import annotations

from pydantic import BaseModel, Field


# ─── Exercise Template (from JSX EXERCISES constant) ──────────
class ExerciseTemplate(BaseModel):
    """Static definition of an exercise in the programme."""

    id: str
    name: str
    sets: int
    reps: str  # e.g. "10-12", "15", "30-45s", "10/side"
    default_weight: float = Field(alias="defaultWeight", default=0)
    unit: str  # "lb DBs", "lbs", "lbs/side", "bodyweight"
    notes: str = ""
    increment: float = 0  # weight bump per progression step
    is_bodyweight: bool = Field(alias="isBodyweight", default=False)

    model_config = {"populate_by_name": True}


class DayTemplate(BaseModel):
    """Static definition of a training day."""

    warmup: list[str]
    exercises: list[ExerciseTemplate]
    cooldown: str | None = None
    has_sauna: bool = Field(alias="hasSauna", default=False)

    model_config = {"populate_by_name": True}


# ─── Workout Logging (runtime data) ──────────────────────────
class SetLog(BaseModel):
    """A single set performed during a workout."""

    weight: float | None = None
    reps: int | None = None
    completed: bool = False


class ExerciseLog(BaseModel):
    """An exercise performed during a workout, with per-set data."""

    id: str
    name: str
    target_weight: float = 0
    unit: str = ""
    sets: list[SetLog] = []
    notes: str = ""
    is_bodyweight: bool = False


class WorkoutSession(BaseModel):
    """A complete workout session — matches the JSX reducer state."""

    id: str  # timestamp string
    day_key: str  # "monday" | "tuesday" | "thursday" | "sunday"
    date: str  # "YYYY-MM-DD"
    start_time: int | None = None  # epoch ms
    end_time: int | None = None  # epoch ms
    duration: int | None = None  # minutes
    warmup_done: bool = False
    completed: bool = False
    exercises: list[ExerciseLog] = []

    # Completion metadata
    difficulty: int | None = None  # 1-5
    energy: str | None = None  # "High" | "Medium" | "Low"
    knee_comfort: str | None = None  # "No pain" | "Mild discomfort" | "Pain"
    mood: str | None = None  # "Great" | "Good" | "Neutral" | "Tired"
    notes: str = ""
    sauna: bool = False


# ─── Profile ──────────────────────────────────────────────────
class Profile(BaseModel):
    """User profile — persistent, set once during init."""

    name: str = ""
    goals: str = "Stress-free weight loss + shoulder strength for cabaret lifts"
    schedule: str = "Tue/Thu/Mon @ 7am"
    gym: str = "LA Fitness"
    session_duration: int = 50
    knee_protocol: bool = True
    setup_complete: bool = False


# ─── Weight Trend ─────────────────────────────────────────────
class WeightTrendPoint(BaseModel):
    """A single data point in a weight trend series."""

    date: str
    avg_weight: float


# ─── Day Config ───────────────────────────────────────────────
class DayConfig(BaseModel):
    """Display metadata for a training day."""

    key: str
    label: str
    color: str
    color_light: str
    icon: str
