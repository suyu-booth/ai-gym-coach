import { palette } from "../lib/theme.js";

// Stroked SVG glyphs used in place of emoji. Single visual family — every
// icon is a 24-box, 1.5px stroke, round caps, no fills (except the sun core).

export default function Glyph({ name, size = 20, color = palette.cream, strokeWidth = 1.5, style }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: { display: "block", flexShrink: 0, ...style },
  };

  switch (name) {
    case "sun":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4" fill={color} stroke="none" />
          <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.5 4.5l2 2M17.5 17.5l2 2M4.5 19.5l2-2M17.5 6.5l2-2" />
        </svg>
      );
    case "sun-rising":
      return (
        <svg {...common}>
          <path d="M3 17h18" />
          <path d="M12 17a5 5 0 0 1 10 0" fill={color} stroke="none" opacity="0.92" />
          <path d="M12 17a5 5 0 0 1 10 0" />
          <path d="M2 17h2M20 17h2M5 11l1.6 1.6M17.4 12.6L19 11M11 6v2.5" />
        </svg>
      );
    case "sun-noon":
      return (
        <svg {...common}>
          <path d="M3 19h18" />
          <circle cx="12" cy="11" r="3.6" fill={color} stroke="none" />
          <circle cx="12" cy="11" r="3.6" />
          <path d="M12 3v2.5M5.2 7.2l1.6 1.6M17.2 8.8l1.6-1.6M3 11h2M19 11h2" />
        </svg>
      );
    case "sun-arc":
      return (
        <svg {...common}>
          <path d="M3 19h18" />
          <path d="M3 19a9 9 0 0 1 18 0" strokeOpacity="0.35" />
          <circle cx="17" cy="13.5" r="3.4" fill={color} stroke="none" />
          <circle cx="17" cy="13.5" r="3.4" />
        </svg>
      );
    case "sun-set":
      return (
        <svg {...common}>
          <path d="M3 17h18" />
          <path d="M7 17a5 5 0 0 1 10 0" fill={color} stroke="none" opacity="0.55" />
          <path d="M7 17a5 5 0 0 1 10 0" />
          <path d="M2 17h2M20 17h2M4 13l2 1M18 14l2-1M11 9.5V12" />
        </svg>
      );
    case "horizon":
      return (
        <svg {...common}>
          <path d="M2 13h20" />
          <circle cx="12" cy="13" r="2.6" fill={color} stroke="none" />
        </svg>
      );
    case "plate":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="2.4" fill={color} stroke="none" />
        </svg>
      );
    case "arc":
      return (
        <svg {...common}>
          <path d="M4 18a8 8 0 0 1 16 0" />
          <path d="M17 14l3 4-4 1" />
        </svg>
      );
    case "flame":
      return (
        <svg {...common}>
          <path d="M12 3c2 3.5 5 5 5 9a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3-1-3 0-5 1-8z" fill={color} stroke="none" opacity="0.9" />
          <path d="M12 3c2 3.5 5 5 5 9a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3-1-3 0-5 1-8z" />
        </svg>
      );
    case "wave":
      return (
        <svg {...common}>
          <path d="M3 9c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2" />
          <path d="M3 14c2 0 2 2 4 2s2-2 4-2 2 2 4 2 2-2 4-2" />
          <path d="M3 19c2 0 2 2 4 2" opacity="0.5" />
        </svg>
      );
    case "check":
      return (
        <svg {...common}>
          <path d="M4 12.5l5 5L20 6.5" />
        </svg>
      );
    case "arrow-right":
      return (
        <svg {...common}>
          <path d="M5 12h14M14 6l6 6-6 6" />
        </svg>
      );
    case "arrow-left":
      return (
        <svg {...common}>
          <path d="M19 12H5M10 6l-6 6 6 6" />
        </svg>
      );
    case "chevron-down":
      return (
        <svg {...common}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      );
    case "settings":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="2.5" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3h0a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8v0a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" />
        </svg>
      );
    case "stopwatch":
      return (
        <svg {...common}>
          <circle cx="12" cy="14" r="7" />
          <path d="M9 2h6M12 14V9M19 7l1.5-1.5" />
        </svg>
      );
    case "pause":
      return (
        <svg {...common}>
          <path d="M9 5v14M15 5v14" />
        </svg>
      );
    default:
      return null;
  }
}
