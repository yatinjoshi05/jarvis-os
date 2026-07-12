import { assistantState } from './AssistantState';
import { aiRouter } from './AIRouter';
import { textToSpeechManager } from './TextToSpeechManager';
import { voiceStateMachine } from './VoiceStateMachine';

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

  async respond() {
    const prompt = assistantState.transcript.trim();
    if (!prompt) return;

    if (this.processing) {
      console.warn('[AIResponseManager] Already processing request.');
      return;
    }
    this.processing = true;

    console.log(`[AIResponseManager] Processing prompt: "${prompt}"`);

    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
      this.errorTimeout = null;
    }

    textToSpeechManager.cancel();
    voiceStateMachine.transitionTo('THINKING');

    try {
      const speakPromise = textToSpeechManager.startQueue();

      let lastSentenceCount = 0;
      let speakingStarted = false;

      const fullResponse = await aiRouter.generateResponse(
        prompt,
        (accumulatedText) => {
          if (voiceStateMachine.state === 'THINKING') {
            voiceStateMachine.transitionTo('STREAMING');
          }

          const sentences = splitIntoSentences(accumulatedText);

          while (lastSentenceCount < sentences.length) {
            const sentence = sentences[lastSentenceCount];
            textToSpeechManager.addSentence(sentence);
            lastSentenceCount++;

            if (!speakingStarted) {
              speakingStarted = true;
              assistantState.startSpeaking(sentence);
            }
          }
        }
      );

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
      console.error('[AIResponseManager] Caught error:', error);
      assistantState.setError(error.message || 'Something went wrong. Try again.');

      this.errorTimeout = setTimeout(() => {
        if (assistantState.error) {
          assistantState.reset();
        }
      }, 5000);
    } finally {
      this.processing = false;
    }
  }
}

export const aiResponseManager = new AIResponseManager();
export default aiResponseManager;