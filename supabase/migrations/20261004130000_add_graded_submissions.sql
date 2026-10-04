-- Phase 5: persist live AI grading results so the assignment report page and
-- its PDF can read the grade a student actually received, instead of only the
-- static mock assignments in src/lib/mockData.ts.
--
-- Access follows the Phase 4 pattern (see 20261004120100_tighten_rls_policies.sql):
-- every policy resolves the student through public.current_demo_student_id().
-- No update or delete policy is granted: a graded submission is an append-only
-- record. A resubmission creates a new row, and the report shows the newest one.

create table if not exists public.graded_submissions (
  id uuid primary key,
  student_id uuid not null,
  assignment_id text not null,
  submission_method text not null check (submission_method in ('type', 'photo')),
  submitted_text text not null,
  total_score integer not null check (total_score >= 0),
  max_score integer not null check (max_score > 0),
  criteria jsonb not null,
  strengths jsonb not null default '[]'::jsonb,
  improvements jsonb not null default '[]'::jsonb,
  graded_at timestamptz not null default now()
);

create index if not exists graded_submissions_student_assignment_idx
  on public.graded_submissions (student_id, assignment_id, graded_at desc);

alter table public.graded_submissions enable row level security;

create policy "graded_submissions_select_self" on public.graded_submissions
  for select using (student_id = public.current_demo_student_id());

create policy "graded_submissions_insert_self" on public.graded_submissions
  for insert with check (student_id = public.current_demo_student_id());
