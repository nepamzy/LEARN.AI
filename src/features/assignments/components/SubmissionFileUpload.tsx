import { useRef, useState } from "react";
import { FileText, UploadCloud, X, AlertCircle, AlertTriangle, Loader2, CheckCircle2, RotateCcw } from "lucide-react";
import { TextArea } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { extractTextFromFile } from "../../../lib/fileExtraction/fileTextExtraction";
import { FileExtractionError } from "../../../lib/fileExtraction/fileExtractionErrors";

// Phase 7d §1b: reads the file for real and lets the student confirm or
// correct the extracted text before it's submitted — the same
// read-then-confirm shape SubmissionPhotoOCR already uses for photographed
// work, so a student can catch an extraction mistake before it's graded.
// Only PDF, Word (.docx), and plain text are accepted — legacy .doc is not,
// because nothing in this app can reliably read it (see
// fileTextExtraction.ts); accepting a format we know we can't extract and
// failing only later would be exactly the dishonest path this phase rules out.
const ACCEPTED = [".pdf", ".docx", ".txt"];
const MAX_SIZE_MB = 10;

interface Props {
  onConfirmed: (text: string) => void;
}

export function SubmissionFileUpload({ onConfirmed }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "reading" | "ready" | "confirmed" | "error">("idle");
  const [extracted, setExtracted] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [lastFile, setLastFile] = useState<File | null>(null);
  const [pickError, setPickError] = useState<string | null>(null);

  async function runExtraction(f: File) {
    setStatus("reading");
    try {
      const text = await extractTextFromFile(f);
      setExtracted(text);
      setStatus("ready");
    } catch (err) {
      setErrorMessage(err instanceof FileExtractionError ? err.message : "Couldn't read that file. Please try a different file, or type your answer instead.");
      setStatus("error");
    }
  }

  function handleFiles(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    const ext = "." + f.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED.includes(ext)) {
      setPickError(`"${ext}" files aren't supported. Please upload a PDF, Word (.docx), or text file.`);
      return;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setPickError(`That file is larger than the ${MAX_SIZE_MB}MB limit. Try compressing it or splitting it up.`);
      return;
    }
    setPickError(null);
    setFileName(f.name);
    setLastFile(f);
    void runExtraction(f);
  }

  if (status === "idle") {
    return (
      <div className="space-y-2">
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border-strong px-4 py-8 text-center hover:border-sage transition-colors"
        >
          <UploadCloud className="size-6 text-ink-secondary" aria-hidden="true" />
          <span className="text-sm font-semibold text-ink">Tap to upload a file</span>
          <span className="text-xs text-ink-secondary">PDF, Word (.docx), or text · up to {MAX_SIZE_MB}MB</span>
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED.join(",")}
          className="hidden"
          aria-label="Upload assignment file"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {pickError && (
          <p className="flex items-start gap-1.5 text-sm text-error font-medium" role="alert">
            <AlertTriangle className="size-4 shrink-0 mt-0.5" aria-hidden="true" /> {pickError}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {fileName && (
        <div className="flex items-center gap-3 rounded-xl border border-border-strong bg-surface px-4 py-3">
          <FileText className="size-5 text-sage shrink-0" aria-hidden="true" />
          <p className="flex-1 min-w-0 text-sm font-semibold text-ink truncate">{fileName}</p>
          <button
            onClick={() => {
              setStatus("idle");
              setFileName(null);
              setExtracted("");
              onConfirmed("");
            }}
            aria-label="Remove file"
            className="size-8 flex items-center justify-center rounded-full text-ink-secondary hover:bg-error-surface hover:text-error transition-colors"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {status === "reading" && (
        <div className="flex items-center gap-2.5 text-sm font-medium text-ink-secondary">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Reading your file…
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center gap-3 rounded-xl border border-error/15 bg-error-surface text-error px-4 py-3 text-[14px] font-medium">
          <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
          <span className="flex-1">{errorMessage}</span>
          <Button size="sm" variant="secondary" onClick={() => lastFile && void runExtraction(lastFile)}>
            <RotateCcw className="size-3.5" aria-hidden="true" /> Try again
          </Button>
        </div>
      )}

      {(status === "ready" || status === "confirmed") && (
        <div className="space-y-2.5">
          <div className="flex items-start gap-2 text-sm text-ink-secondary bg-info-surface rounded-xl px-3.5 py-3">
            <AlertCircle className="size-4 shrink-0 mt-0.5 text-info" aria-hidden="true" />
            <span>Here's the text we read from your file. Check it over and fix anything that's wrong before submitting.</span>
          </div>
          <TextArea
            label="Confirm or correct the extracted text"
            rows={8}
            value={extracted}
            onChange={(e) => setExtracted(e.target.value)}
            disabled={status === "confirmed"}
          />
          {status === "ready" ? (
            <Button
              onClick={() => {
                setStatus("confirmed");
                onConfirmed(extracted);
              }}
              disabled={!extracted.trim()}
            >
              Confirm this is correct
            </Button>
          ) : (
            <p className="flex items-center gap-1.5 text-sm font-medium text-success">
              <CheckCircle2 className="size-4" aria-hidden="true" /> Confirmed
            </p>
          )}
        </div>
      )}
    </div>
  );
}
