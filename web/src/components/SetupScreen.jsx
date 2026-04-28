import { useState } from "react";
import { getDayConfig } from "../lib/utils.js";
import { palette, type, dawnGradient, dayway } from "../lib/theme.js";
import Field from "./Field.jsx";
import Glyph from "./Glyph.jsx";
import Horizon from "./Horizon.jsx";

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
    <div style={{ minHeight: "100vh", background: dawnGradient, color: palette.cream, padding: "32px 22px 60px" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 28 }}>
            <div style={{ width: 280 }}>
              <Horizon
                height={56}
                suns={[{ x: 0.5, y: -0.35, color: palette.horizon, size: 1.4 }]}
                arc
              />
            </div>
          </div>
          <div style={{ ...type.caps, color: palette.creamMute, textAlign: "center" }}>Golden Hour</div>
          <h1 style={{ ...type.display, color: palette.cream, marginTop: 8, textAlign: "center" }}>
            A morning practice.
          </h1>
          <p style={{ ...type.body, color: palette.creamMute, marginTop: 12, textAlign: "center", maxWidth: 360, marginInline: "auto" }}>
            Set the basics once. The app remembers everything else — your weights, your routine, your sunrise.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <Field label="Your Name" value={form.name} onChange={v => update("name", v)} placeholder="What should I call you?" />
          <Field label="Goals" value={form.goals} onChange={v => update("goals", v)} multiline />
          <Field label="Schedule" value={form.schedule} onChange={v => update("schedule", v)} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 18 }}>
            <Field label="Gym" value={form.gym} onChange={v => update("gym", v)} />
            <Field label="Session (min)" value={form.sessionDuration} onChange={v => update("sessionDuration", parseInt(v) || 50)} type="number" />
          </div>

          <label style={{
            display: "flex", alignItems: "flex-start", gap: 14, cursor: "pointer",
            padding: "16px 0", borderTop: `1px solid ${palette.creamFaint}`, borderBottom: `1px solid ${palette.creamFaint}`,
          }}>
            <div
              onClick={e => { e.preventDefault(); update("kneeProtocol", !form.kneeProtocol); }}
              style={{
                width: 18, height: 18, marginTop: 2, flexShrink: 0,
                border: `1.5px solid ${form.kneeProtocol ? palette.sand : palette.creamFaint}`,
                background: form.kneeProtocol ? palette.sand : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
              {form.kneeProtocol && <Glyph name="check" size={11} color={palette.ink} strokeWidth={2.4} />}
            </div>
            <input type="checkbox" checked={form.kneeProtocol} onChange={() => update("kneeProtocol", !form.kneeProtocol)} style={{ display: "none" }} />
            <div>
              <div style={{ ...type.caps, color: form.kneeProtocol ? palette.sand : palette.creamMute }}>
                Knee Protection
              </div>
              <div style={{ ...type.small, color: palette.creamMute, marginTop: 4, fontStyle: "italic" }}>
                Avoid deep squats, lunges, leg extensions, running, jumping.
              </div>
            </div>
          </label>

          <div>
            <div style={{ ...type.caps, color: palette.creamMute, marginBottom: 16 }}>Your Weekly Split</div>
            <div style={{ borderTop: `1px solid ${palette.creamFaint}` }}>
              {["tuesday", "wednesday", "friday"].map(dk => {
                const cfg = getDayConfig(dk);
                const way = dayway(dk);
                return (
                  <div key={dk} style={{
                    display: "flex", alignItems: "center", gap: 14,
                    padding: "14px 0", borderBottom: `1px solid ${palette.creamFaint}`,
                  }}>
                    <Glyph name={cfg.glyph} size={20} color={way.dominant} />
                    <div style={{ flex: 1 }}>
                      <div style={{ ...type.caps, color: palette.creamMute, fontSize: 9 }}>
                        {dk === "tuesday" ? "Tue" : dk === "wednesday" ? "Wed" : "Fri"}
                      </div>
                      <div style={{
                        fontFamily: '"Fraunces", serif', fontSize: 16, fontWeight: 600,
                        color: palette.cream, marginTop: 2, fontVariationSettings: '"opsz" 64',
                      }}>
                        {way.name}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
            <button
              onClick={() => dispatch({ type: "COMPLETE_SETUP", payload: form })}
              className="gh-stamp is-filled"
              style={{ padding: "14px 28px" }}
            >
              Begin
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
