"""Write workouts and completion data to the Notion "Workout Log" database.

Creates new workout pages that match the existing Notion page structure:
  1. Page properties: Workout Name, Date, Day Type, Duration, (completion metadata)
  2. Child blocks:
     - Heading "Warm-up (5 min)" + bullet list
     - Inline child database "Weight Tracking Log" with exercise rows
     - Heading "Exercise Details" + toggle blocks with form cues
"""

from __future__ import annotations

import logging
from typing import Any

from gym_coach.exercises import EXERCISES, get_day_config
from gym_coach.models import ExerciseLog, SetLog, WorkoutSession
from gym_coach.notion_client import NotionGymClient

logger = logging.getLogger(__name__)

# ─── Notion property helpers ──────────────────────────────────

DAY_KEY_TO_LABEL: dict[str, str] = {
    "monday": "Monday - Upper Push",
    "tuesday": "Tuesday - Lower Body",
    "thursday": "Thursday - Upper Pull",
    "sunday": "Sunday - Bachata",
}


def _rich_text(text: str) -> list[dict[str, Any]]:
    """Create a Notion rich_text array from a plain string."""
    if not text:
        return []
    return [{"type": "text", "text": {"content": text}}]


def _title_prop(text: str) -> dict[str, Any]:
    return {"title": _rich_text(text)}


def _rich_text_prop(text: str) -> dict[str, Any]:
    return {"rich_text": _rich_text(text)}


def _select_prop(name: str) -> dict[str, Any]:
    return {"select": {"name": name}}


def _number_prop(value: float | int | None) -> dict[str, Any]:
    return {"number": value}


def _checkbox_prop(value: bool) -> dict[str, Any]:
    return {"checkbox": value}


def _date_prop(date_str: str) -> dict[str, Any]:
    return {"date": {"start": date_str}}


# ─── Block builders ───────────────────────────────────────────

def _heading_block(text: str, level: int = 2) -> dict[str, Any]:
    key = f"heading_{level}"
    return {
        "object": "block",
        "type": key,
        key: {"rich_text": _rich_text(text)},
    }


def _bullet_block(text: str) -> dict[str, Any]:
    return {
        "object": "block",
        "type": "bulleted_list_item",
        "bulleted_list_item": {"rich_text": _rich_text(text)},
    }


def _toggle_block(title: str, children_text: list[str]) -> dict[str, Any]:
    children = [
        {
            "object": "block",
            "type": "paragraph",
            "paragraph": {"rich_text": _rich_text(t)},
        }
        for t in children_text
    ]
    return {
        "object": "block",
        "type": "toggle",
        "toggle": {
            "rich_text": _rich_text(title),
            "children": children,
        },
    }


def _divider_block() -> dict[str, Any]:
    return {"object": "block", "type": "divider", "divider": {}}


# ─── Main writer ──────────────────────────────────────────────

class NotionWriter:
    """Writes workout sessions to the Notion Workout Log database."""

    def __init__(self, client: NotionGymClient, database_id: str) -> None:
        self._client = client
        self._database_id = database_id

    def create_workout(self, session: WorkoutSession) -> str:
        """Create a new workout page in Notion. Returns the created page ID."""
        properties = self._build_page_properties(session)
        children = self._build_page_children(session)

        page = self._client.create_page(
            database_id=self._database_id,
            properties=properties,
            children=children,
        )
        page_id = page["id"]
        logger.info("Created workout page: %s (%s)", session.date, page_id)
        return page_id

    def update_workout_completion(self, page_id: str, session: WorkoutSession) -> None:
        """Update a workout page with completion metadata and set data."""
        properties: dict[str, Any] = {}

        if session.duration is not None:
            properties["Duration"] = _number_prop(session.duration)
        if session.difficulty is not None:
            properties["Difficulty"] = _select_prop(str(session.difficulty))
        if session.energy:
            properties["Energy"] = _select_prop(session.energy)
        if session.knee_comfort:
            properties["Knee Comfort"] = _select_prop(session.knee_comfort)
        if session.mood:
            properties["Mood"] = _select_prop(session.mood)
        if session.notes:
            properties["Workout Notes"] = _rich_text_prop(session.notes)
        properties["Sauna"] = _checkbox_prop(session.sauna)

        if properties:
            self._client.update_page(page_id, properties)
            logger.info("Updated completion metadata for page %s", page_id)

        # Update set data in the child database
        self._update_exercise_sets(page_id, session.exercises)

    def _update_exercise_sets(
        self, page_id: str, exercises: list[ExerciseLog]
    ) -> None:
        """Update Set 1–4 columns in the child Weight Tracking Log database."""
        child_db_id = self._client.find_child_database(page_id)
        if not child_db_id:
            logger.warning("No child database found in page %s", page_id)
            return

        rows = self._client.query_child_database(child_db_id)

        # Build a lookup: exercise name (lowercase) → row page ID
        row_lookup: dict[str, str] = {}
        for row in rows:
            props = row.get("properties", {})
            for prop_val in props.values():
                if prop_val.get("type") == "title":
                    parts = prop_val.get("title", [])
                    name = "".join(p.get("plain_text", "") for p in parts).strip().lower()
                    if name:
                        row_lookup[name] = row["id"]
                    break

        for exercise in exercises:
            row_id = row_lookup.get(exercise.name.lower())
            if not row_id:
                continue

            update_props: dict[str, Any] = {}
            for i, s in enumerate(exercise.sets[:4]):
                col_name = f"Set {i + 1}"
                if s.completed and s.weight is not None:
                    update_props[col_name] = _rich_text_prop(str(s.weight))
                elif s.completed and s.reps is not None:
                    update_props[col_name] = _rich_text_prop(str(s.reps))

            if update_props:
                self._client.update_child_row(row_id, update_props)

    # ── property builders ─────────────────────────────────────

    def _build_page_properties(self, session: WorkoutSession) -> dict[str, Any]:
        """Build the top-level page properties dict."""
        day_label = DAY_KEY_TO_LABEL.get(session.day_key, session.day_key)

        # Build workout name: "Week N Day Label"
        # Extract week from the session date or use a generic name
        workout_name = f"{day_label.split(' - ')[0]} {day_label.split(' - ')[1] if ' - ' in day_label else ''} - {session.date}"
        if hasattr(session, '_week_label') and session._week_label:
            workout_name = session._week_label

        properties: dict[str, Any] = {
            "Workout Name": _title_prop(workout_name),
            "Date": _date_prop(session.date),
            "Day Type": _select_prop(day_label),
        }

        if session.duration is not None:
            properties["Duration"] = _number_prop(session.duration)

        return properties

    def _build_page_children(self, session: WorkoutSession) -> list[dict[str, Any]]:
        """Build the child blocks for a workout page."""
        blocks: list[dict[str, Any]] = []

        # 1. Warm-up section
        day_template = EXERCISES.get(session.day_key)
        if day_template:
            blocks.append(_heading_block("Warm-up (5 min)", level=2))
            for item in day_template.warmup:
                blocks.append(_bullet_block(item))
            blocks.append(_divider_block())

        # 2. Weight Tracking Log — we can't create an inline database via the API
        #    directly in children, so we create a table block instead.
        #    Note: Notion API doesn't support creating child_database blocks.
        #    We'll use a table block as an alternative.
        if session.exercises:
            blocks.append(_heading_block("Weight Tracking Log", level=2))
            table_block = self._build_exercise_table(session.exercises)
            blocks.append(table_block)
            blocks.append(_divider_block())

        # 3. Exercise Details section
        if day_template:
            blocks.append(_heading_block("Exercise Details", level=2))
            for ex_template in day_template.exercises:
                details = []
                if ex_template.notes:
                    details.append(f"Notes: {ex_template.notes}")
                details.append(
                    f"Target: {ex_template.sets} sets \u00d7 {ex_template.reps}"
                    + (f" @ {ex_template.default_weight} {ex_template.unit}" if not ex_template.is_bodyweight else "")
                )
                blocks.append(_toggle_block(ex_template.name, details))

        # 4. Sauna / Cooldown
        if day_template and day_template.has_sauna:
            blocks.append(_divider_block())
            blocks.append(
                _bullet_block("\U0001f9d6 Sauna Recovery (10 min) \u2014 160-175\u00b0F, hydrate before & after")
            )

        if day_template and day_template.cooldown:
            blocks.append(
                _bullet_block(f"\U0001f9d8 Cool-down: {day_template.cooldown}")
            )

        return blocks

    def _build_exercise_table(self, exercises: list[ExerciseLog]) -> dict[str, Any]:
        """Build a Notion table block for the exercise list."""
        # Table with 7 columns: Exercise, Suggested, Sets x Reps, Set 1, Set 2, Set 3, Set 4
        header_row = {
            "type": "table_row",
            "table_row": {
                "cells": [
                    _rich_text("Exercise"),
                    _rich_text("Suggested"),
                    _rich_text("Sets x Reps"),
                    _rich_text("Set 1"),
                    _rich_text("Set 2"),
                    _rich_text("Set 3"),
                    _rich_text("Set 4"),
                ],
            },
        }

        rows = [header_row]
        for ex in exercises:
            suggested = (
                f"{ex.target_weight} {ex.unit}" if not ex.is_bodyweight else "Bodyweight"
            )
            sets_reps = f"{len(ex.sets)}x{ex.notes}" if ex.is_bodyweight else f"{len(ex.sets)} sets"

            # For planned workouts, sets are empty (to be filled during workout)
            set_cells = []
            for i in range(4):
                if i < len(ex.sets) and ex.sets[i].completed and ex.sets[i].weight is not None:
                    set_cells.append(_rich_text(str(ex.sets[i].weight)))
                elif i < len(ex.sets) and ex.sets[i].completed and ex.sets[i].reps is not None:
                    set_cells.append(_rich_text(str(ex.sets[i].reps)))
                else:
                    set_cells.append(_rich_text(""))

            row = {
                "type": "table_row",
                "table_row": {
                    "cells": [
                        _rich_text(ex.name),
                        _rich_text(suggested),
                        _rich_text(f"{len(ex.sets)}x{ex.sets[0].reps if ex.sets and ex.sets[0].reps else ''}"),
                        *set_cells,
                    ],
                },
            }
            rows.append(row)

        return {
            "object": "block",
            "type": "table",
            "table": {
                "table_width": 7,
                "has_column_header": True,
                "has_row_header": False,
                "children": rows,
            },
        }
