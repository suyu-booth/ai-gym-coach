import { useMemo, useState } from "react";
import { EXERCISES, DIFFICULTY_NAMES } from "../lib/constants.js";
import { getDayConfig, getWeekWorkouts } from "../lib/utils.js";
import { getTargetWeight } from "../lib/progressive.js";
import { palette, dawnGradient, type, dayway } from "../lib/theme.js";
import * as api from "../api.js";
import Glyph from "./Glyph.jsx";
import Horizon from "./Horizon.jsx";

const DAY_KEYS = ["tuesday", "wednesday", "friday"];

function fmtWeight(v) {
  if (v === null || v === undefined) return "—";
  return v === Math.floor(v) ? String(Math.floor(v)) : v.toFixed(1);
}

export default function WeeklySummary({ state, dispatch }) {
  const { workoutHistory } = state;
  const weekWorkouts = getWeekWorkouts(workoutHistory);

  const [planning, setPlanning] = useState(false);
  const [planResult, setPlanResult] = useState(null);
  const [planError, setPlanError] = useState(null);

  // Stats
  const totalSets = weekWorkouts.reduce(
    (a, w) => a + w.exercises.reduce((b, e) => b + e.sets.filter(s => s.completed).length, 0),
    0
  );
  const totalMin = weekWorkouts.reduce((a, w) => a + (w.duration || 0), 0);

  const weekSuns = useMemo(() => DAY_KEYS.map((dk, i) => {
    const way = dayway(dk);
    const done = weekWorkouts.some(w => w.dayKey === dk);
    return {
      x: 0.18 + i * 0.32,
      y: done ? -0.6 : 0.5,
      color: done ? way.dominant : palette.creamFaint,
      intensity: done ? 1 : 0.45,
      size: done ? 1.15 : 1,
      label: { tuesday: "Tue", wednesday: "Wed", friday: "Fri" }[dk],
    };
  }), [weekWorkouts]);

  // Per-exercise progression: for every exercise across Tue/Wed/Fri, compute
  // last completed avg vs the upcoming target.
  const progressions = useMemo(() => {
    const rows = [];
    for (const dk of DAY_KEYS) {
      const tpl = EXERCISES[dk];
      if (!tpl) continue;
      for (const ex of tpl.exercises) {
        if (ex.isBodyweight) continue;
        const last = workoutHistory
          .filter(w => w.dayKey === dk && w.completed)
          .map(w => w.exercises.find(e => e.id === ex.id))
          .filter(Boolean)[0];
        const lastAvg = last
          ? (() => {
              const cs = last.sets.filter(s => s.completed);
              if (cs.length === 0) return null;
              return Math.round(cs.reduce((a, s) => a + (s.weight || 0), 0) / cs.length * 2) / 2;
            })()
          : null;
        const target = getTargetWeight(ex, workoutHistory, dk);
        rows.push({
          dayKey: dk,
          name: ex.name,
          unit: ex.unit,
          lastAvg,
          target,
          delta: lastAvg !== null ? Math.round((target - lastAvg) * 2) / 2 : null,
        });
      }
    }
    return rows;
  }, [workoutHistory]);

  // Mid-workout notes from this week
  const userNotes = useMemo(() => {
    const out = [];
    for (const w of weekWorkouts) {
      for (const ex of w.exercises) {
        if (ex.notes && !ex.notes.match(/^(Shoulder health|Glute strength|Hamstring focus|Reduces knee shear|Hip stability|Knee-friendly core|Core stability|Anti-rotation|Posture balance|Trap development|Squeeze|Full stretch|Light weight|Control descent|Key lift|Hip stability)$/i)) {
          out.push({ date: w.date, dayKey: w.dayKey, exercise: ex.name, text: ex.notes });
        }
      }
    }
    return out;
  }, [weekWorkouts]);

  const planNextWeek = async () => {
    setPlanning(true);
    setPlanError(null);
    try {
      const result = await api.planNextWeek();
      setPlanResult(result);
    } catch (err) {
      setPlanError(err.message || "Failed to plan next week");
    } finally {
      setPlanning(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: dawnGradient, color: palette.cream, paddingBottom: 80 }}>
      <div style={{ padding: "20px 22px 0" }}>
        <div style={{ maxWidth: 480, margin: "0 auto" }}>

          {/* Back */}
          <button onClick={() => dispatch({ type: "SET_SCREEN", payload: "dashboard" })}
            style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 0", color: palette.creamMute, marginBottom: 18 }}>
            <Glyph name="arrow-left" size={14} color={palette.creamMute} />
            <span style={{ ...type.caps, fontSize: 10 }}>Dashboard</span>
          </button>

          {/* Header */}
          <div style={{ marginBottom: 22 }}>
            <div style={{ ...type.caps, color: palette.creamMute }}>Week in Review</div>
            <h1 style={{ ...type.display, color: palette.cream, marginTop: 6 }}>
              {weekWorkouts.length} of 3<span style={{ color: palette.horizon }}>.</span>
            </h1>
            <div style={{ ...type.small, color: palette.creamMute, marginTop: 6 }}>
              {totalSets} sets · {totalMin} min logged
            </div>
          </div>

          <Horizon height={60} suns={weekSuns} arc />

          {/* Per-exercise progression */}
          <section style={{ marginTop: 36 }}>
            <div style={{ ...type.caps, color: palette.creamMute, marginBottom: 14 }}>Next Targets</div>
            <div style={{ borderTop: `1px solid ${palette.creamFaint}` }}>
              {progressions.map((row, i) => {
                const cfg = getDayConfig(row.dayKey);
                return (
                  <div key={i} style={{
                    display: "flex", alignItems: "baseline", gap: 14,
                    padding: "12px 0", borderBottom: `1px solid ${palette.creamFaint}`,
                  }}>
                    <div style={{ ...type.caps, color: cfg.color, fontSize: 9, minWidth: 28 }}>
                      {{ monday: "Mon", tuesday: "Tue", thursday: "Thu" }[row.dayKey]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ ...type.body, color: palette.cream }}>{row.name}</div>
                    </div>
                    <div style={{
                      fontFamily: '"Fraunces", serif', fontSize: 14, color: palette.creamMute,
                      fontVariantNumeric: "lining-nums tabular-nums",
                    }}>
                      {fmtWeight(row.lastAvg)}
                      <span style={{ color: palette.creamFaint, padding: "0 6px" }}>→</span>
                      <span style={{
                        color: row.delta > 0 ? palette.sand : row.delta < 0 ? palette.coral : palette.cream,
                        fontWeight: 600,
                      }}>
                        {fmtWeight(row.target)}
                      </span>
                      <span style={{ ...type.caps, color: palette.creamFaint, fontSize: 9, marginLeft: 6 }}>
                        {row.unit.replace("lb DBs", "lb").replace("lbs/side", "lb/s")}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Mid-workout notes */}
          {userNotes.length > 0 && (
            <section style={{ marginTop: 36 }}>
              <div style={{ ...type.caps, color: palette.creamMute, marginBottom: 14 }}>Notes from this week</div>
              <div>
                {userNotes.map((n, i) => {
                  const cfg = getDayConfig(n.dayKey);
                  return (
                    <div key={i} style={{ padding: "10px 0", borderTop: `1px solid ${palette.creamFaint}` }}>
                      <div style={{ ...type.caps, color: cfg.color, fontSize: 9 }}>
                        {n.date} · {n.exercise}
                      </div>
                      <div style={{ ...type.body, color: palette.cream, marginTop: 4, fontStyle: "italic" }}>
                        {n.text}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Plan next week CTA */}
          <section style={{ marginTop: 40, paddingTop: 22, borderTop: `1px solid ${palette.creamFaint}` }}>
            {!planResult ? (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <div>
                  <div style={{ ...type.caps, color: palette.creamMute }}>Next Week</div>
                  <div style={{ ...type.subtitle, color: palette.cream, marginTop: 4 }}>
                    Plan Mon · Tue · Thu in Notion.
                  </div>
                  {planError && (
                    <div style={{ ...type.small, color: palette.coral, marginTop: 6 }}>{planError}</div>
                  )}
                </div>
                <button
                  onClick={planNextWeek}
                  disabled={planning}
                  className="gh-stamp is-filled"
                  style={{ padding: "12px 22px", fontSize: 11, opacity: planning ? 0.6 : 1 }}
                >
                  {planning ? "Planning…" : "Plan Next Week →"}
                </button>
              </div>
            ) : (
              <div>
                <div style={{ ...type.caps, color: palette.sand }}>Done</div>
                <div style={{ ...type.subtitle, color: palette.cream, marginTop: 4 }}>
                  {planResult.created?.length || 0} workouts written to Notion.
                </div>
                <div style={{ ...type.small, color: palette.creamMute, marginTop: 8 }}>
                  {planResult.created?.map(w => `${w.date}`).join(" · ")}
                </div>
              </div>
            )}
          </section>

        </div>
      </div>
    </div>
  );
}
