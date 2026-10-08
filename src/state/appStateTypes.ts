import { createContext } from "react";
import type { EducationLevel, FontSize, Language, SyncState, UniversityProfile } from "../lib/types";

export interface Preferences {
  language: Language;
  fontSize: FontSize;
  reducedMotion: boolean;
  lowDataMode: boolean;
  notificationsEnabled: boolean | null; // null = not yet decided
  // null = no onboarding override yet — effectiveEducationLevel() (lib/educationLevel.ts)
  // falls back to the demo student's own level, so every existing surface is unaffected
  // until a real onboarding run sets this.
  educationLevel: EducationLevel | null;
  // Phase 7b: set once at onboarding for a University-level account, same
  // pattern and same justification as educationLevel — Student has never
  // lived in a queried Supabase table, so there's nothing to migrate.
  // Undefined for every non-university account.
  universityProfile?: UniversityProfile;
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
  /** Call after queuing an attempt offline so the sync indicator updates immediately. */
  refreshPendingCount: () => void;
}

export const AppStateCtx = createContext<AppState | null>(null);
