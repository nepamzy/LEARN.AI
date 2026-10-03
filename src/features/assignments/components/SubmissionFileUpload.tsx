import { useRef, useState } from "react";
import { FileText, UploadCloud, X, AlertTriangle } from "lucide-react";

const ACCEPTED = [".pdf", ".doc", ".docx", ".txt"];
const MAX_SIZE_MB = 10;

interface Props {
  onFileReady: (file: File | null) => void;
}

export function SubmissionFileUpload({ onFileReady }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFiles(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    const ext = "." + f.name.split(".").pop()?.toLowerCase();
    if (!ACCEPTED.includes(ext)) {
      setError(`"${ext}" files aren't supported. Please upload a PDF, Word document, or text file.`);
      setFile(null);
      onFileReady(null);
      return;
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`That file is larger than the ${MAX_SIZE_MB}MB limit. Try compressing it or splitting it up.`);
      setFile(null);
      onFileReady(null);
      return;
    }
    setError(null);
    setFile(f);
    onFileReady(f);
  }

  if (file) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-border-strong bg-surface px-4 py-3">
        <FileText className="size-5 text-sage shrink-0" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-ink truncate">{file.name}</p>
          <p className="text-xs text-ink-secondary">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
        </div>
        <button
          onClick={() => {
            setFile(null);
            onFileReady(null);
          }}
          aria-label="Remove file"
          className="size-8 flex items-center justify-center rounded-full text-ink-secondary hover:bg-error-surface hover:text-error transition-colors"
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={() => inputRef.current?.click()}
        className="w-full flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border-strong px-4 py-8 text-center hover:border-sage transition-colors"
      >
        <UploadCloud className="size-6 text-ink-secondary" aria-hidden="true" />
        <span className="text-sm font-semibold text-ink">Tap to upload a file</span>
        <span className="text-xs text-ink-secondary">PDF, Word, or text · up to {MAX_SIZE_MB}MB</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="hidden"
        aria-label="Upload assignment file"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {error && (
        <p className="flex items-start gap-1.5 text-sm text-error font-medium" role="alert">
          <AlertTriangle className="size-4 shrink-0 mt-0.5" aria-hidden="true" /> {error}
        </p>
      )}
    </div>
  );
}
