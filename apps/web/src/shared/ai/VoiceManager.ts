import { microphoneManager } from './MicrophoneManager';
import { speechRecognitionManager } from './SpeechRecognitionManager';
import { textToSpeechManager } from './TextToSpeechManager';
import { interruptManager } from './InterruptManager';
import { voiceSettings } from './VoiceSettings';
import { voiceStateMachine } from './VoiceStateMachine';
import { assistantState } from './AssistantState';
import { aiEventEmitter, AIEvents } from './AIEvents';
import { elevenLabsProvider } from './ElevenLabsProvider';

class VoiceManager {
  private isStarting = false;

  constructor() {
    this.init();
  }

  private init() {
    interruptManager.startMonitoring();

    speechRecognitionManager.subscribe((event) => {
      if (event.type === 'silence_timeout') {
        // Passive IDLE recognition is the wake-word listener. It must remain
        // active through silence; only an active user-command session times out.
        if (voiceStateMachine.state === 'LISTENING') {
          console.info('[VoiceManager] No speech detected during an active recognition session.');
          aiEventEmitter.emit('voice:silence_timeout');
          this.stopListening();
        }
      } else if (event.type === 'start') {
        aiEventEmitter.emit(AIEvents.AI_REQUEST_STARTED);
      } else if (event.type === 'error') {
        const code = event.error?.error || 'unknown';
        console.error(`[VoiceManager] Speech recognition failed (${code}).`, event.error);
        assistantState.setError(this.describeRecognitionError(code));
      }

      // Barge-in: Interrupt speech if user starts speaking while JARVIS is speaking
      if (event.type === 'result' && voiceStateMachine.state === 'SPEAKING') {
        console.log(`[VoiceManager] Speech detected during SPEAKING (${event.type}). Interrupting...`);
        this.interrupt();
      }
    });

    // Auto-listen in background when assistant enters SPEAKING state to allow barge-in
    voiceStateMachine.subscribe((state) => {
      if (state === 'SPEAKING') {
        speechRecognitionManager.start();
      }
    });
  }

  public async startListening(): Promise<boolean> {
    if (this.isStarting || speechRecognitionManager.isStarting || microphoneManager.state === 'requesting') {
      console.info('[VoiceManager] Mic request ignored because recognition startup or permission request is pending.');
      return false;
    }
    this.isStarting = true;
    try {
      const perm = await microphoneManager.requestPermission();
      if (!perm) {
        if (microphoneManager.state !== 'denied') {
          assistantState.setError(microphoneManager.getLastErrorMessage());
        }
        return false;
      }

      speechRecognitionManager.clear();
      const started = await speechRecognitionManager.start();
      if (!started) {
        // The manager emits a specific error for the UI and logs the lifecycle
        // failure. Do not ever claim that we are listening here.
        return false;
      }
      assistantState.startListening();
      return true;
    } finally {
      this.isStarting = false;
    }
  }

  private describeRecognitionError(code: string): string {
    switch (code) {
      case 'not-allowed':
      case 'service-not-allowed':
        return 'Speech recognition permission was denied. Allow microphone and speech access, then try again.';
      case 'audio-capture':
        return 'Speech recognition could not access the microphone. Check that it is connected and not in use.';
      case 'network':
        return 'Speech recognition needs a network connection. Check your connection and try again.';
      case 'not-supported':
        return 'Speech recognition is unavailable in this desktop WebView.';
      case 'start-timeout':
        return 'The microphone did not start in time. Please try again.';
      default:
        return 'Speech recognition failed to start. Please try again.';
    }
  }

  public stopListening() {
    speechRecognitionManager.stop();
    assistantState.stopListening();
  }

  public pauseListening() {
    speechRecognitionManager.pause();
  }

  public resumeListening() {
    speechRecognitionManager.resume();
  }

  public async speak(text: string, priority: 'HIGH' | 'NORMAL' | 'LOW' = 'NORMAL'): Promise<void> {
    const speakPromise = textToSpeechManager.startQueue();
    textToSpeechManager.addSentence(text, priority);
    textToSpeechManager.finishQueue();
    return speakPromise;
  }

  public stopSpeaking() {
    textToSpeechManager.stop();
  }

  public pauseSpeaking() {
    elevenLabsProvider.pause();
    try {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.pause();
      }
    } catch (_) {}
  }

  public resumeSpeaking() {
    elevenLabsProvider.resume();
    try {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.resume();
      }
    } catch (_) {}
  }

  public interrupt() {
    voiceManager.stopSpeaking();
    assistantState.setCaption('');
    voiceStateMachine.transitionTo('INTERRUPTED');
    setTimeout(() => {
      this.startListening();
    }, 100);
  }

  public mute() {
    microphoneManager.mute();
  }

  public unmute() {
    microphoneManager.unmute();
  }

  public setVoice(voiceName: string) {
    voiceSettings.update({ voice: voiceName });
  }

  public setLanguage(lang: string) {
    voiceSettings.update({ language: lang });
    speechRecognitionManager.setLanguage(lang);
  }

  public getVoiceStatus() {
    return {
      state: voiceStateMachine.state,
      muted: microphoneManager.isMuted,
      listening: speechRecognitionManager.listening,
      provider: voiceSettings.settings.ttsProvider,
      language: voiceSettings.settings.language,
    };
  }

  public destroy() {
    interruptManager.stopMonitoring();
    microphoneManager.stop();
    speechRecognitionManager.stop();
    textToSpeechManager.cancel();
    elevenLabsProvider.cleanup();
  }
}

export const voiceManager = new VoiceManager();
export default voiceManager;
