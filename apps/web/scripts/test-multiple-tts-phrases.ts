// @ts-nocheck
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
          process.env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
        }
      }
    });
  }
} catch (_) {}

import { elevenLabsProvider } from '../src/shared/ai/ElevenLabsProvider';

// Mock browser globals for Node env
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

const testPhrases = [
  "Welcome back to JARVIS OS. All systems are operational.",
  "Analyzing real-time market data feed and updating user workspace.",
  "ElevenLabs text-to-speech audio stream generated and verified successfully."
];

async function runMultiTest() {
  console.log("=== MULTI-RESPONSE ELEVENLABS TTS PIPELINE TEST ===");
  for (let i = 0; i < testPhrases.length; i++) {
    console.log(`\n[Phrase ${i + 1}/${testPhrases.length}] "${testPhrases[i]}"`);
    await elevenLabsProvider.speak(testPhrases[i], { voiceId: 'pNInz6obpgDQGcFmaJgB' });
    console.log(`  ✅ Phrase ${i + 1} passed!`);
  }
  console.log("\n=== ALL MULTI-RESPONSE TTS TESTS PASSED ===");
}

runMultiTest();
