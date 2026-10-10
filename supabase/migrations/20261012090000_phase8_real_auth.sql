-- Phase 8 §1a: real Supabase Auth, replacing the single seeded demo student
-- with actual multi-user accounts.
--
-- Phase 4's comment on current_demo_student_id() said: "When real auth is
-- added later, this function's body is the ONLY thing that needs to
-- change (e.g. to `select auth.uid()`) — every policy below already reads
-- through it, so none of them need to be touched again." Confirmed true:
-- this migration changes ONLY this function's body. No per-table policy
-- (students/practice_attempts/mastery_records/graded_submissions/
-- university_assignments) is touched.
--
-- The one nuance the original comment didn't anticipate: a bare
-- `select auth.uid()` would return null for every unauthenticated
-- anon-key request, which would break the existing "demo account" path
-- (Amara) stone dead — the whole app, and every test written against it
-- since Phase 2, calls Supabase with the anon/publishable key and NO
-- session at all, trusting this function to resolve to the fixed demo id.
-- `coalesce(auth.uid(), <demo id>)` keeps that path alive exactly as
-- before while correctly resolving to the REAL signed-in user's id once a
-- session exists (supabase-js attaches the session's access token as a
-- Bearer header automatically once signed in, which is what makes
-- auth.uid() resolve inside Postgres's RLS evaluation).
create or replace function public.current_demo_student_id() returns uuid
language sql
stable
as $$
  select coalesce(auth.uid(), '00000000-0000-4000-8000-000000000001'::uuid);
$$;

comment on function public.current_demo_student_id() is
  'Resolves "which student is this request as" for every RLS policy in this project. Returns the real signed-in user''s auth.uid() when a session exists, or the fixed demo-student id for an unauthenticated (anon-key, no session) request — i.e. the "continue with the demo account" path. Kept under its original Phase 4 name so no policy needed rewriting.';

-- ---- students: real per-account columns ------------------------------------
-- Phase 2's students table was applied directly against the project and
-- never captured in a migration file (flagged as a gap since Phase 4), so
-- these are additive `add column if not exists` statements, safe to run
-- against whatever the table's existing shape actually is.

-- Phase 8 §1a: account-scoped onboarding/preferences data, replacing the
-- "Preferences has never lived in a queried Supabase table" gap noted in
-- src/state/appStateTypes.ts since Phase 7b. Mirrors the client's
-- Preferences shape loosely as JSON rather than a rigid column-per-field
-- schema, since this is UI preference data, not data the engine queries by
-- field (the engine's own tables — mastery_records etc. — stay columnar).
alter table public.students add column if not exists preferences jsonb not null default '{}'::jsonb;

-- Phase 8 §1b: a real "paid until" field driving feature gates. A single
-- nullable timestamp (not a separate subscriptions table) is enough for one
-- plan with no tiers — see the Phase 8 report for why a richer billing
-- schema (multiple plans, invoices, proration) is explicitly out of scope.
alter table public.students add column if not exists paid_until timestamptz;

-- Phase 8 §1c: a student's own WhatsApp number, so an inbound WhatsApp
-- message can be mapped back to their account. Self-asserted via Profile,
-- NOT verified by an OTP/SMS challenge — see the Phase 8 report's honest
-- statement of exactly what this does and doesn't prove about ownership.
alter table public.students add column if not exists whatsapp_phone text;
create unique index if not exists students_whatsapp_phone_key on public.students (whatsapp_phone) where whatsapp_phone is not null;

alter table public.students add column if not exists name text;
alter table public.students add column if not exists created_at timestamptz not null default now();

-- ---- new-account provisioning: a real students row on signup --------------
-- Standard Supabase pattern: a trigger on auth.users (owned by the
-- supabase_auth_admin role, not public) creates the matching public.students
-- row the moment a real account is created, so onboarding always has a real
-- row to write into rather than relying on one being pre-seeded.
create or replace function public.handle_new_auth_user() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.students (id, name, preferences)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)), '{}'::jsonb)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

-- Allow a signed-in user to insert their OWN students row too (defensive:
-- normally the trigger above already created it, but a user who signed up
-- before this migration existed, or whose trigger run failed, should not be
-- permanently stuck with no row). Mirrors the existing self-only policies.
drop policy if exists "students_insert_self" on public.students;
create policy "students_insert_self" on public.students
  for insert with check (id = public.current_demo_student_id());
