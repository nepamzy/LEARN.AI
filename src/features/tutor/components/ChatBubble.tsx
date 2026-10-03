import { useState } from "react";
import { Compass, Sparkles, Volume2, Wand2, HelpCircle, BookmarkPlus, ListChecks } from "lucide-react";
import type { ChatMessage } from "../../../lib/types";
import { cx } from "../../../lib/utils";
import { useToast } from "../../../components/ui/Toast";

interface Props {
  message: ChatMessage;
  onAction: (action: string) => void;
}

export function ChatBubble({ message, onAction }: Props) {
  const { show } = useToast();
  const [saved, setSaved] = useState(false);
  const isStudent = message.role === "student";

  if (isStudent) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] sm:max-w-[70%] bg-sage text-white rounded-2xl rounded-tr-sm px-4 py-2.5 text-[15px] leading-relaxed">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2.5 items-start">
      <span className="size-8 rounded-full bg-sage-surface text-sage flex items-center justify-center shrink-0 mt-0.5">
        <Compass className="size-4" aria-hidden="true" />
      </span>
      <div className="max-w-[85%] sm:max-w-[70%] space-y-2">
        <div
          className={cx(
            "rounded-2xl rounded-tl-sm px-4 py-2.5 text-[15px] leading-relaxed",
            message.type === "worked-steps" ? "bg-sage-surface text-ink border border-sage/20" : "bg-surface border border-border text-ink"
          )}
        >
          {message.content}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <ChatAction icon={Wand2} label="Explain differently" onClick={() => onAction("differently")} />
          <ChatAction icon={HelpCircle} label="Make it simpler" onClick={() => onAction("simpler")} />
          <ChatAction icon={Sparkles} label="Give an example" onClick={() => onAction("example")} />
          <ChatAction icon={ListChecks} label="Test me" onClick={() => onAction("test")} />
          <ChatAction icon={Volume2} label="Read aloud" onClick={() => show("Reading aloud isn't available in this preview yet.", "info")} />
          <ChatAction
            icon={BookmarkPlus}
            label={saved ? "Saved" : "Save to revision"}
            onClick={() => {
              setSaved(true);
              show("Saved to your revision queue.", "success");
            }}
          />
        </div>
      </div>
    </div>
  );
}

function ChatAction({ icon: Icon, label, onClick }: { icon: typeof Sparkles; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-secondary hover:text-sage hover:bg-sage-surface rounded-pill px-2.5 py-1.5 border border-border transition-colors"
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {label}
    </button>
  );
}
