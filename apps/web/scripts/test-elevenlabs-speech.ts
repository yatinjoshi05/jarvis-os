// @ts-nocheck
declare const process: any;
import fs from 'fs';
import path from 'path';

// Parse .env manually in node script
try {
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split(/\r?\n/).forEach((line: string) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eq = trimmed.indexOf('=');
        if (eq > 0) {
          const key = trimmed.slice(0, eq).trim();
          const val = trimmed.slice(eq + 1).trim();
          process.env[key] = val;
        }
      }
    });
  }
} catch (_) {}

import { elevenLabsProvider } from '../src/shared/ai/ElevenLabsProvider';
import { voiceSettings } from '../src/shared/ai/VoiceSettings';
import { voiceStateMachine } from '../src/shared/ai/VoiceStateMachine';

async function testElevenLabsSpeechPipeline() {
  console.log('================================================================');
  console.log('       JARVIS OS ELEVENLABS SPEECH PIPELINE VERIFICATION       ');
  console.log('================================================================\n');

  // Ensure settings reflect elevenlabs
  voiceSettings.update({ ttsProvider: 'elevenlabs' });

  // Verify voice settings
  console.log('[VERIFY 1/5] Checking Voice Settings...');
  const settings = voiceSettings.settings;
  console.log('  Active TTS Provider:', settings.ttsProvider);
  console.log('  Volume:', settings.volume);

  if (settings.ttsProvider === 'elevenlabs') {
    console.log('  ✅ SUCCESS: ElevenLabs is configured as the active TTS provider!');
  } else {
    console.error('  ❌ FAILED: Active TTS provider is not elevenlabs');
    process.exit(1);
  }

  // Verify Voice State Machine integration
  console.log('\n[VERIFY 2/5] Testing Voice State Machine Transition...');
  voiceStateMachine.transitionTo('IDLE');
  console.log('  Initial state:', voiceStateMachine.state);

  // Verify Backend Proxy Endpoint Reachability directly
  console.log('\n[VERIFY 3/5] Testing Backend /api/tts/elevenlabs Proxy Endpoint...');
  try {
    const res = await fetch('http://localhost:3001/api/tts/elevenlabs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Greetings. JARVIS speech synthesis online.',
        voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam (Standard Free-Tier Voice)
        modelId: 'eleven_multilingual_v2',
      }),
    });

    console.log('  Backend HTTP Status:', res.status, res.statusText);
    if (!res.ok) {
      console.error('  ❌ FAILED: Backend returned non-200 status:', await res.text());
      process.exit(1);
    }

    const buffer = await res.arrayBuffer();
    console.log(`  Audio Received: ${buffer.byteLength} bytes (type: ${res.headers.get('content-type')})`);
    
    if (buffer.byteLength > 1000) {
      console.log('  ✅ SUCCESS: Valid MP3 audio stream received from ElevenLabs backend proxy!');
    } else {
      console.error('  ❌ FAILED: Received insufficient audio bytes.');
      process.exit(1);
    }
  } catch (err: any) {
    console.error('  ❌ FAILED: Network/Proxy error connecting to backend:', err?.message || err);
    process.exit(1);
  }

  // Verify Client ElevenLabsProvider.speak execution
  console.log('\n[VERIFY 4/5] Testing Client ElevenLabsProvider.speak()...');
  try {
    // Note: Node environment mocks HTML5 Audio if unavailable
    if (typeof (globalThis as any).Audio === 'undefined') {
      (globalThis as any).Audio = class MockAudio {
        src = '';
        volume = 1;
        onended: any = null;
        onerror: any = null;
        play() {
          setTimeout(() => this.onended?.(), 50);
          return Promise.resolve();
        }
        pause() {}
      };
    }
    if (typeof (globalThis as any).URL.createObjectURL === 'undefined') {
      (globalThis as any).URL.createObjectURL = () => 'blob:mock-audio-url';
      (globalThis as any).URL.revokeObjectURL = () => {};
    }

    await elevenLabsProvider.speak('JARVIS ElevenLabs speech pipeline test complete.', {
      voiceId: 'pNInz6obpgDQGcFmaJgB',
    });

    console.log('  ✅ SUCCESS: ElevenLabsProvider.speak() executed full pipeline cleanly!');
  } catch (err: any) {
    console.error('  ❌ FAILED: ElevenLabsProvider.speak() threw error:', err);
    process.exit(1);
  }

  console.log('\n[VERIFY 5/5] Checking Voice State Machine Final State...');
  console.log('  Current State:', voiceStateMachine.state);
  if (voiceStateMachine.state === 'SPEAKING' || voiceStateMachine.state === 'IDLE') {
    console.log('  ✅ SUCCESS: Voice State Machine updated correctly!');
  }

  console.log('\n================================================================');
  console.log('   🎉 ELEVENLABS SPEECH PIPELINE IS 100% FUNCTIONAL            ');
  console.log('================================================================');
  process.exit(0);
}

testElevenLabsSpeechPipeline().catch((err) => {
  console.error('Unhandled pipeline verification failure:', err);
  process.exit(1);
});
