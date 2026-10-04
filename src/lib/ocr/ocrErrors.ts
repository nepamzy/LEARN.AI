// OCR error types and the recognition time bound. Kept free of Tesseract
// imports so scripts/verify-ai.ts can test the timeout under plain Node.

export const OCR_TIMEOUT_MS = 30_000;

export class OcrError extends Error {
  constructor(message = "Couldn't read this photo. Please try again with a clearer, well-lit shot.") {
    super(message);
    this.name = "OcrError";
  }
}

export class OcrTimeoutError extends OcrError {
  constructor() {
    super("This is taking too long to read the photo. Check your connection and try again.");
    this.name = "OcrTimeoutError";
  }
}

/** Rejects with OcrTimeoutError if `task` has not settled within `ms`. */
export function withOcrTimeout<T>(task: Promise<T>, ms = OCR_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new OcrTimeoutError()), ms);
  });
  return Promise.race([task, timeout]).finally(() => clearTimeout(timer));
}
