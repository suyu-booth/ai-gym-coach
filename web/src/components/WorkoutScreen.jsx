import { useState, useEffect } from "react";
import { EXERCISES } from "../lib/constants.js";
import { getDayConfig } from "../lib/utils.js";
import { palette, type, dayway, skyGradient } from "../lib/theme.js";
import ExerciseCard from "./ExerciseCard.jsx";
import RestTimerOverlay from "./RestTimerOverlay.jsx";
import Glyph from "./Glyph.jsx";
import Horizon from "./Horizon.jsx";

export default function WorkoutScreen({ state, dispatch, logSet, quickLogSet }) {
  const { activeWorkout, expandedExercise, workoutHistory, restTimer, restTimeLeft } = state;
  if (!activeWorkout) return null;

  const cfg = getDayConfig(activeWorkout.dayKey);
  const way = dayway(activeWorkout.dayKey);
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

  // The marquee move: page background gradient driven by progress.
  const bg = skyGradient(progressPct, way.dominant);

  // Sun walks across the horizon as sets complete.
  const sunColor =
    progressPct < 0.33 ? palette.coral :
    progressPct < 0.66 ? palette.horizon :
    palette.sand;

  return (
    <div style={{
      minHeight: "100vh",
      background: bg,
      transition: "background 1.6s cubic-bezier(0.4, 0, 0.2, 1)",
      color: palette.cream,
      paddingBottom: restTimer ? 110 : 80,
    }}>
      {/* Discard confirmation */}
      {confirmDiscard && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 960, background: "rgba(26,42,51,0.85)",
          backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
        }} onClick={() => setConfirmDiscard(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: palette.ink2, padding: "32px 28px", maxWidth: 360, width: "100%",
            borderTop: `2px solid ${palette.horizon}`, animation: "ghFadeIn 0.25s ease both",
          }}>
            <div style={{ ...type.caps, color: palette.horizon }}>Discard?</div>
            <div style={{ ...type.title, color: palette.cream, marginTop: 8 }}>Walk away from this morning?</div>
            <div style={{ ...type.small, color: palette.creamMute, marginTop: 10, marginBottom: 24 }}>
              All progress from this session will be lost. This can't be undone.
            </div>
            <div style={{ display: "flex", gap: 18, alignItems: "center", justifyContent: "flex-end" }}>
              <button onClick={() => setConfirmDiscard(false)} className="gh-link" style={{ fontSize: 14, color: palette.creamMute }}>
                Stay
              </button>
              <button onClick={() => dispatch({ type: "DISCARD_WORKOUT" })} className="gh-stamp">
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ padding: "20px 22px 16px" }}>
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <button onClick={() => dispatch({ type: "SET_SCREEN", payload: "dashboard" })}
              style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 0", color: palette.creamMute }}>
              <Glyph name="arrow-left" size={14} color={palette.creamMute} />
              <span style={{ ...type.caps, fontSize: 10 }}>Back</span>
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span style={{ ...type.caps, color: palette.creamMute }}>
                <span style={{ fontFamily: '"Fraunces", serif', fontSize: 13, marginRight: 4, fontVariationSettings: '"opsz" 48', letterSpacing: 0 }}>
                  {elapsed}
                </span>
                MIN
              </span>
              <button onClick={() => setConfirmDiscard(true)}
                style={{ background: "none", border: "none", cursor: "pointer", ...type.caps, fontSize: 10, color: palette.coral, padding: 0 }}>
                Discard
              </button>
            </div>
          </div>

          <div style={{ ...type.caps, color: palette.creamMute }}>{cfg.short}</div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 4 }}>
            <h1 style={{ ...type.display, color: palette.cream }}>
              {way.name}<span style={{ color: way.dominant }}>.</span>
            </h1>
            <div style={{ ...type.numeral, color: palette.cream, fontVariantNumeric: "lining-nums tabular-nums" }}>
              <span style={{ color: way.dominant }}>{completedSets}</span>
              <span style={{ color: palette.creamFaint }}>/{totalSets}</span>
            </div>
          </div>

          <div style={{ marginTop: 18 }}>
            <Horizon
              height={32}
              suns={[{
                x: Math.max(0.04, Math.min(0.96, progressPct)),
                y: -0.15 - 0.55 * progressPct,
                color: sunColor,
                size: 1.05,
                intensity: 0.55 + 0.45 * progressPct,
              }]}
              arc
            />
          </div>
        </div>
      </div>

      <div style={{ padding: "12px 22px", maxWidth: 480, margin: "0 auto" }}>
        {/* Warmup */}
        <div onClick={() => dispatch({ type: "TOGGLE_WARMUP" })} style={{
          padding: "16px 0",
          display: "flex", alignItems: "flex-start", gap: 14,
          cursor: "pointer",
          borderTop: `1px solid ${palette.creamFaint}`,
          borderBottom: `1px solid ${palette.creamFaint}`,
        }}>
          <div style={{
            width: 18, height: 18, borderRadius: 0, marginTop: 3,
            border: `1.5px solid ${activeWorkout.warmupDone ? palette.sand : palette.creamFaint}`,
            background: activeWorkout.warmupDone ? palette.sand : "transparent",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            {activeWorkout.warmupDone && <Glyph name="check" size={11} color={palette.ink} strokeWidth={2.4} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ ...type.caps, color: activeWorkout.warmupDone ? palette.sand : palette.creamMute }}>Warm-up · 5 min</div>
            <div style={{ ...type.body, color: palette.creamMute, marginTop: 4, fontStyle: "italic" }}>
              {template.warmup.join(" · ")}
            </div>
          </div>
        </div>

        {/* Exercises */}
        <div style={{ marginTop: 4 }}>
          {activeWorkout.exercises.map((ex, ei) => (
            <ExerciseCard key={ex.id} exercise={ex} index={ei}
              expanded={expandedExercise === ei}
              dayKey={activeWorkout.dayKey} history={workoutHistory}
              dayColor={cfg.color} dispatch={dispatch}
              onLog={logSet} onQuickLog={quickLogSet} />
          ))}
        </div>

        {/* Sauna */}
        {template.hasSauna && (
          <div style={{ padding: "14px 0", display: "flex", alignItems: "center", gap: 14, borderTop: `1px solid ${palette.creamFaint}` }}>
            <Glyph name="wave" size={20} color={palette.sand} />
            <div style={{ flex: 1 }}>
              <div style={{ ...type.caps, color: palette.sand }}>Sauna · 10 min</div>
              <div style={{ ...type.small, color: palette.creamMute, marginTop: 2, fontStyle: "italic" }}>
                160–175°F · hydrate before & after
              </div>
            </div>
          </div>
        )}

        {/* Cooldown */}
        {template.cooldown && (
          <div style={{ padding: "14px 0", display: "flex", alignItems: "center", gap: 14, borderTop: `1px solid ${palette.creamFaint}` }}>
            <Glyph name="arc" size={20} color={palette.coral} />
            <div style={{ flex: 1 }}>
              <div style={{ ...type.caps, color: palette.coral }}>Cool-down</div>
              <div style={{ ...type.small, color: palette.creamMute, marginTop: 2, fontStyle: "italic" }}>{template.cooldown}</div>
            </div>
          </div>
        )}

        {/* Complete CTA */}
        <div style={{
          marginTop: 28, paddingTop: 22, borderTop: `1px solid ${palette.creamFaint}`,
          display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap",
        }}>
          <div>
            <div style={{ ...type.caps, color: palette.creamMute }}>{allDone ? "Ready" : "When you're done"}</div>
            <div style={{ ...type.subtitle, color: palette.cream, marginTop: 4 }}>
              {allDone ? "End the morning." : "Finish & log the session."}
            </div>
          </div>
          <button
            className={`gh-stamp ${allDone ? "is-filled" : ""}`}
            onClick={() => dispatch({ type: "SHOW_COMPLETION" })}
            style={{
              borderColor: allDone ? palette.sand : palette.horizon,
              color: allDone ? palette.ink : palette.horizon,
              background: allDone ? palette.sand : "transparent",
              padding: "12px 22px", fontSize: 11,
            }}
          >
            {allDone ? "Log Session" : "Complete"}
          </button>
        </div>
      </div>

      {restTimer && <RestTimerOverlay timeLeft={restTimeLeft} onSkip={() => dispatch({ type: "SKIP_REST" })} accent={way.dominant} />}
    </div>
  );
}
