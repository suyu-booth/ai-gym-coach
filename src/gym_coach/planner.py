"""Weekly workout planner — generates WorkoutSessions for the coming week.

Uses the exercise library and progressive overload algorithm to compute
target weights, then builds complete WorkoutSession objects ready to be
written to Notion.
"""

from __future__ import annotations

from datetime import datetime, timedelta

from gym_coach.exercises import EXERCISES, get_day_config
from gym_coach.models import ExerciseLog, SetLog, WorkoutSession
from gym_coach.progressive_overload import get_target_weight


# ─── Helpers ──────────────────────────────────────────────────

_DAY_NAME_TO_WEEKDAY: dict[str, int] = {
    "monday": 0,
    "tuesday": 1,
    "thursday": 3,
}


def _next_weekday(start: datetime, weekday: int) -> datetime:
    """Return the next date on or after *start* that falls on *weekday* (0=Mon)."""
    days_ahead = weekday - start.weekday()
    if days_ahead <= 0:
        days_ahead += 7
    return start + timedelta(days=days_ahead)


# ─── Planner ──────────────────────────────────────────────────

def plan_week(
    history: list[WorkoutSession],
    week_number: int,
    reference_date: datetime | None = None,
) -> list[WorkoutSession]:
    """Generate 3 workout sessions for the coming Mon/Tue/Thu.

    Parameters
    ----------
    history:
        Recent workout history (most-recent first), used for progressive overload.
    week_number:
        The programme week number (for naming, e.g. "Week 9").
    reference_date:
        The "today" date to plan from. Defaults to now.

    Returns
    -------
    A list of 3 ``WorkoutSession`` objects (Mon, Tue, Thu) with computed
    target weights and empty set logs (ready to be filled during the workout).
    """
    if reference_date is None:
        reference_date = datetime.now()

    sessions: list[WorkoutSession] = []

    for day_key in ("monday", "tuesday", "thursday"):
        template = EXERCISES.get(day_key)
        if not template:
            continue

        weekday_num = _DAY_NAME_TO_WEEKDAY[day_key]
        workout_date = _next_weekday(reference_date, weekday_num)
        date_str = workout_date.strftime("%Y-%m-%d")

        cfg = get_day_config(day_key)
        workout_name = f"Week {week_number} {cfg.label}"

        exercises: list[ExerciseLog] = []
        for ex_tmpl in template.exercises:
            target_w = get_target_weight(ex_tmpl, history, day_key)

            # Create empty sets for logging
            empty_sets = [
                SetLog(weight=None, reps=None, completed=False)
                for _ in range(ex_tmpl.sets)
            ]

            exercises.append(
                ExerciseLog(
                    id=ex_tmpl.id,
                    name=ex_tmpl.name,
                    target_weight=target_w,
                    unit=ex_tmpl.unit,
                    sets=empty_sets,
                    notes=ex_tmpl.notes,
                    is_bodyweight=ex_tmpl.is_bodyweight,
                )
            )

        session = WorkoutSession(
            id=str(int(workout_date.timestamp() * 1000)),
            day_key=day_key,
            date=date_str,
            warmup_done=False,
            completed=False,
            exercises=exercises,
        )
        # Stash the formatted name for the Notion writer
        session._week_label = workout_name  # type: ignore[attr-defined]

        sessions.append(session)

    return sessions


def get_weekly_progress(
    history: list[WorkoutSession],
    reference_date: datetime | None = None,
) -> dict:
    """Count completed workouts in the current calendar week (Mon–Sun).

    Returns
    -------
    ``{"completed": int, "planned": 3, "days_done": ["monday", ...]}``
    """
    if reference_date is None:
        reference_date = datetime.now()

    # Find Monday of the current week
    monday = reference_date - timedelta(days=reference_date.weekday())
    monday = monday.replace(hour=0, minute=0, second=0, microsecond=0)
    sunday = monday + timedelta(days=6, hours=23, minutes=59, seconds=59)

    days_done: list[str] = []
    for session in history:
        try:
            session_date = datetime.strptime(session.date, "%Y-%m-%d")
        except (ValueError, TypeError):
            continue
        if monday <= session_date <= sunday and session.completed:
            if session.day_key not in days_done:
                days_done.append(session.day_key)

    return {
        "completed": len(days_done),
        "planned": 3,
        "days_done": days_done,
    }


def get_today_day_key() -> str | None:
    """Return today's day key if it's a workout day, else ``None``."""
    weekday = datetime.now().weekday()  # 0=Mon
    mapping = {0: "monday", 1: "tuesday", 3: "thursday", 6: "sunday"}
    return mapping.get(weekday)
