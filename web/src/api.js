/**
 * API client for Notion backend routes.
 * All Notion operations go through /api/* serverless functions.
 */

const BASE = "";

async function request(method, path, body) {
  const opts = {
    method,
    headers: { "Content-Type": "application/json" },
  };
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `API error ${res.status}`);
  }
  return res.json();
}

// ─── API methods ───────────────────────────────────────────

export async function fetchWorkouts(weeks = 8) {
  const data = await request("GET", `/api/workouts?weeks=${weeks}`);
  return data.workouts;
}

export async function createWorkout({ dayKey, date, exercises, weekNumber }) {
  return request("POST", "/api/workout/create", {
    dayKey,
    date,
    exercises,
    weekNumber,
  });
}

export async function updateSet({ rowPageId, setIndex, weight, reps, isBodyweight }) {
  return request("PATCH", "/api/workout/set", {
    rowPageId,
    setIndex,
    weight,
    reps,
    isBodyweight,
  });
}

export async function updateExerciseNote({ rowPageId, notes }) {
  return request("PATCH", "/api/workout/note", { rowPageId, notes });
}

export async function completeWorkout({ pageId, difficulty, energy, kneeComfort, mood, notes, sauna, duration }) {
  return request("POST", "/api/workout/complete", {
    pageId,
    difficulty,
    energy,
    kneeComfort,
    mood,
    notes,
    sauna,
    duration,
  });
}

export async function discardWorkout({ pageId }) {
  return request("DELETE", "/api/workout/discard", { pageId });
}

export async function planNextWeek() {
  return request("POST", "/api/week/plan", {});
}

export async function healthCheck() {
  return request("GET", "/api/health");
}
