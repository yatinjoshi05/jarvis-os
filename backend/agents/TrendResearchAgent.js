import { TrendAnalyzer } from '../director-ai/TrendAnalyzer.js';
import { AgentCommunication } from './AgentCommunication.js';

export class TrendResearchAgent {
  static agentName = 'TrendResearchAgent';

  static findTrends(niche) {
    const trends = TrendAnalyzer.findTrendingTopics(niche);
    AgentCommunication.sendMessage({
      from: this.agentName,
      to: 'StoryWriterAgent',
      message: `Discovered top trends for niche ${niche}`,
      payload: { trends }
    });
    return trends;
  }

  static findTopics(channelName) {
    return TrendAnalyzer.recommendTopics(channelName);
  }

  static analyzeCompetition(niche = 'Emotional Stories') {
    return { niche, topCompetitorsCount: 12, avgCompetitorViews: '120K', marketGap: 'Sad Flood Stories' };
  }

  static predictDemand(topic) {
    return { topic, predictedSearchVolume: '240K/mo', viralDemandScore: 94.2 };
  }
}
