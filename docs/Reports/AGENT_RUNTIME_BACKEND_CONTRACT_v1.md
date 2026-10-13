# Agent Runtime Backend Contract v1

The Agent Hub runtime is served by Express at `/api/runtime`. The React interface remains unchanged; its runtime adapter is the integration point for replacing browser-local state with these endpoints.

## Modules

- `JsonRuntimeRepository`: durable repository interface backed by `services/backend/data/runtime.json`. Replace this implementation with SQLite or PostgreSQL without changing `RuntimeManager`.
- `RuntimeManager`: lifecycle validation, state transitions, heartbeats, restart-safe timer ownership, telemetry, log storage, and event dispatch.
- `runtime` router: HTTP validation/error boundary and SSE subscription endpoint.

## HTTP contract

| Operation | Endpoint |
| --- | --- |
| List agents | `GET /api/runtime/agents` |
| Install/import agent | `POST /api/runtime/agents` |
| Remove agent | `DELETE /api/runtime/agents/:id` |
| Start/stop/restart/enable/disable/pause/resume | `POST /api/runtime/agents/:id/:action` |
| Update configuration | `PUT /api/runtime/agents/:id/config` |
| Logs/metrics/tasks | `GET /api/runtime/agents/:id/{logs,metrics,tasks}` |
| Live stream | `GET /api/runtime/events` (SSE) |

Responses are `{ ok: true, data }` or `{ ok: false, error }`. Manifests require a safe runtime ID and non-empty name. Duplicate IDs return HTTP 409; unknown agents return 404; invalid requests return 400.

## Tauri IPC boundary

Tauri commands should expose the same operation names (`start_agent`, `stop_agent`, `restart_agent`, `enable_agent`, `disable_agent`, `install_agent`, `remove_agent`, `import_agent`, `update_agent_config`, `get_agent_logs`, `get_agent_metrics`, `get_agent_tasks`, `subscribe_runtime_events`) and forward only validated typed payloads to this API. The desktop shell remains responsible for launching/supervising the local Express process; it must not duplicate runtime business logic.

## Future integrations

Browser, Memory, CRM, Coding, Finance, and communications modules register manifests/capabilities through `RuntimeManager.install`. Their worker implementations report task completion, logs, heartbeats, and metrics through the same manager/event stream.
