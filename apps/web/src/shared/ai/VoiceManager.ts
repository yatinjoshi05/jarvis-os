import { microphoneManager } from './MicrophoneManager';
import { speechRecognitionManager } from './SpeechRecognitionManager';
import { textToSpeechManager } from './TextToSpeechManager';
import { interruptManager } from './InterruptManager';
import { voiceSettings } from './VoiceSettings';
import { voiceStateMachine } from './VoiceStateMachine';
import { assistantState } from './AssistantState';
import { aiEventEmitter, AIEvents } from './AIEvents';

class VoiceManager {
  constructor() {
    this.init();
  }

  private init() {
    interruptManager.startMonitoring();

    speechRecognitionManager.subscribe((event) => {
      if (event.type === 'silence_timeout') {
        aiEventEmitter.emit('voice:silence_timeout');
        this.stopListening();
      } else if (event.type === 'start') {
        aiEventEmitter.emit(AIEvents.AI_REQUEST_STARTED);
      }
    });
  }

  public async startListening(): Promise<boolean> {
    const perm = await microphoneManager.requestPermission();
    if (!perm) {
      voiceStateMachine.transitionTo('PERMISSION_DENIED');
      return false;
    }

    assistantState.startListening();
    speechRecognitionManager.clear();
    speechRecognitionManager.start();
    return true;
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
  }
}

export const voiceManager = new VoiceManager();
export default voiceManager;
