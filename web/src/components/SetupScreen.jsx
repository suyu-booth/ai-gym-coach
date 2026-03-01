import { useState } from "react";
import { getDayConfig } from "../lib/utils.js";
import Field from "./Field.jsx";

export default function SetupScreen({ profile, dispatch }) {
  const [form, setForm] = useState({
    name: profile.name || "",
    goals: profile.goals,
    schedule: profile.schedule,
    gym: profile.gym,
    sessionDuration: profile.sessionDuration,
    kneeProtocol: profile.kneeProtocol,
  });
  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ minHeight: "100vh", background: "#0B1120", color: "#fff", padding: "20px 16px" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{"\u{1F3CB}\u{FE0F}"}</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, background: "linear-gradient(135deg, #3B82F6, #A855F7)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", marginBottom: 6 }}>AI Gym Coach</h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>Let's set up your profile once — you won't need to do this again.</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Your Name" value={form.name} onChange={v => update("name", v)} placeholder="What should I call you?" />
          <Field label="Goals" value={form.goals} onChange={v => update("goals", v)} multiline />
          <Field label="Schedule" value={form.schedule} onChange={v => update("schedule", v)} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Gym" value={form.gym} onChange={v => update("gym", v)} />
            <Field label="Session (min)" value={form.sessionDuration} onChange={v => update("sessionDuration", parseInt(v) || 50)} type="number" />
          </div>

          <div style={{ background: "rgba(234,179,8,0.08)", border: "1px solid rgba(234,179,8,0.2)", borderRadius: 12, padding: 16 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
              <input type="checkbox" checked={form.kneeProtocol} onChange={() => update("kneeProtocol", !form.kneeProtocol)} style={{ width: 20, height: 20, accentColor: "#EAB308" }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{"\u26A0\u{FE0F}"} Knee Protection Protocol</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 2 }}>Avoid deep squats, lunges, leg extensions, running, jumping</div>
              </div>
            </label>
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 16, border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.4)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Your Weekly Split</div>
            {["monday", "tuesday", "thursday"].map(dk => {
              const cfg = getDayConfig(dk);
              return (
                <div key={dk} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ fontSize: 20 }}>{cfg.icon}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
                </div>
              );
            })}
          </div>

          <button onClick={() => dispatch({ type: "COMPLETE_SETUP", payload: form })} style={{
            marginTop: 8, padding: "16px 0",
            background: "linear-gradient(135deg, #3B82F6, #2563EB)", color: "#fff",
            border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700,
            cursor: "pointer", letterSpacing: 0.5,
          }}>
            Let's Go {"\u{1F4AA}"}
          </button>
        </div>
      </div>
    </div>
  );
}
