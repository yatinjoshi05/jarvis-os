# Archify Architecture Evidence Manifest — JARVIS OS
**Project:** Jarvis OS (Personal AI Operating System for Windows)  
**Repository:** `yatinjoshi05/jarvis-os`  
**Branch:** `jarvis-os-sprint-8-financial-os-core`  
**Tooling:** Official Archify 3.2.0  
**Verification Date:** 2026-10-28  

This manifest provides auditable proof that every diagram in the Jarvis OS Architecture Portfolio is grounded in actual repository source code, configuration files, and test suites.

---

## 1. Ground Truth Architecture & Technology Stack

| Layer | Implemented Technology | Verified Source Files | Evidence Category |
| :--- | :--- | :--- | :--- |
| **Desktop Shell** | Tauri v2 (Rust Core) | `apps/web/src-tauri/src/lib.rs`<br>`apps/web/src-tauri/Cargo.toml`<br>`apps/web/src-tauri/tauri.conf.json` | **VERIFIED** |
| **Renderer / UI** | React 18, Vite 5, Zustand, Lucide React, Three.js (3D Globe) | `apps/web/src/App.tsx`<br>`apps/web/src/main.tsx`<br>`apps/web/src/components/HUD.tsx`<br>`apps/web/src/components/Globe.tsx` | **VERIFIED** |
| **Backend Services** | Node.js ESM Express 4 (port 3001) | `services/backend/src/server.js`<br>`services/backend/package.json` | **VERIFIED** |
| **AI Routing Engine** | Multi-tier cascade: NVIDIA NIM (Llama 3.1 70B) → Gemini 1.5 Flash → OpenAI / Claude | `services/backend/src/ai/router.js` (`routeAICompletion`) | **VERIFIED** |
| **Tool Execution** | Win32 ConPTY spawn, KnownFolder security allowlist, system tray | `apps/web/src-tauri/src/lib.rs`<br>`services/backend/src/services/terminal.js` | **VERIFIED** |
| **Memory Subsystem** | Dual Engine: 768-dim Vector Store (`vectors.json`) + KnowledgeGraph (`knowledge-graph.json`) | `services/backend/src/services/vectorStore.js`<br>`services/backend/src/services/knowledgeGraph.js`<br>`services/backend/src/services/autoMemoryEngine.js`<br>`services/backend/src/services/memoryLifecycleManager.js` | **VERIFIED** (58 passing tests) |
| **Audio Subsystem** | Browser Web Speech STT, ElevenLabs chunked proxy, Web Audio API frequency visualizer | `apps/web/src/shared/audio/AudioPlayer.ts`<br>`apps/web/src/shared/audio/ElevenLabsProvider.ts`<br>`services/backend/src/routes/tts.js` | **VERIFIED** |
| **Offline Voice** | Wake-word engine / Local Whisper STT | Documented in design notes, but not implemented in active build | **PLANNED** |

---

## 2. Diagram-by-Diagram Source Code Evidence

### View 1: Master System Architecture (`jarvis-master.html`)
- **Diagram Type:** `architecture` (showcase quality)
- **Gate Status:** 4/4 passed (`validate`, `deliver`, `check`, `browser-check`), 0 layout crossings
- **Component Evidence Mapping:**
  - `desktop_shell`: `apps/web/src-tauri/src/lib.rs` (Tauri v2 application builder, setup hook, window management).
  - `system_tray`: `apps/web/src-tauri/src/lib.rs` (`TrayIconBuilder`, close-to-tray intercept).
  - `win32_conpty`: `apps/web/src-tauri/src/lib.rs` (ConPTY terminal wrapper, PowerShell child execution).
  - `crash_watchdog`: `apps/web/src-tauri/src/lib.rs` (`dirty.flag` creation on boot, unhandled crash recovery).
  - `renderer_hud`: `apps/web/src/components/HUD.tsx` (Glassmorphic heads-up display, command input).
  - `globe_3d`: `apps/web/src/components/Globe.tsx` (Three.js canvas interactive globe visualization).
  - `ipc_client`: `apps/web/src/shared/ipc/tauriBridge.ts` (`@tauri-apps/api/core` invoke bridge).
  - `express_core`: `services/backend/src/server.js` (Express application listen on `PORT=3001`).
  - `ai_orchestrator`: `services/backend/src/ai/router.js` (`routeAICompletion` entry point).
  - `dual_memory`: `services/backend/src/services/vectorStore.js`, `services/backend/src/services/knowledgeGraph.js`.
  - `tts_proxy`: `services/backend/src/routes/tts.js` (ElevenLabs chunked audio streaming endpoint).
  - `cloud_nim`: NVIDIA NIM API endpoint `https://integrate.api.nvidia.com/v1` (`meta/llama-3.1-70b-instruct`).
  - `cloud_gemini`: Google Gemini API endpoint `https://generativelanguage.googleapis.com/v1beta` (`gemini-1.5-flash`).
  - `cloud_elevenlabs`: ElevenLabs API endpoint `https://api.elevenlabs.io/v1/text-to-speech`.

### View 2: User Interaction Pipeline (`jarvis-interaction.html`)
- **Diagram Type:** `workflow` (showcase quality)
- **Gate Status:** 4/4 passed (`validate`, `deliver`, `check`, `browser-check`)
- **Swimlane & Node Evidence Mapping:**
  - Lane 0 (`input`): `apps/web/src/components/HUD.tsx` (Text input, Enter key dispatch, global shortcut registration in `lib.rs`).
  - Lane 1 (`state`): `apps/web/src/store/index.ts` (Zustand state store, prompt hydration, conversation history).
  - Lane 2 (`bridge`): `apps/web/src/shared/ipc/tauriBridge.ts` (IPC invocation `@tauri-apps/api/core`, request payload validation).
  - Lane 3 (`backend`): `services/backend/src/server.js` (`/api/chat` route, `/api/stream` SSE stream).
  - Lane 4 (`execution`): `services/backend/src/ai/router.js` (Provider dispatch, chunked SSE emission, terminal execution).

### View 3: Audio & Voice Subsystem (`jarvis-voice.html`)
- **Diagram Type:** `architecture` (showcase quality)
- **Gate Status:** 4/4 passed (`validate`, `deliver`, `check`, `browser-check`)
- **Component Evidence Mapping:**
  - `mic_capture`: `apps/web/src/shared/audio/AudioPlayer.ts` (`navigator.mediaDevices.getUserMedia` Win32 endpoint).
  - `stt_web_speech`: `apps/web/src/hooks/useVoiceInput.ts` (Browser `webkitSpeechRecognition` API wrapper).
  - `voice_controller`: `apps/web/src/components/VoiceHUD.tsx` (Audio waveform state, listening / speaking states).
  - `audio_visualizer`: `apps/web/src/components/AudioVisualizer.tsx` (`AudioContext`, `AnalyserNode` FFT frequency bin analysis).
  - `elevenlabs_proxy`: `services/backend/src/routes/tts.js` (Express route protecting `ELEVENLABS_API_KEY`, chunked audio pipeline).
  - `cloud_elevenlabs`: ElevenLabs REST streaming endpoint.
  - `planned_whisper`: Explicitly categorized and documented as **PLANNED** (Local Whisper model execution).

### View 4: AI Multi-Provider Router & Tools (`jarvis-ai-routing.html`)
- **Diagram Type:** `workflow` (showcase quality)
- **Gate Status:** 4/4 passed (`validate`, `deliver`, `check`, `browser-check`)
- **Routing Logic Evidence Mapping:**
  - Lane 0 (`ingress`): `services/backend/src/ai/router.js` (Prompt intake, system prompt injection).
  - Lane 1 (`cascade`): Primary dispatch to NVIDIA NIM (`meta/llama-3.1-70b-instruct`) with streaming response support.
  - Lane 2 (`fallback`): `catch (nimError)` fallback branch calling Gemini 1.5 Flash (`@google/genai`).
  - Lane 3 (`provider`): Secondary fallback calling OpenAI `gpt-4o` / Anthropic Claude if configured.
  - Lane 4 (`tools`): Tool execution loop (`services/backend/src/services/terminal.js`, file system access).
  - Lane 5 (`delivery`): Stream normalization and final client emission.

### View 5: Memory & Knowledge Graph Dataflow (`jarvis-dataflow.html`)
- **Diagram Type:** `dataflow` (showcase quality)
- **Gate Status:** 4/4 passed (`validate`, `deliver`, `check`, `browser-check`)
- **Dataflow Stage Evidence Mapping:**
  - Stage 0 (`ingest`): Memory ingestion payload from chat turns or document ingestion.
  - Stage 1 (`embed`): Semantic embedding computation (768-dimensional vectors).
  - Stage 2 (`storage`): Dual persistence — `vectors.json` (vector embeddings) and `knowledge-graph.json` (nodes & relations).
  - Stage 3 (`retrieval`): Hybrid retrieval — Cosine similarity ranking (`vectorStore.js`) combined with subgraph breadth-first search (`knowledgeGraph.js`).
  - Stage 4 (`lifecycle`): `services/backend/src/services/memoryLifecycleManager.js` (LRU cache eviction, access counters, TTL expiration).

### View 6: End-to-End Execution Sequence (`jarvis-sequence.html`)
- **Diagram Type:** `sequence` (showcase quality)
- **Gate Status:** 4/4 passed (`validate`, `deliver`, `check`, `browser-check`)
- **Lifeline Evidence Mapping:**
  - `user`: Physical human operator on Windows.
  - `renderer`: `apps/web/src/App.tsx`, `apps/web/src/components/HUD.tsx`.
  - `ipc`: Tauri v2 IPC bridge (`apps/web/src-tauri/src/lib.rs`).
  - `server`: Express backend on `localhost:3001` (`services/backend/src/server.js`).
  - `router`: `routeAICompletion` (`services/backend/src/ai/router.js`).
  - `memory`: `AutoMemoryEngine` (`services/backend/src/services/autoMemoryEngine.js`).

### View 7: Application Lifecycle State Machine (`jarvis-lifecycle.html`)
- **Diagram Type:** `lifecycle` (showcase quality)
- **Gate Status:** 4/4 passed (`validate`, `deliver`, `check`, `browser-check`)
- **State Evidence Mapping:**
  - `boot`: Process invocation (`main.rs` / `lib.rs`).
  - `crash_check`: Inspection of `dirty.flag` file in `%APPDATA%/JarvisOS` (unhandled panic recovery).
  - `splash_init`: HTML splash screen display, `localStorage` shim hydration before React DOM mount.
  - `services_ready`: Child Express process bound to port 3001, health check returns `status: "ok"`.
  - `active_runtime`: Main HUD revealed, 3D globe active, event listeners attached.
  - `minimized_tray`: Tauri `on_window_event` intercepts close request, calls `window.hide()`.
  - `clean_quit`: User clicks "Quit Jarvis" from tray menu; `dirty.flag` cleanly deleted, child processes killed.
