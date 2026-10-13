import { EmotionEngine } from '../../../backend/director-ai/EmotionEngine.js';
import { TrendAnalyzer } from '../../../backend/director-ai/TrendAnalyzer.js';
import { StoryPlanner } from '../../../backend/director-ai/StoryPlanner.js';
import { AudienceAnalyzer } from '../../../backend/director-ai/AudienceAnalyzer.js';
import { RetentionPredictor } from '../../../backend/director-ai/RetentionPredictor.js';
import { ViralScoreEngine } from '../../../backend/director-ai/ViralScoreEngine.js';
import { UploadOptimizer } from '../../../backend/director-ai/UploadOptimizer.js';
import { DecisionEngine } from '../../../backend/director-ai/DecisionEngine.js';
import { DirectorEngine } from '../../../backend/director-ai/DirectorEngine.js';

console.log('=====================================================');
console.log('  YT STUDIO PHASE 2.2 — DIRECTOR AI TEST SUITE');
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

  // 1. Emotion Engine
  console.log('[Test 1] Emotion Engine (14 Supported Emotions & Ranking)');
  assert(EmotionEngine.supportedEmotions.length === 14, 'Supported 14 core emotions');
  const chosenEmotion = EmotionEngine.chooseEmotion('Natural Disaster Stories');
  assert(chosenEmotion === 'flood', 'Selected "flood" emotion for disaster niche');

  const mixed = EmotionEngine.mixEmotions('sad', 'inspirational');
  assert(mixed.mixedTag === 'sad & inspirational', 'Mixed primary and secondary emotions');

  // 2. Trend Analyzer
  console.log('\n[Test 2] Trend Analyzer');
  const trends = TrendAnalyzer.findTrendingTopics('Emotional');
  assert(trends.length > 0 && trends[0].topic, 'Discovered trending topics and search volume');

  const trendingEmotions = TrendAnalyzer.findTrendingEmotions();
  assert(trendingEmotions.length >= 4, 'Retrieved trending emotions across YouTube');

  // 3. Story Planner & Hook Engine
  console.log('\n[Test 3] Story Planner & Hook Engine (5 Timestamp Beats)');
  const storyPlan = StoryPlanner.planStoryStructure('Old Couple Stories', 'sad', ['Ramesh', 'Sita']);
  assert(storyPlan.timestampBeats.length === 5, 'Planned 5-beat timestamp structure (0-3s, 3-10s, 10-20s, 20-30s, 30-40s)');
  assert(storyPlan.bestHook && storyPlan.bestHook.score > 80, 'Generated and selected top scored hook');

  // 4. Audience Analyzer
  console.log('\n[Test 4] Audience Analyzer');
  const audience = AudienceAnalyzer.analyzeAudience('old-couple');
  assert(audience.avgRetention && audience.preferredEmotions.includes('sad'), 'Analyzed audience watch time, sentiment, and preferred emotions');

  // 5. Retention Predictor
  console.log('\n[Test 5] Retention Predictor (Drop Points & Completion Probability)');
  const retention = RetentionPredictor.predictRetention({ hookScore: 92, emotion: 'sad', characterPopularity: 98 });
  assert(retention.retention_score >= 90 && retention.drop_points.length === 2 && retention.completion_probability > 80, 'Predicted retention score, drop points [12, 27], and completion probability');

  // 6. Viral Score Engine & Threshold Check (< 75 Auto-Regeneration)
  console.log('\n[Test 6] Viral Score Engine (< 75 Threshold Rule)');
  const viralResult = ViralScoreEngine.calculateViralScore({ hookScore: 94, emotionStrength: 92, trendMatch: 90, characterPopularity: 96, retentionScore: 94 });
  assert(viralResult.viral_score >= 90 && viralResult.confidence >= 85, `Calculated viral score ${viralResult.viral_score} (Confidence ${viralResult.confidence}%)`);

  const lowViralResult = ViralScoreEngine.calculateViralScore({ hookScore: 50, emotionStrength: 50, trendMatch: 50, characterPopularity: 50, retentionScore: 50 });
  assert(lowViralResult.requiresRegeneration === true, 'Triggered auto-regeneration requirement when viral score < 75');

  // 7. Upload Optimizer
  console.log('\n[Test 7] Upload Optimizer');
  const uploadRec = UploadOptimizer.recommendUploadTime('old-couple');
  assert(uploadRec.bestWindow.includes('07:00 AM') && uploadRec.activityMultiplier, 'Recommended optimal 07:00 AM peak upload window');

  const tags = UploadOptimizer.generateHashtags('Emotional Storytelling');
  assert(tags.length >= 5 && tags[0] === '#EmotionalStorytelling', 'Generated high-ranking hashtags');

  // 8. Decision Engine & Series Intelligence
  console.log('\n[Test 8] Decision Engine & Series Intelligence');
  const decision = DecisionEngine.makeDecision({ channelId: 'old-couple', userIntent: 'Create two emotional shorts' });
  assert(decision.chosenEmotion === 'sad' && decision.chosenCharacters.includes('Ramesh'), 'Autonomous decision engine selected emotion and character cast');

  const series = DecisionEngine.createSeries('Old Couple Village Journey', 'old-couple');
  assert(series.episodesCount === 1, 'Created new continuous story series');
  const continued = DecisionEngine.continueSeries(series.id);
  assert(continued.episodesCount === 2, 'Continued story series episode count');

  // 9. Master Director Engine & Pipeline Execution
  console.log('\n[Test 9] Master Director Engine & Command Pipeline');
  const plan = await DirectorEngine.processUserCommand('Create two emotional shorts for Old Couple Stories');
  assert(plan.status === 'DISPATCHED_TO_VIDEO_FACTORY' && plan.viralScore.viral_score >= 90, 'Parsed command, executed 10-step pipeline, and dispatched to Video Factory');

  // 10. Safety Rules Verification
  console.log('\n[Test 10] Safety Rules Verification');
  try {
    DirectorEngine.validateSafety('Create copyrighted spam video');
    assert(false, 'Should have failed safety check');
  } catch (err) {
    assert(err.message.includes('Safety Warning'), 'Blocked unsafe/copyrighted/spam command');
  }

  console.log('\n=====================================================');
  console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('=====================================================\n');

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
