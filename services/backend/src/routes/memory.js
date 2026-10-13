// ─────────────────────────────────────────────────────────────────────────────
// JARVIS OS — Memory Routes (Phase 2.2 extended)
// Core CRUD + Intelligence endpoints
// ─────────────────────────────────────────────────────────────────────────────

import { Router } from 'express';

const send = (res, fn) =>
  Promise.resolve(fn())
    .then(data => res.json({ ok: true, data }))
    .catch(error => res.status(error.status || 500).json({ ok: false, error: error.message }));

export const createMemoryRouter = (service, intelligence = null, lifecycle = null) => {
  const router = Router();

  // ── Core CRUD (Phase 2.1) ─────────────────────────────────────────────────
  router.get('/', (req, res) => send(res, () => service.search(req.query)));
  router.post('/', (req, res) => send(res, () => service.create(req.body)));
  router.put('/:id', (req, res) => send(res, () => service.update(req.params.id, req.body)));
  router.delete('/:id', (req, res) => send(res, () => service.delete(req.params.id)));
  router.post('/:id/archive', (req, res) => send(res, () => service.archive(req.params.id, req.body.archived !== false)));
  router.post('/:id/pin', (req, res) => send(res, () => service.pin(req.params.id, req.body.pinned !== false)));
  router.post('/merge', (req, res) => send(res, () => service.merge(req.body.primaryId, req.body.secondaryId)));
  router.post('/relationships', (req, res) => send(res, () => service.relate(req.body.from, req.body.to, req.body.type)));

  // ── Intelligence Endpoints (Phase 2.2) ────────────────────────────────────
  // All intelligence endpoints gracefully return empty results if service is unavailable.

  /** Semantic search — vector + keyword blended */
  router.get('/search/semantic', (req, res) =>
    send(res, async () => {
      if (!intelligence) return service.search(req.query);
      const { q, limit, category, threshold } = req.query;
      return intelligence.semanticSearch(q || '', {
        limit: limit ? Number(limit) : 10,
        threshold: threshold ? Number(threshold) : 0.1,
        category,
      });
    })
  );

  /** AI context injection — memory snippets for a given user query */
  router.post('/context', (req, res) =>
    send(res, async () => {
      if (!intelligence) return { snippets: [], tokenEstimate: 0, contextString: '' };
      const { query, limit } = req.body;
      return intelligence.buildContext(query || '', limit ? Number(limit) : 5);
    })
  );

  /** AI insights — pattern-based observations */
  router.get('/insights', (req, res) =>
    send(res, async () => {
      if (!intelligence) return [];
      return intelligence.generateInsights();
    })
  );

  /** Related memories for a specific memory */
  router.get('/:id/related', (req, res) =>
    send(res, async () => {
      if (!intelligence) return [];
      return intelligence.findRelated(req.params.id, req.query.limit ? Number(req.query.limit) : 5);
    })
  );

  /** AI summary for a specific memory */
  router.post('/:id/summarise', (req, res) =>
    send(res, async () => {
      if (!intelligence) throw Object.assign(new Error('Intelligence service not available'), { status: 503 });
      return intelligence.generateSummary(req.params.id);
    })
  );

  /** Importance score for a specific memory */
  router.get('/:id/importance', (req, res) =>
    send(res, () => {
      if (!intelligence) return { score: 5, factors: {} };
      const memory = service.require(req.params.id);
      return intelligence.computeImportance(memory);
    })
  );

  /** Knowledge graph — neighbours of a node */
  router.get('/graph/neighbours/:nodeId', (req, res) =>
    send(res, async () => {
      if (!intelligence) return [];
      const depth = req.query.depth ? Number(req.query.depth) : 2;
      return intelligence.knowledgeGraph.getNeighbours(req.params.nodeId, depth);
    })
  );

  /** Knowledge graph — global stats */
  router.get('/graph/stats', (req, res) =>
    send(res, () => {
      if (!intelligence) return {};
      return intelligence.knowledgeGraph.getStats();
    })
  );

  // ── Lifecycle Endpoints ────────────────────────────────────────────────────

  /** Lifecycle stage for a specific memory */
  router.get('/:id/lifecycle', (req, res) =>
    send(res, () => {
      if (!lifecycle) return { stage: 'unknown' };
      const stage = lifecycle.getStage(req.params.id);
      return { stage };
    })
  );

  /** Get all lifecycle stage counts */
  router.get('/lifecycle/summary', (req, res) =>
    send(res, () => {
      if (!lifecycle) return {};
      return lifecycle.getStageSummary();
    })
  );

  /** Manually run the retention policy */
  router.post('/lifecycle/run', (req, res) =>
    send(res, async () => {
      if (!lifecycle) throw Object.assign(new Error('Lifecycle manager not available'), { status: 503 });
      await lifecycle.runRetentionPolicy();
      return { ok: true };
    })
  );

  /** Promote a memory (increase importance) */
  router.post('/:id/promote', (req, res) =>
    send(res, () => lifecycle ? lifecycle.promote(req.params.id) : { promoted: false })
  );

  /** Demote a memory (decrease importance) */
  router.post('/:id/demote', (req, res) =>
    send(res, () => lifecycle ? lifecycle.demote(req.params.id) : { demoted: false })
  );

  return router;
};
