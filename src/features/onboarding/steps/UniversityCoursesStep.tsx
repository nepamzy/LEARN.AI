import { useState } from "react";
import { Plus, X } from "lucide-react";
import type { UniversityCourse } from "../../../lib/types";
import { SEED_COURSES, SEED_FACULTIES } from "../../../lib/universityCourses";
import { TextInput } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";

// Replaces Phase 7's UniversityNoticeStep at this point in onboarding: a real
// course-entry flow, not a dead end (§4/§5). A typed course is added exactly
// like a seeded one — same shape, same list, same chip — only
// customAddedByStudent differs, which nothing in this UI treats as lesser.
interface Props {
  institution: string;
  faculty: string;
  program: string;
  courses: UniversityCourse[];
  onChangeInstitution: (v: string) => void;
  onChangeFaculty: (v: string) => void;
  onChangeProgram: (v: string) => void;
  onChangeCourses: (courses: UniversityCourse[]) => void;
  onNext: () => void;
  error?: string;
}

export function UniversityCoursesStep({
  institution,
  faculty,
  program,
  courses,
  onChangeInstitution,
  onChangeFaculty,
  onChangeProgram,
  onChangeCourses,
  onNext,
  error,
}: Props) {
  const [courseInput, setCourseInput] = useState("");

  const matches = SEED_COURSES.filter(
    (c) =>
      courseInput.trim().length > 0 &&
      !courses.some((added) => added.name.toLowerCase() === c.name.toLowerCase()) &&
      (c.name.toLowerCase().includes(courseInput.toLowerCase()) || c.code.toLowerCase().includes(courseInput.toLowerCase()))
  );

  function addCourse(course: UniversityCourse) {
    if (courses.some((c) => c.name.toLowerCase() === course.name.toLowerCase())) return;
    onChangeCourses([...courses, course]);
    setCourseInput("");
  }

  function addTypedCourse() {
    const name = courseInput.trim();
    if (!name) return;
    addCourse({ id: crypto.randomUUID(), name, customAddedByStudent: true });
  }

  function removeCourse(id: string) {
    onChangeCourses(courses.filter((c) => c.id !== id));
  }

  return (
    <div className="space-y-5">
      <div className="space-y-1">
        <h2 className="text-xl font-bold text-ink">What are you studying?</h2>
        <p className="text-[15px] text-ink-secondary">
          Add at least one course you're currently taking. Pick a suggestion or type any course — Astra can help with it either way.
        </p>
      </div>

      <TextInput
        label="Faculty / program"
        placeholder="e.g. Computer Science"
        value={faculty}
        onChange={(e) => onChangeFaculty(e.target.value)}
        list="faculty-suggestions"
        hint="Optional — helps Astra understand your context."
      />
      <datalist id="faculty-suggestions">
        {SEED_FACULTIES.map((f) => (
          <option key={f} value={f} />
        ))}
      </datalist>

      <TextInput
        label="Institution"
        placeholder="e.g. University of Lagos"
        value={institution}
        onChange={(e) => onChangeInstitution(e.target.value)}
      />
      <TextInput
        label="Programme / degree"
        placeholder="e.g. B.Sc. Computer Science"
        value={program}
        onChange={(e) => onChangeProgram(e.target.value)}
      />

      <div className="space-y-2">
        <label htmlFor="course-search" className="text-sm font-semibold text-ink">
          Your courses
        </label>
        <div className="flex gap-2">
          <input
            id="course-search"
            value={courseInput}
            onChange={(e) => setCourseInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTypedCourse();
              }
            }}
            placeholder="Search a course or type your own"
            className="flex-1 min-h-11 rounded-xl border border-border-strong px-3.5 py-2.5 text-[15px] bg-surface focus:border-sage transition-colors"
          />
          <Button type="button" variant="secondary" onClick={addTypedCourse} disabled={!courseInput.trim()}>
            <Plus className="size-4" aria-hidden="true" /> Add
          </Button>
        </div>

        {matches.length > 0 && (
          <ul className="rounded-xl border border-border divide-y divide-border overflow-hidden">
            {matches.slice(0, 5).map((m) => (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => addCourse({ id: m.id, name: m.name, code: m.code, customAddedByStudent: false })}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-sage-surface transition-colors"
                >
                  <p className="text-[15px] font-medium text-ink">{m.name}</p>
                  <p className="text-xs text-ink-secondary">
                    {m.code} · {m.faculty}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}

        {courses.length > 0 && (
          <ul className="flex flex-wrap gap-2 pt-1" aria-label="Added courses">
            {courses.map((c) => (
              <li
                key={c.id}
                className="inline-flex items-center gap-1.5 text-sm font-medium text-ink bg-sage-surface border border-sage/30 rounded-pill pl-3 pr-1.5 py-1"
              >
                {c.name}
                <button
                  type="button"
                  onClick={() => removeCourse(c.id)}
                  aria-label={`Remove ${c.name}`}
                  className="size-5 rounded-full flex items-center justify-center text-ink-secondary hover:bg-error-surface hover:text-error transition-colors"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {error && <p className="text-sm text-error font-medium" role="alert">{error}</p>}

      <Button size="lg" fullWidth onClick={onNext}>
        Continue
      </Button>
    </div>
  );
}
