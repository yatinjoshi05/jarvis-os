export class VoiceUtils {
  /**
   * Safe timer debounce/delay wrapper.
   */
  public static delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Helper to format language tags to match browser locales.
   */
  public static cleanLanguageTag(lang: string): string {
    const clean = lang.trim().replace('_', '-');
    // Ensure format like en-IN, en-US, es-ES
    if (clean.length === 2) {
      return `${clean.toLowerCase()}-${clean.toUpperCase()}`;
    }
    return clean;
  }

  /**
   * Check if SpeechSynthesis is active and speaking.
   */
  public static isSpeaking(): boolean {
    if (typeof window === 'undefined' || !window.speechSynthesis) return false;
    return window.speechSynthesis.speaking;
  }
}
