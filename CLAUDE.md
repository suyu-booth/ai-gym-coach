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

## Web App Design System — Golden Hour

The web app (`web/`) uses the **Golden Hour** design concept. All UI work must stay consistent with it.

### Concept

> *Every workout is a sunrise. You start in the dark, and by the last set, the room is lit.*

The app treats the 7 AM training schedule as its core metaphor. The workout screen background is a live sky gradient (`skyGradient()` in `web/src/lib/theme.js`) that interpolates from deep teal to burnt orange to warm sand as `completedSets / totalSets` increases — the user literally watches the sun rise as they lift.

### Palette (from Sunset Boulevard)

| Token | Hex | Use |
|---|---|---|
| `--ink` / `palette.ink` | `#1A2A33` | Page backgrounds |
| `--ink-2` / `palette.ink2` | `#264653` | Card surfaces, overlays |
| `--horizon` / `palette.horizon` | `#e76f51` | Primary CTA, day accent (Mon) |
| `--coral` / `palette.coral` | `#f4a261` | Secondary warmth, hover (Thu) |
| `--sand` / `palette.sand` | `#e9c46a` | Completion state, highlights (Tue) |
| `--cream` / `palette.cream` | `#FAF3E3` | Primary text (warm white, not pure white) |
| `--cream-mute` | `rgba(250,243,227,0.55)` | Secondary text, labels |
| `--cream-faint` | `rgba(250,243,227,0.20)` | Dividers, inactive elements |

**Day-type colorways** — each day owns a dominant accent (see `dayway()` in `theme.js`):
- Monday (Push) → `palette.horizon` (burnt orange)
- Tuesday (Lower) → `palette.sand` (warm sand)
- Thursday (Pull) → `palette.coral` (coral)
- Sunday (Bachata) → `#b07a8c` (dusk purple)

### Typography

- **Display/numerals**: **Fraunces** (serif, optical-size variable font). Used for all hero numerals, workout titles, session numbers, set weights/reps. Always the primary typographic voice.
- **UI/body**: **Inter** (sans-serif). Labels, descriptions, button text, body copy.
- **Small-caps deck-heads**: Inter 600, `letter-spacing: 0.18–0.20em`, `text-transform: uppercase`, 11–12px. Used like magazine deck-heads ("THIS WEEK", "UPPER PUSH", "SET 1").
- **Never** use pure white (`#fff`) for text — always `palette.cream` (`#FAF3E3`).
- Numbers that matter (weights, reps, session counts) are **always Fraunces**, oversized — they are the hero content.

### Motif: The Horizon

A single visual primitive — a horizontal line with sun(s) along it — is the system-wide progress metaphor. Use `<Horizon>` (`web/src/components/Horizon.jsx`) everywhere progress is shown:
- Weekly progress: three suns above/below the line for Mon/Tue/Thu
- Workout progress: one sun walking left→right, rising as sets complete
- Rest timer: one sun arcing across
- Loading/setup screens: decorative horizon header

**Never** use ring charts or bar progress indicators. The horizon is the only progress motif.

### Iconography

Use `<Glyph name="...">` (`web/src/components/Glyph.jsx`) exclusively. Available glyphs: `sun`, `sun-rising`, `sun-noon`, `sun-arc`, `sun-set`, `horizon`, `plate`, `arc`, `flame`, `wave`, `check`, `arrow-right`, `arrow-left`, `chevron-down`, `settings`, `stopwatch`, `pause`.

**Never** use emoji in the UI. Emoji exist only in Notion-bound data values (e.g. `"⚡ High"`) — strip them with `stripEmoji()` from `theme.js` before display.

### Interactive Patterns

- **Primary CTA**: `.gh-link` class — typeset text link with an animated underline that grows from left. Fraunces serif. No rounded buttons.
- **Action button**: `.gh-stamp` class — outlined rectangle, fills on press like a rubber stamp. Small-caps label.
- **Inputs**: `.gh-input` class — underline-only (no box), Fraunces serif for values.
- **No rounded corners** on interactive elements — the design uses square/sharp edges throughout.

### Layout Voice

- **Editorial, asymmetric** — not card grids. Exercise entries are numbered editorial items (Fraunces `01`, `02`…) separated by hairlines, not boxed cards.
- Completed set data renders as a caption: `47.5 LB × 10` in large Fraunces with a checkmark glyph.
- Section deck-heads are small-caps Inter, not heading tags.
- Use `dawnGradient` from `theme.js` as the base page background for all static screens (Dashboard, History, Setup, Settings).

### Key Files

- `web/src/lib/theme.js` — all tokens, `skyGradient()`, `dawnGradient`, `dayway()`, `stripEmoji()`
- `web/src/components/Glyph.jsx` — icon system
- `web/src/components/Horizon.jsx` — horizon + sun primitive
- `web/src/index.css` — CSS custom properties, `.gh-link`, `.gh-stamp`, `.gh-input`, `.gh-caps`, keyframes

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
