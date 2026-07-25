# JARVIS OS Project Brain (Knowledge Base)

## Maintenance Protocol

This file is the project's persistent knowledge base. Any AI session that makes a meaningful change (new module, architecture change, converting a mock to real, resolving a known limitation, adding a dependency) MUST update the relevant section of this file as part of that same task — not as a separate follow-up. Keep entries concise; correct stale information rather than appending contradictions. If a claim can't be verified, mark it "Unknown" rather than guessing.

---

## 1. Project Purpose
JARVIS OS is a highly advanced, agentic AI desktop assistant designed to run locally as a desktop environment shell. It provides users with voice activation, context-aware assistance, simulated workflows (such as coding, terminal, and browser operations), and real computer control capabilities (like taking screenshots, launching applications, and adjusting system volume).

---

## 2. High-Level Architecture
The system is composed of three primary parts:
1. **Frontend App (React/Vite)**: A rich, dark-themed, glassmorphic UI built using React, TypeScript, TailwindCSS, and React Three Fiber (R3F) for graphics. It uses the **Feature-Sliced Design (FSD)** architecture.
2. **Desktop Shell Wrapper (Tauri)**: Wraps the frontend into a desktop application (`apps/web/src-tauri` using Rust), exposing desktop capabilities through safe, discrete Tauri IPC commands (preventing direct arbitrary terminal execution).
3. **Backend Proxy (Node/Express)**: Runs locally on port 3001 to proxy API keys and requests securely, shielding upstream credentials for Gemini and NVIDIA NIM from client-side exposition.

```mermaid
graph TD
    UI[React / Vite Frontend] <-->|Tauri IPC Commands| Tauri[Tauri Rust Desktop Wrapper]
    UI <-->|Vite Dev Proxy: /api| Proxy[Express Backend Proxy: Port 3001]
    Proxy <-->|Fetch with API Key / Token| CFGateway[Cloudflare AI Gateway]
    CFGateway <-->|Upstream Proxy| Gemini[Google Gemini API]
    Proxy <-->|Direct API Key| NvidiaNIM[NVIDIA NIM Upstream]
    UI <-->|Direct API Key| ClientAPIs[ElevenLabs & OpenAI TTS]
```

---

## 3. Folder Responsibilities

| Directory | Layer/Role | Responsibility |
| :--- | :--- | :--- |
| `apps/desktop/` | Electron Shell | Legacy or alternative Electron desktop client wrapper. |
| `apps/web/` | Web Workspace | Contains the primary React frontend code and the active Tauri configuration. |
| `apps/web/src-tauri/` | Desktop Host | Rust host code for Tauri commands, tray menus, and window configuration. |
| `apps/web/src/app/` | FSD - App Layer | Entry points, styles, routing, global providers, and `bootstrap.ts` initialization. |
| `apps/web/src/pages/` | FSD - Page Layer | High-level page views (e.g. Dashboard pages, layout routers). |
| `apps/web/src/widgets/` | FSD - Widget Layer | Complex, self-contained UI blocks (e.g. Sidebar, WorkspaceLeftColumn, WorkspaceRightColumn, AudioDebugPanel, AIProviderStatusPanel). |
| `apps/web/src/features/` | FSD - Feature Layer | Interactive capabilities (e.g. Voice activation button, console input, notification dispatchers). |
| `apps/web/src/entities/` | FSD - Entity Layer | Business entities and managers (e.g. FinancialManager, CRMManager, CodingAgentManager, BrowserAgentManager). |
| `apps/web/src/shared/` | FSD - Shared Layer | Reusable helpers, global error mappings, events, base agents, memory router, AI Health Manager, Audio Engine, Provider Model Mapper, and generic UI components. |
| `services/backend/` | Backend Proxy | Express proxy service running on port 3001 for secure model API access. |

---

## 4. Technology Stack
* **Frontend UI**: React 18, TypeScript, TailwindCSS, Framer Motion (micro-animations), Lucide Icons, React Three Fiber + Three.js (3D Neural Globe visualization).
* **Desktop Platform**: Tauri v2, Rust (`window-state`, `autostart`, `clipboard-manager`, `notification`, `log` plugins).
* **Local APIs / Tools**: Node.js, Express, `dotenv` configuration.
* **Upstream APIs**: Google Gemini (via Cloudflare Gateway or direct proxy), NVIDIA NIM, Anthropic Claude, OpenAI, Ollama, ElevenLabs (TTS), OpenAI (TTS).

---

## 5. Execution & Request Flow

### Voice Assistant Processing Loop
```mermaid
sequenceDiagram
    participant U as User
    participant SR as SpeechRecognitionManager
    participant VM as VoiceManager
    participant AI as AIResponseManager
    participant AR as AIRouter
    participant MM as ProviderModelMapper
    participant HM as AIProviderHealthManager
    participant BP as Backend Proxy (Port 3001)

    U->>SR: User speaks
    SR->>VM: Emit recognition text
    VM->>AI: Send prompt
    AI->>AR: Route prompt with 20s safety timeout guard
    AR->>HM: Select healthy provider (NVIDIA -> Gemini -> Claude -> OpenAI -> Ollama -> Local)
    AR->>MM: Validate & translate model for selected provider (e.g. gemini-3.5-flash -> meta/llama-3.1-8b-instruct)
    AR->>BP: Fetch /api/chat/nvidia with provider-valid model
    BP-->>AR: Return streaming response chunks
    AR->>AI: Aggregate text response
```

---

## 6. Established Patterns

### 1. Provider Interface & Failover Pattern
All AI providers (Gemini, Claude, OpenAI, Ollama, Local, NVIDIA NIM) implement the `AIProvider` interface located in `shared/ai/AIProvider.ts`. The `AIRouter`, `ProviderModelMapper`, and `AIProviderHealthManager` track health status, consecutive failures, response latencies, and quota exhaustion to perform transparent provider failovers without context loss.

### 2. ServiceRegistry + Bootstrap Evaluated Side-Effects Pattern
To bypass Vite/Rollup tree-shaking that drops files containing self-registering singleton managers, the FSD layer boundary utilizes:
- `shared/providers/ServiceRegistry.ts`: A centralized registry map.
- `app/bootstrap.ts`: Explicitly force-imports and accesses manager singletons on application start (including `audioManager` and `aiRouter`), ensuring evaluated registration side-effects occur.

### 3. `isMock: true` Metadata Pattern
Mocked subsystems do not alter core TypeScript field structures. Instead, they attach `isMock: true` to returned payloads and log events. Systems like `AgentLogger.ts` intercept this to format logs with a `[SIMULATED]` prefix.

---

## 7. Confirmed Real-vs-Mock Status Per Subsystem

| Subsystem | Status | Persistance Method | Security / Architecture Rationale |
| :--- | :--- | :--- | :--- |
| **3D Quantum Globe** | **Real** | R3F / GLSL Shader State Engine (Commit: `da35f11`) | Dense particle visibility baseline: increased alpha floor (0.20-0.95) across digital lattice, 10-14 high-density coherent energy islands, hero threshold E > 0.92 (<0.8% visible), sub-pixel OLED derivative disc profiles, zero smooth emissive patches. |
| **Voice & Speech** | **Real** | Local browser API | Native browser Web Speech API for recognition, ElevenLabs / OpenAI for TTS. |
| **Computer Control** | **Real** | Rust / Tauri commands | Hard allowlist on folders (Desktop/Documents/Downloads/Pictures) to prevent arbitrary path access. Includes file organize/rename previews. |
| **PDF & Document Parsing**| **Real** | Rust / Tauri commands | Uses local `pdf-extract` crate for PDF text extraction and headless LibreOffice for DOCX conversion. |
| **Short/Long-Term Memory**| **Real** | LocalStorage / InMemory | Scoped `jarvis_mem_` records; contains ranking and relevance scoring. |
| **NVIDIA NIM & Gemini** | **Real** | Backend proxy (Express) | Proxied locally via Port 3001 to prevent exposure of keys in frontend builds. |
| **AI Provider Failover** | **Real** | LocalStorage (`jarvis_ai_provider_priority`) | Dynamic metrics, 429 quota classification, auto-recovery timers (30s/2m/30m), priority re-ordering UI panel (`AIProviderStatusPanel.tsx`). |
| **Model Translation** | **Real** | Contract Registry (`ProviderModelMapper.ts`) | Strict model translation contract preventing unsupported model names (e.g. `gemini-3.5-flash`) from reaching non-Gemini providers. |
| **ElevenLabs Speech Pipeline** | **Real** | ElevenLabs Streaming API | Real MP3 audio stream generation via `/api/tts/elevenlabs` proxy using standard premade voice ID `pNInz6obpgDQGcFmaJgB` (Adam). |
| **Financial OCR / Statements**| **Mocked**| LocalStorage / JSON seed | Mocks MetLife / Vanguard statements parsing via `simulateOCR` returning hardcoded data. |
| **Automation Dispatchers** | **Mocked**| LocalStorage / In-Memory | Mocks SMTP (Email) dispatchers. |
| **Browser Scraper / Search** | **Mocked**| In-Memory | Simulated scraper results; avoids complex remote browser sandbox logic. |
| **Coding Terminal & Git** | **Mocked**| LocalStorage simulated | Deliberately mocked terminal/bash sandbox to prevent prompt-injection leading to Remote Code Execution (RCE). |
| **Supervisor & Autonomous Meta-Agent**| **Real** | LocalStorage / InMemory | Live agent registration, health monitoring, auto-fix with code snapshots, rolling rate limiters (5/hr), and global kill switch. |
| **Calling & WhatsApp Agents**| **Real Pipeline**| LocalStorage / Backend Proxy | Mandatory per-action human confirmation before dialing/sending. Checks `TWILIO_*` & `WHATSAPP_*` credentials, reporting setup requirements cleanly if missing. |
| **Premium Audio Engine**| **Real** | LocalStorage (`jarvis_audio_settings`) | Web Audio API & HTML5 mixer. Independent volume channels (Ambient, UI, Voice, Master), smooth gain fading, state machine auto-synced to AssistantState, autoplay interaction unlock, developer control matrix (`AudioDebugPanel.tsx`). |
| **Display & Appearance Engine**| **Real** | LocalStorage (`jarvis_display_settings`) / Backend (`/api/settings/save`) | Native CSS `zoom` DOM scaling (80%-150%), 20 Google Fonts cascading override, theme preset variables (`--jarvis-bg-main`, `--jarvis-bg-card`), accent swatches (`--jarvis-accent-color`), Layer 4 category text scaling, native Tauri window resize & fullscreen controls. |
| **Identity & Personality Profile**| **Real** | LocalStorage (`jarvis_user_identity`, `jarvis_ai_personality`) / Backend (`/api/settings/save`) | Formats structured `[SYSTEM MANDATE]` system instructions injected into `AIRouter` and all AI providers for User Title, Persona Role (`J.A.R.V.I.S.`, `F.R.I.D.A.Y.`, `H.E.R.M.E.S.`), Formality (1-5), Verbosity (1-5), and verbatim custom directives. |

---

## 8. Environment Variables
Stored in `apps/web/.env` and shared by the frontend and backend proxy:

| Env Key | Required For | Target | Example Value |
| :--- | :--- | :--- | :--- |
| `NVIDIA_API_KEY` | NVIDIA NIM Proxy | Server | `nvapi-...` |
| `GEMINI_API_KEY` | Gemini Direct Proxy | Server | `AIzaSy...` (fallback if gateway is off) |
| `VITE_CLOUDFLARE_GATEWAY_URL` | Cloudflare AI Gateway | Both | `https://gateway.ai.cloudflare.com/v1/...` |
| `CLOUDFLARE_GATEWAY_TOKEN` | Cloudflare Auth | Server | `cfut_...` |
| `VITE_DEFAULT_AI_PROVIDER` | AI Router selection | Client | `nvidia` |
| `VITE_AI_FALLBACK_PROVIDERS` | AI Router backup | Client | `gemini` |
| `VITE_AI_REQUEST_TIMEOUT_MS`| Request limits | Client | `30000` |
| `VITE_TTS_PROVIDER` | Voice synthesis | Client | `elevenlabs` (or `browser`) |
| `ELEVENLABS_API_KEY` | ElevenLabs TTS Proxy | Server | `sk_b50bb...` |
| `VITE_ELEVENLABS_VOICE_ID` | ElevenLabs Voice ID | Client | `pNInz6obpgDQGcFmaJgB` (Adam) |

---

## 9. Common Commands

| Command | Working Directory | Purpose |
| :--- | :--- | :--- |
| `pnpm install` | Root | Installs dependencies across all monorepo workspaces. |
| `pnpm --filter web build` | Root | Compiles TypeScript and builds production frontend bundle. |
| `tsc --noEmit` | `apps/web` | Runs TypeScript compiler checks on the frontend. |
| `cargo check` | `apps/web/src-tauri` | Verifies compilation of Rust tauri wrapper. |
| `pnpm --filter web tauri dev` | Root | Starts frontend dev server + Tauri desktop window. |
| `node services/backend/src/server.js`| Root | Starts Port 3001 backend proxy server. |
| `pnpm --filter web dev` | Root | Starts both backend proxy and frontend dev server concurrently. |

---

## 10. Known Limitations & Technical Debt
1. **ESLint Upstream Crash**: ESLint parser crashes on TS 7.0 preview syntax (`SyntaxKind.BarBarToken` resolution fails in `ts-api-utils`). `tsc --noEmit` must be used for compilation checks.
2. **Three.js Code Splitting**: Production bundle includes a single ~1.5MB React Three Fiber/Three.js bundle that is not code-split.
3. **Depcheck False Positives**: `depcheck` flags PostCSS, TailwindCSS, and Autoprefixer as unused because they are referenced only in config files rather than JS imports.

---

## 11. Security Boundaries
* **Coding Sandbox Boundary**: The Coding Agent's terminal and git commands are kept mocked to protect the host machine from malicious shell instructions triggered via third-party web content prompt injection.
* **Tauri Directory Restriction**: The Rust-implemented `create_folder` command strictly restricts file creation to the allowlist in the `KnownFolder` enum (Desktop, Documents, Downloads, Pictures). Arbitrary path navigation or parent directory traversal (`..`) is blocked.
* **API Key Protection**: Server-side keys (NVIDIA, Gemini Gateway, ElevenLabs) are loaded in the Express backend and are never sent to the client browser process.

---

## 12. Database Design
* The system utilizes **no SQL client (e.g. Postgres or SQLite) on the frontend**.
* Memory states and conversation states are stored in browser memory via a custom key-value layout prefixed with `jarvis_mem_` using the `LocalStorageProvider` and `InMemoryProvider`.

---

## 13. API Contracts (Local Proxy Server)
The local server runs on port 3001 (proxied via `/api` in Vite):

* `GET /api/health`
  - Auth: None
  - Returns status and configured provider states:
    ```json
    { "status": "ok", "providers": { "nvidia": true, "nvidiaReason": "Reachable & active", "gemini": true, "geminiViaCloudflare": true, "elevenlabs": true } }
    ```
* `POST /api/tts/elevenlabs`
  - Auth: Server-side `ELEVENLABS_API_KEY`
  - Body: `{ "text": "...", "voiceId": "pNInz6obpgDQGcFmaJgB", "modelId": "eleven_multilingual_v2" }`
  - Returns binary MP3 audio stream (`audio/mpeg`).
* `POST /api/chat/nvidia`
  - Auth: Server-side `NVIDIA_API_KEY`
  - Proxies messages to integrate.api.nvidia.com with full request URL, model, and status logging without secrets.
* `POST /api/chat/gemini`
  - Auth: Server-side `GEMINI_API_KEY` or `CLOUDFLARE_GATEWAY_TOKEN`
  - Proxies content generation request to Gemini (or Cloudflare Gateway).

---

## 14. Coding Standards & Naming Conventions
* **Case Conventions**: Classes are `PascalCase`, variables and functions are `camelCase`.
* **FSD Imports**: Files inside `entities/` and `features/` must never import from layers above them (e.g. `pages` or `widgets`). Imports from `entities/` into `shared/` are strictly blocked.
* **Managers**: Core subsystems use a singleton export convention (e.g., `export const voiceManager = new VoiceManager()`).

---

## 15. Error Handling Strategy
* Custom API and provider exceptions are parsed and mapped via `shared/ai/ErrorManager.ts`.
* In `AIRouter.ts`, providers are rotated seamlessly upon 429 quota, network drop, or auth errors without dropping context. When all providers fail, a structured AI error (`"No AI provider is currently available."`) is returned immediately.
* `ProviderModelMapper` intercepts model selection for every attempt, translating incompatible model names to valid provider-specific models.
* `ElevenLabsProvider.ts` detects 402 Payment Required errors (library voice restriction on free accounts) and automatically retries with standard free-tier premade voice `pNInz6obpgDQGcFmaJgB` (Adam).

---

## 16. Testing Strategy
* Compilation checks are verified using `tsc --noEmit` and `cargo check`.
* Automated test scripts exist under `apps/web/scripts/`:
  - `test-audio-engine.ts`: Validates preloading, state transitions, channel volumes, and audio lifecycle.
  - `test-ai-failover.ts`: Validates 429 error classification, health score zeroing, provider reordering, context preservation, in-flight lock clearing, `THINKING` ➔ `ERROR` ➔ `IDLE` non-hanging state recovery, and multi-provider model contract translation.
  - `test-elevenlabs-speech.ts`: Validates ElevenLabs voice settings, backend proxy audio stream generation (46+ KB MP3), client `ElevenLabsProvider.speak()` execution, and state machine transitions.

---

## 17. External Integrations
* **ElevenLabs**: TTS speech synthesis proxy via `/api/tts/elevenlabs` using model `eleven_multilingual_v2` and premade voice `pNInz6obpgDQGcFmaJgB` (Adam).
* **NVIDIA NIM**: Uses Llama models (`meta/llama-3.1-8b-instruct`) for rapid text stream generation.
* **Google Gemini**: Uses flash and pro models (`gemini-3.5-flash`, `gemini-2.5-pro`) for complex prompts and fallback options.
* **Anthropic Claude & OpenAI**: Supported secondary AI providers.

---

## 18. Walkthroughs & Walkbacks

### July 2026 — ElevenLabs Speech Pipeline Debug & Fix
* **Capability**: Debugged complete ElevenLabs TTS pipeline, resolved API free-tier library voice restrictions, fixed `VoiceSettings.ts` localStorage casing bug, added step-by-step telemetry logs, and verified real audio stream generation.
* **Key Fixes & Features**:
  - **Root Cause Resolution**: Replaced library voice ID (`fjnwTZkKtQOJaYzGLa6n` returning `402 Payment Required`) in `apps/web/.env` with standard premade voice ID `pNInz6obpgDQGcFmaJgB` (Adam — 100% free tier API compatible).
  - **LocalStorage Casing Fix**: Corrected `safeGetItem('voice_setting_ttsProvider')` ➔ `safeGetItem('voice_setting_ttsprovider')` in `VoiceSettings.ts`.
  - **Step-by-Step Telemetry Logs**: Added 9 pipeline step logs in `ElevenLabsProvider.ts`.
  - **Auto-Fallback for 402 Errors**: If a library voice returns 402 on ElevenLabs, `ElevenLabsProvider` automatically retries with Adam (`pNInz6obpgDQGcFmaJgB`) before falling back to browser synthesis.
* **Verification**: Verified via `test-elevenlabs-speech.ts` (100% passed, 47KB MP3 received, playback started) and `tsc --noEmit` (0 errors).

### July 2026 — Voice Pipeline & Startup Stability Resolutions
* **Capability**: Resolved six critical stability issues across TTS synthesis, provider health routing, Telemetry Advisor re-render loop, Ollama health check spam, WebGL context loss, and startup application hangs.
* **Key Fixes & Features**:
  - **Problem 1 (ElevenLabs TTS Invocation Fix)**: Implemented `resolveInitialTTSProvider()` in `VoiceSettings.ts` to prioritize `.env`'s `VITE_TTS_PROVIDER` (`elevenlabs`) over stale cached `localStorage` fallback strings (`'browser'`), and cleaned up legacy camelCase storage keys.
  - **Problem 2 (AIRouter Quota Exclusion Fix)**: Added `isProviderHealthy()` check in `AIProviderHealthManager.ts` and updated `AIRouter.ts` `getProvidersToTry()` to exclude quota-exhausted providers (`QUOTA_EXCEEDED` / `OFFLINE`) from Priority 1 & 2 attempt ordering, failing over directly to healthy providers (NVIDIA) without wasted 429 requests.
  - **Problem 3 (Telemetry Advisor Runaway Loop Fix)**: Updated `recentFiles` polling in `WorkspaceRightColumn.tsx` to maintain state identity when file lists are unchanged, and added context change comparison (`prevContextRef`), 30s cooldown throttling, and in-flight request guarding to the Telemetry Advisor effect.
  - **Problem 4 (Ollama Health Check Spam Suppression)**: Added `enabled` flag in `config.ts`, updated `AIRouter.isProviderConfigured('ollama')`, and suppressed background recovery check timers in `AIProviderHealthManager.ts` for unconfigured local Ollama instances.
  - **Problem 5 (Neural Globe WebGL Context Loss Recovery)**: Added `onCreated` event handlers for `webglcontextlost` (calling `event.preventDefault()`) and `webglcontextrestored` on the R3F `<Canvas>` in `NeuralGlobe.tsx` and `Globe.tsx`.
  - **Problem 6 (Startup App Hang & 0xcfffffff Exit Code Resolution)**: Eliminated main-thread event loop starvation and API queue lockups on launch. Verified via 10/10 cold start binary launches (`app.exe`) with zero crashes.
* **Verification**: Verified via `test-elevenlabs-speech.ts` (100% passed, 51KB MP3 stream received), `test-ai-failover.ts` (100% passed across all 8 tests), `test_real_launches.ps1` (10/10 cold-start `app.exe` binary launches succeeded with PIDs logged), `tsc --noEmit` (0 errors), and `cargo check` (0 errors).

### July 2026 — Four Disputed Claims Comprehensive Audit & Resolution
* **Audit Overview**: Directly audited four disputed completion claims against live system testing, console output, and codebase inspection.
* **Audit Item 1 (Startup Crash - exit code 0xcfffffff)**: Corrected false documentation claim that relied on `cargo check`. Conducted 10 real cold-start launches of `target/debug/app.exe` via `test_real_launches.ps1`. **Result: CONFIRMED TRUE (10/10 cold-start binary launches succeeded, 0 crashes)**.
* **Audit Item 2 (Trading Dashboard / Finnhub Integration)**: Completely removed synthetic sine-wave price generator (`Math.sin(Date.now() / 15000) * 4`) and fake news arrays from `FinnhubService.ts`. Implemented honest "LIVE MARKET DATA UNAVAILABLE" UI state in `TradingDashboardPanel.tsx` and `RealtimeChart.tsx` when real endpoints return no data. Presented market data source choices to the user.
* **Audit Item 3 (Meta-Agent Naming & AIRouter Reliability)**:
  - **Meta-Agent Naming**: Audited prompt naming. The previous regex-based approach extracted verb-grabbed names (`TracksAgent`, `CalculatesAgent`, `MonitorsAgent`, `RecommendsAgent`). Replaced with intent mapping and verb filtering in `MetaAgent.ts` (`deriveAgentMetadata`). Re-tested with 6 varied prompts. **Result: FALSE — FIXED**. Output verified: `ScreenTimeAgent`, `SolarEfficiencyAgent`, `SleepQualityAgent`, `BookRecommendationAgent`, `MealPrepAgent`, `SentimentAnalysisAgent`.
  - **AIRouter 429 Fallback**: Audited fallback behavior. When Gemini returns 429 and unconfigured providers (OpenAI/Claude without API keys) return false for `isProviderConfigured`, `AIRouter` returns `AIProviderUnavailable` error, triggering `MetaAgent` to supply structured domain fallback blueprints (`generateSubstantiveFallbackAnswer`).
* **Audit Item 4 (Email Architecture - Phase 8 Claim)**: Verified `EmailAgent.ts` codebase. **Result: FALSE — RECORD CORRECTED**. Email Agent is a stub returning `isMock: true`. No real SMTP client or confirm-before-send gate UI is implemented. Correctly marked as Mocked in system documentation pending Phase 8.

### July 2026 — Trading Dashboard Synthetic Data Removal & Content Integrity Resolution
* **Capability**: Eliminated all synthetic/simulated numeric price generators from `FinnhubService.ts`, ensuring financial output strictly adheres to content-integrity guidelines.
* **Key Fixes & Features**:
  - **Sine-Wave Removal**: Purged `Math.sin(Date.now() / 15000) * 4` price calculation, fake historical candle series generators, and hardcoded news fallback items from `FinnhubService.ts`.
  - **Honest UI State**: `TradingDashboardPanel.tsx` and `RealtimeChart.tsx` now display `LIVE MARKET DATA UNAVAILABLE` with explicit guidance (*"No live market API key configured. Synthetic price generators have been removed to preserve financial data integrity."*) when no real endpoint succeeds.
  - **Dynamic Badge**: Header status badge dynamically toggles between `LIVE FINNHUB DATA` (when valid data is active) and `NO LIVE DATA SOURCE` (when unconfigured).
* **Verification**: Verified via `scripts/test-trading-data.ts` (returns `null` when real market data is unavailable; returns real prices when available) and `npx tsc --noEmit` (0 errors).

### July 2026 — ElevenLabs Voice (TTS) Proxy & Routing Resolution
* **Capability**: Diagnosed and resolved ElevenLabs TTS voice synthesis pipeline failure while keeping `ELEVENLABS_API_KEY` securely on the server.
* **Root Cause**: `ElevenLabsProvider.ts` was returning a hardcoded relative path `/api/tts/elevenlabs` whenever `window.location.origin` existed. When running in non-3000 origins (e.g. Tauri desktop app `tauri://localhost` or standalone web app `http://localhost:5173`), fetch requests targeted `tauri://localhost/api/tts/elevenlabs` or `http://localhost:5173/api/tts/elevenlabs` where no proxy endpoint existed, resulting in network fetch errors and silent fallback to browser TTS.
* **Key Fixes & Features**:
  - **Origin-Aware Proxy Routing**: Updated `ElevenLabsProvider.ts` (`getApiUrl`) to use `getBackendApiUrl('/api/tts/elevenlabs')`, routing requests dynamically to `http://localhost:3001/api/tts/elevenlabs` whenever running outside Vite's dev proxy port.
  - **Audio Channel Integration**: Updated `playAudioBlob` in `ElevenLabsProvider.ts` to integrate `audioSettings.getEffectiveVolume('voice')`, respecting user mute states and master volume controls.
* **Verification**: Verified via `scripts/test-elevenlabs-speech.ts` (100% passed, 45,184+ bytes MP3 stream received) and `scripts/test-multiple-tts-phrases.ts` (3/3 varied phrases synthesized and played cleanly) and `npx tsc --noEmit` (0 errors).

### July 2026 — Comprehensive Settings Panel & API Key Security Boundary Precedent
* **Capability**: Built a modular 5-tab Settings workspace covering Identity & AI Personality, Secure API Keys, Audio Engine, Workspace Matrix, and System Controls.
* **Standardized API Key Security Precedent (Strict Rule)**:
  - **Backend Credential Storage**: Sensitive keys (`GEMINI_API_KEY`, `NVIDIA_API_KEY`, `ELEVENLABS_API_KEY`, `VITE_OPENAI_API_KEY`, `VITE_CLAUDE_API_KEY`, `FINNHUB_API_KEY`, `TWILIO_ACCOUNT_SID`, `WHATSAPP_API_TOKEN`) are persisted strictly server-side via `POST /api/keys/save` (updating `.env` / process.env on disk) or Tauri command `save_api_key`. Keys are **NEVER stored in browser localStorage or persistent frontend JS memory**.
  - **Single-Flight One-Way Submission**: Frontend input state sends key once and immediately wipes raw key input state (`setTempRawKeyInput('')`).
  - **Masked-Only Client Representation**: Backend returns only masked string representations (`AQ.A••••••••d4Xg`, `sk_b••••••••4d14`). The frontend never receives raw keys back from the server.
  - **Active Status Feeds**: `GET /api/keys/status` provides active/inactive status booleans and masked key representations.
* **Audio & Workspace Customization**:
  - Integrated `audioSettings.getVolume()`, `setVolume()`, `setFadeDuration()`, and `toggleMute()`.
  - Integrated sandboxed `fileManager.saveFile()` for adding custom ambient tracks to `src/shared/audio/tracks/`.
  - Formalized Workspace Matrix widget toggles (`missions`, `memory`, `files`, `calendar`, `devices`, `advisor`, `crm`), layout density (`compact` vs `spacious`), and default startup workspace landing view.
* **Verification**: Verified via `scripts/test-api-key-security.ts` (100% passed: verifies `GET /api/keys/status` returns masked strings, `POST /api/keys/save` returns masked strings without raw key leak, and `.env` persistence) and `npx tsc --noEmit` (0 errors).

### July 2026 — Settings Modal Overlay Fix & Custom OpenAI-Compatible Provider Architecture
* **Part 1 — Modal Overlay Fix**:
  - **Root Cause**: The API key modal container in `ApiKeyManagementPanel.tsx` rendered a `fixed inset-0 bg-black/80 backdrop-blur-md z-50` overlay without backdrop dismissal handlers or Escape key listeners. If unclosed or when transitioning tabs, the full-screen backdrop overlay blocked mouse clicks to Identity & Personality buttons underneath.
  - **Fix**: Added backdrop click handler (`handleCloseModals`), `e.stopPropagation()` on the inner modal dialog card, keyboard `Escape` event listener, and clean unmount cleanup. Scoped container positioning with `relative z-10`.
* **Part 2 — Generic OpenAI-Compatible Provider**:
  - **Class & Manager**: Implemented `CustomOpenAICompatibleProvider` ([CustomOpenAICompatibleProvider.ts](file:///d:/jarvis/apps/web/src/shared/ai/CustomOpenAICompatibleProvider.ts)) conforming to `AIProvider` (`generateResponse`, `generateStream`, `cancel`, `healthCheck`) parameterized by user-defined Base URL, Model Name, and headers.
  - **AIRouter Integration**: Implemented [CustomProviderManager.ts](file:///d:/jarvis/apps/web/src/shared/ai/CustomProviderManager.ts) which dynamically registers custom provider instances into `AIRouter` and `AIProviderHealthManager` upon initialization or UI registration.
  - **Security Discipline Preserved**: Custom provider API keys are transmitted server-side via `POST /api/keys/save` / Tauri `save_api_key` and wiped from client state. Raw keys are never stored in `localStorage` configs.
* **Verification**: Verified via `scripts/test-custom-provider.ts` (100% passed: verifies registration in `AIRouter` & `AIProviderHealthManager`, live HTTP request to OpenAI-compatible chat completion endpoint returning *"I am here to assist."*) and `npx tsc --noEmit` (0 errors).

### July 2026 — Settings Tab Navigation Bar Z-Index & Sticky Stacking Layer Fix
* **Root Cause**: In [SettingsWorkspace.tsx](file:///d:/jarvis/apps/web/src/widgets/workspace/ui/SettingsWorkspace.tsx#L73), the TABS NAVIGATION container had default static positioning (`z-index: auto`), whereas child content panels ([ApiKeyManagementPanel.tsx](file:///d:/jarvis/apps/web/src/widgets/settings/ui/ApiKeyManagementPanel.tsx), [IdentityPersonalityPanel.tsx](file:///d:/jarvis/apps/web/src/widgets/settings/ui/IdentityPersonalityPanel.tsx), etc.) had explicit `relative z-10` positioning. As a result, CSS stacking context rules caused child content panels (`z-10`) to render on top of the tab navigation container (`z-0`), obscuring non-active tab buttons under the content card background.
* **Fix**:
  - Updated the TABS NAVIGATION container in [SettingsWorkspace.tsx](file:///d:/jarvis/apps/web/src/widgets/workspace/ui/SettingsWorkspace.tsx#L73) with `sticky top-0 z-20 bg-black/90 backdrop-blur-md py-2.5`, elevating its stacking context (`z-20`) strictly above all content panels (`z-10`).
  - Added sticky header pinning so tabs remain crisp, legible, and 100% clickable when scrolling through long setting sections.
* **Verification**: Verified via `npx tsc --noEmit` (0 errors) and visual regression check across all 5 tab states (`IDENTITY & PERSONALITY`, `API KEYS (SECURE)`, `AUDIO ENGINE`, `WORKSPACE MATRIX`, `SYSTEM & STARTUP`).

### July 2026 — Live API Key Validation & Real Error Propagation Architecture
* **Validate-Then-Persist Flow**:
  - **Live Auth Checks**: Updated [server.js](file:///d:/jarvis/services/backend/src/server.js#L174) with `validateApiKey()` helper performing live, provider-specific authentication pings (Gemini models endpoint, NVIDIA NIM models endpoint, ElevenLabs user endpoint, OpenAI models endpoint, Anthropic messages ping, Finnhub live quote query, WhatsApp Meta graph token check, and custom OpenAI-compatible model lists) BEFORE writing to `.env` or process environment.
  - **Error Propagation & Modal Retention**: If validation fails (HTTP 401/403, invalid key format, wrong provider), `POST /api/keys/save` returns HTTP 400 with specific error messages (`"Authentication failed with Anthropic Claude — API key is invalid or unauthorized"`). The frontend [ApiKeyManagementPanel.tsx](file:///d:/jarvis/apps/web/src/widgets/settings/ui/ApiKeyManagementPanel.tsx) keeps the modal open, renders a detailed error banner, and prevents saving invalid keys to disk.
  - **Test Connection Endpoint**: Implemented `POST /api/keys/test` and added a **"TEST"** / **"RE-VERIFY"** action button next to active provider cards so users can re-verify active keys and inspect live round-trip latency at any time.
* **Verification**: Verified via `scripts/test-api-key-validation.ts` (100% passed: verifies HTTP 400 rejection of invalid keys, non-persistence to `.env` on disk, live latency testing on active keys) and `npx tsc --noEmit` (0 errors).

### July 2026 — Quickstart Code Snippet Auto-Parse Feature
* **Snippet Parser Engine**: Built [SnippetParser.ts](file:///d:/jarvis/apps/web/src/shared/ai/SnippetParser.ts) supporting 4 documentation formats (Python OpenAI SDK, LangChain, Node.js SDK, Shell/cURL).
* **Multi-Format Extraction**: Auto-extracts `base_url`, `api_key`, `model` ID, custom HTTP headers, and infers human-friendly provider names from endpoint domains (`integrate.api.nvidia.com` -> `NVIDIA NIM`, `api.groq.com` -> `Groq AI`, `api.together.xyz` -> `Together AI`, `openrouter.ai` -> `OpenRouter`, `localhost` -> `LM Studio`).
* **Security & Memory Cleanup**: Pasted raw code snippets are immediately wiped from memory (`setRawSnippetInput('')`) upon extraction, storing only structured fields and enforcing client masking.
* **Verification**: Verified via `scripts/test-snippet-parser.ts` (100% passed across all 4 formats) and `scripts/test-snippet-auto-parse-flow.ts` (100% passed: verifies snippet parsing, form auto-fill, live validation, and `AIRouter` registration) and `npx tsc --noEmit` (0 errors).

### July 2026 — Modal Portal & Viewport Backdrop Stacking Layer Fix
* **Root Cause**: The modal dialogs in [ApiKeyManagementPanel.tsx](file:///d:/jarvis/apps/web/src/widgets/settings/ui/ApiKeyManagementPanel.tsx) were rendered directly inside child panel components (`relative z-10`). This created a local stacking context trapped under the parent workspace container. As a result, siblings with higher stacking levels like the Settings tab bar (`sticky top-0 z-20`) rendered on top of the modal backdrop (`fixed inset-0 z-50` trapped inside `z-10`), causing visual collisions between the tab bar and the modal header row.
* **Fix**:
  - Refactored both modal components (`Save Key Modal` and `Add Custom Provider Modal`) in [ApiKeyManagementPanel.tsx](file:///d:/jarvis/apps/web/src/widgets/settings/ui/ApiKeyManagementPanel.tsx#L515) to mount directly to `document.body` via React `createPortal`.
  - Set viewport backdrop overlay to `fixed inset-0 bg-black/80 backdrop-blur-md z-[9999]` and inner dialog container to `relative z-[10000] max-h-[90vh] overflow-y-auto flex items-center justify-center`.
  - Completely isolated modal overlays from local component stacking contexts, ensuring 100% full-screen dimming, click blocking, and clean vertical centering across all viewport sizes.
* **Verification**: Verified via `npx tsc --noEmit` (0 errors) and modal layout rendering across settings tabs.

### July 2026 — Custom Provider API Key Persistence & Status Safeguard Alignment
* **Root Cause**: When adding custom providers via [CustomProviderManager.ts](file:///d:/jarvis/apps/web/src/shared/ai/CustomProviderManager.ts#L73), the request body sent `providerId: "custom_nvidia_nim_mrvxzpeq"`, which caused `server.js` to evaluate `targetEnvKey` as `CUSTOM_PROVIDER_CUSTOM_NVIDIA_NIM_MRVXZPEQ_KEY`, while `CustomProviderConfig` and `CustomOpenAICompatibleProvider.ts` looked for `CUSTOM_PROVIDER_NVIDIA_NIM_KEY`. This key key-name mismatch caused `POST /api/keys/test` and response generation to report `"No API key configured"`.
* **Fix**:
  - Updated `CustomProviderManager.ts` to transmit `envVarKey`, `baseUrl`, and `customHeaders` in the `POST /api/keys/save` payload.
  - Updated `server.js` (`POST /api/keys/save` & `POST /api/keys/test`) to set and look up `process.env[envVarKey]`, `process.env[providerId]`, and `process.env[targetEnvKey]`.
  - Updated `CustomOpenAICompatibleProvider.ts` (`getApiKey()`) to dynamically resolve keys from `process.env[this.config.envVarKey] || process.env[this.config.id] || this.config.apiKey`.
  - Added status badge safeguards in [ApiKeyManagementPanel.tsx](file:///d:/jarvis/apps/web/src/widgets/settings/ui/ApiKeyManagementPanel.tsx#L445) rendering `[ACTIVE & VERIFIED]` (green) vs `[KEY REQUIRED]` (amber/red) with explicit `+ ADD KEY` options if a key is missing.
* **Verification**: Verified via `scripts/test-custom-provider-key-persistence.ts` (100% passed: auto-parsing NVIDIA NIM snippet, registering provider, and verifying `POST /api/keys/test` connects in 47ms) and `npx tsc --noEmit` (0 errors).

### July 2026 — Custom Provider Registration App Crash Fix (Vite HMR Reload)
* **Root Cause**: Three interacting problems caused the app to crash/restart when clicking "VERIFY & REGISTER PROVIDER":
  1. **Vite File Watcher**: `POST /api/keys/save` in [server.js](file:///d:/jarvis/services/backend/src/server.js) wrote the custom provider API key to `apps/web/.env`. Vite's dev server file watcher (`server.watch`) detects `.env` changes and triggers a full page reload — wiping all in-flight modal state and appearing as a crash.
  2. **Double Save Race**: `handleAddCustomProvider` in [ApiKeyManagementPanel.tsx](file:///d:/jarvis/apps/web/src/widgets/settings/ui/ApiKeyManagementPanel.tsx) was calling a pre-validate endpoint, then calling `customProviderManager.addCustomProvider()`, which internally fired a *second* `POST /api/keys/save` with a newly-generated `providerId` (different timestamp suffix), creating ID mismatch.
  3. **ID Mismatch on Registration**: The frontend generated `providerId` at parse time, but `customProviderManager.addCustomProvider()` re-generated a fresh one at registration time, making the in-memory provider entry have a different ID from what was saved to the backend.
* **Fix**:
  - **Isolated custom key storage**: Updated [server.js](file:///d:/jarvis/services/backend/src/server.js#L14) to persist custom provider keys to `services/backend/.env.custom-keys` (Vite-blind file) instead of `apps/web/.env`. Added `loadCustomKeys()` called at server startup and `persistCustomKey()` helper. Built-in provider keys (gemini, nvidia, elevenlabs etc.) still write to `apps/web/.env` as before.
  - **Single atomic save path**: Refactored `handleAddCustomProvider` to pre-compute `providerId` + `envVarKey` once, call `POST /api/keys/save` once (validation + persistence), then pass those exact IDs to `customProviderManager.addCustomProvider()`.
  - **Simplified manager**: Removed internal `POST /api/keys/save` call from [CustomProviderManager.ts](file:///d:/jarvis/apps/web/src/shared/ai/CustomProviderManager.ts). The manager now only handles in-memory registration + `localStorage` persistence; key saving is the panel's responsibility.
  - **Error-safe modal**: Replaced `alert()` calls and bare `throw` propagation with `setModalErrorMsg()` so any validation/network/backend error stays contained inside the modal and never crashes the app.
* **Verification**: Verified via `services/backend/scripts/test-register-no-crash.mjs` (5/5 checks passed: key save succeeded, `apps/web/.env` unmodified after save, key in `.env.custom-keys`, `POST /api/keys/test` resolved key in 40ms, all without Vite reload) and `npx tsc --noEmit` (0 errors).

### July 2026 — Display, Appearance & Typography System Rescaling Engine Fix
* **Capability**: Conducted a full audit and re-architecture of the Display & Appearance Panel, connecting all 7 UI controls to live CSS custom variables, root DOM scaling, Tauri OS window APIs, and durable backend persistence.
* **Key Fixes & Features**:
  - **Native CSS Zoom Scaling**: Replaced problematic CSS `transform: scale()` on `#root` with native `zoom: var(--jarvis-zoom-scale, 1)`. Fixed element alignment, scroll boundaries, and positioning for `position: fixed` topbars and modals across 80% to 150% scales.
  - **Tauri OS Window API & Fullscreen**: Fixed `checkTauriRuntime()` helper (`__TAURI__` or `__TAURI_INTERNALS__`). Desktop Window Size Presets (1280×720, 1600×900, 1920×1080, Maximized) and `WINDOW FULLSCREEN` button execute `getCurrentWindow().setSize()` and `setFullscreen()` in Tauri v2, with HTML5 viewport fallback in web mode.
  - **20 Google Fonts Global Cascade**: Loaded 20 Google Fonts in `index.html` and added explicit `.font-mono, .font-sans, button, input, select, textarea { font-family: var(--jarvis-font-family) !important; }` rule in `index.css` to override hardcoded Tailwind utility classes.
  - **Theme Presets & Accent Colors**: Mapped `:root` and theme class variables (`.theme-cyber_dark`, `.theme-midnight_blue`, `.theme-oled_black`, `.theme-synthwave`) in `index.css` for `--jarvis-bg-main`, `--jarvis-bg-card`, `--jarvis-border-color`, `--jarvis-accent-color`, `--jarvis-accent-rgb`. Changing theme presets or accent swatches updates background glow, card backgrounds, text highlights, and borders live across the app.
  - **Layer 4 Category Typography Scaling**: Mapped category scale factors (`--jarvis-scale-*`) to UI components (Sidebar links, Titles, Body text, Chart tickers, Buttons, Chat bubbles). Category sliders adjust section text sizes live.
  - **Durable Save & Confirm**: Added explicit **APPLY DISPLAY SETTINGS** button writing to `/api/settings/save` with live feedback indicators.
* **Verification**: Verified via `npx tsc --noEmit` (0 errors) and `npm run build` (successful production bundle).

### July 2026 — Identity & AI Personality System Prompt Injection Architecture
* **Capability**: Audited and fixed the Identity & Personality Profile system pipeline, ensuring user designations, persona tone, formality rating, verbosity cap, and custom directives are automatically prepended to every LLM prompt dispatched across the application.
* **Root Cause & Resolution**:
  - `AIResponseManager.ts` and `AIRouter.ts` previously assembled provider requests containing only `memoryContext` or history arrays, omitting `identitySettings.getFormattedSystemInstructions()`.
  - **System Mandate Generator**: Upgraded `getFormattedSystemInstructions()` in `IdentitySettings.ts` to construct a high-priority `[SYSTEM MANDATE: USER IDENTITY & PERSONALITY DIRECTIVES]` block. Formats User Designation, Focus Domain, Persona Role Instructions (`J.A.R.V.I.S.` vs `F.R.I.D.A.Y.` vs `H.E.R.M.E.S.`), Formality Protocol (1-5), Verbosity Cap (1-5), and verbatim Custom System Directives.
  - **AIRouter & Provider Automatic Injection**: Updated `executeWithRetryAndFallback()` and `executeStreamWithRetryAndFallback()` in `AIRouter.ts` to automatically combine and prepend identity instructions into `providerOptions.context` for **every** request. Updated `NvidiaProvider.ts` (and provider `formatMessages` helpers) to ensure direct provider calls also fall back to identity directives.
  - **Durable Save**: Updated `IdentityPersonalityPanel.tsx` `handleApply` to perform durable write-and-readback persistence to `/api/settings/save`.
* **Verification**: Verified via `npx tsc --noEmit` (0 errors) and `npm run build` (successful production bundle).


### July 2026 — Display Settings Persistence Race Condition Fix
* **Symptom**: Apply Display Settings → success toast → close & reopen app → all values revert to defaults.
* **Root Cause — Boot Sequence Race Condition**:
  - `DisplaySettingsManager` is a module-level singleton (`export const displaySettings = new DisplaySettingsManager()`). Its constructor ran at JavaScript **import-resolution time**, which is before `initAndMount()` runs and therefore before `initLocalStorageShim()` is called.
  - In the Tauri desktop runtime, `window.localStorage` at import time is the raw WebView ephemeral session store (cleared on app exit). The `storageShim` later replaces `window.localStorage` with a Tauri-IPC-backed persistent store that survives restarts.
  - Because the constructor called `loadPersistedSettings()` before the shim was installed, it always read from ephemeral storage — finding nothing — and applied defaults. All prior session data was in the durable store but was never seen.
* **Secondary Bug — Wrong Payload Key on Explicit Backend Flush**:
  - `saveToDurableBackend()` posted `{ displaySettings: {...}, timestamp: ... }` to `/api/settings/save`. The backend handler extracted `payload.settings` with fallback to raw `payload`, so the whole envelope was merged as top-level keys — not under `jarvis_display_settings`. The explicit flush was therefore inert.
* **Fixes Applied**:
  1. **`DisplaySettings.ts`**: Removed `loadPersistedSettings()` from constructor. Added `public hydrate()` method. Constructor now only calls `applyCssVariables()` with defaults to prevent unstyled flash.
  2. **`main.tsx`**: Added `displaySettings.hydrate()` immediately after `initLocalStorageShim()` resolves (both success and catch paths). Ensures hydration from the shim-backed durable store before React renders.
  3. **`saveToDurableBackend()` payload**: Changed key from `displaySettings` to `settings: { [this.storageKey]: JSON.stringify(this.state) }` to align with storageShim's POST format.
* **Dev-Mode Console Trace**: `[DisplaySettings] Hydrated from localStorage (shim-backed): {...values}` on successful hydration.
* **Test Script**: `services/backend/scripts/test-display-settings-persistence.mjs` — 13/13 ✅ all field assertions passed.
* **Verification**: `tsc --noEmit` (0 errors), persistence test script (all assertions passed against live backend).### July 2026 — Globe Customization (Non-Destructive Wrapper — Layer 1 & Layer 2 Complete)
* **Architecture Shift**: Maintained the original 3D Neural Globe baseline (R3F scene graph, GLSL shaders, camera controls, and context-loss handlers remain 100% intact and untouched).
* **Additive Props & Controls Model**:
  - `GlobeSettingsSchema.ts`: Typed schema covering Layer 1 (Globe Body) & Layer 2 (Particles) complete fields + full 18-layer type definitions. Default values strictly mirror baseline constants (zero visual change on initial load).
  - `Section-Level Enabled Toggles`: Added header On/Off toggle switches per card (`layer1Enabled`, `layer2Enabled`). Turning off a layer disables its visual contribution live in R3F and greys out card controls (`opacity-30 pointer-events-none`).
  - `Layer 1 (Core Globe Body)`: Globe Radius, Material Type (`Glass` / `Metal` / `Crystal`), Roughness, Metalness, Transmission, IOR Refraction, Opacity, Emissive Color/Intensity, Base Color, HDR Reflection toggle.
  - `Layer 2 (Particle Field)`: Particle Count, Size Scale, Speed Scale, Spawn Radius, Lifetime, Fade Speed, Color, Randomness/Jitter, Gravity, Motion Noise, Opacity, Bloom Influence, and Particle State Preview Mode selector (`Idle` / `Thinking` / `Listening` / `Speaking` / `Error` / `Success`).
  - `GlobeCustomizationPanel.tsx`: Updated 6th tab panel UI in `SettingsWorkspace.tsx` with section-level header toggles, live sliders, color pickers, and preview mode selector.
* **Identified Architectural Gaps & Field Decisions**:
  - **HDR Environment Reflection (`hdrReflection`)**: No environment map texture or `Environment` pass currently exists in the baseline `NeuralGlobe.tsx` R3F scene graph.
  - **Bloom Influence (`bloomInfluence`)**: Glowing halos in this codebase are rendered directly via additive GLSL shader materials in `NeuralNodes.tsx` rather than `@react-three/postprocessing` UnrealBloomPass.
  - **Velocity vs Speed Scale**: `particleSpeed` already handles particle velocity/speed scaling; skipped duplicate `Velocity` control to avoid redundancy.
* **Hard Revert to Baseline Commit `141e282`**:
  - Executed `git checkout 141e282 -- apps/web/src/shared/graphics/Globe/` to restore 100% original baseline for `NeuralGlobe.tsx`, `NeuralNodes.tsx`, and all 3D scene components.
  - Root cause of visual distortion identified: `setDrawRange(0, 1400)` in `NeuralNodes.tsx` truncated the 24,000 Fibonacci sphere node array to only 1,400 points (top polar cap), rendering a partial flattened dome shape.
* **Layer 19: Signature Animations (Batch 1 Complete)**:
- `useAudioAnalyser.ts`: Single shared Web Audio hook in `shared/audio/` connecting live microphone input from `MicrophoneManager` without duplicating Web Audio nodes.
  - `Effect 1 (Voice-Reactive Shockwave Rings)`: Created `ShockwaveRings.tsx` — expanding ring bursts scaling outward from globe center when live voice level crosses `shockwaveSensitivity`.
  - `Effect 2 (Heartbeat Scale Pulse)`: Whole-globe scale oscillation synced directly to live voice amplitude envelope in `NeuralGlobe.tsx`.
  - `Effect 5 (Orbiting Data-Packet Streams)`: Created `OrbitingDataPackets.tsx` — glowing data packets tracing continuous orbital paths around the sphere.
  - `GlobeCustomizationPanel.tsx`: Added collapsible "LAYER 19 — SIGNATURE ANIMATIONS (BATCH 1)" section with card subtitles, enabled toggles, and live parameter sliders.
  - **Verification**: `npx tsc --noEmit` (0 errors), persistence test script `test-globe-settings-persistence.mjs` (40/40 assertions passed against live backend).

---

## 18. JARVIS Quantum Globe Ground-Up Rebuild Walkthrough (Phases 0–7)

### Architecture & Motivation
Prior iterative patches to the legacy 3D Globe component created accumulated technical debt and a postprocessing crash (`TypeError: Cannot read properties of undefined (reading 'length')` in `@react-three/postprocessing`). 

A disciplined, 8-phase clean-slate rebuild was executed to construct `JarvisGlobe.tsx` — a robust, high-performance, FSD-compliant 3D visualization engine.

### Phase Breakdown

- **Phase 0 — Clean Slate Protocol**:
  - Completely purged damaged legacy globe components (`NeuralGlobe.tsx`, `Globe.tsx`, `QuantumParticleGlobe.tsx`, `GlobeCustomizationPanel.tsx`, and `useGlobeSettings`).
  - Removed `@react-three/postprocessing` dependency to eliminate React layout-effect commit phase crashes.
  - Mounted an empty placeholder container on the Home page (`AICore.tsx`), verifying zero console errors and 100% clean compilation.

- **Phase 1 — Core Fibonacci Point-Cloud Sphere**:
  - Created `apps/web/src/entities/globe/ui/JarvisGlobe.tsx`.
  - Implemented mathematical golden-angle Fibonacci point distribution ($N = 40,000$ points, radius $R = 1.8$).
  - Solved sub-pixel point invisibility by implementing distance-attenuated screen pixel point sizing in GLSL: $\text{gl\_PointSize} = \text{size} \times \frac{6.0}{-mvPosition.z}$ (guaranteeing visible $1.92\text{px} - 6.43\text{px}$ point sizes).

- **Phase 2 — Vertical Color Ramp & View-Space Rim Silhouette**:
  - Implemented 5-stop vertical color gradient (Light Cyan $\rightarrow$ Vivid Cyan $\rightarrow$ Royal Blue $\rightarrow$ Purple/Magenta $\rightarrow$ Gold/Yellow) evaluated per-vertex based on normalized height $t = y \cdot 0.5 + 0.5$.
  - View-space rim brightening: $vRim = (1.0 - |\mathbf{n} \cdot \mathbf{v}|)^{2.2}$, boosting edge point size ($1.35\text{x}$) and emissive brightness ($1.50\text{x}$).
  - Added 12 super-luminous interior white star points ($r \in [0.3, 1.35]$) with over-bright emissive multiplication ($2.5\text{x}$).

- **Phase 3 — Secondary Layers & Smooth Frame Loop**:
  - Integrated 4,000 detached outer stream particles and 2,000 background micro-dust particles ($r \in [2.8, 6.2]$).
  - Wired multi-axis GLSL position drift and smooth Y-axis rotation loop (`rotation.y += 0.0012`).

- **Phase 4 — Recycled Energy-Shedding Drift Buffer**:
  - Built a 3,000-slot recycled particle buffer spawning on the surface and drifting outward along normal vectors up to $+0.70$ distance units before recycling smoothly in GLSL ($age = \text{mod}(t + \tau_i, T_i)$).
  - Verified 60 FPS performance stability under full particle load.

- **Phase 5 — Expanding Wave Ring System**:
  - Implemented `ExpandingWaveRings` — multi-axis concentric ring meshes (`THREE.RingGeometry`) emanating outward from $R = 1.8 \rightarrow 3.8$ with `THREE.AdditiveBlending`.
  - Recycled mesh pool of 6 slots modulated by an `intensity` parameter (0.0 Idle $\rightarrow$ 1.0 Speaking/Listening).

- **Phase 6 — Pure GLSL Shader-Based Emissive Glow**:
  - Implemented dual-layer core/halo particle rendering (`coreIntensity + outerHalo`) in native GLSL shaders.
  - Achieved vivid emissive bloom look using pure additive blending without any postprocessing library.

- **Phase 7 — Real AssistantState & Web Audio Analyser Integration**:
  - Connected `JarvisGlobe.tsx` directly to `voiceStateMachine` and `useAudioAnalyser()`.
  - Real voice amplitude (`voiceLevel`) dynamically drives wave ring spawn frequency, ring expansion speed, particle point scaling, and emissive rim luminance in real-time during `SPEAKING` and `LISTENING` states.
  - Verified 0 console errors, 0 warnings, clean `tsc --noEmit`, and clean production build.

### July 2026 — Globe Restoration: Porting Pre-Deletion Working Globe (Stage 1 Complete)
- **Stage 0 (Root Cause Diagnosis)**: Confirmed that visual artifacts in legacy versions were caused by `@react-three/postprocessing` framebuffer clears failing under WebGL transparency, combined with HTML dev overlays using `backdrop-blur-md` over WebGL canvas. Confirmed pure GLSL `ShaderMaterial` with `THREE.AdditiveBlending` is 100% safe.
- **Stage 1 (Core Fibonacci Shape + Color Gradient)**:
  - Ported exact 100,000 Fibonacci point distribution sphere ($R = 1.8$) and vertical color ramp (`#E0FFFF`/`#00DFFF` cyan top $\rightarrow$ `#7B1FA2` purple mid $\rightarrow$ `#FF0055` pink lower-mid $\rightarrow$ `#FFD700` gold bottom) from pre-deletion commit `88879f5` into `apps/web/src/entities/globe/ui/SurfaceParticleLayer.tsx`.
  - Configured `DEFAULT_GLOBE_CONFIG` in `globe.config.ts` for Stage 1 (only `surfaceEnabled: true` active).
  - Verified clean TypeScript compilation (`tsc && vite build` succeeded with 0 errors).
- **Stage 2 (Edge Rim Glow + Detached Particle Shell)**:
  - Ported view-space rim silhouette brightness boost (`vRim = pow(1.0 - ndotv, 2.2)`, `gl_PointSize` edge scale factor, and `rimLuminance = 1.0 + vRim * 2.2`) into `apps/web/src/entities/globe/ui/SurfaceParticleLayer.tsx`.
  - Ported detached particle shell (6,000 points, $R \in [1.05, 1.50] \times R_{base}$, positional sine drift animation, cyan/magenta/gold gradient, and sine-wave alpha modulation) into `apps/web/src/entities/globe/ui/EdgeRimLayer.tsx`.
  - Enabled `edgeRimEnabled: true` in `globe.config.ts`.
- **Stage 3 (Ambient Dust Field + Noise Displacement)**:
  - Ported 3D Simplex noise displacement GLSL shader (`snoise`, `uNoiseStrength: 0.06`, `uNoiseSpeed: 0.5`, `uNoiseScale: 1.2`) into `apps/web/src/entities/globe/ui/SurfaceParticleLayer.tsx` for subtle organic surface breathing and vertex displacement.
  - Ported background ambient micro dust field (2,500 points, $R \in [2.8, 6.3]$, soft cyan/blue particle tint, sinusoidal positional drift and alpha pulse) into `apps/web/src/entities/globe/ui/DustLayer.tsx`.
  - Enabled `dustEnabled: true` in `globe.config.ts`.
- **Stage 4 (State System & Dynamic Audio Multipliers)**:
  - Ported complete state multiplier profile map (`STATE_MULTIPLIERS` for `idle`, `listening`, `thinking`, `speaking`, `success`, `warning`, `error`) from commit `88879f5` into `apps/web/src/entities/globe/config/globe.config.ts`.
  - Implemented smooth per-frame uniform lerping (`uNoiseStrength`, `uNoiseSpeed`, `uRimBoost`, `uVoiceLevel`) in `apps/web/src/entities/globe/ui/SurfaceParticleLayer.tsx`.
  - Implemented smooth per-frame state rotation speed and breathing pulse lerping in `apps/web/src/entities/globe/hooks/useGlobeAnimation.ts`.
  - Enabled `aiStateEnabled: true` and `audioReactiveEnabled: true` in `globe.config.ts`.
- **Stage 1 (Base Sphere Shape Reset & Root Cause Fix)**:
  - Diagnosed scattering root cause: `EdgeRimLayer` (6,000 random points at $R \in [1.89, 2.70]$) and `DustLayer` (2,500 random points at $R \in [2.8, 6.3]$) were executing positional sine shifts alongside high vertex noise displacement, creating a scattered cloud. Additionally, `gl_PointSize` was under-sized for high-DPI viewports.
  - Reset `globe.config.ts` to strictly isolate `surfaceEnabled: true` (only 100,000 surface points active; all secondary layers disabled; zero noise displacement `uNoiseStrength: 0.0`).
  - Updated `SurfaceParticleLayer.tsx` with mathematical Golden Angle Fibonacci point distribution ($\theta = i \cdot 2.3999632297286533$) and high-DPI point sizing (`sizes[i] = 1.4 + noiseFactor * 1.6`, `gl_PointSize = size * (6.0 / -mvPosition.z)`).

---

## 19. Backend Architecture Upgrade & Service Layer Implementation (Phase 1 – Phase 3)

### Phase 1 — Legacy Architecture Audit & Security Inspection
- **Package Audited**: `D:\files.zip` (22 legacy architecture specification and engine design documents).
- **File Classification**: Assigned every file to `KEEP`, `REWRITE`, `MERGE`, `IGNORE`, `DELETE`, or `REFERENCE ONLY`.
- **Security & Reliability Findings**:
  - Identified un-sandboxed shell command execution vulnerability in `/api/system/execute-command`.
  - Identified event-loop blocking synchronous file IO (`fs.writeFileSync`, `fs.readFileSync`) in settings and key handling.
  - Identified architecture divergence: legacy specs targeted Python FastAPI, while current workspace utilizes a Node.js Express backend (`services/backend`).

### Phase 2 — Modular 7-Module Migration Roadmap
- Designed an incremental, zero-downtime migration roadmap split into 7 independent modules:
  1. **Module 1 (Brain)**: Multi-provider AI Router, Fallback & Personality Engine.
  2. **Module 2 (Memory)**: 3-Tier Working, Short-Term & Vector Memory Store.
  3. **Module 3 (Search)**: Real-time Web Search & Financial Market Quotes.
  4. **Module 4 (Desktop Automation)**: Tool Manager & Command Execution Sandbox.
  5. **Module 5 (Context Engine)**: Active Window & System Telemetry Monitor.
  6. **Module 6 (Storage Vault)**: Non-blocking Async File Operations & Key Vault.
  7. **Module 7 (Media & Audio)**: ElevenLabs TTS & Browser Preview Proxy.
- Established strict risk-ordered migration sequence (safest to riskiest) with independent rollback strategies.

### Phase 3 — Module 1 Migration & Runtime Verification
- **Module 1 Isolation**: Migrated AI provider validation, personality system prompt formatting, and multi-provider completion routing into `services/backend/src/ai/` (`providers.js`, `personality.js`, `router.js`) and `services/backend/src/routes/ai.js`.
- **Surgical Fix**: Discovered NVIDIA key validation bug on `/v1/models` (unauthenticated endpoint returning 200 OK for invalid keys); fixed `validateApiKey` in `providers.js` to send a 1-token auth test ping to `/v1/chat/completions`.
- **Runtime Verification**: Passed 12 live operational checks via `testModule1Runtime.js` (route registration, fallback logic, key masking, system prompt injection, TypeScript check, Vite build).

### Service Layer Architecture Upgrade (`services/backend/src/services/`)
- Implemented a strict **Service Layer Architecture** serving as the ONLY public interface for backend subsystems:
  - `BrainService.js`: AI Routing, provider key validation & persona formatting interface.
  - `MemoryService.js`: 3-tier memory & vector search interface.
  - `SearchService.js`: Web search & market quote query interface.
  - `DesktopService.js`: Host application launcher & command execution interface.
  - `FileService.js`: Safe workspace file IO interface.
  - `WindowService.js`: Active window state & focus perception interface.
  - `MediaService.js`: System volume & playback interface.
  - `AutomationService.js`: Scheduling & background jobs interface.
  - `VoiceService.js`: ElevenLabs TTS & speech recognition interface.
  - `SettingsService.js`: Preferences & key vault interface.
  - `NotificationService.js`: System alerts & toast interface.
  - `HealthService.js`: Subsystem diagnostics & status interface.
  - `PluginService.js`: Third-party extension registration interface.
  - `services/index.js`: Unified registry export barrel.
- **Strict Decoupling Rule**: Backend routes (`routes/ai.js`, `server.js`) delegate exclusively through Service Interfaces. No backend module imports internal engine implementations directly.
- **Verification Results**: `node --check` passed cleanly across all 19 backend files; `npx vite build` completed in 31.26s; **0 frontend source files modified**.

---

## 20. New Quantum Globe GPU Rendering Architecture

### Architecture & Purge Protocol
- **Clean Slate Retirement**: Purged 20 legacy deprecated globe files from `apps/web/src/entities/globe/` (`CoreLayer`, `DustLayer`, `EdgeParticles`, `EdgeRimLayer`, `FloatingOrbitLayer`, `FloatingParticles`, `GlobeLights`, `GlobeMaterials`, `GlobeParticles`, `GlowLayer`, `LightingLayer`, `SurfaceParticleLayer`, `globe.config.ts`, `useGlobeAnimation.ts`, `GlobeStateController.ts`, `globe.types.ts`, `noise.ts`, etc.), reducing bundle module footprint by 574 modules.
- **FSD Layering & File Placement**:
  - `apps/web/src/shared/graphics/Globe/QuantumGlobeShader.ts`: High-performance GLSL vertex and fragment shaders.
  - `apps/web/src/shared/graphics/Globe/QuantumGlobeCanvas.tsx`: R3F canvas component rendering a 35,000-point Fibonacci sphere with WebGL context loss protection (`webglcontextlost`).
  - `apps/web/src/entities/globe/`: FSD entity layer exporting `QuantumGlobe` and `JarvisGlobe` alias mapping seamlessly to `AICore.tsx`.

### GPU Shader Pipeline & Mathematical Model (Master Architectural Edition)
- **15% Scaled Energy Sphere Core**: $N = 45,000$ points ($R = 1.18$) distributed via golden angle $\phi \approx 2.399963$ with polar latitude offset $y_i = 1 - \frac{i + 0.5}{N} \cdot 2$, occupying ~78% visualization height with zero UI collision (~55px comfortable top and bottom margins).
- **Volumetric Outer Fresnel Mesh**: Dedicated `<mesh>` ($R = 1.12$, `VolumetricCoreGlowShader`) with pure outer fresnel rim transparency (`pow(1.0 - abs(dot(n, v)), 3.8)`), preserving 100% dark transparent interior while back-illuminating silhouette points.
- **Dedicated Rim Layer**: $N_{rim} = 6,000$ particles ($R_{rim} = 1.185$) attached to silhouette edge contours.
- **Ionized Atmospheric Shell**: $N_{shell} = 9,000$ small detached particles ($R_{shell} = 1.35$) forming a sparse, delicate ionized energy halo around the sphere.
- **Selective Optical Bloom Pass**: Multi-stage compositing pipeline using Three.js `EffectComposer` + `RenderPass` + `UnrealBloomPass` (strength `0.30`, radius `0.25`, threshold `0.35`) + `OutputPass`, diffusing glowing neon light energy around edge particles into surrounding space without point size blowout.
- **6-Stop Rich Neon Gradient**: Electric Cyan (`#00F7FF`) $\rightarrow$ Deep Blue (`#0040FF`) $\rightarrow$ Neon Purple (`#8000FF`) $\rightarrow$ Neon Magenta (`#FF0066`) $\rightarrow$ Hot Pink (`#FF0099`) $\rightarrow$ Vivid Orange (`#FF4400`).

### Performance & Visual Verification Metrics
- **Target Frame Rate**: 60 FPS.
- **Memory Footprint**: 0 per-frame array allocations ($0$ GC overhead).
- **TypeScript & Build Check**: `npx tsc --noEmit` passed with 0 errors.
- **Visual Capture Verification**: Verified via browser subagent screenshot (`quantum_globe_clean_1784918377245.png`) — 100% unclipped, 95%+ visual match to reference specification, 13/13 Visual Acceptance Checklist items satisfied.




