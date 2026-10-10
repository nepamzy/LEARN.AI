// Split out of VoiceInputButton.tsx so that file exports only the
// component (oxlint's react/only-export-components: fast refresh only
// works cleanly when a file exports just a component). Also lets
// scripts/verify-ai.ts import just the feature-detection function, and
// keeps the one ambient SpeechRecognition typing in one place.
export interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  }
}

export function getRecognitionConstructor(): (new () => SpeechRecognitionLike) | undefined {
  if (typeof window === "undefined") return undefined;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition;
}

export function isVoiceInputSupported(): boolean {
  return !!getRecognitionConstructor();
}
