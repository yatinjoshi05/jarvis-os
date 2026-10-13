# JARVIS OS — Automation Memory (`/automation`)

## Project Purpose
The Automation module provides workflow scheduling, background script execution, recurring job dispatching, desktop UI automation, and system task triggers across JARVIS OS.

## UI Architecture
- Automation Workflow Builder: Interface for constructing trigger-action flow diagrams.
- Cron & Task Schedule Table: Dashboard for active scheduled background tasks.
- Task Log Viewer: Real-time output log console for executed workflow runs.

## Services
- `AutomationService` (`services/backend/src/services/AutomationService.js`).
- Background Task Scheduler: Handles interval, timer, and cron schedules (`schedule` tool engine).
- Desktop Automation Service (`DesktopService.js`).

## Stores
- Automation Store: Stores active workflow definitions, trigger configurations, execution logs, and failure retry counters.

## Routes
- `/automation` -> Renders Automation Workspace & task management views.

## Data Flow
1. User or AI agent defines a workflow trigger (e.g. interval timer, webhook, file watch event).
2. `AutomationService` registers schedule in backend runtime.
3. Upon trigger fire, task steps execute (e.g. execute terminal command, run browser extraction, call AI prompt).
4. Results are stored in memory logs and surfaced in Mission Control or desktop notifications.

## Dependencies
- Backend: [AutomationService.js](file:///d:/jarvis/services/backend/src/services/AutomationService.js), [DesktopService.js](file:///d:/jarvis/services/backend/src/services/DesktopService.js).
- Frontend: Automation feature components.

## Frozen Components
- Background automation tasks must never freeze or block main UI thread execution.

## Important Files
- [AutomationService.js](file:///d:/jarvis/services/backend/src/services/AutomationService.js)
- [DesktopService.js](file:///d:/jarvis/services/backend/src/services/DesktopService.js)

## Warnings
- Any destructive file or system automation action requires explicit user permission verification.

## Future Plans
- Native OS accessibility API driver for full keyboard/mouse macro playback.

## Known Issues
- Ensure long-running cron jobs auto-recover after backend server restart.
