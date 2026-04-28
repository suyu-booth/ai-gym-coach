import { useWorkout } from "./hooks/useWorkout.js";
import { getDayConfig } from "./lib/utils.js";
import { palette, dawnGradient, type } from "./lib/theme.js";
import Toast from "./components/Toast.jsx";
import SetupScreen from "./components/SetupScreen.jsx";
import Dashboard from "./components/Dashboard.jsx";
import WorkoutScreen from "./components/WorkoutScreen.jsx";
import HistoryScreen from "./components/HistoryScreen.jsx";
import SettingsScreen from "./components/SettingsScreen.jsx";
import WeeklySummary from "./components/WeeklySummary.jsx";
import CompletionModal from "./components/CompletionModal.jsx";
import SaunaTimerOverlay from "./components/SaunaTimerOverlay.jsx";
import Horizon from "./components/Horizon.jsx";

export default function App() {
  const { state, dispatch, startWorkout, logSet, quickLogSet, finishWorkout, updateExerciseNote } = useWorkout();

  if (state.screen === "loading") {
    return (
      <div style={{ minHeight: "100vh", background: dawnGradient, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ textAlign: "center", maxWidth: 320, animation: "ghFadeIn 0.6s ease both" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}>
            <div style={{ width: 240 }}>
              <Horizon
                height={48}
                suns={[{ x: 0.5, y: -0.25, color: palette.horizon, size: 1.4 }]}
                arc
              />
            </div>
          </div>
          <div style={{ ...type.caps, color: palette.creamMute }}>Golden Hour</div>
          <div style={{ ...type.title, color: palette.cream, marginTop: 6 }}>Loading the morning…</div>
        </div>
      </div>
    );
  }

  return (
    <>
      {state.toast && (
        <Toast message={state.toast.message} type={state.toast.type} onClose={() => dispatch({ type: "HIDE_TOAST" })} />
      )}

      {state.screen === "setup" && <SetupScreen profile={state.profile} dispatch={dispatch} />}
      {state.screen === "dashboard" && <Dashboard state={state} dispatch={dispatch} startWorkout={startWorkout} />}
      {state.screen === "workout" && <WorkoutScreen state={state} dispatch={dispatch} logSet={logSet} quickLogSet={quickLogSet} updateExerciseNote={updateExerciseNote} />}
      {state.screen === "history" && <HistoryScreen history={state.workoutHistory} dispatch={dispatch} />}
      {state.screen === "settings" && <SettingsScreen profile={state.profile} dispatch={dispatch} />}
      {state.screen === "weeklySummary" && <WeeklySummary state={state} dispatch={dispatch} />}

      {state.completionModal && state.activeWorkout && (
        <CompletionModal
          workout={state.activeWorkout}
          onComplete={finishWorkout}
          onClose={() => dispatch({ type: "HIDE_COMPLETION" })}
          dayColor={getDayConfig(state.activeWorkout.dayKey).color}
          dispatch={dispatch}
        />
      )}

      {state.saunaEndTime && state.screen !== "workout" && (
        <SaunaTimerOverlay
          endTime={state.saunaEndTime}
          onSkip={() => dispatch({ type: "END_SAUNA" })}
          onComplete={() => dispatch({ type: "END_SAUNA" })}
        />
      )}
    </>
  );
}
