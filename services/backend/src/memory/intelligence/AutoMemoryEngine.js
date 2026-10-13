// ─────────────────────────────────────────────────────────────────────────────
// JARVIS OS — AutoMemoryEngine
// Phase 2.2 — AI Memory Intelligence
//
// Automatically creates memories from conversations and missions.
// Scoring formula:
//   importance = wordCount × entityDensity × actionDensity × contextBonus
// Only creates memory when score > threshold (default 0.6).
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_THRESHOLD = 0.45;

// Words that indicate actionable/memorable content
const ACTION_WORDS = new Set([
  'build', 'create', 'design', 'implement', 'deploy', 'fix', 'update', 'refactor',
  'decided', 'agreed', 'confirmed', 'completed', 'finished', 'launched', 'shipped',
  'meeting', 'discussed', 'planning', 'architecture', 'strategy', 'goal', 'target',
  'important', 'critical', 'priority', 'remember', 'note', 'key', 'always', 'never',
  'prefer', 'want', 'need', 'require', 'use', 'avoid', 'decision',
]);

// Words that indicate named entities / proper nouns (heuristic)
const ENTITY_PATTERN = /\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)*\b/g;

// Source → memory type mapping
const SOURCE_TYPE_MAP = {
  mission: 'mission',
  chat: 'conversation',
  file: 'file',
  preference: 'preference',
  code: 'knowledge',
  default: 'knowledge',
};

export class AutoMemoryEngine {
  constructor({ memoryService, intelligenceService, events, threshold = DEFAULT_THRESHOLD }) {
    this.memoryService = memoryService;
    this.intelligenceService = intelligenceService;
    this.events = events;
    this.threshold = threshold;
    /** Recent request fingerprints to avoid creating duplicate auto-memories */
    this._recentHashes = new Set();
  }

  /**
   * Called after each BrainEngine conversation turn.
   * Evaluates whether the exchange should become a long-term memory.
   *
   * @param {{ messages: Array, conversationId: string }} conversation
   * @param {{ text: string }} response
   * @param {object} requestMeta — { selectedAgent, source, projectId, missionId }
   */
  async evaluate(conversation, response, requestMeta = {}) {
    try {
      const messages = conversation?.messages || [];
      if (messages.length < 2) return; // Need at least one user + one assistant message

      const lastUser = [...messages].reverse().find(m => m.role === 'user');
      const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant');

      if (!lastUser || !lastAssistant) return;

      const combined = `${lastUser.content}\n${lastAssistant.content}`;
      const score = this._scoreImportance(combined, requestMeta);

      if (score < this.threshold) return;

      // Dedup: hash the first 200 chars of combined content
      const fingerprint = combined.slice(0, 200);
      if (this._recentHashes.has(fingerprint)) return;
      this._recentHashes.add(fingerprint);
      if (this._recentHashes.size > 100) {
        const first = this._recentHashes.values().next().value;
        this._recentHashes.delete(first);
      }

      // Generate a concise title and summary via AI
      const { title, summary } = await this._generateTitleAndSummary(
        lastUser.content,
        lastAssistant.content,
        requestMeta
      );

      const type = SOURCE_TYPE_MAP[requestMeta.source?.toLowerCase()] || SOURCE_TYPE_MAP.default;
      const tags = this._extractTags(combined);

      await this.memoryService.create({
        title,
        content: `User: ${lastUser.content.slice(0, 500)}\n\nJARVIS: ${lastAssistant.content.slice(0, 500)}`,
        summary,
        category: 'Custom',
        source: 'auto',
        importance: Math.min(1, score),
        confidence: 0.75,
        tags,
        references: [],
        private: false,
        ...(requestMeta.projectId ? { metadata: { projectId: requestMeta.projectId } } : {}),
        ...(requestMeta.missionId ? { metadata: { missionId: requestMeta.missionId } } : {}),
        ...(requestMeta.conversationId ? { metadata: { conversationId: requestMeta.conversationId } } : {}),
      });

      this.events?.publish('AutoMemoryCreated', { title, source: type, score });
      console.log(`[AutoMemory] Created memory "${title}" (score=${score.toFixed(2)})`);
    } catch (err) {
      console.warn('[AutoMemory] Failed to create auto-memory:', err.message);
    }
  }

  // ── Importance scoring ─────────────────────────────────────────────────────

  _scoreImportance(text, meta = {}) {
    const words = text.toLowerCase().match(/\b[a-z]+\b/g) || [];
    if (words.length < 20) return 0; // Too short to be memorable

    // Word count bonus (longer = more content)
    const wordCountScore = Math.min(1, words.length / 200);

    // Action word density
    const actionHits = words.filter(w => ACTION_WORDS.has(w)).length;
    const actionDensity = Math.min(1, actionHits / 5);

    // Entity density (proper nouns heuristic)
    const entities = text.match(ENTITY_PATTERN) || [];
    const entityDensity = Math.min(1, entities.length / 3);

    // Context bonuses
    const missionBonus = meta.source === 'mission' ? 0.2 : 0;
    const codeBonus = text.includes('```') ? 0.15 : 0;
    const decisionBonus = /\b(decided|agreed|confirmed|chosen|selected)\b/i.test(text) ? 0.15 : 0;

    return Math.min(1,
      wordCountScore * 0.3 +
      actionDensity * 0.25 +
      entityDensity * 0.20 +
      missionBonus + codeBonus + decisionBonus
    );
  }

  _extractTags(text) {
    // Extract proper nouns as tags (max 5)
    const entities = (text.match(ENTITY_PATTERN) || [])
      .map(e => e.trim())
      .filter(e => e.length > 2 && e.length < 30);
    // Unique, max 5
    return [...new Set(entities)].slice(0, 5);
  }

  // ── AI title/summary generation ────────────────────────────────────────────

  async _generateTitleAndSummary(userMessage, assistantMessage, meta) {
    const fallbackTitle = userMessage.slice(0, 60).replace(/\n/g, ' ') + (userMessage.length > 60 ? '…' : '');
    const fallbackSummary = assistantMessage.slice(0, 150).replace(/\n/g, ' ');

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) return { title: fallbackTitle, summary: fallbackSummary };

    const prompt = `Summarise this conversation exchange into a memory title and summary.
Respond ONLY with JSON: { "title": "max 70 chars", "summary": "max 150 chars" }

User said: ${userMessage.slice(0, 300)}
JARVIS responded: ${assistantMessage.slice(0, 300)}`;

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${geminiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.1, maxOutputTokens: 128 },
          }),
        }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          title: (parsed.title || fallbackTitle).slice(0, 70),
          summary: (parsed.summary || fallbackSummary).slice(0, 150),
        };
      }
    } catch (err) {
      console.warn('[AutoMemory] Title generation failed:', err.message);
    }

    return { title: fallbackTitle, summary: fallbackSummary };
  }
}
