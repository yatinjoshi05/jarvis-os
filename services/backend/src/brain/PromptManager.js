// ─────────────────────────────────────────────────────────────────────────────
// JARVIS OS — PromptManager (Phase 2.2 extended)
// System prompt composition with memory context injection
// ─────────────────────────────────────────────────────────────────────────────

export class PromptManager {
  constructor(globalPrompt = 'You are JARVIS OS, a precise and helpful AI operating-system assistant.') {
    this.globalPrompt = globalPrompt;
  }

  /** Original compose method — preserved for backward compatibility */
  compose({ developerPrompt, agentPrompt, temporaryPrompt } = {}) {
    return [this.globalPrompt, developerPrompt, agentPrompt, temporaryPrompt]
      .filter(Boolean)
      .join('\n\n');
  }

  /**
   * Phase 2.2: Compose system prompt with injected memory context.
   * @param {object} request — original request (may contain developerPrompt, agentPrompt, etc.)
   * @param {string} memoryContextString — formatted memory context block (may be empty)
   * @returns {string}
   */
  composeWithMemory(request = {}, memoryContextString = '') {
    const base = this.compose(request);
    if (!memoryContextString) return base;

    return [
      base,
      memoryContextString,
      'Use the above memory context to provide more personalised and context-aware responses. Reference specific memories when relevant, and explain why you recalled them.',
    ]
      .filter(Boolean)
      .join('\n\n');
  }

  /**
   * Build a standalone memory context block for use in non-BrainEngine contexts.
   * @param {Array<{title: string, summary: string, type: string, recallReason: string}>} snippets
   * @returns {string}
   */
  buildMemoryContextBlock(snippets = []) {
    if (!snippets || snippets.length === 0) return '';
    return `[JARVIS MEMORY CONTEXT]\nThe following memories are relevant to this request:\n\n${
      snippets.map((s, i) =>
        `${i + 1}. [${(s.type || 'memory').toUpperCase()}] ${s.title}\n   ${s.summary}\n   (${s.recallReason || 'retrieved by relevance'})`
      ).join('\n\n')
    }\n[END MEMORY CONTEXT]`;
  }
}
