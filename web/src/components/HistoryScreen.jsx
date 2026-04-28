import { getDayConfig } from "../lib/utils.js";
import { palette, type, dawnGradient } from "../lib/theme.js";
import Glyph from "./Glyph.jsx";

const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

function monthKey(dateStr) {
  const d = new Date(dateStr);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export default function HistoryScreen({ history, dispatch }) {
  // Group by month deck-head, preserving order.
  const groups = [];
  let last = null;
  history.forEach(w => {
    const key = monthKey(w.date);
    if (key !== last) {
      groups.push({ key, items: [] });
      last = key;
    }
    groups[groups.length - 1].items.push(w);
  });

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

        <div style={{ ...type.caps, color: palette.creamMute }}>Archive</div>
        <h1 style={{ ...type.display, color: palette.cream, marginTop: 6, marginBottom: 36 }}>
          Every morning you've shown up.
        </h1>

        {history.length === 0 ? (
          <div style={{ padding: "64px 0", textAlign: "center" }}>
            <Glyph name="sun-rising" size={36} color={palette.creamMute} style={{ margin: "0 auto 16px" }} />
            <div style={{ ...type.caps, color: palette.creamMute }}>No entries yet</div>
            <div style={{ ...type.body, color: palette.creamMute, marginTop: 6, fontStyle: "italic" }}>
              The first morning is always tomorrow.
            </div>
          </div>
        ) : groups.map(group => (
          <section key={group.key} style={{ marginBottom: 32 }}>
            <div style={{ ...type.caps, color: palette.creamMute, marginBottom: 12 }}>{group.key.toUpperCase()}</div>
            <div style={{ borderTop: `1px solid ${palette.creamFaint}` }}>
              {group.items.map(w => {
                const cfg = getDayConfig(w.dayKey);
                const setsCompleted = w.exercises.reduce((a, e) => a + e.sets.filter(s => s.completed).length, 0);
                const totalSets = w.exercises.reduce((a, e) => a + e.sets.length, 0);
                const seq = history.findIndex(x => x.id === w.id);
                const sessionNum = history.length - seq;
                return (
                  <div key={w.id} style={{
                    padding: "18px 0", borderBottom: `1px solid ${palette.creamFaint}`,
                    display: "flex", flexDirection: "column", gap: 10,
                  }}>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
                      <div style={{
                        fontFamily: '"Fraunces", serif', fontSize: 22, fontWeight: 600,
                        color: cfg.color, fontVariationSettings: '"opsz" 96',
                        minWidth: 42, fontVariantNumeric: "lining-nums tabular-nums",
                      }}>
                        #{String(sessionNum).padStart(2, "0")}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ ...type.caps, color: palette.creamMute, fontSize: 10 }}>{cfg.short}</div>
                        <div style={{ ...type.bodyStrong, color: palette.cream, marginTop: 2 }}>
                          {w.date} · {setsCompleted}/{totalSets} sets{w.duration ? ` · ${w.duration}m` : ""}
                        </div>
                      </div>
                      {w.difficulty && (
                        <div style={{ display: "flex", gap: 2 }}>
                          {[1, 2, 3, 4, 5].map(d => (
                            <Glyph key={d} name="flame" size={11}
                              color={d <= w.difficulty ? palette.coral : palette.creamFaint} />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Exercises micro-list */}
                    <div style={{ paddingLeft: 56, display: "flex", flexDirection: "column", gap: 4 }}>
                      {w.exercises.filter(e => e.sets.some(s => s.completed)).map(e => (
                        <div key={e.id} style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
                          <span style={{ ...type.small, color: palette.creamMute }}>{e.name}</span>
                          <span style={{
                            ...type.small, color: palette.cream,
                            fontFamily: '"Fraunces", serif', fontVariantNumeric: "lining-nums tabular-nums",
                          }}>
                            {e.sets.filter(s => s.completed).map(s => e.isBodyweight ? s.reps : s.weight).join(" · ")}
                            <span style={{ color: palette.creamFaint, marginLeft: 4 }}>
                              {e.isBodyweight ? "reps" : e.unit}
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>

                    {w.notes && (
                      <div style={{
                        ...type.small, color: palette.creamMute, fontStyle: "italic",
                        paddingLeft: 56, paddingTop: 4,
                        borderLeft: `1px solid transparent`,
                      }}>
                        “{w.notes}”
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
