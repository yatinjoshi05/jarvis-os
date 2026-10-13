import { db } from '../database/db.js';

export class FailureAnalyzer {
  static analyzeFailure({ videoId = 'vid_failed_01', retention = 62, ctr = 4.2 }) {
    const problems = [];
    const fixes = [];

    if (retention < 75) {
      problems.push('Weak hook or slow intro pacing');
      fixes.push('Inject high-stakes emotional question in first 3 seconds');
    }
    if (ctr < 6.0) {
      problems.push('Low thumbnail CTR or uninspiring headline');
      fixes.push('Use high-contrast facial close-up with bold 3-word headline');
    }

    const diagnosis = {
      videoId,
      problemsDetected: problems,
      recommendedFixes: fixes,
      lessonStored: true
    };

    db.addImprovement({
      source_video: videoId,
      problem_detected: problems.join('; '),
      recommendation: fixes.join('; '),
      applied: false,
      improvement_score: 90
    });

    return diagnosis;
  }

  static generateFix(problem) {
    if (problem.includes('hook')) return 'Use shocking curiosity hook format';
    if (problem.includes('thumbnail')) return 'Switch to yellow text on dark background';
    return 'Increase emotional peak intensity in Act 2';
  }

  static storeLessons(lesson) {
    return db.addLog('learning', { lesson, timestamp: new Date().toISOString() });
  }
}
