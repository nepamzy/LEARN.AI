-- Phase 4: replace the Phase-2 blanket `using (true)` RLS policies with
-- per-student scoping, on every table touched by practice attempts,
-- mastery records, and the seeded student record. (There is no Supabase
-- table for assignment data — assignments are still mock data on the
-- client; see the Phase 4 report.)
--
-- There is no real multi-user auth yet: one seeded demo student, no
-- Supabase Auth session, the client uses the shared anon/publishable key
-- for every request, so there is no auth.uid() to check against. Rather
-- than invent a JWT/session scheme to manufacture one, every policy below
-- resolves "which student is this?" through a single function,
-- current_demo_student_id(). Today it just returns the one seeded demo
-- student's id. When real auth is added later, this function's body is the
-- ONLY thing that needs to change (e.g. to `select auth.uid()`) — every
-- policy below already reads through it, so none of them need to be
-- touched again.

create or replace function public.current_demo_student_id() returns uuid
language sql
stable
as $$
  select '00000000-0000-4000-8000-000000000001'::uuid;
$$;

-- Drops every existing policy on a table, whatever it happens to be named
-- (the Phase 2 policies were applied ad hoc and were never captured in a
-- migration file, so this migration cannot assume their exact names).
create or replace function pg_temp.drop_all_policies(p_table regclass) returns void
language plpgsql
as $$
declare
  pol record;
  schema_name text;
  table_name text;
begin
  select n.nspname, c.relname into schema_name, table_name
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where c.oid = p_table;

  for pol in select policyname from pg_policies where schemaname = schema_name and tablename = table_name loop
    execute format('drop policy %I on %I.%I', pol.policyname, schema_name, table_name);
  end loop;
end;
$$;

-- ---- students: one row, readable/updatable only as "yourself" -------------
select pg_temp.drop_all_policies('public.students');

create policy "students_select_self" on public.students
  for select using (id = public.current_demo_student_id());

create policy "students_update_self" on public.students
  for update using (id = public.current_demo_student_id())
  with check (id = public.current_demo_student_id());
-- No insert/delete policy: the client never creates or deletes student rows
-- (that only happens via seeding), so none are granted.

-- ---- practice_attempts: insert-only log, strictly per-student -------------
select pg_temp.drop_all_policies('public.practice_attempts');

create policy "practice_attempts_select_self" on public.practice_attempts
  for select using (student_id = public.current_demo_student_id());

create policy "practice_attempts_insert_self" on public.practice_attempts
  for insert with check (student_id = public.current_demo_student_id());
-- No update/delete policy: src/lib/api/liveData.ts only ever inserts here.

-- ---- mastery_records: one row per (student, topic), read/write as self ---
select pg_temp.drop_all_policies('public.mastery_records');

create policy "mastery_records_select_self" on public.mastery_records
  for select using (student_id = public.current_demo_student_id());

create policy "mastery_records_upsert_self" on public.mastery_records
  for insert with check (student_id = public.current_demo_student_id());

create policy "mastery_records_update_self" on public.mastery_records
  for update using (student_id = public.current_demo_student_id())
  with check (student_id = public.current_demo_student_id());
-- No delete policy: nothing in the app ever deletes a mastery record.

-- ---- subjects / topics / questions: shared curriculum reference data -----
-- These are NOT student-owned rows — every student reads the same question
-- bank — so "require a student_id match" doesn't apply to them the way it
-- does above. They stay publicly readable, but every write policy is
-- dropped: src/lib/api/liveData.ts only ever SELECTs from these three
-- tables, so the client has no legitimate reason to write to them (only
-- the seed process does, using the service role, which bypasses RLS).
select pg_temp.drop_all_policies('public.subjects');
create policy "subjects_select_all" on public.subjects for select using (true);

select pg_temp.drop_all_policies('public.topics');
create policy "topics_select_all" on public.topics for select using (true);

select pg_temp.drop_all_policies('public.questions');
create policy "questions_select_all" on public.questions for select using (true);
