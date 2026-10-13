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

export enum GlobeMood {
  Calm = 'Calm',
  Focused = 'Focused',
  Creative = 'Creative',
  Busy = 'Busy',
  Critical = 'Critical',
  Sleeping = 'Sleeping',
  Excited = 'Excited',
}

export interface GlobeMoodParams {
  rotationMult: number;       // e.g. Calm = 0.85, Busy = 1.45, Critical = 1.70, Sleeping = 0.40
  energyFlowMult: number;     // e.g. Calm = 0.20, Busy = 2.20, Critical = 2.60, Sleeping = 0.10
  breathingMult: number;      // e.g. Calm = 1.10, Focused = 0.95, Sleeping = 1.20
  particleActivityMult: number; // e.g. Calm = 0.15, Focused = 0.60, Busy = 0.90, Sleeping = 0.05
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
  forcedMood: GlobeMood | null;
  enabledStates: Record<GlobeState, boolean>;
  enabledMoods: Record<GlobeMood, boolean>;
}

export interface AudioAnalysisData {
  rawAmplitude: number;
  smoothedAmplitude: number;
  isSpeaking: boolean;
}

export interface MusicFFTData {
  bass: number;
  mid: number;
  treble: number;
}
