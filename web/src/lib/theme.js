// Golden Hour design tokens — Sunset Boulevard palette + editorial type system.

export const palette = {
  ink: "#1A2A33",
  ink2: "#264653",
  horizon: "#e76f51",
  coral: "#f4a261",
  sand: "#e9c46a",
  cream: "#FAF3E3",
  creamMute: "rgba(250,243,227,0.55)",
  creamFaint: "rgba(250,243,227,0.20)",
  creamHair: "rgba(250,243,227,0.10)",
};

// Day-type colorways: each day owns a dominant warm accent against ink.
export const dayways = {
  monday:   { dominant: palette.horizon, soft: "rgba(231,111,81,0.18)",  faint: "rgba(231,111,81,0.08)",  elevation: 0.20, name: "Push Day", short: "PUSH" },
  tuesday:  { dominant: palette.sand,    soft: "rgba(233,196,106,0.20)", faint: "rgba(233,196,106,0.08)", elevation: 0.65, name: "Lower Day", short: "LOWER" },
  thursday: { dominant: palette.coral,   soft: "rgba(244,162,97,0.18)",  faint: "rgba(244,162,97,0.08)",  elevation: 0.45, name: "Pull Day", short: "PULL" },
  sunday:   { dominant: "#b07a8c",       soft: "rgba(176,122,140,0.18)", faint: "rgba(176,122,140,0.08)", elevation: 0.85, name: "Bachata", short: "DANCE" },
};

export function dayway(dayKey) {
  return dayways[dayKey] || dayways.monday;
}

// Living-sky gradient. progress: 0..1 — drives how high the warmth reaches.
export function skyGradient(progress, accent = palette.horizon) {
  const p = Math.max(0, Math.min(1, progress));
  const sandStop = 0;
  const accentStop = Math.max(2, p * 35);
  const ink2Stop = Math.max(accentStop + 18, 32 + p * 20);
  return `linear-gradient(to top, ${palette.sand} ${sandStop}%, ${accent} ${accentStop}%, ${palette.ink2} ${ink2Stop}%, ${palette.ink} 92%)`;
}

// Static dawn gradient used for the Dashboard backdrop.
export const dawnGradient =
  `linear-gradient(to top, rgba(231,111,81,0.10) 0%, ${palette.ink2} 38%, ${palette.ink} 100%)`;

export const fonts = {
  display: `"Fraunces", "Cormorant Garamond", "Times New Roman", serif`,
  body: `"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`,
};

export const type = {
  hero:       { fontFamily: fonts.display, fontSize: 92, lineHeight: 0.9,  fontWeight: 600, letterSpacing: "-0.04em", fontVariationSettings: '"opsz" 144, "SOFT" 100' },
  display:    { fontFamily: fonts.display, fontSize: 40, lineHeight: 1.0,  fontWeight: 600, letterSpacing: "-0.02em", fontVariationSettings: '"opsz" 144' },
  title:      { fontFamily: fonts.display, fontSize: 26, lineHeight: 1.15, fontWeight: 600, letterSpacing: "-0.01em", fontVariationSettings: '"opsz" 96' },
  subtitle:   { fontFamily: fonts.display, fontSize: 20, lineHeight: 1.2,  fontWeight: 600, letterSpacing: "-0.005em", fontVariationSettings: '"opsz" 64' },
  body:       { fontFamily: fonts.body,    fontSize: 14, lineHeight: 1.5,  fontWeight: 400, letterSpacing: "0" },
  bodyStrong: { fontFamily: fonts.body,    fontSize: 14, lineHeight: 1.45, fontWeight: 600, letterSpacing: "0" },
  small:      { fontFamily: fonts.body,    fontSize: 12, lineHeight: 1.45, fontWeight: 400, letterSpacing: "0" },
  caps:       { fontFamily: fonts.body,    fontSize: 11, lineHeight: 1.2,  fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase" },
  capsLg:     { fontFamily: fonts.body,    fontSize: 12, lineHeight: 1.2,  fontWeight: 600, letterSpacing: "0.20em", textTransform: "uppercase" },
  numeral:    { fontFamily: fonts.display, fontSize: 36, lineHeight: 1.0,  fontWeight: 600, fontVariationSettings: '"opsz" 144' },
  numeralLg:  { fontFamily: fonts.display, fontSize: 64, lineHeight: 1.0,  fontWeight: 600, fontVariationSettings: '"opsz" 144', letterSpacing: "-0.03em" },
};

// Strip leading/trailing emoji + variation selectors from a label so we can
// re-render in the editorial style while keeping Notion-bound values intact.
const EMOJI_RE = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}\u{200D}⚠✅✓✕⚡⏱⏸→←↑↓▼]/gu;
export function stripEmoji(text) {
  if (!text) return "";
  return String(text).replace(EMOJI_RE, "").trim();
}
