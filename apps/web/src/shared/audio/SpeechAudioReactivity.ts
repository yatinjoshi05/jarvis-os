import { globeStateManager } from '../../entities/globe/model/GlobeStateManager';

/** Connects real HTML audio output to the globe without synthesizing motion. */
class SpeechAudioReactivity {
  private context: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private activeElement: HTMLMediaElement | null = null;
  private activeSource: MediaElementAudioSourceNode | null = null;
  private frameId: number | null = null;
  private sources = new WeakMap<HTMLMediaElement, MediaElementAudioSourceNode>();
  private samples: Uint8Array<ArrayBuffer> | null = null;

  public attach(element: HTMLMediaElement): void {
    if (typeof window === 'undefined') return;
    this.detach();

    const AudioContextCtor = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextCtor) return;

    try {
      this.context ??= new AudioContextCtor();
      this.analyser ??= this.context.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.8;
      this.samples ??= new Uint8Array(this.analyser.fftSize) as Uint8Array<ArrayBuffer>;

      let source = this.sources.get(element);
      if (!source) {
        source = this.context.createMediaElementSource(element);
        this.analyser.connect(this.context.destination);
        this.sources.set(element, source);
      }

      source.connect(this.analyser);
      this.activeElement = element;
      this.activeSource = source;
      this.context.resume().catch(() => {});
      this.tick();
    } catch (error) {
      console.warn('[SpeechAudioReactivity] Unable to analyse speech audio:', error);
      globeStateManager.setSpeechAudioAmplitude(0);
    }
  }

  public detach(element?: HTMLMediaElement): void {
    if (element && this.activeElement !== element) return;
    this.activeElement = null;
    if (this.activeSource) {
      this.activeSource.disconnect();
      this.activeSource = null;
    }
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }
    globeStateManager.setSpeechAudioAmplitude(0);
  }

  private tick = (): void => {
    if (!this.activeElement || !this.analyser || !this.samples) return;
    this.analyser.getByteTimeDomainData(this.samples);

    let sum = 0;
    for (const sample of this.samples) {
      const normalized = (sample - 128) / 128;
      sum += normalized * normalized;
    }
    globeStateManager.setSpeechAudioAmplitude(Math.min(1, Math.sqrt(sum / this.samples.length) * 3));
    this.frameId = requestAnimationFrame(this.tick);
  };
}

export const speechAudioReactivity = new SpeechAudioReactivity();
export default speechAudioReactivity;
