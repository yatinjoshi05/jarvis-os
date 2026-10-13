import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Import Service Layer & AI Router
import aiRouter from './routes/ai.js';
import {
  BrainService,
  HealthService,
  SettingsService,
  DesktopService,
  FileService,
} from './services/index.js';
import { JsonRuntimeRepository, RuntimeManager } from './runtime/RuntimeManager.js';
import { createRuntimeRouter } from './routes/runtime.js';
import { routeAICompletion } from './ai/router.js';
import { ConversationManager } from './brain/ConversationManager.js';
import { ContextEngine } from './brain/ContextEngine.js';
import { Planner } from './brain/Planner.js';
import { AgentDispatcher } from './brain/AgentDispatcher.js';
import { ResponseComposer } from './brain/ResponseComposer.js';
import { PromptManager } from './brain/PromptManager.js';
import { ProviderManager } from './providers/ProviderManager.js';
import { BrainEngine } from './brain/BrainEngine.js';
import { MemoryRepository } from './memory/MemoryRepository.js';
import { MemoryService } from './memory/MemoryService.js';
import { createMemoryRouter } from './routes/memory.js';
import { VoiceService } from './voice/VoiceService.js';
import { UnsupportedSpeechToTextProvider, UnsupportedTextToSpeechProvider, EnergyVoiceActivityDetector, ConfigurableWakeWordEngine } from './voice/Providers.js';
import { createVoiceRouter } from './routes/voice.js';
import filesRouter from './routes/files.js';
import ytstudioRouter from './routes/ytstudio.js';

// Phase 2.2 — Memory Intelligence Services
import { EmbeddingService } from './memory/intelligence/EmbeddingService.js';
import { VectorStore } from './memory/intelligence/VectorStore.js';
import { KnowledgeGraphService } from './memory/intelligence/KnowledgeGraphService.js';
import { MemoryIntelligenceService } from './memory/intelligence/MemoryIntelligenceService.js';
import { MemoryLifecycleManager } from './memory/intelligence/MemoryLifecycleManager.js';
import { AutoMemoryEngine } from './memory/intelligence/AutoMemoryEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from apps/web/.env
dotenv.config({ path: path.resolve(__dirname, '../../../apps/web/.env') });

// Load persisted custom provider keys
const CUSTOM_KEYS_PATH = path.resolve(__dirname, '../.env.custom-keys');
function loadCustomKeys() {
  try {
    if (fs.existsSync(CUSTOM_KEYS_PATH)) {
      const result = dotenv.parse(fs.readFileSync(CUSTOM_KEYS_PATH, 'utf-8'));
      for (const [k, v] of Object.entries(result)) {
        if (!process.env[k]) process.env[k] = v;
      }
    }
  } catch (err) {
    console.warn('[JARVIS Backend] Could not load custom keys file:', err.message);
  }
}
loadCustomKeys();

console.log('');
console.log('┌──────────────────────────────────────────────┐');
console.log('│  JARVIS OS Backend — Phase 2.2               │');
console.log('├──────────────────────────────────────────────┤');
console.log('│  Service Layer Interfaces Active:            │');
console.log('│   • BrainService             [Active]        │');
console.log('│   • MemoryService            [Active]        │');
console.log('│   • EmbeddingService         [Active]        │');
console.log('│   • VectorStore              [Active]        │');
console.log('│   • MemoryIntelligenceService [Active]       │');
console.log('│   • KnowledgeGraphService    [Active]        │');
console.log('│   • MemoryLifecycleManager   [Active]        │');
console.log('│   • AutoMemoryEngine         [Active]        │');
console.log('│   • DesktopService           [Active]        │');
console.log('│   • FileService              [Active]        │');
console.log('│   • VoiceService             [Ready]         │');
console.log('│   • SettingsService          [Active]        │');
console.log('│   • HealthService            [Active]        │');
console.log('└──────────────────────────────────────────────┘');
console.log('');

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const PORT = process.env.PORT || 3001;
const DATA_DIR = path.resolve(__dirname, '../data');

// ── Core services ─────────────────────────────────────────────────────────────
const runtimeRepository = new JsonRuntimeRepository(path.resolve(DATA_DIR, 'runtime.json'));
const runtimeManager = new RuntimeManager(runtimeRepository);
await runtimeManager.initialize();

const brainEvents = {
  listeners: new Set(),
  publish(type, payload) {
    const event = { id: crypto.randomUUID(), type, timestamp: new Date().toISOString(), payload };
    this.listeners.forEach(listener => listener(event));
    return event;
  },
};

const memoryRepository = new MemoryRepository(path.resolve(DATA_DIR, 'memory.json'));
await memoryRepository.load();

const memoryService = new MemoryService(memoryRepository, brainEvents);

// ── Phase 2.2: Memory Intelligence Services ────────────────────────────────────
let memoryIntelligence = null;
let lifecycleManager = null;
let autoMemoryEngine = null;

try {
  const embeddingService = new EmbeddingService();
  const vectorStore = new VectorStore(path.resolve(DATA_DIR, 'vectors.json'));
  await vectorStore.load();

  const knowledgeGraph = new KnowledgeGraphService(path.resolve(DATA_DIR, 'knowledge-graph.json'));
  await knowledgeGraph.load();

  memoryIntelligence = new MemoryIntelligenceService({
    repository: memoryRepository,
    embeddingService,
    vectorStore,
    knowledgeGraph,
    events: brainEvents,
  });

  // Wire intelligence into MemoryService for lifecycle hooks
  memoryService.setIntelligence(memoryIntelligence);

  // Initialise graph and vectors from existing memories
  const existingMemories = memoryRepository.list();
  if (existingMemories.length > 0) {
    knowledgeGraph.rebuildFromMemories(existingMemories);
    // Index any memories not yet in vector store (background)
    let indexed = 0;
    for (const memory of existingMemories) {
      if (!vectorStore.has(memory.id)) {
        embeddingService.embedMemory(memory)
          .then(vec => { vectorStore.upsert(memory.id, vec); indexed++; })
          .catch(() => {}); // non-blocking
      }
    }
    console.log(`[JARVIS Backend] Queued ${existingMemories.length} memories for embedding index`);
  }

  lifecycleManager = new MemoryLifecycleManager({
    repository: memoryRepository,
    events: brainEvents,
    intelligenceService: memoryIntelligence,
  });
  lifecycleManager.start();

  autoMemoryEngine = new AutoMemoryEngine({
    memoryService,
    intelligenceService: memoryIntelligence,
    events: brainEvents,
    threshold: 0.45,
  });

  console.log('[JARVIS Backend] Memory Intelligence Services: ONLINE');
} catch (err) {
  console.warn('[JARVIS Backend] Memory Intelligence init failed (degraded mode):', err.message);
}

// ── Brain Engine ──────────────────────────────────────────────────────────────
const brain = new BrainEngine({
  conversations: new ConversationManager(),
  context: new ContextEngine(),
  planner: new Planner(),
  agents: new AgentDispatcher(),
  composer: new ResponseComposer(),
  prompts: new PromptManager(),
  events: brainEvents,
  memory: memoryService,
  memoryIntelligence,   // Phase 2.2
  autoMemory: autoMemoryEngine, // Phase 2.2
  providers: new ProviderManager([{
    id: 'default',
    available: async () => true,
    complete: routeAICompletion,
  }]),
});

const voiceService = new VoiceService({
  brain,
  memory: memoryService,
  sttProvider: new UnsupportedSpeechToTextProvider(),
  ttsProvider: new UnsupportedTextToSpeechProvider(),
  wakeWord: new ConfigurableWakeWordEngine(),
  vad: new EnergyVoiceActivityDetector(),
});

// ── API Routes ─────────────────────────────────────────────────────────────────

// Health
app.get('/api/health', async (_req, res) => {
  const health = await HealthService.getSystemHealth();
  res.json(health);
});

// Brain & Runtime
app.use('/api', aiRouter);
app.use('/api/runtime', createRuntimeRouter(runtimeManager));

// Memory (Phase 2.2 — with intelligence + lifecycle)
app.use('/api/memory', createMemoryRouter(memoryService, memoryIntelligence, lifecycleManager));

// Voice
app.use('/api/voice', createVoiceRouter(voiceService));

// YT Studio Autonomous Engine (Phase 2)
app.use('/api/ytstudio', ytstudioRouter);

// ── ElevenLabs TTS Proxy (/api/tts/elevenlabs) ─────────────────────────────
// The frontend never touches the ElevenLabs API key. All calls go through this
// server-side proxy which securely reads ELEVENLABS_API_KEY from .env.

app.post('/api/tts/elevenlabs', async (req, res) => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'ELEVENLABS_API_KEY is not configured on the server.' });
  }

  const {
    text,
    voiceId = process.env.VITE_ELEVENLABS_VOICE_ID || 'pNInz6obpgDQGcFmaJgB',
    modelId = process.env.VITE_ELEVENLABS_MODEL || 'eleven_multilingual_v2',
    voiceSettings: vs = {},
  } = req.body || {};

  if (!text || !String(text).trim()) {
    return res.status(400).json({ error: 'text is required.' });
  }

  const upstreamUrl = `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}/stream`;

  try {
    const upstream = await fetch(upstreamUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
        Accept: 'audio/mpeg',
      },
      body: JSON.stringify({
        text: String(text).trim(),
        model_id: modelId,
        voice_settings: {
          stability: vs.stability ?? 0.5,
          similarity_boost: vs.similarity_boost ?? 0.75,
          style: vs.style ?? 0,
          use_speaker_boost: vs.use_speaker_boost ?? true,
        },
      }),
      signal: AbortSignal.timeout(25_000),
    });

    if (!upstream.ok) {
      const errText = await upstream.text().catch(() => '');
      console.error(`[TTS] ElevenLabs returned HTTP ${upstream.status}: ${errText}`);
      return res.status(502).json({ error: `ElevenLabs returned HTTP ${upstream.status}` });
    }

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Transfer-Encoding', 'chunked');
    res.setHeader('Cache-Control', 'no-cache');

    const reader = upstream.body?.getReader();
    if (!reader) return res.status(502).json({ error: 'No response body from ElevenLabs.' });

    const pump = async () => {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(Buffer.from(value));
      }
      res.end();
    };

    pump().catch((err) => {
      console.error('[TTS] Stream error:', err.message);
      if (!res.headersSent) res.status(500).json({ error: 'Streaming error.' });
      else res.end();
    });
  } catch (err) {
    console.error('[TTS] ElevenLabs proxy error:', err.message);
    if (!res.headersSent) res.status(500).json({ error: err.message });
  }
});

// ElevenLabs voice list (for settings UI)
app.get('/api/tts/elevenlabs/voices', async (_req, res) => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) return res.status(503).json({ error: 'ELEVENLABS_API_KEY not configured.' });
  try {
    const upstream = await fetch('https://api.elevenlabs.io/v1/voices', {
      headers: { 'xi-api-key': apiKey },
      signal: AbortSignal.timeout(10_000),
    });
    const data = await upstream.json();
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: err.message });
  }
});

// Files (Phase 2.1 — Real Windows File System Engine)
app.use('/api/files', filesRouter);


// Brain execute
app.post('/api/brain/execute', async (req, res) => {
  if (typeof req.body?.message !== 'string' || !req.body.message.trim())
    return res.status(400).json({ ok: false, error: 'message is required.' });
  try {
    res.json({ ok: true, data: await brain.execute(req.body) });
  } catch (error) {
    res.status(502).json({ ok: false, error: error.message });
  }
});

// Brain events (SSE)
app.get('/api/brain/events', (req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
  const listener = event => res.write(`event: brain\ndata: ${JSON.stringify(event)}\n\n`);
  brainEvents.listeners.add(listener);
  req.on('close', () => brainEvents.listeners.delete(listener));
});

// Settings
app.get('/api/settings/get', async (_req, res) => {
  const settings = await SettingsService.getSettings();
  res.json({ success: true, settings });
});

app.post('/api/settings/save', async (req, res) => {
  try {
    const payload = req.body || {};
    const settingsToSave = payload.settings ? payload.settings : payload;
    const settings = await SettingsService.saveSettings(settingsToSave);
    res.json({ success: true, settings });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Desktop Automation
app.post('/api/system/open-app', async (req, res) => {
  const { name, appName } = req.body;
  try {
    const result = await DesktopService.openApplication(name || appName);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/system/execute-command', async (req, res) => {
  const { command, cwd } = req.body;
  try {
    const result = await DesktopService.executeCommand(command, cwd);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// File Operations
app.post('/api/system/write-file', async (req, res) => {
  const { path: targetPath, filename, content = '' } = req.body;
  try {
    const result = await FileService.writeFile(targetPath || filename, content);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Terminal Endpoints
app.get('/api/terminal/check-gitbash', async (req, res) => {
  const paths = [
    'C:\\Program Files\\Git\\bin\\bash.exe',
    'C:\\Program Files (x86)\\Git\\bin\\bash.exe',
    'C:\\Git\\bin\\bash.exe',
  ];
  const available = paths.some((p) => fs.existsSync(p));
  res.json({ available });
});

// Request logger middleware
app.use((req, res, next) => {
  if (req.path.startsWith('/api/terminal')) {
    console.log(`[Express Backend] 📥 Request Received: ${req.method} ${req.originalUrl}`);
    console.log(`[Express Backend] ⚙️  Middleware Pipeline: cors() -> express.json()`);
    const originalSend = res.json;
    res.json = function (body) {
      console.log(`[Express Backend] 📤 Response Sent: HTTP ${res.statusCode} ${res.statusCode === 200 ? 'OK' : 'Error'}`);
      console.log(`[Express Backend] 📄 Content-Type: application/json`);
      console.log(`[Express Backend] 📦 Response Body:`, JSON.stringify(body));
      return originalSend.call(this, body);
    };
  }
  next();
});

const handleTerminalExec = async (req, res) => {
  console.log(`[Express Backend] 🎯 Matched Route: POST ${req.route?.path || '/api/terminal/exec'}`);
  console.log(`[Express Backend] 🚀 Handler Executed: app.post('/api/terminal/exec')`);
  console.log(`[Express Backend] 📥 Request Payload:`, JSON.stringify(req.body));

  const { command, shell = 'powershell', cwd = process.env.USERPROFILE || process.cwd() } = req.body || {};
  if (!command) return res.status(400).json({ success: false, error: 'Command required' });
  const workingDir = fs.existsSync(cwd) ? cwd : process.env.USERPROFILE || process.cwd();

  try {
    const { exec } = await import('child_process');
    let cmdString = `powershell.exe -NoProfile -Command ${command}`;

    if (shell === 'cmd') {
      cmdString = `cmd.exe /C "${command}"`;
    } else if (shell === 'gitbash' || shell === 'git-bash') {
      cmdString = `bash.exe -c "${command}"`;
    }

    console.log(`[Express Backend] 💻 Executing OS Shell Command: ${cmdString}`);

    exec(cmdString, { cwd: workingDir, encoding: 'utf8' }, (error, stdout, stderr) => {
      console.log(`[Express Backend] ✅ Shell Command Process Exit. stdout length: ${(stdout || '').length} bytes`);
      res.json({
        success: !error,
        output: stdout || stderr || (error ? error.message : ''),
        error: stderr || null,
      });
    });
  } catch (err) {
    console.error(`[Express Backend] ❌ Error executing command: ${err.message}`);
    res.status(500).json({ success: false, error: err.message });
  }
};

app.post('/api/terminal/exec', handleTerminalExec);
app.post('/api/terminal/execute', handleTerminalExec);

// ── Start & Graceful Shutdown ──────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`[JARVIS Backend] Listening on http://localhost:${PORT}`);
  console.log(`[JARVIS Backend] Memory Intelligence API: http://localhost:${PORT}/api/memory/insights`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`[JARVIS Backend] Port ${PORT} is already in use. Existing process active.`);
    process.exit(0);
  }
});

const gracefulShutdown = (signal) => {
  console.log(`[JARVIS Backend] Received ${signal}. Shutting down cleanly...`);
  server.close(() => {
    console.log('[JARVIS Backend] Server port released.');
    process.exit(0);
  });
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
