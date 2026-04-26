---
name: notion-verify
description: Fetch the live Notion Workout Log database schema and compare property names/types against schema.yaml. Run before a session to catch Notion API drift.
---

Run this command to fetch the live schema and diff it against schema.yaml:

```bash
curl -s -X GET "https://api.notion.com/v1/databases/30cfcd91-d09f-8170-bb72-e3294e05bb40" \
  -H "Authorization: Bearer $NOTION_API" \
  -H "Notion-Version: 2022-06-28" \
| python3 - <<'EOF'
import sys, json, yaml
from pathlib import Path

db = json.load(sys.stdin)
live_props = {name: val.get("type") for name, val in db.get("properties", {}).items()}

schema = yaml.safe_load(Path("schema.yaml").read_text())
expected = {
    v["notion_name"]: v["type"]
    for v in schema["workout_log"]["properties"].values()
}

print("=== Live Notion Properties ===")
for name, ptype in sorted(live_props.items()):
    print(f"  {name!r} ({ptype})")

print("\n=== Diff vs schema.yaml ===")
issues = []
for exp_name, exp_type in expected.items():
    if exp_name not in live_props:
        issues.append(f"❌ MISSING from live DB: {exp_name!r} (expected type: {exp_type})")
    elif live_props[exp_name] != exp_type:
        issues.append(f"⚠️  TYPE MISMATCH: {exp_name!r} — live={live_props[exp_name]}, expected={exp_type}")

for live_name in live_props:
    if live_name not in expected:
        issues.append(f"➕ EXTRA property in live DB (not in schema.yaml): {live_name!r}")

if issues:
    for issue in issues:
        print(issue)
    print(f"\n❌ FAIL — {len(issues)} mismatch(es) found. Update schema.yaml and re-run scripts/gen_schema.py.")
else:
    print("✅ PASS — All property names and types match schema.yaml.")
EOF
```

Also check select values for a quick spot-check:

```bash
python3 -c "
import yaml
from pathlib import Path
schema = yaml.safe_load(Path('schema.yaml').read_text())
print('=== Expected select values from schema.yaml ===')
for key, prop in schema['workout_log']['properties'].items():
    if prop['type'] == 'select':
        print(f\"  {prop['notion_name']}: {prop['options']}\")
"
```

If mismatches are found: edit `schema.yaml` → run `python scripts/gen_schema.py` → the fixes propagate to both Python and TypeScript automatically.
