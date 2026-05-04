/**
 * Central state management hook.
 * Uses useReducer (same pattern as original JSX) + localStorage + Notion API.
 */

import { useReducer, useEffect, useRef, useCallback } from "react";
import { EXERCISES, DEFAULT_PROFILE } from "../lib/constants.js";
import { getTargetWeight } from "../lib/progressive.js";
import { unlockAudio, setMuted } from "./../lib/sound.js";
import { scheduleTimer, cancelTimer, registerServiceWorker } from "./../lib/push.js";
import * as api from "../api.js";

// ─── Storage keys ──────────────────────────────────────────

const KEYS = {
  PROFILE: "gym-coach-profile",
  WORKOUTS: "gym-coach-workouts",
  ACTIVE: "gym-coach-active",
};

function loadLocal(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch { /* ignore */ }
}

// ─── Reducer ───────────────────────────────────────────────

const initialState = {
  screen: "loading",
  profile: DEFAULT_PROFILE,
  workoutHistory: [],
  activeWorkout: null,
  expandedExercise: null,
  completionModal: false,
  restEndTime: null,   // absolute ms epoch when rest finishes
  saunaEndTime: null,  // absolute ms epoch when sauna finishes
  toast: null,
  syncing: false,
};

const REST_DURATION_SEC = 90;
const SAUNA_DURATION_SEC = 600;

function reducer(state, action) {
  switch (action.type) {
    case "INIT":
      return {
        ...state,
        ...action.payload,
        screen: action.payload.profile?.setupComplete ? "dashboard" : "setup",
      };
    case "SET_SCREEN":
      return { ...state, screen: action.payload, expandedExercise: null, completionModal: false };
    case "UPDATE_PROFILE":
      return { ...state, profile: { ...state.profile, ...action.payload } };
    case "COMPLETE_SETUP":
      return { ...state, profile: { ...state.profile, ...action.payload, setupComplete: true }, screen: "dashboard" };

    case "START_WORKOUT": {
      const { workout } = action.payload;
      return { ...state, activeWorkout: workout, screen: "workout", expandedExercise: 0 };
    }
    case "SET_NOTION_IDS": {
      if (!state.activeWorkout) return state;
      return {
        ...state,
        activeWorkout: {
          ...state.activeWorkout,
          notionPageId: action.payload.pageId,
          notionChildDbId: action.payload.childDbId,
          exerciseRowIds: action.payload.exerciseRowIds,
        },
      };
    }

    case "TOGGLE_WARMUP":
      return state.activeWorkout
        ? { ...state, activeWorkout: { ...state.activeWorkout, warmupDone: !state.activeWorkout.warmupDone } }
        : state;
    case "EXPAND_EXERCISE":
      return { ...state, expandedExercise: state.expandedExercise === action.payload ? null : action.payload };

    case "LOG_SET": {
      if (!state.activeWorkout) return state;
      const { exerciseIdx, setIdx, weight, reps } = action.payload;
      const exercises = state.activeWorkout.exercises.map((ex, ei) =>
        ei === exerciseIdx
          ? {
              ...ex,
              sets: ex.sets.map((s, si) =>
                si === setIdx
                  ? {
                      weight: weight ?? s.weight,
                      reps: reps ?? s.reps,
                      completed: (weight ?? s.weight) !== null && (reps ?? s.reps) !== null,
                    }
                  : s
              ),
            }
          : ex
      );
      return { ...state, activeWorkout: { ...state.activeWorkout, exercises } };
    }

    case "UPDATE_EXERCISE_NOTE": {
      if (!state.activeWorkout) return state;
      const { exerciseIdx, userNote } = action.payload;
      const exercises = state.activeWorkout.exercises.map((ex, ei) =>
        ei === exerciseIdx ? { ...ex, userNote } : ex
      );
      return { ...state, activeWorkout: { ...state.activeWorkout, exercises } };
    }

    case "SHOW_COMPLETION":
      return { ...state, completionModal: true };
    case "HIDE_COMPLETION":
      return { ...state, completionModal: false };

    case "COMPLETE_WORKOUT": {
      if (!state.activeWorkout) return state;
      const completed = {
        ...state.activeWorkout,
        completed: true,
        endTime: Date.now(),
        duration: Math.round((Date.now() - state.activeWorkout.startTime) / 60000),
        ...action.payload,
      };
      return {
        ...state,
        workoutHistory: [completed, ...state.workoutHistory],
        activeWorkout: null,
        completionModal: false,
        screen: "dashboard",
      };
    }

    case "RESUME_WORKOUT":
      return state.activeWorkout ? { ...state, screen: "workout" } : state;
    case "DISCARD_WORKOUT":
      return { ...state, activeWorkout: null, screen: "dashboard", completionModal: false };

    case "START_REST":
      return { ...state, restEndTime: Date.now() + REST_DURATION_SEC * 1000 };
    case "END_REST":
      return { ...state, restEndTime: null };

    case "START_SAUNA":
      return {
        ...state,
        saunaEndTime: Date.now() + (action.payload?.durationSec || SAUNA_DURATION_SEC) * 1000,
        activeWorkout: state.activeWorkout ? { ...state.activeWorkout, sauna: true } : state.activeWorkout,
      };
    case "END_SAUNA":
      return { ...state, saunaEndTime: null };

    case "SHOW_TOAST":
      return { ...state, toast: action.payload };
    case "HIDE_TOAST":
      return { ...state, toast: null };

    case "SET_SYNCING":
      return { ...state, syncing: action.payload };
    case "SET_HISTORY":
      return { ...state, workoutHistory: action.payload };

    default:
      return state;
  }
}

// ─── Hook ──────────────────────────────────────────────────

export function useWorkout() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const noteTimers = useRef({});

  // ─── Initialize from localStorage
  useEffect(() => {
    const profile = loadLocal(KEYS.PROFILE) || DEFAULT_PROFILE;
    const workouts = loadLocal(KEYS.WORKOUTS) || [];
    const active = loadLocal(KEYS.ACTIVE);

    dispatch({
      type: "INIT",
      payload: { profile, workoutHistory: workouts, activeWorkout: active },
    });
  }, []);

  // ─── Sync from Notion on mount
  useEffect(() => {
    if (state.screen === "loading") return;

    dispatch({ type: "SET_SYNCING", payload: true });
    api.fetchWorkouts(8)
      .then((workouts) => {
        if (workouts && workouts.length > 0) {
          dispatch({ type: "SET_HISTORY", payload: workouts });
          saveLocal(KEYS.WORKOUTS, workouts);
        }
      })
      .catch((err) => {
        console.warn("Notion sync failed (using local cache):", err.message);
      })
      .finally(() => {
        dispatch({ type: "SET_SYNCING", payload: false });
      });
  }, [state.screen === "loading" ? "loading" : "ready"]);

  // ─── Persist profile
  useEffect(() => {
    if (state.screen !== "loading" && state.profile.setupComplete) {
      saveLocal(KEYS.PROFILE, state.profile);
    }
  }, [state.profile, state.screen]);

  // ─── Persist history
  useEffect(() => {
    if (state.screen !== "loading") {
      saveLocal(KEYS.WORKOUTS, state.workoutHistory);
    }
  }, [state.workoutHistory, state.screen]);

  // ─── Persist active workout
  useEffect(() => {
    if (state.screen !== "loading") {
      saveLocal(KEYS.ACTIVE, state.activeWorkout);
    }
  }, [state.activeWorkout, state.screen]);


  // ─── Toast on recent completion
  useEffect(() => {
    if (state.workoutHistory.length > 0 && state.screen === "dashboard") {
      const last = state.workoutHistory[0];
      if (last && last.endTime && Date.now() - last.endTime < 3000) {
        dispatch({ type: "SHOW_TOAST", payload: { message: "Workout saved! Great session \u{1F4AA}", type: "success" } });
      }
    }
  }, [state.workoutHistory.length]);

  // ─── Sound mute toggle reflects profile setting
  useEffect(() => {
    setMuted(state.profile?.soundEnabled === false);
  }, [state.profile?.soundEnabled]);

  // ─── Register service worker once
  useEffect(() => { registerServiceWorker(); }, []);

  // ─── Schedule background notification when rest/sauna start; cancel on end
  useEffect(() => {
    if (state.restEndTime) {
      scheduleTimer({
        id: "rest", endTime: state.restEndTime, tag: "rest-timer",
        title: "Rest complete", body: "Time for the next set.",
      });
    } else {
      cancelTimer("rest");
    }
  }, [state.restEndTime]);

  useEffect(() => {
    if (state.saunaEndTime) {
      scheduleTimer({
        id: "sauna", endTime: state.saunaEndTime, tag: "sauna-timer",
        title: "Sauna done", body: "Step out, hydrate, recover.",
      });
    } else {
      cancelTimer("sauna");
    }
  }, [state.saunaEndTime]);

  // ─── Action: start workout (creates Notion page)
  const startWorkout = useCallback(async (dayKey) => {
    const template = EXERCISES[dayKey];
    if (!template) return;

    // Unlock the audio context now (user gesture) so the chime can play later on iOS.
    unlockAudio();

    const workout = {
      id: Date.now().toString(),
      dayKey,
      date: new Date().toISOString().split("T")[0],
      startTime: Date.now(),
      exercises: template.exercises.map((ex) => ({
        ...ex,
        targetWeight: getTargetWeight(ex, state.workoutHistory, dayKey),
        sets: Array.from({ length: ex.sets }, () => ({
          weight: null,
          reps: null,
          completed: false,
        })),
      })),
      warmupDone: false,
      completed: false,
    };

    dispatch({ type: "START_WORKOUT", payload: { workout } });

    // Create in Notion (background)
    try {
      const result = await api.createWorkout({
        dayKey,
        date: workout.date,
        exercises: workout.exercises,
      });
      dispatch({ type: "SET_NOTION_IDS", payload: result });
    } catch (err) {
      console.error("Failed to create Notion page:", err);
      dispatch({
        type: "SHOW_TOAST",
        payload: { message: "Notion sync failed - data saved locally", type: "error" },
      });
    }
  }, [state.workoutHistory]);

  // ─── Action: log a set (updates Notion in background)
  const logSet = useCallback((exerciseIdx, setIdx, weight, reps) => {
    dispatch({ type: "LOG_SET", payload: { exerciseIdx, setIdx, weight, reps } });
    dispatch({ type: "START_REST" });

    // Sync to Notion in background
    const active = state.activeWorkout;
    if (active?.exerciseRowIds) {
      const ex = active.exercises[exerciseIdx];
      const rowId = active.exerciseRowIds[ex.id];
      if (rowId) {
        const finalWeight = weight ?? ex.sets[setIdx]?.weight;
        const finalReps = reps ?? ex.sets[setIdx]?.reps;
        api.updateSet({
          rowPageId: rowId,
          setIndex: setIdx + 1,
          weight: finalWeight,
          reps: finalReps,
          isBodyweight: ex.isBodyweight,
        }).catch((err) => console.warn("Set sync failed:", err.message));
      }
    }
  }, [state.activeWorkout]);

  // ─── Action: update exercise note (debounced sync)
  const updateExerciseNote = useCallback((exerciseIdx, userNote) => {
    dispatch({ type: "UPDATE_EXERCISE_NOTE", payload: { exerciseIdx, userNote } });

    const active = state.activeWorkout;
    if (!active?.exerciseRowIds) return;
    const ex = active.exercises[exerciseIdx];
    const rowId = active.exerciseRowIds[ex.id];
    if (!rowId) return;

    // Persist as guidance + user note in the Notes column.
    const persisted = [ex.notes, userNote].filter(Boolean).join(" — ");

    if (noteTimers.current[rowId]) clearTimeout(noteTimers.current[rowId]);
    noteTimers.current[rowId] = setTimeout(() => {
      api.updateExerciseNote({ rowPageId: rowId, notes: persisted })
        .catch((err) => console.warn("Note sync failed:", err.message));
    }, 800);
  }, [state.activeWorkout]);

  // ─── Action: discard workout (trashes Notion page)
  const discardWorkout = useCallback(async () => {
    const active = state.activeWorkout;
    dispatch({ type: "DISCARD_WORKOUT" });

    if (active?.notionPageId) {
      try {
        await api.discardWorkout({ pageId: active.notionPageId });
      } catch (err) {
        console.error("Discard sync failed:", err);
      }
    }
  }, [state.activeWorkout]);

  // ─── Action: complete workout (updates Notion)
  const finishWorkout = useCallback(async (metadata) => {
    const active = state.activeWorkout;
    const fullMetadata = { ...metadata, sauna: active?.sauna || false };
    dispatch({ type: "COMPLETE_WORKOUT", payload: fullMetadata });

    if (active?.notionPageId) {
      try {
        await api.completeWorkout({
          pageId: active.notionPageId,
          ...fullMetadata,
          duration: Math.round((Date.now() - active.startTime) / 60000),
        });
      } catch (err) {
        console.error("Completion sync failed:", err);
      }
    }
  }, [state.activeWorkout]);

  return {
    state,
    dispatch,
    startWorkout,
    logSet,
    finishWorkout,
    discardWorkout,
    updateExerciseNote,
  };
}
