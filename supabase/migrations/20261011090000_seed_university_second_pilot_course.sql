-- Phase 7d §1c: seeds real structured content for a SECOND university
-- course, generalising Phase 7c's single-pilot proof (that the existing
-- BKT/FSRS engine and mastery_records table extend to university courses)
-- to a second faculty entirely. Every other seeded or custom university
-- course still deliberately has none; see src/lib/studentId.ts's
-- LIVE_SUBJECT_IDS and the Phase 7c/7d reports.
--
-- Course chosen: "Calculus I" (MTH 101, Faculty of Sciences — see
-- src/lib/universityCourses.ts's "mth-calculus1" entry). Reasoning for this
-- one, mirroring Phase 7c's reasoning for picking Computing first: Calculus
-- I's topics (limits, derivatives, their applications, basic integration,
-- sequences/series) have objectively correct, MCQ-testable answers, unlike
-- an essay-graded subject the existing engine was never built for. Sciences
-- was chosen over Social and Management Sciences for the same reason.
--
-- Column names and `on conflict do nothing` idempotency follow the exact
-- pattern of supabase/migrations/20261010120000_seed_university_pilot_course.sql
-- — see that file's header comment for the caveat about `subjects`/`topics`
-- columns being inferred rather than captured from an applied migration.
--
-- Every insert is `on conflict do nothing` so re-running this migration (or
-- running it after a manual seed attempt) is always safe.

insert into public.subjects (id, name, color) values
  ('uni-mth-calc1', 'Calculus I', 'sage')
on conflict (id) do nothing;

insert into public.topics (id, subject_id, name, parent_topic_id) values
  ('uni-mth-calc1-limits', 'uni-mth-calc1', 'Limits and Continuity', null),
  ('uni-mth-calc1-derivatives', 'uni-mth-calc1', 'Derivatives and Differentiation Rules', null),
  ('uni-mth-calc1-applications', 'uni-mth-calc1', 'Applications of Derivatives', null),
  ('uni-mth-calc1-integration', 'uni-mth-calc1', 'Introduction to Integration', null),
  ('uni-mth-calc1-sequences', 'uni-mth-calc1', 'Sequences and Series', null)
on conflict (id) do nothing;

insert into public.questions
  (id, subject_id, topic_id, type, prompt, options, correct_option_id, difficulty, explanation, why_wrong_by_option, worked_example)
values
  (
    'uq-limits-1', 'uni-mth-calc1', 'uni-mth-calc1-limits', 'mcq',
    'What is lim(x→0) sin(x)/x?',
    '[{"id":"a","label":"0"},{"id":"b","label":"1"},{"id":"c","label":"Undefined"},{"id":"d","label":"Infinity"}]'::jsonb,
    'b', 3,
    'This is a standard limit provable via the squeeze theorem: sin(x)/x approaches 1 as x approaches 0, even though the function itself is undefined at x = 0.',
    '{"a":"A common mix-up with sin(0) = 0 itself, not the limit of the ratio sin(x)/x.","c":"Though it is a 0/0 indeterminate form, the limit genuinely exists and can be computed — it does not stay undefined.","d":"The function is bounded near 0 (between -1 and 1 for the numerator alone), so it cannot grow without bound."}'::jsonb,
    null
  ),
  (
    'uq-limits-2', 'uni-mth-calc1', 'uni-mth-calc1-limits', 'mcq',
    'For a function f(x) to be continuous at x = a, which condition must hold?',
    '[{"id":"a","label":"f(a) must simply exist"},{"id":"b","label":"lim(x→a) f(x) must exist"},{"id":"c","label":"lim(x→a) f(x) must exist AND equal f(a)"},{"id":"d","label":"f(x) must be differentiable at a"}]'::jsonb,
    'c', 2,
    'Continuity needs three things together: f(a) is defined, the limit as x approaches a exists, and that limit equals f(a) — a gap in any one of these breaks continuity.',
    '{"a":"f(a) existing alone says nothing about whether the function approaches that same value from either side.","b":"The limit existing alone is not enough — it must also match the actual function value at a.","d":"Differentiability is a STRONGER condition than continuity (every differentiable function is continuous, but not every continuous function is differentiable), not a requirement for it."}'::jsonb,
    null
  ),
  (
    'uq-limits-3', 'uni-mth-calc1', 'uni-mth-calc1-limits', 'mcq',
    'What is lim(x→2) (x^2 - 4)/(x - 2)?',
    '[{"id":"a","label":"0"},{"id":"b","label":"2"},{"id":"c","label":"4"},{"id":"d","label":"The limit does not exist"}]'::jsonb,
    'c', 3,
    'Factoring the numerator gives (x-2)(x+2)/(x-2), which simplifies to x+2 for x ≠ 2. Taking the limit of x+2 as x→2 gives 4.',
    '{"a":"Plugging x = 2 directly into the UNSIMPLIFIED expression gives 0/0, an indeterminate form — not the actual limit value.","b":"This confuses the point being approached (x=2) with the limit''s value.","d":"The limit DOES exist once the removable 0/0 discontinuity is simplified away algebraically."}'::jsonb,
    null
  ),
  (
    'uq-limits-4', 'uni-mth-calc1', 'uni-mth-calc1-limits', 'mcq',
    'A function has a jump discontinuity at x = a. What does this mean?',
    '[{"id":"a","label":"The function is undefined at x = a"},{"id":"b","label":"The left-hand and right-hand limits at a exist but are not equal"},{"id":"c","label":"The function approaches infinity near a"},{"id":"d","label":"The function has a sharp corner at a"}]'::jsonb,
    'b', 2,
    'A jump discontinuity happens when approaching from the left gives one finite value and approaching from the right gives a different finite value, so no single two-sided limit exists.',
    '{"a":"Being undefined at a point describes a different kind of discontinuity (a removable or infinite one), not specifically a jump.","c":"A function approaching infinity describes an infinite (vertical asymptote) discontinuity, not a jump.","d":"A sharp corner is about differentiability (a kink in the graph), not about the limits failing to match — a function can have a corner and still be continuous there."}'::jsonb,
    null
  ),
  (
    'uq-derivatives-1', 'uni-mth-calc1', 'uni-mth-calc1-derivatives', 'mcq',
    'What is the derivative of f(x) = x^3?',
    '[{"id":"a","label":"x^2"},{"id":"b","label":"3x^2"},{"id":"c","label":"3x^3"},{"id":"d","label":"x^2 / 3"}]'::jsonb,
    'b', 1,
    'By the power rule, the derivative of x^n is n·x^(n-1). Here n=3, so the derivative is 3·x^2.',
    '{"a":"This drops the coefficient 3 that the power rule produces from bringing the exponent down.","c":"This keeps the original exponent 3 instead of reducing it by one.","d":"This divides by 3 instead of multiplying by it — the power rule multiplies by the original exponent."}'::jsonb,
    null
  ),
  (
    'uq-derivatives-2', 'uni-mth-calc1', 'uni-mth-calc1-derivatives', 'mcq',
    'What is the derivative of f(x) = sin(x)?',
    '[{"id":"a","label":"cos(x)"},{"id":"b","label":"-cos(x)"},{"id":"c","label":"-sin(x)"},{"id":"d","label":"sin(x)"}]'::jsonb,
    'a', 2,
    'This is one of the standard trigonometric derivatives: d/dx[sin(x)] = cos(x).',
    '{"b":"This is the derivative of cos(x), not sin(x) — the sign is also flipped from the correct answer.","c":"This is the SECOND derivative of sin(x) (the derivative of cos(x)), not its first derivative.","d":"The derivative of sin(x) is not itself — that property would describe e^x under exponentiation, not sin(x)."}'::jsonb,
    null
  ),
  (
    'uq-derivatives-3', 'uni-mth-calc1', 'uni-mth-calc1-derivatives', 'mcq',
    'Using the product rule, what is the derivative of f(x) = x^2 · sin(x)?',
    '[{"id":"a","label":"2x · cos(x)"},{"id":"b","label":"2x · sin(x) + x^2 · cos(x)"},{"id":"c","label":"2x · sin(x) - x^2 · cos(x)"},{"id":"d","label":"x^2 · cos(x)"}]'::jsonb,
    'b', 3,
    'The product rule states (uv)'' = u''v + uv''. With u=x^2 (u''=2x) and v=sin(x) (v''=cos(x)), this gives 2x·sin(x) + x^2·cos(x).',
    '{"a":"This only differentiates the x^2 factor and drops the sin(x) factor entirely, ignoring the product rule''s second term.","c":"The product rule ADDS the two terms, it does not subtract them.","d":"This only differentiates the sin(x) factor and drops the first required term from the product rule."}'::jsonb,
    null
  ),
  (
    'uq-derivatives-4', 'uni-mth-calc1', 'uni-mth-calc1-derivatives', 'mcq',
    'Using the chain rule, what is the derivative of f(x) = (3x + 1)^2?',
    '[{"id":"a","label":"2(3x + 1)"},{"id":"b","label":"6(3x + 1)"},{"id":"c","label":"2(3x + 1) · 3x"},{"id":"d","label":"9x + 3"}]'::jsonb,
    'b', 3,
    'The chain rule gives d/dx[g(x)^2] = 2·g(x)·g''(x). Here g(x)=3x+1 and g''(x)=3, so the result is 2(3x+1)·3 = 6(3x+1).',
    '{"a":"This applies the power rule''s outer step (bringing the 2 down) but forgets to multiply by the inner derivative g''(x)=3, which the chain rule requires.","c":"This multiplies by 3x instead of the correct inner derivative, which is just the constant 3.","d":"This happens to be the expanded, correct final answer in disguise only if simplified — but as written it is not how the chain rule result is normally expressed, and most students reaching this form made an arithmetic rather than conceptual step; 6(3x+1) is the expected chain-rule form."}'::jsonb,
    null
  ),
  (
    'uq-applications-1', 'uni-mth-calc1', 'uni-mth-calc1-applications', 'mcq',
    'At a local maximum or minimum of a differentiable function, what is true of its derivative?',
    '[{"id":"a","label":"It is always positive"},{"id":"b","label":"It is always negative"},{"id":"c","label":"It equals zero"},{"id":"d","label":"It is undefined"}]'::jsonb,
    'c', 2,
    'At a smooth local max or min, the tangent line is horizontal — the instantaneous rate of change is zero, so f''(x) = 0 there.',
    '{"a":"A positive derivative means the function is increasing, not sitting at a peak or valley.","b":"A negative derivative means the function is decreasing, not sitting at a peak or valley.","d":"An undefined derivative would describe a sharp corner or cusp, which is a different (non-smooth) kind of extreme point, not the general rule for differentiable functions."}'::jsonb,
    null
  ),
  (
    'uq-applications-2', 'uni-mth-calc1', 'uni-mth-calc1-applications', 'mcq',
    'If f''(x) > 0 on an interval, what does this tell you about f(x) on that interval?',
    '[{"id":"a","label":"f(x) is increasing"},{"id":"b","label":"f(x) is decreasing"},{"id":"c","label":"f(x) is concave up"},{"id":"d","label":"f(x) has a maximum there"}]'::jsonb,
    'a', 2,
    'The first derivative measures the rate of change of f. A positive rate of change means f is increasing as x increases.',
    '{"b":"A decreasing function would have a NEGATIVE first derivative, not a positive one.","c":"Concavity is determined by the SECOND derivative (f''''), not the first.","d":"A maximum requires the derivative to be zero (and changing sign), not simply positive throughout the interval."}'::jsonb,
    null
  ),
  (
    'uq-applications-3', 'uni-mth-calc1', 'uni-mth-calc1-applications', 'mcq',
    'What does the second derivative test use to classify a critical point as a local max or min?',
    '[{"id":"a","label":"The sign of f(x) at that point"},{"id":"b","label":"The sign of f''''(x) at that point"},{"id":"c","label":"Whether f(x) is zero at that point"},{"id":"d","label":"The value of x at that point"}]'::jsonb,
    'b', 3,
    'If f''''(x) > 0 at a critical point, the function is concave up there (a local min); if f''''(x) < 0, it is concave down (a local max).',
    '{"a":"The function''s own VALUE at the point says nothing about its shape there, only its height.","c":"Whether f(x)=0 is irrelevant to classifying the critical point — that is about roots, not extrema.","d":"The specific numeric value of x is not what the test examines — it examines the concavity, via the sign of the second derivative."}'::jsonb,
    null
  ),
  (
    'uq-applications-4', 'uni-mth-calc1', 'uni-mth-calc1-applications', 'mcq',
    'A rectangle''s perimeter is fixed. Which calculus technique finds the dimensions that maximise its area?',
    '[{"id":"a","label":"Integration"},{"id":"b","label":"Related rates"},{"id":"c","label":"Optimisation using derivatives"},{"id":"d","label":"The limit definition of a derivative"}]'::jsonb,
    'c', 2,
    'This is a classic optimisation problem: express area as a function of one variable (using the perimeter constraint), then find where its derivative is zero to locate the maximum.',
    '{"a":"Integration computes accumulated quantities (like area under a curve), not optimal dimensions subject to a constraint.","b":"Related rates problems involve quantities changing over TIME with linked rates, not a static maximisation problem.","d":"The limit definition is how a derivative is DERIVED from first principles, not a technique for solving an optimisation problem."}'::jsonb,
    null
  ),
  (
    'uq-integration-1', 'uni-mth-calc1', 'uni-mth-calc1-integration', 'mcq',
    'What is the indefinite integral of f(x) = x^2?',
    '[{"id":"a","label":"x^3 + C"},{"id":"b","label":"x^3 / 3 + C"},{"id":"c","label":"2x + C"},{"id":"d","label":"x^3 / 2 + C"}]'::jsonb,
    'b', 2,
    'The power rule for integration raises the exponent by one and divides by the new exponent: ∫x^n dx = x^(n+1)/(n+1) + C. Here n=2, giving x^3/3 + C.',
    '{"a":"This raises the exponent correctly but forgets to divide by the new exponent (3).","c":"This is the DERIVATIVE of x^2, not its integral — differentiation and integration are inverse operations, so this answer goes the wrong direction.","d":"This divides by 2 (the original exponent) instead of 3 (the new, raised exponent)."}'::jsonb,
    null
  ),
  (
    'uq-integration-2', 'uni-mth-calc1', 'uni-mth-calc1-integration', 'mcq',
    'What does the "+ C" in an indefinite integral represent?',
    '[{"id":"a","label":"A fixed numeric error to correct for"},{"id":"b","label":"An arbitrary constant, since any constant''s derivative is zero"},{"id":"c","label":"The value of the function at x = 0"},{"id":"d","label":"The area under the curve"}]'::jsonb,
    'b', 1,
    'Differentiation erases any constant term (its derivative is always 0), so when reversing the process via integration, infinitely many antiderivatives differing only by a constant are all equally valid — "+C" captures that whole family.',
    '{"a":"It is not correcting an error — it is a genuine mathematical necessity because constants vanish under differentiation.","c":"C is not automatically the function''s value at x=0; it is only determined once an additional condition (like a known point) is given.","d":"The area under the curve is what a DEFINITE integral computes (between two bounds), not what the arbitrary constant in an indefinite integral represents."}'::jsonb,
    null
  ),
  (
    'uq-integration-3', 'uni-mth-calc1', 'uni-mth-calc1-integration', 'mcq',
    'What is ∫(3x^2 + 2x) dx?',
    '[{"id":"a","label":"x^3 + x^2 + C"},{"id":"b","label":"6x + 2 + C"},{"id":"c","label":"x^3 + 2x + C"},{"id":"d","label":"3x^3 + 2x^2 + C"}]'::jsonb,
    'a', 3,
    'Integrating term by term: ∫3x^2 dx = x^3 and ∫2x dx = x^2, so the sum is x^3 + x^2 + C.',
    '{"b":"This differentiates the original expression instead of integrating it.","c":"This correctly integrates the first term but mishandles the second term, which should become x^2, not 2x.","d":"This multiplies each term''s coefficient into the raised-power result instead of dividing by the new exponent as the power rule for integration requires."}'::jsonb,
    null
  ),
  (
    'uq-integration-4', 'uni-mth-calc1', 'uni-mth-calc1-integration', 'mcq',
    'What does the Fundamental Theorem of Calculus connect?',
    '[{"id":"a","label":"Limits and continuity"},{"id":"b","label":"Differentiation and integration"},{"id":"c","label":"Sequences and series"},{"id":"d","label":"Vectors and scalars"}]'::jsonb,
    'b', 3,
    'The Fundamental Theorem of Calculus establishes that differentiation and integration are inverse operations — integrating a function''s derivative recovers the function (up to a constant), and the derivative of an integral gives back the original function.',
    '{"a":"Limits and continuity are foundational prerequisite concepts, but they are not what this specific theorem links.","c":"Sequences and series are a separate topic in calculus (covered in this course''s own later topic), unrelated to this theorem''s subject.","d":"Vectors and scalars belong to a different branch (vector calculus/linear algebra), not what this theorem addresses."}'::jsonb,
    null
  ),
  (
    'uq-sequences-1', 'uni-mth-calc1', 'uni-mth-calc1-sequences', 'mcq',
    'What does it mean for a sequence to "converge"?',
    '[{"id":"a","label":"Its terms approach a single finite limit as n→∞"},{"id":"b","label":"Its terms grow without bound"},{"id":"c","label":"Its terms alternate between positive and negative"},{"id":"d","label":"It has infinitely many terms"}]'::jsonb,
    'a', 2,
    'A convergent sequence settles down: as n gets larger, the terms get arbitrarily close to one specific finite value, called the limit of the sequence.',
    '{"b":"Terms growing without bound describes a DIVERGENT sequence, the opposite of convergence.","c":"Alternating sign is just one possible behaviour (seen in some convergent AND some divergent sequences) — it does not by itself define convergence.","d":"Every sequence by definition has infinitely many terms (indexed by n=1,2,3,...); that alone says nothing about whether it converges."}'::jsonb,
    null
  ),
  (
    'uq-sequences-2', 'uni-mth-calc1', 'uni-mth-calc1-sequences', 'mcq',
    'What is the sum of the infinite geometric series 1 + 1/2 + 1/4 + 1/8 + ...?',
    '[{"id":"a","label":"1"},{"id":"b","label":"2"},{"id":"c","label":"Infinity"},{"id":"d","label":"1.5"}]'::jsonb,
    'b', 3,
    'For a geometric series with first term a=1 and common ratio r=1/2 (where |r|<1), the sum formula a/(1-r) gives 1/(1-0.5) = 1/0.5 = 2.',
    '{"a":"This is just the first term of the series, not the sum of the entire infinite series.","c":"The series does not diverge to infinity because the common ratio 1/2 has absolute value less than 1, which guarantees convergence to a finite sum.","d":"This is a plausible-looking partial sum (after only a few terms) but is not the exact value the infinite sum converges to."}'::jsonb,
    null
  ),
  (
    'uq-sequences-3', 'uni-mth-calc1', 'uni-mth-calc1-sequences', 'mcq',
    'For which values of the common ratio r does an infinite geometric series converge?',
    '[{"id":"a","label":"|r| < 1"},{"id":"b","label":"|r| > 1"},{"id":"c","label":"r = 1 only"},{"id":"d","label":"Any real value of r"}]'::jsonb,
    'a', 2,
    'A geometric series converges exactly when the magnitude of each successive term keeps shrinking, which happens precisely when |r| < 1.',
    '{"b":"When |r| > 1, each term grows larger in magnitude than the last, so the partial sums diverge rather than approach a limit.","c":"At r=1 every term equals the first term, so the series sums to infinity (if the first term is nonzero) — it does not converge.","d":"Not every r works — r values with |r| ≥ 1 make the series diverge, as explained above."}'::jsonb,
    null
  ),
  (
    'uq-sequences-4', 'uni-mth-calc1', 'uni-mth-calc1-sequences', 'mcq',
    'What is a necessary (but not sufficient) condition for the infinite series Σaₙ to converge?',
    '[{"id":"a","label":"aₙ must be positive for all n"},{"id":"b","label":"aₙ must approach 0 as n→∞"},{"id":"c","label":"aₙ must be an integer for all n"},{"id":"d","label":"The series must have finitely many terms"}]'::jsonb,
    'b', 3,
    'If the individual terms do not shrink to zero, the running sum cannot settle down to a finite value — so aₙ→0 is required. (It is not sufficient on its own: the harmonic series 1+1/2+1/3+... has terms approaching 0 but still diverges.)',
    '{"a":"Many convergent series (like alternating series) have terms that switch between positive and negative — positivity is not required.","c":"Series terms are routinely fractions or irrational numbers, not integers, and still converge (e.g. the geometric series above).","d":"A series with finitely many terms is just a finite sum, not what \"infinite series convergence\" refers to at all."}'::jsonb,
    null
  )
on conflict (id) do nothing;
