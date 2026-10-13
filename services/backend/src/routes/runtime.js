import express from 'express';
export const createRuntimeRouter = manager => {
  const router = express.Router();
  const send = (res, work) => Promise.resolve(work()).then(data => res.json({ ok: true, data })).catch(error => res.status(error.status || 500).json({ ok: false, error: error.message }));
  router.get('/agents', (_req, res) => send(res, () => manager.list()));
  router.post('/agents', (req, res) => send(res, () => manager.install(req.body)));
  router.delete('/agents/:id', (req, res) => send(res, async () => { await manager.remove(req.params.id); return { id: req.params.id }; }));
  router.post('/agents/:id/:action(start|stop|restart|enable|disable|pause|resume)', (req, res) => send(res, () => manager.transition(req.params.id, req.params.action)));
  router.put('/agents/:id/config', (req, res) => send(res, () => manager.updateConfig(req.params.id, req.body)));
  router.get('/agents/:id/logs', (req, res) => send(res, () => manager.logs(req.params.id)));
  router.get('/agents/:id/metrics', (req, res) => send(res, () => manager.metrics(req.params.id)));
  router.get('/agents/:id/tasks', (req, res) => send(res, () => manager.tasks(req.params.id)));
  router.get('/events', (req, res) => { res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' }); const listener = event => res.write(`event: runtime\ndata: ${JSON.stringify(event)}\n\n`); manager.events.on('event', listener); req.on('close', () => manager.events.off('event', listener)); });
  return router;
};
