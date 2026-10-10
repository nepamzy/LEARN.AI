// Browser smoke tests for the AI tutor and assignment grading flows.
// Run the app and the mock proxy first (see package.json scripts), then:
//   APP_URL=http://localhost:5173 node scripts/browser-smoke.mjs            (proxy configured)
//   APP_URL=http://localhost:5174 EXPECT_NOT_CONFIGURED=1 node scripts/browser-smoke.mjs
import { chromium } from "playwright";
import { mkdirSync, writeFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const APP_URL = process.env.APP_URL ?? "http://localhost:5173";
const NOT_CONFIGURED = process.env.EXPECT_NOT_CONFIGURED === "1";
const SHOTS = join(process.env.SCREENSHOT_DIR ?? join(tmpdir(), "astra-shots"));
mkdirSync(SHOTS, { recursive: true });

const results = [];
function record(name, ok, detail = "") {
  results.push({ name, ok, detail });
  console.log(`  ${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`);
}

// In-memory stand-in for the graded_submissions table behind Supabase's REST API.
// Intercepting it means these tests never write to the real database.
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
};

function installGradedSubmissionsFake(context) {
  const store = { rows: [], failWrites: false, failReads: false, writes: 0 };
  context.route("**/rest/v1/graded_submissions**", async (route) => {
    const req = route.request();
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: CORS, body: "" });
    if (req.method() === "POST") {
      if (store.failWrites) {
        return route.fulfill({ status: 500, headers: CORS, contentType: "application/json", body: JSON.stringify({ message: "simulated write failure" }) });
      }
      const body = JSON.parse(req.postData() ?? "[]");
      for (const r of Array.isArray(body) ? body : [body]) {
        if (!store.rows.some((x) => x.id === r.id)) store.rows.push(r);
      }
      store.writes++;
      return route.fulfill({ status: 201, headers: CORS, contentType: "application/json", body: "" });
    }
    if (req.method() === "GET") {
      if (store.failReads) {
        return route.fulfill({ status: 500, headers: CORS, contentType: "application/json", body: JSON.stringify({ message: "simulated read failure" }) });
      }
      const url = new URL(req.url());
      const assignmentId = url.searchParams.get("assignment_id")?.replace(/^eq\./, "");
      const rows = store.rows
        .filter((r) => !assignmentId || r.assignment_id === assignmentId)
        .sort((a, b) => b.graded_at.localeCompare(a.graded_at))
        .slice(0, 1);
      return route.fulfill({ status: 200, headers: CORS, contentType: "application/json", body: JSON.stringify(rows) });
    }
    return route.continue();
  });
  return store;
}

// Phase 7c §1d: a minimal in-memory stand-in for topics/questions/
// mastery_records/practice_attempts, scoped to whatever seed data a test
// passes in. Only used by the one test exercising the pilot university
// course's live practice flow — every mastery NUMBER it produces still
// comes from the real applyAttempt()/BKT/FSRS engine running in the app
// itself; this fake only stands in for the Supabase persistence layer,
// same as installGradedSubmissionsFake already does elsewhere in this file.
function installLiveEngineFake(context, { topics, questions }) {
  const store = { masteryRows: [], attempts: [] };
  context.route("**/rest/v1/topics**", async (route) => {
    const req = route.request();
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: CORS, body: "" });
    const url = new URL(req.url());
    const subjectId = url.searchParams.get("subject_id")?.replace(/^eq\./, "");
    const rows = topics.filter((t) => !subjectId || t.subject_id === subjectId);
    return route.fulfill({ status: 200, headers: CORS, contentType: "application/json", body: JSON.stringify(rows) });
  });
  context.route("**/rest/v1/questions**", async (route) => {
    const req = route.request();
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: CORS, body: "" });
    const url = new URL(req.url());
    const subjectId = url.searchParams.get("subject_id")?.replace(/^eq\./, "");
    const topicId = url.searchParams.get("topic_id")?.replace(/^eq\./, "");
    let rows = questions.filter((q) => (!subjectId || q.subject_id === subjectId) && (!topicId || q.topic_id === topicId));
    if (url.searchParams.get("limit") === "1") rows = rows.slice(0, 1);
    return route.fulfill({ status: 200, headers: CORS, contentType: "application/json", body: JSON.stringify(rows) });
  });
  context.route("**/rest/v1/mastery_records**", async (route) => {
    const req = route.request();
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: CORS, body: "" });
    if (req.method() === "POST") {
      const row = JSON.parse(req.postData() ?? "{}");
      const i = store.masteryRows.findIndex((r) => r.topic_id === row.topic_id);
      if (i >= 0) store.masteryRows[i] = row;
      else store.masteryRows.push(row);
      return route.fulfill({ status: 201, headers: CORS, contentType: "application/json", body: "" });
    }
    const url = new URL(req.url());
    const topicIdEq = url.searchParams.get("topic_id")?.replace(/^eq\./, "");
    const topicIdIn = url.searchParams.get("topic_id")?.match(/^in\.\((.*)\)$/)?.[1]?.split(",");
    let rows = store.masteryRows;
    if (topicIdEq) rows = rows.filter((r) => r.topic_id === topicIdEq);
    else if (topicIdIn) rows = rows.filter((r) => topicIdIn.includes(r.topic_id));
    return route.fulfill({ status: 200, headers: CORS, contentType: "application/json", body: JSON.stringify(rows) });
  });
  context.route("**/rest/v1/practice_attempts**", async (route) => {
    const req = route.request();
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: CORS, body: "" });
    if (req.method() === "POST") {
      store.attempts.push(JSON.parse(req.postData() ?? "{}"));
      return route.fulfill({ status: 201, headers: CORS, contentType: "application/json", body: "" });
    }
    const url = new URL(req.url());
    const topicId = url.searchParams.get("topic_id")?.replace(/^eq\./, "");
    const rows = store.attempts.filter((a) => !topicId || a.topic_id === topicId);
    return route.fulfill({ status: 200, headers: CORS, contentType: "application/json", body: JSON.stringify(rows) });
  });
  return store;
}

// Phase 7c §1b: in-memory stand-in for university_assignments, same pattern
// as installGradedSubmissionsFake, so persistence survives a real page
// reload inside a test without touching the real database.
function installUniversityAssignmentsFake(context) {
  const store = { rows: [] };
  context.route("**/rest/v1/university_assignments**", async (route) => {
    const req = route.request();
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: CORS, body: "" });
    if (req.method() === "POST") {
      const body = JSON.parse(req.postData() ?? "[]");
      for (const r of Array.isArray(body) ? body : [body]) {
        if (!store.rows.some((x) => x.id === r.id)) store.rows.push(r);
      }
      return route.fulfill({ status: 201, headers: CORS, contentType: "application/json", body: "" });
    }
    const url = new URL(req.url());
    const courseName = url.searchParams.get("course_name")?.replace(/^eq\./, "");
    const rows = store.rows
      .filter((r) => !courseName || r.course_name === courseName)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 1);
    return route.fulfill({ status: 200, headers: CORS, contentType: "application/json", body: JSON.stringify(rows) });
  });
  return store;
}

async function newPage(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addInitScript(() => {
    localStorage.setItem("astra:onboardingComplete", "true");
  });
  const store = installGradedSubmissionsFake(context);
  const universityAssignmentsStore = installUniversityAssignmentsFake(context);
  const proxy = { calls: 0 };
  context.route("http://localhost:8787/**", (route) => {
    proxy.calls++;
    return route.continue();
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  return { context, page, errors, store, universityAssignmentsStore, proxy };
}

async function expectText(page, text, timeout = 10000) {
  try {
    await page.getByText(text, { exact: false }).first().waitFor({ state: "visible", timeout });
    return true;
  } catch {
    return false;
  }
}

async function expectChecked(page, roleName, timeout = 3000) {
  try {
    await page.getByRole("radio", { name: roleName, checked: true }).waitFor({ state: "visible", timeout });
    return true;
  } catch {
    return false;
  }
}

// Unlike expectText, this matches an element's accessible NAME (e.g. an
// aria-label like "Remove Fluid Mechanics" on an icon-only button), not its
// visible text content — the two aren't the same thing.
async function expectRole(page, role, name, timeout = 3000) {
  try {
    await page.getByRole(role, { name }).first().waitFor({ state: "visible", timeout });
    return true;
  } catch {
    return false;
  }
}

// Preferences (including universityProfile.courses) are persisted to
// localStorage from a useEffect, not synchronously inside the click handler
// that changes them — so a `page.goto` fired immediately after a course
// add/remove can race ahead of that write and load stale prefs on the next
// page. This waits for the actual persisted value to catch up before the
// test navigates away, rather than guessing a fixed delay.
async function waitForPrefsToReflect(page, substring, shouldContain, timeout = 3000) {
  await page.waitForFunction(
    ([text, contain]) => (localStorage.getItem("astra:prefs") ?? "").includes(text) === contain,
    [substring, shouldContain],
    { timeout }
  );
}

// <option> text inside a closed <select> is present in the DOM but not
// "visible" by Playwright's own definition, so expectText's visibility wait
// would wrongly time out even when the option genuinely exists. This checks
// DOM presence directly instead, for asserting what a Select does/doesn't offer.
async function hasOption(page, text) {
  return (await page.locator(`option:text-is("${text}")`).count()) > 0;
}

// Onboarding-specific context: deliberately does NOT set astra:onboardingComplete,
// so OnboardingFlow actually renders instead of being skipped (Phase 7 tests).
async function newOnboardingPage(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  return { context, page, errors };
}

const DEFAULT_PREFS = { language: "en", fontSize: "default", reducedMotion: false, lowDataMode: false, notificationsEnabled: null };

// Post-onboarding context with a specific education-level override already
// saved, as OnboardingFlow.finish() would leave it (Phase 7 downstream-gating tests).
// Phase 7b: optionally carries a universityProfile too, as finish() would
// leave it for a university student who added courses during onboarding.
async function newPageWithLevel(browser, educationLevel, universityProfile) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const store = installGradedSubmissionsFake(context);
  const universityAssignmentsStore = installUniversityAssignmentsFake(context);
  const proxy = { calls: 0 };
  context.route("http://localhost:8787/**", (route) => {
    proxy.calls++;
    return route.continue();
  });
  // addInitScript re-runs before EVERY document load in this context, not
  // just the first — including a later `page.goto` after a test has edited
  // prefs through the UI (e.g. removing a course on Profile). Seeding
  // unconditionally would silently revert any such edit on the next
  // navigation, so this only seeds once, the first time astra:prefs is unset.
  await context.addInitScript(
    (prefs) => {
      localStorage.setItem("astra:onboardingComplete", "true");
      if (localStorage.getItem("astra:prefs") === null) {
        localStorage.setItem("astra:prefs", JSON.stringify(prefs));
      }
    },
    { ...DEFAULT_PREFS, educationLevel, ...(universityProfile ? { universityProfile } : {}) }
  );
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  return { context, page, errors, store, universityAssignmentsStore, proxy };
}

// Writes a pending grading job straight into the app's localStorage, as an
// interrupted submission would leave it, so recovery can be tested after a reload.
async function seedPendingJob(page, job) {
  await page.goto(`${APP_URL}/tutor`);
  await page.evaluate((j) => localStorage.setItem("astra:pendingGrading", JSON.stringify([j])), job);
}

// Phase 7b: clicks through every onboarding step after "subjects" (date,
// goal, diagnostic invite, accessibility, notifications, consent, complete),
// none of which differ by education level — so a single level-agnostic
// walk-through is enough to prove a university student can actually finish
// onboarding and land on a working dashboard, not just complete the
// course-entry step in isolation.
async function finishRestOfOnboarding(page) {
  await page.getByRole("button", { name: "Continue" }).click(); // date
  await page.getByRole("button", { name: "Continue" }).click(); // goal (default pace already selected)
  await page.getByRole("button", { name: "Skip for now" }).click(); // diagnostic invite
  await page.getByRole("radio", { name: /English/ }).click();
  await page.getByRole("button", { name: "Continue" }).click(); // accessibility
  await page.getByRole("button", { name: "Not now" }).click(); // notifications
  await page.getByRole("radio", { name: "I'm 18 or older" }).click();
  await page.getByRole("button", { name: "Continue" }).click(); // consent
  await page.getByRole("button", { name: "Go to my dashboard" }).click(); // complete
}

const ASG1_RUBRIC = [
  { id: "r1", name: "Content & relevance", maxScore: 10 },
  { id: "r2", name: "Organisation", maxScore: 10 },
  { id: "r3", name: "Grammar & mechanics", maxScore: 10 },
  { id: "r4", name: "Vocabulary & register", maxScore: 10 },
];

function baseJob(overrides) {
  return {
    assignmentId: "asg-1",
    request: {
      assignmentTitle: "Essay: qualitative education",
      objective: "Practice argumentative essay structure.",
      rubric: ASG1_RUBRIC,
      studentText: "A typed answer that was submitted but has not been graded yet.",
    },
    submittedAt: "2026-10-04T12:00:00.000Z",
    submissionMethod: "type",
    recordId: "33333333-3333-4333-8333-333333333333",
    ...overrides,
  };
}

const unfinishedJob = () => baseJob({});
const gradedButUnsavedJob = () =>
  baseJob({
    gradedAt: "2026-10-04T12:01:00.000Z",
    result: {
      criteria: [{ criterionId: "r1", score: 9, feedback: "Seeded recovered feedback.", quotes: [] }],
      totalScore: 9,
      maxScore: 40,
      strengths: [],
      improvements: [],
    },
  });

const browser = await chromium.launch();

if (!NOT_CONFIGURED) {
  console.log("\nTutor round trip (proxy configured)");
  {
    const { context, page, errors } = await newPage(browser);
    await page.goto(`${APP_URL}/tutor`);
    await page.fill("#tutor-input", "Explain simultaneous equations simply");
    await page.getByRole("button", { name: "Send message" }).click();
    record("student message is sent and a reply arrives", await expectText(page, "Mock tutor"));
    record("no failure banner on a successful reply", !(await expectText(page, "couldn't respond", 500)));
    await page.screenshot({ path: join(SHOTS, "tutor-reply.png"), fullPage: true });
    record("no uncaught page errors", errors.length === 0, errors.join(" | "));
    await context.close();
  }

  console.log("\nTutor failure state");
  {
    const { context, page } = await newPage(browser);
    await page.goto(`${APP_URL}/tutor`);
    await page.fill("#tutor-input", "FAIL this one");
    await page.getByRole("button", { name: "Send message" }).click();
    record("failed reply shows a recoverable error with Retry", await expectText(page, "Astra couldn't respond just now."));
    record("Retry control is offered", await expectText(page, "Retry", 2000));
    await page.screenshot({ path: join(SHOTS, "tutor-failure.png"), fullPage: true });
    await context.close();
  }

  console.log("\nTutor offline state");
  {
    const { context, page } = await newPage(browser);
    await page.goto(`${APP_URL}/tutor`);
    await context.setOffline(true);
    await page.evaluate(() => window.dispatchEvent(new Event("offline")));
    record("offline indicator is shown", await expectText(page, "Offline", 3000));
    record("offline banner explains the tutor needs a connection", await expectText(page, "AI Tutor needs an internet connection", 3000));
    record("message input is withheld while offline", (await page.locator("#tutor-input").count()) === 0);
    await page.screenshot({ path: join(SHOTS, "tutor-offline.png"), fullPage: true });
    await context.close();
  }

  console.log("\nAssignment grading success");
  {
    const { context, page, errors, store } = await newPage(browser);
    await page.goto(`${APP_URL}/assignments/asg-1`);
    await page.getByLabel("Your response").fill(
      "Qualitative education builds critical thinking, which national development depends on. For example, graduates who can reason through problems drive better policy."
    );
    await page.getByRole("button", { name: "Submit assignment" }).click();
    record("AI feedback heading is shown after submit", await expectText(page, "AI practice feedback"));
    record("feedback is labelled as guidance, not an official grade", await expectText(page, "not an official grade"));
    record("criterion feedback from the proxy is rendered", await expectText(page, "Mock feedback for criterion"));
    record("the graded submission is written to graded_submissions", store.rows.length === 1, `${store.rows.length} row(s)`);
    record(
      "the saved row is for this assignment and carries the grade shown",
      store.rows[0]?.assignment_id === "asg-1" && store.rows[0]?.submission_method === "type" && store.rows[0]?.total_score === 22 && store.rows[0]?.max_score === 40
    );
    await page.screenshot({ path: join(SHOTS, "grading-success.png"), fullPage: true });
    record("no uncaught page errors", errors.length === 0, errors.join(" | "));
    await context.close();
  }

  console.log("\nAssignment grading failure");
  {
    const { context, page } = await newPage(browser);
    await page.goto(`${APP_URL}/assignments/asg-1`);
    await page.getByLabel("Your response").fill("FAILGRADE this essay body goes here for testing purposes.");
    await page.getByRole("button", { name: "Submit assignment" }).click();
    record("failed grading shows a clear message, not a fake score", await expectText(page, "couldn't mark this just now"));
    record("retry is offered", await expectText(page, "Try again", 2000));
    record("no score is fabricated", !(await expectText(page, "AI practice feedback", 1000)));
    await page.screenshot({ path: join(SHOTS, "grading-failure.png"), fullPage: true });
    await context.close();
  }

  console.log("\nSave failure does not show an unsaved grade (Phase 5)");
  {
    const { context, page, store, proxy } = await newPage(browser);
    store.failWrites = true;
    await page.goto(`${APP_URL}/assignments/asg-1`);
    await page.getByLabel("Your response").fill("A typed answer whose grade should not appear until it is saved.");
    await page.getByRole("button", { name: "Submit assignment" }).click();
    record("a failed save shows a clear message", await expectText(page, "couldn't save the feedback yet"));
    record("the grade is NOT shown when the save fails", !(await expectText(page, "AI practice feedback", 1500)));
    record("the failed save offers a retry", await expectText(page, "Try again", 2000));
    store.failWrites = false;
    await page.getByRole("button", { name: "Try again" }).click();
    record("retrying the save shows the grade", await expectText(page, "AI practice feedback"));
    record("retrying the save does not re-grade (one AI call total)", proxy.calls === 1, `${proxy.calls} proxy call(s)`);
    record("retrying the save writes exactly one row", store.rows.length === 1, `${store.rows.length} row(s)`);
    await context.close();
  }

  console.log("\nReport page shows the saved live grade (Phase 5)");
  {
    const { context, page, errors, store } = await newPage(browser);
    store.rows.push({
      id: "seed-live-1",
      student_id: "00000000-0000-4000-8000-000000000001",
      assignment_id: "asg-1",
      submission_method: "type",
      submitted_text: "Seeded submission text.",
      total_score: 13,
      max_score: 40,
      criteria: [{ criterionId: "r1", score: 9, feedback: "Seeded feedback from the saved grade.", quotes: [] }],
      strengths: ["Seeded strength from the saved grade."],
      improvements: [],
      graded_at: "2026-10-04T12:00:00.000Z",
    });
    await page.goto(`${APP_URL}/assignments/asg-1/report`);
    record("report shows the saved criterion feedback", await expectText(page, "Seeded feedback from the saved grade."));
    record("report shows the saved strength", await expectText(page, "Seeded strength from the saved grade."));
    record("report labels the mark as an AI practice mark", await expectText(page, "AI practice mark"));
    record("report says it is not a teacher-approved grade", await expectText(page, "not a teacher-approved grade"));
    record("the demo teacher override is not shown for a live grade", !(await expectText(page, "Teacher adjusted this mark", 1000)));
    await page.screenshot({ path: join(SHOTS, "report-live.png"), fullPage: true });
    record("no uncaught page errors on the live report", errors.length === 0, errors.join(" | "));
    await context.close();
  }

  console.log("\nReport page falls back to demo content only where nothing was graded live (Phase 5)");
  {
    const { context, page } = await newPage(browser);
    await page.goto(`${APP_URL}/assignments/asg-3/report`);
    record("demo report with no saved grade still renders its teacher-marked content", await expectText(page, "Teacher adjusted this mark"));
    record("demo report is labelled as a total mark, not an AI mark", !(await expectText(page, "AI practice mark", 1000)));
    await context.close();
  }
  {
    const { context, page } = await newPage(browser);
    await page.goto(`${APP_URL}/assignments/asg-1/report`);
    record("an unsubmitted, unmarked assignment shows the still-being-reviewed state", await expectText(page, "still being reviewed"));
    await context.close();
  }
  {
    const { context, page, store } = await newPage(browser);
    store.failReads = true;
    await page.goto(`${APP_URL}/assignments/asg-3/report`);
    record("a failed load shows an error with retry", await expectText(page, "We couldn't load this report"));
    record("a failed load does NOT fall back to demo content", !(await expectText(page, "Teacher adjusted this mark", 1000)));
    await context.close();
  }

  console.log("\nPDF from a live-graded report (Phase 5)");
  {
    const { context, page, errors, store } = await newPage(browser);
    store.rows.push({
      id: "seed-live-2",
      student_id: "00000000-0000-4000-8000-000000000001",
      assignment_id: "asg-1",
      submission_method: "type",
      submitted_text: "Seeded submission text.",
      total_score: 13,
      max_score: 40,
      criteria: [{ criterionId: "r1", score: 9, feedback: "PDF seeded feedback.", quotes: [] }],
      strengths: [],
      improvements: [],
      graded_at: "2026-10-04T12:00:00.000Z",
    });
    await page.goto(`${APP_URL}/assignments/asg-1/report`);
    await expectText(page, "AI practice mark");
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 15000 }).catch(() => null),
      page.getByRole("button", { name: /Download PDF report/ }).click(),
    ]);
    record("the live report can be downloaded as a PDF", !!download);
    if (download) {
      const bytes = (await download.path()) ? (await import("node:fs")).readFileSync(await download.path()) : Buffer.alloc(0);
      const text = bytes.toString("latin1");
      record("the PDF is a real PDF document", text.startsWith("%PDF"));
      record("the PDF contains the AI practice mark label", text.includes("AI practice mark"));
      record("the PDF contains the saved criterion feedback", text.includes("PDF seeded feedback"));
    }
    record("no uncaught page errors on the live PDF path", errors.length === 0, errors.join(" | "));
    await context.close();
  }

  console.log("\nRecovery after reload: unfinished submission (Phase 6)");
  {
    const { context, page, store, proxy } = await newPage(browser);
    await seedPendingJob(page, unfinishedJob());
    await page.goto(`${APP_URL}/assignments/asg-1`);
    record("an unfinished submission is recovered after a reload", await expectText(page, "unfinished submission"));
    record("the recovered submission still shows when it was submitted", await expectText(page, "was submitted on"));
    record("recovery does not grade automatically (no AI call before the student taps)", proxy.calls === 0, `${proxy.calls} proxy call(s)`);
    await page.getByRole("button", { name: "Resume marking" }).click();
    record("resuming grades the submission and shows the feedback once saved", await expectText(page, "AI practice feedback"));
    record("resuming spends exactly one AI call", proxy.calls === 1, `${proxy.calls} proxy call(s)`);
    record("the resumed grade is written to graded_submissions", store.rows.length === 1, `${store.rows.length} row(s)`);
    await context.close();
  }

  console.log("\nRecovery after reload: grade not yet saved (Phase 6)");
  {
    const { context, page, store, proxy } = await newPage(browser);
    await seedPendingJob(page, gradedButUnsavedJob());
    await page.goto(`${APP_URL}/assignments/asg-1`);
    record("a grade that was never saved is saved automatically on return", await expectText(page, "AI practice feedback"));
    record("the feedback shown is the one that was graded before the reload", await expectText(page, "Seeded recovered feedback."));
    record("the automatic save spends no AI call", proxy.calls === 0, `${proxy.calls} proxy call(s)`);
    record("the recovered grade is written exactly once", store.rows.length === 1, `${store.rows.length} row(s)`);
    await context.close();
  }

  console.log("\nRecovery after reload: save-before-show holds on recovery (Phase 6)");
  {
    const { context, page, store, proxy } = await newPage(browser);
    store.failWrites = true;
    await seedPendingJob(page, gradedButUnsavedJob());
    await page.goto(`${APP_URL}/assignments/asg-1`);
    record("a recovered grade that fails to save is not shown", !(await expectText(page, "AI practice feedback", 1500)));
    record("the failed recovery save offers a retry", await expectText(page, "couldn't save the feedback yet"));
    store.failWrites = false;
    await page.getByRole("button", { name: "Try again" }).click();
    record("retrying the recovered save shows the grade", await expectText(page, "AI practice feedback"));
    record("retrying the recovered save spends no AI call", proxy.calls === 0, `${proxy.calls} proxy call(s)`);
    record("retrying writes exactly one row", store.rows.length === 1, `${store.rows.length} row(s)`);
    await context.close();
  }

  console.log("\nRecovery after reload: file submission (Phase 6)");
  {
    const { context, page } = await newPage(browser);
    const filePath = join(tmpdir(), "astra-test-reload.txt");
    writeFileSync(filePath, "reload test upload");
    await page.goto(`${APP_URL}/assignments/asg-1`);
    await page.getByRole("tab", { name: "Upload file" }).click();
    await page.setInputFiles('input[aria-label="Upload assignment file"]', filePath);
    await page.getByRole("button", { name: "Submit assignment" }).click();
    await page.reload();
    record("a file submission still shows as submitted after a reload", await expectText(page, "was submitted on"));
    record("it still says file uploads can't be marked yet, rather than vanishing", await expectText(page, "can't read uploaded files yet"));
    await context.close();
  }

  console.log("\nTutor daily rate limit (Phase 4)");
  {
    const { context, page } = await newPage(browser);
    await page.goto(`${APP_URL}/tutor`);
    await page.fill("#tutor-input", "RATELIMIT please");
    await page.getByRole("button", { name: "Send message" }).click();
    record("server rate-limit message is shown, distinct from the generic failure", await expectText(page, "You've reached today's tutor message limit"));
    record("the generic 'couldn't respond' failure banner is NOT shown instead", !(await expectText(page, "Astra couldn't respond just now.", 500)));
    await page.screenshot({ path: join(SHOTS, "tutor-rate-limited.png"), fullPage: true });
    await context.close();
  }

  console.log("\nGrading daily rate limit (Phase 4)");
  {
    const { context, page } = await newPage(browser);
    await page.goto(`${APP_URL}/assignments/asg-1`);
    await page.getByLabel("Your response").fill("RATELIMITGRADE this essay body goes here for testing purposes today.");
    await page.getByRole("button", { name: "Submit assignment" }).click();
    record("server rate-limit message is shown for grading", await expectText(page, "You've reached today's AI grading limit"));
    record("no score is fabricated when rate-limited", !(await expectText(page, "AI practice feedback", 1000)));
    await page.screenshot({ path: join(SHOTS, "grading-rate-limited.png"), fullPage: true });
    await context.close();
  }

  console.log("\nPDF report generation (Phase 4)");
  {
    const { context, page, errors } = await newPage(browser);
    await page.goto(`${APP_URL}/assignments/asg-3/report`);
    record("report page renders the rubric breakdown before download", await expectText(page, "Rubric breakdown"));
    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 15000 }).catch(() => null),
      page.getByRole("button", { name: /Download PDF report/ }).click(),
    ]);
    record("clicking download produces a real file download (not a toast stub)", !!download);
    if (download) {
      record("downloaded file is a .pdf", download.suggestedFilename().toLowerCase().endsWith(".pdf"), download.suggestedFilename());
      const path = await download.path();
      const size = path ? statSync(path).size : 0;
      record("PDF file is non-trivial size (a real rendered document, not an empty stub)", size > 1000, `${size} bytes`);
    }
    record("success toast confirms the download, not a 'being prepared' stub message", await expectText(page, "has downloaded", 3000));
    record("no uncaught page errors generating the PDF", errors.length === 0, errors.join(" | "));
    await context.close();
  }

  console.log("\nOCR real-failure state (Phase 4 — see Phase 4 report: this sandbox's network");
  console.log("policy blocks the OCR CDN, so this is a REAL failure, not a simulated one,");
  console.log("proving the error UI works under genuine failure. Success/low-confidence");
  console.log("paths need a normal network and must be verified outside this sandbox.)");
  {
    const { context, page, errors } = await newPage(browser);
    const filePath = join(tmpdir(), "astra-test-photo.png");
    // A minimal valid 1x1 PNG — content doesn't matter, this exercises the
    // OCR engine's real failure path (no CDN access), not recognition itself.
    writeFileSync(
      filePath,
      Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64")
    );
    await page.goto(`${APP_URL}/assignments/asg-1`);
    await page.getByRole("tab", { name: "Photo" }).click();
    await page.setInputFiles('input[type="file"][accept="image/*"]', filePath);
    const ocrSettled = await expectText(page, "Try again", 45000);
    record("OCR settles to an error with retry instead of hanging on 'Reading' (Phase 6 time bound)", ocrSettled);
    const timeoutCopy = await expectText(page, "taking too long", 1000);
    const readCopy = await expectText(page, "Couldn't read this photo", 1000);
    const noTextCopy = await expectText(page, "couldn't find any readable text", 1000);
    record(
      "the settled error is a clear OCR message (timeout, read failure, or no readable text)",
      timeoutCopy || readCopy || noTextCopy
    );
    await page.getByRole("button", { name: "Try again" }).click();
    record("Try again starts a fresh read", await expectText(page, "Reading your handwriting", 3000));
    record("the retried read also settles to an error with retry", await expectText(page, "Try again", 45000));
    record("no uncaught page errors on OCR failure", errors.length === 0, errors.join(" | "));
    await page.screenshot({ path: join(SHOTS, "ocr-error-state.png"), fullPage: true });
    await context.close();
  }

  console.log("\nOCR time bound, forced hang (Phase 6)");
  {
    const { context, page, errors } = await newPage(browser);
    // Hold every OCR CDN request open, so recognition can only end by timing out.
    await context.route("https://cdn.jsdelivr.net/**", () => {});
    const filePath = join(tmpdir(), "astra-test-hang.png");
    writeFileSync(
      filePath,
      Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64")
    );
    await page.goto(`${APP_URL}/assignments/asg-1`);
    await page.getByRole("tab", { name: "Photo" }).click();
    await page.setInputFiles('input[type="file"][accept="image/*"]', filePath);
    record("a read that never completes shows the reading state", await expectText(page, "Reading your handwriting", 5000));
    record("the time bound fires and shows the timeout message", await expectText(page, "taking too long", 45000));
    record("the timeout state offers Try again", await expectText(page, "Try again", 2000));
    await page.screenshot({ path: join(SHOTS, "ocr-timeout.png"), fullPage: true });
    await page.getByRole("button", { name: "Try again" }).click();
    record("Try again after a timeout starts a fresh read", await expectText(page, "Reading your handwriting", 3000));
    record("the retried read after a timeout also times out cleanly", await expectText(page, "taking too long", 45000));
    record("no uncaught page errors around the timeout", errors.length === 0, errors.join(" | "));
    await context.close();
  }

  console.log("\nFile upload is not graded yet");
  {
    const { context, page } = await newPage(browser);
    const filePath = join(tmpdir(), "astra-test-upload.txt");
    writeFileSync(filePath, "uploaded essay text");
    await page.goto(`${APP_URL}/assignments/asg-1`);
    await page.getByRole("tab", { name: "Upload file" }).click();
    await page.setInputFiles('input[aria-label="Upload assignment file"]', filePath);
    await page.getByRole("button", { name: "Submit assignment" }).click();
    record("file submission explains it can't get AI feedback yet", await expectText(page, "can't read uploaded files yet"));
    await context.close();
  }
} else {
  console.log("\nNo-proxy build (proxy not configured)");
  {
    const { context, page, errors } = await newPage(browser);
    await page.goto(`${APP_URL}/tutor`);
    await page.fill("#tutor-input", "Explain simultaneous equations simply");
    await page.getByRole("button", { name: "Send message" }).click();
    record("canned tutor reply is used when no proxy is configured", await expectText(page, "Let's think it through together"));
    record("no uncaught page errors", errors.length === 0, errors.join(" | "));
    await context.close();
  }
  {
    const { context, page, errors } = await newPage(browser);
    await page.goto(`${APP_URL}/assignments/asg-1`);
    await page.getByLabel("Your response").fill("Some typed essay text to submit for feedback today.");
    await page.getByRole("button", { name: "Submit assignment" }).click();
    record("unconfigured grading shows a pending state, not a score", await expectText(page, "isn't switched on for this build yet"));
    record("no score is fabricated when unconfigured", !(await expectText(page, "AI practice feedback", 1000)));
    await page.screenshot({ path: join(SHOTS, "grading-unconfigured.png"), fullPage: true });
    await page.reload();
    record("an unconfigured submission is still there after a reload, with a resume option", await expectText(page, "unfinished submission"));
    record("the reloaded submission offers manual resume instead of re-grading on its own", await expectText(page, "Resume marking", 2000));
    record("no uncaught page errors", errors.length === 0, errors.join(" | "));
    await context.close();
  }
}

console.log("\nOnboarding: education level gates ExamStep's options (Phase 7)");
console.log("--------------------------------------------------------------------");
{
  const { context, page, errors } = await newOnboardingPage(browser);
  await page.goto(APP_URL);
  await page.getByRole("button", { name: "Get started" }).click();
  record("level step asks which level, before any exam is mentioned", await expectText(page, "What level are you studying at?"));

  await page.getByRole("radio", { name: /Primary School/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  record("Primary auto-selects Common Entrance", await expectChecked(page, /Common Entrance/));
  record("Primary's exam list shows no senior-secondary exam", !(await expectText(page, "JAMB", 1000)) && !(await expectText(page, "WAEC", 500)) && !(await expectText(page, "NECO", 500)) && !(await expectText(page, "Post-UTME", 500)));
  record("Primary's exam list shows no BECE (Junior Secondary) option either", !(await expectText(page, "BECE", 500)));
  await page.getByRole("button", { name: "Continue" }).click();
  record("Primary's subject list excludes Biology (not in Common Entrance's subjects)", !(await expectText(page, "Biology", 1000)));
  record("Primary's subject list excludes Chemistry", !(await expectText(page, "Chemistry", 500)));
  record("Primary's subject list still offers Mathematics", await expectText(page, "Mathematics", 500));
  await page.screenshot({ path: join(SHOTS, "onboarding-primary.png"), fullPage: true });
  record("no uncaught page errors through the Primary path", errors.length === 0, errors.join(" | "));
  await context.close();
}
{
  const { context, page } = await newOnboardingPage(browser);
  await page.goto(APP_URL);
  await page.getByRole("button", { name: "Get started" }).click();
  await page.getByRole("radio", { name: /Senior Secondary/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  record("Senior Secondary's exam list offers all four senior exams", await expectText(page, "JAMB") && await expectText(page, "WAEC") && await expectText(page, "NECO") && await expectText(page, "Post-UTME"));
  record("Senior Secondary's exam list never mentions BECE", !(await expectText(page, "BECE", 500)));
  record("Senior Secondary's exam list never mentions Common Entrance", !(await expectText(page, "Common Entrance", 500)));
  await context.close();
}
{
  const { context, page } = await newOnboardingPage(browser);
  await page.goto(APP_URL);
  await page.getByRole("button", { name: "Get started" }).click();
  await page.getByRole("radio", { name: /Junior Secondary/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  record("Junior Secondary auto-selects BECE", await expectChecked(page, /BECE/));
  record("Junior Secondary's exam list shows no senior-secondary exam", !(await expectText(page, "JAMB", 1000)) && !(await expectText(page, "WAEC", 500)));
  await context.close();
}

console.log("\nOnboarding: University skips ExamStep and leads to real course entry (Phase 7b)");
console.log("---------------------------------------------------------------------------------");
{
  const { context, page, errors } = await newOnboardingPage(browser);
  await page.goto(APP_URL);
  await page.getByRole("button", { name: "Get started" }).click();
  await page.getByRole("radio", { name: /University/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  record("ExamStep's question never appears for University", !(await expectText(page, "Which exam are you preparing for?", 1000)));
  record("the real course-entry step appears instead of a dead-end notice", await expectText(page, "What are you studying?"));
  record("the stale 'coming soon' notice is gone", !(await expectText(page, "coming soon", 500)));
  await page.screenshot({ path: join(SHOTS, "onboarding-university-courses.png"), fullPage: true });
  record("no uncaught page errors reaching the course-entry step", errors.length === 0, errors.join(" | "));
  await context.close();
}

console.log("\nOnboarding: cannot complete University setup with zero courses (Phase 7b, §7 test #6)");
console.log("-------------------------------------------------------------------------------------------");
{
  const { context, page } = await newOnboardingPage(browser);
  await page.goto(APP_URL);
  await page.getByRole("button", { name: "Get started" }).click();
  await page.getByRole("radio", { name: /University/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("button", { name: "Continue" }).click(); // attempt to proceed with zero courses
  record("onboarding refuses to proceed with zero courses", await expectText(page, "Add at least one course to continue."));
  record("still on the course-entry step, not advanced to Date", await expectText(page, "What are you studying?", 500));
  await context.close();
}

// §7 tests #1 and #2 assert the exact mock-proxy reply and its echoed
// courseName — both require the AI proxy to actually be configured and
// reachable, so (like the rest of this file's proxy-dependent tests) these
// only run on the configured-proxy pass. The onboarding/course-entry UI
// itself (tested above, unconditionally) doesn't depend on the proxy at all.
if (!NOT_CONFIGURED) {
  console.log("\nOnboarding -> real tutor chat, SEEDED course (Phase 7b, §7 test #1)");
  console.log("-------------------------------------------------------------------------");
  {
    const { context, page, errors } = await newOnboardingPage(browser);
    await page.goto(APP_URL);
    await page.getByRole("button", { name: "Get started" }).click();
    await page.getByRole("radio", { name: /University/ }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.fill("#course-search", "Fluid");
    record("a seeded course suggestion appears for a partial match", await expectText(page, "Fluid Mechanics"));
    await page.getByRole("button", { name: /Fluid Mechanics/ }).click();
    record("picking the suggestion adds it as a removable chip", await expectRole(page, "button", "Remove Fluid Mechanics", 2000));
    await page.getByRole("button", { name: "Continue" }).click();
    record("no 'add at least one course' error once a course is added", !(await expectText(page, "Add at least one course", 500)));
    await finishRestOfOnboarding(page);
    record("onboarding actually completes (no longer on the onboarding shell)", !(await expectText(page, "What are you studying?", 1000)));

    await page.goto(`${APP_URL}/tutor`);
    record("Tutor shows the real chat for a university student with a seeded course, not the coming-soon notice", (await page.locator("#tutor-input").count()) === 1);
    record("the info banner names the seeded course", await expectText(page, "Tutoring for Fluid Mechanics."));
    await page.fill("#tutor-input", "Explain the continuity equation");
    await page.getByRole("button", { name: "Send message" }).click();
    record("a working reply arrives for the seeded course", await expectText(page, "Mock tutor"));
    record("the request sent to the proxy carried the exact seeded course name", await expectText(page, "[course: Fluid Mechanics]"));
    await page.screenshot({ path: join(SHOTS, "university-tutor-seeded.png"), fullPage: true });
    record("no uncaught page errors through the full seeded-course path", errors.length === 0, errors.join(" | "));
    await context.close();
  }

  console.log("\nOnboarding -> real tutor chat, TYPED NON-SEEDED course (Phase 7b, §7 test #2 — THE KEY CHECK)");
  console.log("-----------------------------------------------------------------------------------------------------");
  {
    const { context, page, errors } = await newOnboardingPage(browser);
    const customCourse = "Entomology and Pest Management"; // real, deliberately uncommon — not in SEED_COURSES
    await page.goto(APP_URL);
    await page.getByRole("button", { name: "Get started" }).click();
    await page.getByRole("radio", { name: /University/ }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await page.fill("#course-search", customCourse);
    record("no seeded suggestion matches this deliberately uncommon course", !(await expectText(page, "Database Management Systems", 500)));
    await page.getByRole("button", { name: "Add" }).click();
    record("typing a non-seeded course adds it as a removable chip, exactly like a seeded pick", await expectRole(page, "button", `Remove ${customCourse}`, 2000));
    await page.getByRole("button", { name: "Continue" }).click();
    await finishRestOfOnboarding(page);

    await page.goto(`${APP_URL}/tutor`);
    record("Tutor shows the real chat for the custom course — no degraded UI, no 'course not supported' message", (await page.locator("#tutor-input").count()) === 1);
    record("no 'course not supported' or similar fallback message appears", !(await expectText(page, "not supported", 500)));
    record("the info banner names the exact typed course, not a generic placeholder", await expectText(page, `Tutoring for ${customCourse}.`));
    record("the tone selector is present, same as any other tutor session", await expectText(page, "Concise", 1000) || await expectText(page, "Guided", 500));
    await page.fill("#tutor-input", "Explain integrated pest management basics");
    await page.getByRole("button", { name: "Send message" }).click();
    record("a working reply arrives for the custom course — functionally identical to the seeded path", await expectText(page, "Mock tutor"));
    record("the request sent to the proxy carried the exact, verbatim custom course name the student typed", await expectText(page, `[course: ${customCourse}]`));
    record("no failure banner for the custom course", !(await expectText(page, "couldn't respond", 500)));
    await page.screenshot({ path: join(SHOTS, "university-tutor-custom.png"), fullPage: true });
    record("no uncaught page errors through the full custom-course path", errors.length === 0, errors.join(" | "));
    await context.close();
  }
}

console.log("\nUniversity tutor never shows secondary-exam framing (Phase 7b, §7 test #4)");
console.log("---------------------------------------------------------------------------------");
{
  const { context, page } = await newPageWithLevel(browser, "university", {
    courses: [{ id: "c1", name: "Fluid Mechanics", code: "MEE 301", customAddedByStudent: false }],
  });
  await page.goto(`${APP_URL}/tutor`);
  record("no JAMB/WAEC/NECO/BECE/Common Entrance text appears anywhere on the university tutor page", !(await expectText(page, "JAMB")) && !(await expectText(page, "WAEC", 500)) && !(await expectText(page, "NECO", 500)) && !(await expectText(page, "BECE", 500)) && !(await expectText(page, "Common Entrance", 500)));
  await context.close();
}

// Proxy-dependent (generation and grading both need a reachable AI proxy) —
// same reasoning as the two onboarding->chat blocks above.
if (!NOT_CONFIGURED) {
  console.log("\nUniversity assignment: generate -> submit -> grade through the existing pipeline (Phase 7b, §7 test #5)");
  console.log("-------------------------------------------------------------------------------------------------------------");
  {
    const { context, page, errors } = await newPageWithLevel(browser, "university", {
      courses: [{ id: "c1", name: "Fluid Mechanics", code: "MEE 301", customAddedByStudent: false }],
    });
    await page.goto(`${APP_URL}/assignments`);
    record("university assignments page offers to generate one, not a coming-soon notice", await expectText(page, "Generate assignment"));
    await page.getByRole("button", { name: /Generate assignment/ }).click();
    record("a freshly generated assignment scoped to the course appears", await expectText(page, "Fluid Mechanics", 8000));
    await page.getByLabel("Your response").fill("Applying Bernoulli's principle, the fluid speeds up where the pipe narrows.");
    await page.getByRole("button", { name: "Submit for grading" }).click();
    record("the submission is graded through the existing grading pipeline", await expectText(page, "AI practice feedback", 8000));
    record("the grade is labelled as guidance, not an official grade, same as the secondary pipeline", await expectText(page, "not an official grade"));
    await page.screenshot({ path: join(SHOTS, "university-assignment-graded.png"), fullPage: true });
    record("no uncaught page errors through the generate-submit-grade flow", errors.length === 0, errors.join(" | "));
    await context.close();
  }
}

console.log("\nUniversity downstream, zero courses: defensive fallback (Phase 7b, updated 7c)");
console.log("------------------------------------------------------------------------------------");
{
  // Phase 7c §1a: this is no longer a purely defensive, unreachable case —
  // Profile can now remove every course — so the copy changed from "coming
  // soon" to an actionable "add a course" prompt (UNIVERSITY_NO_COURSES).
  const { context, page, errors } = await newPageWithLevel(browser, "university");
  await page.goto(`${APP_URL}/tutor`);
  record("Tutor falls back to an actionable 'add a course' notice for a courseless university account", await expectText(page, "Add a course to get started"));
  record("no chat input is rendered in this edge case", (await page.locator("#tutor-input").count()) === 0);
  record("no uncaught page errors on the courseless University tutor page", errors.length === 0, errors.join(" | "));
  await context.close();
}
{
  const { context, page } = await newPageWithLevel(browser, "university");
  await page.goto(`${APP_URL}/exam`);
  record("Exam simulator explains there's no exam to simulate for University, distinct from the old generic notice", await expectText(page, "No exam simulator for your courses"));
  record("no exam card is shown underneath it", !(await expectText(page, "University entry via UTME", 500)));
  await context.close();
}
{
  const { context, page } = await newPageWithLevel(browser, "university");
  await page.goto(`${APP_URL}/assignments`);
  record("Assignments shows an actionable 'add a course' notice, not a broken workspace", await expectText(page, "Add a course to get started"));
  record("no mock assignment (e.g. the JAMB/WAEC-flavoured essay) leaks through", !(await expectText(page, "JAMB/WAEC", 500)));
  await context.close();
}
{
  const { context, page, errors } = await newPageWithLevel(browser, "university");
  await page.goto(APP_URL);
  record("Home points a university student at Tutor/Assignments instead of a secondary-subject dashboard", await expectText(page, "No structured study plan for university yet"));
  record("no secondary subject mastery card leaks onto the University home screen", !(await expectText(page, "Mathematics", 500)));
  await page.screenshot({ path: join(SHOTS, "university-home.png"), fullPage: true });
  record("no uncaught page errors on the University dashboard", errors.length === 0, errors.join(" | "));
  await context.close();
}

console.log("\nCourse management on Profile; the tutor switcher never references a removed course (Phase 7c §1a, §7 test #1)");
console.log("---------------------------------------------------------------------------------------------------------------------");
{
  const { context, page } = await newPageWithLevel(browser, "university", {
    courses: [
      { id: "c1", name: "Fluid Mechanics", code: "MEE 301", customAddedByStudent: false },
      { id: "c2", name: "Financial Accounting I", code: "ACC 101", customAddedByStudent: false },
    ],
  });
  await page.goto(`${APP_URL}/profile`);
  record("Profile shows the 'Your courses' management card for a university student", await expectText(page, "Your courses"));
  record(
    "both existing courses are shown as removable chips",
    (await expectRole(page, "button", "Remove Fluid Mechanics")) && (await expectRole(page, "button", "Remove Financial Accounting I"))
  );

  await page.fill("#profile-course-search", "Discrete Mathematics");
  await page.getByRole("button", { name: "Add" }).click();
  record("a newly typed course is added as a removable chip on Profile, same as any other", await expectRole(page, "button", "Remove Discrete Mathematics", 2000));
  await waitForPrefsToReflect(page, "Discrete Mathematics", true);

  // Remove the course the tutor would otherwise default to as "active" (the first one added).
  await page.getByRole("button", { name: "Remove Fluid Mechanics" }).click();
  record("the removed course's chip disappears from Profile", !(await expectRole(page, "button", "Remove Fluid Mechanics", 1000)));
  await waitForPrefsToReflect(page, "Fluid Mechanics", false);

  await page.goto(`${APP_URL}/tutor`);
  record("Tutor still works after its active course was removed — no crash, no blank page", (await page.locator("#tutor-input").count()) === 1);
  record(
    "Tutor's banner now names one of the REMAINING courses, never the removed one",
    (await expectText(page, "Tutoring for Financial Accounting I.", 2000)) || (await expectText(page, "Tutoring for Discrete Mathematics.", 500))
  );
  record("the removed course's name never appears on the tutor page", !(await expectText(page, "Fluid Mechanics", 500)));

  // Remove every remaining course.
  await page.goto(`${APP_URL}/profile`);
  await page.getByRole("button", { name: "Remove Financial Accounting I" }).click();
  await waitForPrefsToReflect(page, "Financial Accounting I", false);
  await page.getByRole("button", { name: "Remove Discrete Mathematics" }).click();
  await waitForPrefsToReflect(page, "Discrete Mathematics", false);
  await page.goto(`${APP_URL}/tutor`);
  record("with every course removed, Tutor falls back to the 'add a course' prompt, not a crash", await expectText(page, "Add a course to get started"));
  await context.close();
}

if (!NOT_CONFIGURED) {
  console.log("\nGenerated university assignment survives a reload: id, content, and grade all persist (Phase 7c §1b, §7 test #2)");
  console.log("---------------------------------------------------------------------------------------------------------------------");
  {
    const { context, page, errors, universityAssignmentsStore, store } = await newPageWithLevel(browser, "university", {
      courses: [{ id: "c1", name: "Fluid Mechanics", code: "MEE 301", customAddedByStudent: false }],
    });
    await page.goto(`${APP_URL}/assignments`);
    await page.getByRole("button", { name: /Generate assignment/ }).click();
    record("a freshly generated assignment appears", await expectText(page, "Fluid Mechanics", 8000));
    record(
      "the generated assignment was persisted with a real (non-mock) id",
      universityAssignmentsStore.rows.length === 1 && typeof universityAssignmentsStore.rows[0].id === "string" && universityAssignmentsStore.rows[0].id.length > 10
    );
    const assignmentTitle = (await page.locator("h3").first().textContent())?.trim();

    await page.getByLabel("Your response").fill("Applying Bernoulli's principle, the fluid speeds up where the pipe narrows.");
    await page.getByRole("button", { name: "Submit for grading" }).click();
    record("the submission is graded through the existing grading pipeline", await expectText(page, "AI practice feedback", 8000));
    record(
      "the grade was persisted through the SAME graded_submissions pipeline secondary assignments use, keyed to the persisted assignment's real id",
      store.rows.length === 1 && store.rows[0].assignment_id === universityAssignmentsStore.rows[0].id
    );

    await page.reload();
    record("after a reload, the SAME assignment content reappears, not a freshly regenerated one", await expectText(page, assignmentTitle ?? "Fluid Mechanics"));
    record("after a reload, the persisted grade reappears without re-grading", await expectText(page, "AI practice feedback", 5000));
    record("exactly one assignment and one grade are stored — the reload created no duplicates", universityAssignmentsStore.rows.length === 1 && store.rows.length === 1);
    record("no uncaught page errors across generate -> submit -> reload", errors.length === 0, errors.join(" | "));
    await context.close();
  }
}

console.log("\nPrimary/Junior/Senior Secondary: Practice/Progress/Revision/Learn show only level-appropriate subjects (Phase 7c §1c, §7 test #3)");
console.log("---------------------------------------------------------------------------------------------------------------------------------------");
{
  const { context, page } = await newPageWithLevel(browser, "primary");
  await page.goto(`${APP_URL}/practice`);
  record("Primary's practice setup offers Mathematics", await hasOption(page, "Mathematics"));
  record("Primary's practice setup offers English Language", await hasOption(page, "English Language"));
  record("Primary's practice setup never offers Biology", !(await hasOption(page, "Biology")));
  record("Primary's practice setup never offers Chemistry", !(await hasOption(page, "Chemistry")));
  await page.goto(`${APP_URL}/progress`);
  record("Primary's progress page offers only its own 2 subjects in the filter", (await hasOption(page, "Mathematics")) && (await hasOption(page, "English Language")) && !(await hasOption(page, "Biology")));
  record("Primary's progress page shows no Biology mastery map section", !(await expectText(page, "Biology", 500)));
  await page.goto(`${APP_URL}/revision`);
  record("Primary's revision page shows no Chemistry item (Stoichiometry)", !(await expectText(page, "Stoichiometry", 500)));
  await page.goto(`${APP_URL}/learn`);
  record("Primary's learn page shows no Chemistry task (Stoichiometry)", !(await expectText(page, "Stoichiometry", 500)));
  await context.close();
}
{
  const { context, page } = await newPageWithLevel(browser, "junior-secondary");
  await page.goto(`${APP_URL}/practice`);
  record("Junior Secondary's practice setup offers Biology", await hasOption(page, "Biology"));
  record("Junior Secondary's practice setup never offers Chemistry", !(await hasOption(page, "Chemistry")));
  await context.close();
}

console.log("\nUniversity course WITHOUT seeded content: honest fallback on all four pages (Phase 7c §1c, §7 test #4)");
console.log("-------------------------------------------------------------------------------------------------------------");
{
  const nonPilotCourse = { id: "c1", name: "Fluid Mechanics", code: "MEE 301", customAddedByStudent: false };
  for (const path of ["practice", "progress", "revision", "learn"]) {
    const { context, page, errors } = await newPageWithLevel(browser, "university", { courses: [nonPilotCourse] });
    await page.goto(`${APP_URL}/${path}`);
    record(`${path}: a university student with a non-pilot course gets an honest notice, not a crash`, (await expectText(page, "No structured practice for your courses yet")) || (await expectText(page, "Daily planning isn't built for university yet")));
    record(`${path}: no secondary content (e.g. Mathematics) leaks through`, !(await expectText(page, "Mathematics", 500)));
    record(`${path}: no uncaught page errors`, errors.length === 0, errors.join(" | "));
    await context.close();
  }
}

console.log("\nThe one seeded university course: real practice questions and mastery through the actual engine, not mocked (Phase 7c §1d, §7 test #5)");
console.log("-------------------------------------------------------------------------------------------------------------------------------------------");
{
  const pilotCourseForTest = { id: "c1", name: "Introduction to Algorithms and Data Structures", code: "CSC 201", customAddedByStudent: false };
  const PILOT_TOPIC = "uni-cs-algo-bigo";
  const pilotTopicsFixture = [{ id: PILOT_TOPIC, subject_id: "uni-cs-algo" }];
  const pilotQuestionsFixture = [
    {
      id: "uq-test-1",
      subject_id: "uni-cs-algo",
      topic_id: PILOT_TOPIC,
      type: "mcq",
      prompt: "What is the time complexity of binary search on a sorted array of n elements?",
      options: [
        { id: "a", label: "O(n)" },
        { id: "b", label: "O(log n)" },
        { id: "c", label: "O(n log n)" },
        { id: "d", label: "O(1)" },
      ],
      correct_option_id: "b",
      difficulty: 2,
      explanation: "Binary search halves the search space each step.",
      why_wrong_by_option: { a: "That is linear search's complexity.", c: "That is a sorting complexity, not searching.", d: "Too fast for anything but a direct index lookup." },
      worked_example: null,
    },
    {
      id: "uq-test-2",
      subject_id: "uni-cs-algo",
      topic_id: PILOT_TOPIC,
      type: "mcq",
      prompt: "Which notation describes the worst-case upper bound of an algorithm's running time?",
      options: [
        { id: "a", label: "Big-O" },
        { id: "b", label: "Big-Omega" },
        { id: "c", label: "Big-Theta" },
        { id: "d", label: "Little-o" },
      ],
      correct_option_id: "a",
      difficulty: 2,
      explanation: "Big-O describes an upper bound.",
      why_wrong_by_option: { b: "That is a lower bound.", c: "That is a tight bound, a stronger claim.", d: "A more specialised, less common notation." },
      worked_example: null,
    },
  ];

  const { context, page, errors } = await newPageWithLevel(browser, "university", { courses: [pilotCourseForTest] });
  installLiveEngineFake(context, { topics: pilotTopicsFixture, questions: pilotQuestionsFixture });

  await page.goto(`${APP_URL}/practice`);
  record("the pilot course is offered on Practice setup — no 'no structured content' gate for it", await hasOption(page, "Introduction to Algorithms and Data Structures"));
  await page.getByRole("button", { name: "Start practice" }).click();
  record("a real practice session starts with one of the pilot course's seeded questions", (await expectText(page, "binary search", 5000)) || (await expectText(page, "worst-case upper bound", 2000)));

  // Answer whichever seeded question came up first, correctly, then the second.
  // submitAnswer() awaits an async call to the (faked) live engine before the
  // feedback sheet/Next button appear, so this waits for that to actually
  // happen rather than checking immediately after the click resolves.
  for (let i = 0; i < 2; i++) {
    const correctLabel = (await expectText(page, "binary search", 1000)) ? "O(log n)" : "Big-O";
    await page.getByRole("radio", { name: correctLabel, exact: true }).click();
    await page.getByRole("button", { name: /Submit answer|Submit & finish/ }).click();
    const nextButton = page.getByRole("button", { name: "Next question" });
    await nextButton.waitFor({ state: "visible", timeout: 5000 }).catch(() => {});
    if (await nextButton.isVisible().catch(() => false)) await nextButton.click();
  }
  record("no uncaught page errors completing the pilot-course practice session", errors.length === 0, errors.join(" | "));

  await page.goto(`${APP_URL}/progress/topic/${PILOT_TOPIC}`);
  record("the topic detail page shows REAL tracked mastery for the pilot topic, not 'no data yet'", !(await expectText(page, "No data yet for this topic", 1000)));
  record("the real engine recorded both attempts against this topic (questionsAttempted = 2)", await expectText(page, "2", 2000) && (await expectText(page, "Questions attempted")));
  await context.close();
}

console.log("\nSecondary levels still see zero university framing anywhere (Phase 7b, §7 test #8)");
console.log("----------------------------------------------------------------------------------------");
if (!NOT_CONFIGURED) {
  const { context, page } = await newPageWithLevel(browser, "senior-secondary");
  await page.goto(`${APP_URL}/tutor`);
  await page.fill("#tutor-input", "Explain simultaneous equations simply");
  await page.getByRole("button", { name: "Send message" }).click();
  record("a senior-secondary student's reply never carries a course marker", await expectText(page, "Mock tutor") && !(await expectText(page, "[course:", 500)));
  await context.close();
}
{
  const { context, page } = await newPageWithLevel(browser, "senior-secondary");
  await page.goto(`${APP_URL}/assignments`);
  record("senior-secondary assignments page is the existing one, not the university workspace", await expectText(page, "Work set by Astra") && !(await expectText(page, "Generate assignment", 500)));
  await context.close();
}

console.log("\nDemo student unaffected by default (Phase 7 — no onboarding override)");
console.log("------------------------------------------------------------------------------");
{
  // Note: every page also carries a desktop sidebar (hidden at this mobile
  // viewport, but still in the DOM) showing "{exam} companion" — so a bare
  // "JAMB"/"Assignments" match can resolve .first() to that hidden element
  // and time out waiting for it to become visible. Matching longer, page-
  // specific phrases avoids the collision.
  const { context, page, errors } = await newPage(browser);
  await page.goto(`${APP_URL}/profile`);
  record("the demo student's profile still shows her existing exam (JAMB)", await expectText(page, "JAMB · Exam date"));
  await page.goto(`${APP_URL}/exam`);
  record(
    "the exam simulator still offers the four senior exams for the unmodified demo student",
    (await expectText(page, "University entry via UTME")) && (await expectText(page, "Senior secondary certificate"))
  );
  await page.goto(`${APP_URL}/assignments`);
  record("assignments still show their existing content for the unmodified demo student", (await expectText(page, "Work set by Astra")) && !(await expectText(page, "coming soon", 1000)));
  // Phase 7b: Amara has no universityProfile at all (she's senior-secondary),
  // so the new course-framing mechanism must be a complete no-op for her.
  await page.goto(`${APP_URL}/tutor`);
  record("Amara's tutor banner is the unchanged generic guidance text, not a university course banner", await expectText(page, "This explanation is study guidance."));
  record("no course selector is rendered for Amara (she has no courses, and isn't university-level)", !(await expectText(page, "Active course", 500)));
  // Phase 7c §1c: Amara's own four subjects (via allowedSubjectIdsForLevel
  // for senior-secondary) are byte-identical to her pre-existing
  // amara.subjects list — these four pages must look exactly as before.
  await page.goto(`${APP_URL}/practice`);
  record("Amara's practice setup still offers all four of her subjects", (await hasOption(page, "Mathematics")) && (await hasOption(page, "Biology")) && (await hasOption(page, "Chemistry")));
  await page.goto(`${APP_URL}/progress`);
  record("Amara's progress page is unaffected by the new level-gating", (await hasOption(page, "Chemistry")) && !(await expectText(page, "No structured", 500)));
  await page.goto(`${APP_URL}/revision`);
  record("Amara's revision page still shows her existing content, not a gate", !(await expectText(page, "Daily planning isn't built", 500)));
  await page.goto(`${APP_URL}/learn`);
  record("Amara's learn page still shows her existing plan, not a gate", !(await expectText(page, "Daily planning isn't built", 500)));
  record("no uncaught page errors confirming the demo student is unchanged", errors.length === 0, errors.join(" | "));
  await context.close();
}

await browser.close();

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed} passed, ${failed} failed. Screenshots: ${SHOTS}`);
process.exit(failed ? 1 : 0);
