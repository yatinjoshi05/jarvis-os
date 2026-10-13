/**
 * AudioTypes.ts
 * Type definitions for JARVIS OS Premium Ambient Audio Engine.
 */

export type AudioState =
  | 'Startup'
  | 'Idle'
  | 'Listening'
  | 'Thinking'
  | 'Speaking'
  | 'Success'
  | 'Error'
  | 'Shutdown'
  | 'Exit';

export type AudioChannel = 'ambient' | 'voice' | 'ui' | 'master';

export type UiSoundType = 'notification' | 'success' | 'error' | 'typing' | 'click';

export type SoundKey =
  | 'startup'
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'shutdown'
  | 'click'
  | 'typing'
  | 'notification'
  | 'success'
  | 'error';

export interface AudioSettingsState {
  ambientVolume: number; // 0.0 to 1.0
  uiVolume: number;      // 0.0 to 1.0
  voiceVolume: number;   // 0.0 to 1.0
  masterVolume: number;  // 0.0 to 1.0
  isMuted: boolean;
  fadeDurationMs: number; // Configurable fade duration (default 500ms)
  soundVolumes: Record<SoundKey, number>;
  soundMutes: Record<SoundKey, boolean>;
}

export interface PlayOptions {
  loop?: boolean;
  targetVolume?: number;
  fadeDurationMs?: number;
  onEnded?: () => void;
}

export interface AudioEventPayloads {
  stateChanged: { state: AudioState; previousState: AudioState };
  volumeChanged: { channel: AudioChannel; volume: number; effectiveVolume: number };
  soundPlayed: { type: UiSoundType | string; channel: AudioChannel };
  mutedChanged: { isMuted: boolean };
  fadeDurationChanged: { fadeDurationMs: number };
  error: { message: string; state?: AudioState };
}

export type AudioEventType = keyof AudioEventPayloads;
export type AudioEventListener<T extends AudioEventType> = (data: AudioEventPayloads[T]) => void;
