import { useState } from "react";
import { getWeightTrend } from "../lib/progressive.js";
import { palette, type, dayway } from "../lib/theme.js";
import Glyph from "./Glyph.jsx";
import SetRow from "./SetRow.jsx";

export default function ExerciseCard({ exercise, index, expanded, dayKey, history, dayColor, dispatch, onLog, onQuickLog, onNoteChange }) {
  const [noteOpen, setNoteOpen] = useState(false);
  const userNote = exercise.userNote ?? "";
  const trend = getWeightTrend(exercise, history, dayKey);
  const allComplete = exercise.sets.every(s => s.completed);
  const someComplete = exercise.sets.some(s => s.completed);
  const way = dayway(dayKey);

  const numLabel = String(index + 1).padStart(2, "0");

  return (
    <div style={{ borderTop: `1px solid ${palette.creamFaint}` }}>
      <div onClick={() => dispatch({ type: "EXPAND_EXERCISE", payload: index })} style={{
        padding: "18px 0", display: "flex", alignItems: "center", gap: 16, cursor: "pointer",
      }}>
        <div style={{
          fontFamily: '"Fraunces", serif', fontWeight: 600,
          fontSize: 22, lineHeight: 1, fontVariationSettings: '"opsz" 96',
          color: allComplete ? palette.sand : someComplete ? way.dominant : palette.creamMute,
          fontVariantNumeric: "lining-nums tabular-nums",
          minWidth: 32,
          opacity: allComplete ? 0.55 : 1,
        }}>{numLabel}</div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: '"Fraunces", serif', fontSize: 17, fontWeight: 600,
            color: allComplete ? palette.creamMute : palette.cream,
            fontVariationSettings: '"opsz" 64',
            textDecoration: allComplete ? "line-through" : "none",
            textDecorationColor: palette.creamFaint,
            textDecorationThickness: "1px",
          }}>
            {exercise.name}
          </div>
          <div style={{ ...type.caps, color: palette.creamMute, fontSize: 10, marginTop: 4 }}>
            {exercise.isBodyweight
              ? <>Bodyweight · {exercise.sets.length} × {exercise.reps}</>
              : <>{exercise.targetWeight}<span style={{ letterSpacing: 0, marginLeft: 2 }}>{" "}{exercise.unit}</span> · {exercise.sets.length} × {exercise.reps}</>}
          </div>
        </div>

        {/* Set segments */}
        <div style={{ display: "flex", gap: 3 }}>
          {exercise.sets.map((s, si) => (
            <div key={si} style={{
              width: 14, height: 3,
              background: s.completed ? palette.sand : palette.creamFaint,
            }} />
          ))}
        </div>

        <div style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          transition: "transform 0.2s ease", transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          marginLeft: 4,
        }}>
          <Glyph name="chevron-down" size={14} color={palette.creamMute} />
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "0 0 22px", animation: "ghFadeIn 0.25s ease both" }}>
          {/* Trend caption */}
          {trend.length > 0 && !exercise.isBodyweight && (
            <div style={{
              padding: "0 0 12px", display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap",
              fontFamily: '"Fraunces", serif', fontVariationSettings: '"opsz" 48',
              fontVariantNumeric: "lining-nums tabular-nums",
            }}>
              <span style={{ ...type.caps, color: palette.creamMute, fontSize: 9 }}>Trend</span>
              {trend.map((t, i) => (
                <span key={i} style={{ fontSize: 14, color: palette.creamMute, fontWeight: 500 }}>
                  {t.avgWeight}{i < trend.length - 1 ? " ·" : ""}
                </span>
              ))}
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: way.dominant }}>
                <Glyph name="arrow-right" size={12} color={way.dominant} strokeWidth={2} />
                <span style={{ fontSize: 16, fontWeight: 600 }}>{exercise.targetWeight}</span>
              </span>
            </div>
          )}
          {exercise.notes && (
            <div style={{
              ...type.small, color: palette.creamMute, fontStyle: "italic",
              marginBottom: 12, paddingLeft: 12, borderLeft: `1px solid ${palette.creamFaint}`,
            }}>
              {exercise.notes}
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {exercise.sets.map((set, si) => (
              <SetRow key={si} set={set} setIdx={si} exerciseIdx={index} exercise={exercise}
                onLog={onLog} onQuickLog={onQuickLog} dayColor={dayColor} />
            ))}
          </div>

          {/* Mid-workout note */}
          {onNoteChange && (
            <div style={{ marginTop: 14 }}>
              {!noteOpen && !userNote && (
                <button
                  onClick={() => setNoteOpen(true)}
                  className="gh-link"
                  style={{ fontSize: 12, color: palette.creamMute }}
                >
                  + note
                </button>
              )}
              {(noteOpen || userNote) && (
                <div>
                  <div style={{ ...type.caps, color: palette.creamMute, fontSize: 9, marginBottom: 6 }}>
                    Note
                  </div>
                  <textarea
                    autoFocus={noteOpen && !userNote}
                    value={userNote}
                    onChange={(e) => onNoteChange(index, e.target.value)}
                    onBlur={() => { if (!userNote) setNoteOpen(false); }}
                    placeholder="thoughts, form cues, PRs…"
                    rows={2}
                    style={{
                      width: "100%",
                      background: "transparent",
                      border: "none",
                      borderBottom: `1px solid ${palette.creamFaint}`,
                      color: palette.cream,
                      fontFamily: '"Fraunces", serif',
                      fontVariationSettings: '"opsz" 48',
                      fontSize: 14,
                      padding: "6px 0",
                      resize: "vertical",
                      outline: "none",
                    }}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
