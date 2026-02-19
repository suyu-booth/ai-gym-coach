"""Cron job setup — runs `coach plan-week` every Sunday at 8 PM."""

from __future__ import annotations

import shutil
import sys
from pathlib import Path

from gym_coach.config import CONFIG_DIR


LOG_FILE = CONFIG_DIR / "scheduler.log"


def setup_cron() -> bool:
    """Set up a cron entry to run `coach plan-week` every Sunday at 8 PM.

    Returns True if successful, False otherwise.
    """
    try:
        from crontab import CronTab
    except ImportError:
        print("Error: python-crontab not installed. Run: pip install python-crontab", file=sys.stderr)
        return False

    # Find the coach executable
    coach_path = shutil.which("coach")
    if not coach_path:
        print("Error: 'coach' command not found in PATH. Install with: pip install -e .", file=sys.stderr)
        return False

    cron = CronTab(user=True)

    # Remove existing gym-coach cron jobs
    cron.remove_all(comment="gym-coach-planner")

    # Create new job: Sunday 8 PM
    job = cron.new(
        command=f"{coach_path} plan-week >> {LOG_FILE} 2>&1",
        comment="gym-coach-planner",
    )
    job.dow.on(0)  # Sunday
    job.hour.on(20)  # 8 PM
    job.minute.on(0)

    cron.write()
    return True


def remove_cron() -> bool:
    """Remove the gym-coach cron entry."""
    try:
        from crontab import CronTab
    except ImportError:
        return False

    cron = CronTab(user=True)
    cron.remove_all(comment="gym-coach-planner")
    cron.write()
    return True


def get_cron_status() -> str | None:
    """Check if the gym-coach cron job exists, return its schedule string."""
    try:
        from crontab import CronTab
    except ImportError:
        return None

    cron = CronTab(user=True)
    for job in cron.find_comment("gym-coach-planner"):
        return str(job)
    return None
