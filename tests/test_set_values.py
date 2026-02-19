"""Tests for set value formatting and parsing — Notion round-trip."""

from gym_coach.models import SetLog
from gym_coach.notion_reader import parse_set_value
from gym_coach.notion_writer import format_set_value


class TestFormatSetValue:
    def test_weighted_complete(self):
        s = SetLog(weight=47.5, reps=12, completed=True)
        assert format_set_value(s, is_bodyweight=False) == "47.5 × 12"

    def test_weighted_whole_number(self):
        s = SetLog(weight=100.0, reps=10, completed=True)
        assert format_set_value(s, is_bodyweight=False) == "100 × 10"

    def test_bodyweight_complete(self):
        s = SetLog(weight=0, reps=10, completed=True)
        assert format_set_value(s, is_bodyweight=True) == "10"

    def test_incomplete(self):
        s = SetLog(weight=None, reps=None, completed=False)
        assert format_set_value(s, is_bodyweight=False) == ""

    def test_incomplete_bodyweight(self):
        s = SetLog(weight=None, reps=None, completed=False)
        assert format_set_value(s, is_bodyweight=True) == ""


class TestParseSetValue:
    def test_weighted_format(self):
        s = parse_set_value("47.5 × 12", is_bodyweight=False)
        assert s.weight == 47.5
        assert s.reps == 12
        assert s.completed is True

    def test_weighted_whole_number(self):
        s = parse_set_value("100 × 10", is_bodyweight=False)
        assert s.weight == 100.0
        assert s.reps == 10
        assert s.completed is True

    def test_bodyweight_format(self):
        s = parse_set_value("10", is_bodyweight=True)
        assert s.weight == 0
        assert s.reps == 10
        assert s.completed is True

    def test_empty_string(self):
        s = parse_set_value("", is_bodyweight=False)
        assert s.weight is None
        assert s.reps is None
        assert s.completed is False

    def test_whitespace_only(self):
        s = parse_set_value("   ", is_bodyweight=False)
        assert s.completed is False

    def test_bodyweight_empty(self):
        s = parse_set_value("", is_bodyweight=True)
        assert s.completed is False


class TestRoundTrip:
    """Verify that format → parse produces the original SetLog."""

    def test_weighted_round_trip(self):
        original = SetLog(weight=47.5, reps=12, completed=True)
        text = format_set_value(original, is_bodyweight=False)
        parsed = parse_set_value(text, is_bodyweight=False)
        assert parsed.weight == original.weight
        assert parsed.reps == original.reps
        assert parsed.completed == original.completed

    def test_bodyweight_round_trip(self):
        original = SetLog(weight=0, reps=15, completed=True)
        text = format_set_value(original, is_bodyweight=True)
        parsed = parse_set_value(text, is_bodyweight=True)
        assert parsed.reps == original.reps
        assert parsed.completed == original.completed

    def test_incomplete_round_trip(self):
        original = SetLog(weight=None, reps=None, completed=False)
        text = format_set_value(original, is_bodyweight=False)
        parsed = parse_set_value(text, is_bodyweight=False)
        assert parsed.completed is False

    def test_heavy_weight_round_trip(self):
        original = SetLog(weight=195.0, reps=12, completed=True)
        text = format_set_value(original, is_bodyweight=False)
        parsed = parse_set_value(text, is_bodyweight=False)
        assert parsed.weight == 195.0
        assert parsed.reps == 12

    def test_fractional_weight_round_trip(self):
        original = SetLog(weight=12.5, reps=15, completed=True)
        text = format_set_value(original, is_bodyweight=False)
        parsed = parse_set_value(text, is_bodyweight=False)
        assert parsed.weight == 12.5
        assert parsed.reps == 15
