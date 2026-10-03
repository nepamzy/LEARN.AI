// Browser smoke tests for the AI tutor and assignment grading flows.
// Run the app and the mock proxy first (see package.json scripts), then:
//   APP_URL=http://localhost:5173 node scripts/browser-smoke.mjs            (proxy configured)
//   APP_URL=http://localhost:5174 EXPECT_NOT_CONFIGURED=1 node scripts/browser-smoke.mjs
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
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

async function newPage(browser) {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addInitScript(() => {
    localStorage.setItem("astra:onboardingComplete", "true");
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  return { context, page, errors };
}

async function expectText(page, text, timeout = 10000) {
  try {
    await page.getByText(text, { exact: false }).first().waitFor({ state: "visible", timeout });
    return true;
  } catch {
    return false;
  }
}

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
    const { context, page, errors } = await newPage(browser);
    await page.goto(`${APP_URL}/assignments/asg-1`);
    await page.getByLabel("Your response").fill(
      "Qualitative education builds critical thinking, which national development depends on. For example, graduates who can reason through problems drive better policy."
    );
    await page.getByRole("button", { name: "Submit assignment" }).click();
    record("AI feedback heading is shown after submit", await expectText(page, "AI practice feedback"));
    record("feedback is labelled as guidance, not an official grade", await expectText(page, "not an official grade"));
    record("criterion feedback from the proxy is rendered", await expectText(page, "Mock feedback for criterion"));
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
    record("no uncaught page errors", errors.length === 0, errors.join(" | "));
    await context.close();
  }
}

await browser.close();

const failed = results.filter((r) => !r.ok).length;
console.log(`\n${results.length - failed} passed, ${failed} failed. Screenshots: ${SHOTS}`);
process.exit(failed ? 1 : 0);
