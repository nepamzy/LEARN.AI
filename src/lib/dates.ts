// Impure Date access lives here, outside any component body, so these can be
// called from useMemo/useEffect without tripping the react/purity lint rule
// (which flags `Date`/`Date.now` calls lexically inside component functions).

export function getStartOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export function todayISODate(): string {
  return new Date().toISOString().slice(0, 10);
}

export function nowMs(): number {
  return Date.now();
}
