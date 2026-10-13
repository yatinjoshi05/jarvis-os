export class TrendAnalyzer {
  static trendingTopics = [
    { topic: 'Old Couple Last Wish', niche: 'Emotional Drama', searchVolume: '140K/mo', growth: '+42%' },
    { topic: 'Devastating Village Flood', niche: 'Natural Disaster Stories', searchVolume: '210K/mo', growth: '+58%' },
    { topic: 'Highway Bus Driver Miracle', niche: 'Highway Thrillers', searchVolume: '95K/mo', growth: '+31%' },
    { topic: 'Dad Funny Escape Plan', niche: 'Comedy Shorts', searchVolume: '180K/mo', growth: '+24%' },
    { topic: 'Ancient Village Secret', niche: 'Historical Mysteries', searchVolume: '160K/mo', growth: '+36%' }
  ];

  /**
   * Find top trending topics
   */
  static findTrendingTopics(niche) {
    if (!niche) return this.trendingTopics;
    return this.trendingTopics.filter(t => t.niche.toLowerCase().includes(niche.toLowerCase()) || niche.toLowerCase().includes(t.niche.toLowerCase()));
  }

  /**
   * Find top trending emotions across YouTube
   */
  static findTrendingEmotions() {
    return [
      { emotion: 'Sad & Emotional', trendScore: 98.4, growth: '+37%' },
      { emotion: 'Disaster Survival (Flood)', trendScore: 96.2, growth: '+41%' },
      { emotion: 'Supernatural Suspense', trendScore: 92.1, growth: '+39%' },
      { emotion: 'Wholesome Family Comedy', trendScore: 88.5, growth: '+28%' }
    ];
  }

  /**
   * Find top trending characters
   */
  static findTrendingCharacters() {
    return [
      { characterName: 'Ramesh', popularity: '98%', videosAppeared: 42, resonance: 'Very High' },
      { characterName: 'Sita', popularity: '96%', videosAppeared: 38, resonance: 'Very High' },
      { characterName: 'Farmer', popularity: '94%', videosAppeared: 35, resonance: 'High' },
      { characterName: 'Village Boy', popularity: '91%', videosAppeared: 29, resonance: 'High' }
    ];
  }

  /**
   * Recommend viral topics for channel
   */
  static recommendTopics(channelName) {
    const channelLower = (channelName || '').toLowerCase();
    if (channelLower.includes('flood')) {
      return ['Village River Overflow Miracle', 'Mother Rescues Children in Flood', 'Farmer Loss and Rebirth'];
    }
    if (channelLower.includes('old couple')) {
      return ["Old Man's Last Wish", '40 Years Letter Discovery', 'Grandfather Golden Anniversary'];
    }
    if (channelLower.includes('funny')) {
      return ["Dad's Secret Plan", 'Son vs Mom Homework Battle', 'Funny Village Festival Prank'];
    }
    return ['Miracle on the Highway', 'Village Reunion After 30 Years', 'Ancient Village Mystery Unlocked'];
  }
}
