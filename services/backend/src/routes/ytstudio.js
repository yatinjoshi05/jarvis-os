import express from 'express';
import { ChannelManager } from '../../../../backend/channel-manager/ChannelManager.js';
import { CharacterEngine } from '../../../../backend/character-engine/CharacterEngine.js';
import { StoryEngine } from '../../../../backend/story-engine/StoryEngine.js';
import { VideoFactory } from '../../../../backend/video-factory/VideoFactory.js';
import { UploadEngine } from '../../../../backend/upload-engine/UploadEngine.js';
import { YTEngine } from '../../../../backend/yt-engine/YTEngine.js';
import { StrategyBrain } from '../../../../backend/analytics-engine/StrategyBrain.js';
import { queueManager } from '../../../../backend/queue/QueueSystem.js';
import { db } from '../../../../backend/database/db.js';
import { CharacterMemoryService } from '../../../../backend/character-memory/CharacterMemoryService.js';
import { DirectorEngine } from '../../../../backend/director-ai/DirectorEngine.js';
import { AgentManager } from '../../../../backend/agents/AgentManager.js';
import { LearningEngine } from '../../../../backend/self-learning/LearningEngine.js';
import { PerformancePredictor } from '../../../../backend/self-learning/PerformancePredictor.js';

const router = express.Router();

// ── Health Check (Step 7) ───────────────────────────────────────────────────
router.get('/health', (_req, res) => {
  console.log('[Express Backend] 🟢 /api/ytstudio/health ping received');
  res.json({
    success: true,
    status: "YT Studio backend online",
    timestamp: new Date().toISOString()
  });
});

// ── Channels (Module 1 & 10) ──────────────────────────────────────────────────
router.get('/channels', async (_req, res) => {
  try {
    const channels = await ChannelManager.listChannels();
    res.json({ success: true, channels });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/channels/connect', async (req, res) => {
  try {
    const channel = await ChannelManager.connectChannel(req.body);
    res.json({ success: true, channel });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

const handleOAuthStart = async (req, res) => {
  console.log(`[Express Backend] 🔓 OAuth start route hit: ${req.method} ${req.originalUrl}`);
  try {
    const scopes = [
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/yt-analytics.readonly'
    ];
    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=JARVIS_VAULT_CLIENT_ID&response_type=code&scope=${encodeURIComponent(scopes.join(' '))}&redirect_uri=http://localhost:3001/api/ytstudio/channels/oauth/callback`;
    console.log('[Express Backend] 🔑 Generated Google OAuth URL:', authUrl);
    return res.json({ success: true, authUrl });
  } catch (err) {
    console.error('[Express Backend] ❌ Error in OAuth start route:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

router.post('/channels/oauth/start', handleOAuthStart);
router.get('/channels/oauth/start', handleOAuthStart);

router.post('/channels/oauth/callback', async (req, res) => {
  try {
    const { channelName = 'Old Couple Stories', channelType = 'Old Couple Stories', email = 'yatin@gmail.com' } = req.body;
    const channelData = {
      name: channelName,
      niche: channelType,
      gmail: email,
      youtube_channel_id: `UC_${Date.now()}`,
      status: 'Connected',
      handle: `@${channelName.toLowerCase().replace(/\s+/g, '')}`,
      image: '/assets/yt/yt_old_couple.png',
      badge: 'ACTIVE',
      subscribers: 12450,
      videos: 87,
      views: '1.2M'
    };

    const channel = await ChannelManager.connectChannel(channelData);
    res.json({ success: true, channel });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/channels/disconnect', async (req, res) => {
  try {
    const { channelId } = req.body;
    const channel = await ChannelManager.disconnectChannel(channelId);
    res.json({ success: true, channel });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/channels/sync', async (req, res) => {
  try {
    const { channelId } = req.body;
    const result = await ChannelManager.syncChannel(channelId);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get('/channels/:id/analytics', async (req, res) => {
  try {
    const analytics = await ChannelManager.getAnalytics(req.params.id);
    res.json({ success: true, analytics });
  } catch (err) {
    res.status(404).json({ success: false, error: err.message });
  }
});

// ── Characters (Module 2 & 8) ────────────────────────────────────────────────
router.get('/characters', async (_req, res) => {
  try {
    const characters = await CharacterEngine.listCharacters();
    res.json({ success: true, characters });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/characters/create', async (req, res) => {
  try {
    const character = await CharacterEngine.createCharacter(req.body);
    res.json({ success: true, character });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/characters/update', async (req, res) => {
  try {
    const { id, ...updates } = req.body;
    const character = await CharacterEngine.updateCharacter(id, updates);
    res.json({ success: true, character });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/characters/generate-voice', async (req, res) => {
  try {
    const voiceResult = await CharacterEngine.generateVoice(req.body);
    res.json({ success: true, ...voiceResult });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ── Character Memory & Consistency Engine (Phase 2.1) ──────────────────────────
router.get('/character-memory/vault', async (_req, res) => {
  try {
    const vault = CharacterMemoryService.getVaultCharacters();
    res.json({ success: true, vault });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/character-memory/create', async (req, res) => {
  try {
    const character = CharacterMemoryService.createCharacter(req.body);
    res.json({ success: true, character });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/character-memory/lock', async (req, res) => {
  try {
    const { id, isLocked } = req.body;
    const character = CharacterMemoryService.lockCharacter(id, isLocked ?? true);
    res.json({ success: true, character });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/character-memory/preview-voice', async (req, res) => {
  try {
    const { id } = req.body;
    const voiceProfile = CharacterMemoryService.previewVoice(id);
    res.json({ success: true, voiceProfile, audioUrl: `/assets/yt/voices/preview_${id}.mp3` });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/character-memory/verify-consistency', async (req, res) => {
  try {
    const result = await CharacterMemoryService.verifyConsistency(req.body);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Director AI (Phase 2.2) ───────────────────────────────────────────────────
router.post('/director/command', async (req, res) => {
  try {
    const { command } = req.body;
    const plan = await DirectorEngine.processUserCommand(command);
    res.json({ success: true, plan });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.get('/director/status', async (_req, res) => {
  try {
    const status = await DirectorEngine.getDirectorStatus();
    res.json({ success: true, status });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Multi-Agent Team (Phase 2.3) ──────────────────────────────────────────────
router.get('/agents/team', async (_req, res) => {
  try {
    const data = AgentManager.getAgentHubData();
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/agents/hub', async (_req, res) => {
  try {
    const data = AgentManager.getAgentHubData();
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/agents/dispatch', async (req, res) => {
  try {
    const { command } = req.body;
    const result = await AgentManager.executeMultiAgentPipeline(command);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ── Self-Learning Engine (Phase 2.4) ──────────────────────────────────────────
router.get('/learning/dashboard', async (_req, res) => {
  try {
    const data = LearningEngine.getDashboard();
    res.json({ success: true, ...data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/learning/run-cycle', async (_req, res) => {
  try {
    const result = LearningEngine.run24HourCycle();
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/learning/predict', async (req, res) => {
  try {
    const prediction = PerformancePredictor.predictPerformance(req.body);
    res.json({ success: true, prediction });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/learning/autonomous-mode', async (req, res) => {
  try {
    const { enabled } = req.body;
    const result = LearningEngine.setAutonomousMode(enabled);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Story Engine (Module 3) ──────────────────────────────────────────────────
router.get('/stories', async (_req, res) => {
  try {
    const stories = await StoryEngine.listStories();
    res.json({ success: true, stories });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/stories/generate', async (req, res) => {
  try {
    const story = await StoryEngine.generateStory(req.body);
    res.json({ success: true, story });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Production Pipeline & Video Factory (Module 4 & 5) ───────────────────────
router.post('/pipeline/start', async (req, res) => {
  try {
    const result = await YTEngine.triggerFullPipeline(req.body);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/queue/status', (_req, res) => {
  res.json({ success: true, queue: queueManager.getQueueStatus() });
});

// ── API Center (Module 9) ────────────────────────────────────────────────────
router.get('/api-center/status', async (_req, res) => {
  try {
    const services = await YTEngine.getApiCenterStatus();
    res.json({ success: true, services });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/api-center/test', async (req, res) => {
  try {
    const { apiId } = req.body;
    const testResult = await YTEngine.testApiConnection(apiId);
    res.json({ success: true, ...testResult });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

router.post('/api-center/save-key', async (req, res) => {
  try {
    const { serviceId, apiKey } = req.body;
    const result = await YTEngine.saveApiKey(serviceId, apiKey);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// ── Strategy Brain (Module 7) ────────────────────────────────────────────────
router.get('/strategy/recommendations', async (_req, res) => {
  try {
    const insights = await StrategyBrain.analyzePerformance();
    res.json({ success: true, ...insights });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Upload Engine (Module 6) ─────────────────────────────────────────────────
router.post('/upload/execute', async (req, res) => {
  try {
    const { storyId, channelId } = req.body;
    const result = await UploadEngine.uploadVideo(storyId, channelId);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Logging (Module 12) ──────────────────────────────────────────────────────
router.get('/logs', (req, res) => {
  try {
    const { type } = req.query;
    const logs = db.getLogs(type);
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── Phase 3: Module API Endpoints ────────────────────────────────────────────
import { YouTubeAnalyticsService } from '../../../../backend/analytics-engine/YouTubeAnalyticsService.js';
import { TrendDiscoveryEngine } from '../../../../backend/trend-engine/TrendDiscoveryEngine.js';
import { VoicePipeline } from '../../../../backend/voice-engine/VoicePipeline.js';
import { ThumbnailEngine } from '../../../../backend/thumbnail-engine/ThumbnailEngine.js';
import { VideoFactory2 } from '../../../../backend/video-factory/VideoFactory2.js';
import { MemoryGraphService } from '../../../../backend/self-learning/MemoryGraphService.js';
import { RecommendationEngine } from '../../../../backend/analytics-engine/RecommendationEngine.js';
import { ProductionMonitor } from '../../../../backend/monitoring/ProductionMonitor.js';

router.get('/analytics/overview', async (req, res) => {
  try {
    const { channelId = 'old-couple', timeframe = '7d' } = req.query;
    const metrics = await YouTubeAnalyticsService.fetchDailyMetrics(channelId, timeframe);
    res.json({ success: true, metrics });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/analytics/retention', async (req, res) => {
  try {
    const { videoId = 'vid_01' } = req.query;
    const curve = await YouTubeAnalyticsService.getSecondBySecondRetention(videoId);
    res.json({ success: true, ...curve });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/trends/discover', async (req, res) => {
  try {
    const { niche = 'Emotional Storytelling' } = req.query;
    const trends = await TrendDiscoveryEngine.discoverViralTopics(niche);
    res.json({ success: true, trends });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/voice/synthesize', async (req, res) => {
  try {
    const result = await VoicePipeline.synthesizeDialogue(req.body);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/thumbnails/generate', async (req, res) => {
  try {
    const result = await ThumbnailEngine.generateThumbnailVariations(req.body);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/pipeline/v2/render', async (req, res) => {
  try {
    const result = await VideoFactory2.renderProductionVideo(req.body);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/learning/graph', async (_req, res) => {
  try {
    const topology = MemoryGraphService.getGraphTopology();
    res.json({ success: true, ...topology });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/strategy/recommendations/v2', async (req, res) => {
  try {
    const { channelId = 'old-couple' } = req.query;
    const recommendations = RecommendationEngine.generateStrategicRecommendations(channelId);
    res.json({ success: true, recommendations });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/monitoring/telemetry', async (_req, res) => {
  try {
    const telemetry = ProductionMonitor.getSystemTelemetry();
    res.json({ success: true, ...telemetry });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
