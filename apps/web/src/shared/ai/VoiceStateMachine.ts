export type VoiceState =
  | 'IDLE'
  | 'LISTENING'
  | 'TRANSCRIBING'
  | 'THINKING'
  | 'GENERATING'
  | 'STREAMING'
  | 'EXECUTING'
  | 'SPEAKING'
  | 'ERROR'
  | 'INTERRUPTED'
  | 'MUTED'
  | 'PERMISSION_DENIED';

type VoiceStateListener = (state: VoiceState, previousState: VoiceState) => void;

class VoiceStateMachine {
  private currentState: VoiceState = 'IDLE';
  private listeners = new Set<VoiceStateListener>();
  private watchdogTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly WATCHDOG_TIMEOUT_MS = 25000; // 25s safety watchdog

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

    if (this.watchdogTimer) {
      clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
    }

    const prev = this.currentState;
    this.currentState = nextState;
    console.log(`[VoiceStateMachine] ${prev} -> ${nextState}`);

    // Schedule watchdog for THINKING / GENERATING / STREAMING states
    if (['THINKING', 'TRANSCRIBING', 'GENERATING', 'STREAMING'].includes(nextState)) {
      this.watchdogTimer = setTimeout(() => {
        console.warn(`[VoiceStateMachine] Watchdog triggered! State "${this.currentState}" exceeded ${this.WATCHDOG_TIMEOUT_MS / 1000}s limit. Forcing transition to ERROR.`);
        this.transitionTo('ERROR');
        setTimeout(() => {
          if (this.currentState === 'ERROR') {
            this.transitionTo('IDLE');
          }
        }, 1500);
      }, this.WATCHDOG_TIMEOUT_MS);
    }

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
export default voiceStateMachine;
