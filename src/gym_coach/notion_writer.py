"""Write workouts and completion data to Notion."""

from __future__ import annotations

from gym_coach.exercises import EXERCISES
from gym_coach.models import ExerciseLog, SetLog, WorkoutSession
from gym_coach.notion_client import NotionClient
from gym_coach.notion_schema import PROPS, TRACK


# ─── Set value formatting ─────────────────────────────────────


def format_set_value(set_log: SetLog, is_bodyweight: bool = False) -> str:
    """Format a SetLog into the Notion text column value.

    Weighted: "47.5 × 12"
    Bodyweight: "10"
    Incomplete: ""
    """
    if not set_log.completed:
        return ""
    if is_bodyweight:
        return str(set_log.reps) if set_log.reps is not None else ""
    if set_log.weight is not None and set_log.reps is not None:
        # Format weight: drop .0 for whole numbers
        w = int(set_log.weight) if set_log.weight == int(set_log.weight) else set_log.weight
        return f"{w} × {set_log.reps}"
    return ""


# ─── Notion property builders ─────────────────────────────────


def _title_prop(text: str) -> dict:
    return {"title": [{"type": "text", "text": {"content": text}}]}


def _rich_text_prop(text: str) -> dict:
    return {"rich_text": [{"type": "text", "text": {"content": text}}]}


def _select_prop(name: str) -> dict:
    return {"select": {"name": name}}


def _number_prop(value: float | int) -> dict:
    return {"number": value}


def _checkbox_prop(value: bool) -> dict:
    return {"checkbox": value}


def _date_prop(date_str: str) -> dict:
    return {"date": {"start": date_str}}


# ─── Notion block builders ────────────────────────────────────


def _heading2_block(text: str) -> dict:
    return {
        "object": "block",
        "type": "heading_2",
        "heading_2": {
            "rich_text": [{"type": "text", "text": {"content": text}}],
        },
    }


def _heading3_block(text: str) -> dict:
    return {
        "object": "block",
        "type": "heading_3",
        "heading_3": {
            "rich_text": [{"type": "text", "text": {"content": text}}],
        },
    }


def _bulleted_list_block(text: str) -> dict:
    return {
        "object": "block",
        "type": "bulleted_list_item",
        "bulleted_list_item": {
            "rich_text": [{"type": "text", "text": {"content": text}}],
        },
    }


def _toggle_block(title: str, children: list[dict]) -> dict:
    return {
        "object": "block",
        "type": "toggle",
        "toggle": {
            "rich_text": [{"type": "text", "text": {"content": title}}],
            "children": children,
        },
    }


def _paragraph_block(text: str) -> dict:
    return {
        "object": "block",
        "type": "paragraph",
        "paragraph": {
            "rich_text": [{"type": "text", "text": {"content": text}}],
        },
    }


# ─── Build exercise row properties for child database ─────────


def _exercise_row_properties(
    exercise: ExerciseLog,
    sets_x_reps: str,
    suggested: str,
) -> dict:
    """Build Notion properties for a single exercise row."""
    props: dict = {
        TRACK.EXERCISE: _title_prop(exercise.name),
        TRACK.SUGGESTED: _rich_text_prop(suggested),
        TRACK.SETS_X_REPS: _rich_text_prop(sets_x_reps),
        TRACK.NOTES: _rich_text_prop(exercise.notes),
    }
    # Set 1-4 columns
    for i, s in enumerate(exercise.sets[:4], start=1):
        props[TRACK.SET_COLS[i - 1]] = _rich_text_prop(
            format_set_value(s, exercise.is_bodyweight)
        )
    return props


# ─── Writer class ─────────────────────────────────────────────


class NotionWriter:
    """Writes workout data to Notion."""

    def __init__(self, client: NotionClient | None = None) -> None:
        self.client = client or NotionClient()

    def create_workout(
        self,
        session: WorkoutSession,
        database_id: str,
    ) -> str:
        """Create a workout page in Notion with full structure.

        Returns the created page ID.

        Structure:
        1. Page properties: Workout Name, Date, Day Type
        2. Child blocks:
           a. Heading "Warm-up (5 min)" + bullet items
           b. (Child database is appended separately due to API limits)
           c. Heading "Exercise Details" + toggle blocks with form cues
        """
        day_template = EXERCISES.get(session.day_key)

        # ── Page properties ──
        properties: dict = {
            PROPS.WORKOUT_NAME: _title_prop(
                f"Week {self._get_week_label(session)} {self._get_day_label(session)}"
            ),
            PROPS.DATE: _date_prop(session.date),
        }

        # Add Day Type if available
        day_label = self._get_day_label(session)
        if day_label:
            properties[PROPS.DAY_TYPE] = _select_prop(day_label)

        # ── Child blocks ──
        children: list[dict] = []

        # Warm-up section
        if day_template and day_template.warmup:
            children.append(_heading2_block("Warm-up (5 min)"))
            for item in day_template.warmup:
                children.append(_bulleted_list_block(item))

        # Create the page first (Notion limits children to 100 blocks,
        # and child_database blocks must be appended separately)
        page = self.client.create_page(
            parent={"database_id": database_id},
            properties=properties,
            children=children,
        )
        page_id = page["id"]

        # Append the child database (Weight Tracking Log)
        self._create_exercise_table(page_id, session)

        # Exercise Details section
        if day_template:
            detail_blocks: list[dict] = [_heading2_block("Exercise Details")]
            for ex_template in day_template.exercises:
                cues: list[dict] = []
                if ex_template.notes:
                    cues.append(_paragraph_block(f"💡 {ex_template.notes}"))
                cues.append(
                    _paragraph_block(
                        f"{ex_template.sets} × {ex_template.reps}"
                        + (f" @ {ex_template.default_weight} {ex_template.unit}" if not ex_template.is_bodyweight else "")
                    )
                )
                detail_blocks.append(_toggle_block(ex_template.name, cues))

            self.client.append_block_children(page_id, detail_blocks)

        # Cooldown
        if day_template and day_template.cooldown:
            self.client.append_block_children(
                page_id,
                [
                    _heading3_block("Cool-down"),
                    _paragraph_block(f"🧘 {day_template.cooldown}"),
                ],
            )

        return page_id

    def _create_exercise_table(self, page_id: str, session: WorkoutSession) -> str | None:
        """Create the Weight Tracking Log as an inline child database.

        Uses POST /databases (not block append — child_database blocks
        cannot be appended via the Blocks API).
        """
        # Define the database schema
        db_properties: dict = {
            TRACK.EXERCISE: {"title": {}},
            TRACK.SUGGESTED: {"rich_text": {}},
            TRACK.SETS_X_REPS: {"rich_text": {}},
            TRACK.SET_1: {"rich_text": {}},
            TRACK.SET_2: {"rich_text": {}},
            TRACK.SET_3: {"rich_text": {}},
            TRACK.SET_4: {"rich_text": {}},
            TRACK.NOTES: {"rich_text": {}},
        }

        result = self.client.create_database(
            parent={"type": "page_id", "page_id": page_id},
            title="Weight Tracking Log",
            properties=db_properties,
        )
        child_db_id = result["id"]

        # Populate rows — one per exercise
        for ex in session.exercises:
            if ex.is_bodyweight:
                suggested = ""
            else:
                w = ex.target_weight
                suggested = str(int(w) if w == int(w) else w)
            sets_x_reps_str = self._format_sets_x_reps(ex, session.day_key)

            props = _exercise_row_properties(ex, sets_x_reps_str, suggested)

            self.client.create_page(
                parent={"database_id": child_db_id},
                properties=props,
            )

        return child_db_id

    def update_workout_completion(
        self,
        page_id: str,
        session: WorkoutSession,
    ) -> None:
        """Update page properties with completion metadata and set data."""
        properties: dict = {}

        if session.duration is not None:
            properties[PROPS.DURATION] = _number_prop(session.duration)
        if session.difficulty is not None:
            properties[PROPS.DIFFICULTY] = _select_prop(str(session.difficulty))
        if session.energy:
            properties[PROPS.ENERGY] = _select_prop(session.energy)
        if session.knee_comfort:
            properties[PROPS.KNEE_COMFORT] = _select_prop(session.knee_comfort)
        if session.mood:
            properties[PROPS.MOOD] = _select_prop(session.mood)
        if session.notes:
            properties[PROPS.WORKOUT_NOTES] = _rich_text_prop(session.notes)
        properties[PROPS.SAUNA] = _checkbox_prop(session.sauna)

        if properties:
            self.client.update_page(page_id, properties)

        # Update exercise set data in child database
        self._sync_all_sets(page_id, session)

    def _sync_all_sets(self, page_id: str, session: WorkoutSession) -> None:
        """Update Set 1-4 columns for all exercises in the child database."""
        child_db_id = self.client.find_child_database(page_id)
        if not child_db_id:
            return

        # Get existing rows
        rows = self.client.query_database(child_db_id)

        # Build a map of exercise name → row ID
        from gym_coach.notion_reader import _get_title

        row_map: dict[str, str] = {}
        for row in rows:
            name = _get_title(row.get("properties", {}), TRACK.EXERCISE)
            if name:
                row_map[name.lower()] = row["id"]

        # Update each exercise's sets
        for ex in session.exercises:
            row_id = row_map.get(ex.name.lower())
            if not row_id:
                continue
            self.sync_set_data(row_id, ex)

    def sync_set_data(self, row_page_id: str, exercise: ExerciseLog) -> None:
        """Update Set 1-4 columns for a specific exercise row."""
        props: dict = {}
        for i, s in enumerate(exercise.sets[:4], start=1):
            props[TRACK.SET_COLS[i - 1]] = _rich_text_prop(
                format_set_value(s, exercise.is_bodyweight)
            )
        self.client.update_page(row_page_id, props)

    def _get_day_label(self, session: WorkoutSession) -> str:
        """Get the Day Type label for a session."""
        from gym_coach.exercises import get_day_config

        cfg = get_day_config(session.day_key)
        return cfg.label

    def _get_week_label(self, session: WorkoutSession) -> str:
        """Get week number string. Falls back to computing from config."""
        from gym_coach.config import get_current_week

        return str(get_current_week())

    def _format_sets_x_reps(self, exercise: ExerciseLog, day_key: str) -> str:
        """Format the Sets x Reps column value, e.g. '3x10-12'."""
        template = EXERCISES.get(day_key)
        if template:
            tmpl_ex = next((e for e in template.exercises if e.id == exercise.id), None)
            if tmpl_ex:
                return f"{tmpl_ex.sets}x{tmpl_ex.reps}"
        return f"{len(exercise.sets)}x12"
