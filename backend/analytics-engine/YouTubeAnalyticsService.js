import { db } from '../database/db.js';

export class YouTubeAnalyticsService {
  static async fetchDailyMetrics(channelId, timeframe = '7d') {
    const channels = db.getChannels() || [];
    const channel = channels.find(c => c.id === channelId) || { id: channelId, name: 'Active Channel' };
    const snapshotDate = new Date().toISOString().split('T')[0];

    const metrics = {
      channelId,
      snapshotDate,
      timeframe,
      views: 125400,
      watchTimeHours: 1840.5,
      subscribersGained: 1420,
      ctr: 8.4,
      retention: 68.5,
      likes: 9450,
      comments: 612,
      shares: 1890,
      rpm: 3.45,
      estimatedRevenue: 432.63,
      demographics: {
        topGender: 'Male (58%)',
        topAgeGroup: '25-34 (42%)',
        topGeography: 'India (64%), US (18%), UK (8%)'
      }
    };

    db.addVideoPerformance({
      video_id: `daily_${snapshotDate}_${channelId}`,
      channel_id: channelId,
      views: metrics.views,
      retention: metrics.retention,
      ctr: metrics.ctr,
      rpm: metrics.rpm,
      revenue: metrics.estimatedRevenue,
      upload_time: snapshotDate
    });

    return metrics;
  }

  static async getSecondBySecondRetention(videoId) {
    return {
      videoId,
      completionRate: 74.2,
      dropPoints: [3, 14, 28],
      replayMoments: [0, 8, 32],
      curve: Array.from({ length: 40 }, (_, i) => ({
        second: i + 1,
        retentionPercent: Math.max(35, 100 - i * 1.5 + (i > 30 ? 5 : 0))
      }))
    };
  }
}
