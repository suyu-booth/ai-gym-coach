import { getWeightTrend } from "../lib/progressive.js";
import SetRow from "./SetRow.jsx";

export default function ExerciseCard({ exercise, index, expanded, dayKey, history, dayColor, dispatch, onLog, onQuickLog }) {
  const trend = getWeightTrend(exercise, history, dayKey);
  const allComplete = exercise.sets.every(s => s.completed);
  const someComplete = exercise.sets.some(s => s.completed);

  return (
    <div style={{
      background: allComplete ? "rgba(34,197,94,0.04)" : "rgba(255,255,255,0.03)",
      borderRadius: 12,
      border: `1px solid ${allComplete ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.06)"}`,
      marginBottom: 8, overflow: "hidden",
    }}>
      <div onClick={() => dispatch({ type: "EXPAND_EXERCISE", payload: index })} style={{
        padding: "14px 16px", cursor: "pointer",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7,
          background: allComplete ? "#22C55E" : someComplete ? dayColor + "33" : "rgba(255,255,255,0.06)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 13, fontWeight: 700,
          color: allComplete ? "#fff" : dayColor, flexShrink: 0,
        }}>
          {allComplete ? "\u2713" : index + 1}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: allComplete ? "rgba(255,255,255,0.5)" : "#fff" }}>{exercise.name}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>
            {exercise.isBodyweight
              ? `${exercise.sets.length} \u00D7 ${exercise.reps}`
              : `${exercise.targetWeight} ${exercise.unit} \u00B7 ${exercise.sets.length} \u00D7 ${exercise.reps}`}
          </div>
        </div>
        <div style={{ display: "flex", gap: 3 }}>
          {exercise.sets.map((s, si) => (
            <div key={si} style={{ width: 8, height: 8, borderRadius: 2, background: s.completed ? "#22C55E" : "rgba(255,255,255,0.1)" }} />
          ))}
        </div>
        <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>{"\u25BC"}</span>
      </div>

      {expanded && (
        <div style={{ padding: "0 16px 16px", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          {trend.length > 0 && !exercise.isBodyweight && (
            <div style={{ padding: "10px 0 8px", display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Recent:</span>
              {trend.map((t, i) => (
                <span key={i} style={{ fontSize: 12, fontWeight: 600, padding: "2px 6px", borderRadius: 4, background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)" }}>{t.avgWeight}</span>
              ))}
              <span style={{ fontSize: 11, color: dayColor, fontWeight: 600 }}>{"\u2192"} {exercise.targetWeight}</span>
            </div>
          )}
          {exercise.notes && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", fontStyle: "italic", marginBottom: 8 }}>{"\u{1F4A1}"} {exercise.notes}</div>}

          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 4 }}>
            {exercise.sets.map((set, si) => (
              <SetRow key={si} set={set} setIdx={si} exerciseIdx={index} exercise={exercise}
                onLog={onLog} onQuickLog={onQuickLog} dayColor={dayColor} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
