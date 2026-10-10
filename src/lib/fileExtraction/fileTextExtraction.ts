// Phase 7d §1b: real text extraction for an uploaded assignment file,
// replacing the Phase-4-era "Astra can't read uploaded files yet" dead end.
// Runs entirely client-side, same reasoning Phase 4 used for OCR/PDF-report
// generation: no new server endpoint, no new secret, nothing added to the
// ai-proxy Edge Function's surface area — the EXTRACTED TEXT is handed to
// the exact same grading pipeline typed and OCR'd text already go through.
//
// Formats supported, and why:
//   .txt  — read directly via File.text(). Always reliable.
//   .docx — via mammoth's extractRawText(), the standard client-side-capable
//           library for Word's modern (OOXML/zip-based) format. It cannot
//           read the legacy binary .doc format at all, so .doc is not
//           accepted by the upload picker (see SubmissionFileUpload.tsx) —
//           accepting a format we already know we can't read and failing
//           later would be the "send empty/garbage text" dishonesty this
//           phase explicitly rules out.
//   .pdf  — via pdfjs-dist (Mozilla's PDF.js), the standard client-side PDF
//           library — already a natural fit here since jsPDF (PDF
//           *generation*, for assignment reports) is already a dependency.
//           Its worker script is fetched from a CDN at first use, the same
//           pattern Tesseract.js already uses for OCR (see ocrEngine.ts) —
//           in a network-restricted environment (this cloud sandbox
//           included) that fetch fails, surfaced below as a normal
//           FileExtractionError, not a crash.
//
// A PDF with no embedded text layer (e.g. a scanned page saved as PDF) will
// "succeed" at the library level while returning empty or near-empty text —
// detected below and reported as a clear failure, never silently graded
// against blank or garbage text.

import * as mammoth from "mammoth";
import { FileExtractionError, withExtractionTimeout } from "./fileExtractionErrors";

const PDFJS_VERSION = "6.4.299"; // must match the installed pdfjs-dist version (package.json)
const MIN_EXTRACTED_CHARS = 20;

function extensionOf(file: File): string {
  return "." + (file.name.split(".").pop() ?? "").toLowerCase();
}

async function extractTxt(file: File): Promise<string> {
  return (await file.text()).trim();
}

async function extractDocx(file: File): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer });
  return value.trim();
}

async function extractPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: arrayBuffer }).promise;
  const pageTexts: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pageTexts.push(content.items.map((item) => ("str" in item ? item.str : "")).join(" "));
  }
  return pageTexts.join("\n\n").trim();
}

/**
 * Extracts plain text from an uploaded assignment file. Throws
 * FileExtractionError (or FileExtractionTimeoutError) on any failure,
 * including a file that parses but yields no meaningful text — the caller
 * must never treat a thrown error's absence as "safe to grade".
 */
export async function extractTextFromFile(file: File): Promise<string> {
  const ext = extensionOf(file);
  const run = async (): Promise<string> => {
    try {
      if (ext === ".txt") return await extractTxt(file);
      if (ext === ".docx") return await extractDocx(file);
      if (ext === ".pdf") return await extractPdf(file);
    } catch {
      throw new FileExtractionError();
    }
    throw new FileExtractionError(`"${ext}" files aren't supported for grading. Please upload a PDF, Word (.docx), or text file.`);
  };

  const text = await withExtractionTimeout(run());
  if (text.length < MIN_EXTRACTED_CHARS) {
    throw new FileExtractionError(
      "We couldn't find any readable text in that file — it may be a scanned image with no selectable text. Try typing your answer, or use the photo option for handwritten work."
    );
  }
  return text;
}
