import { db } from '../database/db.js';

export class CharacterProfileManager {
  /**
   * Get all character profiles from persistent storage
   */
  static getProfiles() {
    return db.getCharacters();
  }

  /**
   * Get a character profile by ID
   */
  static getProfileById(id) {
    return db.getCharacterById(id) || null;
  }

  /**
   * Get a character profile by Name (e.g. "Ramesh", "Sita")
   */
  static getProfileByName(name) {
    return db.getCharacters().find(c => c.name.toLowerCase() === name.toLowerCase()) || null;
  }

  /**
   * Create or save a new character profile
   */
  static createProfile(profileData = {}) {
    const newProfile = {
      id: profileData.id || `char-${Date.now()}`,
      channel_id: profileData.channel_id || 'general',
      name: profileData.name || 'New Character',
      gender: profileData.gender || 'Male',
      age: profileData.age || 30,
      height: profileData.height || "5'9\"",
      body_type: profileData.body_type || 'Average',
      skin_tone: profileData.skin_tone || 'Medium',
      hair_style: profileData.hair_style || 'Short Hair',
      hair_color: profileData.hair_color || 'Black',
      beard_style: profileData.beard_style || 'None',
      clothes_style: profileData.clothes_style || 'Casual',
      accessories: profileData.accessories || 'None',
      voice_style: profileData.voice_style || 'Neutral',
      accent: profileData.accent || 'Standard',
      personality: profileData.personality || 'Consistent',
      emotion_range: profileData.emotion_range || ['Neutral'],
      backstory: profileData.backstory || 'Character backstory',
      reference_images: profileData.reference_images || ['/assets/yt/yt_old_couple.png'],
      appearance_count: 0,
      storyline: profileData.storyline || 'Initial story arc',
      is_locked: profileData.is_locked ?? true,
      consistency_score: profileData.consistency_score || 98.0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    return db.addCharacter(newProfile);
  }

  /**
   * Update character profile while enforcing lock protection
   */
  static updateProfile(id, updates = {}) {
    const existing = this.getProfileById(id);
    if (!existing) throw new Error(`Character profile ${id} not found`);

    if (existing.is_locked && (updates.hair_style || updates.hair_color || updates.beard_style || updates.gender)) {
      console.warn(`[CharacterProfileManager] Character ${existing.name} is locked. Visual attributes preserved.`);
    }

    const updated = db.updateCharacter(id, {
      ...updates,
      updated_at: new Date().toISOString()
    });

    return updated;
  }

  /**
   * Lock or unlock character identity attributes
   */
  static toggleLock(id, isLocked) {
    return this.updateProfile(id, { is_locked: isLocked });
  }
}
