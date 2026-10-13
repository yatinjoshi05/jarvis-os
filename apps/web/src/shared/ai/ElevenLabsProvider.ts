import { VOICE_CONFIG, getBackendApiUrl } from './config';
import { voiceSettings } from './VoiceSettings';
import { voiceStateMachine } from './VoiceStateMachine';
import { assistantState } from './AssistantState';
import { captionManager } from './CaptionManager';
import { aiLogger, latencyTracker } from './Logger';
import { audioSettings } from '../audio/AudioSettings';
import { speechAudioReactivity } from '../audio/SpeechAudioReactivity';

export interface ElevenLabsOptions {
  voiceId?: string;
  modelId?: string;
  priority?: 'HIGH' | 'NORMAL' | 'LOW';
  voiceSettings?: {
    stability?: number;
    similarity_boost?: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
}

// Default premade voice ID guaranteed compatible with Free tier API (Adam)
const FREE_TIER_DEFAULT_VOICE_ID = 'pNInz6obpgDQGcFmaJgB';

export class ElevenLabsProvider {
  private activeAudio: HTMLAudioElement | null = null;
  private audioUrl: string | null = null;
  private abortController: AbortController | null = null;
  private audioContext: AudioContext | null = null;
  private isPaused = false;
  private fallbackHandler?: (sentence: string) => Promise<void>;

  constructor(fallbackHandler?: (sentence: string) => Promise<void>) {
    this.fallbackHandler = fallbackHandler;
  }

  public setFallbackHandler(handler: (sentence: string) => Promise<void>) {
    this.fallbackHandler = handler;
  }

  private getApiUrl(): string {
    const relativeUrl = VOICE_CONFIG.elevenlabs.baseUrl || '/api/tts/elevenlabs';
    return getBackendApiUrl(relativeUrl);
  }

  /**
   * Synthesize and stream speech for a given sentence.
   * If ElevenLabs fails or is not configured, automatically falls back to Browser TTS.
   */
  public async speak(sentence: string, options?: ElevenLabsOptions): Promise<void> {
    const trimmed = sentence.trim();
    if (!trimmed) return;

    // Priority: caller option > runtime user setting > build-time config > free-tier fallback
    // Reading voiceSettings at call time (not cached) ensures any voice change in the UI
    // takes effect immediately without requiring a page reload.
    let voiceId =
      options?.voiceId ||
      voiceSettings.settings.elevenlabsVoiceId ||
      VOICE_CONFIG.elevenlabs.voiceId ||
      FREE_TIER_DEFAULT_VOICE_ID;

    const modelId = options?.modelId || VOICE_CONFIG.elevenlabs.modelId;
    const requestUrl = this.getApiUrl();

    console.log(`[TTS Pipeline] Step 1: AI response generated (Length: ${trimmed.length} chars) -> "${trimmed.substring(0, 50)}..."`);
    console.log(`[TTS Pipeline] Step 2: TTS request started (Provider: elevenlabs, VoiceID: ${voiceId})`);

    this.cleanupCurrentAudio();

    captionManager.start(
      trimmed,
      (cap) => assistantState.setCaption(cap),
      () => {}
    );

    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    try {
      console.log(`[TTS Pipeline] Step 3: Backend request sent to ElevenLabs proxy (${requestUrl})`);
      console.log(`[TTS Pipeline] Step 7: Speaking state entered (VoiceState -> SPEAKING)`);
      voiceStateMachine.transitionTo('SPEAKING');

      let response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: trimmed,
          voiceId,
          modelId,
          voiceSettings: options?.voiceSettings || {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
        signal,
      });

      console.log(`[TTS Pipeline] Step 4: ElevenLabs HTTP Status: ${response.status} ${response.statusText}`);

      // Handle 402 Payment Required (Library voice restricted on Free Tier)
      if (!response.ok && response.status === 402 && voiceId !== FREE_TIER_DEFAULT_VOICE_ID) {
        console.warn(`[TTS Pipeline] Voice ID "${voiceId}" returned HTTP 402 Payment Required (Free tier API restriction on library voices). Retrying with standard premade Voice ID "${FREE_TIER_DEFAULT_VOICE_ID}"...`);
        voiceId = FREE_TIER_DEFAULT_VOICE_ID;

        response = await fetch(requestUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: trimmed,
            voiceId: FREE_TIER_DEFAULT_VOICE_ID,
            modelId,
            voiceSettings: options?.voiceSettings || { stability: 0.5, similarity_boost: 0.75 },
          }),
          signal,
        });

        console.log(`[TTS Pipeline] Step 4 (Retry): ElevenLabs HTTP Status: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        const errText = await response.text().catch(() => '');
        console.error(`[TTS Pipeline Error] ElevenLabs backend proxy failed (Status ${response.status}):`, errText);
        throw new Error(`ElevenLabs backend proxy returned HTTP ${response.status}`);
      }

      const blob = await response.blob();
      console.log(`[TTS Pipeline] Step 5: Audio bytes received: ${blob.size} bytes (type: ${blob.type || 'audio/mpeg'})`);

      if (signal.aborted) {
        console.log('[TTS Pipeline] Request aborted before playback.');
        return;
      }

      console.log(`[TTS Pipeline] Step 6: Audio sent to frontend blob stream`);
      await this.playAudioBlob(blob);
      captionManager.markComplete();
      console.log(`[TTS Pipeline] Step 9: Playback completed`);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('[ElevenLabsProvider] Speech request aborted.');
        return;
      }
      console.warn('[ElevenLabsProvider] ElevenLabs streaming speech failed, falling back to Browser TTS:', err?.message || err);
      if (this.fallbackHandler) {
        await this.fallbackHandler(trimmed);
      } else {
        throw err;
      }
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Play audio blob with low latency and streaming cleanup.
   */
  private playAudioBlob(blob: Blob): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.audioUrl = URL.createObjectURL(blob);
        const audio = new Audio(this.audioUrl);
        this.activeAudio = audio;

        const settings = voiceSettings.settings;
        const effectiveVol = audioSettings.getEffectiveVolume('voice') * settings.volume;
        audio.volume = Math.max(0, Math.min(1, effectiveVol));

        const cleanup = () => {
          audio.onended = null;
          audio.onerror = null;
          speechAudioReactivity.detach(audio);
          this.cleanupCurrentAudio();
          resolve();
        };

        audio.onended = cleanup;
        audio.onerror = (e) => {
          console.error('[ElevenLabsProvider] Audio playback error:', e);
          cleanup();
        };

        console.log(`[TTS Pipeline] Step 8: Audio playback started (HTML5 Audio element playing)`);
        audio
          .play()
          .then(() => {
            speechAudioReactivity.attach(audio);
            aiLogger.info('LatencyMetrics', `ElevenLabs TTS start (elapsed: ${latencyTracker.getElapsed()}ms)`);
          })
          .catch((err) => {
            console.error('[ElevenLabsProvider] Audio play() failed:', err);
            cleanup();
          });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Interrupt speaking immediately.
   */
  public interrupt(): void {
    this.cancel();
    captionManager.stop();
    assistantState.setCaption('');
  }

  /**
   * Stop speaking and reset state.
   */
  public stop(): void {
    this.interrupt();
    voiceStateMachine.transitionTo('IDLE');
  }

  /**
   * Pause ongoing audio playback.
   */
  public pause(): void {
    if (this.activeAudio && !this.activeAudio.paused) {
      this.activeAudio.pause();
      this.isPaused = true;
    }
    if (this.audioContext && this.audioContext.state === 'running') {
      this.audioContext.suspend();
      this.isPaused = true;
    }
  }

  /**
   * Resume paused audio playback.
   */
  public resume(): void {
    if (this.activeAudio && this.isPaused) {
      this.activeAudio.play().catch((err) => console.error('[ElevenLabsProvider] Resume playback failed:', err));
      this.isPaused = false;
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
      this.isPaused = false;
    }
  }

  /**
   * Voice cancellation — stops active request and audio playback.
   */
  public cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.cleanupCurrentAudio();
    this.isPaused = false;
  }

  /**
   * Voice cleanup — releases resources, URL objects, audio elements.
   */
  public cleanup(): void {
    this.cancel();
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch (_) {}
      this.audioContext = null;
    }
  }

  private cleanupCurrentAudio(): void {
    if (this.activeAudio) {
      try {
        speechAudioReactivity.detach(this.activeAudio);
        this.activeAudio.pause();
        this.activeAudio.src = '';
      } catch (_) {}
      this.activeAudio = null;
    }
    if (this.audioUrl) {
      URL.revokeObjectURL(this.audioUrl);
      this.audioUrl = null;
    }
  }
}

export const elevenLabsProvider = new ElevenLabsProvider();
export default elevenLabsProvider;
