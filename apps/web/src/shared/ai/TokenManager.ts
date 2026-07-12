interface TokenMessage {
  role: string;
  content: string;
}

export class TokenManager {
  /**
   * Estimates token count for a text string using a standard word-based heuristic.
   * Standard LLM heuristic: ~4 characters per token.
   */
  public static estimateTokens(text: string): number {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
  }

  /**
   * Estimates token count for message history.
   */
  public static estimateHistoryTokens(history: TokenMessage[]): number {
    return history.reduce((sum, msg) => sum + this.estimateTokens(msg.content) + 4, 0);
  }

  /**
   * Trims message history to fit within maxTokens budget, keeping newest messages.
   */
  public static trimHistory(history: TokenMessage[], maxTokens: number): TokenMessage[] {
    const trimmed: TokenMessage[] = [];
    let tokenSum = 0;

    // Traverse from newest to oldest
    for (let i = history.length - 1; i >= 0; i--) {
      const msg = history[i];
      const tokens = this.estimateTokens(msg.content) + 4;
      if (tokenSum + tokens > maxTokens) {
        break;
      }
      trimmed.unshift(msg);
      tokenSum += tokens;
    }

    return trimmed;
  }
}
