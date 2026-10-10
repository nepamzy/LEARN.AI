import { useEffect, useRef, useState } from "react";
import { Mic, Square } from "lucide-react";
import { getRecognitionConstructor, isVoiceInputSupported, type SpeechRecognitionLike } from "../voiceSupport";

// Phase 8 §1d: voice INPUT only — transcribed speech feeds the existing
// text pipeline unchanged (the same #tutor-input value sendMessage() already
// sends). Voice OUTPUT (reading replies aloud) is a separate, larger
// addition (choosing/paying for a TTS voice, playback controls, interrupt
// handling) and was deliberately not built this phase — see the Phase 8
// report for why input was the lower-risk, more clearly scoped choice.
//
// Uses the browser's native Web Speech API (SpeechRecognition), not a
// server endpoint: no new secret, no new network dependency beyond what
// the browser's own engine needs. Honestly, that support is uneven —
// solid in Chrome/Edge (desktop and Android), ABSENT in Firefox and in
// Safari unless a user has enabled an experimental flag. This component
// feature-detects (isVoiceInputSupported, voiceSupport.ts) and renders
// NOTHING when unsupported, rather than a disabled button with no
// explanation. It also needs network access to the browser's own speech
// recognition backend (e.g. Google's, in Chrome) — this sandbox's network
// policy blocks that, so real recognition could not be exercised
// end-to-end in this environment; see the Phase 8 report.

type RecognitionState = "idle" | "listening" | "error";

export function VoiceInputButton({ onTranscript, disabled }: { onTranscript: (text: string) => void; disabled?: boolean }) {
  const [state, setState] = useState<RecognitionState>("idle");
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    return () => recognitionRef.current?.stop();
  }, []);

  if (!isVoiceInputSupported()) return null;

  function start() {
    const Ctor = getRecognitionConstructor();
    if (!Ctor) return;
    const recognition = new Ctor();
    recognition.lang = "en-US"; // broadest cross-browser engine support; see header comment
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript;
      if (transcript) onTranscript(transcript);
    };
    recognition.onerror = () => setState("error");
    recognition.onend = () => setState("idle");
    recognitionRef.current = recognition;
    setState("listening");
    recognition.start();
  }

  function stop() {
    recognitionRef.current?.stop();
    setState("idle");
  }

  return (
    <button
      type="button"
      onClick={state === "listening" ? stop : start}
      disabled={disabled}
      aria-label={state === "listening" ? "Stop voice input" : "Speak your question"}
      title={state === "listening" ? "Stop" : "Speak your question"}
      className={`size-11 shrink-0 rounded-xl border flex items-center justify-center transition-colors ${
        state === "listening"
          ? "border-error bg-error-surface text-error animate-pulse"
          : "border-border-strong text-ink-secondary hover:border-sage hover:text-sage"
      }`}
    >
      {state === "listening" ? <Square className="size-4" aria-hidden="true" /> : <Mic className="size-5" aria-hidden="true" />}
    </button>
  );
}
