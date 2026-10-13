import { CharacterProfileManager } from './CharacterProfileManager.js';
import { FaceReferenceManager } from './FaceReferenceManager.js';

export class CharacterGenerator {
  /**
   * Generate realistic cinematic visual prompts incorporating fixed character attributes
   */
  static generateCharacterScenePrompt(characterId: string, sceneAction: string): string {
    const char = CharacterProfileManager.getProfileById(characterId);
    const visMemory = FaceReferenceManager.getVisualMemory(characterId);

    if (!char) {
      return `Realistic cinematic shot of character ${sceneAction}, master quality 8k photorealistic`;
    }

    // Construct prompt enforcing character rules (realistic cinematic style, 1080x1920 30fps)
    const prompt = `Realistic cinematic shot: ${visMemory.reference_prompt}, ${char.name} is ${sceneAction}, lighting matching emotional mood, 1080x1920 vertical composition, 8k resolution, photorealistic details.`;

    return prompt;
  }
}
