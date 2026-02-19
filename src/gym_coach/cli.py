"""Typer CLI entry point — installed as `coach`."""

from __future__ import annotations

import sys
from datetime import date

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.text import Text

app = typer.Typer(
    name="coach",
    help="AI Gym Coach — workout planner with Notion sync and progressive overload.",
    no_args_is_help=True,
)
console = Console()


# ─── init ─────────────────────────────────────────────────────


@app.command()
def init() -> None:
    """Set up Notion connection and user profile."""
    from gym_coach.config import (
        get_notion_token,
        load_config,
        save_config,
        save_profile,
    )
    from gym_coach.models import Profile
    from gym_coach.notion_client import NotionClient

    console.print(Panel.fit("🏋️  [bold]AI Gym Coach Setup[/bold]", border_style="blue"))
    console.print()

    # ── Notion token ──
    token = get_notion_token()
    if token:
        console.print(f"  ✅ Notion token found (from $NOTION_API)")
    else:
        token = typer.prompt("  Enter your Notion API token")

    # ── Test connection ──
    try:
        client = NotionClient(token=token)
        page = client.get_page("30cfcd91-d09f-806c-8149-eee20d887057")
        console.print("  ✅ Connected to Notion — found 'AI Gym Coach' page")
    except Exception as e:
        console.print(f"  ❌ Failed to connect: {e}", style="red")
        raise typer.Exit(1)

    # ── Database ID ──
    cfg = load_config()
    db_id = cfg.get("database_id")
    if not db_id:
        db_id = typer.prompt(
            "  Workout Log database ID",
            default="4e387a50-855d-43b2-b2a6-a814bc3e05ab",
        )

    # ── Profile ──
    console.print()
    name = typer.prompt("  Your name", default="")
    gym = typer.prompt("  Gym", default="LA Fitness")
    session_min = typer.prompt("  Session duration (min)", default="50", type=int)

    profile = Profile(
        name=name,
        gym=gym,
        sessionDuration=session_min,
        setupComplete=True,
    )

    # ── Save ──
    cfg["notion_token"] = token
    cfg["database_id"] = db_id
    cfg["page_id"] = "30cfcd91-d09f-806c-8149-eee20d887057"
    save_config(cfg)
    save_profile(profile)

    console.print()
    console.print("  ✅ [bold green]Setup complete![/bold green]")
    console.print("  Run [bold]coach plan-week[/bold] to generate your first week.")


# ─── plan-week ────────────────────────────────────────────────


@app.command("plan-week")
def plan_week_cmd() -> None:
    """Generate next week's workouts and create them in Notion."""
    from gym_coach.config import (
        get_current_week,
        get_database_id,
        get_workout_history,
        save_workout_history,
        set_current_week,
        update_last_sync,
    )
    from gym_coach.exercises import get_day_config
    from gym_coach.notion_client import NotionClient
    from gym_coach.notion_writer import NotionWriter
    from gym_coach.planner import plan_week

    db_id = get_database_id()
    if not db_id:
        console.print("❌ No database ID configured. Run [bold]coach init[/bold] first.", style="red")
        raise typer.Exit(1)

    week = get_current_week()
    next_week = week + 1

    console.print(f"\n📋 Planning [bold]Week {next_week}[/bold] workouts...\n")

    history = get_workout_history()
    sessions = plan_week(history, next_week)

    client = NotionClient()
    writer = NotionWriter(client)

    for session in sessions:
        cfg = get_day_config(session.day_key)
        console.print(f"  {cfg.icon} Creating [bold]{cfg.label}[/bold] ({session.date})...", end=" ")
        try:
            page_id = writer.create_workout(session, db_id)
            session.notion_page_id = page_id
            console.print("✅")
        except Exception as e:
            console.print(f"❌ {e}", style="red")

    set_current_week(next_week)
    update_last_sync()

    console.print(f"\n✅ [bold green]Week {next_week} planned![/bold green] 3 workouts created in Notion.\n")

    # Show target weights summary
    _show_target_summary(sessions)


def _show_target_summary(sessions: list) -> None:
    """Display a summary table of target weights for planned sessions."""
    from gym_coach.exercises import get_day_config

    table = Table(title="Target Weights", show_header=True, header_style="bold cyan")
    table.add_column("Day", style="bold")
    table.add_column("Exercise")
    table.add_column("Target", justify="right")
    table.add_column("Unit")

    for session in sessions:
        cfg = get_day_config(session.day_key)
        for i, ex in enumerate(session.exercises):
            if ex.is_bodyweight:
                continue
            day_label = f"{cfg.icon} {cfg.label.split(' - ')[1]}" if i == 0 else ""
            table.add_row(day_label, ex.name, str(ex.target_weight), ex.unit)
        table.add_section()

    console.print(table)


# ─── sync ─────────────────────────────────────────────────────


@app.command()
def sync() -> None:
    """Fetch workout history from Notion and update local cache."""
    from gym_coach.config import (
        get_database_id,
        save_workout_history,
        update_last_sync,
    )
    from gym_coach.notion_client import NotionClient
    from gym_coach.notion_reader import NotionReader

    db_id = get_database_id()
    if not db_id:
        console.print("❌ No database ID configured. Run [bold]coach init[/bold] first.", style="red")
        raise typer.Exit(1)

    console.print("\n🔄 Syncing from Notion...\n")

    client = NotionClient()
    reader = NotionReader(client)
    sessions = reader.fetch_recent_workouts(db_id, weeks=8)

    save_workout_history(sessions)
    update_last_sync()

    console.print(f"  ✅ Synced [bold]{len(sessions)}[/bold] workouts\n")

    # Show quick summary
    if sessions:
        from gym_coach.exercises import get_day_config

        for s in sessions[:5]:
            cfg = get_day_config(s.day_key)
            sets_done = sum(1 for e in s.exercises for st in e.sets if st.completed)
            sets_total = sum(len(e.sets) for e in s.exercises)
            diff_str = f" [{s.difficulty}/5]" if s.difficulty else ""
            console.print(f"  {cfg.icon} {s.date} — {cfg.label.split(' - ')[1]}: {sets_done}/{sets_total} sets{diff_str}")
        if len(sessions) > 5:
            console.print(f"  ... and {len(sessions) - 5} more")
    console.print()


# ─── review ───────────────────────────────────────────────────


@app.command()
def review() -> None:
    """Show progress, weight trends, and completion metadata."""
    from gym_coach.config import get_workout_history
    from gym_coach.exercises import EXERCISES, get_day_config
    from gym_coach.models import DIFFICULTY_LABELS
    from gym_coach.planner import get_weekly_progress
    from gym_coach.progressive_overload import get_target_weight, get_weight_trend

    history = get_workout_history()
    if not history:
        console.print("\n📭 No workout history. Run [bold]coach sync[/bold] first.\n")
        return

    # Weekly progress
    progress = get_weekly_progress(history)
    console.print(
        Panel(
            f"[bold]{progress['completed']}/{progress['planned']}[/bold] workouts this week"
            + (f" — {', '.join(progress['days_done'])}" if progress['days_done'] else ""),
            title="📊 This Week",
            border_style="blue",
        )
    )

    # Weight trends per day
    for day_key in ["monday", "tuesday", "thursday"]:
        template = EXERCISES.get(day_key)
        if not template:
            continue
        cfg = get_day_config(day_key)

        table = Table(title=f"{cfg.icon} {cfg.label}", show_header=True, header_style="bold")
        table.add_column("Exercise")
        table.add_column("Trend", justify="right")
        table.add_column("→ Next Target", justify="right", style="bold cyan")

        for ex in template.exercises:
            if ex.is_bodyweight:
                continue
            trend = get_weight_trend(ex, history, day_key)
            target = get_target_weight(ex, history, day_key)

            trend_str = " → ".join(str(t.avg_weight) for t in reversed(trend)) if trend else "—"
            table.add_row(ex.name, trend_str, f"{target} {ex.unit}")

        console.print(table)
        console.print()

    # Recent completion metadata
    console.print("[bold]Recent Sessions:[/bold]")
    for s in history[:5]:
        cfg = get_day_config(s.day_key)
        parts = [f"{cfg.icon} {s.date}"]
        if s.difficulty:
            parts.append(f"Difficulty: {DIFFICULTY_LABELS.get(s.difficulty, str(s.difficulty))}")
        if s.energy:
            parts.append(f"Energy: {s.energy}")
        if s.knee_comfort:
            parts.append(f"Knee: {s.knee_comfort}")
        if s.mood:
            parts.append(f"Mood: {s.mood}")
        console.print("  " + " · ".join(parts))
    console.print()


# ─── status ───────────────────────────────────────────────────


@app.command()
def status() -> None:
    """Quick view: today's workout info."""
    from gym_coach.config import get_profile, get_workout_history
    from gym_coach.exercises import EXERCISES, get_day_config, get_today_day_key
    from gym_coach.planner import get_weekly_progress

    profile = get_profile()
    history = get_workout_history()
    today_key = get_today_day_key()
    progress = get_weekly_progress(history)

    # Header
    greeting = f"Hey, {profile.name}" if profile.name else "Dashboard"
    today_str = date.today().strftime("%A, %b %d")
    console.print(f"\n  [dim]{today_str}[/dim]")
    console.print(f"  [bold]{greeting}[/bold] 👋\n")

    # Weekly progress
    console.print(
        f"  📊 This week: [bold]{progress['completed']}/{progress['planned']}[/bold] workouts"
    )
    if progress["days_done"]:
        console.print(f"     Done: {', '.join(progress['days_done'])}")
    console.print()

    # Today's workout
    if today_key:
        cfg = get_day_config(today_key)
        template = EXERCISES.get(today_key)

        # Check if already done today
        today_done = any(
            s.date == date.today().isoformat() and s.day_key == today_key and s.completed
            for s in history
        )

        if today_done:
            console.print(f"  🎉 [bold green]Today's workout complete![/bold green] Rest up and recover.\n")
        elif template:
            console.print(
                Panel(
                    f"{cfg.icon} [bold]{cfg.label}[/bold]\n"
                    f"{len(template.exercises)} exercises · ~{profile.session_duration} min"
                    + (" + sauna" if template.has_sauna else ""),
                    title="Today's Workout",
                    border_style=cfg.color,
                )
            )
        else:
            console.print(f"  {cfg.icon} {cfg.label} — [dim]tracked only[/dim]\n")
    else:
        console.print("  💤 No workout scheduled today — rest day!\n")


# ─── schedule ─────────────────────────────────────────────────


@app.command()
def schedule() -> None:
    """Set up cron job to auto-plan weekly workouts."""
    from gym_coach.scheduler import get_cron_status, setup_cron

    existing = get_cron_status()
    if existing:
        console.print(f"\n  ⏰ Existing schedule: {existing}")
        if not typer.confirm("  Replace with new schedule?"):
            return

    console.print("\n  Setting up cron job (Sunday 8 PM)...", end=" ")
    if setup_cron():
        console.print("✅")
        console.print("  → `coach plan-week` will run every Sunday at 8 PM\n")
    else:
        console.print("❌", style="red")
        console.print("  Failed to set up cron. You can manually run `coach plan-week` instead.\n")
