import { useRef, useState } from "react";
import { Send, ImagePlus, Info, WifiOff, AlertTriangle, RotateCcw, GraduationCap } from "lucide-react";
import { tutorIntro, amara } from "../../lib/mockData";
import type { ChatMessage } from "../../lib/types";
import { effectiveEducationLevel, UNIVERSITY_COMING_SOON } from "../../lib/educationLevel";
import { ChatBubble } from "./components/ChatBubble";
import { TypingIndicator } from "./components/TypingIndicator";
import { ToneSelector } from "./components/ToneSelector";
import { generateTutorReply, promptSuggestions, DAILY_FREE_MESSAGE_LIMIT, type TutorTone } from "./tutorEngine";
import { AiRateLimitError } from "../../lib/ai/types";
import { Banner } from "../../components/ui/Banner";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { Card } from "../../components/ui/Card";
import { useAppState } from "../../state/useAppState";
import { useToast } from "../../components/ui/useToast";

export function TutorPage() {
  const { sync, prefs } = useAppState();
  const { show } = useToast();
  const [messages, setMessages] = useState<ChatMessage[]>(tutorIntro);
  const [input, setInput] = useState("");
  const [tone, setTone] = useState<TutorTone>("guided");
  const [typing, setTyping] = useState(false);
  const [failed, setFailed] = useState(false);
  // Distinct from `failed`: the server-side Phase 4 rate limit was hit, as
  // opposed to a generic/transient failure. Separate from `rateLimited`
  // below, which is the existing client-side free-tier UX limit.
  const [serverLimitReached, setServerLimitReached] = useState(false);
  const [messagesSentToday, setMessagesSentToday] = useState(3);
  const listRef = useRef<HTMLDivElement>(null);

  const level = effectiveEducationLevel(prefs.educationLevel, amara.educationLevel);
  const universityCourses = prefs.universityProfile?.courses ?? [];
  // Decision, stated plainly: with multiple courses, one is "active" at a
  // time via the selector below, defaulting to the first added. Switching
  // changes which course frames the NEXT message sent — it doesn't retag
  // messages already in the thread.
  const [activeCourseId, setActiveCourseId] = useState<string | undefined>(() => universityCourses[0]?.id);
  const activeCourse = universityCourses.find((c) => c.id === activeCourseId) ?? universityCourses[0];

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
    setServerLimitReached(false);
    setTyping(true);
    setMessagesSentToday((n) => n + 1);
    scrollToBottom();

    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    generateTutorReply(text.trim(), tone, history, level, activeCourse?.name)
      .then((content) => {
        const reply: ChatMessage = {
          id: crypto.randomUUID(),
          role: "tutor",
          content,
          timestamp: new Date().toISOString(),
        };
        setMessages((m) => [...m, reply]);
        scrollToBottom();
      })
      .catch((err) => {
        if (err instanceof AiRateLimitError) setServerLimitReached(true);
        else setFailed(true);
      })
      .finally(() => setTyping(false));
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

  // Phase 7b: University now gets the real chat (§5) — only a genuinely
  // course-less university account (shouldn't happen post-onboarding, since
  // UniversityCoursesStep requires at least one, but possible via a manual
  // prefs override) falls back to the honest notice instead of a broken chat.
  if (level === "university" && universityCourses.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<GraduationCap className="size-6" aria-hidden="true" />}
          title={UNIVERSITY_COMING_SOON.title}
          description={UNIVERSITY_COMING_SOON.description}
        />
      </Card>
    );
  }

  return (
    <div className="pb-4 pt-2 flex flex-col h-[calc(100vh-7rem)] lg:h-[calc(100vh-6rem)]">
      <Banner tone="info" icon={<Info className="size-4 shrink-0" aria-hidden="true" />} className="mb-3">
        {level === "university"
          ? `Tutoring for ${activeCourse?.name}. This is study guidance, not official course material.`
          : "This explanation is study guidance. Check with your teacher for high-stakes submissions."}
      </Banner>

      {level === "university" && universityCourses.length > 1 && (
        <div className="mb-3">
          <label htmlFor="course-select" className="sr-only">
            Active course
          </label>
          <select
            id="course-select"
            value={activeCourse?.id}
            onChange={(e) => setActiveCourseId(e.target.value)}
            className="w-full rounded-xl border border-border-strong px-3.5 py-2.5 text-[15px] bg-surface focus:border-sage transition-colors"
          >
            {universityCourses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

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
        {serverLimitReached && (
          <div className="flex items-center gap-2 text-sm text-amber bg-amber-surface rounded-xl px-4 py-3">
            <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
            <span className="flex-1">You've reached today's tutor message limit — try again tomorrow.</span>
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
