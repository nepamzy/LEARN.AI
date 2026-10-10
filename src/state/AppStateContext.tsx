import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { SyncState } from "../lib/types";
import { loadLocal, saveLocal } from "../lib/storage";
import { amara } from "../lib/mockData";
import { queueLength, flushQueue } from "../lib/api/offlineQueue";
import { resubmitQueuedAttempt } from "../lib/api/liveData";
import { fetchAccountPreferences, saveAccountPreferences } from "../lib/api/accountProfile";
import { resolvePrefsOnLogin } from "../lib/accountPrefsSync";
import { fetchPaidUntil } from "../lib/api/billing";
import { isPaid } from "../lib/billing";
import { useAuth } from "./useAuth";
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
  const { status, userId } = useAuth();
  const [prefs, setPrefsState] = useState<Preferences>(() => loadLocal("prefs", defaultPrefs));
  // Phase 8 §1a: runs exactly once per real sign-in (never for the demo
  // account or signed-out state) — reconciles local-only Preferences
  // against the account's own row, per resolvePrefsOnLogin's rule, so local
  // onboarding data is migrated up rather than silently dropped the first
  // time a real account is created, and a returning account's own data
  // always wins over stale local state on a new device.
  const syncedForUserId = useRef<string | null>(null);
  useEffect(() => {
    if (status !== "signed-in" || !userId || syncedForUserId.current === userId) return;
    syncedForUserId.current = userId;
    fetchAccountPreferences(userId)
      .then((remote) => {
        const { next, shouldPushLocal } = resolvePrefsOnLogin(prefs, remote as Partial<Preferences> | null);
        setPrefsState(next);
        if (shouldPushLocal) void saveAccountPreferences(userId, next);
      })
      .catch(() => {
        // Offline or unreachable at login time — keep local prefs as-is;
        // the next successful sign-in retries this reconciliation.
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, userId]);
  // Phase 8 §1b: the one server-set field driving the paid-tier gate (see
  // billing.ts). Only ever fetched for a real signed-in account — the demo
  // account has no real billing and always behaves as free-tier, a
  // deliberate choice stated in the Phase 8 report, not an oversight.
  const [paidUntil, setPaidUntil] = useState<string | null>(null);
  const refreshBilling = useCallback(() => {
    if (status !== "signed-in" || !userId) return;
    fetchPaidUntil(userId)
      .then(setPaidUntil)
      .catch(() => {
        // Unreachable — leave the last-known value; nothing gates on this
        // failing open, since isPaid() defaults false for anything but a
        // real, server-confirmed future paid_until.
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, userId]);
  useEffect(() => {
    if (status === "signed-in" && userId) refreshBilling();
    else setPaidUntil(null);
  }, [status, userId, refreshBilling]);

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
    // Keep the account's own copy current too, once signed in for real —
    // fire-and-forget, same resilience stance as saveLocal: a failed write
    // here never blocks the UI, it just means next login's reconciliation
    // (above) has slightly stale remote data to merge against.
    if (status === "signed-in" && userId) void saveAccountPreferences(userId, prefs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefs, status, userId]);

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
    isPaidAccount: isPaid(paidUntil, new Date()),
    paidUntil,
    refreshBilling,
  };

  return <AppStateCtx.Provider value={value}>{children}</AppStateCtx.Provider>;
}
