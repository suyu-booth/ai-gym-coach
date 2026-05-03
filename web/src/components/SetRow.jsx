import { useState, useEffect } from "react";
import { palette, type } from "../lib/theme.js";
import Glyph from "./Glyph.jsx";

export default function SetRow({ set, setIdx, exerciseIdx, exercise, onLog, dayColor }) {
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

  const setLabel = `Set ${setIdx + 1}`;

  // Logged state — editorial caption row
  if (set.completed && !editing) {
    return (
      <div onClick={() => setEditing(true)} style={{
        display: "flex", alignItems: "baseline", gap: 14,
        padding: "12px 0",
        borderTop: setIdx === 0 ? `1px solid ${palette.creamFaint}` : "none",
        borderBottom: `1px solid ${palette.creamFaint}`,
        cursor: "pointer",
      }}>
        <div style={{ ...type.caps, color: palette.sand, fontSize: 9, minWidth: 38 }}>{setLabel}</div>
        <div style={{ flex: 1, display: "flex", alignItems: "baseline", gap: 6 }}>
          {exercise.isBodyweight ? (
            <>
              <span style={{
                fontFamily: '"Fraunces", serif', fontSize: 26, fontWeight: 600,
                color: palette.cream, lineHeight: 1, fontVariationSettings: '"opsz" 144',
                fontVariantNumeric: "lining-nums tabular-nums",
              }}>{set.reps}</span>
              <span style={{ ...type.caps, color: palette.creamMute, fontSize: 10 }}>reps</span>
            </>
          ) : (
            <>
              <span style={{
                fontFamily: '"Fraunces", serif', fontSize: 26, fontWeight: 600,
                color: palette.cream, lineHeight: 1, fontVariationSettings: '"opsz" 144',
                fontVariantNumeric: "lining-nums tabular-nums",
              }}>{set.weight}</span>
              <span style={{ ...type.caps, color: palette.creamMute, fontSize: 9 }}>lb</span>
              <span style={{ ...type.caps, color: palette.creamFaint, fontSize: 11, margin: "0 4px" }}>×</span>
              <span style={{
                fontFamily: '"Fraunces", serif', fontSize: 22, fontWeight: 500,
                color: palette.creamMute, lineHeight: 1, fontVariationSettings: '"opsz" 96',
                fontVariantNumeric: "lining-nums tabular-nums",
              }}>{set.reps}</span>
            </>
          )}
        </div>
        <Glyph name="check" size={14} color={palette.sand} strokeWidth={2.2} />
      </div>
    );
  }

  // Editing state — minimal underline inputs
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
      padding: "14px 0",
      borderTop: setIdx === 0 ? `1px solid ${palette.creamFaint}` : "none",
      borderBottom: `1px solid ${palette.creamFaint}`,
    }}>
      <div style={{ ...type.caps, color: palette.creamMute, fontSize: 9, minWidth: 38 }}>{setLabel}</div>
      {!exercise.isBodyweight && (
        <input
          type="number"
          inputMode="decimal"
          value={w}
          onChange={e => setW(e.target.value)}
          onKeyDown={e => e.key === "Enter" && saveSet()}
          placeholder="—"
          className="gh-input is-numeric"
          style={{ width: 64, fontSize: 24 }}
        />
      )}
      {!exercise.isBodyweight && <span style={{ ...type.caps, color: palette.creamFaint, fontSize: 11 }}>×</span>}
      <input
        type="number"
        inputMode="numeric"
        value={r}
        onChange={e => setR(e.target.value)}
        onKeyDown={e => e.key === "Enter" && saveSet()}
        placeholder="—"
        className="gh-input is-numeric"
        style={{ width: exercise.isBodyweight ? 80 : 56, fontSize: 24 }}
      />
      <span style={{ ...type.caps, color: palette.creamMute, fontSize: 9 }}>{exercise.isBodyweight ? "reps" : ""}</span>

      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={saveSet} className="gh-stamp">Log</button>
      </div>
    </div>
  );
}
