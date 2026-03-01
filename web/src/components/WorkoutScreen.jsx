import { useState, useEffect } from "react";
import { EXERCISES } from "../lib/constants.js";
import { getDayConfig } from "../lib/utils.js";
import ExerciseCard from "./ExerciseCard.jsx";
import RestTimerOverlay from "./RestTimerOverlay.jsx";

export default function WorkoutScreen({ state, dispatch, logSet, quickLogSet }) {
  const { activeWorkout, expandedExercise, workoutHistory, restTimer, restTimeLeft } = state;
  if (!activeWorkout) return null;

  const cfg = getDayConfig(activeWorkout.dayKey);
  const template = EXERCISES[activeWorkout.dayKey];
  const totalSets = activeWorkout.exercises.reduce((a, e) => a + e.sets.length, 0);
  const completedSets = activeWorkout.exercises.reduce((a, e) => a + e.sets.filter(s => s.completed).length, 0);
  const progressPct = totalSets > 0 ? completedSets / totalSets : 0;
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setElapsed(Math.round((Date.now() - activeWorkout.startTime) / 60000)), 30000);
    setElapsed(Math.round((Date.now() - activeWorkout.startTime) / 60000));
    return () => clearInterval(iv);
  }, [activeWorkout.startTime]);

  const allDone = completedSets === totalSets && totalSets > 0;

  return (
    <div style={{ minHeight: "100vh", background: "#0B1120", color: "#fff", paddingBottom: restTimer ? 100 : 80 }}>
      {/* Discard confirmation */}
      {confirmDiscard && (
        <div style={{ position: "fixed", inset: 0, zIndex: 960, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setConfirmDiscard(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: "#1F2937", borderRadius: 16, padding: 24, maxWidth: 340, width: "100%", textAlign: "center", border: "1px solid rgba(239,68,68,0.2)" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>{"\u{1F5D1}\u{FE0F}"}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 6 }}>Discard Workout?</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 20 }}>This will delete all progress from this session. This can't be undone.</div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setConfirmDiscard(false)} style={{ flex: 1, padding: "12px 0", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel</button>
              <button onClick={() => dispatch({ type: "DISCARD_WORKOUT" })} style={{ flex: 1, padding: "12px 0", background: "#EF4444", border: "none", color: "#fff", borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Discard</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <button onClick={() => dispatch({ type: "SET_SCREEN", payload: "dashboard" })} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 14, cursor: "pointer", padding: "4px 0" }}>{"\u2190"} Back</button>
            <div style={{ display: "flex", gap: 8 }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", padding: "4px 10px", background: "rgba(255,255,255,0.05)", borderRadius: 6 }}>{"\u23F1"} {elapsed}m</span>
              <button onClick={() => setConfirmDiscard(true)} style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#EF4444", padding: "4px 10px", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>Discard</button>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>{cfg.icon}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{cfg.label.split(" - ")[1]}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{completedSets}/{totalSets} sets \u00B7 {activeWorkout.exercises.length} exercises</div>
            </div>
          </div>
          <div style={{ marginTop: 12, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${progressPct * 100}%`, background: cfg.color, borderRadius: 2, transition: "width 0.3s ease" }} />
          </div>
        </div>
      </div>

      <div style={{ padding: "16px", maxWidth: 480, margin: "0 auto" }}>
        {/* Warmup */}
        <div onClick={() => dispatch({ type: "TOGGLE_WARMUP" })} style={{
          background: activeWorkout.warmupDone ? "rgba(34,197,94,0.08)" : "rgba(255,255,255,0.03)",
          borderRadius: 12, padding: 14,
          border: `1px solid ${activeWorkout.warmupDone ? "rgba(34,197,94,0.2)" : "rgba(255,255,255,0.06)"}`,
          marginBottom: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6,
            background: activeWorkout.warmupDone ? "#22C55E" : "rgba(255,255,255,0.1)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, flexShrink: 0, color: "#fff",
          }}>
            {activeWorkout.warmupDone ? "\u2713" : ""}
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: activeWorkout.warmupDone ? "#22C55E" : "#fff" }}>Warm-up (5 min)</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{template.warmup.join(" \u00B7 ")}</div>
          </div>
        </div>

        {/* Exercises */}
        {activeWorkout.exercises.map((ex, ei) => (
          <ExerciseCard key={ex.id} exercise={ex} index={ei}
            expanded={expandedExercise === ei}
            dayKey={activeWorkout.dayKey} history={workoutHistory}
            dayColor={cfg.color} dispatch={dispatch}
            onLog={logSet} onQuickLog={quickLogSet} />
        ))}

        {/* Sauna */}
        {template.hasSauna && (
          <div style={{ background: "rgba(234,179,8,0.06)", borderRadius: 12, padding: 14, border: "1px solid rgba(234,179,8,0.15)", marginTop: 4, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24 }}>{"\u{1F9D6}"}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Sauna Recovery (10 min)</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>160-175\u00B0F \u00B7 Hydrate before & after</div>
            </div>
          </div>
        )}

        {/* Cooldown */}
        {template.cooldown && (
          <div style={{ background: "rgba(59,130,246,0.06)", borderRadius: 12, padding: 14, border: "1px solid rgba(59,130,246,0.15)", marginTop: 8, display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 24 }}>{"\u{1F9D8}"}</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Cool-down</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{template.cooldown}</div>
            </div>
          </div>
        )}

        {/* Complete Button */}
        <button onClick={() => dispatch({ type: "SHOW_COMPLETION" })} style={{
          marginTop: 20, width: "100%", padding: "16px 0",
          background: allDone ? "linear-gradient(135deg, #22C55E, #16A34A)" : "linear-gradient(135deg, #3B82F6, #2563EB)",
          color: "#fff", border: "none", borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: "pointer",
        }}>
          {allDone ? "Complete Workout \u{1F389}" : "Finish & Log Workout"}
        </button>
      </div>

      {restTimer && <RestTimerOverlay timeLeft={restTimeLeft} onSkip={() => dispatch({ type: "SKIP_REST" })} />}
    </div>
  );
}
