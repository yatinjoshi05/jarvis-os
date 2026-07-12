import { voiceStateMachine } from './VoiceStateMachine';
import { textToSpeechManager } from './TextToSpeechManager';
import { speechRecognitionManager } from './SpeechRecognitionManager';
import { assistantState } from './AssistantState';
import { microphoneManager } from './MicrophoneManager';
import { VOICE_CONFIG } from './config';

class InterruptManager {
  private checkInterval: ReturnType<typeof setInterval> | null = null;

  public startMonitoring() {
    this.stopMonitoring();

    this.checkInterval = setInterval(() => {
      if (!VOICE_CONFIG.autoInterrupt) return;

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
    // 1. Voice immediately stops
    textToSpeechManager.cancel();
    
    // 2. Clear current captions and transition state
    assistantState.setCaption('');
    voiceStateMachine.transitionTo('INTERRUPTED');

    // 3. Microphone/Recognition immediately activates
    setTimeout(() => {
      assistantState.startListening();
      speechRecognitionManager.clear();
      speechRecognitionManager.start();
    }, 100);
  }
}

export const interruptManager = new InterruptManager();
export default interruptManager;
