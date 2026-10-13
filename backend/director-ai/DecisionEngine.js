import { db } from '../database/db.js';

export class DecisionEngine {
  static seriesMemory = new Map();
  static directorMemory = {
    successfulHooks: [
      'He waited 30 years for this moment...',
      'The flood took everything in less than 60 seconds...'
    ],
    failedHooks: [],
    successfulEmotions: ['sad', 'flood', 'emotional', 'horror'],
    topCharacters: ['Ramesh', 'Sita', 'Farmer', 'Village Boy'],
    bestUploadTimes: ['07:00 AM EST', '05:30 PM EST'],
    audiencePreferences: {
      endingStyle: 'Heartfelt Reunion',
      pacing: 'Fast 5-beat short structure'
    }
  };

  /**
   * Make autonomous story creation decisions
   */
  static makeDecision({ channelId = 'old-couple', userIntent = '' }) {
    const channel = db.getChannelById(channelId) || db.getChannels()[0];
    const channelName = channel ? channel.name : 'Old Couple Stories';

    const isFloodIntent = userIntent.toLowerCase().includes('flood');
    const isFunnyIntent = userIntent.toLowerCase().includes('funny');

    const emotion = isFloodIntent ? 'flood' : isFunnyIntent ? 'comedy' : 'sad';
    const characters = isFunnyIntent ? ['Village Boy', 'Bus Driver'] : isFloodIntent ? ['Farmer', 'Village Boy'] : ['Ramesh', 'Sita'];

    const decision = {
      decisionId: `dec_${Date.now()}`,
      channelId: channel ? channel.id : channelId,
      channelName,
      chosenEmotion: emotion,
      chosenCharacters: characters,
      duration: 40,
      seriesContinuation: true,
      seriesTitle: `${channelName} Series Arc #${Math.floor(Math.random() * 10) + 1}`,
      timestamp: new Date().toISOString()
    };

    db.addLog('story', {
      story_id: decision.decisionId,
      prompt_used: userIntent || `Autonomous choice for ${channelName}`,
      gemini_response: JSON.stringify(decision)
    });

    return decision;
  }

  // Series Intelligence
  static createSeries(title, channelId, characters = ['Ramesh', 'Sita']) {
    const series = {
      id: `series_${Date.now()}`,
      title,
      channelId,
      characters,
      episodesCount: 1,
      status: 'Active',
      created_at: new Date().toISOString()
    };
    this.seriesMemory.set(series.id, series);
    return series;
  }

  static continueSeries(seriesId) {
    const series = this.seriesMemory.get(seriesId);
    if (!series) throw new Error(`Series ${seriesId} not found`);
    series.episodesCount += 1;
    series.status = 'In Progress';
    return series;
  }

  static finishSeries(seriesId) {
    const series = this.seriesMemory.get(seriesId);
    if (!series) throw new Error(`Series ${seriesId} not found`);
    series.status = 'Completed';
    return series;
  }

  static getDirectorMemory() {
    return this.directorMemory;
  }
}
