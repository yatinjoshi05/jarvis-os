import { CharacterProfileManager } from '../../../backend/character-memory/CharacterProfileManager.js';
import { FaceReferenceManager } from '../../../backend/character-memory/FaceReferenceManager.js';
import { VoiceProfileManager } from '../../../backend/character-memory/VoiceProfileManager.js';
import { CharacterRelationshipEngine } from '../../../backend/character-memory/CharacterRelationshipEngine.js';
import { CharacterGenerator } from '../../../backend/character-memory/CharacterGenerator.js';
import { CharacterConsistencyEngine } from '../../../backend/character-memory/CharacterConsistencyEngine.js';
import { CharacterMemoryService } from '../../../backend/character-memory/CharacterMemoryService.js';

console.log('=====================================================');
console.log('  YT STUDIO PHASE 2.1 — CHARACTER CONSISTENCY TEST SUITE');
console.log('=====================================================\n');

async function runTests() {
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASSED: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAILED: ${message}`);
      failed++;
    }
  }

  // 1. Character Profile Manager
  console.log('[Test 1] Character Profile Manager (Ramesh & Sita Rules)');
  const ramesh = CharacterProfileManager.getProfileByName('Ramesh');
  assert(ramesh && ramesh.age === 72 && ramesh.beard_style.includes('Beard'), 'Ramesh profile loaded: 72 years old, gray hair, white beard, deep voice');

  const sita = CharacterProfileManager.getProfileByName('Sita');
  assert(sita && sita.gender === 'Female' && sita.hair_color === 'Gray', 'Sita profile loaded: gray hair, soft voice, caring');

  // 2. Face Reference Manager
  console.log('\n[Test 2] Face Reference Manager (Embeddings & Visual Memory)');
  const visMemory = FaceReferenceManager.getVisualMemory('char-ramesh');
  assert(visMemory.face_embedding.includes('ramesh') && visMemory.reference_prompt.includes('realistic'), 'Face embedding and visual reference prompt generated');

  const score = FaceReferenceManager.compareFaceConsistency('char-ramesh', 'cinematic portrait of Ramesh, gray hair, white beard');
  assert(score >= 90.0, `Facial consistency score verified at ${score}% (>= 90%)`);

  // 3. Voice Profile Manager
  console.log('\n[Test 3] Voice Profile Manager & Mismatch Detection');
  const rameshVoice = VoiceProfileManager.getVoiceProfile('char-ramesh');
  assert(rameshVoice.pitch === 0.85, 'Ramesh voice profile pitch locked to 0.85 (deep voice)');

  const voiceCheck = VoiceProfileManager.verifyVoiceProfile('char-ramesh', { pitch: 1.5 });
  assert(voiceCheck.valid === false && voiceCheck.warning.includes('Voice mismatch detected'), 'Voice mismatch warning correctly triggered for pitch drift');

  // 4. Character Relationship Engine
  console.log('\n[Test 4] Character Relationship Engine');
  const rel = CharacterRelationshipEngine.getPairRelationship('char-ramesh', 'char-sita');
  assert(rel && rel.relationship.includes('Wife') && rel.strength >= 90, 'Pair relationship between Ramesh and Sita verified');

  // 5. Character Generator Prompts
  console.log('\n[Test 5] Character Generator Prompt Construction');
  const genPrompt = CharacterGenerator.generateCharacterScenePrompt('char-ramesh', 'walking down village path');
  assert(genPrompt.includes('Ramesh') && genPrompt.includes('1080x1920'), 'Realistic cinematic scene prompt generated with facial anchor');

  // 6. 6-Step Character Consistency Engine Pipeline
  console.log('\n[Test 6] 6-Step Character Consistency Engine Pipeline');
  const pipelineResult = await CharacterConsistencyEngine.executePipeline({
    channelId: 'old-couple',
    characterNames: ['Ramesh', 'Sita'],
    emotion: 'Sad',
    duration: 40
  });

  assert(pipelineResult.passed === true && pipelineResult.score >= 90.0, `6-step pipeline executed with score ${pipelineResult.score}% (>= 90%)`);

  // 7. Character Memory Service Vault
  console.log('\n[Test 7] Character Memory Service Vault Aggregation');
  const vault = CharacterMemoryService.getVaultCharacters();
  assert(vault.length >= 5 && vault[0].visualMemory && vault[0].voiceProfile, 'Vault returned 5 full character profiles with visual & voice memory');

  console.log('\n=====================================================');
  console.log(`  TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('=====================================================\n');

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
