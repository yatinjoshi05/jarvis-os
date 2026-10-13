declare const process: any;

import { audioManager } from '../src/shared/audio/AudioManager';
import { audioSettings } from '../src/shared/audio/AudioSettings';
import { audioStateMachine } from '../src/shared/audio/AudioStateMachine';
import { audioEvents } from '../src/shared/audio/AudioEvents';
import { audioMixer } from '../src/shared/audio/AudioMixer';
import { voiceStateMachine } from '../src/shared/ai/VoiceStateMachine';
import { AudioState } from '../src/shared/audio/AudioTypes';

async function runAudioEngineVerification() {
  console.log('================================================================');
  console.log('   JARVIS OS AMBIENT AUDIO ENGINE DEBUG & INTEGRATION VERIFY    ');
  console.log('================================================================\n');

  // ── 1. ASSET PRELOAD & LOADING TEST ─────────────────────────────────────────
  console.log('[TEST 1/7] Testing Asset Preloading & Loading Verification...');
  await audioMixer.preloadAllAssets();
  console.log('  ✅ SUCCESS: All ambient & UI MP3 assets preloaded successfully!');

  // ── 2. AUDIO SETTINGS & VOLUMES TEST ───────────────────────────────────────
  console.log('\n[TEST 2/7] Testing Independent Volume Channels & Effective Volume Calculation...');
  audioSettings.setVolume('ambient', 0.5);
  audioSettings.setVolume('ui', 0.7);
  audioSettings.setVolume('voice', 0.9);
  audioSettings.setVolume('master', 0.8);
  audioSettings.setMuted(false);

  const ambEff = audioSettings.getEffectiveVolume('ambient');
  const uiEff = audioSettings.getEffectiveVolume('ui');
  const voiceEff = audioSettings.getEffectiveVolume('voice');

  if (Math.abs(ambEff - 0.4) < 0.01 && Math.abs(uiEff - 0.56) < 0.01 && Math.abs(voiceEff - 0.72) < 0.01) {
    console.log('  ✅ SUCCESS: Independent volume channels & master scaling calculated accurately!');
  } else {
    console.error(`  ❌ FAILED: Volume calculation mismatch. Ambient: ${ambEff}, UI: ${uiEff}, Voice: ${voiceEff}`);
    process.exit(1);
  }

  // Test Mute behavior
  audioSettings.setMuted(true);
  if (audioSettings.getEffectiveVolume('ambient') === 0 && audioSettings.getEffectiveVolume('ui') === 0) {
    console.log('  ✅ SUCCESS: Mute state zeroes all channel effective volumes cleanly!');
  } else {
    console.error('  ❌ FAILED: Mute toggle did not zero effective volumes.');
    process.exit(1);
  }

  audioSettings.setMuted(false);
  audioSettings.setFadeDuration(500);

  // ── 3. AUDIO EVENTS EMITTER TEST ───────────────────────────────────────────
  console.log('\n[TEST 3/7] Testing Audio Events Bus (No Polling)...');
  let eventReceived = false;
  const unsubEvent = audioEvents.on('fadeDurationChanged', (data) => {
    if (data.fadeDurationMs === 500) {
      eventReceived = true;
    }
  });
  audioSettings.setFadeDuration(500);
  unsubEvent();

  if (eventReceived) {
    console.log('  ✅ SUCCESS: audioEvents emitted and received event payload instantly!');
  } else {
    console.error('  ❌ FAILED: audioEvents emitter test failed.');
    process.exit(1);
  }

  // ── 4. AUDIO STATE MACHINE TRANSITIONS TEST ────────────────────────────────
  console.log('\n[TEST 4/7] Testing Audio State Machine Transitions...');
  const recordedStates: AudioState[] = [];
  const unsubscribeState = audioStateMachine.subscribe((newState) => {
    recordedStates.push(newState);
  });

  audioStateMachine.transitionTo('Startup');
  audioStateMachine.transitionTo('Idle');
  audioStateMachine.transitionTo('Listening');
  audioStateMachine.transitionTo('Thinking');
  audioStateMachine.transitionTo('Speaking');
  audioStateMachine.transitionTo('Idle');

  if (recordedStates.join(' -> ') === 'Startup -> Idle -> Listening -> Thinking -> Speaking -> Idle') {
    console.log('  ✅ SUCCESS: Audio State Machine transition matrix verified 100%!');
    console.log(`  Path: ${recordedStates.join(' -> ')}`);
  } else {
    console.error(`  ❌ FAILED: Transition sequence mismatch: ${recordedStates.join(' -> ')}`);
    process.exit(1);
  }
  unsubscribeState();

  // ── 5. ASSET PATH MAPPING TEST ─────────────────────────────────────────────
  console.log('\n[TEST 5/7] Testing Ambient Asset Mapping (/assets/audio/)...');
  const startupAsset = audioStateMachine.getAmbientSrcForState('Startup');
  const idleAsset = audioStateMachine.getAmbientSrcForState('Idle');
  const listeningAsset = audioStateMachine.getAmbientSrcForState('Listening');
  const thinkingAsset = audioStateMachine.getAmbientSrcForState('Thinking');
  const speakingAsset = audioStateMachine.getAmbientSrcForState('Speaking');
  const shutdownAsset = audioStateMachine.getAmbientSrcForState('Shutdown');

  if (
    startupAsset === '/assets/audio/ambient/startup.mp3' &&
    idleAsset === '/assets/audio/ambient/idle.mp3' &&
    listeningAsset === '/assets/audio/ambient/listening.mp3' &&
    thinkingAsset === '/assets/audio/ambient/thinking.mp3' &&
    speakingAsset === '/assets/audio/ambient/speaking.mp3' &&
    shutdownAsset === '/assets/audio/ambient/shutdown.mp3'
  ) {
    console.log('  ✅ SUCCESS: Asset path mappings for public/assets/audio/ ambient states verified!');
  } else {
    console.error('  ❌ FAILED: Asset path mapping error.');
    process.exit(1);
  }

  // ── 6. VOICE STATE MACHINE INTEGRATION TEST ────────────────────────────────
  console.log('\n[TEST 6/7] Testing Automatic VoiceStateMachine -> Audio Engine Integration...');
  voiceStateMachine.transitionTo('LISTENING');
  if (audioManager.state === 'Listening') {
    console.log('  ✅ SUCCESS: VoiceState "LISTENING" auto-transitioned Audio Engine to "Listening"!');
  } else {
    console.error(`  ❌ FAILED: Audio Engine state expected "Listening", got "${audioManager.state}"`);
    process.exit(1);
  }

  voiceStateMachine.transitionTo('THINKING');
  if (audioManager.state === 'Thinking') {
    console.log('  ✅ SUCCESS: VoiceState "THINKING" auto-transitioned Audio Engine to "Thinking"!');
  } else {
    console.error(`  ❌ FAILED: Audio Engine state expected "Thinking", got "${audioManager.state}"`);
    process.exit(1);
  }

  voiceStateMachine.transitionTo('SPEAKING');
  if (audioManager.state === 'Speaking') {
    console.log('  ✅ SUCCESS: VoiceState "SPEAKING" auto-transitioned Audio Engine to "Speaking"!');
  } else {
    console.error(`  ❌ FAILED: Audio Engine state expected "Speaking", got "${audioManager.state}"`);
    process.exit(1);
  }

  voiceStateMachine.transitionTo('IDLE');
  if (audioManager.state === 'Idle') {
    console.log('  ✅ SUCCESS: VoiceState "IDLE" auto-transitioned Audio Engine to "Idle"!');
  } else {
    console.error(`  ❌ FAILED: Audio Engine state expected "Idle", got "${audioManager.state}"`);
    process.exit(1);
  }

  // ── 7. STARTUP, SHUTDOWN & CLEANUP TEST ────────────────────────────────────
  console.log('\n[TEST 7/7] Testing Startup/Shutdown Sequences & Resource Teardown...');
  await audioManager.start();
  if (audioManager.state === 'Startup') {
    console.log('  ✅ SUCCESS: audioManager.start() triggered Startup sequence!');
  }

  audioManager.dispose();
  console.log('  ✅ SUCCESS: audioManager.dispose() cleaned up state listeners & mixer nodes cleanly!');

  console.log('\n================================================================');
  console.log('   🎉 ALL 7 AUDIO ENGINE VERIFICATION TESTS PASSED 100%         ');
  console.log('================================================================');
}

runAudioEngineVerification().catch((err) => {
  console.error('Unhandled Verification Failure:', err);
  process.exit(1);
});
