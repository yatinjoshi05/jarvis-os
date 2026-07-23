import { voiceStateMachine } from './VoiceStateMachine';
import { assistantState } from './AssistantState';
import { captionManager } from './CaptionManager';
import { voiceSettings } from './VoiceSettings';
import { VOICE_CONFIG } from './config';
import { speechQueue } from './SpeechQueue';
import { aiLogger, latencyTracker } from './Logger';
import { elevenLabsProvider } from './ElevenLabsProvider';

const SPEECH_START_TIMEOUT_MS = 1200;

class TextToSpeechManager {
  private isGenerating = false;
  private isProcessing = false;
  private cancelled = false;
  private queueResolve?: () => void;
  private currentAudioElement: HTMLAudioElement | null = null;

  constructor() {
    elevenLabsProvider.setFallbackHandler((sentence) => this.speakBrowserSynthesis(sentence));
  }

  // ─── Public API ───────────────────────────────────────────────

  startQueue(): Promise<void> {
    this.resetState();
    this.isGenerating = true;

    return new Promise<void>((resolve) => {
      this.queueResolve = resolve;
    });
  }

  addSentence(sentence: string, priority: 'HIGH' | 'NORMAL' | 'LOW' = 'NORMAL') {
    if (this.cancelled) return;
    const trimmed = sentence.trim();
    if (!trimmed) return;
    
    speechQueue.enqueue(trimmed, priority);
    this.processNext();
  }

  finishQueue() {
    this.isGenerating = false;
    this.checkIfDone();
  }

  cancel() {
    this.cancelled = true;
    this.isProcessing = false;

    // Cancel ElevenLabs provider request & playback
    elevenLabsProvider.cancel();

    // Stop browser speech synthesis
    try {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    } catch (_) { /* ignore */ }

    // Stop external TTS audio playback
    if (this.currentAudioElement) {
      try {
        this.currentAudioElement.pause();
        this.currentAudioElement = null;
      } catch (_) { /* ignore */ }
    }

    captionManager.stop();
    speechQueue.clear();

    this.queueResolve?.();
    this.queueResolve = undefined;
  }

  stop() {
    this.cancel();
    voiceStateMachine.transitionTo('IDLE');
  }

  // ─── Internal ─────────────────────────────────────────────────

  private resetState() {
    this.cancel();
    this.cancelled = false;
    this.isProcessing = false;
    this.isGenerating = false;
    this.queueResolve = undefined;
  }

  private processNext() {
    if (this.isProcessing || this.cancelled) return;

    const nextItem = speechQueue.dequeue();
    if (!nextItem) {
      this.checkIfDone();
      return;
    }

    this.isProcessing = true;

    this.speakSentence(nextItem.text).then(() => {
      this.isProcessing = false;
      if (!this.cancelled) {
        this.processNext();
      }
    });
  }

  private checkIfDone() {
    if (!this.isGenerating && speechQueue.size === 0 && !this.isProcessing) {
      this.queueResolve?.();
      this.queueResolve = undefined;
    }
  }

  private async speakSentence(sentence: string): Promise<void> {
    const settings = voiceSettings.settings;
    const provider = settings.ttsProvider;

    if (provider === 'elevenlabs') {
      return elevenLabsProvider.speak(sentence);
    } else if (provider === 'openai' && VOICE_CONFIG.openai.apiKey) {
      return this.speakExternalOpenAI(sentence);
    } else {
      return this.speakBrowserSynthesis(sentence);
    }
  }

  private speakBrowserSynthesis(sentence: string): Promise<void> {
    return new Promise<void>((resolve) => {
      if (!sentence.trim() || this.cancelled) {
        resolve();
        return;
      }

      let resolved = false;
      let startTimeoutId: ReturnType<typeof setTimeout> | null = null;
      let endTimeoutId: ReturnType<typeof setTimeout> | null = null;

      const finish = () => {
        if (resolved) return;
        resolved = true;
        if (startTimeoutId) clearTimeout(startTimeoutId);
        if (endTimeoutId) clearTimeout(endTimeoutId);
        resolve();
      };

      captionManager.start(
        sentence,
        (cap) => assistantState.setCaption(cap),
        () => {}
      );

      const utterance = new SpeechSynthesisUtterance(sentence);
      const settings = voiceSettings.settings;

      utterance.lang = settings.language;
      utterance.rate = settings.rate;
      utterance.pitch = settings.pitch;
      utterance.volume = settings.volume;

      // Select system voice if specified
      if (settings.voice && typeof window !== 'undefined' && window.speechSynthesis) {
        const voices = window.speechSynthesis.getVoices();
        const matchingVoice = voices.find((v) => v.name === settings.voice);
        if (matchingVoice) utterance.voice = matchingVoice;
      }

      utterance.onstart = () => {
        if (startTimeoutId) clearTimeout(startTimeoutId);

        aiLogger.info('LatencyMetrics', `TTS start / Total time (elapsed: ${latencyTracker.getElapsed()}ms)`);

        const words = sentence.split(/\s+/).filter(Boolean).length;
        const maxDurationMs = (words * 400) + 2000;
        endTimeoutId = setTimeout(() => {
          console.warn('[JARVIS TTS] Browser voice timeout reached. Resolving.');
          captionManager.markComplete();
          finish();
        }, maxDurationMs);

        console.log(`[JARVIS TTS] Speaking (Browser): "${sentence.substring(0, 45)}..."`);
        voiceStateMachine.transitionTo('SPEAKING');
      };

      utterance.onboundary = (event) => {
        if (event.name !== 'word') return;
        const charIndex = event.charIndex;
        const remaining = sentence.slice(charIndex);
        const nextSpace = remaining.search(/\s/);
        const wordLen = nextSpace === -1 ? remaining.length : nextSpace;
        const textSoFar = sentence.slice(0, charIndex + wordLen);
        captionManager.updateDirect(textSoFar);
      };

      utterance.onend = () => {
        captionManager.markComplete();
        finish();
      };

      utterance.onerror = (e) => {
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.error('[JARVIS TTS] Browser Speech Error:', e.error);
        }
        captionManager.markComplete();
        finish();
      };

      startTimeoutId = setTimeout(() => {
        console.warn('[JARVIS TTS] Browser Speech start timeout. Transitioning to fallback.');
        voiceStateMachine.transitionTo('SPEAKING');
        const captionWords = sentence.split(/\s+/).filter(Boolean);
        const captionDuration = captionWords.length * 290 + 500;
        setTimeout(finish, captionDuration);
      }, SPEECH_START_TIMEOUT_MS);

      try {
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.error('[JARVIS TTS] browser speak() failed:', e);
        captionManager.markComplete();
        finish();
      }
    });
  }

  private speakExternalOpenAI(sentence: string): Promise<void> {
    return new Promise<void>(async (resolve) => {
      const config = VOICE_CONFIG.openai;

      captionManager.start(
        sentence,
        (cap) => assistantState.setCaption(cap),
        () => {}
      );

      try {
        voiceStateMachine.transitionTo('SPEAKING');
        const response = await fetch(`https://api.openai.com/v1/audio/speech`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.apiKey}`
          },
          body: JSON.stringify({
            model: config.model,
            voice: config.voice,
            input: sentence
          })
        });

        if (!response.ok) {
          throw new Error(`OpenAI Speech returned HTTP ${response.status}`);
        }

        const blob = await response.blob();
        if (this.cancelled) {
          resolve();
          return;
        }

        await this.playAudioBlob(blob, resolve);
      } catch (err) {
        console.error('[JARVIS TTS] OpenAI TTS playback failed, falling back to Browser Synthesis:', err);
        this.speakBrowserSynthesis(sentence).then(resolve);
      }
    });
  }

  private playAudioBlob(blob: Blob, resolve: () => void): Promise<void> {
    return new Promise((audioResolve) => {
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      this.currentAudioElement = audio;

      const settings = voiceSettings.settings;
      audio.volume = settings.volume;

      const cleanup = () => {
        audio.onended = null;
        audio.onerror = null;
        URL.revokeObjectURL(url);
        if (this.currentAudioElement === audio) {
          this.currentAudioElement = null;
        }
        audioResolve();
        resolve();
      };

      audio.onended = cleanup;
      audio.onerror = () => {
        console.error('[JARVIS TTS] Audio playback error');
        cleanup();
      };

      audio.play().then(() => {
        aiLogger.info('LatencyMetrics', `TTS start / Total time (elapsed: ${latencyTracker.getElapsed()}ms)`);
      }).catch((err) => {
        console.error('[JARVIS TTS] Audio play failed:', err);
        cleanup();
      });
    });
  }
}

export const textToSpeechManager = new TextToSpeechManager();
export default textToSpeechManager;