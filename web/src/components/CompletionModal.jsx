import { useState } from "react";
import { EXERCISES, DIFFICULTY_LABELS, DIFFICULTY_COLORS, ENERGY_OPTIONS, KNEE_COMFORT_OPTIONS, MOOD_OPTIONS } from "../lib/constants.js";
import QuickSelect from "./QuickSelect.jsx";

export default function CompletionModal({ workout, onComplete, onClose, dayColor }) {
  const [difficulty, setDifficulty] = useState(3);
  const [energy, setEnergy] = useState("\u{1F610} Medium");
  const [kneeComfort, setKneeComfort] = useState("\u2705 No pain");
  const [mood, setMood] = useState("\u{1F60C} Good");
  const [notes, setNotes] = useState("");
  const [sauna, setSauna] = useState(EXERCISES[workout.dayKey]?.hasSauna || false);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 950,
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: "100%", maxWidth: 480, background: "#111827",
        borderRadius: "20px 20px 0 0", padding: "24px 20px 36px",
        maxHeight: "85vh", overflowY: "auto",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff" }}>Workout Complete! {"\u{1F389}"}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 20, cursor: "pointer" }}>{"\u2715"}</button>
        </div>

        {/* Difficulty */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 8, display: "block" }}>Difficulty</label>
          <div style={{ display: "flex", gap: 6 }}>
            {[1, 2, 3, 4, 5].map(d => (
              <button key={d} onClick={() => setDifficulty(d)} style={{
                flex: 1, padding: "10px 4px", borderRadius: 8,
                border: `1px solid ${difficulty === d ? DIFFICULTY_COLORS[d] + "66" : "rgba(255,255,255,0.08)"}`,
                background: difficulty === d ? DIFFICULTY_COLORS[d] + "22" : "rgba(255,255,255,0.03)",
                color: difficulty === d ? DIFFICULTY_COLORS[d] : "rgba(255,255,255,0.4)",
                fontSize: 11, fontWeight: 600, cursor: "pointer", textAlign: "center", lineHeight: 1.3,
              }}>
                {DIFFICULTY_LABELS[d].split(" ")[0]}<br /><span style={{ fontSize: 14 }}>{DIFFICULTY_LABELS[d].split(" ")[1]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick selects */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
          <QuickSelect label="Energy" value={energy} options={ENERGY_OPTIONS} onChange={setEnergy} />
          <QuickSelect label="Knee Comfort" value={kneeComfort} options={KNEE_COMFORT_OPTIONS} onChange={setKneeComfort} />
          <QuickSelect label="Mood After" value={mood} options={MOOD_OPTIONS} onChange={setMood} />
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)", marginBottom: 6, display: "block" }}>Sauna</label>
            <button onClick={() => setSauna(!sauna)} style={{
              width: "100%", padding: "10px", borderRadius: 8,
              border: `1px solid ${sauna ? "rgba(234,179,8,0.3)" : "rgba(255,255,255,0.08)"}`,
              background: sauna ? "rgba(234,179,8,0.1)" : "rgba(255,255,255,0.03)",
              color: sauna ? "#EAB308" : "rgba(255,255,255,0.4)",
              fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}>
              {sauna ? "\u{1F9D6} Yes" : "No"}
            </button>
          </div>
        </div>

        {/* Notes */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)", marginBottom: 6, display: "block" }}>Notes (optional)</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)}
            placeholder="PRs, form cues, adjustments..." rows={2} style={{
              width: "100%", padding: "12px", background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
              color: "#fff", fontSize: 16, outline: "none", resize: "none",
              fontFamily: "inherit", boxSizing: "border-box",
            }} />
        </div>

        <button onClick={() => onComplete({ difficulty, energy, kneeComfort, mood, notes, sauna })} style={{
          width: "100%", padding: "16px 0", background: dayColor,
          color: "#fff", border: "none", borderRadius: 12, fontSize: 16,
          fontWeight: 700, cursor: "pointer",
        }}>
          Save Workout {"\u2713"}
        </button>
      </div>
    </div>
  );
}
