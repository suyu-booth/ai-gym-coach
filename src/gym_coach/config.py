"""Configuration and persistent state management.

Config lives in ``~/.config/gym-coach/config.yaml`` (static, user-set).
State lives in ``~/.config/gym-coach/state.json`` (mutable, auto-updated).
"""

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
class AppConfig:
    """Application configuration loaded from ``config.yaml``."""

    def __init__(
        self,
        notion_token: str = "",
        database_id: str = "",
        profile: Profile | None = None,
    ) -> None:
        self.notion_token = notion_token
        self.database_id = database_id
        self.profile = profile or Profile()

    # -- persistence --------------------------------------------------------

    @classmethod
    def load(cls) -> "AppConfig":
        """Load config from disk, returning defaults if the file doesn't exist."""
        if not CONFIG_FILE.exists():
            return cls()
        with CONFIG_FILE.open() as f:
            data: dict[str, Any] = yaml.safe_load(f) or {}
        profile_data = data.get("profile", {})
        return cls(
            notion_token=data.get("notion_token", ""),
            database_id=data.get("database_id", ""),
            profile=Profile(**profile_data) if profile_data else Profile(),
        )

    def save(self) -> None:
        """Persist config to disk."""
        CONFIG_DIR.mkdir(parents=True, exist_ok=True)
        data = {
            "notion_token": self.notion_token,
            "database_id": self.database_id,
            "profile": self.profile.model_dump(),
        }
        with CONFIG_FILE.open("w") as f:
            yaml.dump(data, f, default_flow_style=False, sort_keys=False)

    @property
    def is_configured(self) -> bool:
        return bool(self.notion_token and self.database_id)


# ─── State (JSON) ────────────────────────────────────────────
class AppState:
    """Mutable application state persisted between runs."""

    def __init__(
        self,
        current_week: int = 1,
        last_sync: str = "",
        workout_history: list[WorkoutSession] | None = None,
    ) -> None:
        self.current_week = current_week
        self.last_sync = last_sync
        self.workout_history: list[WorkoutSession] = workout_history or []

    # -- persistence --------------------------------------------------------

    @classmethod
    def load(cls) -> "AppState":
        if not STATE_FILE.exists():
            return cls()
        with STATE_FILE.open() as f:
            data: dict[str, Any] = json.load(f)
        history_raw = data.get("workout_history", [])
        history = [WorkoutSession(**w) for w in history_raw]
        return cls(
            current_week=data.get("current_week", 1),
            last_sync=data.get("last_sync", ""),
            workout_history=history,
        )

    def save(self) -> None:
        CONFIG_DIR.mkdir(parents=True, exist_ok=True)
        data = {
            "current_week": self.current_week,
            "last_sync": self.last_sync,
            "workout_history": [w.model_dump() for w in self.workout_history],
        }
        with STATE_FILE.open("w") as f:
            json.dump(data, f, indent=2)

    def merge_workouts(self, workouts: list[WorkoutSession]) -> int:
        """Merge *workouts* into history, deduplicating by id. Returns count of new entries."""
        existing_ids = {w.id for w in self.workout_history}
        new = [w for w in workouts if w.id not in existing_ids]
        self.workout_history = sorted(
            self.workout_history + new,
            key=lambda w: w.date,
            reverse=True,
        )
        return len(new)
