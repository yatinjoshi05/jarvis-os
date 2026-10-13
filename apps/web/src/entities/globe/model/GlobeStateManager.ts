import { AudioState } from '../../../shared/audio/AudioTypes';
import { VoiceState } from '../../../shared/ai/VoiceStateMachine';

export enum GlobeState {
  Startup = 'Startup',
  Idle = 'Idle',
  Listening = 'Listening',
  Thinking = 'Thinking',
  Executing = 'Executing',
  Speaking = 'Speaking',
  Sleeping = 'Sleeping',
  Music = 'Music',
  Success = 'Success',
  Error = 'Error',
  Shutdown = 'Shutdown',
}

export interface GlobeAnimationParams {
  rotationMultiplier: number;
  breathingAmount: number;
  energyFlowSpeed: number;
  particleDisplacement: number;
  rimIntensity: number;
  glowIntensity: number;
  audioAmplitude: number;
  thinkingIntensity: number;
  musicBass: number;
  musicMid: number;
  musicTreble: number;
  transitionWeight: number;
  scale: number;
  particleOpacity: number;
  shakeOffset: { x: number; y: number };
  colorTint: { r: number; g: number; b: number };
}

export interface GlobeDebugConfig {
  rotationSpeedMult: number;
  breathingAmountMult: number;
  audioScaleMult: number;
  thinkingSpeedMult: number;
  energyFlowMult: number;
  particleDisplacementMult: number;
  musicSensitivityMult: number;
  glowMult: number;
  transitionSpeedMult: number;
  forcedState: GlobeState | null;
  enabledStates: Record<GlobeState, boolean>;
}

type GlobeStateListener = (state: GlobeState, params: GlobeAnimationParams) => void;

export class GlobeStateManager {
  private activeState: GlobeState = GlobeState.Idle;
  private _previousState: GlobeState = GlobeState.Idle;
  private stateStartTime: number = performance.now();
  private listeners: Set<GlobeStateListener> = new Set();

  // Upstream state flags
  private _audioState: AudioState = 'Idle';
  private voiceState: VoiceState = 'IDLE';
  private isMusicPlaying: boolean = false;

  // Real-time audio inputs
  private microphoneAmplitude: number = 0;
  private speechAudioAmplitude: number = 0;
  private smoothedAudioAmplitude: number = 0;
  private fftBass: number = 0;
  private fftMid: number = 0;
  private fftTreble: number = 0;

  // Transient state timers
  private successTimer: number | null = null;
  private errorTimer: number | null = null;
  private startupTimer: number | null = null;
  private shutdownTimer: number | null = null;

  // Interpolated animation parameters (Current Frame State)
  private currentParams: GlobeAnimationParams = {
    rotationMultiplier: 1.0,
    breathingAmount: 1.0,
    energyFlowSpeed: 0.25,
    particleDisplacement: 0.0,
    rimIntensity: 1.0,
    glowIntensity: 1.0,
    audioAmplitude: 0.0,
    thinkingIntensity: 0.0,
    musicBass: 0.0,
    musicMid: 0.0,
    musicTreble: 0.0,
    transitionWeight: 1.0,
    scale: 1.0,
    particleOpacity: 1.0,
    shakeOffset: { x: 0, y: 0 },
    colorTint: { r: 1.0, g: 1.0, b: 1.0 },
  };

  // Development Debug Panel Configurations
  private debugConfig: GlobeDebugConfig = {
    rotationSpeedMult: 1.0,
    breathingAmountMult: 1.0,
    audioScaleMult: 1.0,
    thinkingSpeedMult: 1.0,
    energyFlowMult: 1.0,
    particleDisplacementMult: 1.0,
    musicSensitivityMult: 1.0,
    glowMult: 1.0,
    transitionSpeedMult: 1.0,
    forcedState: null,
    enabledStates: {
      [GlobeState.Startup]: true,
      [GlobeState.Idle]: true,
      [GlobeState.Listening]: true,
      [GlobeState.Thinking]: true,
      [GlobeState.Executing]: true,
      [GlobeState.Speaking]: true,
      [GlobeState.Sleeping]: true,
      [GlobeState.Music]: true,
      [GlobeState.Success]: true,
      [GlobeState.Error]: true,
      [GlobeState.Shutdown]: true,
    },
  };

  constructor() {
    this.stateStartTime = performance.now();
  }

  // ─── Upstream Manager Subscriptions & Setters ──────────────────────────────

  public setAudioState(state: AudioState) {
    this._audioState = state;
    if (state === 'Startup') {
      this.startSequence();
    } else if (state === 'Shutdown') {
      this.shutdownSequence();
    } else if (state === 'Success') {
      this.triggerSuccess();
    } else if (state === 'Error') {
      this.triggerError();
    }
    this.evaluateState();
  }

  public setVoiceState(state: VoiceState) {
    this.voiceState = state;
    if (state === 'ERROR' || state === 'PERMISSION_DENIED') {
      this.triggerError();
    }
    this.evaluateState();
  }

  public setMusicPlaying(playing: boolean) {
    this.isMusicPlaying = playing;
    this.evaluateState();
  }

  public setLiveAudioAmplitude(amplitude: number) {
    this.setMicrophoneAmplitude(amplitude);
  }

  public setMicrophoneAmplitude(amplitude: number) {
    this.microphoneAmplitude = Math.max(0, Math.min(1.0, amplitude));
  }

  public setSpeechAudioAmplitude(amplitude: number) {
    this.speechAudioAmplitude = Math.max(0, Math.min(1.0, amplitude));
  }

  public setMusicFFT(bass: number, mid: number, treble: number) {
    this.fftBass = Math.max(0, Math.min(1.0, bass));
    this.fftMid = Math.max(0, Math.min(1.0, mid));
    this.fftTreble = Math.max(0, Math.min(1.0, treble));
  }

  // ─── State Triggers ────────────────────────────────────────────────────────

  public startSequence() {
    if (!this.debugConfig.enabledStates[GlobeState.Startup]) return;
    this.transitionTo(GlobeState.Startup);
    if (this.startupTimer) clearTimeout(this.startupTimer);

    this.startupTimer = window.setTimeout(() => {
      if (this.activeState === GlobeState.Startup) {
        this.evaluateState();
      }
    }, 2500);
  }

  public triggerSuccess() {
    if (!this.debugConfig.enabledStates[GlobeState.Success]) return;
    this.transitionTo(GlobeState.Success);
    if (this.successTimer) clearTimeout(this.successTimer);

    this.successTimer = window.setTimeout(() => {
      if (this.activeState === GlobeState.Success) {
        this.evaluateState();
      }
    }, 400);
  }

  public triggerError() {
    if (!this.debugConfig.enabledStates[GlobeState.Error]) return;
    this.transitionTo(GlobeState.Error);
    if (this.errorTimer) clearTimeout(this.errorTimer);

    this.errorTimer = window.setTimeout(() => {
      if (this.activeState === GlobeState.Error) {
        this.evaluateState();
      }
    }, 180);
  }

  public shutdownSequence() {
    if (!this.debugConfig.enabledStates[GlobeState.Shutdown]) return;
    this.transitionTo(GlobeState.Shutdown);
    if (this.shutdownTimer) clearTimeout(this.shutdownTimer);

    this.shutdownTimer = window.setTimeout(() => {
      // Shutdown sequence completed
    }, 2000);
  }

  // ─── State Priority Resolver ───────────────────────────────────────────────
  // Speaking > Thinking > Listening > Music > Idle
  private evaluateState() {
    // If forced debug state is set, use it
    if (this.debugConfig.forcedState) {
      this.transitionTo(this.debugConfig.forcedState);
      return;
    }

    // Override active transient states if running
    if (this.voiceState === 'ERROR' || this.voiceState === 'PERMISSION_DENIED') {
      this.transitionTo(GlobeState.Error);
      return;
    }

    if (this.activeState === GlobeState.Startup || 
        this.activeState === GlobeState.Shutdown ||
        this.activeState === GlobeState.Success) {
      return;
    }

    let nextState = GlobeState.Idle;

    if (this.voiceState === 'SPEAKING' && this.debugConfig.enabledStates[GlobeState.Speaking]) {
      nextState = GlobeState.Speaking;
    } else if (this.voiceState === 'EXECUTING' && this.debugConfig.enabledStates[GlobeState.Executing]) {
      nextState = GlobeState.Executing;
    } else if (['THINKING', 'STREAMING', 'GENERATING', 'TRANSCRIBING'].includes(this.voiceState) && 
               this.debugConfig.enabledStates[GlobeState.Thinking]) {
      nextState = GlobeState.Thinking;
    } else if (this.voiceState === 'LISTENING' && this.debugConfig.enabledStates[GlobeState.Listening]) {
      nextState = GlobeState.Listening;
    } else if (this.voiceState === 'MUTED' && this.debugConfig.enabledStates[GlobeState.Sleeping]) {
      nextState = GlobeState.Sleeping;
    } else if (this.isMusicPlaying && this.debugConfig.enabledStates[GlobeState.Music]) {
      nextState = GlobeState.Music;
    } else {
      nextState = GlobeState.Idle;
    }

    this.transitionTo(nextState);
  }

  private transitionTo(newState: GlobeState) {
    if (this.activeState === newState) return;

    this._previousState = this.activeState;
    this.activeState = newState;
    this.stateStartTime = performance.now();
    this.notifyListeners();
  }

  // ─── Continuous Frame Update & Interpolation ────────────────────────────────
  // Must be called every frame (e.g. in Three.js useFrame)
  public update(deltaTime: number): GlobeAnimationParams {
    const now = performance.now();
    const elapsedStateTime = (now - this.stateStartTime) / 1000; // seconds

    // 1. Process Voice Amplitude Attack (50ms) / Release (220ms) Envelope
    const activeAmplitude = this.voiceState === 'SPEAKING'
      ? this.speechAudioAmplitude
      : this.microphoneAmplitude;
    const isAttack = activeAmplitude > this.smoothedAudioAmplitude;
    const voiceTau = isAttack ? 0.05 : 0.22;
    const voiceAlpha = 1.0 - Math.exp(-deltaTime / voiceTau);
    this.smoothedAudioAmplitude += (activeAmplitude - this.smoothedAudioAmplitude) * voiceAlpha;

    // 2. Determine Target Animation Parameters for Active State
    const target = this.calculateTargetParams(elapsedStateTime);

    // 3. Apply Debug Multipliers
    target.rotationMultiplier *= this.debugConfig.rotationSpeedMult;
    target.breathingAmount *= this.debugConfig.breathingAmountMult;
    target.energyFlowSpeed *= this.debugConfig.energyFlowMult;
    target.particleDisplacement *= this.debugConfig.particleDisplacementMult;
    target.glowIntensity *= this.debugConfig.glowMult;
    target.thinkingIntensity *= this.debugConfig.thinkingSpeedMult;
    target.musicBass *= this.debugConfig.musicSensitivityMult;
    target.musicMid *= this.debugConfig.musicSensitivityMult;
    target.musicTreble *= this.debugConfig.musicSensitivityMult;

    // 4. Smooth Interpolation (300ms - 600ms transition target)
    const baseSpeed = 6.0 * this.debugConfig.transitionSpeedMult;
    const alpha = 1.0 - Math.exp(-deltaTime * baseSpeed);

    // Fast spring-like interpolation for scale & amplitude, lerp for lighting/rotation
    this.currentParams.rotationMultiplier += (target.rotationMultiplier - this.currentParams.rotationMultiplier) * alpha;
    this.currentParams.breathingAmount += (target.breathingAmount - this.currentParams.breathingAmount) * alpha;
    this.currentParams.energyFlowSpeed += (target.energyFlowSpeed - this.currentParams.energyFlowSpeed) * alpha;
    this.currentParams.particleDisplacement += (target.particleDisplacement - this.currentParams.particleDisplacement) * alpha;
    this.currentParams.rimIntensity += (target.rimIntensity - this.currentParams.rimIntensity) * alpha;
    this.currentParams.glowIntensity += (target.glowIntensity - this.currentParams.glowIntensity) * alpha;
    this.currentParams.thinkingIntensity += (target.thinkingIntensity - this.currentParams.thinkingIntensity) * alpha;
    this.currentParams.musicBass += (target.musicBass - this.currentParams.musicBass) * alpha;
    this.currentParams.musicMid += (target.musicMid - this.currentParams.musicMid) * alpha;
    this.currentParams.musicTreble += (target.musicTreble - this.currentParams.musicTreble) * alpha;
    this.currentParams.transitionWeight += (target.transitionWeight - this.currentParams.transitionWeight) * alpha;
    this.currentParams.particleOpacity += (target.particleOpacity - this.currentParams.particleOpacity) * alpha;

    // Spring interpolation for scale
    const scaleSpeed = 10.0 * this.debugConfig.transitionSpeedMult;
    const scaleAlpha = 1.0 - Math.exp(-deltaTime * scaleSpeed);
    this.currentParams.scale += (target.scale - this.currentParams.scale) * scaleAlpha;

    // Direct assignment for real-time audio amplitude
    this.currentParams.audioAmplitude = this.smoothedAudioAmplitude;

    // Direct assignment for shake offset & color tint
    this.currentParams.shakeOffset = target.shakeOffset;
    this.currentParams.colorTint = target.colorTint;

    return this.currentParams;
  }

  // ─── Target Parameter Calculator per GlobeState ─────────────────────────────
  private calculateTargetParams(elapsedStateTime: number): GlobeAnimationParams {
    const defaultParams: GlobeAnimationParams = {
      rotationMultiplier: 1.0,
      breathingAmount: 1.0,
      energyFlowSpeed: 0.25,
      particleDisplacement: 0.0,
      rimIntensity: 1.0,
      glowIntensity: 1.0,
      audioAmplitude: this.smoothedAudioAmplitude,
      thinkingIntensity: 0.0,
      musicBass: this.fftBass,
      musicMid: this.fftMid,
      musicTreble: this.fftTreble,
      transitionWeight: Math.min(1.0, elapsedStateTime / 0.4),
      scale: 1.0,
      particleOpacity: 1.0,
      shakeOffset: { x: 0, y: 0 },
      colorTint: { r: 1.0, g: 1.0, b: 1.0 },
    };

    switch (this.activeState) {
      case GlobeState.Startup: {
        const progress = Math.min(1.0, elapsedStateTime / 2.5); // 2.5s duration
        defaultParams.scale = progress;
        defaultParams.rotationMultiplier = progress;
        defaultParams.particleOpacity = progress;
        defaultParams.energyFlowSpeed = 0.25 * progress;
        return defaultParams;
      }

      case GlobeState.Idle: {
        // Continuous rotation 100%, breathing animation 100% -> 110% -> 100% over 5 seconds cycle
        const breathingCycle = (Math.sin((elapsedStateTime * Math.PI * 2) / 5.0) * 0.5 + 0.5); // 0 to 1
        defaultParams.scale = 1.00 + breathingCycle * 0.10; // 100% -> 110% -> 100%
        defaultParams.rotationMultiplier = 1.0;
        defaultParams.energyFlowSpeed = 0.25; // 25% energy flow
        defaultParams.particleDisplacement = 0.0;
        return defaultParams;
      }

      case GlobeState.Listening: {
        // Rotation 115%, Scale 105%, Glow +10%, Outer particles inward attraction
        const pulse = Math.sin(elapsedStateTime * 3.0) * 0.015;
        defaultParams.rotationMultiplier = 1.15;
        defaultParams.scale = 1.05 + pulse;
        defaultParams.glowIntensity = 1.10;
        defaultParams.rimIntensity = 1.10;
        defaultParams.particleDisplacement = -0.015; // inward attraction
        defaultParams.energyFlowSpeed = 0.40;
        return defaultParams;
      }

      case GlobeState.Thinking: {
        // Rotation 170%, Energy flow 250%, Scale 104%, Travelling energy waves +40%
        defaultParams.rotationMultiplier = 1.70;
        defaultParams.energyFlowSpeed = 2.50;
        defaultParams.scale = 1.04;
        defaultParams.thinkingIntensity = 1.0;
        defaultParams.particleDisplacement = 0.025; // +40% outer shell activity
        defaultParams.glowIntensity = 1.25;
        defaultParams.rimIntensity = 1.20;
        return defaultParams;
      }

      case GlobeState.Executing: {
        const progressPulse = Math.sin(elapsedStateTime * Math.PI * 2) * 0.012;
        defaultParams.rotationMultiplier = 1.25;
        defaultParams.scale = 1.025 + progressPulse;
        defaultParams.energyFlowSpeed = 1.15;
        defaultParams.particleDisplacement = 0.015;
        defaultParams.glowIntensity = 1.15;
        defaultParams.rimIntensity = 1.12;
        return defaultParams;
      }

      case GlobeState.Speaking: {
        // Voice Amplitude -> Scale Mapping:
        // 0% -> 100%, 25% -> 108%, 50% -> 118%, 75% -> 128%, 100% -> 140% (Max 145% clamped)
        const amp = this.smoothedAudioAmplitude * this.debugConfig.audioScaleMult;
        let mappedScale = 1.0;
        if (amp <= 0.25) {
          mappedScale = 1.0 + (amp / 0.25) * 0.08;
        } else if (amp <= 0.50) {
          mappedScale = 1.08 + ((amp - 0.25) / 0.25) * 0.10;
        } else if (amp <= 0.75) {
          mappedScale = 1.18 + ((amp - 0.50) / 0.25) * 0.10;
        } else {
          mappedScale = 1.28 + ((amp - 0.75) / 0.25) * 0.12;
        }

        // Hard clamp at 145%
        defaultParams.scale = Math.min(1.45, mappedScale);

        // Slight outward particle motion max 3% (0.03)
        defaultParams.particleDisplacement = Math.min(0.03, amp * 0.03);
        defaultParams.rotationMultiplier = 1.0 + amp * 0.35;
        defaultParams.energyFlowSpeed = 0.5 + amp * 0.8;
        defaultParams.glowIntensity = 1.0 + amp * 0.20;
        
        // If music plays while JARVIS speaks, music adds tiny secondary motion
        if (this.isMusicPlaying) {
          defaultParams.particleDisplacement += this.fftBass * 0.008; // subtle secondary
        }
        return defaultParams;
      }

      case GlobeState.Sleeping: {
        defaultParams.rotationMultiplier = 0.15;
        defaultParams.scale = 0.97;
        defaultParams.energyFlowSpeed = 0.08;
        defaultParams.glowIntensity = 0.55;
        defaultParams.rimIntensity = 0.6;
        defaultParams.particleOpacity = 0.6;
        return defaultParams;
      }

      case GlobeState.Music: {
        // Bass: Outer shell displacement 4% (0.04), Rotation 110%
        // Mid: Travelling energy +30% (0.25 + 0.30 = 0.55)
        // Treble: Micro shimmer / subtle displacement
        defaultParams.rotationMultiplier = 1.10;
        defaultParams.particleDisplacement = this.fftBass * 0.04;
        defaultParams.energyFlowSpeed = 0.25 + this.fftMid * 0.30;
        defaultParams.glowIntensity = 1.0 + this.fftTreble * 0.15;
        defaultParams.scale = 1.0 + this.fftBass * 0.03;
        return defaultParams;
      }

      case GlobeState.Success: {
        // Scale 100% -> 112% -> 100% over 400ms. Glow +15%, Particle brightness +10%
        const pulseProgress = Math.min(1.0, elapsedStateTime / 0.4);
        const pulse = Math.sin(pulseProgress * Math.PI) * 0.12;
        defaultParams.scale = 1.00 + pulse;
        defaultParams.glowIntensity = 1.15;
        defaultParams.rimIntensity = 1.15;
        return defaultParams;
      }

      case GlobeState.Error: {
        // Calm, deterministic recovery signal. The state exits when VoiceState recovers.
        const pulse = 0.015 * (Math.sin(elapsedStateTime * Math.PI * 2) * 0.5 + 0.5);
        defaultParams.rotationMultiplier = 0.45;
        defaultParams.scale = 1.0 + pulse;
        defaultParams.colorTint = { r: 1.08, g: 0.72, b: 0.68 };
        defaultParams.glowIntensity = 1.08;
        return defaultParams;
      }

      case GlobeState.Shutdown: {
        // Scale 100% -> 95% -> 0% over 2s. Rotation slows, particles dim.
        const progress = Math.min(1.0, elapsedStateTime / 2.0);
        let currentScale = 1.0;
        if (progress < 0.2) {
          currentScale = 1.0 - (progress / 0.2) * 0.05; // 100% -> 95%
        } else {
          currentScale = 0.95 * (1.0 - (progress - 0.2) / 0.8); // 95% -> 0%
        }

        defaultParams.scale = Math.max(0, currentScale);
        defaultParams.rotationMultiplier = 1.0 - progress;
        defaultParams.particleOpacity = 1.0 - progress;
        return defaultParams;
      }

      default:
        return defaultParams;
    }
  }

  // ─── Getters & Subscriptions ────────────────────────────────────────────────

  public getState(): GlobeState {
    return this.activeState;
  }

  public getPreviousState(): GlobeState {
    return this._previousState;
  }

  public getAudioState(): AudioState {
    return this._audioState;
  }

  public getParams(): GlobeAnimationParams {
    return this.currentParams;
  }

  public getDebugConfig(): GlobeDebugConfig {
    return { ...this.debugConfig };
  }

  public updateDebugConfig(newConfig: Partial<GlobeDebugConfig>) {
    this.debugConfig = { ...this.debugConfig, ...newConfig };
    this.evaluateState();
    this.notifyListeners();
  }

  public subscribe(listener: GlobeStateListener): () => void {
    this.listeners.add(listener);
    listener(this.activeState, this.currentParams);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener(this.activeState, this.currentParams));
  }
}

export const globeStateManager = new GlobeStateManager();
export default globeStateManager;
