import { CharacterProfileManager } from './CharacterProfileManager.js';

export interface VoiceProfile {
  characterId: string;
  voiceStyle: string;
  pitch: number;
  speed: number;
  accent: string;
  emotion: string;
}

export class VoiceProfileManager {
  /**
   * Get fixed persistent voice parameters for a character
   */
  static getVoiceProfile(characterId: string): VoiceProfile {
    const char = CharacterProfileManager.getProfileById(characterId);
    if (!char) {
      return {
        characterId,
        voiceStyle: 'Google Flow Neural Voice',
        pitch: 1.0,
        speed: 1.0,
        accent: 'Standard',
        emotion: 'Neutral'
      };
    }

    // Ramesh rule: deep voice, pitch 0.85
    // Sita rule: soft voice, pitch 1.15
    const isRamesh = char.name.toLowerCase() === 'ramesh';
    const isSita = char.name.toLowerCase() === 'sita';

    return {
      characterId,
      voiceStyle: char.voice_style,
      pitch: isRamesh ? 0.85 : isSita ? 1.15 : 1.0,
      speed: 1.0,
      accent: char.accent,
      emotion: char.emotion_range?.[0] || 'Neutral'
    };
  }

  /**
   * Verify voice profile parameters to prevent random voice regeneration
   */
  static verifyVoiceProfile(characterId: string, voiceParams: Partial<VoiceProfile>): { valid: boolean; warning?: string } {
    const expected = this.getVoiceProfile(characterId);
    
    if (voiceParams.pitch && Math.abs(voiceParams.pitch - expected.pitch) > 0.2) {
      return { valid: false, warning: 'Voice mismatch detected: Pitch drift out of bounds' };
    }

    if (voiceParams.accent && voiceParams.accent.toLowerCase() !== expected.accent.toLowerCase()) {
      return { valid: false, warning: 'Voice mismatch detected: Accent drift out of bounds' };
    }

    return { valid: true };
  }
}
