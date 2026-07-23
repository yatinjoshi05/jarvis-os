import { VOICE_CONFIG } from './config';

export type SpeechEvent = {
  type: 'start' | 'end' | 'error' | 'result' | 'silence_timeout';
  transcript?: string;
  isFinal?: boolean;
  error?: any;
};

export type SpeechListener = (event: SpeechEvent) => void;

class SpeechRecognitionManager {
  private recognition: SpeechRecognition | null = null;
  public transcript = '';
  public listening = false;
  private listeners = new Set<SpeechListener>();
  public supported =
    typeof window !== 'undefined' &&
    ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);

  private shouldRestart = false;
  private silenceTimer: ReturnType<typeof setTimeout> | null = null;
  private startTimer: ReturnType<typeof setTimeout> | null = null;
  private startPromise: Promise<boolean> | null = null;
  private resolveStart: ((started: boolean) => void) | null = null;
  private currentLanguage = VOICE_CONFIG.recognition.lang;

  constructor() {
    this.initRecognition();
  }

  private initRecognition() {
    if (!this.supported) return;

    const SpeechRecognitionClass =
      (
        window as typeof window & {
          webkitSpeechRecognition?: new () => SpeechRecognition;
          SpeechRecognition?: new () => SpeechRecognition;
        }
      ).webkitSpeechRecognition ||
      (
        window as typeof window & {
          SpeechRecognition?: new () => SpeechRecognition;
        }
      ).SpeechRecognition;

    if (!SpeechRecognitionClass) return;

    try {
      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = VOICE_CONFIG.recognition.continuous;
      this.recognition.interimResults = VOICE_CONFIG.recognition.interimResults;
      this.recognition.lang = this.currentLanguage;

      this.recognition.onstart = () => {
        console.info('[SpeechRecognitionManager] Recognition started.');
        this.listening = true;
        this.resolvePendingStart(true);
        this.resetSilenceTimer();
        this.notify({ type: 'start' });
      };

      this.recognition.onend = () => {
        console.info('[SpeechRecognitionManager] Recognition ended.');
        const endedDuringStartup = this.isStarting;
        this.listening = false;
        this.clearSilenceTimer();
        this.resolvePendingStart(false);
        this.notify({ type: 'end' });

        if (endedDuringStartup) {
          // An end before onstart is an abnormal startup failure. Do not turn
          // it into a retry loop that races the user's next mic request.
          this.shouldRestart = false;
          console.error('[SpeechRecognitionManager] Recognition ended before startup completed.');
          this.notify({ type: 'error', error: { error: 'start-ended' } });
          return;
        }
        
        if (this.shouldRestart) {
          setTimeout(() => {
            if (this.shouldRestart && !this.listening && !this.isStarting) {
              this.start();
            }
          }, 300);
        }
      };

      this.recognition.onerror = (e: any) => {
        console.error(`[SpeechRecognitionManager] Recognition error (${e.error || 'unknown'}):`, e);
        
        if (e.error === 'no-speech') {
          console.info('[SpeechRecognitionManager] Confirmed session ended with no speech.');
          this.notify({ type: 'silence_timeout' });
        } else {
          this.shouldRestart = false;
          this.resolvePendingStart(false);
          this.notify({ type: 'error', error: e });
        }
      };

      this.recognition.onresult = (event: SpeechRecognitionEvent) => {
        this.resetSilenceTimer();
        let text = '';
        let isFinal = false;

        for (let i = event.resultIndex; i < event.results.length; i++) {
          text += event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            isFinal = true;
          }
        }

        this.transcript = text;
        this.notify({ type: 'result', transcript: text, isFinal });
      };
    } catch (e) {
      console.error('[SpeechRecognitionManager] Failed to instantiate SpeechRecognition:', e);
    }
  }

  public subscribe(listener: SpeechListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(event: SpeechEvent) {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (err) {
        console.error('[SpeechRecognitionManager] Listener callback threw:', err);
      }
    });
  }

  public setLanguage(lang: string) {
    console.log(`[SpeechRecognitionManager] Switching recognition language to: ${lang}`);
    this.currentLanguage = lang;
    if (this.recognition) {
      const wasListening = this.listening;
      this.stop();
      this.recognition.lang = lang;
      if (wasListening) {
        this.start();
      }
    }
  }

  public getLanguage(): string {
    return this.currentLanguage;
  }

  private resetSilenceTimer() {
    this.clearSilenceTimer();
    this.silenceTimer = setTimeout(() => {
      if (this.listening) {
        console.log('[SpeechRecognitionManager] Silence timeout exceeded');
        this.notify({ type: 'silence_timeout' });
      }
    }, VOICE_CONFIG.silenceTimeoutMs);
  }

  private clearSilenceTimer() {
    if (this.silenceTimer) {
      clearTimeout(this.silenceTimer);
      this.silenceTimer = null;
    }
  }

  private clearStartTimer() {
    if (this.startTimer) {
      clearTimeout(this.startTimer);
      this.startTimer = null;
    }
  }

  private resolvePendingStart(started: boolean) {
    this.clearStartTimer();
    this.resolveStart?.(started);
    this.resolveStart = null;
    this.startPromise = null;
  }

  public get isStarting(): boolean {
    return this.startPromise !== null;
  }

  start(): Promise<boolean> {
    if (!this.recognition) {
      console.error('[SpeechRecognitionManager] Speech recognition is unavailable in this WebView.');
      this.notify({ type: 'error', error: { error: 'not-supported' } });
      return Promise.resolve(false);
    }
    this.shouldRestart = true;
    if (this.listening) {
      console.info('[SpeechRecognitionManager] Recognition is already active.');
      return Promise.resolve(true);
    }
    if (this.startPromise) {
      console.info('[SpeechRecognitionManager] Recognition startup is already pending.');
      return this.startPromise;
    }

    console.info('[SpeechRecognitionManager] Starting recognition.');
    let resolve: (started: boolean) => void = () => undefined;
    const pendingStart = new Promise<boolean>((complete) => {
      resolve = complete;
    });
    // Store the promise before calling the browser API. This closes the race
    // where a synchronously delivered lifecycle event could otherwise leave a
    // stale "starting" flag behind.
    this.startPromise = pendingStart;
    this.resolveStart = resolve;
    this.startTimer = setTimeout(() => {
      if (!this.startPromise) return;
      console.error('[SpeechRecognitionManager] Recognition did not start before the startup timeout.');
      this.shouldRestart = false;
      this.resolvePendingStart(false);
      this.notify({ type: 'error', error: { error: 'start-timeout' } });
      try { (this.recognition as any)?.abort(); } catch (_) { /* ignore */ }
    }, VOICE_CONFIG.recognitionStartTimeoutMs);

    try {
      this.recognition.start();
    } catch (error: any) {
      if (error?.name === 'InvalidStateError' || error?.message?.includes('already started')) {
        console.info('[SpeechRecognitionManager] Recognition is already active or in start transition.');
        this.listening = true;
        this.resolvePendingStart(true);
        return pendingStart;
      }
      console.error('[SpeechRecognitionManager] Recognition start threw:', error);
      this.shouldRestart = false;
      this.resolvePendingStart(false);
      this.notify({ type: 'error', error: { error: 'start-failed', cause: error } });
    }
    return pendingStart;
  }

  stop() {
    this.shouldRestart = false;
    this.clearSilenceTimer();
    if (!this.recognition) return;

    try {
      if (this.isStarting) {
        console.info('[SpeechRecognitionManager] Cancelling pending recognition startup.');
        this.resolvePendingStart(false);
        (this.recognition as any).abort();
      } else if (this.listening) {
        this.recognition.stop();
      }
    } catch (e) {
      console.warn('SpeechRecognition stop error:', e);
    }
  }

  pause() {
    this.stop();
  }

  resume() {
    this.start();
  }

  cancel() {
    this.shouldRestart = false;
    this.clearSilenceTimer();
    this.resolvePendingStart(false);
    if (!this.recognition) return;
    try {
      (this.recognition as any).abort();
      this.listening = false;
    } catch (_) { /* ignore */ }
  }

  clear() {
    this.transcript = '';
  }
}

export const speechRecognitionManager = new SpeechRecognitionManager();
export default speechRecognitionManager;
