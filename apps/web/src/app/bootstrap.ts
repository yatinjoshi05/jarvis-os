import { financialManager } from '../entities/financial';
import { automationManager } from '../entities/automation';
import { browserAgentManager } from '../entities/browser';
import { codingAgentManager } from '../entities/coding';
import { audioManager } from '../shared/audio';
import { MemoryCompression } from '../shared/memory/MemoryCompression';
import { aiRouter } from '../shared/ai/AIRouter';
import { agentHubRegistry } from '../shared/agents/AgentHubRegistry';
import { agentManager } from '../shared/agents/AgentManager';
import { agentRuntime } from '../shared/agents/AgentRuntime';

/**
 * Bootstraps and registers core domain entities.
 * Force evaluates self-registering singleton instances to prevent compiler tree-shaking
 * and starts the Ambient Audio Engine lifecycle.
 */
export function bootstrap() {
  // Runs after the storage shim is ready, so imported agents and hub settings
  // are restored into the same durable store as the rest of the application.
  agentHubRegistry.rehydrate();
  void agentManager;
  void agentRuntime.restore();
  const instances = {
    financialManager,
    automationManager,
    browserAgentManager,
    codingAgentManager,
    audioManager,
  };

  // Register the LLM-powered summarizer for long conversation compression.
  MemoryCompression.registerSummarizer(async (text: string) => {
    const prompt = `Summarize the key points from this conversation history in 2-3 sentences. Be concise and factual:\n\n${text.slice(0, 3000)}`;
    return aiRouter.generateResponse(prompt);
  });

  const failed = Object.entries(instances)
    .filter(([_, instance]) => !instance)
    .map(([name]) => name);

  if (failed.length > 0) {
    console.warn(`[Bootstrap] Some managers failed to load: ${failed.join(', ')}`);
  } else {
    console.log('[Bootstrap] All JARVIS OS Core Managers successfully registered.');
    // Start Ambient Audio Engine startup sequence (startup.mp3 -> idle.mp3)
    audioManager.start().catch((err) => {
      console.warn('[Bootstrap] Ambient Audio Engine start deferred until user interaction:', err);
    });
  }
}
