import { useEffect, useRef, useState } from "react";
import { formatTime } from "../lib/utils.js";
import { palette, type } from "../lib/theme.js";
import { playLongChime } from "../lib/sound.js";
import Glyph from "./Glyph.jsx";

export default function SaunaTimerOverlay({ endTime, durationSec = 600, onSkip, onComplete }) {
  const [now, setNow] = useState(() => Date.now());
  const firedRef = useRef(false);

  useEffect(() => {
    firedRef.current = false;
    let raf;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      if (t >= endTime && !firedRef.current) {
        firedRef.current = true;
        playLongChime();
        onComplete?.();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [endTime, onComplete]);

  const timeLeft = Math.max(0, Math.ceil((endTime - now) / 1000));
  const pct = Math.max(0, Math.min(1, timeLeft / durationSec));

  // Sun arcs across the line — full descent path over the full sauna duration.
  const W = 200;
  const H = 60;
  const lineY = H * 0.78;
  const cx = 16 + (W - 32) * pct;
  const cyOffset = Math.sin(Math.PI * (1 - pct)) * 30;
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
      <svg viewBox={`0 0 ${W} ${H}`} width="120" height={H} style={{ flexShrink: 0 }}>
        <path d={`M 16 ${lineY} Q ${W / 2} ${lineY - 38} ${W - 16} ${lineY}`}
          fill="none" stroke={palette.creamFaint} strokeWidth="0.6" strokeDasharray="1.2 1.6" />
        <line x1="0" x2={W} y1={lineY} y2={lineY} stroke={palette.creamFaint} strokeWidth="0.8" />
        <circle cx={cx} cy={cy} r="6.5" fill={palette.sand} opacity="0.25" />
        <circle cx={cx} cy={cy} r="4" fill={palette.sand} />
      </svg>

      <div style={{ flex: 1 }}>
        <div style={{ ...type.caps, color: palette.sand, display: "inline-flex", alignItems: "center", gap: 6 }}>
          <Glyph name="wave" size={11} color={palette.sand} />
          Sauna
        </div>
        <div style={{
          fontFamily: '"Fraunces", serif', fontSize: 32, fontWeight: 600,
          color: palette.cream, lineHeight: 1, marginTop: 4,
          fontVariationSettings: '"opsz" 144',
          fontVariantNumeric: "lining-nums tabular-nums",
          letterSpacing: "-0.02em",
        }}>{formatTime(timeLeft)}</div>
        <div style={{ ...type.small, color: palette.creamMute, marginTop: 4, fontStyle: "italic" }}>
          breathe deep · hydrate
        </div>
      </div>

      <button onClick={onSkip} className="gh-link" style={{ fontSize: 13, color: palette.creamMute }}>
        end →
      </button>
    </div>
  );
}
