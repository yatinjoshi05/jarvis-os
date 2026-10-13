import { AudioChannel, AudioSettingsState, SoundKey } from './AudioTypes';
import { audioEvents } from './AudioEvents';

type AudioSettingsListener = (state: AudioSettingsState) => void;

const DEFAULT_SOUND_VOLUMES: Record<SoundKey, number> = {
  startup: 1.0,
  idle: 0.8,
  listening: 1.0,
  thinking: 0.9,
  speaking: 0.85,
  shutdown: 1.0,
  click: 0.7,
  typing: 0.5,
  notification: 0.9,
  success: 1.0,
  error: 1.0,
};

const DEFAULT_SOUND_MUTES: Record<SoundKey, boolean> = {
  startup: false,
  idle: false,
  listening: false,
  thinking: false,
  speaking: false,
  shutdown: false,
  click: false,
  typing: false,
  notification: false,
  success: false,
  error: false,
};

const SOUND_CHANNEL_MAP: Record<SoundKey, 'ambient' | 'ui' | 'voice'> = {
  startup: 'ambient',
  idle: 'ambient',
  listening: 'ambient',
  thinking: 'ambient',
  speaking: 'ambient',
  shutdown: 'ambient',
  click: 'ui',
  typing: 'ui',
  notification: 'ui',
  success: 'ui',
  error: 'ui',
};

class AudioSettingsManager {
  private storageKey = 'jarvis_audio_settings';
  private listeners: Set<AudioSettingsListener> = new Set();

  private state: AudioSettingsState = {
    ambientVolume: 0.4,
    uiVolume: 0.6,
    voiceVolume: 0.8,
    masterVolume: 1.0,
    isMuted: false,
    fadeDurationMs: 500,
    soundVolumes: { ...DEFAULT_SOUND_VOLUMES },
    soundMutes: { ...DEFAULT_SOUND_MUTES },
  };

  constructor() {
    this.loadPersistedSettings();
  }

  private loadPersistedSettings() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const data = localStorage.getItem(this.storageKey);
        if (data) {
          const parsed = JSON.parse(data);
          const loadedVolumes = { ...DEFAULT_SOUND_VOLUMES };
          if (parsed.soundVolumes && typeof parsed.soundVolumes === 'object') {
            for (const k of Object.keys(DEFAULT_SOUND_VOLUMES) as SoundKey[]) {
              if (typeof parsed.soundVolumes[k] === 'number') {
                loadedVolumes[k] = this.clamp(parsed.soundVolumes[k]);
              }
            }
          }
          const loadedMutes = { ...DEFAULT_SOUND_MUTES };
          if (parsed.soundMutes && typeof parsed.soundMutes === 'object') {
            for (const k of Object.keys(DEFAULT_SOUND_MUTES) as SoundKey[]) {
              if (typeof parsed.soundMutes[k] === 'boolean') {
                loadedMutes[k] = Boolean(parsed.soundMutes[k]);
              }
            }
          }

          this.state = {
            ambientVolume: typeof parsed.ambientVolume === 'number' ? this.clamp(parsed.ambientVolume) : 0.4,
            uiVolume: typeof parsed.uiVolume === 'number' ? this.clamp(parsed.uiVolume) : 0.6,
            voiceVolume: typeof parsed.voiceVolume === 'number' ? this.clamp(parsed.voiceVolume) : 0.8,
            masterVolume: typeof parsed.masterVolume === 'number' ? this.clamp(parsed.masterVolume) : 1.0,
            isMuted: Boolean(parsed.isMuted),
            fadeDurationMs: typeof parsed.fadeDurationMs === 'number' ? this.clampFade(parsed.fadeDurationMs) : 500,
            soundVolumes: loadedVolumes,
            soundMutes: loadedMutes,
          };
        }
      }
    } catch (_) {
      // Use defaults if storage access fails
    }
  }

  private persistSettings() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(this.storageKey, JSON.stringify(this.state));
      }
    } catch (_) {
      // Ignore storage write errors
    }
  }

  private clamp(val: number): number {
    return Math.max(0, Math.min(1, val));
  }

  private clampFade(val: number): number {
    return Math.max(100, Math.min(5000, val));
  }

  private notify(changedChannel?: AudioChannel) {
    this.persistSettings();
    const currentState = this.getState();

    if (changedChannel) {
      audioEvents.emit('volumeChanged', {
        channel: changedChannel,
        volume: this.getVolume(changedChannel),
        effectiveVolume: changedChannel === 'master' ? 1.0 : this.getEffectiveVolume(changedChannel as 'ambient' | 'ui' | 'voice'),
      });
    }

    this.listeners.forEach((listener) => {
      try {
        listener(currentState);
      } catch (err) {
        console.error('[AudioSettings] Error in listener:', err);
      }
    });
  }

  public getState(): AudioSettingsState {
    return {
      ...this.state,
      soundVolumes: { ...this.state.soundVolumes },
      soundMutes: { ...this.state.soundMutes },
    };
  }

  public subscribe(listener: AudioSettingsListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public setVolume(channel: AudioChannel, value: number): void {
    const clamped = this.clamp(value);
    switch (channel) {
      case 'ambient':
        this.state.ambientVolume = clamped;
        break;
      case 'ui':
        this.state.uiVolume = clamped;
        break;
      case 'voice':
        this.state.voiceVolume = clamped;
        break;
      case 'master':
        this.state.masterVolume = clamped;
        break;
    }
    this.notify(channel);
  }

  public getVolume(channel: AudioChannel): number {
    switch (channel) {
      case 'ambient':
        return this.state.ambientVolume;
      case 'ui':
        return this.state.uiVolume;
      case 'voice':
        return this.state.voiceVolume;
      case 'master':
        return this.state.masterVolume;
    }
  }

  public setSoundVolume(key: SoundKey, value: number): void {
    const clamped = this.clamp(value);
    this.state.soundVolumes[key] = clamped;
    const channel = SOUND_CHANNEL_MAP[key] || 'ambient';
    this.notify(channel);
  }

  public getSoundVolume(key: SoundKey): number {
    return typeof this.state.soundVolumes[key] === 'number'
      ? this.state.soundVolumes[key]
      : (DEFAULT_SOUND_VOLUMES[key] ?? 1.0);
  }

  public setSoundMuted(key: SoundKey, muted: boolean): void {
    this.state.soundMutes[key] = Boolean(muted);
    const channel = SOUND_CHANNEL_MAP[key] || 'ambient';
    this.notify(channel);
  }

  public getSoundMuted(key: SoundKey): boolean {
    return Boolean(this.state.soundMutes[key]);
  }

  public toggleSoundMute(key: SoundKey): boolean {
    const current = this.getSoundMuted(key);
    this.setSoundMuted(key, !current);
    return !current;
  }

  public setMuted(muted: boolean): void {
    this.state.isMuted = muted;
    audioEvents.emit('mutedChanged', { isMuted: muted });
    this.notify();
  }

  public toggleMute(): boolean {
    this.state.isMuted = !this.state.isMuted;
    audioEvents.emit('mutedChanged', { isMuted: this.state.isMuted });
    this.notify();
    return this.state.isMuted;
  }

  public setFadeDuration(ms: number): void {
    this.state.fadeDurationMs = this.clampFade(ms);
    audioEvents.emit('fadeDurationChanged', { fadeDurationMs: this.state.fadeDurationMs });
    this.notify();
  }

  /**
   * Calculates effective volume (0.0 to 1.0) taking channel volume,
   * master volume, and global mute state into account.
   */
  public getEffectiveVolume(channel: 'ambient' | 'ui' | 'voice'): number {
    if (this.state.isMuted) return 0;
    const channelVol = this.getVolume(channel);
    return channelVol * this.state.masterVolume;
  }

  /**
   * Calculates effective volume for a specific sound event (0.0 to 1.0)
   * taking sound volume, sound mute state, channel volume, master volume, and global mute state into account.
   */
  public getEffectiveSoundVolume(key: SoundKey): number {
    if (this.state.isMuted || this.getSoundMuted(key)) return 0;
    const soundVol = this.getSoundVolume(key);
    const channel = SOUND_CHANNEL_MAP[key] || 'ambient';
    const channelVol = this.getVolume(channel);
    return soundVol * channelVol * this.state.masterVolume;
  }
}

export const audioSettings = new AudioSettingsManager();
export default audioSettings;
