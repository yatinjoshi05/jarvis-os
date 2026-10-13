export class TransitionController {
  private transitionTime: number = 0;
  private readonly defaultDuration: number = 0.45; // 450 ms default smooth transition target

  public reset() {
    this.transitionTime = 0;
  }

  public update(deltaTime: number, customDuration?: number): number {
    const duration = customDuration || this.defaultDuration;
    this.transitionTime += deltaTime;
    const rawProgress = Math.min(1.0, this.transitionTime / duration);
    return this.easeInOutCubic(rawProgress);
  }

  private easeInOutCubic(x: number): number {
    return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  }
}

export const transitionController = new TransitionController();
export default transitionController;
