"""Weekly workout generation — creates WorkoutSession objects for upcoming week."""

from __future__ import annotations

from datetime import date, timedelta

from gym_coach.exercises import EXERCISES, get_day_config
from gym_coach.models import ExerciseLog, SetLog, WorkoutSession
from gym_coach.progressive_overload import get_target_weight


def plan_week(
    history: list[WorkoutSession],
    week_number: int,
) -> list[WorkoutSession]:
    """Generate 3 workout sessions for the coming Mon/Tue/Thu.

    For each day:
    - Loads the DayTemplate
    - Computes targetWeight for each exercise using progressive overload
    - Names workouts as "Week {N} {Day Label}"
    - Returns unsaved WorkoutSession objects ready to be written to Notion
    """
    sessions: list[WorkoutSession] = []

    # Figure out the dates for next Mon/Tue/Thu
    today = date.today()
    # Find next Monday
    days_until_monday = (7 - today.weekday()) % 7
    if days_until_monday == 0:
        days_until_monday = 7  # if today is Monday, plan for next Monday
    next_monday = today + timedelta(days=days_until_monday)

    day_offsets = {
        "monday": 0,   # Monday
        "tuesday": 1,  # Tuesday
        "thursday": 3, # Thursday
    }

    for day_key, offset in day_offsets.items():
        template = EXERCISES.get(day_key)
        if not template:
            continue

        workout_date = next_monday + timedelta(days=offset)

        exercises: list[ExerciseLog] = []
        for ex_template in template.exercises:
            target_w = get_target_weight(ex_template, history, day_key)

            sets = [
                SetLog(weight=None, reps=None, completed=False)
                for _ in range(ex_template.sets)
            ]

            exercises.append(
                ExerciseLog(
                    id=ex_template.id,
                    name=ex_template.name,
                    targetWeight=target_w,
                    unit=ex_template.unit,
                    sets=sets,
                    notes=ex_template.notes,
                    isBodyweight=ex_template.is_bodyweight,
                )
            )

        # Generate a timestamp-style ID (matching JSX Date.now().toString())
        from datetime import datetime
        epoch_ms = int(datetime.combine(workout_date, datetime.min.time()).timestamp() * 1000)

        session = WorkoutSession(
            id=str(epoch_ms),
            dayKey=day_key,
            date=workout_date.isoformat(),
            exercises=exercises,
        )
        sessions.append(session)

    return sessions


def get_weekly_progress(history: list[WorkoutSession]) -> dict:
    """Count completed workouts in the current week (Mon through Sun).

    Returns: {completed: int, planned: 3, days_done: ["monday", ...]}
    """
    today = date.today()
    # Find this week's Monday
    monday = today - timedelta(days=today.weekday())

    days_done: list[str] = []
    for w in history:
        try:
            w_date = date.fromisoformat(w.date)
        except (ValueError, TypeError):
            continue
        if w_date >= monday and w.completed:
            if w.day_key not in days_done:
                days_done.append(w.day_key)

    return {
        "completed": len(days_done),
        "planned": 3,
        "days_done": days_done,
    }
