// ─────────────────────────────────────────────────────────────────────────────
// JARVIS OS — MemoryLifecycleManager
// Phase 2.2 — AI Memory Intelligence
//
// Manages memory lifecycle stages:
//   working    → accessed in last hour
//   short-term → created in last 7 days
//   long-term  → importance ≥ 7, older than 7 days
//   archived   → explicitly archived
//   forgotten  → never accessed, low importance, older than 60 days
//
// Runs a retention policy pass every 30 minutes.
// ─────────────────────────────────────────────────────────────────────────────

const LIFECYCLE_INTERVAL_MS  = 30 * 60 * 1000;  // 30 minutes
const WORKING_WINDOW_MS      = 60 * 60 * 1000;   // 1 hour
const SHORT_TERM_WINDOW_MS   = 7 * 86_400_000;   // 7 days
const FORGOTTEN_THRESHOLD_MS = 60 * 86_400_000;  // 60 days
const FORGOTTEN_IMPORTANCE   = 2;                // below this → candidate for forgetting
const LONG_TERM_IMPORTANCE   = 7;               // at or above → long-term

export class MemoryLifecycleManager {
  constructor({ repository, events, intelligenceService = null }) {
    this.repository = repository;
    this.events = events;
    this.intelligenceService = intelligenceService;
    this._timer = null;
  }

  start() {
    if (this._timer) return;
    this._timer = setInterval(() => this.runRetentionPolicy().catch(console.error), LIFECYCLE_INTERVAL_MS);
    console.log('[LifecycleManager] Started — retention policy runs every 30 minutes');
    // Run once on startup after a short delay
    setTimeout(() => this.runRetentionPolicy().catch(console.error), 5000);
  }

  stop() {
    if (this._timer) { clearInterval(this._timer); this._timer = null; }
  }

  // ── Stage classification ──────────────────────────────────────────────────

  /**
   * Classify a memory's lifecycle stage.
   * @param {object} memory
   * @returns {'working'|'short-term'|'long-term'|'archived'|'forgotten'}
   */
  classify(memory) {
    if (memory.archived) return 'archived';

    const now = Date.now();

    // lastAccessed can be a unix-ms number or an ISO string
    const lastAccessedMs = typeof memory.lastAccessed === 'number'
      ? memory.lastAccessed
      : memory.lastAccessed
        ? Date.parse(memory.lastAccessed)
        : typeof memory.updatedAt === 'number'
          ? memory.updatedAt
          : memory.updatedAt
            ? Date.parse(memory.updatedAt)
            : now;

    const createdAtMs = typeof memory.createdAt === 'number'
      ? memory.createdAt
      : memory.createdAt ? Date.parse(memory.createdAt) : now;

    const importance = memory.importance ?? memory.metadata?.importance ?? 5;

    // Working: accessed very recently
    if (now - lastAccessedMs < WORKING_WINDOW_MS) return 'working';

    // Forgotten: old, low importance, never really used
    const age = now - createdAtMs;
    const accessCount = memory.accessCount ?? 0;
    if (age > FORGOTTEN_THRESHOLD_MS && importance < FORGOTTEN_IMPORTANCE && accessCount < 2) {
      return 'forgotten';
    }

    // Long-term: high importance, established
    if (importance >= LONG_TERM_IMPORTANCE && age > SHORT_TERM_WINDOW_MS) return 'long-term';

    // Short-term: recent
    if (age < SHORT_TERM_WINDOW_MS) return 'short-term';

    // Default long-term for anything older that doesn't qualify as forgotten
    return 'long-term';
  }

  /**
   * Get lifecycle stage for a specific memory id.
   */
  getStage(memoryId) {
    const memory = this.repository.get(memoryId);
    if (!memory) return null;
    return this.classify(memory);
  }

  /**
   * Get all lifecycle stages in one pass.
   * Returns { [stage]: count }
   */
  getStageSummary() {
    const summary = { working: 0, 'short-term': 0, 'long-term': 0, archived: 0, forgotten: 0 };
    for (const m of this.repository.list()) {
      const stage = this.classify(m);
      summary[stage] = (summary[stage] || 0) + 1;
    }
    return summary;
  }

  // ── Retention policy ──────────────────────────────────────────────────────

  /**
   * Run the retention policy:
   * - Auto-archive memories classified as 'forgotten'
   * - Update importance scores if intelligence service available
   * - Publish lifecycle events
   */
  async runRetentionPolicy() {
    const memories = this.repository.list();
    let archived = 0;
    let rescored = 0;

    for (const memory of memories) {
      // 1. Auto-archive forgotten memories (only if retention enabled)
      if (!memory.archived && !memory.pinned) {
        const stage = this.classify(memory);
        if (stage === 'forgotten') {
          await this.repository.put({ ...memory, archived: true, updatedAt: new Date().toISOString() });
          this.events?.publish('MemoryAutoArchived', { id: memory.id, reason: 'forgotten' });
          archived++;
        }
      }

      // 2. Refresh importance scores via intelligence service
      if (this.intelligenceService && !memory.archived) {
        try {
          const { score } = this.intelligenceService.computeImportance(memory);
          if (Math.abs(score - (memory.importance ?? 5)) >= 1) {
            await this.repository.put({ ...memory, importance: score, updatedAt: new Date().toISOString() });
            rescored++;
          }
        } catch {
          // Non-critical — skip
        }
      }
    }

    if (archived > 0 || rescored > 0) {
      console.log(`[LifecycleManager] Policy pass: archived=${archived}, rescored=${rescored}`);
    }

    this.events?.publish('LifecyclePolicyRan', { archived, rescored, total: memories.length });
  }

  // ── Promotion / demotion ──────────────────────────────────────────────────

  async promote(memoryId) {
    const memory = this.repository.get(memoryId);
    if (!memory) throw Object.assign(new Error('Memory not found'), { status: 404 });
    const newImportance = Math.min(10, (memory.importance ?? 5) + 2);
    await this.repository.put({ ...memory, importance: newImportance, updatedAt: new Date().toISOString() });
    this.events?.publish('MemoryPromoted', { id: memoryId, importance: newImportance });
    return { stage: this.classify({ ...memory, importance: newImportance }), importance: newImportance };
  }

  async demote(memoryId) {
    const memory = this.repository.get(memoryId);
    if (!memory) throw Object.assign(new Error('Memory not found'), { status: 404 });
    const newImportance = Math.max(1, (memory.importance ?? 5) - 2);
    await this.repository.put({ ...memory, importance: newImportance, updatedAt: new Date().toISOString() });
    this.events?.publish('MemoryDemoted', { id: memoryId, importance: newImportance });
    return { stage: this.classify({ ...memory, importance: newImportance }), importance: newImportance };
  }
}
