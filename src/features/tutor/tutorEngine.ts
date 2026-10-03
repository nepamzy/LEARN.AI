import { callProxy, isAiConfigured } from "../../lib/ai/proxyClient";
import { AiUnavailableError, type TutorRequest, type TutorTone, type TutorTurn } from "../../lib/ai/types";

export type { TutorTone, TutorTurn } from "../../lib/ai/types";

function pick(a: string, b: string, tone: TutorTone) {
  return tone === "concise" ? a : b;
}

// Canned replies used when no AI proxy is configured, so the chat still works offline.
function cannedReply(userMessage: string, tone: TutorTone): string {
  const msg = userMessage.toLowerCase();

  if (msg.includes("simultaneous")) {
    return pick(
      "Add or subtract the two equations to eliminate one variable, then solve for the other and substitute back.",
      "Let's think it through together: if you add both equations, does one of the letters cancel out? Try it and tell me what you get.",
      tone
    );
  }
  if (msg.includes("wrong") || msg.includes("mistake")) {
    return pick(
      "Looking at your last attempt, the method was right but the sign flipped during substitution — that's a careless slip, not a concept gap.",
      "Let's look at it together. Walk me through the step where you substituted y back in — what did you write?",
      tone
    );
  }
  if (msg.includes("plan") || msg.includes("revision")) {
    return "Based on where you are, I'd suggest: 20 minutes on Stoichiometry (your newest weak spot), a quick Genetics flashcard review, and one timed Algebra set before the weekend. Want me to add these to today's plan?";
  }
  if (msg.includes("quiz") || msg.includes("test me")) {
    return "Happy to. Quick one: what's the first step when solving two simultaneous equations by elimination?";
  }
  return pick(
    "Here's the short version: identify what's being asked, pick the relevant method, and check your answer makes sense in context.",
    "That's a good question. Before I explain — what do you think happens first, based on what we covered last time?",
    tone
  );
}

const HISTORY_TURNS = 6;

export async function generateTutorReply(message: string, tone: TutorTone, history: TutorTurn[] = []): Promise<string> {
  if (!isAiConfigured()) {
    await new Promise((resolve) => setTimeout(resolve, 900));
    return cannedReply(message, tone);
  }

  const request: TutorRequest = {
    message,
    tone,
    history: history.slice(-HISTORY_TURNS),
  };
  const { text } = await callProxy<{ text: string }>("tutor", request);
  if (typeof text !== "string" || !text.trim()) throw new AiUnavailableError("Empty tutor reply");
  return text;
}

export const promptSuggestions = [
  "Explain simultaneous equations simply",
  "Why was my answer wrong?",
  "Help me plan revision for this week",
  "Quiz me on biology",
];

export const DAILY_FREE_MESSAGE_LIMIT = 8;
