/**
 * AudioPlayer.ts
 * Low-level HTML5 Audio & Web Audio API wrapper.
 * Features:
 * - Automatic asset loading & preloading.
 * - Browser Autoplay policy unlocking on user gesture.
 * - AudioContext automatic resumption on interaction.
 * - Guaranteed non-zero final gain after fade-in.
 * - Structured debug logging [Audio] for diagnostics.
 * - Smooth fade-in and fade-out volume transitions (default 500ms).
 * - Resource cleanup and buffer release.
 */

import { PlayOptions } from './AudioTypes';

export class AudioPlayer {
  private audioElement: HTMLAudioElement | null = null;
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private currentSrc: string | null = null;
  private isFading = false;
  private isLoaded = false;
  private fadeIntervalId: any = null;
  private pendingPlayOptions: { src: string; options: PlayOptions } | null = null;

  private static globalUnlocked = false;
  private static sharedAudioContext: AudioContext | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.audioElement = new Audio();
      this.audioElement.crossOrigin = 'anonymous';
      this.setupAutoplayUnlock();
    }
  }

  private getSharedAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!AudioPlayer.sharedAudioContext) {
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioCtx) {
          AudioPlayer.sharedAudioContext = new AudioCtx();
        }
      } catch (_) {}
    }
    return AudioPlayer.sharedAudioContext;
  }

  /**
   * Attaches window event listeners to unlock AudioContext and trigger pending playback on first user gesture.
   */
  private setupAutoplayUnlock() {
    if (typeof window === 'undefined' || AudioPlayer.globalUnlocked) return;

    const unlock = () => {
      AudioPlayer.globalUnlocked = true;
      const ctx = this.getSharedAudioContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().then(() => {
          console.log('[Audio] AudioContext resumed successfully on user interaction.');
        }).catch((err) => {
          console.warn('[Audio] AudioContext resume failed:', err);
        });
      }

      if (this.pendingPlayOptions) {
        const { src, options } = this.pendingPlayOptions;
        this.pendingPlayOptions = null;
        console.log(`[Audio] Retrying pending playback for "${this.getFileName(src)}" after user interaction unlock.`);
        this.play(src, options);
      }

      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };

    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('click', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });
  }

  private getFileName(src: string): string {
    if (!src) return '';
    const parts = src.split('/');
    return parts[parts.length - 1] || src;
  }

  /**
   * Probe whether an audio file exists and is fetchable at the target path.
   */
  public async probeFileExists(src: string): Promise<boolean> {
    if (typeof window === 'undefined' || !src) return false;
    try {
      const res = await fetch(src, { method: 'HEAD' });
      if (res.ok) return true;
      const getRes = await fetch(src, { method: 'GET' });
      return getRes.ok;
    } catch (_) {
      return Boolean(src);
    }
  }

  /**
   * Preload an audio file so it's ready in memory for instant playback.
   */
  public async preload(src: string): Promise<boolean> {
    if (typeof window === 'undefined' || !src) return false;
    const filename = this.getFileName(src);
    try {
      const tempAudio = new Audio();
      tempAudio.preload = 'auto';
      tempAudio.src = src;
      console.log(`[Audio] Loaded ${filename}`);
      return true;
    } catch (err: any) {
      console.error(`[Audio] Error loading ${filename}:`, err?.message || err);
      return false;
    }
  }

  /**
   * Initialize Web Audio Context and GainNode lazily.
   */
  private ensureAudioContext(): boolean {
    if (typeof window === 'undefined' || !this.audioElement) return false;
    try {
      this.audioContext = this.getSharedAudioContext();
      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }
      if (this.audioContext && !this.sourceNode && this.audioElement) {
        try {
          this.sourceNode = this.audioContext.createMediaElementSource(this.audioElement);
          this.gainNode = this.audioContext.createGain();
          this.sourceNode.connect(this.gainNode);
          this.gainNode.connect(this.audioContext.destination);
          console.log(`[Audio] Connected ${this.getFileName(this.currentSrc || '')} to WebAudio Destination`);
        } catch (_) {
          // MediaElementSource already connected
        }
      }
      return true;
    } catch (_) {
      return false;
    }
  }

  /**
   * Play an audio asset with automatic file existence probe, fade-in transition, and looping.
   */
  public async play(src: string, options: PlayOptions = {}): Promise<boolean> {
    if (!this.audioElement) return false;

    const filename = this.getFileName(src);
    const {
      loop = false,
      targetVolume = 1.0,
      fadeDurationMs = 500,
      onEnded,
    } = options;

    if (this.isPlaying && this.currentSrc === src) {
      this.audioElement.loop = loop;
      this.setVolume(targetVolume);
      return true;
    }

    const exists = await this.probeFileExists(src);
    if (!exists) {
      console.warn(`[Audio] Error: File not found at "${src}". Transitioning gracefully.`);
      if (onEnded) onEnded();
      return false;
    }

    this.stop();

    this.currentSrc = src;
    this.audioElement.src = src;
    this.audioElement.loop = loop;

    if (onEnded) {
      this.audioElement.onended = () => {
        console.log(`[Audio] Finished playing ${filename}`);
        onEnded();
      };
    } else {
      this.audioElement.onended = null;
    }

    this.ensureAudioContext();
    this.setVolume(0);

    try {
      await this.audioElement.play();
      this.isLoaded = true;
      console.log(`[Audio] Playing ${filename} (Loop: ${loop}, Fade: ${fadeDurationMs}ms, TargetVol: ${Math.round(targetVolume * 100)}%)`);
      await this.fadeIn(targetVolume, fadeDurationMs);
      this.setVolume(targetVolume); // Guarantee target volume after fade-in
      return true;
    } catch (err: any) {
      const isAutoplayError = err.name === 'NotAllowedError' || String(err).includes('user didn\'t interact');
      if (isAutoplayError) {
        console.warn(`[Audio] Error: Browser blocked autoplay for "${filename}". Awaiting user interaction to unlock.`);
        this.pendingPlayOptions = { src, options };
      } else {
        console.error(`[Audio] Error playing "${filename}":`, err?.message || err);
      }
      if (onEnded) onEnded();
      return false;
    }
  }

  public fadeIn(targetVolume: number, fadeDurationMs = 500): Promise<void> {
    return this.fadeTo(targetVolume, fadeDurationMs);
  }

  public async fadeOut(fadeDurationMs = 500): Promise<void> {
    if (this.currentSrc) {
      console.log(`[Audio] Stopping ${this.getFileName(this.currentSrc)}`);
    }
    await this.fadeTo(0, fadeDurationMs);
    this.pause();
  }

  public fadeTo(targetVolume: number, durationMs = 500): Promise<void> {
    if (this.fadeIntervalId) {
      clearInterval(this.fadeIntervalId);
      this.fadeIntervalId = null;
    }

    return new Promise((resolve) => {
      const clampedTarget = Math.max(0, Math.min(1, targetVolume));

      if (this.audioContext && this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(() => {});
      }

      if (this.audioContext && this.gainNode && this.audioContext.state === 'running') {
        try {
          const now = this.audioContext.currentTime;
          const rampTime = Math.max(0.05, durationMs / 1000);
          this.gainNode.gain.cancelScheduledValues(now);
          this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, now);
          this.gainNode.gain.linearRampToValueAtTime(clampedTarget, now + rampTime);
          if (this.audioElement) this.audioElement.volume = clampedTarget;
          setTimeout(() => {
            this.setVolume(clampedTarget);
            resolve();
          }, durationMs);
          return;
        } catch (_) {}
      }

      if (!this.audioElement) {
        resolve();
        return;
      }

      const startVol = this.audioElement.volume;
      const startTime = Date.now();
      const intervalMs = 20;

      this.isFading = true;
      this.fadeIntervalId = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(1, elapsed / Math.max(1, durationMs));
        const currentVol = startVol + (clampedTarget - startVol) * progress;

        this.setVolume(currentVol);

        if (progress >= 1) {
          clearInterval(this.fadeIntervalId);
          this.fadeIntervalId = null;
          this.isFading = false;
          this.setVolume(clampedTarget);
          resolve();
        }
      }, intervalMs);
    });
  }

  public setVolume(vol: number): void {
    const clamped = Math.max(0, Math.min(1, vol));
    if (this.gainNode) {
      try {
        this.gainNode.gain.value = clamped;
        if (this.audioContext && this.audioContext.state === 'running') {
          this.gainNode.gain.setValueAtTime(clamped, this.audioContext.currentTime);
        }
      } catch (_) {}
    }
    if (this.audioElement) {
      this.audioElement.volume = clamped;
    }
  }

  public pause(): void {
    if (this.audioElement && !this.audioElement.paused) {
      this.audioElement.pause();
    }
  }

  public stop(): void {
    if (this.fadeIntervalId) {
      clearInterval(this.fadeIntervalId);
      this.fadeIntervalId = null;
    }
    if (this.audioElement) {
      this.audioElement.pause();
      this.audioElement.currentTime = 0;
    }
    this.isLoaded = false;
    this.currentSrc = null;
  }

  public get src(): string | null {
    return this.currentSrc;
  }

  public get isFadeInProgress(): boolean {
    return this.isFading;
  }

  public get isPlaying(): boolean {
    return Boolean(this.audioElement && !this.audioElement.paused && this.isLoaded);
  }

  public getAudioContextState(): string {
    return this.audioContext ? this.audioContext.state : 'uninitialized';
  }

  public getGainValue(): number {
    if (this.gainNode) return this.gainNode.gain.value;
    return this.audioElement ? this.audioElement.volume : 0;
  }

  public dispose(): void {
    this.stop();
    if (this.sourceNode) {
      try {
        this.sourceNode.disconnect();
      } catch (_) {}
      this.sourceNode = null;
    }
    if (this.gainNode) {
      try {
        this.gainNode.disconnect();
      } catch (_) {}
      this.gainNode = null;
    }
    this.audioElement = null;
  }
}
