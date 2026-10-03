import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { FontSize, Language, SyncState } from "../lib/types";
import { loadLocal, saveLocal } from "../lib/storage";
import { amara } from "../lib/mockData";

interface Preferences {
  language: Language;
  fontSize: FontSize;
  reducedMotion: boolean;
  lowDataMode: boolean;
  notificationsEnabled: boolean | null; // null = not yet decided
}

interface AppState {
  prefs: Preferences;
  setPrefs: (patch: Partial<Preferences>) => void;
  sync: SyncState;
  simulateOffline: boolean;
  setSimulateOffline: (v: boolean) => void;
  onboardingComplete: boolean;
  setOnboardingComplete: (v: boolean) => void;
  studentName: string;
}

const defaultPrefs: Preferences = {
  language: amara.language,
  fontSize: amara.fontSize,
  reducedMotion: amara.reducedMotion,
  lowDataMode: amara.lowDataMode,
  notificationsEnabled: null,
};

const AppStateCtx = createContext<AppState | null>(null);

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefsState] = useState<Preferences>(() => loadLocal("prefs", defaultPrefs));
  const [simulateOffline, setSimulateOffline] = useState(false);
  const [browserOnline, setBrowserOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [onboardingComplete, setOnboardingCompleteState] = useState<boolean>(() => loadLocal("onboardingComplete", false));

  useEffect(() => {
    const on = () => setBrowserOnline(true);
    const off = () => setBrowserOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  useEffect(() => {
    saveLocal("prefs", prefs);
    document.documentElement.setAttribute("data-font-size", prefs.fontSize);
    document.documentElement.setAttribute("data-reduced-motion", String(prefs.reducedMotion));
  }, [prefs]);

  const setPrefs = (patch: Partial<Preferences>) => setPrefsState((p) => ({ ...p, ...patch }));

  const setOnboardingComplete = (v: boolean) => {
    setOnboardingCompleteState(v);
    saveLocal("onboardingComplete", v);
  };

  const isOnline = browserOnline && !simulateOffline;

  const sync: SyncState = useMemo(
    () => ({
      status: isOnline ? "online" : "offline",
      pendingChanges: isOnline ? 0 : 2,
    }),
    [isOnline]
  );

  const value: AppState = {
    prefs,
    setPrefs,
    sync,
    simulateOffline,
    setSimulateOffline,
    onboardingComplete,
    setOnboardingComplete,
    studentName: amara.name,
  };

  return <AppStateCtx.Provider value={value}>{children}</AppStateCtx.Provider>;
}

export function useAppState(): AppState {
  const ctx = useContext(AppStateCtx);
  if (!ctx) throw new Error("useAppState must be used within AppStateProvider");
  return ctx;
}
