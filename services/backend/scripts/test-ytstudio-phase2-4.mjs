import { db } from '../../../backend/database/db.js';
import { AudienceMemory } from '../../../backend/self-learning/AudienceMemory.js';
import { PatternDetector } from '../../../backend/self-learning/PatternDetector.js';
import { FailureAnalyzer } from '../../../backend/self-learning/FailureAnalyzer.js';
import { RetentionLearner } from '../../../backend/self-learning/RetentionLearner.js';
import { ThumbnailLearner } from '../../../backend/self-learning/ThumbnailLearner.js';
import { SEOOptimizer } from '../../../backend/self-learning/SEOOptimizer.js';
import { FeedbackAnalyzer } from '../../../backend/self-learning/FeedbackAnalyzer.js';
import { ImprovementEngine } from '../../../backend/self-learning/ImprovementEngine.js';
import { KnowledgeGraph } from '../../../backend/self-learning/KnowledgeGraph.js';
import { ExperimentEngine } from '../../../backend/self-learning/ExperimentEngine.js';
import { PerformancePredictor } from '../../../backend/self-learning/PerformancePredictor.js';
import { LearningEngine } from '../../../backend/self-learning/LearningEngine.js';

console.log('=====================================================');
console.log('  YT STUDIO PHASE 2.4 — SELF-LEARNING ENGINE TEST SUITE');
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

  // 1. Database Table Persistence
  console.log('[Test 1] Database Tables Persistence (video_performance, learning_patterns, improvements)');
  const perfRecord = db.addVideoPerformance({ video_id: 'v101', channel_id: 'old-couple', views: 95000, retention: 89.5, ctr: 9.4 });
  assert(perfRecord.id && perfRecord.views === 95000, 'Persisted video_performance record');

  const patternRecord = db.addLearningPattern({ pattern_type: 'EMOTION_RETENTION', confidence: 96, success_rate: 94.2 });
  assert(patternRecord.id && patternRecord.confidence === 96, 'Persisted learning_patterns record');

  // 2. Audience Memory
  console.log('\n[Test 2] Audience Memory');
  const prefs = AudienceMemory.loadAudiencePreferences();
  assert(prefs.favoriteEmotions.includes('sad') && prefs.favoriteCharacters.includes('Ramesh'), 'Loaded audience preferences (favorite characters & emotions)');

  // 3. Pattern Detector
  console.log('\n[Test 3] Pattern Detector');
  const patterns = PatternDetector.detectPatterns();
  assert(patterns.length >= 4, 'Discovered winning patterns across retention, niches, and characters');

  // 4. Failure Analyzer
  console.log('\n[Test 4] Failure Analyzer');
  const failure = FailureAnalyzer.analyzeFailure({ videoId: 'vid_weak_01', retention: 64, ctr: 4.5 });
  assert(failure.problemsDetected.length === 2 && failure.recommendedFixes.length === 2, 'Diagnosed video failure and generated fixes');

  // 5. Retention Learner
  console.log('\n[Test 5] Retention Learner');
  const retentionData = RetentionLearner.analyzeRetentionCurve({ dropPoints: [12, 27], avgWatchTime: 34.5 });
  assert(retentionData.suggestedEdits.length === 2 && retentionData.replayMoments.length === 2, 'Analyzed retention drop-off points and suggested pacing edits');

  // 6. Thumbnail Learner
  console.log('\n[Test 6] Thumbnail Learner');
  const thumbData = ThumbnailLearner.learnThumbnailPatterns();
  assert(thumbData.avgCTR && thumbData.winningStyle, 'Analyzed winning thumbnail CTR styles & color combinations');

  // 7. SEO Optimizer
  console.log('\n[Test 7] SEO Optimizer');
  const seoRes = SEOOptimizer.improveSEO('Old Man Miracle', 'Story description');
  assert(seoRes.improvedTitle.includes('#Shorts') && seoRes.improvedDesc.includes('AI tools'), 'Improved title formatting and enforced mandatory AI disclaimer');

  // 8. Feedback Analyzer
  console.log('\n[Test 8] Feedback Analyzer');
  const feedback = FeedbackAnalyzer.analyzeFeedback('old-couple');
  assert(feedback.topUserComments.length >= 3 && feedback.sentimentAnalysis.includes('Positive'), 'Analyzed comments and audience sentiment');

  // 9. Improvement Engine
  console.log('\n[Test 9] Improvement Engine');
  const improvements = ImprovementEngine.generateImprovements();
  assert(improvements.length >= 3, 'Generated automated prompt & pacing improvements');

  // 10. Knowledge Graph
  console.log('\n[Test 10] Knowledge Graph');
  const graphNodes = KnowledgeGraph.getGraph();
  assert(graphNodes.length >= 3 && graphNodes[0].character === 'Ramesh', 'Built Knowledge Graph relationship nodes');

  // 11. Experiment Engine
  console.log('\n[Test 11] Experiment Engine (A/B Testing)');
  const exp = ExperimentEngine.runExperiment({ testType: 'THUMBNAIL_CTR', variantA: 'Yellow Text', variantB: 'White Text' });
  const winner = ExperimentEngine.saveWinner(exp.id);
  assert(winner.winner && winner.saved === true, 'Executed split test experiment and saved winning variant');

  // 12. Performance Predictor
  console.log('\n[Test 12] Performance Predictor Model');
  const prediction = PerformancePredictor.predictPerformance({ viralScore: 92, hookScore: 90, characterPopularity: 96 });
  assert(prediction.estimated_views > 80000 && prediction.estimated_retention > 80 && prediction.viral_probability >= 80, `Predicted metrics (Views: ${prediction.estimated_views}, Retention: ${prediction.estimated_retention}%, CTR: ${prediction.estimated_ctr}%)`);

  // 13. Master Learning Engine 24-Hour Cycle
  console.log('\n[Test 13] Master Learning Engine (24-Hour Self-Improvement Cycle)');
  const cycle = LearningEngine.run24HourCycle();
  assert(cycle.analyzedVideosCount > 0 && cycle.improvementsGenerated > 0, 'Executed 24-hour continuous self-improvement loop');

  // 14. Autonomous Mode Toggle
  console.log('\n[Test 14] Autonomous Optimization Mode Toggle');
  const autoMode = LearningEngine.setAutonomousMode(true);
  assert(autoMode.autonomousMode === true, 'Autonomous optimization mode enabled');

  console.log('\n=====================================================');
  console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('=====================================================\n');

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
