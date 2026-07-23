import { AIProvider } from "./AIProvider";
import { GeminiProvider } from "./GeminiProvider";
import { OpenAIProvider } from "./OpenAIProvider";
import { ClaudeProvider } from "./ClaudeProvider";
import { OllamaProvider } from "./OllamaProvider";
import { LocalProvider } from "./LocalProvider";
import { NvidiaProvider } from "./NvidiaProvider";

export class ProviderFactory {
  private static registry: Map<string, new () => AIProvider> = new Map();

  static {
    // Auto-register default providers
    this.registry.set('gemini', GeminiProvider);
    this.registry.set('openai', OpenAIProvider);
    this.registry.set('claude', ClaudeProvider);
    this.registry.set('ollama', OllamaProvider);
    this.registry.set('local', LocalProvider);
    this.registry.set('nvidia', NvidiaProvider);
  }

  public static register(id: string, providerClass: new () => AIProvider) {
    this.registry.set(id, providerClass);
  }

  public static create(id: string): AIProvider {
    const ProviderClass = this.registry.get(id);
    if (!ProviderClass) {
      throw new Error(`[ProviderFactory] Provider with ID "${id}" is not registered.`);
    }
    return new ProviderClass();
  }

  public static getRegisteredProviders(): string[] {
    return Array.from(this.registry.keys());
  }
}
