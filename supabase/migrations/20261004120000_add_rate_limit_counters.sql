-- Phase 4: per-student daily request counters backing the ai-proxy Edge
-- Function's rate limiting (see supabase/functions/ai-proxy/index.ts).
--
-- Note: this is the first migration tracked as a file in this repository.
-- Phase 2's schema (students/subjects/topics/questions/practice_attempts/
-- mastery_records) was applied directly against the project and was never
-- committed as a migration file — a gap flagged in the Phase 4 report. This
-- migration and the one that follows it (tighten RLS) do not depend on
-- having that earlier history file-tracked; they only need those tables to
-- already exist in the target database, which they do.

create table if not exists public.rate_limit_counters (
  student_id uuid not null,
  endpoint text not null check (endpoint in ('tutor', 'grade')),
  window_date date not null,
  request_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (student_id, endpoint, window_date)
);

alter table public.rate_limit_counters enable row level security;
-- No policies defined on purpose: default-deny for every role except
-- service_role. The ai-proxy Edge Function is the only thing that ever
-- reads or writes this table, via its service-role key (which bypasses RLS
-- entirely by Supabase design) — the anon/publishable key the browser uses
-- must never be able to read or tamper with another student's counters.

-- Atomically increments and returns the new count for one
-- (student, endpoint, day) window. A single upsert-with-increment avoids a
-- separate read-then-write race between concurrent requests from the same
-- student hitting the function at the same time.
create or replace function public.increment_rate_limit(
  p_student_id uuid,
  p_endpoint text,
  p_window_date date
) returns integer
language sql
security definer
set search_path = public
as $$
  insert into public.rate_limit_counters (student_id, endpoint, window_date, request_count, updated_at)
  values (p_student_id, p_endpoint, p_window_date, 1, now())
  on conflict (student_id, endpoint, window_date)
  do update set request_count = rate_limit_counters.request_count + 1, updated_at = now()
  returning request_count;
$$;

-- Only the service role (i.e. only the Edge Function) may ever call this.
revoke all on function public.increment_rate_limit(uuid, text, date) from public, anon, authenticated;
grant execute on function public.increment_rate_limit(uuid, text, date) to service_role;
