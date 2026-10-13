export class AudienceAnalyzer {
  /**
   * Analyze audience demographic and engagement metrics
   */
  static analyzeAudience(channelId = 'old-couple') {
    const channelLower = (channelId || '').toLowerCase();

    if (channelLower.includes('flood')) {
      return {
        ageGroup: '18-45 Years',
        topLocations: ['India', 'Bangladesh', 'Nepal', 'United States'],
        avgWatchTime: '34.2s',
        avgRetention: '85.5%',
        commentSentiment: '98% Sympathetic & Emotional',
        likeToViewRatio: '8.4%',
        shareRate: '5.2%',
        preferredEmotions: ['flood', 'tragedy', 'survival', 'inspirational'],
        preferredCharacters: ['Farmer', 'Village Boy'],
        preferredEndings: ['Hopeful Restoration'],
        bestStoryStyle: 'Dramatic Disaster Survival'
      };
    }

    if (channelLower.includes('funny')) {
      return {
        ageGroup: '13-34 Years',
        topLocations: ['India', 'United States', 'United Kingdom', 'Canada'],
        avgWatchTime: '29.8s',
        avgRetention: '82.1%',
        commentSentiment: '96% Humorous & Joyful',
        likeToViewRatio: '9.1%',
        shareRate: '6.8%',
        preferredEmotions: ['comedy', 'family', 'friendship'],
        preferredCharacters: ['Village Boy', 'Bus Driver'],
        preferredEndings: ['Humorous Twist'],
        bestStoryStyle: 'Fast-paced Comedy'
      };
    }

    return {
      ageGroup: '25-65+ Years',
      topLocations: ['India', 'United States', 'United Arab Emirates', 'Canada'],
      avgWatchTime: '36.5s',
      avgRetention: '89.4%',
      commentSentiment: '99% Emotional & Deeply Touched',
      likeToViewRatio: '10.2%',
      shareRate: '7.4%',
      preferredEmotions: ['sad', 'emotional', 'romance', 'family'],
      preferredCharacters: ['Ramesh', 'Sita'],
      preferredEndings: ['Heartfelt Reunion'],
      bestStoryStyle: 'Cinematic Emotional Drama'
    };
  }
}
