/**
 * IdentitySettings.ts
 * Central User Identity & AI Personality Profile Manager for JARVIS OS.
 * Maintains user designation, focus domain, persona presets, formality/verbosity ratings,
 * and custom system directives. Formats and injects state directly into LLM system prompts.
 */

export interface UserIdentityState {
  userName: string;
  focusDomain: string;
}

export interface AIPersonalityState {
  personaPreset: 'JARVIS' | 'FRIDAY' | 'HERMES' | 'CUSTOM';
  formality: number; // 1 (Casual) to 5 (Tactical Protocol)
  verbosity: number; // 1 (Ultra-Concise) to 5 (Exhaustive)
  customInstructions: string;
}

export interface CombinedIdentityProfile {
  identity: UserIdentityState;
  personality: AIPersonalityState;
}

type IdentitySettingsListener = (profile: CombinedIdentityProfile) => void;

class IdentitySettingsManager {
  private identityKey = 'jarvis_user_identity';
  private personalityKey = 'jarvis_ai_personality';
  private listeners: Set<IdentitySettingsListener> = new Set();

  private profile: CombinedIdentityProfile = {
    identity: {
      userName: 'Commander',
      focusDomain: 'Software & Systems Architect',
    },
    personality: {
      personaPreset: 'JARVIS',
      formality: 4,
      verbosity: 3,
      customInstructions: 'Address the user as Commander. Prioritize technical precision, actionable steps, and structured code snippets.',
    },
  };

  constructor() {
    this.loadPersistedSettings();
  }

  private loadPersistedSettings() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const storedIdentity = localStorage.getItem(this.identityKey);
        if (storedIdentity) {
          this.profile.identity = { ...this.profile.identity, ...JSON.parse(storedIdentity) };
        }
        const storedPersonality = localStorage.getItem(this.personalityKey);
        if (storedPersonality) {
          this.profile.personality = { ...this.profile.personality, ...JSON.parse(storedPersonality) };
        }
      }
    } catch (err) {
      console.warn('[IdentitySettings] Failed to load local storage profile:', err);
    }
  }

  private persistLocal() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(this.identityKey, JSON.stringify(this.profile.identity));
        localStorage.setItem(this.personalityKey, JSON.stringify(this.profile.personality));
      }
    } catch (_) {}
  }

  private notify() {
    this.persistLocal();
    const current = this.getState();
    this.listeners.forEach((l) => {
      try {
        l(current);
      } catch (err) {
        console.error('[IdentitySettings] Listener error:', err);
      }
    });
  }

  public getState(): CombinedIdentityProfile {
    return {
      identity: { ...this.profile.identity },
      personality: { ...this.profile.personality },
    };
  }

  public subscribe(listener: IdentitySettingsListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public updateIdentity(partial: Partial<UserIdentityState>) {
    this.profile.identity = { ...this.profile.identity, ...partial };
    this.notify();
  }

  public updatePersonality(partial: Partial<AIPersonalityState>) {
    this.profile.personality = { ...this.profile.personality, ...partial };
    this.notify();
  }

  public async saveToDurableBackend(): Promise<boolean> {
    this.persistLocal();
    try {
      const response = await fetch('/api/settings/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identityProfile: this.profile,
          timestamp: Date.now(),
        }),
      });
      if (response.ok) {
        console.log('[IdentitySettings] Persisted to durable backend.');
        return true;
      }
    } catch (err) {
      console.warn('[IdentitySettings] Durable backend save fallback to localStorage:', err);
    }
    return true;
  }

  /**
   * Generates explicit, structured system directives to be prepended to all LLM requests.
   */
  public getFormattedSystemInstructions(): string {
    const { userName, focusDomain } = this.profile.identity;
    const { personaPreset, formality, verbosity, customInstructions } = this.profile.personality;

    const userTitle = userName && userName.trim() ? userName.trim() : 'Commander';
    const domainText = focusDomain && focusDomain.trim() ? focusDomain.trim() : 'Systems Architect';

    let personaInstructions = '';
    if (personaPreset === 'JARVIS') {
      personaInstructions = `You are J.A.R.V.I.S., an advanced, highly formal, and precision-focused AI OS assistant. Address the user as "${userTitle}". Maintain strict tactical protocol, high technical precision, structured analysis, and clean executable code.`;
    } else if (personaPreset === 'FRIDAY') {
      personaInstructions = `You are F.R.I.D.A.Y., an intuitive, conversational, and witty AI assistant. Address the user as "${userTitle}". Adopt an engaging, conversational tone with pragmatic answers and light wit when appropriate.`;
    } else if (personaPreset === 'HERMES') {
      personaInstructions = `You are H.E.R.M.E.S., an ultra-concise data specialist mode. Address the user as "${userTitle}". ELIMINATE ALL PLEASANTRIES, SMALL TALK, FILLER WORDS, AND INTRO/OUTRO GREETINGS. Deliver direct, bulleted data, ultra-short sentences, and exact code diffs.`;
    } else {
      personaInstructions = `You are an AI OS assistant. Address the user as "${userTitle}". Focus domain: ${domainText}.`;
    }

    let formalityRule = '';
    if (formality >= 5) {
      formalityRule = `FORMALITY LEVEL 5/5: Ultra-formal, strict tactical protocol, military-grade discipline. Avoid casual slang or informal phrases entirely.`;
    } else if (formality >= 4) {
      formalityRule = `FORMALITY LEVEL 4/5: Formal, professional, structured, and technical tone.`;
    } else if (formality >= 3) {
      formalityRule = `FORMALITY LEVEL 3/5: Balanced, professional, and clear tone.`;
    } else if (formality >= 2) {
      formalityRule = `FORMALITY LEVEL 2/5: Conversational, friendly, and approachable tone.`;
    } else {
      formalityRule = `FORMALITY LEVEL 1/5: Casual, relaxed, informal, and direct tone.`;
    }

    let verbosityRule = '';
    if (verbosity >= 5) {
      verbosityRule = `VERBOSITY LEVEL 5/5: Exhaustive, deep-dive analysis covering all technical details and edge cases.`;
    } else if (verbosity >= 4) {
      verbosityRule = `VERBOSITY LEVEL 4/5: Detailed and comprehensive explanation.`;
    } else if (verbosity >= 3) {
      verbosityRule = `VERBOSITY LEVEL 3/5: Balanced and concise.`;
    } else if (verbosity >= 2) {
      verbosityRule = `VERBOSITY LEVEL 2/5: Brief, short sentences, straight to the point.`;
    } else {
      verbosityRule = `VERBOSITY LEVEL 1/5: Ultra-concise. Maximum 1-3 short bullet points. Eliminate all extra explanation.`;
    }

    const customText = customInstructions && customInstructions.trim() ? customInstructions.trim() : '';

    return [
      `[SYSTEM MANDATE: USER IDENTITY & PERSONALITY DIRECTIVES]`,
      `1. USER DESIGNATION: You MUST address the user as "${userTitle}". Domain: ${domainText}.`,
      `2. PERSONA ROLE: ${personaInstructions}`,
      `3. FORMALITY PROTOCOL: ${formalityRule}`,
      `4. VERBOSITY CAP: ${verbosityRule}`,
      customText ? `5. CUSTOM SYSTEM DIRECTIVES (MANDATORY VERBATIM REQUIREMENT):\n${customText}` : '',
      `[END SYSTEM MANDATE]`,
    ].filter(Boolean).join('\n\n');
  }
}

export const identitySettings = new IdentitySettingsManager();
export default identitySettings;
