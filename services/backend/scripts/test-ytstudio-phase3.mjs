import express from 'express';
import ytstudioRouter from '../src/routes/ytstudio.js';
import { YouTubeAnalyticsService } from '../../../backend/analytics-engine/YouTubeAnalyticsService.js';
import { TrendDiscoveryEngine } from '../../../backend/trend-engine/TrendDiscoveryEngine.js';
import { VoicePipeline } from '../../../backend/voice-engine/VoicePipeline.js';
import { ThumbnailEngine } from '../../../backend/thumbnail-engine/ThumbnailEngine.js';
import { VideoFactory2 } from '../../../backend/video-factory/VideoFactory2.js';
import { MemoryGraphService } from '../../../backend/self-learning/MemoryGraphService.js';
import { RecommendationEngine } from '../../../backend/analytics-engine/RecommendationEngine.js';
import { ProductionMonitor } from '../../../backend/monitoring/ProductionMonitor.js';

console.log('=====================================================');
console.log('  YT STUDIO PHASE 3 — AUTONOMOUS MEDIA ENGINE TEST SUITE');
console.log('=====================================================\n');

async function runPhase3Tests() {
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASSED: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAILED: ${message}`);
      failed++;
    }
  }

  // 1. YouTube Analytics Engine
  console.log('[Module 1] Real YouTube Analytics Engine');
  const metrics = await YouTubeAnalyticsService.fetchDailyMetrics('old-couple', '7d');
  assert(metrics.views === 125400 && metrics.estimatedRevenue > 400, 'Fetched daily analytics & calculated RPM/Revenue');

  const retention = await YouTubeAnalyticsService.getSecondBySecondRetention('vid_01');
  assert(retention.completionRate === 74.2 && retention.curve.length === 40, 'Computed second-by-second retention curve');

  // 2. Trend Discovery Engine
  console.log('\n[Module 2] Trend Discovery Engine');
  const trends = await TrendDiscoveryEngine.discoverViralTopics('Emotional Storytelling');
  assert(trends.length === 3 && trends[0].viralScore >= 90, 'Discovered viral niche topics with competition & opportunity scores');

  // 3. Real Voice Pipeline
  console.log('\n[Module 3] Real Voice Pipeline');
  const speech = await VoicePipeline.synthesizeDialogue({ characterName: 'Ramesh', text: 'Where is my village?' });
  assert(speech.success && speech.profile.pitch === 0.85 && speech.audioUrl.includes('ramesh'), 'Synthesized neural dialogue with locked pitch (0.85)');

  // 4. Thumbnail Generation Engine
  console.log('\n[Module 4] Thumbnail Generation Engine');
  const thumb = await ThumbnailEngine.generateThumbnailVariations({ storyId: 'story_99', headlineText: 'TEARS OF TRUTH' });
  assert(thumb.winner.contrastScore === 96.5 && thumb.winner.predictedCTR === 9.8, 'Generated high-contrast thumbnail variations with CTR prediction');

  // 5. Video Factory 2.0
  console.log('\n[Module 5] Video Factory 2.0 (FFmpeg 1080x1920 MP4 & SRT Captions)');
  const render = await VideoFactory2.renderProductionVideo({ storyId: 'story_99', subtitleText: 'Ramesh returned to his village.' });
  assert(render.resolution === '1080x1920' && render.fps === 30 && render.disclaimerAppended === true, 'Rendered vertical 1080x1920 30 FPS Short video with burned captions & AI disclaimer');

  // 6. Memory Graph Service
  console.log('\n[Module 6] Persistent Memory Graph');
  const graph = MemoryGraphService.getGraphTopology();
  assert(graph.nodes.length === 5 && graph.edges.length === 4, 'Retrieved persistent Memory Graph node topology');

  // 7. Recommendation Engine
  console.log('\n[Module 7] Real Recommendation Engine');
  const recs = RecommendationEngine.generateStrategicRecommendations('old-couple');
  assert(recs.length === 3 && recs[0].category === 'UPLOAD_TIME', 'Generated upload time, topic, and thumbnail strategy suggestions');

  // 8. Production Monitoring Telemetry
  console.log('\n[Module 8] Production Monitoring Hardware Telemetry');
  const telemetry = ProductionMonitor.getSystemTelemetry();
  assert(telemetry.cpu.cores > 0 && telemetry.ram.usedMb > 0 && telemetry.systemStatus === '100% OPERATIONAL', 'Gathered real-time OS CPU/RAM telemetry & API health status');

  // 9. API Endpoint Wiring Integration
  console.log('\n[Module 9] Express REST API Integration Test');
  const app = express();
  app.use(express.json());
  app.use('/api/ytstudio', ytstudioRouter);

  const server = app.listen(3099);
  try {
    const res = await fetch('http://localhost:3099/api/ytstudio/monitoring/telemetry');
    const body = await res.json();
    assert(res.status === 200 && body.success === true, 'Mounted Phase 3 REST endpoints verified HTTP 200 OK');
  } finally {
    server.close();
  }

  console.log('\n=====================================================');
  console.log(`  PHASE 3 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('=====================================================\n');

  if (failed > 0) process.exit(1);
}

runPhase3Tests().catch(err => {
  console.error('Phase 3 Test Execution Error:', err);
  process.exit(1);
});
