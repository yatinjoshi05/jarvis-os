/**
 * AudioManager.ts
 * Main orchestrator for the JARVIS OS Premium Ambient Audio Engine.
 * - Bridges VoiceStateMachine / AssistantState to AudioStateMachine without polling.
 * - Coordinates AudioMixer ambient tracks & UI sound effects.
 * - Handles Startup / Shutdown sequences and window unload cleanup.
 * - Prints structured [Audio] logs for real-time diagnostics.
 */

import { voiceStateMachine, VoiceState } from '../ai/VoiceStateMachine';
import { audioSettings } from './AudioSettings';
import { audioMixer } from './AudioMixer';
import { audioStateMachine } from './AudioStateMachine';
import { AudioState, AudioChannel, UiSoundType } from './AudioTypes';
import { globeStateManager } from '../../entities/globe/model/GlobeStateManager';

export class AudioManager {
  private isInitialized = false;
  private unsubscribeVoiceState: (() => void) | null = null;
  private unsubscribeAudioState: (() => void) | null = null;
  private startupTimer: any = null;

  constructor() {
    this.init();
  }

  public init() {
    if (this.isInitialized) return;

    this.isInitialized = true;

    // 1. Subscribe to AudioStateMachine transitions to drive AudioMixer ambient soundscapes
    this.unsubscribeAudioState = audioStateMachine.subscribe((newState) => {
      this.handleAudioStateChange(newState);
      globeStateManager.setAudioState(newState);
    });

    // 2. Subscribe to VoiceStateMachine / AssistantState changes for event-driven integration
    this.unsubscribeVoiceState = voiceStateMachine.subscribe((voiceState) => {
      this.handleVoiceStateTransition(voiceState);
    });

    // 3. Attach window unload event for automatic audio resource cleanup
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', this.handleUnload);
    }

    console.log('[Audio] Premium Ambient Audio Engine initialized & connected to AssistantState.');
  }

  private handleUnload = () => {
    this.shutdown();
  };

  /**
   * Automatically maps Assistant VoiceState to AudioStateMachine state without polling.
   */
  private handleVoiceStateTransition(voiceState: VoiceState) {
    console.log(`[Audio] Assistant State Changed → ${voiceState}`);
    switch (voiceState) {
      case 'IDLE':
        if (audioStateMachine.state === 'Speaking') {
          console.log('[Audio] Voice Finished');
          console.log('[Audio] Returning to Idle');
        }
        audioStateMachine.transitionTo('Idle');
        break;
      case 'LISTENING':
        audioStateMachine.transitionTo('Listening');
        this.playUiSound('click');
        break;
      case 'THINKING':
      case 'TRANSCRIBING':
      case 'GENERATING':
      case 'STREAMING':
      case 'EXECUTING':
        audioStateMachine.transitionTo('Thinking');
        break;
      case 'SPEAKING':
        console.log('[Audio] Voice Started');
        audioStateMachine.transitionTo('Speaking');
        break;
      case 'ERROR':
      case 'PERMISSION_DENIED':
        audioStateMachine.transitionTo('Error');
        this.playUiSound('error');
        // Auto-recover Error -> Idle after brief feedback duration
        setTimeout(() => {
          if (audioStateMachine.state === 'Error') {
            audioStateMachine.transitionTo('Idle');
          }
        }, 1500);
        break;
    }
  }

  /**
   * Plays ambient track corresponding to AudioState.
   */
  private handleAudioStateChange(state: AudioState) {
    console.log(`[Audio] Current State = ${state}`);
    const ambientSrc = audioStateMachine.getAmbientSrcForState(state);
    if (ambientSrc) {
      const isLoop = ['Idle', 'Listening', 'Thinking', 'Speaking'].includes(state);
      audioMixer.playAmbient(ambientSrc, isLoop);
    } else {
      if (state === 'Exit') {
        audioMixer.stopAmbient();
      }
    }
  }

  /**
   * Executes the Startup audio sequence:
   * 1. Application opens -> Play startup.mp3 once
   * 2. After startup finishes -> Automatically start idle.mp3, Loop forever.
   */
  public async start(): Promise<void> {
    if (this.startupTimer) {
      clearTimeout(this.startupTimer);
    }

    console.log('[Audio] Starting Ambient Audio Engine lifecycle (Startup ➔ Idle)');
    audioStateMachine.transitionTo('Startup');
    this.playUiSound('notification');

    // Wait for startup sound playback duration, then transition Startup -> Idle
    this.startupTimer = setTimeout(() => {
      if (audioStateMachine.state === 'Startup') {
        audioStateMachine.transitionTo('Idle');
      }
    }, 1400);
  }

  /**
   * Executes the Shutdown audio sequence:
   * 1. App closes -> Fade everything out, play shutdown.mp3
   * 2. Dispose every audio resource.
   */
  public async shutdown(): Promise<void> {
    if (this.startupTimer) {
      clearTimeout(this.startupTimer);
      this.startupTimer = null;
    }

    console.log('[Audio] Shutting down Ambient Audio Engine...');
    audioStateMachine.transitionTo('Shutdown');

    setTimeout(() => {
      if (audioStateMachine.state === 'Shutdown') {
        audioStateMachine.transitionTo('Exit');
        this.dispose();
      }
    }, 1400);
  }

  /**
   * Trigger UI sound effect (click, notification, success, error).
   */
  public playUiSound(type: UiSoundType): Promise<boolean> {
    return audioMixer.playUiSound(type);
  }

  /**
   * Set volume for specific channel (ambient, ui, voice, master).
   */
  public setVolume(channel: AudioChannel, value: number): void {
    audioSettings.setVolume(channel, value);
  }

  public getVolume(channel: AudioChannel): number {
    return audioSettings.getVolume(channel);
  }

  public setMuted(muted: boolean): void {
    audioSettings.setMuted(muted);
  }

  public isMuted(): boolean {
    return audioSettings.getState().isMuted;
  }

  public toggleMute(): boolean {
    return audioSettings.toggleMute();
  }

  public setFadeDuration(ms: number): void {
    audioSettings.setFadeDuration(ms);
  }

  public get state(): AudioState {
    return audioStateMachine.state;
  }

  /**
   * Resource cleanup on window unload or component unmount.
   */
  public dispose() {
    if (typeof window !== 'undefined') {
      window.removeEventListener('beforeunload', this.handleUnload);
    }

    if (this.unsubscribeVoiceState) {
      this.unsubscribeVoiceState();
      this.unsubscribeVoiceState = null;
    }

    if (this.unsubscribeAudioState) {
      this.unsubscribeAudioState();
      this.unsubscribeAudioState = null;
    }

    if (this.startupTimer) {
      clearTimeout(this.startupTimer);
      this.startupTimer = null;
    }

    audioMixer.dispose();
    this.isInitialized = false;
    console.log('[Audio] Ambient Audio Engine disposed cleanly.');
  }
}

export const audioManager = new AudioManager();
export default audioManager;
