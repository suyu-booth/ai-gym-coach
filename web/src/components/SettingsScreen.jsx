import { useState } from "react";
import { palette, type, dawnGradient } from "../lib/theme.js";
import Field from "./Field.jsx";
import Glyph from "./Glyph.jsx";

export default function SettingsScreen({ profile, dispatch }) {
  const [form, setForm] = useState({ ...profile });
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ minHeight: "100vh", background: dawnGradient, color: palette.cream, padding: "24px 22px 60px" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 28 }}>
          <button onClick={() => dispatch({ type: "SET_SCREEN", payload: "dashboard" })}
            style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 0", color: palette.creamMute }}>
            <Glyph name="arrow-left" size={14} color={palette.creamMute} />
            <span style={{ ...type.caps, fontSize: 10 }}>Back</span>
          </button>
        </div>

        <div style={{ ...type.caps, color: palette.creamMute }}>Settings</div>
        <h1 style={{ ...type.display, color: palette.cream, marginTop: 6, marginBottom: 32 }}>The basics.</h1>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <Field label="Name" value={form.name} onChange={v => update("name", v)} />
          <Field label="Goals" value={form.goals} onChange={v => update("goals", v)} multiline />
          <Field label="Schedule" value={form.schedule} onChange={v => update("schedule", v)} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <Field label="Gym" value={form.gym} onChange={v => update("gym", v)} />
            <Field label="Session (min)" value={form.sessionDuration} onChange={v => update("sessionDuration", parseInt(v) || 50)} type="number" />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
            <button
              onClick={() => {
                dispatch({ type: "UPDATE_PROFILE", payload: form });
                dispatch({ type: "SHOW_TOAST", payload: { message: "Settings saved", type: "success" } });
                dispatch({ type: "SET_SCREEN", payload: "dashboard" });
              }}
              className="gh-stamp is-filled"
              style={{ padding: "12px 24px" }}
            >
              Save
            </button>
          </div>

          <div style={{ marginTop: 28, paddingTop: 22, borderTop: `1px solid ${palette.creamFaint}` }}>
            <div style={{ ...type.caps, color: palette.creamMute, marginBottom: 8 }}>Version</div>
            <div style={{ ...type.body, color: palette.creamMute }}>
              AI Gym Coach v2.0 · Notion sync
            </div>
            <div style={{ ...type.small, color: palette.creamFaint, marginTop: 4, fontStyle: "italic" }}>
              Data syncs to your Notion workspace in real time.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
