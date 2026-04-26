import { formatTime } from "../lib/utils.js";
import { palette, type } from "../lib/theme.js";

export default function RestTimerOverlay({ timeLeft, onSkip, accent = palette.horizon }) {
  const pct = Math.max(0, Math.min(1, timeLeft / 90));

  // Sun arcs over the line and descends as time runs out.
  const W = 200;
  const H = 60;
  const lineY = H * 0.78;
  const cx = 16 + (W - 32) * pct;                        // starts right, moves left as timer counts down
  const cyOffset = Math.sin(Math.PI * (1 - pct)) * 30;  // arc shape
  const cy = lineY - cyOffset;

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 900,
      background: `linear-gradient(to top, ${palette.ink2} 0%, rgba(38,70,83,0.92) 100%)`,
      borderTop: `1px solid ${palette.creamFaint}`,
      backdropFilter: "blur(10px)",
      padding: "16px 22px 18px",
      display: "flex", alignItems: "center", gap: 18,
    }}>
      {/* Mini horizon scene */}
      <svg viewBox={`0 0 ${W} ${H}`} width="120" height={H} style={{ flexShrink: 0 }}>
        <path d={`M 16 ${lineY} Q ${W / 2} ${lineY - 38} ${W - 16} ${lineY}`}
          fill="none" stroke={palette.creamFaint} strokeWidth="0.6" strokeDasharray="1.2 1.6" />
        <line x1="0" x2={W} y1={lineY} y2={lineY} stroke={palette.creamFaint} strokeWidth="0.8" />
        <circle cx={cx} cy={cy} r="6.5" fill={accent} opacity="0.25" />
        <circle cx={cx} cy={cy} r="4" fill={accent} />
      </svg>

      <div style={{ flex: 1 }}>
        <div style={{ ...type.caps, color: palette.creamMute }}>Rest</div>
        <div style={{
          fontFamily: '"Fraunces", serif', fontSize: 32, fontWeight: 600,
          color: palette.cream, lineHeight: 1, marginTop: 4,
          fontVariationSettings: '"opsz" 144',
          fontVariantNumeric: "lining-nums tabular-nums",
          letterSpacing: "-0.02em",
        }}>{formatTime(timeLeft)}</div>
        <div style={{ ...type.small, color: palette.creamMute, marginTop: 4, fontStyle: "italic" }}>
          breathe · hydrate
        </div>
      </div>

      <button onClick={onSkip} className="gh-link" style={{ fontSize: 13, color: palette.creamMute }}>
        skip →
      </button>
    </div>
  );
}
