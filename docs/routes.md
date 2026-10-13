# JARVIS OS — Master Routes Index (`docs/routes.md`)

## Overview
JARVIS OS enforces strict modular route isolation under React Router v6. Below is the complete route registry mapping URL paths to workspace views and UI entry points.

## Client Application Routes (`apps/web/src/app/providers/app-router.tsx`)

| Route Path | View Component | Description | Module Boundary | Status |
| :--- | :--- | :--- | :--- | :--- |
| `/` | `Shell` -> `HomeWorkspace` | Default Root Route (renders sacred Home command hub) | `/home` | **FROZEN** |
| `/home` | `HomeWorkspace` | JARVIS Executive Command Center HUD | `/home` | **FROZEN** |
| `/browser` | `BrowserWorkspace` | Integrated web browsing, DOM parsing & preview panel | `/browser` | Active |
| `/terminal` | `TerminalWorkspace` | Interactive multi-tab PTY terminal & AI autocomplete | `/terminal` | Active |
| `/memory` | `MemoryWorkspace` | Contextual memory inspector, knowledge graphs & vector search | `/memory` | Active |
| `/voice` | Voice Controllers | Voice state machine controllers & microphone manager | `/voice` | Active |
| `/automation` | `AutomationWorkspace` | Workflow builder, cron task dispatcher & script scheduler | `/automation` | Active |
| `/vision` | Vision Overlays | Visual multi-modal inspector & screen capture analysis | `/vision` | Active |
| `/mission-control` | `MissionControlPage` | Agent swarm orchestration & subagent execution dashboard | `/mission-control` | Active |
| `/files` | `FilesWorkspace` | File manager, local directory explorer & previewer | `/files` | Active |
| `/coding` | `CodingWorkspace` | Code editor workspace, IDE integrations & git tools | `/coding` | Active |
| `/trading` | `FinancialWorkspace` | Market charts, financial feeds & portfolio monitor | `/trading` | Active |
| `/crm` | `CRMWorkspace` | Contact management & communications hub | `/crm` | Active |
| `/settings` | `SettingsWorkspace` | System settings, display themes & provider API keys | `/settings` | Active |
| `/agent-hub` | `AgentHubWorkspace` | Agent marketplace & subagent capability config | `/agent-hub` | Active |
| `/devices` | `ModulePlaceholder` | Hardware device telemetry placeholder | `/devices` | Placeholder |

## Routing Integrity Rules
1. **Never merge modules**: `/home` and `/mission-control` must remain strictly independent.
2. **Never replace routes**: Existing route paths must not be renamed or deprecated.
3. **No automatic fallbacks to non-existent modules**: Unmatched paths should safely render inside `Shell`.
