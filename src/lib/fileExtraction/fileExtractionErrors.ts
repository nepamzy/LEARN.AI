// File-text-extraction error types and the extraction time bound. Kept free
// of pdfjs-dist/mammoth imports so scripts/verify-ai.ts can test the timeout
// under plain Node — same split as ocrErrors.ts.

export const FILE_EXTRACTION_TIMEOUT_MS = 30_000;

export class FileExtractionError extends Error {
  constructor(message = "Couldn't read that file. Please try a different file, or type your answer instead.") {
    super(message);
    this.name = "FileExtractionError";
  }
}

export class FileExtractionTimeoutError extends FileExtractionError {
  constructor() {
    super("This is taking too long to read the file. Check your connection and try again.");
    this.name = "FileExtractionTimeoutError";
  }
}

/** Rejects with FileExtractionTimeoutError if `task` has not settled within `ms`. */
export function withExtractionTimeout<T>(task: Promise<T>, ms = FILE_EXTRACTION_TIMEOUT_MS): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new FileExtractionTimeoutError()), ms);
  });
  return Promise.race([task, timeout]).finally(() => clearTimeout(timer));
}
