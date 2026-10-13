# JARVIS OS

> **Desktop AI Assistant & Operating Environment for Windows**  
> **Status:** 🚧 **Work in Progress (Active Research & Development)**

---

## 1. Project Overview & Mission

**JARVIS OS** is an experimental personal AI operating system for Windows designed to combine conversational intelligence, voice and text interaction, persistent associative memory, system monitoring, and specialized autonomous agents into a cohesive desktop workspace.

The long-term vision is a unified, privacy-conscious digital assistant capable of orchestrating complex workflows—from media production to local automation—while maintaining strict human-in-the-loop approval gates for sensitive or destructive actions.

---

## 2. Verified Technology Stack

| Layer | Technologies | Verification Details |
| :--- | :--- | :--- |
| **Desktop Shell** | Tauri v2 (Rust), Windows NSIS | Configured in `apps/web/src-tauri` / `apps/desktop` for Windows window management and native APIs. |
| **Frontend UI** | React 18, Vite 5, TypeScript, TailwindCSS, Zustand | Custom HUD, 3D Canvas (`@react-three/fiber`, `@react-three/drei`), modular workspaces. |
| **Backend Service** | Node.js (ESM), Express 4 | Local API proxy running on `http://localhost:3001` managing provider routing, vector memory, and TTS proxies. |
| **Memory Engine** | Vector Store, TF-IDF / Embedding fallback, Knowledge Graph | Evaluates semantic relevance, recency scoring, and entity relationships (verified: 58 unit tests passing). |
| **Voice & Audio** | ElevenLabs Proxy, Web Speech API / TTS Provider Interfaces | Audio analyzer layer, mood state machine, and server-side ElevenLabs streaming proxy. |

---

## 3. Implementation Status Matrix

JARVIS OS is under active development. The matrix below honestly distinguishes what is verified and working from what is partial, blocked, or on the roadmap.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          JARVIS OS CAPABILITIES                        │
├──────────────────────────┬─────────────────────────────────────────────┤
│ Status                   │ Features                                    │
├──────────────────────────┼─────────────────────────────────────────────┤
│ 🟢 Verified Implemented  │ • React + Vite + Tailwind desktop interface │
│                          │ • 3D Quantum Globe visualization (Three.js) │
│                          │ • Express proxy with AI provider routing    │
│                          │ • ElevenLabs audio proxy architecture       │
│                          │ • Memory intelligence unit tests (58/58)    │
│                          │ • Modular workspace routing & command bar   │
├──────────────────────────┼─────────────────────────────────────────────┤
│ 🟡 Partially Implemented │ • Local Ollama LLM integration hooks        │
│                          │ • Channel Vault UI & character profiles     │
│                          │ • Desktop native window control bindings    │
│                          │ • Multi-agent hub coordination interfaces   │
├──────────────────────────┼─────────────────────────────────────────────┤
│ 🔴 Blocked               │ • YouTube Studio Google OAuth integration   │
│                          │   (requires real Google Cloud app & tokens) │
├──────────────────────────┼─────────────────────────────────────────────┤
│ ⚪ Planned Roadmap        │ • Autonomous video rendering (FFmpeg)       │
│                          │ • End-to-end multi-channel publishing       │
│                          │ • Autonomous desktop screen & OS control    │
└──────────────────────────┴─────────────────────────────────────────────┘
```

---

## 4. YouTube Studio Module: Architecture & Roadmap

The **YT Studio** workspace inside JARVIS OS is designed as an autonomous media-production engine for content creators.

### Roadmap Capabilities
* Multi-channel management across distinct storytelling niches.
* Structured script, narrative beat, and scene generation.
* Character voice and visual style consistency locks.
* Automated FFmpeg video composition, timeline rendering, and Shorts creation.
* Autonomous upload scheduling via official YouTube Data API v3.
* Real-time channel analytics, retention curve tracking, and strategy optimization.

### Current Reality Check
The interface features panels such as **Channel Vault**, **Character Vault**, **API Center**, **Agent Hub**, and **Production Pipeline**. While the visual layout and mock channel configurations are fully interactive in the frontend, **autonomous end-to-end video production and live YouTube publishing are planned features, not currently operational.**

---

## 5. Known Blocker: Channel Vault Google OAuth

### The Issue
In the Channel Vault interface, clicking **"Continue with Google"** previously failed with an HTTP 404 on the OAuth-start request (`ytstudioApi.ts:204`).

### Verified Root Cause Analysis
1. **Silent Port Collision:** The Express backend (`services/backend/src/server.js`) includes a port collision handler that silently calls `process.exit(0)` if port 3001 is already bound. When an older background Node process was occupying port 3001, launching the server exited silently, leaving the previous server process running without the newly mounted `/api/ytstudio` router.
2. **Prototype Mock vs. Real OAuth:** Tracing `services/backend/src/routes/ytstudio.js` revealed that the route `/channels/oauth/start` returns a mock authorization URL containing a dummy placeholder (`client_id=JARVIS_VAULT_CLIENT_ID`). In the frontend (`RobotChannelModal.tsx`), the returned URL is not opened; instead, a synthetic 1.5-second timer calls `/channels/oauth/callback` with simulated mock data, generating a fake channel ID (`UC_${Date.now()}`).
3. **Eventual Production Fix Requirements:**
   * Configure an official Google Cloud Console project with YouTube Data API v3 and YouTube Analytics API enabled.
   * Store `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` exclusively on the Express backend.
   * Open the real Google OAuth consent dialog with secure `state` parameter validation and PKCE.
   * Exchange the authorization code for refresh/access tokens server-side, encrypt tokens using AES-256 before storage, and never expose client secrets to the frontend bundle.

---

## 6. Local Development & Setup

### Prerequisites
* **Node.js:** v18.0.0 or higher (v20+ recommended)
* **PNPM:** v9.0+ (`npm install -g pnpm`)
* **Rust & Cargo:** (Required only if compiling the Tauri desktop wrapper)

### Installation
```bash
# Clone the repository
git clone https://github.com/yatinjoshi05/jarvis-os.git
cd jarvis-os

# Install workspace dependencies
pnpm install
```

### Environment Configuration
Copy the provided environment template:
```bash
cp .env.example .env
cp apps/web/.env.example apps/web/.env
```

Ensure sensitive provider keys (Gemini, ElevenLabs, OpenAI) are added to your local `.env` only. **Never commit real credentials.**

### Running the Development Environment
```bash
# Option 1: Run frontend and backend concurrently
pnpm dev

# Option 2: Run frontend only (Vite dev server on port 3000)
pnpm dev:web

# Option 3: Run backend proxy only (Express on port 3001)
pnpm dev:backend

# Option 4: Run Tauri desktop application (requires Rust toolchain)
cd apps/web && pnpm tauri dev
```

---

## 7. Verification & Build Commands

All build and test commands have been independently verified:

```bash
# 1. Type-check and production build the frontend
cd apps/web
npm run build
# Result: PASS (Built in ~32s, output in dist/)

# 2. Run backend intelligence and vector store unit tests
cd ../../services/backend
npm run test
# Result: PASS (6 test suites passed, 58/58 tests passed)
```

---

## 8. Security & Privacy Architecture

* **Zero Frontend Secrets:** Sensitive third-party API keys (ElevenLabs, OpenAI, Gemini backend fallback) are proxied exclusively through `services/backend`. They are never bundled into client-side Vite builds.
* **Strict Git Hygiene:** All `.env`, `*.log`, local diagnostic dumps, large model weights, and setup installers (`OllamaSetup.exe`) are explicitly excluded via `.gitignore`.
* **Human-in-the-Loop:** All native execution tools require explicit user approval before executing file system modifications, running terminal commands, or altering settings.

---

## 9. Next Development Milestones

1. [ ] Implement production Google OAuth 2.0 flow with PKCE and encrypted token vault.
2. [ ] Connect real YouTube Data API v3 endpoints for channel metadata synchronization.
3. [ ] Integrate headless FFmpeg composition pipeline for Shorts rendering.
4. [ ] Wire local Ollama model management into the Tauri system tray.
5. [ ] Package Windows NSIS release binary for standalone desktop installation.
