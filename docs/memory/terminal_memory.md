# JARVIS OS — Terminal Memory (`/terminal`)

## Project Purpose
The Terminal module provides an enterprise-grade interactive terminal environment with multi-tab session management, pane splitting, real-time command output streaming via WebSockets/node-pty, command history tracking, and AI command generation and explanation.

## UI Architecture
- `TerminalPage`: Main container view (`apps/web/src/widgets/terminal/ui/TerminalPage.tsx`).
- `TerminalWindow`: Core interactive terminal emulator wrapper (`TerminalWindow.tsx`).
- `TerminalTabs`: Tab navigation for managing multiple shell instances (`TerminalTabs.tsx`).
- `TerminalToolbar`: Action toolbar for split panes, clear screen, copy output, shell switching.
- `PaneView`: Grid layout for split terminal panes (`PaneView.tsx`).
- `AISuggestionPanel`: AI copilot offering context-aware shell auto-completion and command explanations (`AISuggestionPanel.tsx`).
- `CommandHistoryPanel`: Searchable drawer of past terminal commands and exit codes (`CommandHistoryPanel.tsx`).
- `TerminalStatusBar`: Terminal state monitor (working directory, process ID, execution timer).

## Services
- Node-pty Backend Service (`services/backend/src/routes/terminal.js`): Spawns native child processes (`powershell.exe`, `cmd.exe`, `bash`).
- WebSocket Stream Manager: Handles duplex ANSI stream data between backend PTY and xterm UI.

## Stores
- Terminal Session Store: Manages active tabs, pane configurations, scrollback buffers, and environment variables.

## Routes
- `/terminal` -> Renders `TerminalWorkspace` / `TerminalPage`.

## Data Flow
1. Keypress events in `TerminalInput` or xterm instance send text data over WebSocket / HTTP to Express backend `/api/terminal`.
2. `node-pty` processes stream back ANSI output chunks.
3. `TerminalWindow` updates terminal canvas/DOM.
4. `AISuggestionPanel` listens to errors or explicit query triggers (`Ctrl+Space` / prompt) to suggest shell commands.

## Dependencies
- Backend: `node-pty`, `ws` (WebSockets).
- Frontend: [TerminalPage.tsx](file:///d:/jarvis/apps/web/src/widgets/terminal/ui/TerminalPage.tsx), [TerminalWindow.tsx](file:///d:/jarvis/apps/web/src/widgets/terminal/ui/TerminalWindow.tsx), [TerminalTabs.tsx](file:///d:/jarvis/apps/web/src/widgets/terminal/ui/TerminalTabs.tsx), [AISuggestionPanel.tsx](file:///d:/jarvis/apps/web/src/widgets/terminal/ui/AISuggestionPanel.tsx).

## Frozen Components
- Standard terminal layout boundaries must match dark glass UI system.

## Important Files
- [TerminalPage.tsx](file:///d:/jarvis/apps/web/src/widgets/terminal/ui/TerminalPage.tsx)
- [terminal.js](file:///d:/jarvis/services/backend/src/routes/terminal.js)

## Warnings
- Destructive commands (`rm -rf`, `DROP TABLE`, destructive disk scripts) must trigger confirmation warnings via `accidental-data-loss-prevention` protocols.

## Future Plans
- Remote SSH session management and container execution tabs.

## Known Issues
- Windows PowerShell PTY requires proper ANSI escape code stripping for plain-text AI processing.
