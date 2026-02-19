# AI Gym Coach

Python CLI app that syncs gym workouts to Notion with progressive overload tracking.

## Quick Reference

- **Plan**: See `PLAN.md` for full implementation spec
- **JSX reference**: `~/Desktop/gym-coach.jsx` is the source-of-truth frontend
- **Entry point**: `src/gym_coach/cli.py` (Typer app, installed as `coach`)
- **Python**: >=3.10
- **Package manager**: pip / setuptools (see `pyproject.toml`)

## Project Structure

```
src/gym_coach/
  cli.py                  # Typer CLI (coach init/plan-week/sync/review/status/schedule)
  config.py               # Config (~/.config/gym-coach/config.yaml) + state (state.json)
  models.py               # Pydantic models matching JSX data structures
  exercises.py            # Exercise library (4 day types, exact weights/sets/reps)
  progressive_overload.py # get_target_weight + get_weight_trend (port of JSX logic)
  notion_client.py        # Notion REST API wrapper (httpx, not SDK)
  notion_reader.py        # Read workout history from Notion
  notion_writer.py        # Write workouts + completion data to Notion
  planner.py              # Weekly workout generation
  scheduler.py            # Cron job setup
```

## Notion Integration

- **API token**: stored in env var `NOTION_API`
- **AI Gym Coach page ID**: `30cfcd91-d09f-806c-8149-eee20d887057`
- **Workout Log database ID**: `30cfcd91-d09f-8170-bb72-e3294e05bb40`
- Only modify the "AI Gym Coach" page and its sub-pages. Never touch other Notion pages.
- **Use the Notion REST API directly** (`httpx` with `$NOTION_API` token, `Notion-Version: 2022-06-28`) for all Notion operations — do not use the MCP Notion tools or the `notion-client` Python SDK.

### Workout Log Database Properties (top-level)

| Property | Type | Notes |
|---|---|---|
| `Workout Name` | title | e.g. "Week 8 Monday Upper Push" |
| `Date` | date | |
| `Day Type` | select | "Monday - Upper Push", "Tuesday - Lower Body", "Thursday - Upper Pull" |
| `Duration` | number | Minutes |
| `Difficulty` | select | "1", "2", "3", "4", "5" |
| `Energy` | select | "⚡ High", "😐 Medium", "😴 Low" |
| `Knee Comfort` | select | "✅ No pain", "⚠️ Mild discomfort", "🛑 Pain" |
| `Mood` | select | "😊 Great", "😌 Good", "😐 Neutral", "😓 Tired" |
| `Sauna` | checkbox | |
| `Workout Notes` | rich_text | |

### Weight Tracking Log (inline child database inside each workout page)

| Column | Type | Notes |
|---|---|---|
| `Exercise` | title | |
| `Suggested` | text | Target weight from progressive overload |
| `Sets x Reps` | text | e.g. "3x10-12" |
| `Set 1` | text | `"weight × reps"` e.g. "47.5 × 12", or just "10" for bodyweight |
| `Set 2` | text | `"weight × reps"` or reps-only for bodyweight |
| `Set 3` | text | `"weight × reps"` or reps-only for bodyweight |
| `Set 4` | text | `"weight × reps"` or reps-only for bodyweight |
| `Notes` | text | |

## Key Domain Rules

- **Set data**: Each set tracks weight AND reps as separate fields. A set is `completed` when both weight and reps are non-null (weighted) or reps is non-null (bodyweight). In Notion, stored as `"weight × reps"` text.
- **Progressive overload**: Needs 2+ sessions meeting target reps AND difficulty <= 3 before increasing weight. Decrease if difficulty >= 5. Round to nearest 0.5 lb.
- **Quick-log**: Auto-fills a set with targetWeight and parsed target reps in one action (⚡ feature from JSX).
- **Rest timer**: 90-second countdown after logging a set. UI-only, not persisted.
- **Day types**: Monday (Upper Push 💪), Tuesday (Lower Body 🦵), Thursday (Upper Pull 🏋️), Sunday (Bachata 💃, tracked only)
- **Training schedule**: Mon/Tue/Thu @ 7 AM, LA Fitness
- **Knee protocol**: Always active — exercises are pre-selected to be knee-friendly
- **Completion metadata values include emojis** (e.g. "⚡ High", "✅ No pain", "😊 Great") — must match JSX exactly

## Code Conventions

- Use Pydantic v2 models for all data structures
- Snake_case for Python, matching JSX logic exactly where ported
- Type hints on all function signatures
- Use `rich` for CLI output formatting
- Use `httpx` for Notion REST API calls (not `notion-client` SDK)
- Keep Notion API calls in `notion_client.py`; readers/writers use that wrapper
- Config lives at `~/.config/gym-coach/`

## Running

```bash
pip install -e .
coach init          # Setup Notion connection
coach plan-week     # Generate next week's workouts
coach sync          # Fetch workout history from Notion
coach review        # Show progress + weight trends
coach status        # Today's workout info
coach schedule      # Setup cron automation
```

## Testing

```bash
pip install -e ".[dev]"
pytest tests/
```
