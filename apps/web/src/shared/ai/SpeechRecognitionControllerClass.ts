import { speechRecognitionManager } from './SpeechRecognitionManager';

export class SpeechRecognitionControllerClass {
  public start() {
    speechRecognitionManager.start();
  }

  public stop() {
    speechRecognitionManager.stop();
  }

  public pause() {
    speechRecognitionManager.pause();
  }

  public resume() {
    speechRecognitionManager.resume();
  }

  public cancel() {
    speechRecognitionManager.cancel();
  }
}

export const speechRecognitionController = new SpeechRecognitionControllerClass();
export default speechRecognitionController;
