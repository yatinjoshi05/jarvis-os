# JARVIS OS — Home Memory (`/home`)

## Project Purpose
The Home page is the sacred command center of JARVIS OS. It provides an immediate executive HUD displaying the central interactive animated globe (`AICore`), system metrics, active category workspace access, live audio playback controls, weather telemetry, and quick-action command bar docks.

## UI Architecture
- **Layout**: Fixed 3-column CSS Grid (`grid-cols-[20%_1fr_22%]`) with gap-5 spacing and hidden overflow.
- **Left Panel (20%)**:
  - `WorkspaceLeftColumn`: System performance gauges, CPU/RAM telemetry, active processes.
  - `MusicPlayer`: Audio playback widget for ambient tracks and voice streams.
- **Center Panel (Flex-1)**:
  - `Category Bar`: Filter buttons (`ALL`, `WORK`, `SYSTEM`, `WEB`, `CODE`, `FINANCE`, `PERSONAL`).
  - `AICore`: Animated 3D Quantum Globe component responding to AI states (idle, listening, processing, speaking, error).
  - `ConsoleAndDock`: Interactive terminal input bar and bottom application quick-launch dock icons.
- **Right Panel (22%)**:
  - `WorkspaceRightColumn`: Workspace matrix, active task items, contextual summary feeds based on `activeCategory`.
  - `WeatherWidget`: Real-time weather and location telemetry.

## Services
- `SystemControl`: Intercepts system commands typed into `ConsoleAndDock`.
- `AIManager`: Updates `AICore` animation state and globe reactivity based on model activity.
- `AudioManager`: Drives audio playback in `MusicPlayer`.

## Stores
- `displaySettings`: Hydrates theme parameters, neon glow intensities, font sizes.
- `voiceStore`: Syncs listening/speaking indicators with `AICore`.

## Routes
- `/home` (Default Index route `/` renders `HomeWorkspace`).

## Data Flow
1. User interacts with category tabs or inputs a command into `ConsoleAndDock`.
2. Input is passed to `SystemControl` / `AIRouter`.
3. `AICore` state transitions based on `AssistantState` emitted by `AIRouter`.
4. Output response renders in overlay/dock notifications while audio plays via `MusicPlayer` / `SpeechQueue`.

## Dependencies
- Components: [HomeWorkspace.tsx](file:///d:/jarvis/apps/web/src/widgets/workspace/ui/HomeWorkspace.tsx), [WorkspaceLeftColumn.tsx](file:///d:/jarvis/apps/web/src/widgets/workspace/ui/WorkspaceLeftColumn.tsx), [WorkspaceRightColumn.tsx](file:///d:/jarvis/apps/web/src/widgets/workspace/ui/WorkspaceRightColumn.tsx), [ConsoleAndDock.tsx](file:///d:/jarvis/apps/web/src/widgets/workspace/ui/ConsoleAndDock.tsx), [MusicPlayer.tsx](file:///d:/jarvis/apps/web/src/widgets/workspace/ui/MusicPlayer.tsx), [WeatherWidget.tsx](file:///d:/jarvis/apps/web/src/widgets/workspace/ui/WeatherWidget.tsx), [AICore](file:///d:/jarvis/apps/web/src/entities/ai-core/index.ts).

## Frozen Components (PERMANENTLY FROZEN)
- `AICore` animated globe canvas and positioning.
- `ConsoleAndDock` command bar and dock layout.
- Quick actions & workspace matrix.
- Weather card & music player layout.
- 3-column layout grid ratio (`20%_1fr_22%`).
- Category tabs (`ALL`, `WORK`, `SYSTEM`, `WEB`, `CODE`, `FINANCE`, `PERSONAL`).
- All animations, spacing, colors, and typography.

## Important Files
- [HomeWorkspace.tsx](file:///d:/jarvis/apps/web/src/widgets/workspace/ui/HomeWorkspace.tsx)
- [ConsoleAndDock.tsx](file:///d:/jarvis/apps/web/src/widgets/workspace/ui/ConsoleAndDock.tsx)
- [QuantumGlobeCanvas.tsx](file:///d:/jarvis/apps/web/src/shared/graphics/Globe/QuantumGlobeCanvas.tsx)

## Warnings
- **NEVER REDESIGN THE HOME PAGE.**
- Never replace components, move layout containers, or modify grid columns.
- Home is the JARVIS Command Center — NOT Mission Control.

## Future Plans
- Add rich dynamic shader effects to `AICore` without altering layout or component positioning.

## Known Issues
- Ensure category state changes don't re-render `AICore` canvas webgl context unnecessarily.
