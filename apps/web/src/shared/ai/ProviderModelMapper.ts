/**
 * ProviderModelMapper.ts
 * Provider Model Registry & Mapper for JARVIS OS.
 * Translates logical prompt tiers and model requests into provider-supported model names.
 * Ensures model names like "gemini-3.5-flash" are never sent to non-Gemini providers (e.g. NVIDIA, OpenAI, Claude).
 */

import { AI_CONFIG } from "./config";
import { aiLogger } from "./Logger";

export type PromptTier = 'fast' | 'default' | 'complex';

export interface ProviderModelContract {
  providerId: string;
  name: string;
  fastModel: string;
  defaultModel: string;
  complexModel: string;
  supportedPatterns: (string | RegExp)[];
}

class ProviderModelMapper {
  private registries: Map<string, ProviderModelContract> = new Map();

  constructor() {
    this.initializeRegistries();
  }

  private initializeRegistries() {
    // 1. Gemini Registry
    this.registries.set('gemini', {
      providerId: 'gemini',
      name: 'Google Gemini',
      fastModel: AI_CONFIG.providers.gemini.fastModel || 'gemini-2.0-flash-lite',
      defaultModel: AI_CONFIG.providers.gemini.model || 'gemini-3.5-flash',
      complexModel: AI_CONFIG.providers.gemini.complexModel || 'gemini-2.5-pro',
      supportedPatterns: [/^gemini-/i],
    });

    // 2. NVIDIA NIM Registry
    this.registries.set('nvidia', {
      providerId: 'nvidia',
      name: 'NVIDIA NIM',
      fastModel: AI_CONFIG.providers.nvidia.fastModel || 'meta/llama-3.1-8b-instruct',
      defaultModel: AI_CONFIG.providers.nvidia.model || 'meta/llama-3.1-8b-instruct',
      complexModel: AI_CONFIG.providers.nvidia.complexModel || 'meta/llama-3.1-8b-instruct',
      supportedPatterns: [
        /^meta\//i,
        /^nvidia\//i,
        /^deepseek-ai\//i,
        /^mistralai\//i,
        /^01-ai\//i,
        /^abacusai\//i,
        /^aisingapore\//i,
        /^adept\//i,
        /^ai21labs\//i,
      ],
    });

    // 3. OpenAI Registry
    this.registries.set('openai', {
      providerId: 'openai',
      name: 'OpenAI',
      fastModel: 'gpt-4o-mini',
      defaultModel: AI_CONFIG.providers.openai.model || 'gpt-4o',
      complexModel: 'gpt-4o',
      supportedPatterns: [/^gpt-/i, /^o1-/i, /^o3-/i],
    });

    // 4. Claude Registry
    this.registries.set('claude', {
      providerId: 'claude',
      name: 'Anthropic Claude',
      fastModel: 'claude-3-5-haiku-20241022',
      defaultModel: AI_CONFIG.providers.claude.model || 'claude-3-5-sonnet-20241022',
      complexModel: 'claude-3-5-sonnet-20241022',
      supportedPatterns: [/^claude-/i],
    });

    // 5. Ollama Registry
    this.registries.set('ollama', {
      providerId: 'ollama',
      name: 'Ollama',
      fastModel: 'llama3.2',
      defaultModel: AI_CONFIG.providers.ollama.model || 'llama3',
      complexModel: 'llama3',
      supportedPatterns: [/^llama/i, /^mistral/i, /^phi/i, /^gemma/i, /^qwen/i, /^codellama/i],
    });

    // 6. Local Model Registry
    this.registries.set('local', {
      providerId: 'local',
      name: 'Local Model',
      fastModel: AI_CONFIG.providers.local.model || 'local-model',
      defaultModel: AI_CONFIG.providers.local.model || 'local-model',
      complexModel: AI_CONFIG.providers.local.model || 'local-model',
      supportedPatterns: [/.*/],
    });
  }

  /**
   * Check if a specific model string is supported by the target provider contract.
   */
  public isModelSupported(providerId: string, model: string): boolean {
    if (!model || typeof model !== 'string') return false;

    const contract = this.registries.get(providerId.toLowerCase());
    if (!contract) return true; // If unknown provider, skip validation

    return contract.supportedPatterns.some((pattern) => {
      if (pattern instanceof RegExp) {
        return pattern.test(model);
      }
      return model.toLowerCase().includes(String(pattern).toLowerCase());
    });
  }

  /**
   * Get the default model for a given tier in a target provider.
   */
  public getTierModel(providerId: string, tier: PromptTier): string {
    const contract = this.registries.get(providerId.toLowerCase());
    if (!contract) return 'default-model';

    switch (tier) {
      case 'fast':
        return contract.fastModel;
      case 'complex':
        return contract.complexModel;
      case 'default':
      default:
        return contract.defaultModel;
    }
  }

  /**
   * Resolves and translates a requested model or prompt tier into a guaranteed-compatible provider model.
   */
  public resolveModelForProvider(
    providerId: string,
    tier: PromptTier,
    requestedModel?: string
  ): { mappedModel: string; wasMapped: boolean; originalModel?: string } {
    const pId = providerId.toLowerCase();
    const contract = this.registries.get(pId);

    if (!contract) {
      return { mappedModel: requestedModel || 'default-model', wasMapped: false };
    }

    // 1. If a model was explicitly requested:
    if (requestedModel) {
      // Is it valid for this provider?
      if (this.isModelSupported(pId, requestedModel)) {
        return { mappedModel: requestedModel, wasMapped: false, originalModel: requestedModel };
      }

      // If requested model is UNSUPPORTED for this provider (e.g. gemini-3.5-flash sent to nvidia)
      const mappedModel = this.getTierModel(pId, tier);

      console.log(
        `[ProviderModelMapper] Provider: ${contract.name} (${pId}) | Original model: ${requestedModel} | Unsupported! Mapped to provider default: ${mappedModel}`
      );
      aiLogger.warn(
        'ProviderModelMapper',
        `Provider "${contract.name}" does not support model "${requestedModel}". Mapped to compatible model "${mappedModel}".`
      );

      return { mappedModel, wasMapped: true, originalModel: requestedModel };
    }

    // 2. No explicit model passed -> map directly from tier
    const mappedModel = this.getTierModel(pId, tier);
    return { mappedModel, wasMapped: false };
  }

  /**
   * Get all registered provider model contracts.
   */
  public getContracts(): Map<string, ProviderModelContract> {
    return new Map(this.registries);
  }
}

export const providerModelMapper = new ProviderModelMapper();
export default providerModelMapper;
