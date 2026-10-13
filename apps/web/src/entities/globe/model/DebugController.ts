import { GlobeState, GlobeMood, GlobeDebugConfig } from './GlobeTypes';

export class DebugController {
  private config: GlobeDebugConfig = {
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
    forcedMood: null,
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
    enabledMoods: {
      [GlobeMood.Calm]: true,
      [GlobeMood.Focused]: true,
      [GlobeMood.Creative]: true,
      [GlobeMood.Busy]: true,
      [GlobeMood.Critical]: true,
      [GlobeMood.Sleeping]: true,
      [GlobeMood.Excited]: true,
    },
  };

  public getConfig(): GlobeDebugConfig {
    return { ...this.config };
  }

  public updateConfig(newConfig: Partial<GlobeDebugConfig>) {
    this.config = { ...this.config, ...newConfig };
  }
}

export const debugController = new DebugController();
export default debugController;
