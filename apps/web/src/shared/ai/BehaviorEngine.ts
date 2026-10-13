import { AIPersonalityState, identitySettings } from './IdentitySettings';

export type JarvisIntent =
  | 'greeting'
  | 'command'
  | 'quick_question'
  | 'knowledge_request'
  | 'conversation'
  | 'planning'
  | 'creative'
  | 'coding'
  | 'error_recovery'
  | 'system_status'
  | 'automation'
  | 'confirmation';

export interface BehaviorDecision {
  intent: JarvisIntent;
  confidence: number;
  instructions: string;
  verbosity: number;
}

const sentenceLimit = (text: string, limit: number): string => {
  const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [];
  return sentences.slice(0, limit).join(' ').trim();
};

const removeMarkdown = (text: string): string => text
  .replace(/```[\s\S]*?```/g, ' Code is available on screen. ')
  .replace(/`([^`]+)`/g, '$1')
  .replace(/!?(?:\[([^\]]*)\]\([^)]*\))/g, '$1')
  .replace(/^\s{0,3}#{1,6}\s*/gm, '')
  .replace(/^\s*[-*+]\s+/gm, '')
  .replace(/^\s*\d+[.)]\s+/gm, '')
  .replace(/[*_~]+/g, '')
  .replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF]/gu, '')
  .replace(/([!?.,])\1+/g, '$1')
  .replace(/\s+/g, ' ')
  .trim();

class BehaviorEngine {
  public decide(input: string): BehaviorDecision {
    const prompt = input.trim().toLowerCase();
    const { personality } = identitySettings.getState();
    const { intent, confidence } = this.detectIntent(prompt);

    return {
      intent,
      confidence,
      verbosity: personality.verbosity,
      instructions: this.buildInstructions(intent, personality),
    };
  }

  public formatResponse(response: string, decision: BehaviorDecision): string {
    const text = response.trim();
    if (!text) return text;

    if (decision.verbosity <= 1) return sentenceLimit(text, 1);
    if (decision.verbosity === 2) return sentenceLimit(text, 1);
    if (decision.verbosity === 3 && decision.intent !== 'knowledge_request' && decision.intent !== 'coding') {
      return sentenceLimit(text, 2);
    }
    return text;
  }

  public formatForSpeech(text: string): string {
    return removeMarkdown(text);
  }

  public formatError(error: unknown): string {
    const message = String((error as any)?.message || error || '').toLowerCase();
    if (/fetch|network|connection|backend|timeout|provider/.test(message)) {
      return 'Unable to reach the AI backend.';
    }
    return 'Unable to complete that request.';
  }

  private detectIntent(prompt: string): Pick<BehaviorDecision, 'intent' | 'confidence'> {
    if (/^(?:yes|no|confirm|cancel|proceed|go ahead|do it|stop)$/i.test(prompt)) return { intent: 'confirmation', confidence: 0.98 };
    if (/\b(?:error|failed|not working|cannot|can't|unable|retry|connection refused)\b/i.test(prompt)) return { intent: 'error_recovery', confidence: 0.9 };
    if (/^(?:status|system status|battery|how many agents|agents status|health)$/i.test(prompt)) return { intent: 'system_status', confidence: 0.98 };
    if (/^(?:open|close|launch|start|stop|search|find|play|set|increase|decrease|turn on|turn off)\b/i.test(prompt)) return { intent: 'command', confidence: 0.94 };
    if (/\b(?:automate|schedule|send|call|message|organize|rename)\b/i.test(prompt)) return { intent: 'automation', confidence: 0.82 };
    if (/\b(?:plan|roadmap|steps|strategy|schedule)\b/i.test(prompt)) return { intent: 'planning', confidence: 0.82 };
    if (/\b(?:write|implement|debug|refactor|typescript|javascript|python|code|api|function)\b/i.test(prompt)) return { intent: 'coding', confidence: 0.85 };
    if (/\b(?:create|draft|brainstorm|story|poem|idea)\b/i.test(prompt)) return { intent: 'creative', confidence: 0.8 };
    if (/\b(?:explain|what is|what are|why|how does|compare|teach)\b/i.test(prompt)) return { intent: 'knowledge_request', confidence: 0.86 };
    if (/^(?:hi|hello|hey|good morning|good afternoon|good evening)\b/i.test(prompt)) return { intent: 'greeting', confidence: 0.98 };
    if (/^(?:how many|when|where|who|which|can|is|are|do|does)\b/i.test(prompt)) return { intent: 'quick_question', confidence: 0.7 };
    return { intent: 'conversation', confidence: 0.45 };
  }

  private buildInstructions(intent: JarvisIntent, personality: AIPersonalityState): string {
    const persona = personality.personaPreset === 'FRIDAY'
      ? 'F.R.I.D.A.Y.: friendly, relaxed, conversational, with rare light wit.'
      : personality.personaPreset === 'HERMES'
        ? 'H.E.R.M.E.S.: data-first, fast, minimal emotion, no pleasantries.'
        : 'J.A.R.V.I.S.: calm, professional, minimal, highly efficient, with rare humour.';

    const verbosity = [
      'Use one short sentence only.',
      'Use one concise sentence.',
      'Use one or two concise sentences.',
      'Use a normal explanation.',
      'Use a detailed explanation when useful.',
    ][Math.max(1, Math.min(5, personality.verbosity)) - 1];

    const policy: Record<JarvisIntent, string> = {
      greeting: 'Reply with a natural, brief greeting only. Do not offer menus or capabilities.',
      command: 'The command executor runs separately. Do not claim an action occurred unless execution feedback confirms it. If asked for an acknowledgement, keep it to the action state only.',
      quick_question: 'Answer the direct question first. Omit background unless requested.',
      knowledge_request: 'Explain clearly and accurately. Detail is appropriate only when it helps answer the request.',
      conversation: 'Respond naturally and succinctly.',
      planning: 'Give the next practical step first, then a compact plan if needed.',
      creative: 'Be helpful and direct; avoid generic preambles.',
      coding: 'Be precise. State assumptions and do not claim code was executed, created, or changed unless confirmed.',
      error_recovery: 'Stay calm. State the failure plainly and the next safe action. Never dramatize.',
      system_status: 'Give the requested status in one short factual sentence. Do not invent system state.',
      automation: 'Never claim an automation ran unless confirmed by the executor. State required confirmation or the next action.',
      confirmation: 'Confirm only what is known to be pending or completed. Never infer a completed action.',
    };

    return [
      '[JARVIS BEHAVIOR POLICY]',
      `Detected intent: ${intent}.`,
      persona,
      verbosity,
      policy[intent],
      'Truthfulness: never claim an action was created, uploaded, executed, registered, installed, or completed unless the system provided confirmation.',
      'Prefer useful work over explanation. Do not add capability lists, preambles, or unnecessary summaries.',
      '[END JARVIS BEHAVIOR POLICY]',
    ].join('\n');
  }
}

export const behaviorEngine = new BehaviorEngine();
export default behaviorEngine;
