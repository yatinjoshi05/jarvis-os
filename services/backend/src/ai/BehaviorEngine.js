const INTENTS = Object.freeze(['Greeting', 'Command', 'Quick Question', 'Knowledge Request', 'Conversation', 'Planning', 'Creative', 'Coding', 'Error Recovery', 'System Status', 'Automation', 'Confirmation']);

const compact = value => String(value || '').replace(/\s+/g, ' ').trim();
const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * Decides response behaviour around the existing provider router. It never
 * executes actions itself; execution remains owned by the current runtimes.
 */
export class BehaviorEngine {
  detectIntent(message = '') {
    const text = compact(message).toLowerCase();
    if (!text) return { intent: 'Conversation', confidence: 0.25 };
    if (/^(hi|hello|hey|good (morning|afternoon|evening))(\b|[!.,])/.test(text) && text.split(/\s+/).length <= 5) return { intent: 'Greeting', confidence: 0.98 };
    if (/(error|failed|not working|unable to|cannot |can't |issue|problem|broken)/.test(text)) return { intent: 'Error Recovery', confidence: 0.85 };
    if (/^(status|system status|battery|how many agents|agents status|health)\??$/.test(text)) return { intent: 'System Status', confidence: 0.96 };
    if (/^(yes|no|confirm|cancel|proceed|continue|do it|go ahead|ok|okay)\b/.test(text)) return { intent: 'Confirmation', confidence: 0.9 };
    if (/\b(plan|schedule|roadmap|next steps|organize)\b/.test(text)) return { intent: 'Planning', confidence: 0.82 };
    if (/\b(write|create|draft|brainstorm|poem|story|design)\b/.test(text)) return { intent: 'Creative', confidence: 0.78 };
    if (/\b(code|bug|function|typescript|javascript|python|react|api|database|sql|dockerfile)\b/.test(text)) return { intent: 'Coding', confidence: 0.82 };
    if (/^(open|close|launch|search for|find |play|pause|stop|switch to|navigate to)\b/.test(text)) return { intent: 'Command', confidence: 0.93 };
    if (/\b(automate|automation|run every|workflow)\b/.test(text)) return { intent: 'Automation', confidence: 0.82 };
    if (/^(what|who|when|where|which|how|why|can|is|are|do|does)\b/.test(text)) return { intent: text.split(/\s+/).length <= 7 ? 'Quick Question' : 'Knowledge Request', confidence: 0.7 };
    return { intent: 'Conversation', confidence: 0.45 };
  }

  normalizeSettings(settings = {}) {
    const profile = settings.identityProfile || settings.profile || settings;
    const identity = profile.identity || {};
    const personality = profile.personality || profile;
    const persona = String(personality.personaPreset || personality.personality || 'JARVIS').toUpperCase();
    return {
      persona: ['JARVIS', 'FRIDAY', 'HERMES'].includes(persona) ? persona : 'JARVIS',
      formality: clamp(Number(personality.formality) || 3, 1, 5),
      verbosity: clamp(Number(personality.verbosity) || 3, 1, 5),
      customInstructions: compact(personality.customInstructions || personality.customDirectives),
      userName: compact(identity.userName) || 'Commander',
      focusDomain: compact(identity.focusDomain),
    };
  }

  createPolicy(message, settings, action = {}) {
    const classification = this.detectIntent(message);
    const profile = this.normalizeSettings(settings);
    return { ...classification, profile, action: { executed: action.executed === true, description: compact(action.description) } };
  }

  buildSystemPrompt(policy, existingPrompt = '') {
    const { intent, confidence, profile, action } = policy;
    const persona = {
      JARVIS: 'Calm, professional, minimal, and highly efficient. Use rare humour only when it helps.',
      FRIDAY: 'Friendly, relaxed, and conversational while remaining practical.',
      HERMES: 'Ultra-concise, fast, data-first, with minimal emotion and no pleasantries.',
    }[profile.persona];
    const length = ['One short sentence maximum.', 'One sentence.', 'One or two concise sentences.', 'A normal explanation.', 'A detailed explanation.'][profile.verbosity - 1];
    const intentRule = intent === 'Knowledge Request' ? 'Detailed explanations are appropriate when useful.'
      : intent === 'Greeting' ? 'Respond naturally and briefly; do not introduce features or options.'
      : ['Command', 'Automation'].includes(intent) ? (action.executed ? 'Acknowledge only the completed action in a short sentence.' : 'Do not claim this action happened. State a limitation or pending action clearly and briefly.')
      : ['Quick Question', 'System Status', 'Confirmation'].includes(intent) ? 'Answer directly without a preamble, list, or unnecessary explanation.'
      : 'Prefer direct, useful responses over conversational filler.';
    return [existingPrompt, `JARVIS BEHAVIOUR POLICY\nIntent: ${intent} (confidence ${confidence.toFixed(2)}).\nPersona: ${profile.persona}. ${persona}\nFormality: ${profile.formality}/5.\nVerbosity: ${profile.verbosity}/5. ${length}\n${intentRule}\nTruthfulness: never claim an action was created, uploaded, executed, registered, installed, or completed unless the runtime explicitly reports it.\n${profile.customInstructions ? `User directives: ${profile.customInstructions}` : ''}`].filter(Boolean).join('\n\n');
  }

  finalizeText(text, policy) {
    let result = compact(text);
    if (!result) return 'Unable to generate a response.';
    if (!policy.action.executed && ['Command', 'Automation'].includes(policy.intent) && /\b(created|uploaded|executed|registered|installed|completed|opened|closed|launched)\b/i.test(result)) result = 'I cannot confirm that action from this interface.';
    const maxSentences = policy.profile.verbosity <= 2 ? 1 : policy.profile.verbosity === 3 ? 2 : Infinity;
    if (maxSentences !== Infinity) {
      const sentences = result.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [result];
      result = sentences.slice(0, maxSentences).join(' ').trim();
    }
    return result;
  }

  formatForSpeech(text) {
    return compact(String(text || '')
      .replace(/```[\s\S]*?```/g, ' code omitted ')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/^\s{0,3}#{1,6}\s*/gm, '')
      .replace(/^\s*[-*+]\s+/gm, '')
      .replace(/[\*_~>#|]/g, '')
      .replace(/[\p{Extended_Pictographic}\uFE0F]/gu, '')
      .replace(/([!?.,])\1+/g, '$1'));
  }
}

export const behaviorEngine = new BehaviorEngine();
export { INTENTS };
