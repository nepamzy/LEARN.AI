import { createContext } from "react";
import type { FontSize, Language, SyncState } from "../lib/types";

export interface Preferences {
  language: Language;
  fontSize: FontSize;
  reducedMotion: boolean;
  lowDataMode: boolean;
  notificationsEnabled: boolean | null; // null = not yet decided
}

export interface AppState {
  prefs: Preferences;
  setPrefs: (patch: Partial<Preferences>) => void;
  sync: SyncState;
  simulateOffline: boolean;
  setSimulateOffline: (v: boolean) => void;
  onboardingComplete: boolean;
  setOnboardingComplete: (v: boolean) => void;
  studentName: string;
}

export const AppStateCtx = createContext<AppState | null>(null);
