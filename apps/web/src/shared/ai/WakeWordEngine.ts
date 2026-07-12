class WakeWordEngine {
  private isEnabled = true;
  private customWakeWords: string[] = ['jarvis', 'hey jarvis', 'okay jarvis'];

  public enable() {
    this.isEnabled = true;
    console.log('[WakeWordEngine] Wake word listening enabled');
  }

  public disable() {
    this.isEnabled = false;
    console.log('[WakeWordEngine] Wake word listening disabled');
  }

  public getEnabled(): boolean {
    return this.isEnabled;
  }

  public checkWakeWord(transcript: string): { matches: boolean; command: string } {
    if (!this.isEnabled) return { matches: false, command: '' };

    const lower = transcript.toLowerCase().trim();
    for (const phrase of this.customWakeWords) {
      if (lower.startsWith(phrase)) {
        const command = lower.substring(phrase.length).trim();
        return { matches: true, command };
      }
      
      if (lower.includes(phrase)) {
        const index = lower.indexOf(phrase);
        const command = lower.substring(index + phrase.length).trim();
        return { matches: true, command };
      }
    }

    return { matches: false, command: '' };
  }

  public addCustomWakeWord(word: string) {
    const cleanWord = word.trim().toLowerCase();
    if (cleanWord && !this.customWakeWords.includes(cleanWord)) {
      this.customWakeWords.push(cleanWord);
      console.log(`[WakeWordEngine] Added custom wake word: "${cleanWord}"`);
    }
  }

  public getWakeWords(): string[] {
    return [...this.customWakeWords];
  }
}

export const wakeWordEngine = new WakeWordEngine();
export default wakeWordEngine;
