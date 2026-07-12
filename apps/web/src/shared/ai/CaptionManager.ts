class CaptionManager {
  private timer: ReturnType<typeof setInterval> | null = null;
  private words: string[] = [];
  private currentIndex = 0;
  private onUpdateCallback?: (caption: string) => void;
  private onCompleteCallback?: () => void;
  private isDrivenDirectly = false;
  private completed = false;

  start(
    text: string,
    onUpdate: (caption: string) => void,
    onComplete: () => void,
    wordDelayMs = 280
  ) {
    this.stop();

    this.words = text.split(/\s+/).filter(Boolean);
    this.currentIndex = 0;
    this.onUpdateCallback = onUpdate;
    this.onCompleteCallback = onComplete;
    this.isDrivenDirectly = false;
    this.completed = false;

    if (this.words.length === 0) {
      onComplete();
      return;
    }

    this.timer = setInterval(() => {
      if (!this.isDrivenDirectly) {
        this.revealNext();
      }
    }, wordDelayMs);
  }

  updateDirect(text: string) {
    this.isDrivenDirectly = true;
    if (this.onUpdateCallback) {
      this.onUpdateCallback(text);
    }
  }

  markComplete() {
    if (this.completed) return;
    this.completed = true;
    this.clearTimer();
    if (this.words.length > 0 && this.onUpdateCallback) {
      this.onUpdateCallback(this.words.join(' '));
    }
    this.onCompleteCallback?.();
  }

  stop() {
    this.clearTimer();
    this.words = [];
    this.currentIndex = 0;
    this.isDrivenDirectly = false;
    this.completed = false;
    this.onUpdateCallback = undefined;
    this.onCompleteCallback = undefined;
  }

  private clearTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private revealNext() {
    if (this.currentIndex >= this.words.length) {
      this.clearTimer();
      if (!this.completed) {
        this.completed = true;
        this.onCompleteCallback?.();
      }
      return;
    }
    this.currentIndex++;
    const textSoFar = this.words.slice(0, this.currentIndex).join(' ');
    this.onUpdateCallback?.(textSoFar);
  }
}

export const captionManager = new CaptionManager();
