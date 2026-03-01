import { useWorkout } from "./hooks/useWorkout.js";
import { getDayConfig } from "./lib/utils.js";
import Toast from "./components/Toast.jsx";
import SetupScreen from "./components/SetupScreen.jsx";
import Dashboard from "./components/Dashboard.jsx";
import WorkoutScreen from "./components/WorkoutScreen.jsx";
import HistoryScreen from "./components/HistoryScreen.jsx";
import SettingsScreen from "./components/SettingsScreen.jsx";
import CompletionModal from "./components/CompletionModal.jsx";

export default function App() {
  const { state, dispatch, startWorkout, logSet, quickLogSet, finishWorkout } = useWorkout();

  if (state.screen === "loading") {
    return (
      <div style={{ minHeight: "100vh", background: "#0B1120", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", color: "#fff" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{"\u{1F3CB}\u{FE0F}"}</div>
          <div style={{ fontSize: 16, fontWeight: 600, opacity: 0.5 }}>Loading...</div>
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
      {state.screen === "workout" && <WorkoutScreen state={state} dispatch={dispatch} logSet={logSet} quickLogSet={quickLogSet} />}
      {state.screen === "history" && <HistoryScreen history={state.workoutHistory} dispatch={dispatch} />}
      {state.screen === "settings" && <SettingsScreen profile={state.profile} dispatch={dispatch} />}

      {state.completionModal && state.activeWorkout && (
        <CompletionModal
          workout={state.activeWorkout}
          onComplete={finishWorkout}
          onClose={() => dispatch({ type: "HIDE_COMPLETION" })}
          dayColor={getDayConfig(state.activeWorkout.dayKey).color}
        />
      )}
    </>
  );
}
