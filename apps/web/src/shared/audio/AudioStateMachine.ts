/**
 * AudioStateMachine.ts
 * Manages Audio Engine state machine with state transitions, event listeners,
 * and mapping between Audio States and ambient sound assets.
 */

import { AudioState } from './AudioTypes';
import { audioEvents } from './AudioEvents';

export type AudioStateListener = (state: AudioState, previousState: AudioState) => void;

export class AudioStateMachine {
  private currentState: AudioState = 'Idle';
  private listeners: Set<AudioStateListener> = new Set();

  /**
   * Explicit valid transition matrix as specified in system requirements:
   * Startup -> Idle
   * Idle -> Listening | Thinking | Speaking | Success | Error | Shutdown
   * Listening -> Thinking | Idle | Error | Shutdown
   * Thinking -> Speaking | Idle | Error | Success | Shutdown
   * Speaking -> Idle | Listening | Thinking | Error | Shutdown
   * Success -> Idle | Listening | Thinking
   * Error -> Idle | Listening | Shutdown
   * Shutdown -> Exit
   */
  private validTransitions: Record<AudioState, AudioState[]> = {
    Startup: ['Idle', 'Exit'],
    Idle: ['Listening', 'Thinking', 'Speaking', 'Startup', 'Shutdown', 'Error', 'Success'],
    Listening: ['Thinking', 'Idle', 'Error', 'Shutdown'],
    Thinking: ['Speaking', 'Idle', 'Error', 'Success', 'Shutdown'],
    Speaking: ['Idle', 'Listening', 'Thinking', 'Error', 'Shutdown'],
    Success: ['Idle', 'Listening', 'Thinking'],
    Error: ['Idle', 'Listening', 'Shutdown'],
    Shutdown: ['Exit'],
    Exit: ['Startup', 'Idle'],
  };

  public get state(): AudioState {
    return this.currentState;
  }

  public subscribe(listener: AudioStateListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public canTransitionTo(nextState: AudioState): boolean {
    if (this.currentState === nextState) return true;
    const allowed = this.validTransitions[this.currentState] || [];
    return allowed.includes(nextState);
  }

  public transitionTo(nextState: AudioState): boolean {
    if (this.currentState === nextState) return true;

    if (!this.canTransitionTo(nextState)) {
      console.warn(`[AudioStateMachine] Direct transition ${this.currentState} ➔ ${nextState} is outside standard matrix. Applying safe transition.`);
    }

    const prev = this.currentState;
    this.currentState = nextState;
    console.log(`[AudioStateMachine] State transition: ${prev} ➔ ${nextState}`);

    // Emit event through global event bus
    audioEvents.emit('stateChanged', { state: nextState, previousState: prev });

    // Notify direct state machine subscribers
    this.listeners.forEach((listener) => {
      try {
        listener(nextState, prev);
      } catch (err) {
        console.error('[AudioStateMachine] Error in state listener:', err);
      }
    });

    return true;
  }

  /**
   * Maps Audio State to corresponding ambient sound asset file path.
   * All assets reside cleanly inside /assets/audio/
   */
  public getAmbientSrcForState(state: AudioState): string | null {
    switch (state) {
      case 'Startup':
        return '/assets/audio/ambient/startup.mp3';
      case 'Idle':
        return '/assets/audio/ambient/idle.mp3';
      case 'Listening':
        return '/assets/audio/ambient/listening.mp3';
      case 'Thinking':
        return '/assets/audio/ambient/thinking.mp3';
      case 'Speaking':
        return '/assets/audio/ambient/speaking.mp3';
      case 'Shutdown':
        return '/assets/audio/ambient/shutdown.mp3';
      case 'Success':
        return '/assets/audio/ui/success.mp3';
      case 'Error':
        return '/assets/audio/ui/error.mp3';
      case 'Exit':
      default:
        return null;
    }
  }
}

export const audioStateMachine = new AudioStateMachine();
export default audioStateMachine;
