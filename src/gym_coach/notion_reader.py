"""Read workout history from the Notion "Workout Log" database.

The database has a *nested* structure:
  - Top-level pages have properties: Workout Name, Date, Day Type, Duration, plus
    completion metadata (Difficulty, Energy, Knee Comfort, Mood, Sauna, Workout Notes).
  - Inside each page, an inline child database ("Weight Tracking Log") holds exercise
    rows with columns: Exercise, Suggested, Sets x Reps, Set 1–4, Notes.

We use the Blocks API to find the child database, then the Database API to read its rows.
"""

from __future__ import annotations

import logging
import re
from datetime import datetime, timedelta
from typing import Any

from gym_coach.models import ExerciseLog, SetLog, WorkoutSession
from gym_coach.notion_client import NotionGymClient

logger = logging.getLogger(__name__)

# ─── Notion property helpers ──────────────────────────────────

DAY_TYPE_TO_KEY: dict[str, str] = {
    "Monday - Upper Push": "monday",
    "Tuesday - Lower Body": "tuesday",
    "Thursday - Upper Pull": "thursday",
    "Sunday - Bachata": "sunday",
}


def _extract_title(prop: dict[str, Any]) -> str:
    """Extract plain text from a Notion title property."""
    parts = prop.get("title", [])
    return "".join(p.get("plain_text", "") for p in parts)


def _extract_rich_text(prop: dict[str, Any]) -> str:
    """Extract plain text from a Notion rich_text property."""
    parts = prop.get("rich_text", [])
    return "".join(p.get("plain_text", "") for p in parts)


def _extract_select(prop: dict[str, Any]) -> str | None:
    sel = prop.get("select")
    return sel.get("name") if sel else None


def _extract_number(prop: dict[str, Any]) -> float | None:
    return prop.get("number")


def _extract_checkbox(prop: dict[str, Any]) -> bool:
    return prop.get("checkbox", False)


def _extract_date(prop: dict[str, Any]) -> str | None:
    date_obj = prop.get("date")
    if date_obj and date_obj.get("start"):
        return date_obj["start"][:10]  # "YYYY-MM-DD"
    return None


def _make_exercise_id(name: str) -> str:
    """Convert an exercise name to a slug id (e.g. 'Incline DB Press' → 'incline-db-press')."""
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug


def _parse_weight_from_text(text: str) -> float | None:
    """Try to extract a numeric weight from a text cell like '47.5' or '47.5 lbs'."""
    if not text or not text.strip():
        return None
    match = re.search(r"[\d.]+", text.strip())
    return float(match.group()) if match else None


def _parse_reps_from_text(text: str) -> int | None:
    """Try to extract reps from a text string."""
    if not text or not text.strip():
        return None
    match = re.search(r"\d+", text.strip())
    return int(match.group()) if match else None


# ─── Difficulty mapping ───────────────────────────────────────

DIFFICULTY_MAP: dict[str, int] = {
    "1": 1, "2": 2, "3": 3, "4": 4, "5": 5,
    "Easy": 1, "Moderate": 2, "Good": 3, "Hard": 4, "Max": 5,
}


# ─── Main reader ─────────────────────────────────────────────

class NotionReader:
    """Reads workout sessions from the Notion Workout Log database."""

    def __init__(self, client: NotionGymClient, database_id: str) -> None:
        self._client = client
        self._database_id = database_id

    def fetch_recent_workouts(self, weeks: int = 4) -> list[WorkoutSession]:
        """Fetch the last *weeks* of workouts, sorted most-recent first."""
        cutoff = (datetime.now() - timedelta(weeks=weeks)).strftime("%Y-%m-%d")
        pages = self._client.query_database(
            self._database_id,
            filter_obj={
                "property": "Date",
                "date": {"on_or_after": cutoff},
            },
            sorts=[{"property": "Date", "direction": "descending"}],
        )

        sessions: list[WorkoutSession] = []
        for page in pages:
            try:
                session = self._parse_workout_page(page)
                if session is not None:
                    sessions.append(session)
            except Exception:
                logger.exception("Failed to parse workout page %s", page.get("id"))
        return sessions

    def fetch_all_workouts(self) -> list[WorkoutSession]:
        """Fetch every workout in the database."""
        pages = self._client.query_database(
            self._database_id,
            sorts=[{"property": "Date", "direction": "descending"}],
        )
        sessions: list[WorkoutSession] = []
        for page in pages:
            try:
                session = self._parse_workout_page(page)
                if session is not None:
                    sessions.append(session)
            except Exception:
                logger.exception("Failed to parse workout page %s", page.get("id"))
        return sessions

    # ── internal: parse a single workout page ─────────────────

    def _parse_workout_page(self, page: dict[str, Any]) -> WorkoutSession | None:
        """Parse a Notion page (with properties and child blocks) into a WorkoutSession."""
        page_id = page["id"]
        props = page.get("properties", {})

        # -- top-level properties --
        workout_name = ""
        date_str = ""
        day_key = ""
        duration: int | None = None
        difficulty: int | None = None
        energy: str | None = None
        knee_comfort: str | None = None
        mood: str | None = None
        sauna = False
        notes = ""

        for prop_name, prop_val in props.items():
            ptype = prop_val.get("type", "")
            name_lower = prop_name.lower().replace(" ", "_")

            if ptype == "title":
                workout_name = _extract_title(prop_val)
            elif name_lower == "date" and ptype == "date":
                date_str = _extract_date(prop_val) or ""
            elif name_lower in ("day_type", "daytype", "day type") and ptype == "select":
                sel_name = _extract_select(prop_val) or ""
                day_key = DAY_TYPE_TO_KEY.get(sel_name, "")
            elif name_lower == "duration" and ptype == "number":
                num = _extract_number(prop_val)
                duration = int(num) if num is not None else None
            elif name_lower == "difficulty" and ptype == "select":
                d = _extract_select(prop_val)
                difficulty = DIFFICULTY_MAP.get(d or "", None)
            elif name_lower == "energy" and ptype == "select":
                energy = _extract_select(prop_val)
            elif name_lower in ("knee_comfort", "kneecomfort", "knee comfort") and ptype == "select":
                knee_comfort = _extract_select(prop_val)
            elif name_lower == "mood" and ptype == "select":
                mood = _extract_select(prop_val)
            elif name_lower == "sauna" and ptype == "checkbox":
                sauna = _extract_checkbox(prop_val)
            elif name_lower in ("workout_notes", "workoutnotes", "workout notes") and ptype == "rich_text":
                notes = _extract_rich_text(prop_val)

        if not date_str:
            return None

        # Infer day_key from workout name if the Day Type property wasn't found
        if not day_key:
            name_lower = workout_name.lower()
            for label, key in DAY_TYPE_TO_KEY.items():
                if label.split(" - ")[0].lower() in name_lower:
                    day_key = key
                    break

        # -- child blocks: find the Weight Tracking Log inline database --
        exercises = self._parse_exercise_table(page_id)

        return WorkoutSession(
            id=page_id,
            day_key=day_key,
            date=date_str,
            duration=duration,
            warmup_done=True,  # assume past workouts had warmup done
            completed=True,  # if it's in the DB, it was completed
            exercises=exercises,
            difficulty=difficulty,
            energy=energy,
            knee_comfort=knee_comfort,
            mood=mood,
            notes=notes,
            sauna=sauna,
        )

    def _parse_exercise_table(self, page_id: str) -> list[ExerciseLog]:
        """Find and parse the Weight Tracking Log child database inside a page."""
        child_db_id = self._client.find_child_database(page_id)
        if not child_db_id:
            logger.debug("No child database found in page %s", page_id)
            return []

        rows = self._client.query_child_database(child_db_id)
        exercises: list[ExerciseLog] = []

        for row in rows:
            props = row.get("properties", {})
            exercise = self._parse_exercise_row(props)
            if exercise:
                exercises.append(exercise)

        return exercises

    def _parse_exercise_row(self, props: dict[str, Any]) -> ExerciseLog | None:
        """Parse a single row from the Weight Tracking Log child database."""
        name = ""
        suggested = ""
        sets_reps = ""
        set_values: list[str] = ["", "", "", ""]
        row_notes = ""

        for prop_name, prop_val in props.items():
            ptype = prop_val.get("type", "")
            name_lower = prop_name.lower().strip()

            if ptype == "title":
                name = _extract_title(prop_val)
            elif name_lower == "suggested":
                suggested = _extract_rich_text(prop_val) if ptype == "rich_text" else str(_extract_number(prop_val) or "")
            elif name_lower in ("sets x reps", "sets_x_reps", "setsxreps", "sets × reps"):
                sets_reps = _extract_rich_text(prop_val) if ptype == "rich_text" else ""
            elif name_lower == "set 1":
                set_values[0] = _extract_rich_text(prop_val) if ptype == "rich_text" else ""
            elif name_lower == "set 2":
                set_values[1] = _extract_rich_text(prop_val) if ptype == "rich_text" else ""
            elif name_lower == "set 3":
                set_values[2] = _extract_rich_text(prop_val) if ptype == "rich_text" else ""
            elif name_lower == "set 4":
                set_values[3] = _extract_rich_text(prop_val) if ptype == "rich_text" else ""
            elif name_lower == "notes":
                row_notes = _extract_rich_text(prop_val) if ptype == "rich_text" else ""

        if not name:
            return None

        # Determine target weight from "Suggested" column
        target_weight = _parse_weight_from_text(suggested) or 0
        is_bodyweight = "bodyweight" in (suggested or "").lower() or target_weight == 0

        # Parse sets from Set 1–4 columns
        sets: list[SetLog] = []
        for sv in set_values:
            if not sv or not sv.strip():
                continue
            weight = _parse_weight_from_text(sv)
            reps = _parse_reps_from_text(sv) if weight is None else None
            if weight is not None or reps is not None:
                sets.append(SetLog(
                    weight=weight,
                    reps=reps,
                    completed=True,
                ))

        # If no individual set data but sets_reps tells us the structure, create empty sets
        if not sets and sets_reps:
            match = re.match(r"(\d+)", sets_reps)
            num_sets = int(match.group(1)) if match else 3
            sets = [SetLog() for _ in range(num_sets)]

        # Determine unit from suggested text
        unit = ""
        if suggested:
            suggested_lower = suggested.lower()
            if "dbs" in suggested_lower or "db" in suggested_lower:
                unit = "lb DBs"
            elif "/side" in suggested_lower:
                unit = "lbs/side"
            elif "bodyweight" in suggested_lower or "bw" in suggested_lower:
                unit = "bodyweight"
            elif "lb" in suggested_lower or "lbs" in suggested_lower:
                unit = "lbs"

        return ExerciseLog(
            id=_make_exercise_id(name),
            name=name,
            target_weight=target_weight,
            unit=unit,
            sets=sets,
            notes=row_notes,
            is_bodyweight=is_bodyweight,
        )
