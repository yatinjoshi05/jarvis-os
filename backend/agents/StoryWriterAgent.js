import { StoryEngine } from '../story-engine/StoryEngine.js';
import { StoryPlanner } from '../director-ai/StoryPlanner.js';
import { AgentCommunication } from './AgentCommunication.js';

export class StoryWriterAgent {
  static agentName = 'StoryWriterAgent';

  static async generateStory(payload) {
    const story = await StoryEngine.generateStory(payload);
    AgentCommunication.sendMessage({
      from: this.agentName,
      to: 'CharacterAgent',
      message: `Generated story "${story.title}". Context sent for character verification.`,
      payload: { storyId: story.id }
    });
    return story;
  }

  static generateHook(channelName, emotion, characterName) {
    return StoryPlanner.generateHook(channelName, emotion, characterName);
  }

  static generateDialogue(story) {
    return (story.scenes || []).map(s => ({
      character: s.character || 'Ramesh',
      line: s.narration || s.text || 'Dialogue line'
    }));
  }

  static generateEnding(story) {
    return story.ending || 'Heartfelt emotional resolution.';
  }
}
