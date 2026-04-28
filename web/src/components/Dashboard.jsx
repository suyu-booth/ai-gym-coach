import { EXERCISES } from "../lib/constants.js";
import { getTodayDayKey, getDayConfig, getWeekWorkouts } from "../lib/utils.js";
import { palette, dawnGradient, type, dayway } from "../lib/theme.js";
import Glyph from "./Glyph.jsx";
import Horizon from "./Horizon.jsx";

const allDays = ["tuesday", "wednesday", "friday"];

function fmtDateLine(d) {
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }).toUpperCase();
}

function dayNumeral(dayKey) {
  // Sequence position in the user's week. Used as the editorial hero numeral.
  return { tuesday: "01", wednesday: "02", friday: "03", sunday: "04" }[dayKey] || "01";
}

export default function Dashboard({ state, dispatch, startWorkout }) {
  const { profile, workoutHistory, activeWorkout, syncing } = state;
  const todayKey = getTodayDayKey();
  const weekWorkouts = getWeekWorkouts(workoutHistory);
  const totalPlanned = 3;
  const completedThisWeek = weekWorkouts.length;

  const todayAlreadyDone = todayKey && workoutHistory.some(
    w => w.date === new Date().toISOString().split("T")[0] && w.dayKey === todayKey && w.completed
  );

  const showHero = todayKey && EXERCISES[todayKey] && !todayAlreadyDone && !activeWorkout;
  const todayCfg = todayKey ? getDayConfig(todayKey) : null;
  const todayWay = todayKey ? dayway(todayKey) : null;

  // Weekly horizon — three suns positioned along a horizon line.
  const weekSuns = allDays.map((dk, i) => {
    const cfg = getDayConfig(dk);
    const way = dayway(dk);
    const done = weekWorkouts.some(w => w.dayKey === dk);
    const isToday = dk === todayKey;
    const dateForDay = (() => {
      const dt = new Date();
      const target = { tuesday: 2, wednesday: 3, friday: 5 }[dk];
      const offset = (target - dt.getDay() + 7) % 7;
      const cand = new Date(dt); cand.setDate(dt.getDate() + offset - (offset > 3 && dt.getDay() > target ? 7 : 0));
      // Simpler: just show the date for that day this week.
      const monday = new Date(dt); monday.setDate(dt.getDate() - ((dt.getDay() + 6) % 7));
      const out = new Date(monday); out.setDate(monday.getDate() + (target - 1));
      return out.getDate();
    })();
    return {
      x: 0.18 + i * 0.32,
      y: done ? -0.6 : isToday ? -0.05 : 0.5,
      color: done ? way.dominant : isToday ? way.dominant : palette.creamFaint,
      intensity: done ? 1 : isToday ? 0.85 : 0.45,
      size: done ? 1.15 : 1,
      label: (dk === "tuesday" ? "Tue" : dk === "wednesday" ? "Wed" : "Fri") + " " + dateForDay,
    };
  });

  return (
    <div style={{ minHeight: "100vh", background: dawnGradient, color: palette.cream, paddingBottom: 80 }}>
      {/* Active workout banner — magazine subscription strip */}
      {activeWorkout && (
        <div onClick={() => dispatch({ type: "RESUME_WORKOUT" })}
          style={{
            background: palette.horizon, color: palette.cream, cursor: "pointer",
            padding: "10px 18px", display: "flex", alignItems: "center", gap: 10,
          }}>
          <Glyph name="pause" size={14} color={palette.cream} />
          <span style={{ ...type.caps, color: palette.cream, opacity: 0.95 }}>Workout in progress</span>
          <span style={{ ...type.small, color: "rgba(250,243,227,0.75)", marginLeft: "auto" }}>
            {getDayConfig(activeWorkout.dayKey).short} · tap to resume
          </span>
          <Glyph name="arrow-right" size={14} color={palette.cream} />
        </div>
      )}

      <div style={{ padding: "28px 22px 0" }}>
        <div style={{ maxWidth: 480, margin: "0 auto" }}>

          {/* Editorial header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 36 }}>
            <div>
              <div style={{ ...type.caps, color: palette.creamMute }}>{fmtDateLine(new Date())}</div>
              <h1 style={{ ...type.display, color: palette.cream, marginTop: 8 }}>
                {profile.name ? `Good morning, ${profile.name}.` : "Good morning."}
              </h1>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, paddingTop: 4 }}>
              {syncing && <span style={{ ...type.caps, color: palette.creamFaint, fontSize: 9 }}>Sync</span>}
              <button onClick={() => dispatch({ type: "SET_SCREEN", payload: "settings" })} style={{
                background: "transparent", border: "none", padding: 6, cursor: "pointer",
              }} aria-label="Settings">
                <Glyph name="settings" size={18} color={palette.creamMute} />
              </button>
            </div>
          </div>

          {/* Today — editorial spread */}
          {showHero && (
            <section style={{ marginBottom: 40 }}>
              <div style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
                <div style={{ flexShrink: 0 }}>
                  <div style={{ ...type.caps, color: palette.creamMute, marginBottom: 6 }}>Day</div>
                  <div style={{
                    ...type.hero, color: todayCfg.color,
                  }}>{dayNumeral(todayKey)}</div>
                </div>
                <div style={{ flex: 1, paddingTop: 28, minWidth: 0 }}>
                  <div style={{ ...type.caps, color: palette.creamMute }}>{todayCfg.short}</div>
                  <div style={{ ...type.title, color: palette.cream, marginTop: 4 }}>{todayWay.name}</div>
                  <div style={{ ...type.small, color: palette.creamMute, marginTop: 8 }}>
                    {EXERCISES[todayKey].exercises.length} lifts · ~{profile.sessionDuration} min
                    {EXERCISES[todayKey].hasSauna ? " · sauna recovery" : ""}
                  </div>
                </div>
              </div>
              <div style={{ height: 1, background: palette.creamFaint, margin: "18px 0 14px" }} />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ ...type.caps, color: palette.creamMute }}>Today's session</span>
                <button className="gh-link" onClick={() => startWorkout(todayKey)}>
                  Begin
                  <Glyph name="arrow-right" size={16} color={palette.cream} />
                </button>
              </div>
            </section>
          )}

          {todayAlreadyDone && (
            <section style={{ marginBottom: 40, paddingTop: 6 }}>
              <div style={{ ...type.caps, color: palette.sand }}>Today · Complete</div>
              <div style={{ ...type.title, color: palette.cream, marginTop: 6 }}>The morning's done.</div>
              <div style={{ ...type.small, color: palette.creamMute, marginTop: 8 }}>Rest, hydrate, recover.</div>
              <div style={{ height: 1, background: palette.creamFaint, margin: "18px 0 14px" }} />
              {!state.saunaEndTime && (
                <button
                  onClick={() => dispatch({ type: "START_SAUNA" })}
                  className="gh-link"
                  style={{ fontSize: 13, color: palette.sand }}
                >
                  Start sauna 10:00 →
                </button>
              )}
            </section>
          )}

          {(!todayKey || !EXERCISES[todayKey]) && !activeWorkout && (
            <section style={{ marginBottom: 40 }}>
              <div style={{ ...type.caps, color: palette.creamMute }}>Today · Rest Day</div>
              <div style={{ ...type.title, color: palette.cream, marginTop: 6 }}>Off the clock.</div>
              <div style={{ ...type.small, color: palette.creamMute, marginTop: 8 }}>Next session: Tuesday.</div>
              <div style={{ height: 1, background: palette.creamFaint, margin: "18px 0 0" }} />
            </section>
          )}

          {/* Weekly horizon */}
          <section style={{ marginBottom: 36 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18 }}>
              <span style={{ ...type.caps, color: palette.creamMute }}>This Week</span>
              <span style={{ ...type.subtitle, color: palette.cream }}>
                <span style={{ color: completedThisWeek >= totalPlanned ? palette.sand : palette.cream }}>
                  {completedThisWeek}
                </span>
                <span style={{ color: palette.creamFaint }}> / {totalPlanned}</span>
              </span>
            </div>
            <Horizon height={72} suns={weekSuns} arc />
            {completedThisWeek >= 1 && (
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                <button onClick={() => dispatch({ type: "SET_SCREEN", payload: "weeklySummary" })}
                  className="gh-link" style={{ fontSize: 13, color: palette.coral }}>
                  View summary →
                </button>
              </div>
            )}
          </section>

          {/* Quick start — three sky tiles */}
          <section style={{ marginBottom: 40 }}>
            <div style={{ ...type.caps, color: palette.creamMute, marginBottom: 14 }}>Quick Start</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {allDays.map(dk => {
                const cfg = getDayConfig(dk);
                const way = dayway(dk);
                const isToday = dk === todayKey;
                const done = weekWorkouts.some(w => w.dayKey === dk);
                return (
                  <button key={dk} onClick={() => startWorkout(dk)} disabled={!!activeWorkout}
                    style={{
                      background: `linear-gradient(to top, ${way.faint} 0%, ${palette.ink} 75%)`,
                      border: `1px solid ${isToday ? way.dominant : palette.creamFaint}`,
                      cursor: activeWorkout ? "not-allowed" : "pointer",
                      opacity: activeWorkout ? 0.4 : 1,
                      padding: "14px 10px 12px",
                      textAlign: "left",
                      position: "relative",
                      borderRadius: 0,
                    }}>
                    <div style={{ height: 36, marginBottom: 8, display: "flex", alignItems: "flex-end", justifyContent: "center" }}>
                      <Glyph name={cfg.glyph} size={28} color={done || isToday ? way.dominant : palette.creamMute} />
                    </div>
                    <div style={{ height: 1, background: palette.creamFaint, marginBottom: 8 }} />
                    <div style={{ ...type.caps, color: palette.creamMute, fontSize: 9 }}>
                      {dk === "tuesday" ? "Tue" : dk === "wednesday" ? "Wed" : "Fri"}
                    </div>
                    <div style={{
                      fontFamily: '"Fraunces", serif', fontSize: 15, fontWeight: 600,
                      color: palette.cream, marginTop: 2, fontVariationSettings: '"opsz" 64',
                    }}>{cfg.short}</div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Recent sessions — editorial list */}
          {workoutHistory.length > 0 && (
            <section>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
                <span style={{ ...type.caps, color: palette.creamMute }}>Recent Sessions</span>
                {workoutHistory.length > 3 && (
                  <button onClick={() => dispatch({ type: "SET_SCREEN", payload: "history" })}
                    style={{ background: "none", border: "none", cursor: "pointer", ...type.caps, color: palette.coral, fontSize: 10 }}>
                    View all →
                  </button>
                )}
              </div>
              <div style={{ borderTop: `1px solid ${palette.creamFaint}` }}>
                {workoutHistory.slice(0, 3).map((w) => {
                  const cfg = getDayConfig(w.dayKey);
                  const setsCompleted = w.exercises.reduce((a, e) => a + e.sets.filter(s => s.completed).length, 0);
                  const totalSets = w.exercises.reduce((a, e) => a + e.sets.length, 0);
                  const seq = workoutHistory.findIndex(x => x.id === w.id);
                  const sessionNum = workoutHistory.length - seq;
                  return (
                    <div key={w.id} style={{
                      display: "flex", alignItems: "center", gap: 14,
                      padding: "16px 0", borderBottom: `1px solid ${palette.creamFaint}`,
                    }}>
                      <div style={{
                        fontFamily: '"Fraunces", serif', fontSize: 22, fontWeight: 600,
                        color: cfg.color, fontVariationSettings: '"opsz" 96',
                        minWidth: 38, fontVariantNumeric: "lining-nums tabular-nums",
                      }}>
                        #{String(sessionNum).padStart(2, "0")}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ ...type.caps, color: palette.creamMute, fontSize: 10 }}>{cfg.short}</div>
                        <div style={{ ...type.small, color: palette.cream, marginTop: 2 }}>
                          {w.date} · {setsCompleted}/{totalSets} sets
                          {w.duration ? ` · ${w.duration}m` : ""}
                        </div>
                      </div>
                      {w.difficulty && (
                        <div style={{ display: "flex", gap: 2 }}>
                          {[1, 2, 3, 4, 5].map(d => (
                            <Glyph
                              key={d}
                              name="flame"
                              size={11}
                              color={d <= w.difficulty ? palette.coral : palette.creamFaint}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
