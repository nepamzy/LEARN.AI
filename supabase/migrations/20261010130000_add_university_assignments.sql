-- Phase 7c §1b: persists a generated university assignment's own content
-- (title/objective/instructions/rubric), so it survives a reload the same
-- way a secondary assignment already does — a secondary assignment has a
-- fixed id in src/lib/mockData.ts to reload against; a generated university
-- assignment has no such fixed content anywhere, so it needs a real row.
--
-- Grading itself does NOT get a new table: once a generated assignment has
-- a real id (this table's primary key), its grade is persisted through the
-- EXISTING graded_submissions table/RLS (20261004130000_add_graded_submissions.sql)
-- with assignment_id set to that id — graded_submissions.assignment_id is
-- already a plain `text` column with no foreign key, so it needs no change
-- to hold a university assignment's id instead of a secondary mock id.
--
-- Access follows the same Phase 4 pattern as every other student-owned
-- table: every policy resolves the student through
-- public.current_demo_student_id(). Append-only, same as graded_submissions:
-- requesting another assignment creates a new row rather than overwriting
-- the last one, so a student's past generated assignments stay available.

create table if not exists public.university_assignments (
  id uuid primary key,
  student_id uuid not null,
  course_name text not null,
  title text not null,
  objective text not null,
  instructions text not null,
  rubric jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists university_assignments_student_course_idx
  on public.university_assignments (student_id, course_name, created_at desc);

alter table public.university_assignments enable row level security;

create policy "university_assignments_select_self" on public.university_assignments
  for select using (student_id = public.current_demo_student_id());

create policy "university_assignments_insert_self" on public.university_assignments
  for insert with check (student_id = public.current_demo_student_id());
-- No update/delete policy, same reasoning as graded_submissions: nothing in
-- the app ever edits or removes a generated assignment once created.
