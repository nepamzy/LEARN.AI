// Real PDF generation for a returned, graded assignment, replacing the
// Phase-3 stub ("toast, no file") in AssignmentReportPage.tsx.
//
// This renders ONLY what the report page already shows — same fields, same
// values, nothing invented. Content assembly is kept separate from PDF
// layout (buildReportSections below) specifically so it can be unit-tested
// without touching jsPDF or producing actual PDF bytes — see
// scripts/verify-ai.ts, which checks that every field the report page
// renders ends up in the assembled sections.
//
// Chose client-side rendering (jsPDF) over a server-side HTML-to-PDF Edge
// Function because: (1) it works with zero deployment — the existing
// ai-proxy function is explicitly not to be deployed in this phase, and a
// second Edge Function would carry the same constraint; (2) the report's
// source data (the Assignment object) is already on the client, so there's
// no new data to fetch; (3) it's fully testable in this environment via a
// real browser click + download, with no network dependency at all.

import { jsPDF } from "jspdf";
import type { Assignment } from "../types";

export interface ReportSection {
  heading: string;
  lines: string[];
}

/**
 * Assembles the exact content the report page renders into plain
 * heading/line sections, in the same order as AssignmentReportPage.tsx.
 * Pure function — no jsPDF, no DOM — so it's directly unit-testable.
 */
export function buildReportSections(assignment: Assignment, subjectName: string | undefined): ReportSection[] {
  const finalScore = assignment.teacherOverride?.adjustedScore ?? assignment.totalScore ?? 0;
  const pct = assignment.maxScore > 0 ? Math.round((finalScore / assignment.maxScore) * 100) : 0;

  const sections: ReportSection[] = [
    {
      heading: assignment.title,
      lines: [
        subjectName ?? "",
        `${assignment.markedBy === "ai" ? "AI practice mark" : "Total mark"}: ${finalScore}/${assignment.maxScore} (${pct}%)`,
      ].filter(Boolean),
    },
  ];

  if (assignment.teacherOverride) {
    sections.push({
      heading: assignment.teacherOverride.status === "adjusted" ? "Teacher adjusted this mark" : "Teacher approved this mark",
      lines: [assignment.teacherOverride.comment],
    });
  }

  sections.push({
    heading: "Rubric breakdown",
    lines: assignment.rubric.map((r) => `${r.name}: ${r.score ?? "—"}/${r.maxScore}${r.feedback ? ` — ${r.feedback}` : ""}`),
  });

  if (assignment.strengths?.length) {
    sections.push({ heading: "Strengths", lines: assignment.strengths });
  }
  if (assignment.improvements?.length) {
    sections.push({ heading: "Specific improvements", lines: assignment.improvements });
  }
  if (assignment.modelAnswerExcerpt) {
    sections.push({ heading: "What a stronger answer looks like", lines: [assignment.modelAnswerExcerpt] });
  }
  if (assignment.nextSteps?.length) {
    sections.push({ heading: "What to study next", lines: assignment.nextSteps });
  }

  return sections;
}

const PAGE_MARGIN = 14;
const PAGE_WIDTH = 210; // A4 mm
const USABLE_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2;
const LINE_HEIGHT = 5.5;

/** Renders the sections into an A4 PDF document. */
export function renderReportPdf(sections: ReportSection[]): jsPDF {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = PAGE_MARGIN;

  function ensureSpace(linesNeeded: number) {
    if (y + linesNeeded * LINE_HEIGHT > 297 - PAGE_MARGIN) {
      doc.addPage();
      y = PAGE_MARGIN;
    }
  }

  sections.forEach((section, i) => {
    ensureSpace(2);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(i === 0 ? 16 : 12);
    const headingLines = doc.splitTextToSize(section.heading, USABLE_WIDTH);
    doc.text(headingLines, PAGE_MARGIN, y);
    y += headingLines.length * LINE_HEIGHT + (i === 0 ? 1 : 0.5);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    section.lines.forEach((line) => {
      const wrapped: string[] = doc.splitTextToSize(line, USABLE_WIDTH);
      ensureSpace(wrapped.length);
      doc.text(wrapped, PAGE_MARGIN, y);
      y += wrapped.length * LINE_HEIGHT;
    });
    y += 4;
  });

  return doc;
}

/** Generates and triggers a browser download of the assignment's report PDF. */
export function downloadAssignmentReportPdf(assignment: Assignment, subjectName: string | undefined): void {
  const sections = buildReportSections(assignment, subjectName);
  const doc = renderReportPdf(sections);
  const safeTitle = assignment.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 60);
  doc.save(`${safeTitle || "assignment-report"}.pdf`);
}
