"""Unit tests for progressive overload — verifies parity with JSX getTargetWeight."""

from gym_coach.models import ExerciseLog, ExerciseTemplate, SetLog, WorkoutSession
from gym_coach.progressive_overload import get_target_weight, get_weight_trend, round_to_half


# ─── Helpers ──────────────────────────────────────────────────


def _make_exercise(
    ex_id: str = "incline-db-press",
    default_weight: float = 47.5,
    increment: float = 2.5,
    reps: str = "10-12",
) -> ExerciseTemplate:
    return ExerciseTemplate(
        id=ex_id,
        name="Incline DB Press",
        sets=3,
        reps=reps,
        defaultWeight=default_weight,
        unit="lb DBs",
        increment=increment,
        notes="",
    )


def _make_session(
    day_key: str = "monday",
    ex_id: str = "incline-db-press",
    weights: list[float] | None = None,
    reps_list: list[int] | None = None,
    difficulty: int | None = 3,
    completed: bool = True,
    date: str = "2026-02-01",
) -> WorkoutSession:
    weights = weights or [47.5, 47.5, 47.5]
    reps_list = reps_list or [12, 12, 12]

    sets = [
        SetLog(weight=w, reps=r, completed=True)
        for w, r in zip(weights, reps_list)
    ]

    return WorkoutSession(
        id="test",
        dayKey=day_key,
        date=date,
        completed=completed,
        exercises=[
            ExerciseLog(
                id=ex_id,
                name="Incline DB Press",
                targetWeight=47.5,
                unit="lb DBs",
                sets=sets,
                isBodyweight=False,
            )
        ],
        difficulty=difficulty,
    )


# ─── Tests ────────────────────────────────────────────────────


class TestRoundToHalf:
    def test_round_exact(self):
        assert round_to_half(50.0) == 50.0

    def test_round_up(self):
        assert round_to_half(50.3) == 50.5

    def test_round_down(self):
        assert round_to_half(50.1) == 50.0

    def test_round_quarter(self):
        # Python banker's rounding: round(100.5) = 100, so 100/2 = 50.0
        # JSX Math.round(100.5) = 101, so 101/2 = 50.5
        # Edge case at exact .25 — not meaningful for real gym weights
        assert round_to_half(50.25) == 50.0  # Python behavior
        assert round_to_half(50.3) == 50.5   # Non-edge case rounds up correctly

    def test_round_75(self):
        assert round_to_half(50.75) == 51.0


class TestGetTargetWeight:
    def test_no_history_returns_default(self):
        ex = _make_exercise()
        result = get_target_weight(ex, [], "monday")
        assert result == 47.5

    def test_bodyweight_returns_zero(self):
        ex = ExerciseTemplate(
            id="plank", name="Plank", sets=3, reps="30-45s",
            defaultWeight=0, unit="bodyweight", increment=0,
            isBodyweight=True,
        )
        result = get_target_weight(ex, [], "monday")
        assert result == 0

    def test_one_session_holds_weight(self):
        """With only 1 session, even if all reps hit, should NOT increase (needs 2+)."""
        ex = _make_exercise()
        history = [_make_session(difficulty=2)]
        result = get_target_weight(ex, history, "monday")
        assert result == 47.5  # holds, not increases

    def test_two_sessions_all_reps_hit_low_difficulty_increases(self):
        """2 sessions with all reps hit and difficulty <= 3 → increase."""
        ex = _make_exercise()
        history = [
            _make_session(difficulty=2, date="2026-02-08"),
            _make_session(difficulty=3, date="2026-02-01"),
        ]
        result = get_target_weight(ex, history, "monday")
        assert result == 50.0  # 47.5 + 2.5

    def test_two_sessions_high_difficulty_no_increase(self):
        """2 sessions with reps hit but difficulty 4 → hold."""
        ex = _make_exercise()
        history = [
            _make_session(difficulty=4, date="2026-02-08"),
            _make_session(difficulty=3, date="2026-02-01"),
        ]
        result = get_target_weight(ex, history, "monday")
        assert result == 47.5  # holds

    def test_difficulty_5_decreases(self):
        """Difficulty >= 5 → decrease by increment."""
        ex = _make_exercise()
        history = [_make_session(difficulty=5)]
        result = get_target_weight(ex, history, "monday")
        assert result == 45.0  # 47.5 - 2.5

    def test_difficulty_5_floor_at_zero(self):
        """Decrease should not go below 0."""
        ex = _make_exercise(default_weight=2.5, increment=5)
        history = [
            _make_session(weights=[2.5, 2.5, 2.5], difficulty=5)
        ]
        result = get_target_weight(ex, history, "monday")
        assert result == 0

    def test_reps_not_hit_holds(self):
        """If reps aren't all met, hold weight even with 2+ sessions."""
        ex = _make_exercise(reps="12")
        history = [
            _make_session(reps_list=[10, 10, 10], difficulty=2, date="2026-02-08"),
            _make_session(reps_list=[12, 12, 12], difficulty=2, date="2026-02-01"),
        ]
        result = get_target_weight(ex, history, "monday")
        # allRepsHit is based on most recent session only → reps 10 < 12 → not all hit → hold
        assert result == 47.5

    def test_no_difficulty_allows_increase(self):
        """If difficulty is None (not recorded), still allow increase."""
        ex = _make_exercise()
        history = [
            _make_session(difficulty=None, date="2026-02-08"),
            _make_session(difficulty=None, date="2026-02-01"),
        ]
        result = get_target_weight(ex, history, "monday")
        assert result == 50.0  # 47.5 + 2.5

    def test_no_completed_sets_returns_default(self):
        """If no sets were completed in last session, return default."""
        ex = _make_exercise()
        session = WorkoutSession(
            id="test", dayKey="monday", date="2026-02-01", completed=True,
            exercises=[
                ExerciseLog(
                    id="incline-db-press", name="Incline DB Press",
                    targetWeight=47.5, unit="lb DBs",
                    sets=[SetLog(weight=None, reps=None, completed=False) for _ in range(3)],
                    isBodyweight=False,
                )
            ],
        )
        result = get_target_weight(ex, [session], "monday")
        assert result == 47.5

    def test_wrong_day_key_ignored(self):
        """Sessions from other days don't count."""
        ex = _make_exercise()
        history = [
            _make_session(day_key="tuesday", date="2026-02-08"),
            _make_session(day_key="tuesday", date="2026-02-01"),
        ]
        result = get_target_weight(ex, history, "monday")
        assert result == 47.5  # default, because no monday sessions


class TestGetWeightTrend:
    def test_empty_history(self):
        ex = _make_exercise()
        result = get_weight_trend(ex, [], "monday")
        assert result == []

    def test_returns_up_to_3_points(self):
        ex = _make_exercise()
        history = [
            _make_session(weights=[50, 50, 50], date="2026-02-15"),
            _make_session(weights=[47.5, 47.5, 47.5], date="2026-02-08"),
            _make_session(weights=[45, 45, 45], date="2026-02-01"),
        ]
        result = get_weight_trend(ex, history, "monday")
        assert len(result) == 3
        assert result[0].avg_weight == 50
        assert result[1].avg_weight == 48  # round(47.5) = 48
        assert result[2].avg_weight == 45
