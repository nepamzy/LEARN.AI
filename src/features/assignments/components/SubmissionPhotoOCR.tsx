import { useRef, useState } from "react";
import { Camera, AlertCircle, AlertTriangle, Loader2, CheckCircle2, RotateCcw } from "lucide-react";
import { TextArea } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { recognizeHandwriting, isLowConfidence, OcrError } from "../../../lib/ocr/ocrEngine";

interface Props {
  onConfirmed: (text: string) => void;
}

export function SubmissionPhotoOCR({ onConfirmed }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "reading" | "ready" | "confirmed" | "error">("idle");
  const [extracted, setExtracted] = useState("");
  const [lowConfidence, setLowConfidence] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [lastFile, setLastFile] = useState<File | null>(null);

  async function runOcr(f: File) {
    setStatus("reading");
    try {
      const { text, confidence } = await recognizeHandwriting(f);
      setExtracted(text);
      setLowConfidence(isLowConfidence(confidence));
      setStatus("ready");
    } catch (err) {
      setErrorMessage(err instanceof OcrError ? err.message : "Couldn't read this photo. Please try again with a clearer, well-lit shot.");
      setStatus("error");
    }
  }

  function handleFile(files: FileList | null) {
    const f = files?.[0];
    if (!f) return;
    setPreviewUrl(URL.createObjectURL(f));
    setLastFile(f);
    void runOcr(f);
  }

  if (status === "idle") {
    return (
      <div className="space-y-2">
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border-strong px-4 py-8 text-center hover:border-sage transition-colors"
        >
          <Camera className="size-6 text-ink-secondary" aria-hidden="true" />
          <span className="text-sm font-semibold text-ink">Take or upload a photo of your work</span>
          <span className="text-xs text-ink-secondary">Make sure writing is clear and well-lit</span>
        </button>
        <input ref={inputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFile(e.target.files)} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {previewUrl && (
        <img src={previewUrl} alt="Uploaded photo of your handwritten work" className="w-full max-h-56 object-contain rounded-xl border border-border bg-[#F1F0EB]" />
      )}

      {status === "reading" && (
        <div className="flex items-center gap-2.5 text-sm font-medium text-ink-secondary">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" /> Reading your handwriting…
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center gap-3 rounded-xl border border-error/15 bg-error-surface text-error px-4 py-3 text-[14px] font-medium">
          <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
          <span className="flex-1">{errorMessage}</span>
          <Button size="sm" variant="secondary" onClick={() => lastFile && void runOcr(lastFile)}>
            <RotateCcw className="size-3.5" aria-hidden="true" /> Try again
          </Button>
        </div>
      )}

      {(status === "ready" || status === "confirmed") && (
        <div className="space-y-2.5">
          {lowConfidence ? (
            <div className="flex items-start gap-2 text-sm text-amber bg-amber-surface rounded-xl px-3.5 py-3">
              <AlertTriangle className="size-4 shrink-0 mt-0.5" aria-hidden="true" />
              <span>This didn't read clearly — please check it carefully before confirming.</span>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-sm text-ink-secondary bg-info-surface rounded-xl px-3.5 py-3">
              <AlertCircle className="size-4 shrink-0 mt-0.5 text-info" aria-hidden="true" />
              <span>Here's what we read from your handwriting. Handwriting recognition can make mistakes — please check it over and fix anything that's wrong before submitting.</span>
            </div>
          )}
          <TextArea
            label="Confirm or correct the extracted text"
            rows={6}
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
