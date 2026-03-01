import { useState } from "react";
import Field from "./Field.jsx";

export default function SettingsScreen({ profile, dispatch }) {
  const [form, setForm] = useState({ ...profile });
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ minHeight: "100vh", background: "#0B1120", color: "#fff", padding: "16px" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={() => dispatch({ type: "SET_SCREEN", payload: "dashboard" })} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 14, cursor: "pointer" }}>{"\u2190"} Back</button>
          <h1 style={{ fontSize: 20, fontWeight: 800 }}>Settings</h1>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Name" value={form.name} onChange={v => update("name", v)} />
          <Field label="Goals" value={form.goals} onChange={v => update("goals", v)} multiline />
          <Field label="Schedule" value={form.schedule} onChange={v => update("schedule", v)} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Gym" value={form.gym} onChange={v => update("gym", v)} />
            <Field label="Session (min)" value={form.sessionDuration} onChange={v => update("sessionDuration", parseInt(v) || 50)} type="number" />
          </div>
          <button onClick={() => {
            dispatch({ type: "UPDATE_PROFILE", payload: form });
            dispatch({ type: "SHOW_TOAST", payload: { message: "Settings saved!", type: "success" } });
            dispatch({ type: "SET_SCREEN", payload: "dashboard" });
          }} style={{
            marginTop: 8, padding: "14px 0", background: "#3B82F6",
            color: "#fff", border: "none", borderRadius: 10, fontSize: 15,
            fontWeight: 700, cursor: "pointer",
          }}>Save Settings</button>

          <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.3)", marginBottom: 8, textTransform: "uppercase", letterSpacing: 1 }}>Version</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>AI Gym Coach v2.0 {"\u00B7"} Notion Sync</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", marginTop: 2 }}>Data synced to Notion in real-time</div>
          </div>
        </div>
      </div>
    </div>
  );
}
