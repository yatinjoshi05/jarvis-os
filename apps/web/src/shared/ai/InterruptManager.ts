import { voiceStateMachine } from './VoiceStateMachine';
import { microphoneManager } from './MicrophoneManager';
import { voiceSettings } from './VoiceSettings';
import { voiceManager } from './VoiceManager';

class InterruptManager {
  private checkInterval: ReturnType<typeof setInterval> | null = null;

  public startMonitoring() {
    this.stopMonitoring();

    this.checkInterval = setInterval(() => {
      if (!voiceSettings.settings.autoInterrupt) return;

      const state = voiceStateMachine.state;
      // We only interrupt if JARVIS is speaking or streaming output
      if (state === 'SPEAKING' || state === 'STREAMING') {
        if (microphoneManager.isUserSpeaking()) {
          console.log('[InterruptManager] User voice detected during output. Triggering Interruption!');
          this.triggerInterruption();
        }
      }
    }, 100);
  }

  public stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  public triggerInterruption() {
    voiceManager.interrupt();
  }
}

export const interruptManager = new InterruptManager();
export default interruptManager;
