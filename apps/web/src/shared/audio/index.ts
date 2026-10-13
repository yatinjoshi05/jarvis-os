/**
 * Barrel exports for JARVIS OS Premium Ambient Audio Engine.
 */

export { audioManager, AudioManager } from './AudioManager';
export { audioSettings } from './AudioSettings';
export { audioMixer, AudioMixer } from './AudioMixer';
export { audioStateMachine, AudioStateMachine } from './AudioStateMachine';
export { AudioPlayer } from './AudioPlayer';
export { audioEvents, AudioEventEmitter } from './AudioEvents';

export type {
  AudioState,
  AudioChannel,
  UiSoundType,
  AudioSettingsState,
  PlayOptions,
  AudioEventPayloads,
  AudioEventType,
  AudioEventListener,
} from './AudioTypes';
