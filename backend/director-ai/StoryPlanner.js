export class StoryPlanner {
  /**
   * Generate multiple hook options across styles (shocking, emotional, curiosity, mystery, funny, inspirational)
   */
  static generateHook(channelName, emotion, characterName = 'Ramesh') {
    const channelLower = (channelName || '').toLowerCase();
    const emotionLower = (emotion || '').toLowerCase();

    const hooks = [
      { style: 'emotional', text: `${characterName} waited 30 years for this moment...` },
      { style: 'shocking', text: `The flood took everything in less than 60 seconds...` },
      { style: 'curiosity', text: `Nobody expected what was hidden inside the old chest...` },
      { style: 'mystery', text: `He found a letter dated 40 years ago with his name on it...` },
      { style: 'funny', text: `Dad thought his secret escape plan was foolproof...` },
      { style: 'inspirational', text: `When everyone gave up, he stood alone against the storm...` }
    ];

    if (emotionLower.includes('flood') || channelLower.includes('flood')) {
      return [
        { style: 'shocking', text: `The flood took everything in less than 60 seconds...` },
        { style: 'emotional', text: `He held his grandson tight as the waters rose...` },
        { style: 'curiosity', text: `When the water receded, they found something unbelievable...` }
      ];
    }

    if (emotionLower.includes('comedy') || channelLower.includes('funny')) {
      return [
        { style: 'funny', text: `Dad thought his secret escape plan was foolproof...` },
        { style: 'curiosity', text: `You won't believe what happened when Mom walked into the kitchen...` }
      ];
    }

    return hooks;
  }

  /**
   * Score a hook text for viral retention impact (0-100)
   */
  static scoreHook(hookText) {
    let score = 80;
    if (hookText.includes('30 years') || hookText.includes('took everything')) score += 12;
    if (hookText.includes('Nobody expected') || hookText.includes('secret')) score += 10;
    if (hookText.endsWith('...')) score += 3;
    return Math.min(99, score);
  }

  /**
   * Select best performing hook from generated options
   */
  static selectBestHook(channelName, emotion, characterName) {
    const hooks = this.generateHook(channelName, emotion, characterName);
    const scored = hooks.map(h => ({ ...h, score: this.scoreHook(h.text) }));
    scored.sort((a, b) => b.score - a.score);
    return scored[0];
  }

  /**
   * Plan 5-beat timestamp story structure
   */
  static planStoryStructure(channelName, emotion, characters = ['Ramesh', 'Sita']) {
    const bestHook = this.selectBestHook(channelName, emotion, characters[0]);

    return {
      duration: 40,
      timestampBeats: [
        { timeRange: '0-3 sec', phase: 'Strong Hook', content: bestHook.text, hookStyle: bestHook.style, score: bestHook.score },
        { timeRange: '3-10 sec', phase: 'Character Intro', content: `Introduce ${characters.join(' and ')} in their daily environment.` },
        { timeRange: '10-20 sec', phase: 'Conflict', content: `Rising emotional conflict and obstacle revealed.` },
        { timeRange: '20-30 sec', phase: 'Emotional Peak', content: `Pivotal moment of truth and emotional intensity.` },
        { timeRange: '30-40 sec', phase: 'Climax & Ending', content: `Heartfelt resolution and subscribe call-to-action.` }
      ],
      bestHook
    };
  }
}
