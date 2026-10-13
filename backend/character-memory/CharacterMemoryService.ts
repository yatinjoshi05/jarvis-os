import { CharacterProfileManager } from './CharacterProfileManager.js';
import { FaceReferenceManager } from './FaceReferenceManager.js';
import { VoiceProfileManager } from './VoiceProfileManager.js';
import { CharacterRelationshipEngine } from './CharacterRelationshipEngine.js';
import { CharacterGenerator } from './CharacterGenerator.js';
import { CharacterConsistencyEngine } from './CharacterConsistencyEngine.js';

export class CharacterMemoryService {
  static getVaultCharacters() {
    const profiles = CharacterProfileManager.getProfiles();
    const relationships = CharacterRelationshipEngine.getRelationships();

    return profiles.map(char => {
      const rel = relationships.find(r => r.character_a === char.id || r.character_b === char.id);
      return {
        ...char,
        visualMemory: FaceReferenceManager.getVisualMemory(char.id),
        voiceProfile: VoiceProfileManager.getVoiceProfile(char.id),
        relationshipDetail: rel ? rel.relationship : char.relationships
      };
    });
  }

  static createCharacter(data: any) {
    return CharacterProfileManager.createProfile(data);
  }

  static updateCharacter(id: string, updates: any) {
    return CharacterProfileManager.updateProfile(id, updates);
  }

  static lockCharacter(id: string, isLocked: boolean) {
    return CharacterProfileManager.toggleLock(id, isLocked);
  }

  static previewVoice(id: string) {
    return VoiceProfileManager.getVoiceProfile(id);
  }

  static verifyConsistency(payload: any) {
    return CharacterConsistencyEngine.executePipeline(payload);
  }
}
