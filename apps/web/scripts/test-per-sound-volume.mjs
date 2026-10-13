import { audioSettings } from '../src/shared/audio/AudioSettings.ts';

console.log('=== PER-SOUND VOLUME ENGINE VERIFICATION TEST ===');

// 1. Initial Defaults Verification
const initialState = audioSettings.getState();
console.log('[Test 1] Initial state check:');
console.log(' - Master Volume:', initialState.masterVolume);
console.log(' - Sound Volumes keys count:', Object.keys(initialState.soundVolumes).length);
console.log(' - Startup volume default:', audioSettings.getSoundVolume('startup'));
console.log(' - Typing volume default:', audioSettings.getSoundVolume('typing'));

if (Object.keys(initialState.soundVolumes).length !== 11) {
  console.error('FAIL: Expected 11 sound volumes in state, got', Object.keys(initialState.soundVolumes).length);
  process.exit(1);
}

// 2. Set per-sound volume and verify formula (Effective = Master * Channel * Sound)
audioSettings.setVolume('master', 1.0);
audioSettings.setVolume('ambient', 0.8);
audioSettings.setSoundVolume('thinking', 0.5);

const effThinking = audioSettings.getEffectiveSoundVolume('thinking');
console.log('[Test 2] Effective Thinking Sound Volume:', effThinking);
// Expected: 1.0 * 0.8 * 0.5 = 0.4
if (Math.abs(effThinking - 0.4) > 0.001) {
  console.error(`FAIL: Expected effective volume 0.4, got ${effThinking}`);
  process.exit(1);
}

// 3. Test Master Volume Proportional Scaling
audioSettings.setVolume('master', 0.5);
const scaledThinking = audioSettings.getEffectiveSoundVolume('thinking');
console.log('[Test 3] Scaled Thinking Volume with Master 50%:', scaledThinking);
// Expected: 0.5 * 0.8 * 0.5 = 0.2
if (Math.abs(scaledThinking - 0.2) > 0.001) {
  console.error(`FAIL: Expected effective volume 0.2, got ${scaledThinking}`);
  process.exit(1);
}

// 4. Test Per-Sound Mute Toggle
audioSettings.setSoundMuted('thinking', true);
const mutedThinking = audioSettings.getEffectiveSoundVolume('thinking');
console.log('[Test 4] Muted Thinking Volume:', mutedThinking);
if (mutedThinking !== 0) {
  console.error(`FAIL: Expected 0 for muted sound, got ${mutedThinking}`);
  process.exit(1);
}

// Unmute sound
audioSettings.setSoundMuted('thinking', false);
audioSettings.setVolume('master', 1.0);

// 5. Test UI Sound Effective Volume (Click sound)
audioSettings.setVolume('ui', 0.6);
audioSettings.setSoundVolume('click', 0.5);
const effClick = audioSettings.getEffectiveSoundVolume('click');
console.log('[Test 5] Effective Click Sound Volume:', effClick);
// Expected: 1.0 * 0.6 * 0.5 = 0.3
if (Math.abs(effClick - 0.3) > 0.001) {
  console.error(`FAIL: Expected effective volume 0.3, got ${effClick}`);
  process.exit(1);
}

console.log('✓ ALL 5 PER-SOUND VOLUME ENGINE TESTS PASSED SUCCESSFULLY!');
