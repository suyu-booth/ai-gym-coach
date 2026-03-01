import { getDayConfig } from "../lib/utils.js";

export default function HistoryScreen({ history, dispatch }) {
  return (
    <div style={{ minHeight: "100vh", background: "#0B1120", color: "#fff", padding: "16px" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <button onClick={() => dispatch({ type: "SET_SCREEN", payload: "dashboard" })} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", fontSize: 14, cursor: "pointer" }}>{"\u2190"} Back</button>
          <h1 style={{ fontSize: 20, fontWeight: 800 }}>Workout History</h1>
        </div>
        {history.length === 0 ? (
          <div style={{ textAlign: "center", padding: 40, color: "rgba(255,255,255,0.3)" }}>No workouts logged yet. Let's change that! {"\u{1F4AA}"}</div>
        ) : history.map(w => {
          const cfg = getDayConfig(w.dayKey);
          const setsCompleted = w.exercises.reduce((a, e) => a + e.sets.filter(s => s.completed).length, 0);
          const totalSets = w.exercises.reduce((a, e) => a + e.sets.length, 0);
          return (
            <div key={w.id} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 16, border: "1px solid rgba(255,255,255,0.06)", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                <span style={{ fontSize: 22 }}>{cfg.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{cfg.label}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{w.date} \u00B7 {w.duration || "\u2014"}m \u00B7 {setsCompleted}/{totalSets} sets</div>
                </div>
              </div>
              {w.exercises.filter(e => e.sets.some(s => s.completed)).map(e => (
                <div key={e.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                  <span>{e.name}</span>
                  <span>{e.sets.filter(s => s.completed).map(s => e.isBodyweight ? s.reps : s.weight).join(" / ")} {e.isBodyweight ? "reps" : e.unit}</span>
                </div>
              ))}
              {w.notes && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", fontStyle: "italic", marginTop: 6 }}>{"\u{1F4DD}"} {w.notes}</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
