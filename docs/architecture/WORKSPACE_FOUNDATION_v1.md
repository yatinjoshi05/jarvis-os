# JARVIS OS Workspace Foundation v1.0

This document defines the common foundation for all workspaces. It introduces no screen, sidebar, dashboard, or module redesign.

## Contract

Every workspace registers a `WorkspaceDefinition` and uses the shared runtime state. It has one lifecycle: `idle → loading → ready → working ↔ paused → completed`, with `error` and `synchronizing` available from any applicable active state. A workspace must expose status, current task, progress, notifications, errors, activity history, and last-updated time.

The shared component vocabulary is declarative only: page header, title, status, toolbar/actions, search, filters, breadcrumbs, context panel, content area, bottom status bar, and the standard loading/empty/error/success/progress states. Shared reusable components are identified by `WorkspaceComponent`; this phase does not render or redesign any of them.

## Navigation and communication

`workspaceNavigation` stores a workspace's path, scroll position, and context timestamp. Workspace implementations restore from that snapshot and should retain in-memory state while inactive; heavyweight resources are released only by the workspace itself. The runtime store persists only lightweight serializable state.

`workspaceEventBus` provides a single event channel for `workspace.*`, `task.*`, `progress.updated`, `context.changed`, `selection.changed`, status, notification, error, and activity events. Workspaces communicate with events and context references rather than importing one another's UI or duplicating orchestration.

## Permissions and auditability

Every registered workspace declares allowed permissions from `read`, `write`, `execute`, `preview`, `delete`, `rename`, and `create`. Permission enforcement is intentionally deferred to the later JARVIS policy layer. All meaningful transitions can be written to the workspace activity history, which is the future Decision History input.

## Performance rules

- Do not eagerly load a workspace's heavy data, editors, canvases, or integrations.
- Store compact restoration state only; retain large data in workspace-owned caches.
- Subscribe to the runtime store narrowly and avoid mirroring its state in multiple stores.
- Emit progress/context events only when values change materially.
- Preserve inactive workspace context; do not refetch simply because the user navigates away and back.

## Adoption pattern

At implementation time, a workspace registers once, calls `workspaceNavigation.open` on activation, restores its own navigation snapshot, and updates `workspaceRuntimeStore` for lifecycle/state changes. No individual workspace is implemented by this foundation.
