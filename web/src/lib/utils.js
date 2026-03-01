import { DAY_CONFIG } from "./constants.js";

export function getTodayDayKey() {
  const day = new Date().getDay();
  if (day === 1) return "monday";
  if (day === 2) return "tuesday";
  if (day === 4) return "thursday";
  if (day === 0) return "sunday";
  return null;
}

export function getDayNumber(dayKey) {
  return { monday: 1, tuesday: 2, thursday: 4, sunday: 0 }[dayKey] || 0;
}

export function getDayConfig(dayKey) {
  const num = getDayNumber(dayKey);
  return DAY_CONFIG[num] || { label: dayKey, color: "#888", icon: "\u{1F3C3}" };
}

export function getWeekWorkouts(history) {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  return history.filter(w => new Date(w.date) >= monday && w.completed);
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
