import { useState } from "react";
import {
  EXERCISES, DIFFICULTY_NAMES,
  ENERGY_OPTIONS, KNEE_COMFORT_OPTIONS, MOOD_OPTIONS,
} from "../lib/constants.js";
import { palette, type, dayway, skyGradient } from "../lib/theme.js";
import { getDayConfig } from "../lib/utils.js";
import Glyph from "./Glyph.jsx";

function SpecRow({ label, children }) {
  return (
    <div style={{
      display: "flex", alignItems: "baseline", justifyContent: "space-between",
      gap: 16, padding: "16px 0", borderTop: `1px solid ${palette.creamFaint}`,
      flexWrap: "wrap",
    }}>
      <div style={{ ...type.caps, color: palette.creamMute, minWidth: 80 }}>{label}</div>
      <div style={{ flex: 1, textAlign: "right" }}>{children}</div>
    </div>
  );
}

function InlineChoice({ options, value, onChange, accent }) {
  return (
    <div style={{ display: "inline-flex", flexWrap: "wrap", gap: 12, justifyContent: "flex-end" }}>
      {options.map((opt, i) => {
        const v = typeof opt === "string" ? opt : opt.value;
        const label = typeof opt === "string" ? opt : opt.display;
        const selected = v === value;
        return (
          <button key={i} onClick={() => onChange(v)} style={{
            background: "none", border: "none", cursor: "pointer", padding: "2px 0",
            fontFamily: '"Fraunces", serif', fontSize: 16, fontWeight: selected ? 600 : 500,
            fontVariationSettings: '"opsz" 64',
            color: selected ? accent : palette.creamMute,
            borderBottom: selected ? `1.5px solid ${accent}` : "1.5px solid transparent",
          }}>
            {label}
          </button>
        );
      })}
    </div>
  );
}

export default function CompletionModal({ workout, onComplete, onClose }) {
  const cfg = getDayConfig(workout.dayKey);
  const way = dayway(workout.dayKey);
  const [difficulty, setDifficulty] = useState(3);
  const [energy, setEnergy] = useState(ENERGY_OPTIONS[0].value);
  const [kneeComfort, setKneeComfort] = useState(KNEE_COMFORT_OPTIONS[0].value);
  const [mood, setMood] = useState(MOOD_OPTIONS[1].value);
  const [notes, setNotes] = useState("");
  const [sauna, setSauna] = useState(EXERCISES[workout.dayKey]?.hasSauna || false);

  const setsCompleted = workout.exercises.reduce((a, e) => a + e.sets.filter(s => s.completed).length, 0);
  const totalSets = workout.exercises.reduce((a, e) => a + e.sets.length, 0);
  const elapsed = Math.round((Date.now() - workout.startTime) / 60000);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 950,
      background: "rgba(26,42,51,0.85)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        width: "100%", maxWidth: 480,
        background: skyGradient(1, way.dominant),
        maxHeight: "92vh", overflowY: "auto",
        animation: "ghFadeIn 0.35s cubic-bezier(0.2,0.7,0.2,1) both",
      }}>
        <div style={{ padding: "32px 24px 36px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
            <div>
              <div style={{ ...type.caps, color: palette.creamMute }}>Session Logged</div>
              <h2 style={{ ...type.display, color: palette.cream, marginTop: 6 }}>Good work.</h2>
            </div>
            <button onClick={onClose} style={{
              background: "none", border: "none", cursor: "pointer", padding: 4,
            }} aria-label="Close">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke={palette.creamMute} strokeWidth="1.5" strokeLinecap="round">
                <path d="M6 6l12 12M6 18L18 6" />
              </svg>
            </button>
          </div>

          {/* Headline stats */}
          <div style={{
            display: "flex", gap: 24, marginBottom: 8, paddingBottom: 24,
            borderBottom: `1px solid ${palette.creamFaint}`,
          }}>
            <div>
              <div style={{ ...type.caps, color: palette.creamMute, fontSize: 9 }}>Day</div>
              <div style={{ ...type.numeral, color: palette.cream, fontSize: 30, marginTop: 4 }}>{cfg.short}</div>
            </div>
            <div>
              <div style={{ ...type.caps, color: palette.creamMute, fontSize: 9 }}>Time</div>
              <div style={{ ...type.numeral, color: palette.cream, fontSize: 30, marginTop: 4, fontVariantNumeric: "lining-nums tabular-nums" }}>
                {elapsed}<span style={{ ...type.caps, fontSize: 11, color: palette.creamMute, marginLeft: 4 }}>min</span>
              </div>
            </div>
            <div>
              <div style={{ ...type.caps, color: palette.creamMute, fontSize: 9 }}>Sets</div>
              <div style={{ ...type.numeral, color: palette.cream, fontSize: 30, marginTop: 4, fontVariantNumeric: "lining-nums tabular-nums" }}>
                {setsCompleted}<span style={{ color: palette.creamFaint }}>/{totalSets}</span>
              </div>
            </div>
          </div>

          {/* Difficulty — flame chips */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 0", borderBottom: `1px solid ${palette.creamFaint}`,
          }}>
            <div style={{ ...type.caps, color: palette.creamMute }}>Difficulty</div>
            <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
              {[1, 2, 3, 4, 5].map(d => (
                <button key={d} onClick={() => setDifficulty(d)} style={{
                  background: "none", border: "none", cursor: "pointer", padding: 4,
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                }}>
                  <Glyph name="flame" size={d === difficulty ? 18 : 14}
                    color={d <= difficulty ? way.dominant : palette.creamFaint} />
                  {d === difficulty && (
                    <span style={{ ...type.caps, color: way.dominant, fontSize: 9 }}>
                      {DIFFICULTY_NAMES[d]}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Spec sheet selectors */}
          <SpecRow label="Energy">
            <InlineChoice options={ENERGY_OPTIONS} value={energy} onChange={setEnergy} accent={way.dominant} />
          </SpecRow>
          <SpecRow label="Knee">
            <InlineChoice options={KNEE_COMFORT_OPTIONS} value={kneeComfort} onChange={setKneeComfort} accent={way.dominant} />
          </SpecRow>
          <SpecRow label="Mood">
            <InlineChoice options={MOOD_OPTIONS} value={mood} onChange={setMood} accent={way.dominant} />
          </SpecRow>

          {/* Sauna toggle */}
          <div style={{
            padding: "16px 0", borderTop: `1px solid ${palette.creamFaint}`,
            display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16,
          }}>
            <div style={{ ...type.caps, color: palette.creamMute }}>Recovery</div>
            <button onClick={() => setSauna(!sauna)} style={{
              background: "none", border: "none", cursor: "pointer", padding: 0,
              fontFamily: '"Fraunces", serif', fontSize: 16, fontWeight: sauna ? 600 : 500,
              fontVariationSettings: '"opsz" 64', fontStyle: sauna ? "normal" : "italic",
              color: sauna ? palette.sand : palette.creamMute,
              borderBottom: sauna ? `1.5px solid ${palette.sand}` : `1.5px solid transparent`,
            }}>
              {sauna ? "+ sauna recovery" : "no sauna"}
            </button>
          </div>

          {/* Notes */}
          <div style={{ padding: "20px 0 8px", borderTop: `1px solid ${palette.creamFaint}` }}>
            <div style={{ ...type.caps, color: palette.creamMute, marginBottom: 8 }}>Notes</div>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="PRs, form cues, adjustments…"
              rows={2}
              className="gh-input"
              style={{ resize: "none", fontStyle: notes ? "normal" : "italic", fontWeight: 400, fontSize: 16 }}
            />
          </div>

          {/* Submit */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 28 }}>
            <button
              onClick={() => onComplete({ difficulty, energy, kneeComfort, mood, notes, sauna })}
              className="gh-stamp is-filled"
              style={{ padding: "14px 28px", fontSize: 12 }}
            >
              Log Session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
