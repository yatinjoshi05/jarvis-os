import { routeAICompletion } from '../ai/router.js';
import { validateApiKey, checkNvidiaReachability, maskKey } from '../ai/providers.js';
import { applyPersonality } from '../ai/personality.js';
import { SettingsService } from './SettingsService.js';

/**
 * BrainService — Public API for AI Routing, Providers, Persona & Reasoning
 */
export class BrainService {
  /**
   * Dispatch chat completion request to optimal AI provider
   */
  static async complete({ prompt, messages, systemPrompt, preferredProvider, behaviorSettings, action }) {
    try {
      console.log(`[BrainService] Dispatching completion request...`);
      const settings = behaviorSettings || await SettingsService.getSettings();
      return await routeAICompletion({ prompt, messages, systemPrompt, preferredProvider, behaviorSettings: settings, action });
    } catch (err) {
      console.error(`[BrainService] Completion failed:`, err.message);
      throw new Error(`BrainService Error: ${err.message}`);
    }
  }

  /**
   * Format message prompt using JARVIS personality instructions
   */
  static formatPersona(messages, systemOverride) {
    try {
      return applyPersonality(messages, systemOverride);
    } catch (err) {
      console.error(`[BrainService] Persona formatting error:`, err.message);
      return messages;
    }
  }

  /**
   * Validate API key for a specified provider
   */
  static async validateProviderKey(providerId, rawKey, baseUrl, customHeaders) {
    try {
      return await validateApiKey(providerId, rawKey, baseUrl, customHeaders);
    } catch (err) {
      console.error(`[BrainService] Provider key validation error:`, err.message);
      return { valid: false, error: err.message };
    }
  }

  /**
   * Check reachability of primary NVIDIA NIM provider
   */
  static async getPrimaryProviderStatus() {
    try {
      const active = await checkNvidiaReachability();
      return { provider: 'nvidia', active };
    } catch (err) {
      return { provider: 'nvidia', active: false, error: err.message };
    }
  }

  /**
   * Helper to mask API keys
   */
  static maskProviderKey(key) {
    return maskKey(key);
  }
}
