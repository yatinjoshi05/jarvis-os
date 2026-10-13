import { StrategyBrain } from '../analytics-engine/StrategyBrain.js';
import { AgentCommunication } from './AgentCommunication.js';

export class AnalyticsAgent {
  static agentName = 'AnalyticsAgent';

  static async analyzeRetention(channelId = 'old-couple') {
    const data = await StrategyBrain.analyzePerformance();
    return data.overview;
  }

  static async analyzeViews(channelId) {
    const data = await StrategyBrain.analyzePerformance();
    return { views: data.overview.viewsToday, subscribersGained: data.overview.subscribersGained };
  }

  static analyzeComments(channelId) {
    return { positiveRatio: '98%', sentiment: 'Deeply Moved & Touched', topEmoji: '🥹❤️' };
  }

  static async generateInsights(channelId) {
    const data = await StrategyBrain.analyzePerformance();
    AgentCommunication.sendMessage({
      from: this.agentName,
      to: 'ProducerAgent',
      message: `Analyzed retention & growth insights for channel. Recommending +2 daily uploads.`,
      payload: { recommendations: data.recommendations }
    });
    return data;
  }
}
