/**
 * test-elevenlabs-voice.mjs
 *
 * Standalone ElevenLabs voice debug script.
 * Run: node services/backend/scripts/test-elevenlabs-voice.mjs
 *
 * DO NOT FIX — ONLY DIAGNOSE.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ── 1. Load .env ─────────────────────────────────────────────────────────────

const envPath = path.resolve(__dirname, '../../../apps/web/.env');
let rawEnv = '';
try {
  rawEnv = fs.readFileSync(envPath, 'utf-8');
  console.log('[1] .env loaded ✓', envPath);
} catch (err) {
  console.error('[1] FAILED to load .env:', err.message);
  process.exit(1);
}

// Simple .env parser (no dotenv dependency needed)
function parseEnv(raw) {
  const out = {};
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    out[key] = val;
  }
  return out;
}

const env = parseEnv(rawEnv);

const ELEVENLABS_API_KEY = env['ELEVENLABS_API_KEY'] || '';
const VOICE_ID = env['VITE_ELEVENLABS_VOICE_ID'] || env['ELEVENLABS_VOICE_ID'] || '';
const MODEL_ID = env['VITE_ELEVENLABS_MODEL'] || 'eleven_multilingual_v2';
const TTS_PROVIDER = env['VITE_TTS_PROVIDER'] || 'browser';

// ── 2. Validate env variables ─────────────────────────────────────────────────

console.log('\n──────────────────────────────────────────────');
console.log('ENV VARIABLE DIAGNOSTICS');
console.log('──────────────────────────────────────────────');
console.log('API key loaded:    ', ELEVENLABS_API_KEY ? `true  (${ELEVENLABS_API_KEY.slice(0, 8)}...)` : 'false ← MISSING');
console.log('Voice ID loaded:   ', VOICE_ID ? `true  (${VOICE_ID})` : 'false ← MISSING');
console.log('Model ID loaded:   ', MODEL_ID);
console.log('TTS Provider:      ', TTS_PROVIDER);
console.log('──────────────────────────────────────────────\n');

// ── 3. Build report object ────────────────────────────────────────────────────

const report = {
  timestamp: new Date().toISOString(),
  env_loaded: !!rawEnv,
  api_key_present: !!ELEVENLABS_API_KEY,
  voice_id_present: !!VOICE_ID,
  model_id: MODEL_ID,
  tts_provider: TTS_PROVIDER,
  api_connected: false,
  voice_found: false,
  audio_generated: false,
  audio_played: false,
  http_status: null,
  error: null,
  stack_trace: null,
  api_response_headers: null,
  api_response_body_snippet: null,
};

// ── 4. Guard before hitting the API ──────────────────────────────────────────

if (!ELEVENLABS_API_KEY) {
  report.error = 'ELEVENLABS_API_KEY is missing from .env';
  writeReport(report);
  process.exit(1);
}

if (!VOICE_ID) {
  report.error = 'VITE_ELEVENLABS_VOICE_ID is missing from .env';
  writeReport(report);
  process.exit(1);
}

// ── 5. Call ElevenLabs API ────────────────────────────────────────────────────

const TEST_TEXT = 'Hello Yatin, Jarvis is online.';
const OUTPUT_PATH = path.resolve(__dirname, '../../../apps/web/test.mp3');
const upstreamUrl = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream`;

console.log('[2] API request sent');
console.log('    URL:      ', upstreamUrl);
console.log('    Text:     ', TEST_TEXT);
console.log('    Model:    ', MODEL_ID);
console.log('    Voice ID: ', VOICE_ID);
console.log();

let response;
try {
  response = await fetch(upstreamUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': ELEVENLABS_API_KEY,
      'Accept': 'audio/mpeg',
    },
    body: JSON.stringify({
      text: TEST_TEXT,
      model_id: MODEL_ID,
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0,
        use_speaker_boost: true,
      },
    }),
    signal: AbortSignal.timeout(20_000),
  });
} catch (err) {
  console.error('[2] FETCH FAILED:', err.message);
  report.error = err.message;
  report.stack_trace = err.stack;
  writeReport(report);
  process.exit(1);
}

// ── 6. Inspect response ───────────────────────────────────────────────────────

report.http_status = response.status;
const responseHeaders = {};
response.headers.forEach((val, key) => { responseHeaders[key] = val; });
report.api_response_headers = responseHeaders;

console.log('[3] Response received');
console.log('    HTTP status:  ', response.status, response.statusText);
console.log('    Content-Type: ', response.headers.get('content-type'));

if (!response.ok) {
  let body = '';
  try { body = await response.text(); } catch (_) {}
  console.error('\n[ERROR] ElevenLabs returned HTTP', response.status);
  console.error('Response body:', body);
  report.error = `ElevenLabs returned HTTP ${response.status}: ${body}`;
  report.api_response_body_snippet = body.slice(0, 500);
  report.api_connected = true;   // we connected, but got an error response

  // Common error diagnosis
  if (response.status === 401) {
    console.error('DIAGNOSIS: Invalid API key. Check ELEVENLABS_API_KEY in .env');
  } else if (response.status === 422) {
    console.error('DIAGNOSIS: Invalid voice ID or request body. Check VITE_ELEVENLABS_VOICE_ID in .env');
    report.voice_found = false;
  } else if (response.status === 429) {
    console.error('DIAGNOSIS: Rate limit or quota exceeded on your ElevenLabs account.');
  } else if (response.status === 403) {
    console.error('DIAGNOSIS: Forbidden. Your API key may lack permissions for this voice.');
  }

  writeReport(report);
  process.exit(1);
}

report.api_connected = true;
report.voice_found = true;

// ── 7. Save audio file ────────────────────────────────────────────────────────

try {
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (buffer.byteLength < 100) {
    throw new Error(`Audio buffer too small (${buffer.byteLength} bytes) — likely an error response.`);
  }

  fs.writeFileSync(OUTPUT_PATH, buffer);
  report.audio_generated = true;

  console.log('[4] Audio file generated ✓');
  console.log('    Path:   ', OUTPUT_PATH);
  console.log('    Size:   ', `${buffer.byteLength.toLocaleString()} bytes`);
} catch (err) {
  console.error('[4] FAILED to save audio:', err.message);
  report.error = err.message;
  report.stack_trace = err.stack;
  writeReport(report);
  process.exit(1);
}

// ── 8. Playback (Node.js — open with system player) ──────────────────────────

try {
  const { exec } = await import('child_process');
  const command = process.platform === 'win32'
    ? `start "" "${OUTPUT_PATH}"`
    : process.platform === 'darwin'
      ? `open "${OUTPUT_PATH}"`
      : `xdg-open "${OUTPUT_PATH}"`;

  exec(command, (err) => {
    if (err) {
      console.warn('[5] System audio playback warning:', err.message);
      console.warn('    You can manually play:', OUTPUT_PATH);
    } else {
      console.log('[5] Audio playback started ✓ (opened with system player)');
    }
  });

  report.audio_played = true;
  report.error = null;
} catch (err) {
  console.warn('[5] Could not auto-play:', err.message);
  report.audio_played = false;
  report.error = `Playback warning: ${err.message}`;
}

// ── 9. Final summary ──────────────────────────────────────────────────────────

console.log('\n──────────────────────────────────────────────');
console.log('VOICE DEBUG SUMMARY');
console.log('──────────────────────────────────────────────');
console.log('env_loaded:       ', report.env_loaded ? '✓ PASS' : '✗ FAIL');
console.log('api_key_present:  ', report.api_key_present ? '✓ PASS' : '✗ FAIL');
console.log('voice_id_present: ', report.voice_id_present ? '✓ PASS' : '✗ FAIL');
console.log('api_connected:    ', report.api_connected ? '✓ PASS' : '✗ FAIL');
console.log('voice_found:      ', report.voice_found ? '✓ PASS' : '✗ FAIL');
console.log('audio_generated:  ', report.audio_generated ? '✓ PASS' : '✗ FAIL');
console.log('audio_played:     ', report.audio_played ? '✓ PASS' : '⚠ CHECK MANUALLY');
console.log('error:            ', report.error || 'none');
console.log('──────────────────────────────────────────────\n');

writeReport(report);

// ── Helper ────────────────────────────────────────────────────────────────────

function writeReport(data) {
  const reportPath = path.resolve(__dirname, '../../../voice_debug_report.json');
  try {
    fs.writeFileSync(reportPath, JSON.stringify(data, null, 2));
    console.log('voice_debug_report.json saved →', reportPath);
  } catch (err) {
    console.error('Failed to save report:', err.message);
  }
}
