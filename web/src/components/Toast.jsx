import { useEffect } from "react";
import { palette } from "../lib/theme.js";
import { stripEmoji } from "../lib/theme.js";

export default function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 2500);
    return () => clearTimeout(t);
  }, [onClose]);

  const accent = type === "error" ? palette.horizon : type === "success" ? palette.sand : palette.coral;

  return (
    <div style={{
      position: "fixed", top: 0, left: "50%", transform: "translateX(-50%)",
      zIndex: 1000, display: "flex", alignItems: "center", gap: 14,
      background: palette.ink2, color: palette.cream,
      borderTop: `2px solid ${accent}`,
      padding: "14px 22px", minWidth: 240, maxWidth: 420,
      boxShadow: "0 8px 30px rgba(0,0,0,0.45)",
      animation: "ghSlideDown 0.3s cubic-bezier(0.2,0.7,0.2,1)",
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: "50%", background: accent, flexShrink: 0,
      }} />
      <span style={{
        fontFamily: '"Inter", sans-serif',
        fontSize: 11, fontWeight: 600, letterSpacing: "0.20em", textTransform: "uppercase",
      }}>
        {stripEmoji(message)}
      </span>
    </div>
  );
}
