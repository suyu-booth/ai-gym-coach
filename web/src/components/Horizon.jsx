import { palette } from "../lib/theme.js";

// The reusable horizon primitive: a single horizontal rule with one or more
// suns positioned along it. Suns above the line = "risen" (completed). Suns
// below = "below the horizon" (pending).
//
// Used by:
//  - Dashboard weekly progress (3 suns for Mon/Tue/Thu)
//  - Workout-screen progress (1 traveling sun)
//  - Quick-start tiles (1 sun at a per-day elevation)
//  - Rest-timer overlay (1 sun arcing down)

export default function Horizon({
  height = 64,
  suns = [],            // [{ x: 0..1, y: -1..1, color, label, sublabel, size, intensity }]
  showLine = true,
  arc = false,          // draws a faint arc above the line for "the sky path"
  style,
}) {
  const W = 100;        // viewBox width — we paint into a normalized box
  const H = 40;
  const lineY = H * 0.62;
  const sunR = 2.6;

  return (
    <div style={{ width: "100%", position: "relative", ...style }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={height} preserveAspectRatio="none" style={{ display: "block", overflow: "visible" }}>
        {arc && (
          <path
            d={`M 4 ${lineY} Q ${W / 2} ${lineY - 28} ${W - 4} ${lineY}`}
            fill="none"
            stroke={palette.creamFaint}
            strokeWidth="0.4"
            strokeDasharray="0.8 1.2"
            vectorEffect="non-scaling-stroke"
          />
        )}
        {showLine && (
          <line x1="2" x2={W - 2} y1={lineY} y2={lineY}
            stroke={palette.creamFaint} strokeWidth="0.5" vectorEffect="non-scaling-stroke" />
        )}
        {suns.map((s, i) => {
          const cx = 4 + s.x * (W - 8);
          // y in [-1, 1], -1 = high in sky, 0 = on horizon, 1 = below
          const offset = (s.y ?? 0) * 14;
          const cy = lineY - offset;
          const r = (s.size ?? 1) * sunR;
          const color = s.color || palette.sand;
          const intensity = s.intensity ?? 1;
          const opacity = 0.18 + 0.82 * intensity;
          return (
            <g key={i} opacity={opacity}>
              {s.y < 0 && (
                <circle cx={cx} cy={cy} r={r * 2.2} fill={color} opacity={0.18} />
              )}
              <circle cx={cx} cy={cy} r={r} fill={color} />
              {s.y < 0 && (
                <line
                  x1={cx} x2={cx} y1={cy + r} y2={lineY}
                  stroke={color}
                  strokeWidth="0.35"
                  strokeDasharray="0.4 0.6"
                  vectorEffect="non-scaling-stroke"
                  opacity={0.5}
                />
              )}
            </g>
          );
        })}
      </svg>
      {suns.some(s => s.label) && (
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, padding: "0 2px" }}>
          {suns.map((s, i) => (
            <div key={i} style={{ flex: 1, textAlign: "center", minWidth: 0 }}>
              {s.label && (
                <div style={{
                  fontFamily: '"Inter", sans-serif', fontSize: 10, fontWeight: 600,
                  letterSpacing: "0.18em", textTransform: "uppercase",
                  color: s.y < 0 ? palette.cream : palette.creamMute,
                }}>{s.label}</div>
              )}
              {s.sublabel && (
                <div style={{
                  fontFamily: '"Fraunces", serif', fontSize: 13, marginTop: 1,
                  color: s.y < 0 ? palette.cream : palette.creamMute,
                  fontVariationSettings: '"opsz" 64',
                }}>{s.sublabel}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
