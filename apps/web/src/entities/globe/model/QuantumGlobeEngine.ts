import { GlobeState, GlobeMood, GlobeAnimationParams, GlobeDebugConfig } from './GlobeTypes';
import { globeStateManager, GlobeStateManager } from './GlobeStateManager';
import { moodManager, MoodManager } from './MoodManager';
import { audioAnalyzer, AudioAnalyzer } from './AudioAnalyzer';
import { musicAnalyzer, MusicAnalyzer } from './MusicAnalyzer';
import { transitionController, TransitionController } from './TransitionController';
import { parameterInterpolator, ParameterInterpolator } from './ParameterInterpolator';
import { debugController, DebugController } from './DebugController';
import { AudioState } from '../../../shared/audio/AudioTypes';
import { VoiceState } from '../../../shared/ai/VoiceStateMachine';

export type GlobeEngineListener = (
  state: GlobeState,
  mood: GlobeMood,
  params: GlobeAnimationParams
) => void;

export class QuantumGlobeEngine {
  public readonly stateManager: GlobeStateManager = globeStateManager;
  public readonly moodManager: MoodManager = moodManager;
  public readonly audioAnalyzer: AudioAnalyzer = audioAnalyzer;
  public readonly musicAnalyzer: MusicAnalyzer = musicAnalyzer;
  public readonly transitionController: TransitionController = transitionController;
  public readonly interpolator: ParameterInterpolator = parameterInterpolator;
  public readonly debugController: DebugController = debugController;

  private listeners: Set<GlobeEngineListener> = new Set();
  private lastUpdateParams: GlobeAnimationParams = globeStateManager.getParams();

  // ─── Upstream Manager Events ───────────────────────────────────────────────

  public setAudioState(state: AudioState) {
    this.stateManager.setAudioState(state);
  }

  public setVoiceState(state: VoiceState) {
    this.stateManager.setVoiceState(state);
  }

  public setMood(mood: GlobeMood) {
    this.moodManager.setMood(mood);
    this.notify();
  }

  public setMusicPlaying(playing: boolean) {
    this.musicAnalyzer.setMusicPlaying(playing);
    this.stateManager.setMusicPlaying(playing);
  }

  public setLiveAudioAmplitude(amplitude: number) {
    this.audioAnalyzer.setRawAmplitude(amplitude);
    this.stateManager.setLiveAudioAmplitude(amplitude);
  }

  public setMusicFFT(bass: number, mid: number, treble: number) {
    this.musicAnalyzer.setFFTData(bass, mid, treble);
    this.stateManager.setMusicFFT(bass, mid, treble);
  }

  public triggerSuccess() {
    this.stateManager.triggerSuccess();
  }

  public triggerError() {
    this.stateManager.triggerError();
  }

  public startSequence() {
    this.stateManager.startSequence();
  }

  public shutdownSequence() {
    this.stateManager.shutdownSequence();
  }

  // ─── Frame Processing Loop (Consumes Parameter Stack) ──────────────────────
  public update(deltaTime: number): GlobeAnimationParams {
    // 1. Update sub-analyzers
    this.audioAnalyzer.update(deltaTime);
    const musicData = this.musicAnalyzer.update(deltaTime);
    const moodParams = this.moodManager.update(deltaTime);
    const debugConfig = this.debugController.getConfig();

    // 2. Compute base state target parameters
    const stateParams = this.stateManager.update(deltaTime);

    // GlobeStateManager owns microphone and TTS amplitude selection/smoothing.
    stateParams.musicBass = musicData.bass;
    stateParams.musicMid = musicData.mid;
    stateParams.musicTreble = musicData.treble;

    // Apply music displacement layer
    if (this.musicAnalyzer.isPlaying()) {
      stateParams.particleDisplacement += this.musicAnalyzer.getDisplacementEffect();
      stateParams.energyFlowSpeed += this.musicAnalyzer.getEnergyCurrentEffect();
    }

    // 3. Interpolate through Layered Parameter Stack
    const blendedParams = this.interpolator.update(deltaTime, stateParams, moodParams, debugConfig);
    this.lastUpdateParams = blendedParams;

    return blendedParams;
  }

  // ─── Getters & Debug API ───────────────────────────────────────────────────

  public getState(): GlobeState {
    return this.debugController.getConfig().forcedState || this.stateManager.getState();
  }

  public getMood(): GlobeMood {
    return this.debugController.getConfig().forcedMood || this.moodManager.getMood();
  }

  public getParams(): GlobeAnimationParams {
    return this.lastUpdateParams;
  }

  public getDebugConfig(): GlobeDebugConfig {
    return this.debugController.getConfig();
  }

  public updateDebugConfig(newConfig: Partial<GlobeDebugConfig>) {
    this.debugController.updateConfig(newConfig);
    this.stateManager.updateDebugConfig(newConfig);
    if (newConfig.forcedMood) {
      this.moodManager.setMood(newConfig.forcedMood);
    }
    this.notify();
  }

  public subscribe(listener: GlobeEngineListener): () => void {
    this.listeners.add(listener);
    listener(this.getState(), this.getMood(), this.lastUpdateParams);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const state = this.getState();
    const mood = this.getMood();
    this.listeners.forEach((listener) => listener(state, mood, this.lastUpdateParams));
  }
}

export const quantumGlobeEngine = new QuantumGlobeEngine();
export default quantumGlobeEngine;
