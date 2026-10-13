export class AudienceMemory {
  static preferences = {
    favoriteCharacters: ['Ramesh', 'Sita', 'Farmer'],
    favoriteEmotions: ['sad', 'flood', 'emotional'],
    favoriteStoryStructures: ['5-beat vertical short', 'disaster survival'],
    favoriteEndings: ['Heartfelt Reunion', 'Hopeful Restoration'],
    preferredUploadTimes: ['07:00 AM EST', '05:30 PM EST'],
    dislikedContent: ['repetitive spam', 'weak hooks']
  };

  static saveAudiencePreferences(newPrefs) {
    this.preferences = { ...this.preferences, ...newPrefs };
    return this.preferences;
  }

  static loadAudiencePreferences() {
    return this.preferences;
  }

  static updatePreferences(key, value) {
    this.preferences[key] = value;
    return this.preferences;
  }
}
