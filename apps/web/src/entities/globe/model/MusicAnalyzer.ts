import { MusicFFTData } from './GlobeTypes';

export class MusicAnalyzer {
  private isMusicPlaying: boolean = false;
  private rawBass: number = 0;
  private rawMid: number = 0;
  private rawTreble: number = 0;

  private currentData: MusicFFTData = { bass: 0, mid: 0, treble: 0 };

  public setMusicPlaying(playing: boolean) {
    this.isMusicPlaying = playing;
  }

  public isPlaying(): boolean {
    return this.isMusicPlaying;
  }

  public setFFTData(bass: number, mid: number, treble: number) {
    this.rawBass = Math.max(0, Math.min(1.0, bass));
    this.rawMid = Math.max(0, Math.min(1.0, mid));
    this.rawTreble = Math.max(0, Math.min(1.0, treble));
  }

  public update(deltaTime: number): MusicFFTData {
    if (!this.isMusicPlaying) {
      const alpha = 1.0 - Math.exp(-deltaTime * 8.0);
      this.currentData.bass += (0 - this.currentData.bass) * alpha;
      this.currentData.mid += (0 - this.currentData.mid) * alpha;
      this.currentData.treble += (0 - this.currentData.treble) * alpha;
      return this.currentData;
    }

    const alpha = 1.0 - Math.exp(-deltaTime * 12.0);
    this.currentData.bass += (this.rawBass - this.currentData.bass) * alpha;
    this.currentData.mid += (this.rawMid - this.currentData.mid) * alpha;
    this.currentData.treble += (this.rawTreble - this.currentData.treble) * alpha;

    return this.currentData;
  }

  public getDisplacementEffect(): number {
    // Bass -> Outer shell displacement 4% (0.04)
    return this.currentData.bass * 0.04;
  }

  public getEnergyCurrentEffect(): number {
    // Mid -> Travelling energy currents +30% (0.30)
    return this.currentData.mid * 0.30;
  }

  public getShimmerEffect(): number {
    // Treble -> Micro shimmer +20% (0.20)
    return this.currentData.treble * 0.20;
  }
}

export const musicAnalyzer = new MusicAnalyzer();
export default musicAnalyzer;
