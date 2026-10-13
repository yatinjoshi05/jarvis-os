import { GlobeAnimationParams, GlobeMoodParams, GlobeDebugConfig } from './GlobeTypes';

export class ParameterInterpolator {
  // Current interpolated values (reused per frame to avoid allocations)
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

  // Internal spring velocity for scale interpolation
  private scaleVelocity: number = 0;
  // Internal smooth damp velocities
  private glowVelocity: number = 0;
  private energyVelocity: number = 0;

  public update(
    deltaTime: number,
    targetStateParams: GlobeAnimationParams,
    moodParams: GlobeMoodParams,
    debugConfig: GlobeDebugConfig
  ): GlobeAnimationParams {
    // 1. Calculate Mood-Blended Targets
    const targetRotation = targetStateParams.rotationMultiplier * moodParams.rotationMult * debugConfig.rotationSpeedMult;
    const targetEnergy = targetStateParams.energyFlowSpeed * moodParams.energyFlowMult * debugConfig.energyFlowMult;
    const targetBreathing = targetStateParams.breathingAmount * moodParams.breathingMult * debugConfig.breathingAmountMult;
    const targetDisplacement = (targetStateParams.particleDisplacement + (moodParams.particleActivityMult - 0.5) * 0.02) * debugConfig.particleDisplacementMult;
    const targetGlow = targetStateParams.glowIntensity * debugConfig.glowMult;
    const targetScale = targetStateParams.scale;

    const baseTau = (0.25 / debugConfig.transitionSpeedMult);

    // 2. Rotation: LERP
    const rotAlpha = 1.0 - Math.exp(-deltaTime / baseTau);
    this.currentParams.rotationMultiplier += (targetRotation - this.currentParams.rotationMultiplier) * rotAlpha;

    // 3. Particle Motion / Displacement: LERP
    this.currentParams.particleDisplacement += (targetDisplacement - this.currentParams.particleDisplacement) * rotAlpha;
    this.currentParams.breathingAmount += (targetBreathing - this.currentParams.breathingAmount) * rotAlpha;
    this.currentParams.rimIntensity += (targetStateParams.rimIntensity - this.currentParams.rimIntensity) * rotAlpha;
    this.currentParams.thinkingIntensity += (targetStateParams.thinkingIntensity - this.currentParams.thinkingIntensity) * rotAlpha;
    this.currentParams.particleOpacity += (targetStateParams.particleOpacity - this.currentParams.particleOpacity) * rotAlpha;

    // 4. Scale: SPRING INTERPOLATION
    const springStiffness = 180.0 * debugConfig.transitionSpeedMult;
    const springDamping = 16.0;
    const force = (targetScale - this.currentParams.scale) * springStiffness;
    this.scaleVelocity += (force - this.scaleVelocity * springDamping) * deltaTime;
    this.currentParams.scale += this.scaleVelocity * deltaTime;

    // Clamp scale max at 1.45 (145%)
    this.currentParams.scale = Math.min(1.45, Math.max(0, this.currentParams.scale));

    // 5. Brightness / Glow: SMOOTH DAMP
    this.currentParams.glowIntensity = this.smoothDamp(
      this.currentParams.glowIntensity,
      targetGlow,
      (val) => { this.glowVelocity = val; },
      this.glowVelocity,
      0.15,
      deltaTime
    );

    // 6. Energy Flow: SMOOTH DAMP
    this.currentParams.energyFlowSpeed = this.smoothDamp(
      this.currentParams.energyFlowSpeed,
      targetEnergy,
      (val) => { this.energyVelocity = val; },
      this.energyVelocity,
      0.15,
      deltaTime
    );

    // 7. Direct Audio / Spectrum Parameters
    this.currentParams.audioAmplitude = targetStateParams.audioAmplitude;
    this.currentParams.musicBass = targetStateParams.musicBass;
    this.currentParams.musicMid = targetStateParams.musicMid;
    this.currentParams.musicTreble = targetStateParams.musicTreble;
    this.currentParams.transitionWeight = targetStateParams.transitionWeight;
    this.currentParams.shakeOffset = targetStateParams.shakeOffset;
    this.currentParams.colorTint = targetStateParams.colorTint;

    return this.currentParams;
  }

  /**
   * Critically damped spring / smooth damp helper
   */
  private smoothDamp(
    current: number,
    target: number,
    setVelocity: (v: number) => void,
    currentVelocity: number,
    smoothTime: number,
    deltaTime: number
  ): number {
    const omega = 2.0 / Math.max(0.0001, smoothTime);
    const x = omega * deltaTime;
    const exp = 1.0 / (1.0 + x + 0.48 * x * x + 0.235 * x * x * x);
    let change = current - target;
    const temp = (currentVelocity + omega * change) * deltaTime;
    let newVelocity = (currentVelocity - omega * temp) * exp;
    let output = target + (change + temp) * exp;

    if ((target - current > 0 && output > target) || (current - target > 0 && output < target)) {
      output = target;
      newVelocity = 0;
    }

    setVelocity(newVelocity);
    return output;
  }
}

export const parameterInterpolator = new ParameterInterpolator();
export default parameterInterpolator;
