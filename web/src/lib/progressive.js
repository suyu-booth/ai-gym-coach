// ─── PROGRESSIVE OVERLOAD ────────────────────────────────────
// Direct copy of JSX getTargetWeight and getWeightTrend.

export function getTargetWeight(exercise, history, dayKey) {
  if (exercise.isBodyweight) return 0;
  const relevant = history
    .filter(w => w.dayKey === dayKey && w.completed)
    .slice(0, 3)
    .map(w => w.exercises.find(e => e.id === exercise.id))
    .filter(Boolean);

  if (relevant.length === 0) return exercise.defaultWeight;

  const lastSession = relevant[0];
  const completedSets = lastSession.sets.filter(s => s.completed);
  if (completedSets.length === 0) return exercise.defaultWeight;

  const avgWeight = completedSets.reduce((a, s) => a + (s.weight || 0), 0) / completedSets.length;
  const allRepsHit = completedSets.every(s => s.reps >= (parseInt(exercise.reps) || 12));
  const lastDifficulty = history.find(w => w.dayKey === dayKey && w.completed)?.difficulty;

  if (relevant.length >= 2 && allRepsHit && (!lastDifficulty || lastDifficulty <= 3)) {
    return Math.round((avgWeight + exercise.increment) * 2) / 2;
  }
  if (lastDifficulty >= 5) {
    return Math.max(0, Math.round((avgWeight - exercise.increment) * 2) / 2);
  }
  return Math.round(avgWeight * 2) / 2;
}

export function getWeightTrend(exercise, history, dayKey) {
  const relevant = history
    .filter(w => w.dayKey === dayKey && w.completed)
    .slice(0, 3)
    .map(w => {
      const ex = w.exercises.find(e => e.id === exercise.id);
      if (!ex) return null;
      const completed = ex.sets.filter(s => s.completed);
      if (completed.length === 0) return null;
      return { date: w.date, avgWeight: Math.round(completed.reduce((a, s) => a + (s.weight || 0), 0) / completed.length) };
    })
    .filter(Boolean);
  return relevant;
}
