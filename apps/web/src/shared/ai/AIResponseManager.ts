import { assistantState } from './AssistantState';
import { aiRouter } from './AIRouter';
import { textToSpeechManager } from './TextToSpeechManager';
import { voiceStateMachine } from './VoiceStateMachine';
import { latencyTracker, aiLogger } from './Logger';
import { ErrorManager } from './ErrorManager';
import { conversationManager } from './ConversationManager';
import { TokenManager } from './TokenManager';
import { systemControl } from './SystemControl';
import { agentOrchestrator } from '../agents/AgentOrchestrator';
import { MemoryContextBuilder } from '../memory/MemoryContextBuilder';
import { notificationManager } from '../dashboard/notification';
import { behaviorEngine } from './BehaviorEngine';

function splitIntoSentences(text: string): string[] {
  const sentences: string[] = [];
  const regex = /[^.!?\n]+[.!?\n]+/g;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const s = match[0].trim();
    if (s) sentences.push(s);
  }

  return sentences;
}

class AIResponseManager {
  private processing = false;
  private errorTimeout: ReturnType<typeof setTimeout> | null = null;
  private readonly REQUEST_TIMEOUT_MS = 20000; // 20-second safety timeout

  async respond() {
    const prompt = assistantState.transcript.trim();
    if (!prompt) return;

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      assistantState.streamingResponse = '';
      const errMessage = 'Offline: Network connection unavailable. Unable to reach JARVIS core engines.';
      assistantState.setError(errMessage);
      voiceStateMachine.transitionTo('ERROR');
      setTimeout(() => {
        voiceStateMachine.transitionTo('IDLE');
      }, 1500);
      return;
    }

    if (this.processing) {
      console.warn('[AIResponseManager] Already processing request.');
      return;
    }
    this.processing = true;

    // Add user message to history
    conversationManager.addUser(prompt);

    // Start latency tracking and log speech recognition end
    latencyTracker.start();
    aiLogger.info('LatencyMetrics', `Speech recognition end`);

    console.log(`[AIResponseManager] Processing prompt: "${prompt}"`);

    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
      this.errorTimeout = null;
    }

    // Reset/clear streamingResponse in assistantState before starting
    assistantState.streamingResponse = '';

    // System Control is a first-class, named-command category.
    voiceStateMachine.transitionTo('EXECUTING');
    const systemResult = await systemControl.tryExecute(prompt);
    if (systemResult.handled) {
      if (systemResult.error) {
        conversationManager.removeLatestUserMessage();
        assistantState.setError(ErrorManager.getFriendlyErrorMessage(systemResult.error));
      } else if (systemResult.message) {
        await this.completeSystemControlResponse(systemResult.message);
      }
      this.processing = false;
      return;
    }

    // Multi-Agent Collaboration Orchestration Layer
    const orchestrationResult = await agentOrchestrator.orchestrate(prompt);
    if (orchestrationResult.handled) {
      await this.completeSystemControlResponse(orchestrationResult.text);
      this.processing = false;
      return;
    }

    // Dynamically retrieve contextual AI memory representation
    const memoryContext = await MemoryContextBuilder.buildContext(prompt);
    const behavior = behaviorEngine.decide(prompt);
    const behaviorContext = [memoryContext, behavior.instructions].filter(Boolean).join('\n\n');

    const MAX_HISTORY_TOKENS = 2000;
    const rawHistory = conversationManager.history.filter(m => m.role !== 'system');
    const trimmedHistory = TokenManager.trimHistory(rawHistory, MAX_HISTORY_TOKENS) as typeof rawHistory;

    textToSpeechManager.cancel();
    voiceStateMachine.transitionTo('THINKING');

    let lastSentenceCount = 0;
    let speakingStarted = false;
    let isFirstSentence = true;

    const responsePromise = aiRouter.generateResponse(
      prompt,
      (accumulatedText) => {
        const formattedText = behaviorEngine.formatResponse(accumulatedText, behavior);
        assistantState.streamingResponse = formattedText;

        if (voiceStateMachine.state === 'THINKING') {
          voiceStateMachine.transitionTo('STREAMING');
        }

        const sentences = splitIntoSentences(formattedText);
        if (isFirstSentence && sentences.length > 0) {
          isFirstSentence = false;
          aiLogger.info('LatencyMetrics', `First sentence complete: "${sentences[0]}" (elapsed: ${latencyTracker.getElapsed()}ms)`);
        }

        while (lastSentenceCount < sentences.length) {
          const sentence = sentences[lastSentenceCount];
          textToSpeechManager.addSentence(sentence);
          lastSentenceCount++;

          if (!speakingStarted) {
            speakingStarted = true;
            assistantState.startSpeaking(sentence);
          }
        }
      },
      {
        context: behaviorContext,
        history: trimmedHistory,
      }
    );

    // Timeout Promise Guard (20s)
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error('Request timeout: No AI provider responded within 20 seconds.'));
      }, this.REQUEST_TIMEOUT_MS);
    });

    try {
      const speakPromise = textToSpeechManager.startQueue();

      // Race response against safety timeout
      const providerResponse = await Promise.race([responsePromise, timeoutPromise]);
      const fullResponse = behaviorEngine.formatResponse(providerResponse, behavior);

      conversationManager.addAssistant(fullResponse);
      assistantState.streamingResponse = '';

      const detectedSentences = splitIntoSentences(fullResponse);
      const trailingText = fullResponse
        .slice(detectedSentences.join('').length)
        .trim();

      if (trailingText) {
        textToSpeechManager.addSentence(trailingText);
        if (!speakingStarted) {
          speakingStarted = true;
          assistantState.startSpeaking(trailingText);
        }
      }

      if (!speakingStarted && fullResponse.trim()) {
        textToSpeechManager.addSentence(fullResponse.trim());
        assistantState.startSpeaking(fullResponse.trim());
      }

      textToSpeechManager.finishQueue();
      await speakPromise;

      console.log('[AIResponseManager] Response complete. Transitioning to IDLE.');
      voiceStateMachine.transitionTo('IDLE');
    } catch (error: any) {
      console.error('[AIResponseManager] Request failed or timed out:', error);
      conversationManager.removeLatestUserMessage();
      assistantState.streamingResponse = '';

      const friendlyMessage = behaviorEngine.formatError(error);
      assistantState.setError(friendlyMessage);
      notificationManager.showNotification('error', 'AI Unavailable', friendlyMessage);

      try {
        textToSpeechManager.cancel();
      } catch (_) {}

      voiceStateMachine.transitionTo('ERROR');

      // Auto-recover Error -> Idle after 1.5s
      setTimeout(() => {
        if (voiceStateMachine.state === 'ERROR') {
          voiceStateMachine.transitionTo('IDLE');
        }
      }, 1500);
    } finally {
      this.processing = false;
    }
  }

  private async completeSystemControlResponse(message: string): Promise<void> {
    conversationManager.addAssistant(message);
    assistantState.streamingResponse = message;
    textToSpeechManager.cancel();
    voiceStateMachine.transitionTo('THINKING');

    const speakPromise = textToSpeechManager.startQueue();
    textToSpeechManager.addSentence(message);
    assistantState.startSpeaking(message);
    textToSpeechManager.finishQueue();
    await speakPromise;

    assistantState.streamingResponse = '';
    voiceStateMachine.transitionTo('IDLE');
  }
}

export const aiResponseManager = new AIResponseManager();
export default aiResponseManager;
