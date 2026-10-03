import { useRef, useState } from "react";
import { Send, ImagePlus, Info, WifiOff, AlertTriangle, RotateCcw } from "lucide-react";
import { tutorIntro } from "../../lib/mockData";
import type { ChatMessage } from "../../lib/types";
import { ChatBubble } from "./components/ChatBubble";
import { TypingIndicator } from "./components/TypingIndicator";
import { ToneSelector } from "./components/ToneSelector";
import { generateTutorReply, promptSuggestions, DAILY_FREE_MESSAGE_LIMIT, type TutorTone } from "./tutorEngine";
import { Banner } from "../../components/ui/Banner";
import { Button } from "../../components/ui/Button";
import { useAppState } from "../../state/AppStateContext";
import { useToast } from "../../components/ui/Toast";

export function TutorPage() {
  const { sync } = useAppState();
  const { show } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>(tutorIntro);
  const [input, setInput] = useState("");
  const [tone, setTone] = useState<TutorTone>("guided");
  const [typing, setTyping] = useState(false);
  const [failed, setFailed] = useState(false);
  const [messagesSentToday, setMessagesSentToday] = useState(3);
  const listRef = useRef<HTMLDivElement>(null);

  const isOffline = sync.status === "offline";
  const rateLimited = messagesSentToday >= DAILY_FREE_MESSAGE_LIMIT;

  function scrollToBottom() {
    requestAnimationFrame(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }));
  }

  function sendMessage(text: string) {
    if (!text.trim() || isOffline || rateLimited) return;
    const studentMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "student",
      content: text.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages((m) => [...m, studentMsg]);
    setInput("");
    setFailed(false);
    setTyping(true);
    setMessagesSentToday((n) => n + 1);
    scrollToBottom();

    setTimeout(() => {
      setTyping(false);
      const shouldFail = Math.random() < 0.08;
      if (shouldFail) {
        setFailed(true);
        return;
      }
      const reply: ChatMessage = {
        id: crypto.randomUUID(),
        role: "tutor",
        content: generateTutorReply(text, tone),
        timestamp: new Date().toISOString(),
      };
      setMessages((m) => [...m, reply]);
      scrollToBottom();
    }, 1100);
  }

  function handleResponseAction(action: string) {
    const labels: Record<string, string> = {
      differently: "Here's another way to think about it: picture each equation as a balance scale, and you're figuring out what's on each side.",
      simpler: "In short: combine the two equations so one letter disappears, then solve what's left.",
      example: "Example: 2x + y = 11 and x − y = 1. Adding them gives 3x = 12, so x = 4, then y = 3.",
      test: "Okay — quick one: if x + y = 7 and x − y = 1, what's x?",
    };
    const reply: ChatMessage = {
      id: crypto.randomUUID(),
      role: "tutor",
      content: labels[action] ?? "Let me know what would help most.",
      timestamp: new Date().toISOString(),
    };
    setMessages((m) => [...m, reply]);
    scrollToBottom();
  }

  return (
    <div className="pb-4 pt-2 flex flex-col h-[calc(100vh-7rem)] lg:h-[calc(100vh-6rem)]">
      <Banner tone="info" icon={<Info className="size-4 shrink-0" aria-hidden="true" />} className="mb-3">
        This explanation is study guidance. Check with your teacher for high-stakes submissions.
      </Banner>

      <div className="mb-3">
        <ToneSelector value={tone} onChange={setTone} />
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto space-y-4 pr-1 -mr-1">
        {messages.map((m) => (
          <ChatBubble key={m.id} message={m} onAction={handleResponseAction} />
        ))}
        {typing && <TypingIndicator />}
        {failed && (
          <div className="flex items-center gap-2 text-sm text-error bg-error-surface rounded-xl px-4 py-3">
            <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
            <span className="flex-1">Astra couldn't respond just now.</span>
            <button
              onClick={() => sendMessage(messages[messages.length - 1]?.content ?? "")}
              className="font-semibold inline-flex items-center gap-1 hover:underline"
            >
              <RotateCcw className="size-3.5" aria-hidden="true" /> Retry
            </button>
          </div>
        )}

        {messages.length <= 1 && !typing && (
          <div className="flex flex-wrap gap-2 pt-2">
            {promptSuggestions.map((p) => (
              <button
                key={p}
                onClick={() => sendMessage(p)}
                className="text-sm font-medium text-ink bg-surface border border-border-strong rounded-pill px-3.5 py-2 hover:border-sage hover:bg-sage-surface transition-colors"
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {isOffline ? (
        <Banner tone="neutral" icon={<WifiOff className="size-4 shrink-0" aria-hidden="true" />} className="mt-3">
          AI Tutor needs an internet connection. Your saved explanations are still available in Revision.
        </Banner>
      ) : rateLimited ? (
        <Banner
          tone="amber"
          icon={<AlertTriangle className="size-4 shrink-0" aria-hidden="true" />}
          className="mt-3"
          action={
            <Button size="sm" onClick={() => show("Upgrade flow isn't wired up in this preview.", "info")}>
              Upgrade
            </Button>
          }
        >
          You've reached today's free tutor messages. Resets tomorrow.
        </Banner>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="mt-3 flex items-end gap-2"
        >
          <button
            type="button"
            onClick={() => show("Photo upload for handwritten work is coming soon.", "info")}
            aria-label="Upload a photo of handwritten work (beta)"
            className="size-11 shrink-0 rounded-xl border border-border-strong text-ink-secondary hover:border-sage hover:text-sage flex items-center justify-center transition-colors"
            title="Upload handwritten work — coming soon"
          >
            <ImagePlus className="size-5" aria-hidden="true" />
          </button>
          <label htmlFor="tutor-input" className="sr-only">
            Message Astra
          </label>
          <input
            id="tutor-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Astra anything about what you're studying…"
            className="flex-1 min-h-11 rounded-xl border border-border-strong px-3.5 py-2.5 text-[16px] bg-surface focus:border-sage transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            aria-label="Send message"
            className="size-11 shrink-0 rounded-xl bg-sage text-white flex items-center justify-center disabled:bg-border disabled:text-ink-secondary transition-colors"
          >
            <Send className="size-5" aria-hidden="true" />
          </button>
        </form>
      )}
    </div>
  );
}
