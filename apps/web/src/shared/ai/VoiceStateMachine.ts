export type VoiceState =
  | 'IDLE'
  | 'LISTENING'
  | 'TRANSCRIBING'
  | 'THINKING'
  | 'GENERATING'
  | 'STREAMING'
  | 'SPEAKING'
  | 'ERROR'
  | 'INTERRUPTED'
  | 'MUTED'
  | 'PERMISSION_DENIED';

type VoiceStateListener = (state: VoiceState, previousState: VoiceState) => void;

class VoiceStateMachine {
  private currentState: VoiceState = 'IDLE';
  private listeners = new Set<VoiceStateListener>();

  public get state() {
    return this.currentState;
  }

  public subscribe(listener: VoiceStateListener) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public transitionTo(nextState: VoiceState) {
    if (this.currentState === nextState) return;
    const prev = this.currentState;
    this.currentState = nextState;
    console.log(`[VoiceStateMachine] ${prev} -> ${nextState}`);
    this.listeners.forEach((listener) => {
      try {
        listener(nextState, prev);
      } catch (e) {
        console.error('Error in state machine listener:', e);
      }
    });
  }
}

export const voiceStateMachine = new VoiceStateMachine();
