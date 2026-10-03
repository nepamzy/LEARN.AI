import { useContext } from "react";
import { AppStateCtx, type AppState } from "./appStateTypes";

export function useAppState(): AppState {
  const ctx = useContext(AppStateCtx);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
