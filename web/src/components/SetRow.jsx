import { useState, useEffect } from "react";

export default function SetRow({ set, setIdx, exerciseIdx, exercise, onLog, onQuickLog, dayColor }) {
  const [editing, setEditing] = useState(false);
  const [w, setW] = useState(set.weight ?? exercise.targetWeight ?? "");
  const [r, setR] = useState(set.reps ?? parseInt(exercise.reps) ?? "");

  useEffect(() => {
    if (set.weight !== null) setW(set.weight);
    if (set.reps !== null) setR(set.reps);
  }, [set.weight, set.reps]);

  const saveSet = () => {
    const weight = exercise.isBodyweight ? 0 : (parseFloat(w) || 0);
    const reps = parseInt(r) || 0;
    if (!exercise.isBodyweight && weight === 0 && reps === 0) return;
    onLog(exerciseIdx, setIdx, weight, reps);
    setEditing(false);
  };

  if (set.completed && !editing) {
    return (
      <div onClick={() => setEditing(true)} style={{
        display: "flex", alignItems: "center", gap: 10, padding: "8px 12px",
        background: "rgba(34,197,94,0.06)", borderRadius: 8, cursor: "pointer",
        border: "1px solid rgba(34,197,94,0.1)",
      }}>
        <div style={{
          width: 22, height: 22, borderRadius: 5, background: "#22C55E",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, color: "#fff", fontWeight: 700, flexShrink: 0,
        }}>{"\u2713"}</div>
        <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>Set {setIdx + 1}</span>
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginLeft: "auto" }}>
          {exercise.isBodyweight ? `${set.reps} reps` : `${set.weight} ${exercise.unit} \u00D7 ${set.reps}`}
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
      <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.3)", width: 40, flexShrink: 0 }}>Set {setIdx + 1}</span>
      {!exercise.isBodyweight && (
        <input type="number" value={w} onChange={e => setW(e.target.value)}
          onKeyDown={e => e.key === "Enter" && saveSet()} placeholder="lbs"
          style={{
            width: 64, padding: "8px 8px", background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "#fff",
            fontSize: 16, textAlign: "center", outline: "none",
          }} />
      )}
      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>{"\u00D7"}</span>
      <input type="number" value={r} onChange={e => setR(e.target.value)}
        onKeyDown={e => e.key === "Enter" && saveSet()} placeholder="reps"
        style={{
          width: 56, padding: "8px 8px", background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "#fff",
          fontSize: 16, textAlign: "center", outline: "none",
        }} />
      <button onClick={saveSet} style={{
        padding: "8px 12px", background: dayColor, color: "#fff", border: "none",
        borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0,
      }}>{"\u2713"}</button>
      {!exercise.isBodyweight && !set.completed && (
        <button onClick={() => onQuickLog(exerciseIdx, setIdx)} title="Quick log at target" style={{
          padding: "8px", background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6,
          fontSize: 11, cursor: "pointer", color: "rgba(255,255,255,0.4)", flexShrink: 0,
        }}>{"\u26A1"}</button>
      )}
    </div>
  );
}
