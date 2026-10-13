import { GlobeMood, GlobeMoodParams } from './GlobeTypes';

export class MoodManager {
  private activeMood: GlobeMood = GlobeMood.Calm;
  private targetMood: GlobeMood = GlobeMood.Calm;
  private moodTransitionTime: number = 0;
  private readonly transitionDuration: number = 0.5; // 500 ms smooth transition

  // Pre-calculated Mood Parameter Table
  private readonly moodTable: Record<GlobeMood, GlobeMoodParams> = {
    [GlobeMood.Calm]: {
      rotationMult: 0.85,
      energyFlowMult: 0.20,
      breathingMult: 1.10,
      particleActivityMult: 0.15,
    },
    [GlobeMood.Focused]: {
      rotationMult: 1.20,
      energyFlowMult: 1.40,
      breathingMult: 0.95,
      particleActivityMult: 0.60,
    },
    [GlobeMood.Creative]: {
      rotationMult: 1.00,
      energyFlowMult: 1.80,
      breathingMult: 1.10,
      particleActivityMult: 0.80,
    },
    [GlobeMood.Busy]: {
      rotationMult: 1.45,
      energyFlowMult: 2.20,
      breathingMult: 1.00,
      particleActivityMult: 0.90,
    },
    [GlobeMood.Critical]: {
      rotationMult: 1.70,
      energyFlowMult: 2.60,
      breathingMult: 0.90,
      particleActivityMult: 1.00,
    },
    [GlobeMood.Sleeping]: {
      rotationMult: 0.40,
      energyFlowMult: 0.10,
      breathingMult: 1.20,
      particleActivityMult: 0.05,
    },
    [GlobeMood.Excited]: {
      rotationMult: 1.50,
      energyFlowMult: 2.50,
      breathingMult: 1.15,
      particleActivityMult: 0.95,
    },
  };

  // Reusable object for zero allocation per frame
  private currentParams: GlobeMoodParams = { ...this.moodTable[GlobeMood.Calm] };

  public setMood(mood: GlobeMood) {
    if (this.targetMood === mood) return;
    this.activeMood = this.targetMood;
    this.targetMood = mood;
    this.moodTransitionTime = 0;
  }

  public getMood(): GlobeMood {
    return this.targetMood;
  }

  public update(deltaTime: number): GlobeMoodParams {
    if (this.activeMood === this.targetMood) {
      const active = this.moodTable[this.activeMood];
      this.currentParams.rotationMult = active.rotationMult;
      this.currentParams.energyFlowMult = active.energyFlowMult;
      this.currentParams.breathingMult = active.breathingMult;
      this.currentParams.particleActivityMult = active.particleActivityMult;
      return this.currentParams;
    }

    this.moodTransitionTime += deltaTime;
    const weight = Math.min(1.0, this.moodTransitionTime / this.transitionDuration);

    const from = this.moodTable[this.activeMood];
    const to = this.moodTable[this.targetMood];

    // Smooth lerp between moods
    this.currentParams.rotationMult = from.rotationMult + (to.rotationMult - from.rotationMult) * weight;
    this.currentParams.energyFlowMult = from.energyFlowMult + (to.energyFlowMult - from.energyFlowMult) * weight;
    this.currentParams.breathingMult = from.breathingMult + (to.breathingMult - from.breathingMult) * weight;
    this.currentParams.particleActivityMult = from.particleActivityMult + (to.particleActivityMult - from.particleActivityMult) * weight;

    if (weight >= 1.0) {
      this.activeMood = this.targetMood;
    }

    return this.currentParams;
  }
}

export const moodManager = new MoodManager();
export default moodManager;
