import { aiRouter } from './AIRouter';
import { conversationManager } from './ConversationManager';
import { contextManager } from './ContextManager';
import { aiLogger } from './Logger';
import { voiceManager } from './VoiceManager';
import { MemoryCompression } from '../memory/MemoryCompression';
import { TokenManager } from './TokenManager';

export { useAssistantState, assistantState } from './AssistantState';
export { speechRecognitionManager } from './SpeechRecognitionManager';
export { aiResponseManager } from './AIResponseManager';
export { default as MicrophoneController } from './MicrophoneController';
export { default as SpeechRecognitionController } from './SpeechRecognitionController';
export { microphoneManager } from './MicrophoneManager';
export { voiceManager } from './VoiceManager';

export class AIManager {
  constructor() {
    MemoryCompression.registerSummarizer(async (text) => {
      try {
        const prompt = `Summarize the key facts, user preferences, and context from this chat history in a concise paragraph:\n\n${text}`;
        return await aiRouter.generateResponse(prompt);
      } catch (e) {
        console.error('[AIManager] LLM summarization failed:', e);
        return 'Summary compilation failed.';
      }
    });
  }

  public async generateResponse(prompt: string, _contextId?: string): Promise<string> {
    aiLogger.info('AIManager', `Generating response for: "${prompt.substring(0, 50)}..."`);
    const context = contextManager.getContextString();
    conversationManager.addUser(prompt);
    
    const MAX_HISTORY_TOKENS = 2000;
    const rawHistory = conversationManager.history.filter(m => m.role !== 'system');
    const trimmedHistory = TokenManager.trimHistory(rawHistory, MAX_HISTORY_TOKENS) as typeof rawHistory;

    try {
      const response = await aiRouter.generateResponse(prompt, undefined, {
        context,
        history: trimmedHistory
      });
      
      conversationManager.addAssistant(response);
      return response;
    } catch (e) {
      conversationManager.removeLatestUserMessage();
      throw e;
    }
  }

  public async generateStream(
    prompt: string,
    onChunk: (chunk: string) => void,
    _contextId?: string
  ): Promise<void> {
    aiLogger.info('AIManager', `Streaming response for: "${prompt.substring(0, 50)}..."`);
    const context = contextManager.getContextString();
    conversationManager.addUser(prompt);

    const MAX_HISTORY_TOKENS = 2000;
    const rawHistory = conversationManager.history.filter(m => m.role !== 'system');
    const trimmedHistory = TokenManager.trimHistory(rawHistory, MAX_HISTORY_TOKENS) as typeof rawHistory;

    try {
      let fullResponse = '';
      await aiRouter.generateStream(prompt, (chunk) => {
        fullResponse += chunk;
        onChunk(chunk);
      }, {
        context,
        history: trimmedHistory
      });

      conversationManager.addAssistant(fullResponse);
    } catch (e) {
      conversationManager.removeLatestUserMessage();
      throw e;
    }
  }

  public setProvider(providerId: string) {
    aiRouter.setPrimaryProvider(providerId);
  }

  public getProviderId(): string {
    return aiRouter.getPrimaryProviderId();
  }

  public cancel() {
    aiRouter.cancel();
  }

  // ─── Voice Engine APIs ────────────────────────────────────────

  public startListening() {
    return voiceManager.startListening();
  }

  public stopListening() {
    voiceManager.stopListening();
  }

  public pauseListening() {
    voiceManager.pauseListening();
  }

  public resumeListening() {
    voiceManager.resumeListening();
  }

  public speak(text: string, priority?: 'HIGH' | 'NORMAL' | 'LOW') {
    return voiceManager.speak(text, priority);
  }

  public stopSpeaking() {
    voiceManager.stopSpeaking();
  }

  public interrupt() {
    voiceManager.interrupt();
  }

  public mute() {
    voiceManager.mute();
  }

  public unmute() {
    voiceManager.unmute();
  }

  public setVoice(voiceName: string) {
    voiceManager.setVoice(voiceName);
  }

  public setLanguage(lang: string) {
    voiceManager.setLanguage(lang);
  }
}

export const aiManager = new AIManager();
export default aiManager;
