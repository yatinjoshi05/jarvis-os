import { CharacterEngine } from '../character-engine/CharacterEngine.js';
import { VoiceProfileManager } from '../character-memory/VoiceProfileManager.js';
import { AgentCommunication } from './AgentCommunication.js';

export class VoiceAgent {
  static agentName = 'VoiceAgent';

  static async generateVoice({ characterName = 'Ramesh', text = 'Narration', emotion = 'Emotional' }) {
    const res = await CharacterEngine.generateVoice({ characterName, text, emotion });
    AgentCommunication.sendMessage({
      from: this.agentName,
      to: 'VideoEditorAgent',
      message: `Generated neural voice track for ${characterName} (${res.durationSeconds}s).`,
      payload: { audioUrl: res.audioUrl, durationSeconds: res.durationSeconds }
    });
    return res;
  }

  static verifyVoice(characterId, pitch) {
    return VoiceProfileManager.verifyVoiceProfile(characterId, { pitch });
  }

  static syncDialogue(dialogues = []) {
    return dialogues.map(d => ({
      ...d,
      audioSynced: true,
      audioDuration: Math.max(3, Math.ceil((d.line || d.text || '').length / 15))
    }));
  }

  static adjustEmotion(voiceProfile, newEmotion) {
    return { ...voiceProfile, emotion: newEmotion };
  }
}
