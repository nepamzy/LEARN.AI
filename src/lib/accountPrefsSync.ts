import type { Preferences } from "../state/appStateTypes";

// Phase 8 §1a: Preferences (education level, universityProfile, etc.) has
// been purely local-only storage since it was introduced (Phase 7b) — see
// the comment on Preferences.universityProfile in appStateTypes.ts. Once a
// real account exists, that local-only data needs "a real migration path
// onto the authenticated account rather than being silently dropped" (the
// Phase 8 task's own words). Pure decision logic, so it's unit-testable
// without a real Supabase call — see scripts/verify-ai.ts.

/** True when there is nothing meaningful saved yet — the fresh-account case. */
export function isPreferencesEmpty(p: Partial<Preferences> | null | undefined): boolean {
  return !p || p.educationLevel == null;
}

export interface PrefsResolution {
  /** What AppStateContext should actually use as its live prefs after this login. */
  next: Preferences;
  /** Whether local prefs should be pushed up to the account (a first-time migration). */
  shouldPushLocal: boolean;
}

/**
 * Decide what happens to prefs the moment a real session is established.
 * - Account has nothing yet, device has something -> migrate local UP (the
 *   "already did onboarding locally, then created a real account" case).
 * - Account already has real data (a returning user, possibly on a new
 *   device) -> that wins; local is overwritten, never silently kept.
 * - Neither has anything -> nothing to do; onboarding will set it either way.
 */
export function resolvePrefsOnLogin(local: Preferences, remote: Partial<Preferences> | null): PrefsResolution {
  const remoteEmpty = isPreferencesEmpty(remote);
  const localEmpty = isPreferencesEmpty(local);

  if (remoteEmpty && !localEmpty) return { next: local, shouldPushLocal: true };
  if (!remoteEmpty) return { next: { ...local, ...remote } as Preferences, shouldPushLocal: false };
  return { next: local, shouldPushLocal: false };
}
