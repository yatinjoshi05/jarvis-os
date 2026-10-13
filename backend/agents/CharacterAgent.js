import { CharacterProfileManager } from '../character-memory/CharacterProfileManager.js';
import { CharacterRelationshipEngine } from '../character-memory/CharacterRelationshipEngine.js';
import { CharacterConsistencyEngine } from '../character-memory/CharacterConsistencyEngine.js';
import { AgentCommunication } from './AgentCommunication.js';

export class CharacterAgent {
  static agentName = 'CharacterAgent';

  static loadCharacters(characterNames = ['Ramesh', 'Sita']) {
    return characterNames.map(name => CharacterProfileManager.getProfileByName(name) || CharacterProfileManager.getProfiles()[0]);
  }

  static updateRelationships(charA, charB, relationship, strength = 95) {
    return CharacterRelationshipEngine.setRelationship(charA, charB, relationship, strength);
  }

  static async verifyConsistency(payload) {
    const res = await CharacterConsistencyEngine.executePipeline(payload);
    AgentCommunication.sendMessage({
      from: this.agentName,
      to: 'CinematographyAgent',
      message: `Verified character consistency (Score: ${res.score}%). Ready for shot planning.`,
      payload: { score: res.score, passed: res.passed }
    });
    return res;
  }

  static generateCharacterContext(characterId) {
    const profile = CharacterProfileManager.getProfileById(characterId);
    return profile ? `Character context for ${profile.name}: ${profile.personality}, ${profile.hair_style}, ${profile.beard_style}` : 'Default character context';
  }
}
