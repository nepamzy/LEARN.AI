import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { SyncState } from "../lib/types";
import { loadLocal, saveLocal } from "../lib/storage";
import { amara } from "../lib/mockData";
import { queueLength, flushQueue } from "../lib/api/offlineQueue";
import { resubmitQueuedAttempt } from "../lib/api/liveData";
import { AppStateCtx, type AppState, type Preferences } from "./appStateTypes";

const defaultPrefs: Preferences = {
  language: amara.language,
  fontSize: amara.fontSize,
  reducedMotion: amara.reducedMotion,
  lowDataMode: amara.lowDataMode,
  notificationsEnabled: null,
  educationLevel: null,
};

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefsState] = useState<Preferences>(() => loadLocal("prefs", defaultPrefs));
  const [simulateOffline, setSimulateOfflineState] = useState(false);
  const [browserOnline, setBrowserOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);
  const [onboardingComplete, setOnboardingCompleteState] = useState<boolean>(() => loadLocal("onboardingComplete", false));
  const [pendingCount, setPendingCount] = useState(() => queueLength());
  const [isSyncing, setIsSyncing] = useState(false);
  const flushing = useRef(false);

  // Flush any queued offline attempts, triggered directly by whatever event
  // just brought us back online (never reactively from a derived effect).
  const attemptFlush = useCallback(() => {
    if (flushing.current || queueLength() === 0) return;
    flushing.current = true;
    setIsSyncing(true);
    flushQueue(resubmitQueuedAttempt)
      .then(({ remaining }) => setPendingCount(remaining))
      .finally(() => {
        flushing.current = false;
        setIsSyncing(false);
      });
  }, []);

  useEffect(() => {
    const on = () => {
      setBrowserOnline(true);
      attemptFlush();
    };
    const off = () => setBrowserOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    if (navigator.onLine) attemptFlush(); // pick up anything queued from a previous session
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const setSimulateOffline = (v: boolean) => {
    setSimulateOfflineState(v);
    if (!v) attemptFlush(); // leaving simulated-offline mode is also "back online"
  };

  const isOnline = browserOnline && !simulateOffline;
  const refreshPendingCount = useCallback(() => setPendingCount(queueLength()), []);

  const sync: SyncState = {
    status: !isOnline ? "offline" : isSyncing ? "syncing" : "online",
    pendingChanges: pendingCount,
  };

  const value: AppState = {
    prefs,
    setPrefs,
    sync,
    simulateOffline,
    setSimulateOffline,
    onboardingComplete,
    setOnboardingComplete,
    studentName: amara.name,
    refreshPendingCount,
  };

  return <AppStateCtx.Provider value={value}>{children}</AppStateCtx.Provider>;
}
