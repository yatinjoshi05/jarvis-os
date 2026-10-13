export class CharacterRelationshipEngine {
  static defaultRelationships = [
    { id: 'rel-1', character_a: 'char-ramesh', character_b: 'char-sita', relationship: 'Husband & Wife', strength: 98 },
    { id: 'rel-2', character_a: 'char-ramesh', character_b: 'char-village-boy', relationship: 'Grandfather & Grandson', strength: 94 },
    { id: 'rel-3', character_a: 'char-farmer', character_b: 'char-village-boy', relationship: 'Father & Son', strength: 95 },
    { id: 'rel-4', character_a: 'char-bus-driver', character_b: 'char-village-boy', relationship: 'Friend & Protector', strength: 88 }
  ];

  /**
   * Get all character relationships
   */
  static getRelationships() {
    return this.defaultRelationships;
  }

  /**
   * Get relationship between two specific characters
   */
  static getPairRelationship(charA, charB) {
    return this.defaultRelationships.find(
      r => (r.character_a === charA && r.character_b === charB) || (r.character_a === charB && r.character_b === charA)
    ) || null;
  }

  /**
   * Add or update relationship between two characters
   */
  static setRelationship(charA, charB, relationship, strength = 90) {
    const existing = this.getPairRelationship(charA, charB);
    if (existing) {
      existing.relationship = relationship;
      existing.strength = strength;
      return existing;
    }

    const newRel = {
      id: `rel-${Date.now()}`,
      character_a: charA,
      character_b: charB,
      relationship,
      strength
    };

    this.defaultRelationships.push(newRel);
    return newRel;
  }
}
