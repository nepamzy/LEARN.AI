// Real handwriting OCR for photographed assignment submissions, replacing the
// Phase-3 mock in SubmissionPhotoOCR.tsx. Runs entirely client-side via
// Tesseract.js (a WASM build of the Tesseract OCR engine) — no server, no new
// secret, no change to the ai-proxy Edge Function's surface area.
//
// Tesseract.js needs three assets at recognition time: its worker script, its
// WASM core, and the English trained-data model. The worker/core are small and
// ship inside the npm package, but the trained-data file (~4MB) is never part
// of the npm publish for any OCR engine's language data — Tesseract.js's own
// default configuration fetches it from a CDN on first use and the browser
// caches it after that. This file uses that default configuration rather than
// bundling a multi-megabyte binary into the repo. In a network-restricted
// environment (this cloud sandbox included — see the Phase 4 report) that CDN
// fetch fails, which is surfaced as a normal OcrError below, not a crash.

import { createWorker } from "tesseract.js";

export const LOW_CONFIDENCE_THRESHOLD = 60; // Tesseract's 0-100 mean-confidence score

export interface OcrResult {
  text: string;
  confidence: number; // 0-100
}

export class OcrError extends Error {
  constructor(message = "Couldn't read this photo. Please try again with a clearer, well-lit shot.") {
    super(message);
    this.name = "OcrError";
  }
}

/** True when a recognition result is unreliable enough to warn the student before they confirm it. */
export function isLowConfidence(confidence: number): boolean {
  return confidence < LOW_CONFIDENCE_THRESHOLD;
}

/** Runs real OCR on a photographed-work image file. Throws OcrError on any failure. */
export async function recognizeHandwriting(file: File): Promise<OcrResult> {
  let worker: Awaited<ReturnType<typeof createWorker>> | undefined;
  try {
    // errorHandler: tesseract.js's worker reports some failures (e.g. its
    // worker script failing to load) via this callback AND as an uncaught
    // error on the page, rather than only rejecting createWorker()'s
    // promise. Supplying a handler here keeps that failure inside our own
    // try/catch below instead of surfacing as an uncaught exception.
    worker = await createWorker("eng", undefined, { errorHandler: () => undefined });
    const { data } = await worker.recognize(file);
    const text = data.text.trim();
    if (!text) throw new OcrError("We couldn't find any readable text in that photo. Please try again.");
    return { text, confidence: data.confidence };
  } catch (err) {
    if (err instanceof OcrError) throw err;
    throw new OcrError();
  } finally {
    await worker?.terminate();
  }
}
