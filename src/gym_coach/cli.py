"""CLI entry point — all ``coach`` commands live here."""

from __future__ import annotations

from datetime import datetime

import typer
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from gym_coach.config import AppConfig, AppState
from gym_coach.exercises import EXERCISES, get_day_config
from gym_coach.notion_client import NotionGymClient
from gym_coach.notion_reader import NotionReader
from gym_coach.notion_writer import NotionWriter
from gym_coach.planner import get_today_day_key, get_weekly_progress, plan_week
from gym_coach.progressive_overload import get_target_weight, get_weight_trend

app = typer.Typer(
    name="coach",
    help="AI Gym Coach \u2014 workout planner with Notion sync and progressive overload.",
    no_args_is_help=True,
)
console = Console()


# ─── Helpers ──────────────────────────────────────────────────

def _get_notion(config: AppConfig) -> tuple[NotionGymClient, NotionReader, NotionWriter]:
    """Create Notion client, reader, and writer from config."""
    client = NotionGymClient(config.notion_token)
    reader = NotionReader(client, config.database_id)
    writer = NotionWriter(client, config.database_id)
    return client, reader, writer


def _require_config() -> AppConfig:
    """Load config and abort if not configured."""
    config = AppConfig.load()
    if not config.is_configured:
        console.print(
            "[bold red]Not configured.[/] Run [bold cyan]coach init[/] first."
        )
        raise typer.Exit(1)
    return config


# ─── Commands ─────────────────────────────────────────────────

@app.command()
def init() -> None:
    """Set up the gym coach \u2014 Notion token, database ID, and profile."""
    config = AppConfig.load()

    console.print(
        Panel(
            "[bold]AI Gym Coach Setup[/]\n\n"
            "You'll need:\n"
            "1. A Notion integration token (from notion.so/my-integrations)\n"
            "2. Your Workout Log database ID (from the database URL)\n"
            "3. The integration must be connected to your Exercise workspace",
            title="\U0001f3cb\ufe0f  Welcome",
            border_style="blue",
        )
    )

    # Notion credentials
    token = typer.prompt(
        "Notion API token",
        default=config.notion_token or "",
        show_default=bool(config.notion_token),
    )
    db_id = typer.prompt(
        "Workout Log database ID",
        default=config.database_id or "",
        show_default=bool(config.database_id),
    )

    config.notion_token = token.strip()
    config.database_id = db_id.strip().replace("-", "")

    # Test connection
    console.print("\nTesting Notion connection...", style="dim")
    try:
        client = NotionGymClient(config.notion_token)
        db_info = client.test_connection(config.database_id)
        db_title_parts = db_info.get("title", [])
        db_title = "".join(p.get("plain_text", "") for p in db_title_parts)
        console.print(f"[green]\u2713[/] Connected to database: [bold]{db_title}[/]")

        # Try reading pages
        pages = client.query_database(config.database_id, page_size=3)
        console.print(f"[green]\u2713[/] Found {len(pages)} workout(s) in database")

        # Try reading child blocks from the first page
        if pages:
            first_page_id = pages[0]["id"]
            child_db_id = client.find_child_database(first_page_id)
            if child_db_id:
                rows = client.query_child_database(child_db_id)
                console.print(
                    f"[green]\u2713[/] Found Weight Tracking Log with {len(rows)} exercise(s)"
                )
            else:
                console.print(
                    "[yellow]\u26a0[/] No inline database found in the first workout page. "
                    "The page structure may differ."
                )
    except Exception as e:
        console.print(f"[red]\u2717 Connection failed:[/] {e}")
        console.print(
            "\nCheck that:\n"
            "  1. Your token is correct\n"
            "  2. The database ID is correct (32-char hex from the URL)\n"
            "  3. The integration is connected to the page (Share \u2192 Connections)"
        )
        raise typer.Exit(1)

    # Profile
    console.print("\n[bold]Profile setup:[/]")
    profile = config.profile
    profile.name = typer.prompt("Your name", default=profile.name or "")
    profile.goals = typer.prompt("Goals", default=profile.goals)
    profile.gym = typer.prompt("Gym", default=profile.gym)
    profile.session_duration = int(
        typer.prompt("Session duration (min)", default=str(profile.session_duration))
    )
    profile.knee_protocol = typer.confirm(
        "Enable knee protection protocol?", default=profile.knee_protocol
    )
    profile.setup_complete = True

    config.save()
    console.print(
        "\n[bold green]\u2713 Setup complete![/] Config saved to "
        f"[dim]{config.save.__func__.__qualname__}[/]"
    )
    console.print(
        "Run [bold cyan]coach sync[/] to pull your workout history, "
        "then [bold cyan]coach plan-week[/] to generate next week's plan."
    )


@app.command(name="sync")
def sync_cmd() -> None:
    """Sync workout history from Notion to local state."""
    config = _require_config()
    state = AppState.load()
    _, reader, _ = _get_notion(config)

    console.print("Syncing from Notion...", style="dim")
    workouts = reader.fetch_all_workouts()
    new_count = state.merge_workouts(workouts)
    state.last_sync = datetime.now().isoformat()
    state.save()

    console.print(
        f"[green]\u2713[/] Synced {len(workouts)} workout(s) "
        f"({new_count} new). Total history: {len(state.workout_history)}"
    )


@app.command(name="plan-week")
def plan_week_cmd(
    week: int = typer.Option(0, help="Week number (0 = auto-increment)"),
) -> None:
    """Generate next week's workouts and push them to Notion."""
    config = _require_config()
    state = AppState.load()
    _, reader, writer = _get_notion(config)

    # Sync recent history first
    console.print("Syncing recent history...", style="dim")
    recent = reader.fetch_recent_workouts(weeks=6)
    state.merge_workouts(recent)
    state.last_sync = datetime.now().isoformat()

    week_num = week if week > 0 else state.current_week + 1

    console.print(
        f"\nPlanning [bold]Week {week_num}[/] workouts...",
    )

    sessions = plan_week(state.workout_history, week_num)

    # Display the plan
    for session in sessions:
        cfg = get_day_config(session.day_key)
        table = Table(
            title=f"{cfg.icon} {cfg.label} \u2014 {session.date}",
            show_header=True,
            header_style="bold",
        )
        table.add_column("Exercise", style="cyan")
        table.add_column("Target Weight", justify="right")
        table.add_column("Sets \u00d7 Reps")

        template = EXERCISES.get(session.day_key)
        for ex_log, ex_tmpl in zip(session.exercises, template.exercises if template else []):
            weight_str = (
                f"{ex_log.target_weight} {ex_log.unit}"
                if not ex_log.is_bodyweight
                else "Bodyweight"
            )
            table.add_row(
                ex_log.name,
                weight_str,
                f"{ex_tmpl.sets} \u00d7 {ex_tmpl.reps}",
            )
        console.print(table)
        console.print()

    # Confirm and push
    if typer.confirm("Push these workouts to Notion?", default=True):
        for session in sessions:
            page_id = writer.create_workout(session)
            console.print(
                f"  [green]\u2713[/] Created: {session.date} {get_day_config(session.day_key).label}"
            )

        state.current_week = week_num
        state.save()
        console.print(
            f"\n[bold green]\u2713 Week {week_num} planned![/] "
            "Check your Notion Workout Log."
        )
    else:
        console.print("[dim]Cancelled.[/]")


@app.command()
def review() -> None:
    """Show a review of recent progress and upcoming targets."""
    config = _require_config()
    state = AppState.load()

    if not state.workout_history:
        console.print(
            "[yellow]No workout history.[/] Run [bold cyan]coach sync[/] first."
        )
        raise typer.Exit(0)

    history = state.workout_history

    # Weekly progress
    progress = get_weekly_progress(history)
    console.print(
        Panel(
            f"[bold]{progress['completed']}/{progress['planned']}[/] workouts this week"
            + (f"  ({', '.join(progress['days_done'])})" if progress['days_done'] else ""),
            title="\U0001f4ca Weekly Progress",
            border_style="blue",
        )
    )

    # Weight trends per day
    for day_key in ("monday", "tuesday", "thursday"):
        template = EXERCISES.get(day_key)
        if not template:
            continue

        cfg = get_day_config(day_key)
        table = Table(
            title=f"{cfg.icon} {cfg.label}",
            show_header=True,
            header_style="bold",
        )
        table.add_column("Exercise", style="cyan")
        table.add_column("Recent Weights", justify="right")
        table.add_column("Next Target", justify="right", style="green")

        for ex_tmpl in template.exercises:
            if ex_tmpl.is_bodyweight:
                continue
            trend = get_weight_trend(ex_tmpl, history, day_key)
            trend_str = " \u2192 ".join(str(int(t.avg_weight)) for t in trend) if trend else "\u2014"
            target = get_target_weight(ex_tmpl, history, day_key)
            table.add_row(
                ex_tmpl.name,
                trend_str,
                f"{target} {ex_tmpl.unit}",
            )

        console.print(table)
        console.print()

    # Completion metadata trends
    recent_completed = [s for s in history[:10] if s.completed and s.difficulty]
    if recent_completed:
        avg_diff = sum(s.difficulty for s in recent_completed) / len(recent_completed)
        knee_issues = sum(
            1 for s in recent_completed
            if s.knee_comfort and "pain" in s.knee_comfort.lower()
        )

        console.print(
            Panel(
                f"Avg difficulty: [bold]{avg_diff:.1f}[/]/5\n"
                f"Knee pain reports: [bold {'red' if knee_issues else 'green'}]{knee_issues}[/] "
                f"in last {len(recent_completed)} workouts",
                title="\U0001f4cb Recovery Notes",
                border_style="yellow",
            )
        )


@app.command()
def status() -> None:
    """Quick status \u2014 today's workout and next planned."""
    state = AppState.load()
    today_key = get_today_day_key()
    progress = get_weekly_progress(state.workout_history)

    if today_key and today_key in ("monday", "tuesday", "thursday"):
        cfg = get_day_config(today_key)
        already_done = today_key in progress["days_done"]
        if already_done:
            console.print(f"[green]\u2713[/] Today's workout ({cfg.label}) is done!")
        else:
            console.print(f"{cfg.icon} Today: [bold]{cfg.label}[/]")
            template = EXERCISES.get(today_key)
            if template:
                console.print(
                    f"  {len(template.exercises)} exercises \u00b7 "
                    f"~50 min"
                    + (" + sauna" if template.has_sauna else "")
                )
    elif today_key == "sunday":
        console.print("\U0001f483 Today: [bold]Sunday \u2014 Bachata![/] Enjoy the dance.")
    else:
        console.print("[dim]No workout scheduled today.[/] Rest day.")

    console.print(
        f"\nWeekly progress: [bold]{progress['completed']}/{progress['planned']}[/]"
    )


@app.command()
def schedule() -> None:
    """Set up a cron job to auto-run plan-week every Sunday at 8 PM."""
    from gym_coach.scheduler import setup_cron

    setup_cron()
    console.print("[green]\u2713[/] Cron job scheduled: plan-week runs every Sunday at 8 PM.")


if __name__ == "__main__":
    app()
