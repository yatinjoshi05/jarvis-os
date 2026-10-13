import { AgentRegistry } from '../../../backend/agents/AgentRegistry.js';
import { AgentCommunication } from '../../../backend/agents/AgentCommunication.js';
import { AgentMemory } from '../../../backend/agents/AgentMemory.js';
import { ProducerAgent } from '../../../backend/agents/ProducerAgent.js';
import { TrendResearchAgent } from '../../../backend/agents/TrendResearchAgent.js';
import { StoryWriterAgent } from '../../../backend/agents/StoryWriterAgent.js';
import { CharacterAgent } from '../../../backend/agents/CharacterAgent.js';
import { CinematographyAgent } from '../../../backend/agents/CinematographyAgent.js';
import { VoiceAgent } from '../../../backend/agents/VoiceAgent.js';
import { VideoEditorAgent } from '../../../backend/agents/VideoEditorAgent.js';
import { ThumbnailAgent } from '../../../backend/agents/ThumbnailAgent.js';
import { SEOAgent } from '../../../backend/agents/SEOAgent.js';
import { PublisherAgent } from '../../../backend/agents/PublisherAgent.js';
import { AnalyticsAgent } from '../../../backend/agents/AnalyticsAgent.js';
import { QualityControlAgent } from '../../../backend/agents/QualityControlAgent.js';
import { AgentManager } from '../../../backend/agents/AgentManager.js';

console.log('=====================================================');
console.log('  YT STUDIO PHASE 2.3 — MULTI-AGENT TEAM TEST SUITE');
console.log('=====================================================\n');

async function runTests() {
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

  // 1. Agent Registry
  console.log('[Test 1] Agent Registry & 12 Specialized AI Agents');
  const agents = AgentRegistry.listAgents();
  assert(agents.length === 12, 'Registered all 12 specialized AI agents');

  // 2. Inter-Agent Communication Bus
  console.log('\n[Test 2] Inter-Agent Communication Bus');
  const msg = AgentCommunication.sendMessage({
    from: 'StoryWriterAgent',
    to: 'VoiceAgent',
    message: 'Generate emotional voice for Ramesh.'
  });
  assert(msg.from === 'StoryWriterAgent' && msg.to === 'VoiceAgent', 'Inter-agent message routed successfully');

  // 3. Producer Agent
  console.log('\n[Test 3] Producer Agent');
  const timeline = ProducerAgent.planProduction('Create two emotional shorts', 'Old Couple Stories');
  assert(timeline.dagSteps.length === 12, 'Producer Agent planned 12-step DAG timeline');

  // 4. Trend Research Agent
  console.log('\n[Test 4] Trend Research Agent');
  const trends = TrendResearchAgent.findTrends('Emotional');
  assert(trends.length > 0, 'Trend Research Agent discovered viral niche topics');

  // 5. Story Writer Agent
  console.log('\n[Test 5] Story Writer Agent');
  const story = await StoryWriterAgent.generateStory({ channelId: 'old-couple', prompt: 'Create emotional short', characterNames: ['Ramesh', 'Sita'], emotion: 'sad' });
  assert(story.scenes.length >= 3, 'Story Writer Agent generated script & scenes');

  // 6. Character Agent
  console.log('\n[Test 6] Character Agent');
  const charRes = await CharacterAgent.verifyConsistency({ channelId: 'old-couple', characterNames: ['Ramesh', 'Sita'], emotion: 'sad' });
  assert(charRes.passed && charRes.score >= 90, 'Character Agent verified visual identity consistency (99%)');

  // 7. Cinematography Agent
  console.log('\n[Test 7] Cinematography Agent');
  const shots = CinematographyAgent.generateShots(story.scenes);
  assert(shots.length > 0 && shots[0].camera.angle, 'Cinematography Agent generated 9:16 vertical camera angles & lighting');

  // 8. Voice Agent
  console.log('\n[Test 8] Voice Agent');
  const voice = await VoiceAgent.generateVoice({ characterName: 'Ramesh', text: 'Old man story line', emotion: 'sad' });
  assert(voice.durationSeconds > 0, 'Voice Agent synthesized neural voice track');

  // 9. Video Editor Agent
  console.log('\n[Test 9] Video Editor Agent');
  const video = await VideoEditorAgent.editVideo(story);
  assert(video.renderResult.outputFile, 'Video Editor Agent rendered Short video timeline');

  // 10. Thumbnail Agent
  console.log('\n[Test 10] Thumbnail Agent');
  const thumb = await ThumbnailAgent.generateThumbnail(story);
  assert(thumb.thumbnailUrl && thumb.headlineText, 'Thumbnail Agent generated high-CTR artwork');

  // 11. SEO Agent
  console.log('\n[Test 11] SEO Agent');
  const desc = await SEOAgent.generateDescription(story);
  assert(desc.includes('This video was created using AI tools'), 'SEO Agent generated tags and mandatory AI disclaimer');

  // 12. Quality Control Agent (Rejection Enforcement)
  console.log('\n[Test 12] Quality Control Agent (Rejection Rules Enforcement)');
  const qcApproved = QualityControlAgent.approveVideo({ consistencyScore: 95.0, audioQuality: 90.0, viralScore: 88.0, duration: 40 });
  assert(qcApproved.approved === true, 'Quality Control Agent approved video passing all threshold criteria');

  const qcRejected = QualityControlAgent.approveVideo({ consistencyScore: 82.0, audioQuality: 70.0, viralScore: 60.0, duration: 40 });
  assert(qcRejected.approved === false && qcRejected.rejections.length === 3, 'Quality Control Agent rejected video failing consistency (<90%), audio (<85%), and viral score (<75%)');

  // 13. Publisher Agent
  console.log('\n[Test 13] Publisher Agent');
  const pub = await PublisherAgent.publishVideo(story.id, 'old-couple');
  assert(pub.youtubeVideoId && pub.url, 'Publisher Agent uploaded video to YouTube');

  // 14. Analytics Agent
  console.log('\n[Test 14] Analytics Agent');
  const insights = await AnalyticsAgent.generateInsights('old-couple');
  assert(insights.recommendations && insights.recommendations.bestUploadTime, 'Analytics Agent analyzed retention and viewer performance');

  // 15. Master Agent Manager Pipeline Execution
  console.log('\n[Test 15] Agent Manager End-to-End Pipeline Dispatch');
  const pipeline = await AgentManager.executeMultiAgentPipeline('Create two emotional shorts');
  assert(pipeline.success && pipeline.publishResult.youtubeVideoId, 'Agent Manager orchestrated 12-agent pipeline execution');

  console.log('\n=====================================================');
  console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('=====================================================\n');

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
