# JARVIS OS — System Memory

## Project Purpose
JARVIS OS is an autonomous AI executive desktop platform and agentic operating environment designed to unify workspace computing, AI provider orchestration, real-time voice interaction, browser automation, terminal PTY execution, and mission-control task delegation into a single responsive, zero-latency desktop interface.

## UI Architecture
JARVIS OS UI follows a structured Feature-Sliced Design (FSD) topology within `apps/web`:
- `app`: Application setup, Vite entry point (`main.tsx`), global styles, storage shims, and client router configuration (`AppRouter`).
- `pages`: Root page layouts (e.g. `dashboard/Shell.tsx`).
- `widgets`: Modular workspace widgets (`HomeWorkspace`, `BrowserWorkspace`, `TerminalWorkspace`, `MemoryWorkspace`, `FilesWorkspace`, `CodingWorkspace`, `FinancialWorkspace`, `CRMWorkspace`, `SettingsWorkspace`, `AgentHubWorkspace`, `MissionWorkspace`, `MissionControlPage`).
- `features`: Feature-specific logic and UI bindings (authentication, automation, browser, chat, command-bar, voice, terminal, search, etc.).
- `entities`: Business domain models (e.g. `AICore` animated quantum globe, AI status models).
- `shared`: Global utilities, state managers, AI provider bridges, audio state machines, theme settings, and UI primitives.

## Services
- **Backend Node.js Service** (`services/backend/src/server.js`):
  - Express.js API runtime on port 3001.
  - Endpoints: `/api/ai`, `/api/terminal`, `/api/memory`, `/api/files`, `/api/voice`, `/api/runtime`.
  - Services: `BrainService`, `DesktopService`, `FileService`, `HealthService`, `SearchService`, `SettingsService`, `VoiceService`, `WindowService`, `MemoryService`, `AutomationService`.
- **Tauri Desktop Shell** (`apps/desktop`):
  - Native OS window container, system tray management, native storage bindings, IPC bridge.

## Stores
- `displaySettings`: Dynamic theme, contrast, glow effects, layout modes.
- `voiceStore`: Speech recognition, voice synthesis state, audio reactivity thresholds.
- `conversationManager`: Active thread persistence, chat history export/import.
- `customProviderManager`: Dynamic LLM provider registry (OpenAI, Claude, Gemini, Ollama, Nvidia, ElevenLabs).
- `AIRouter`: Dynamic route dispatching for multi-model inference and fallback strategy.

## Routes
- `/` -> `Shell` layout wrapper
- `/home` -> `HomeWorkspace` (sacred center command hub)
- `/browser` -> `BrowserWorkspace`
- `/terminal` -> `TerminalWorkspace`
- `/memory` -> `MemoryWorkspace`
- `/voice` -> `VoiceWorkspace` / voice state controllers
- `/automation` -> `AutomationWorkspace`
- `/vision` -> `VisionWorkspace`
- `/mission-control` -> `MissionControlPage`
- `/files` -> `FilesWorkspace`
- `/coding` -> `CodingWorkspace`
- `/trading` -> `FinancialWorkspace`
- `/crm` -> `CRMWorkspace`
- `/settings` -> `SettingsWorkspace`
- `/agent-hub` -> `AgentHubWorkspace`

## Data Flow
1. **User Action / Voice Input**: Intercepted by `ConsoleAndDock`, `MicrophoneManager`, or `SpeechRecognitionController`.
2. **Provider Orchestration**: Handled by `AIRouter` and `ProviderFactory`, routing to active LLM (Gemini, OpenAI, Claude, Local Ollama).
3. **Execution**: Routed via backend REST APIs (`/api/*`) or Tauri IPC bridges to run terminal commands, execute web browsing actions, query memory, or update mission control.
4. **UI Response & Audio Feedback**: `AudioStateMachine` and `SpeechQueue` process audio synthesis while React components render updated state.

## Dependencies
- Frontend: React 18, React Router v6, Tailwind CSS, Lucide React, Framer Motion, Three.js / Canvas.
- Desktop: Tauri v1/v2 Rust runtime.
- Backend: Node.js, Express, Cors, ws (WebSockets), node-pty.

## Frozen Components
- **Home Page Layout**: The Home page (`/home`) is sacred and permanently frozen.
- **Components**: `AICore` (animated globe), `ConsoleAndDock` (command bar & dock), `WorkspaceLeftColumn`, `WorkspaceRightColumn`, `MusicPlayer`, `WeatherWidget`, Category Tabs (`ALL`, `WORK`, `SYSTEM`, `WEB`, `CODE`, `FINANCE`, `PERSONAL`).

## Important Files
- [main.tsx](file:///d:/jarvis/apps/web/src/app/main.tsx) — Boot sequence, storage hydration, React root.
- [app-router.tsx](file:///d:/jarvis/apps/web/src/app/providers/app-router.tsx) — Client router specification.
- [HomeWorkspace.tsx](file:///d:/jarvis/apps/web/src/widgets/workspace/ui/HomeWorkspace.tsx) — Sacred Home page view layout.
- [server.js](file:///d:/jarvis/services/backend/src/server.js) — Backend Express server.

## Warnings
- NEVER modify Home page layout, spacing, colors, component placement, or animations without explicit permission.
- Functionality must adapt to UI; UI must NEVER adapt to functionality.
- Mission Control (`/mission-control`) must always remain separate from Home (`/home`).

## Future Plans
- Native Rust cross-platform window management enhancement.
- Local vector database embeddings for offline memory query speed.
- Multi-agent swarm orchestration in Mission Control.

## Known Issues
- Ephemeral WebView session storage requires `initLocalStorageShim()` on boot to sync with Tauri persistent store.
