"""Progressive overload algorithm — direct port of JSX getTargetWeight and getWeightTrend."""

from __future__ import annotations

import re

from gym_coach.models import ExerciseTemplate, WeightTrendPoint, WorkoutSession


def _round_to_half(value: float) -> float:
    """Round to nearest 0.5 lb — matches JSX ``Math.round(v * 2) / 2``."""
    return round(value * 2) / 2


def _parse_target_reps(reps_str: str) -> int:
    """Extract a numeric reps target from strings like '10-12', '15', '10/side'.

    Uses the first integer found — matches JSX ``parseInt(exercise.reps) || 12``.
    """
    match = re.search(r"\d+", reps_str)
    return int(match.group()) if match else 12


def get_target_weight(
    exercise: ExerciseTemplate,
    history: list[WorkoutSession],
    day_key: str,
) -> float:
    """Compute the target weight for *exercise* on the next workout.

    This is an exact port of the JSX ``getTargetWeight`` function:

    1. If bodyweight exercise → return 0.
    2. Look at the last 3 **completed** sessions for *day_key*.
    3. Find the matching exercise (by id) in each session.
    4. If no history → return ``exercise.default_weight``.
    5. From the most recent session, calculate the average weight across completed sets.
    6. Check whether all completed sets hit the target reps.
    7. Progression rules:
       - If 2+ sessions AND all reps hit AND difficulty ≤ 3 (or unset) → **increase**.
       - If difficulty ≥ 5 → **decrease**.
       - Otherwise → **hold** at average weight.
    """
    if exercise.is_bodyweight:
        return 0

    # Last 3 completed sessions for this day
    relevant_exercises = []
    relevant_difficulties: list[int | None] = []
    for session in history:
        if session.day_key != day_key or not session.completed:
            continue
        matched = next((e for e in session.exercises if e.id == exercise.id), None)
        if matched is not None:
            relevant_exercises.append(matched)
            relevant_difficulties.append(session.difficulty)
        if len(relevant_exercises) >= 3:
            break

    if not relevant_exercises:
        return exercise.default_weight

    last_exercise = relevant_exercises[0]
    completed_sets = [s for s in last_exercise.sets if s.completed]
    if not completed_sets:
        return exercise.default_weight

    avg_weight = sum(s.weight or 0 for s in completed_sets) / len(completed_sets)

    target_reps = _parse_target_reps(exercise.reps)
    all_reps_hit = all((s.reps or 0) >= target_reps for s in completed_sets)

    last_difficulty = relevant_difficulties[0]

    # Increase: 2+ sessions with all reps hit and difficulty ≤ 3
    if (
        len(relevant_exercises) >= 2
        and all_reps_hit
        and (last_difficulty is None or last_difficulty <= 3)
    ):
        return _round_to_half(avg_weight + exercise.increment)

    # Decrease: difficulty ≥ 5
    if last_difficulty is not None and last_difficulty >= 5:
        return max(0, _round_to_half(avg_weight - exercise.increment))

    # Hold
    return _round_to_half(avg_weight)


def get_weight_trend(
    exercise: ExerciseTemplate,
    history: list[WorkoutSession],
    day_key: str,
) -> list[WeightTrendPoint]:
    """Return the last 3 sessions' average weights for *exercise*.

    Direct port of JSX ``getWeightTrend``.
    """
    trend: list[WeightTrendPoint] = []
    for session in history:
        if session.day_key != day_key or not session.completed:
            continue
        matched = next((e for e in session.exercises if e.id == exercise.id), None)
        if matched is None:
            continue
        completed_sets = [s for s in matched.sets if s.completed]
        if not completed_sets:
            continue
        avg = round(sum(s.weight or 0 for s in completed_sets) / len(completed_sets))
        trend.append(WeightTrendPoint(date=session.date, avg_weight=avg))
        if len(trend) >= 3:
            break
    return trend
