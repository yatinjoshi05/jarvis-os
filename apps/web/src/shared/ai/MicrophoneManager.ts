import { assistantState } from './AssistantState';

export type MicrophoneState =
  | 'idle'
  | 'requesting'
  | 'listening'
  | 'denied'
  | 'muted';

class MicrophoneManager {
  private stream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private dataArray: Uint8Array | null = null;
  
  public state: MicrophoneState = 'idle';
  public voiceLevel = 0;
  public isMuted = false;
  private currentDeviceId = '';

  // VAD/Noise filtering states
  private speechDetected = false;
  private energySpikeTime = 0;

  async requestPermission(deviceId?: string): Promise<boolean> {
    if (this.stream && (!deviceId || this.currentDeviceId === deviceId)) {
      return true;
    }

    this.stop();

    try {
      this.state = 'requesting';
      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          deviceId: deviceId ? { exact: deviceId } : undefined
        }
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.currentDeviceId = deviceId || '';

      this.audioContext = new AudioContext();
      this.source = this.audioContext.createMediaStreamSource(this.stream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 256;
      this.analyser.smoothingTimeConstant = 0.85;

      this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
      this.source.connect(this.analyser);

      if (this.isMuted) {
        this.applyMuteState(true);
        this.state = 'muted';
      } else {
        this.state = 'listening';
      }

      return true;
    } catch (error) {
      console.error('[MicrophoneManager] Permission or initialization error:', error);
      this.state = 'denied';
      assistantState.setPermissionDenied();
      return false;
    }
  }

  public async getDevices(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      return devices.filter((d) => d.kind === 'audioinput');
    } catch (e) {
      console.error('[MicrophoneManager] Failed to list devices:', e);
      return [];
    }
  }

  public async setDevice(deviceId: string): Promise<boolean> {
    console.log(`[MicrophoneManager] Switching device to: ${deviceId}`);
    return this.requestPermission(deviceId);
  }

  public mute() {
    this.isMuted = true;
    this.applyMuteState(true);
    this.state = 'muted';
    assistantState.setMuted();
  }

  public unmute() {
    this.isMuted = false;
    this.applyMuteState(false);
    if (this.stream) {
      this.state = 'listening';
    } else {
      this.state = 'idle';
    }
    assistantState.reset();
  }

  private applyMuteState(muted: boolean) {
    if (this.stream) {
      this.stream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    }
  }

  public isUserSpeaking(): boolean {
    return this.speechDetected;
  }

  update() {
    if (!this.analyser || !this.dataArray || this.isMuted) {
      this.voiceLevel = 0;
      this.speechDetected = false;
      return;
    }

    this.analyser.getByteTimeDomainData(this.dataArray as any);

    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      const value = (this.dataArray[i] - 128) / 128;
      sum += value * value;
    }

    const rms = Math.sqrt(sum / this.dataArray.length);
    this.voiceLevel += (rms - this.voiceLevel) * 0.25;

    // Noise Filter: Detect transient spike vs sustained speech
    const energyThreshold = 0.025;
    if (this.voiceLevel > energyThreshold) {
      if (this.energySpikeTime === 0) {
        this.energySpikeTime = Date.now();
      } else {
        const spikeDuration = Date.now() - this.energySpikeTime;
        if (spikeDuration > 150) {
          this.speechDetected = true;
        }
      }
    } else {
      this.energySpikeTime = 0;
      this.speechDetected = false;
    }
  }

  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
    }
    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch (_) { /* ignore */ }
    }

    this.stream = null;
    this.audioContext = null;
    this.analyser = null;
    this.source = null;
    this.dataArray = null;
    this.voiceLevel = 0;
    this.speechDetected = false;
    this.energySpikeTime = 0;

    if (this.state !== 'denied') {
      this.state = 'idle';
    }
  }
}

export const microphoneManager = new MicrophoneManager();
export default microphoneManager;