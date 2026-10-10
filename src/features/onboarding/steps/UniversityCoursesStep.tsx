import type { UniversityCourse } from "../../../lib/types";
import { SEED_FACULTIES } from "../../../lib/universityCourses";
import { TextInput } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { CourseEditor } from "../../../components/domain/CourseEditor";

// Replaces Phase 7's UniversityNoticeStep at this point in onboarding: a real
// course-entry flow, not a dead end (§4/§5). A typed course is added exactly
// like a seeded one — same shape, same list, same chip — only
// customAddedByStudent differs, which nothing in this UI treats as lesser.
// Phase 7c §1a: the add/remove control itself now lives in CourseEditor,
// shared with ProfilePage's post-onboarding course management.
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

      <CourseEditor courses={courses} onChange={onChangeCourses} />

      {error && <p className="text-sm text-error font-medium" role="alert">{error}</p>}

      <Button size="lg" fullWidth onClick={onNext}>
        Continue
      </Button>
    </div>
  );
}
