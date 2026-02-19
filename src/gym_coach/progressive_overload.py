"""Progressive overload algorithm — direct port of JSX getTargetWeight and getWeightTrend."""

from __future__ import annotations

from gym_coach.exercises import parse_target_reps
from gym_coach.models import ExerciseTemplate, WeightTrendPoint, WorkoutSession


def round_to_half(value: float) -> float:
    """Round to nearest 0.5 lb: round(value * 2) / 2."""
    return round(value * 2) / 2


def get_target_weight(
    exercise: ExerciseTemplate,
    history: list[WorkoutSession],
    day_key: str,
) -> float:
    """Compute next target weight for an exercise based on history.

    Exact port of JSX getTargetWeight:
    1. If bodyweight exercise, return 0
    2. Look at last 3 COMPLETED sessions for this day
    3. Find the matching exercise by ID in each session
    4. If no history, return defaultWeight
    5. Compute avgWeight from completed sets in most recent session
    6. Check if all reps were hit (reps >= target reps)
    7. If 2+ sessions with all reps hit AND difficulty <= 3: increase
    8. If difficulty >= 5: decrease
    9. Otherwise: hold at current average
    """
    if exercise.is_bodyweight:
        return 0

    # Find last 3 completed sessions for this day, extract matching exercise
    relevant: list[dict] = []
    for w in history:
        if w.day_key == day_key and w.completed:
            ex_match = next((e for e in w.exercises if e.id == exercise.id), None)
            if ex_match is not None:
                relevant.append({"exercise": ex_match, "difficulty": w.difficulty})
            if len(relevant) == 3:
                break

    if len(relevant) == 0:
        return exercise.default_weight

    last_session = relevant[0]
    last_ex = last_session["exercise"]
    completed_sets = [s for s in last_ex.sets if s.completed]

    if len(completed_sets) == 0:
        return exercise.default_weight

    avg_weight = sum(s.weight or 0 for s in completed_sets) / len(completed_sets)

    target_reps = parse_target_reps(exercise.reps)
    all_reps_hit = all(
        s.reps is not None and s.reps >= target_reps for s in completed_sets
    )

    last_difficulty = last_session["difficulty"]

    # Increase: 2+ sessions of meeting reps AND difficulty <= 3
    if (
        len(relevant) >= 2
        and all_reps_hit
        and (last_difficulty is None or last_difficulty <= 3)
    ):
        return round_to_half(avg_weight + exercise.increment)

    # Decrease: difficulty >= 5
    if last_difficulty is not None and last_difficulty >= 5:
        return max(0, round_to_half(avg_weight - exercise.increment))

    # Hold
    return round_to_half(avg_weight)


def get_weight_trend(
    exercise: ExerciseTemplate,
    history: list[WorkoutSession],
    day_key: str,
) -> list[WeightTrendPoint]:
    """Return last 3 sessions' average weights for an exercise.

    Exact port of JSX getWeightTrend.
    """
    trend: list[WeightTrendPoint] = []

    for w in history:
        if w.day_key == day_key and w.completed:
            ex_match = next((e for e in w.exercises if e.id == exercise.id), None)
            if ex_match is None:
                continue
            completed_sets = [s for s in ex_match.sets if s.completed]
            if len(completed_sets) == 0:
                continue
            avg = round(
                sum(s.weight or 0 for s in completed_sets) / len(completed_sets)
            )
            trend.append(WeightTrendPoint(date=w.date, avgWeight=avg))
            if len(trend) == 3:
                break

    return trend
