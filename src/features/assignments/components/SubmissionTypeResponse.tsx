import { useEffect, useState } from "react";
import { TextArea } from "../../../components/ui/Input";
import { saveLocal, loadLocal } from "../../../lib/storage";
import { CheckCircle2 } from "lucide-react";

export function SubmissionTypeResponse({ assignmentId, onChange }: { assignmentId: string; onChange: (text: string) => void }) {
  const draftKey = `assignmentDraft:${assignmentId}`;
  const [text, setText] = useState(() => loadLocal(draftKey, ""));
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    onChange(text);
    if (!text) return;
    const t = setTimeout(() => {
      saveLocal(draftKey, text);
      setSavedAt(new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }));
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  return (
    <div className="space-y-2">
      <TextArea
        label="Your response"
        rows={10}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write your answer here…"
        hint={`${text.trim().split(/\s+/).filter(Boolean).length} words`}
      />
      {savedAt && (
        <p className="flex items-center gap-1.5 text-xs text-ink-secondary">
          <CheckCircle2 className="size-3.5 text-success" aria-hidden="true" /> Draft saved at {savedAt}
        </p>
      )}
    </div>
  );
}
