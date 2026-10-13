export class FeedbackAnalyzer {
  static analyzeFeedback(channelId = 'old-couple') {
    return {
      channelId,
      retentionScore: 89.4,
      ctrScore: 9.2,
      sentimentAnalysis: '99% Positive & Emotional',
      topUserComments: [
        'Ramesh uncle brought tears to my eyes 🥹',
        'Sita & Ramesh are the best characters!',
        'Please upload more flood stories!'
      ],
      audienceReactionSummary: 'High emotional connection and demand for village storylines.'
    };
  }
}
