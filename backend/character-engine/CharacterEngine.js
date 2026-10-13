import { db } from '../database/db.js';

export class CharacterEngine {
  /**
   * Create persistent character identity
   */
  static async createCharacter({ name, age, gender, personality, voice_style, accent, emotion_range, relationships, channel_id, storyline, role, mood }) {
    if (!name) throw new Error('Character name is required');

    const newChar = db.addCharacter({
      name,
      age: age || 30,
      gender: gender || 'Unspecified',
      personality: personality || 'Consistent & Loyal',
      voice_style: voice_style || 'Neutral',
      accent: accent || 'Standard',
      emotion_range: emotion_range || ['Neutral'],
      relationships: relationships || 'None',
      channel_id: channel_id || 'general',
      storyline: storyline || 'Active character storyline',
      role: role || 'Protagonist',
      mood: mood || 'Consistent',
      attachment: '🌟 90% (Active)'
    });

    db.addLog('character', {
      character_id: newChar.id,
      event: 'CREATED',
      note: `Character ${name} created with persistent personality.`
    });

    return newChar;
  }

  /**
   * Update character details while preserving consistency rules
   */
  static async updateCharacter(id, updates) {
    const existing = db.getCharacterById(id);
    if (!existing) throw new Error(`Character ${id} not found`);

    const updated = db.updateCharacter(id, updates);
    db.addLog('character', {
      character_id: id,
      event: 'UPDATED',
      note: `Updated attributes for ${existing.name}`
    });

    return updated;
  }

  /**
   * Generate character voice audio using Google Flow Audio Engine / Gemini API
   */
  static async generateVoice({ characterId, characterName, text, emotion = 'Neutral' }) {
    let character = null;
    if (characterId) {
      character = db.getCharacterById(characterId);
    } else if (characterName) {
      character = db.getCharacters().find(c => c.name.toLowerCase() === characterName.toLowerCase());
    }

    const voiceStyle = character ? character.voice_style : 'Google Flow Deep Warm Neural Voice';
    const accent = character ? character.accent : 'Standard';

    // Simulate Google Flow voice generation response
    db.addLog('api', {
      service_id: 'voice-engine',
      endpoint: '/google-flow/generate-voice',
      status_code: 200,
      latency_ms: 120
    });

    return {
      success: true,
      provider: 'Google Flow Voice AI',
      characterName: character ? character.name : characterName || 'Narrator',
      voiceStyle,
      accent,
      emotion,
      text,
      audioUrl: `/assets/yt/voices/voice_${Date.now()}.mp3`,
      durationSeconds: Math.max(3, Math.ceil(text.length / 15))
    };
  }

  /**
   * Remember storyline / memory note for character continuity (Module 8)
   */
  static async rememberCharacter(characterId, memoryNote) {
    const character = db.getCharacterById(characterId);
    if (!character) throw new Error(`Character ${characterId} not found`);

    const updatedMemory = character.storyline
      ? `${character.storyline} | ${memoryNote}`
      : memoryNote;

    const updated = db.updateCharacter(characterId, {
      storyline: updatedMemory,
      appearance_count: (character.appearance_count || 0) + 1
    });

    db.addLog('character', {
      character_id: characterId,
      event: 'MEMORY_ADDED',
      note: memoryNote
    });

    return updated;
  }

  /**
   * Retrieve character relationships
   */
  static async getRelationships(characterId) {
    const character = db.getCharacterById(characterId);
    if (!character) throw new Error(`Character ${characterId} not found`);

    return {
      characterId,
      name: character.name,
      relationships: character.relationships,
      channelId: character.channel_id
    };
  }

  /**
   * Enforce consistency check (Module 8 rule)
   */
  static enforceConsistency(characterName, proposedPersonality) {
    const character = db.getCharacters().find(c => c.name.toLowerCase() === characterName.toLowerCase());
    if (!character) return proposedPersonality;

    return {
      name: character.name,
      voice_style: character.voice_style,
      personality: character.personality,
      relationships: character.relationships,
      preserved: true
    };
  }

  /**
   * List all characters
   */
  static async listCharacters() {
    return db.getCharacters();
  }
}
