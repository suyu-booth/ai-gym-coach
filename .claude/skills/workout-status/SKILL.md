---
name: workout-status
description: Show today's workout plan and recent weight trends. Daily coaching snapshot for the AI Gym Coach CLI.
---

Run these commands in sequence:

```bash
coach status
```

```bash
coach review
```

Format the output clearly:
- **Today**: day type, exercises, target weights (highlight any weight increases from progressive overload with ↑)
- **Trends**: exercises where weight went up or down recently, and any that are stalled
- If `coach` is not installed, remind the user to run `pip install -e .` from the project root
