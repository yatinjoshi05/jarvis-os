import { AudioAnalysisData } from './GlobeTypes';

export class AudioAnalyzer {
  private rawAmplitude: number = 0;
  private smoothedAmplitude: number = 0;
  private isUserSpeaking: boolean = false;

  private readonly attackTau: number = 0.05;   // 50ms attack
  private readonly releaseTau: number = 0.22;  // 220ms release

  public setRawAmplitude(amplitude: number) {
    this.rawAmplitude = Math.max(0, Math.min(1.0, amplitude));
    this.isUserSpeaking = this.rawAmplitude > 0.05;
  }

  public update(deltaTime: number): AudioAnalysisData {
    const isAttack = this.rawAmplitude > this.smoothedAmplitude;
    const tau = isAttack ? this.attackTau : this.releaseTau;
    const alpha = 1.0 - Math.exp(-deltaTime / tau);

    this.smoothedAmplitude += (this.rawAmplitude - this.smoothedAmplitude) * alpha;

    return {
      rawAmplitude: this.rawAmplitude,
      smoothedAmplitude: this.smoothedAmplitude,
      isSpeaking: this.isUserSpeaking,
    };
  }

  public getSmoothedAmplitude(): number {
    return this.smoothedAmplitude;
  }
}

export const audioAnalyzer = new AudioAnalyzer();
export default audioAnalyzer;
