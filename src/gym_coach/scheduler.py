"""Cron scheduling for automated weekly workout planning.

Sets up a user cron job to run ``coach plan-week`` every Sunday at 8 PM.
"""

from __future__ import annotations

import shutil
import sys
from pathlib import Path

from crontab import CronTab

CRON_COMMENT = "ai-gym-coach-plan-week"
LOG_FILE = Path.home() / ".config" / "gym-coach" / "scheduler.log"


def setup_cron() -> None:
    """Create (or update) a user cron entry for weekly plan generation."""
    coach_path = shutil.which("coach")
    if not coach_path:
        # Fall back to running via python -m
        coach_path = f"{sys.executable} -m gym_coach.cli"

    command = f"{coach_path} plan-week --week 0 >> {LOG_FILE} 2>&1"

    cron = CronTab(user=True)

    # Remove any existing job with our comment
    cron.remove_all(comment=CRON_COMMENT)

    job = cron.new(command=command, comment=CRON_COMMENT)
    job.setall("0 20 * * 0")  # Sunday at 20:00

    cron.write()


def remove_cron() -> None:
    """Remove the gym coach cron job."""
    cron = CronTab(user=True)
    cron.remove_all(comment=CRON_COMMENT)
    cron.write()
