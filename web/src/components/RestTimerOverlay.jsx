import { formatTime } from "../lib/utils.js";

export default function RestTimerOverlay({ timeLeft, onSkip }) {
  const pct = timeLeft / 90;

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 900,
      background: "linear-gradient(to top, rgba(15,23,42,0.98), rgba(15,23,42,0.85))",
      backdropFilter: "blur(10px)", padding: "16px 20px",
      display: "flex", alignItems: "center", gap: 16,
      borderTop: "1px solid rgba(255,255,255,0.1)",
    }}>
      <div style={{ position: "relative", width: 52, height: 52, flexShrink: 0 }}>
        <svg width="52" height="52" style={{ transform: "rotate(-90deg)" }}>
          <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
          <circle cx="26" cy="26" r="22" fill="none" stroke="#3B82F6" strokeWidth="4" strokeDasharray={`${pct * 138.2} 138.2`} strokeLinecap="round" />
        </svg>
        <span style={{
          position: "absolute", inset: 0, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 15, fontWeight: 700, color: "#fff",
          fontFamily: "'JetBrains Mono', monospace",
        }}>{formatTime(timeLeft)}</span>
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "#fff" }}>Rest Timer</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>Take a breath, hydrate</div>
      </div>
      <button onClick={onSkip} style={{
        background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
        color: "#fff", padding: "8px 16px", borderRadius: 8, fontSize: 13,
        fontWeight: 600, cursor: "pointer",
      }}>Skip</button>
    </div>
  );
}
