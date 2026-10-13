# JARVIS OS — Backend API Map (`docs/api-map.md`)

## Overview
JARVIS OS provides REST endpoints and WebSocket streams via an Express server (`services/backend/src/server.js`) listening on port 3001, alongside desktop IPC bridges via Tauri (`apps/desktop`).

## Express REST & WebSocket API Map

### 1. AI & Provider Routes (`/api/ai`)
- **Source**: [ai.js](file:///d:/jarvis/services/backend/src/routes/ai.js)
- `POST /api/ai/chat`: Executes chat completion against configured AI model providers (Gemini, OpenAI, Claude, Local Ollama).
- `GET /api/ai/providers`: Lists available AI provider endpoints and health statuses.
- `POST /api/ai/stream`: WebSocket/SSE streaming endpoint for low-latency AI responses.

### 2. Terminal PTY Routes (`/api/terminal`)
- **Source**: [terminal.js](file:///d:/jarvis/services/backend/src/routes/terminal.js)
- `POST /api/terminal/session`: Spawns a new native PTY child process (`powershell.exe`, `cmd.exe`, `bash`).
- `WS /api/terminal/ws/:id`: Bidirectional WebSocket ANSI data stream for interactive shell input/output.
- `DELETE /api/terminal/session/:id`: Kills target PTY process session.

### 3. Memory & Brain Services (`/api/memory`)
- **Source**: [memory.js](file:///d:/jarvis/services/backend/src/routes/memory.js)
- `GET /api/memory/search`: Vector & keyword search over persistent memory files and knowledge bases.
- `POST /api/memory/store`: Writes new memory entry or note to disk store.
- `GET /api/memory/system`: Fetches system memory context payload for AI prompt construction.

### 4. File System Services (`/api/files`)
- **Source**: [files.js](file:///d:/jarvis/services/backend/src/routes/files.js)
- `GET /api/files/list`: Directory listing with file metadata and sizes.
- `POST /api/files/read`: Reads file text contents.
- `POST /api/files/write`: Writes content to target file safely.

### 5. Voice Services (`/api/voice`)
- **Source**: [voice.js](file:///d:/jarvis/services/backend/src/routes/voice.js)
- `POST /api/voice/synthesize`: Converts text prompt into audio audio/mp3 stream via ElevenLabs or local TTS.
- `POST /api/voice/transcribe`: Accepts audio file upload and returns STT transcript via Whisper.

### 6. System Runtime (`/api/runtime`)
- **Source**: [runtime.js](file:///d:/jarvis/services/backend/src/routes/runtime.js)
- `GET /api/runtime/health`: Healthcheck endpoint for backend system status.
- `GET /api/runtime/telemetry`: CPU, RAM, OS metrics, process tree data.

## Backend Service Controllers (`services/backend/src/services/`)
- [BrainService.js](file:///d:/jarvis/services/backend/src/services/BrainService.js): Context hydration & memory retrieval.
- [DesktopService.js](file:///d:/jarvis/services/backend/src/services/DesktopService.js): OS desktop window control & macro execution.
- [FileService.js](file:///d:/jarvis/services/backend/src/services/FileService.js): Local disk file management.
- [HealthService.js](file:///d:/jarvis/services/backend/src/services/HealthService.js): System telemetry collector.
- [SearchService.js](file:///d:/jarvis/services/backend/src/services/SearchService.js): Web search API proxy & scraper.
- [VoiceService.js](file:///d:/jarvis/services/backend/src/services/VoiceService.js): Voice synthesis engine wrapper.
