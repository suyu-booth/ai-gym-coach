"""Config (~/.config/gym-coach/config.yaml) and state (state.json) management."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import yaml

from gym_coach.models import Profile, WorkoutSession

CONFIG_DIR = Path.home() / ".config" / "gym-coach"
CONFIG_FILE = CONFIG_DIR / "config.yaml"
STATE_FILE = CONFIG_DIR / "state.json"


# ─── Config (YAML) ───────────────────────────────────────────


def _ensure_config_dir() -> None:
    CONFIG_DIR.mkdir(parents=True, exist_ok=True)


def load_config() -> dict[str, Any]:
    """Load config from YAML file. Returns empty dict if not found."""
    if not CONFIG_FILE.exists():
        return {}
    with open(CONFIG_FILE) as f:
        return yaml.safe_load(f) or {}


def save_config(data: dict[str, Any]) -> None:
    """Write config to YAML file."""
    _ensure_config_dir()
    with open(CONFIG_FILE, "w") as f:
        yaml.dump(data, f, default_flow_style=False, allow_unicode=True)


def get_notion_token() -> str | None:
    """Get Notion API token — first check env var, then config file."""
    import os

    token = os.environ.get("NOTION_API")
    if token:
        return token
    cfg = load_config()
    return cfg.get("notion_token")


def get_database_id() -> str | None:
    """Get the Workout Log database ID from config."""
    cfg = load_config()
    return cfg.get("database_id")


def get_page_id() -> str:
    """Get the AI Gym Coach parent page ID."""
    cfg = load_config()
    return cfg.get("page_id", "30cfcd91-d09f-806c-8149-eee20d887057")


def get_profile() -> Profile:
    """Load user profile from config."""
    cfg = load_config()
    profile_data = cfg.get("profile", {})
    return Profile(**profile_data) if profile_data else Profile()


def save_profile(profile: Profile) -> None:
    """Save user profile to config."""
    cfg = load_config()
    cfg["profile"] = profile.model_dump(by_alias=True)
    save_config(cfg)


# ─── State (JSON) ────────────────────────────────────────────


def load_state() -> dict[str, Any]:
    """Load state from JSON file. Returns defaults if not found."""
    if not STATE_FILE.exists():
        return {
            "current_week": 1,
            "last_sync": None,
            "workout_history": [],
        }
    with open(STATE_FILE) as f:
        return json.load(f)


def save_state(data: dict[str, Any]) -> None:
    """Write state to JSON file."""
    _ensure_config_dir()
    with open(STATE_FILE, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def get_workout_history() -> list[WorkoutSession]:
    """Load cached workout history from state."""
    state = load_state()
    raw = state.get("workout_history", [])
    return [WorkoutSession(**w) for w in raw]


def save_workout_history(history: list[WorkoutSession]) -> None:
    """Save workout history to state cache."""
    state = load_state()
    state["workout_history"] = [w.model_dump(by_alias=True) for w in history]
    save_state(state)


def get_current_week() -> int:
    """Get current training week number."""
    state = load_state()
    return state.get("current_week", 1)


def set_current_week(week: int) -> None:
    """Update current training week number."""
    state = load_state()
    state["current_week"] = week
    save_state(state)


def update_last_sync() -> None:
    """Mark the current time as last sync."""
    from datetime import datetime, timezone

    state = load_state()
    state["last_sync"] = datetime.now(timezone.utc).isoformat()
    save_state(state)
