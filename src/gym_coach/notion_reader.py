"""Read workout history from Notion — parses pages and child databases."""

from __future__ import annotations

import re
from datetime import date, timedelta

from gym_coach.models import ExerciseLog, SetLog, WorkoutSession
from gym_coach.notion_client import NotionClient
from gym_coach.notion_schema import PROPS, TRACK


# ─── Set value parsing ────────────────────────────────────────


def parse_set_value(text: str, is_bodyweight: bool = False) -> SetLog:
    """Parse a Notion Set column value back into a SetLog.

    Weighted format: "47.5 × 12" → SetLog(weight=47.5, reps=12, completed=True)
    Bodyweight format: "10" → SetLog(weight=0, reps=10, completed=True)
    Empty/blank: → SetLog(weight=None, reps=None, completed=False)
    """
    text = text.strip()
    if not text:
        return SetLog(weight=None, reps=None, completed=False)

    if is_bodyweight:
        try:
            reps = int(text)
            return SetLog(weight=0, reps=reps, completed=True)
        except ValueError:
            return SetLog(weight=None, reps=None, completed=False)

    # Try "weight × reps" format
    if " × " in text:
        parts = text.split(" × ")
        try:
            weight = float(parts[0])
            reps = int(parts[1])
            return SetLog(weight=weight, reps=reps, completed=True)
        except (ValueError, IndexError):
            pass

    # Fallback: try parsing as just a number (legacy weight-only format)
    try:
        weight = float(text)
        return SetLog(weight=weight, reps=None, completed=False)
    except ValueError:
        return SetLog(weight=None, reps=None, completed=False)


# ─── Notion property extractors ───────────────────────────────


def _get_title(props: dict, key: str) -> str:
    """Extract title text from a Notion property."""
    prop = props.get(key, {})
    title_arr = prop.get("title", [])
    return title_arr[0]["plain_text"] if title_arr else ""


def _get_rich_text(props: dict, key: str) -> str:
    """Extract rich text content from a Notion property."""
    prop = props.get(key, {})
    rt_arr = prop.get("rich_text", [])
    return rt_arr[0]["plain_text"] if rt_arr else ""


def _get_select(props: dict, key: str) -> str | None:
    """Extract select value from a Notion property."""
    prop = props.get(key, {})
    sel = prop.get("select")
    return sel["name"] if sel else None


def _get_number(props: dict, key: str) -> float | None:
    """Extract number from a Notion property."""
    prop = props.get(key, {})
    return prop.get("number")


def _get_checkbox(props: dict, key: str) -> bool:
    """Extract checkbox value from a Notion property."""
    prop = props.get(key, {})
    return prop.get("checkbox", False)


def _get_date(props: dict, key: str) -> str | None:
    """Extract date string from a Notion property."""
    prop = props.get(key, {})
    d = prop.get("date")
    return d["start"] if d else None


# ─── Parse exercise rows from child database ─────────────────


def _detect_bodyweight(exercise_name: str, suggested: str) -> bool:
    """Determine if an exercise is bodyweight based on its data."""
    bw_keywords = ["bodyweight", "plank", "dead bug", "hip abduction"]
    name_lower = exercise_name.lower()
    return any(kw in name_lower for kw in bw_keywords) or suggested.strip() in ("0", "BW", "")


def _parse_exercise_row(row: dict) -> ExerciseLog:
    """Parse a single row from the Weight Tracking Log child database."""
    props = row.get("properties", {})

    exercise_name = _get_title(props, TRACK.EXERCISE)
    suggested = _get_rich_text(props, TRACK.SUGGESTED)
    sets_x_reps = _get_rich_text(props, TRACK.SETS_X_REPS)
    notes = _get_rich_text(props, TRACK.NOTES)

    is_bodyweight = _detect_bodyweight(exercise_name, suggested)

    # Parse target weight from Suggested
    target_weight = 0.0
    if not is_bodyweight and suggested:
        try:
            target_weight = float(suggested)
        except ValueError:
            pass

    # Parse sets from Set 1-4 columns
    sets: list[SetLog] = []
    for i in range(1, 5):
        col_name = TRACK.SET_COLS[i - 1]
        set_text = _get_rich_text(props, col_name)
        if set_text or i <= _count_expected_sets(sets_x_reps):
            sets.append(parse_set_value(set_text, is_bodyweight))

    # Generate exercise ID from name (slug)
    ex_id = _slugify(exercise_name)

    # Determine unit from suggested text or name
    unit = "bodyweight" if is_bodyweight else "lbs"

    return ExerciseLog(
        id=ex_id,
        name=exercise_name,
        targetWeight=target_weight,
        unit=unit,
        sets=sets,
        notes=notes,
        isBodyweight=is_bodyweight,
    )


def _count_expected_sets(sets_x_reps: str) -> int:
    """Parse "3x10-12" → 3 (the number of sets)."""
    match = re.match(r"(\d+)", sets_x_reps)
    return int(match.group(1)) if match else 3


def _slugify(name: str) -> str:
    """Convert exercise name to a slug ID.

    "Incline DB Press" → "incline-db-press"
    "Leg Press (high foot)" → "leg-press"
    """
    s = name.lower().strip()
    s = re.sub(r"\(.*?\)", "", s)  # remove parenthetical
    s = re.sub(r"[^a-z0-9\s-]", "", s)
    s = re.sub(r"\s+", "-", s.strip())
    s = re.sub(r"-+", "-", s)
    return s.strip("-")


# ─── Parse a full workout page ────────────────────────────────


def _parse_day_key(day_type_str: str | None) -> str:
    """Parse Day Type select value to day key.

    "Monday - Upper Push" → "monday"
    """
    if not day_type_str:
        return "unknown"
    first_word = day_type_str.split(" ")[0].lower().strip()
    mapping = {"monday": "monday", "tuesday": "tuesday", "thursday": "thursday", "sunday": "sunday"}
    return mapping.get(first_word, first_word)


def _parse_difficulty(val: str | None) -> int | None:
    """Parse difficulty select value to int."""
    if val is None:
        return None
    try:
        return int(val)
    except ValueError:
        return None


class NotionReader:
    """Reads workout data from Notion."""

    def __init__(self, client: NotionClient | None = None) -> None:
        self.client = client or NotionClient()

    def fetch_recent_workouts(
        self,
        database_id: str,
        weeks: int = 4,
    ) -> list[WorkoutSession]:
        """Fetch recent workouts from the Workout Log database."""
        since = (date.today() - timedelta(weeks=weeks)).isoformat()

        pages = self.client.query_database(
            database_id,
            filter={
                "property": "Date",
                "date": {"on_or_after": since},
            },
            sorts=[{"property": "Date", "direction": "descending"}],
        )

        sessions: list[WorkoutSession] = []
        for page in pages:
            try:
                session = self.parse_workout_page(page)
                sessions.append(session)
            except Exception as e:
                # Log but don't fail on a single bad page
                import sys

                print(f"Warning: failed to parse page {page.get('id', '?')}: {e}", file=sys.stderr)

        return sessions

    def fetch_all_workout_notes(self, database_id: str) -> list[dict]:
        """Fetch all workouts with a non-empty Workout Notes field.

        Skips exercise child-DB queries for speed. Returns lightweight dicts:
        {date, workout_name, day_key, difficulty, energy, mood, notes}
        """
        pages = self.client.query_database(
            database_id,
            filter={
                "property": "Workout Notes",
                "rich_text": {"is_not_empty": True},
            },
            sorts=[{"property": "Date", "direction": "descending"}],
        )

        results = []
        for page in pages:
            props = page.get("properties", {})
            results.append({
                "date": _get_date(props, "Date") or "",
                "workout_name": _get_title(props, "Workout Name"),
                "day_key": _parse_day_key(_get_select(props, "Day Type")),
                "difficulty": _parse_difficulty(_get_select(props, "Difficulty")),
                "energy": _get_select(props, "Energy"),
                "mood": _get_select(props, "Mood"),
                "notes": _get_rich_text(props, "Workout Notes"),
            })
        return results

    def parse_workout_page(self, page: dict) -> WorkoutSession:
        """Parse a Notion page into a WorkoutSession.

        Can accept either a full page dict (from query) or just a page_id string.
        """
        if isinstance(page, str):
            page = self.client.get_page(page)

        page_id = page["id"]
        props = page.get("properties", {})

        # Parse top-level properties
        workout_name = _get_title(props, PROPS.WORKOUT_NAME)
        date_str = _get_date(props, PROPS.DATE) or ""
        day_type = _get_select(props, PROPS.DAY_TYPE)
        duration = _get_number(props, PROPS.DURATION)
        difficulty = _parse_difficulty(_get_select(props, PROPS.DIFFICULTY))
        energy = _get_select(props, PROPS.ENERGY)
        knee_comfort = _get_select(props, PROPS.KNEE_COMFORT)
        mood = _get_select(props, PROPS.MOOD)
        sauna = _get_checkbox(props, PROPS.SAUNA)
        notes = _get_rich_text(props, PROPS.WORKOUT_NOTES)

        day_key = _parse_day_key(day_type)

        # Find and parse exercise data from child database
        exercises: list[ExerciseLog] = []
        child_db_id = self.client.find_child_database(page_id)
        if child_db_id:
            rows = self.client.query_database(child_db_id)
            exercises = [_parse_exercise_row(r) for r in rows]

        # Extract week number from workout name if present (e.g. "Week 8 ...")
        session_id = page_id

        return WorkoutSession(
            id=session_id,
            dayKey=day_key,
            date=date_str,
            duration=int(duration) if duration else None,
            completed=True,  # If it's in Notion, it was completed
            exercises=exercises,
            difficulty=difficulty,
            energy=energy,
            kneeComfort=knee_comfort,
            mood=mood,
            notes=notes,
            sauna=sauna,
            notion_page_id=page_id,
        )
