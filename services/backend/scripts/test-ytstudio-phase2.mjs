import { db } from '../../../backend/database/db.js';
import { encryptToken, decryptToken } from '../../../backend/database/encryption.js';
import { ChannelManager } from '../../../backend/channel-manager/ChannelManager.js';
import { CharacterEngine } from '../../../backend/character-engine/CharacterEngine.js';
import { StoryEngine } from '../../../backend/story-engine/StoryEngine.js';
import { VideoFactory } from '../../../backend/video-factory/VideoFactory.js';
import { UploadEngine } from '../../../backend/upload-engine/UploadEngine.js';
import { YTEngine } from '../../../backend/yt-engine/YTEngine.js';
import { StrategyBrain } from '../../../backend/analytics-engine/StrategyBrain.js';
import { queueManager } from '../../../backend/queue/QueueSystem.js';

console.log('=====================================================');
console.log('  YT STUDIO PHASE 2 — BACKEND INTEGRATION TEST SUITE');
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

  // 1. Encryption Test
  console.log('[Test 1] AES-256 Token Encryption & Decryption');
  const token = 'oauth2_bearer_v3_test_secret_token_98765';
  const encrypted = encryptToken(token);
  const decrypted = decryptToken(encrypted);
  assert(encrypted !== token && encrypted.includes(':'), 'Token encrypted with IV and Auth Tag');
  assert(decrypted === token, 'Token decrypted back accurately');

  // 2. Database & Channel Manager
  console.log('\n[Test 2] Channel Manager & Database Vault (10 Channels)');
  const channels = await ChannelManager.listChannels();
  assert(channels.length === 10, 'Found all 10 Vault Channels in persistent storage');

  const synced = await ChannelManager.syncChannel('old-couple');
  assert(synced.synced === true && synced.channel.status === 'Connected', 'Channel sync executed successfully');

  // 3. Character Engine & Consistency
  console.log('\n[Test 3] Character Engine & Consistency Rules');
  const characters = await CharacterEngine.listCharacters();
  assert(characters.length >= 5, 'Persistent Character Database loaded');
  
  const ramesh = characters.find(c => c.name === 'Ramesh');
  assert(ramesh && ramesh.voice_style.includes('Deep'), 'Character Ramesh preserves voice style and personality');

  const voiceRes = await CharacterEngine.generateVoice({ characterName: 'Ramesh', text: 'Sita, look at this village path.' });
  assert(voiceRes.success && voiceRes.provider === 'Google Flow Voice AI', 'Google Flow voice synthesis generated');

  // 4. Story Engine
  console.log('\n[Test 4] Story Engine Gemini Generation');
  const story = await StoryEngine.generateStory({
    channel: 'Old Couple Stories',
    emotion: 'Sad',
    duration: 40,
    characters: ['Ramesh', 'Sita'],
    goal: 'maximize retention'
  });
  assert(story.title && story.scenes.length === 5 && story.hashtags.length > 0, 'Gemini Story Engine produced structured script & 5 scenes');

  // 5. Video Factory & Render
  console.log('\n[Test 5] Video Factory & FFmpeg Pipeline');
  const renderRes = await VideoFactory.renderVideo(story);
  assert(renderRes.renderResult.success && renderRes.renderResult.fps === 30, 'Video Factory rendered 1080x1920 Short video at 30 FPS');

  // 6. Queue System (BullMQ)
  console.log('\n[Test 6] Queue System (script, scene, voice, render, upload queues)');
  const job = await queueManager.addJob('render_queue', { storyId: story.id });
  assert(job && job.queueName === 'render_queue', 'Queue System enqueued job and initiated progress tracking');

  // 7. Upload Engine & AI Disclaimer Mandate
  console.log('\n[Test 7] Upload Engine & Mandatory AI Disclaimer');
  const uploadRes = await UploadEngine.uploadVideo(story.id, 'old-couple');
  assert(uploadRes.success && uploadRes.disclaimerAppended === true, 'Upload Engine executed YouTube Data API upload and appended mandatory AI disclaimer');

  // 8. Strategy Brain
  console.log('\n[Test 8] Strategy Brain Insights');
  const strategy = await StrategyBrain.analyzePerformance();
  assert(strategy.cards.length === 6 && strategy.recommendations.bestUploadTime, 'Strategy Brain analyzed retention, views, CTR, and generated recommendations');

  // 9. API Center & Health
  console.log('\n[Test 9] API Center Health & Connection Test');
  const testConn = await YTEngine.testApiConnection('gemini-api');
  assert(testConn.status.includes('Active'), 'API Center bridge connection test succeeded');

  // 10. Logging
  console.log('\n[Test 10] Logging System');
  const logs = db.getLogs('api');
  assert(Array.isArray(logs) && logs.length > 0, 'Logging system recorded API logs');

  console.log('\n=====================================================');
  console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('=====================================================\n');

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
