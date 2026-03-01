import { EXERCISES } from "../lib/constants.js";
import { getTodayDayKey, getDayConfig, getWeekWorkouts } from "../lib/utils.js";

export default function Dashboard({ state, dispatch, startWorkout }) {
  const { profile, workoutHistory, activeWorkout, syncing } = state;
  const todayKey = getTodayDayKey();
  const weekWorkouts = getWeekWorkouts(workoutHistory);
  const totalPlanned = 3;
  const completedThisWeek = weekWorkouts.length;
  const pct = Math.min(completedThisWeek / totalPlanned, 1);
  const allDays = ["monday", "tuesday", "thursday"];

  const todayAlreadyDone = todayKey && workoutHistory.some(
    w => w.date === new Date().toISOString().split("T")[0] && w.dayKey === todayKey && w.completed
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0B1120", color: "#fff", paddingBottom: 100 }}>
      <div style={{ padding: "20px 16px 0" }}>
        <div style={{ maxWidth: 480, margin: "0 auto" }}>
          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })}
              </div>
              <h1 style={{ fontSize: 22, fontWeight: 800, marginTop: 2 }}>
                {profile.name ? `Hey, ${profile.name}` : "Dashboard"} {"\u{1F44B}"}
              </h1>
            </div>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {syncing && <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>{"\u{1F504}"}</span>}
              <button onClick={() => dispatch({ type: "SET_SCREEN", payload: "settings" })} style={{
                background: "rgba(255,255,255,0.06)", border: "none", borderRadius: 10,
                padding: "10px 12px", cursor: "pointer", fontSize: 18,
              }}>{"\u2699\u{FE0F}"}</button>
            </div>
          </div>

          {/* Active Workout Banner */}
          {activeWorkout && (
            <div onClick={() => dispatch({ type: "RESUME_WORKOUT" })} style={{
              background: "linear-gradient(135deg, rgba(234,179,8,0.15), rgba(234,179,8,0.05))",
              border: "1px solid rgba(234,179,8,0.3)", borderRadius: 14, padding: 16,
              marginBottom: 16, cursor: "pointer", display: "flex", alignItems: "center", gap: 12,
            }}>
              <div style={{ fontSize: 28 }}>{"\u23F8\u{FE0F}"}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#EAB308" }}>Workout In Progress</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{getDayConfig(activeWorkout.dayKey).label} — tap to resume</div>
              </div>
              <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 20 }}>{"\u2192"}</div>
            </div>
          )}

          {/* Weekly Progress */}
          <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 16, padding: 20, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <div style={{ position: "relative", width: 72, height: 72, flexShrink: 0 }}>
                <svg width="72" height="72" style={{ transform: "rotate(-90deg)" }}>
                  <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                  <circle cx="36" cy="36" r="30" fill="none" stroke={pct >= 1 ? "#22C55E" : "#3B82F6"} strokeWidth="6" strokeDasharray={`${pct * 188.5} 188.5`} strokeLinecap="round" />
                </svg>
                <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, fontWeight: 800 }}>{completedThisWeek}/{totalPlanned}</span>
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>This Week</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                  {completedThisWeek === 0 ? "Let's get started!" : completedThisWeek >= totalPlanned ? "All workouts done! \u{1F389}" : `${totalPlanned - completedThisWeek} workout${totalPlanned - completedThisWeek > 1 ? "s" : ""} remaining`}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              {allDays.map(dk => {
                const cfg = getDayConfig(dk);
                const done = weekWorkouts.some(w => w.dayKey === dk);
                return (
                  <div key={dk} style={{
                    flex: 1, textAlign: "center", padding: "8px 0", borderRadius: 8,
                    background: done ? `${cfg.color}22` : "rgba(255,255,255,0.03)",
                    border: `1px solid ${done ? cfg.color + "44" : "rgba(255,255,255,0.06)"}`,
                  }}>
                    <div style={{ fontSize: 16 }}>{done ? "\u2705" : cfg.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: done ? cfg.color : "rgba(255,255,255,0.3)", marginTop: 2 }}>{dk.slice(0, 3).toUpperCase()}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Today's Workout Card */}
          {todayKey && EXERCISES[todayKey] && !todayAlreadyDone && !activeWorkout && (
            <div style={{
              background: `linear-gradient(135deg, ${getDayConfig(todayKey).colorLight}, rgba(15,23,42,0.95))`,
              borderRadius: 16, padding: 20, border: `1px solid ${getDayConfig(todayKey).color}33`, marginBottom: 16,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <span style={{ fontSize: 24 }}>{getDayConfig(todayKey).icon}</span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700 }}>Today's Workout</div>
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>{getDayConfig(todayKey).label}</div>
                </div>
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 14 }}>
                {EXERCISES[todayKey].exercises.length} exercises · ~{profile.sessionDuration} min{EXERCISES[todayKey].hasSauna ? " + sauna" : ""}
              </div>
              <button onClick={() => startWorkout(todayKey)} style={{
                width: "100%", padding: "14px 0", background: getDayConfig(todayKey).color,
                color: "#fff", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 700,
                cursor: "pointer", letterSpacing: 0.5,
              }}>
                Start Workout {"\u2192"}
              </button>
            </div>
          )}

          {todayAlreadyDone && (
            <div style={{ background: "rgba(34,197,94,0.08)", borderRadius: 14, padding: 16, border: "1px solid rgba(34,197,94,0.2)", marginBottom: 16, textAlign: "center" }}>
              <div style={{ fontSize: 28 }}>{"\u{1F389}"}</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#22C55E", marginTop: 4 }}>Today's workout complete!</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Rest up and recover.</div>
            </div>
          )}

          {/* Quick Start */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.3)", marginBottom: 10, textTransform: "uppercase", letterSpacing: 1 }}>Quick Start</div>
            <div style={{ display: "flex", gap: 8 }}>
              {allDays.map(dk => {
                const cfg = getDayConfig(dk);
                const isToday = dk === todayKey;
                return (
                  <button key={dk} onClick={() => startWorkout(dk)} disabled={!!activeWorkout} style={{
                    flex: 1, padding: "12px 8px",
                    background: isToday ? `${cfg.color}15` : "rgba(255,255,255,0.03)",
                    border: `1px solid ${isToday ? cfg.color + "33" : "rgba(255,255,255,0.06)"}`,
                    borderRadius: 10, cursor: activeWorkout ? "not-allowed" : "pointer",
                    opacity: activeWorkout ? 0.5 : 1, textAlign: "center",
                  }}>
                    <div style={{ fontSize: 20 }}>{cfg.icon}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: cfg.color, marginTop: 4 }}>{cfg.label.split(" - ")[1] || dk}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Recent History */}
          {workoutHistory.length > 0 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1 }}>Recent Workouts</div>
                {workoutHistory.length > 3 && (
                  <button onClick={() => dispatch({ type: "SET_SCREEN", payload: "history" })} style={{ background: "none", border: "none", color: "#3B82F6", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>View All</button>
                )}
              </div>
              {workoutHistory.slice(0, 3).map(w => {
                const cfg = getDayConfig(w.dayKey);
                const setsCompleted = w.exercises.reduce((a, e) => a + e.sets.filter(s => s.completed).length, 0);
                const totalSets = w.exercises.reduce((a, e) => a + e.sets.length, 0);
                return (
                  <div key={w.id} style={{
                    background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: "14px 16px",
                    border: "1px solid rgba(255,255,255,0.06)", marginBottom: 8,
                    display: "flex", alignItems: "center", gap: 12,
                  }}>
                    <span style={{ fontSize: 22 }}>{cfg.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{cfg.label.split(" - ")[1]}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{w.date} · {setsCompleted}/{totalSets} sets</div>
                    </div>
                    {w.difficulty && (
                      <span style={{
                        fontSize: 12, padding: "3px 8px", borderRadius: 6, fontWeight: 600,
                        background: w.difficulty <= 2 ? "rgba(34,197,94,0.15)" : w.difficulty <= 3 ? "rgba(234,179,8,0.15)" : "rgba(239,68,68,0.15)",
                        color: w.difficulty <= 2 ? "#22C55E" : w.difficulty <= 3 ? "#EAB308" : "#EF4444",
                      }}>{["", "Easy", "Moderate", "Good", "Hard", "Max"][w.difficulty]}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
