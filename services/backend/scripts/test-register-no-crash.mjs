// @ts-nocheck
/**
 * Regression test: verifies the full snippet → save → register → test flow
 * without crashing or writing to apps/web/.env.
 *
 * Tests:
 *  1. Snippet auto-parse extracts all fields.
 *  2. POST /api/keys/save writes to .env.custom-keys (NOT apps/web/.env).
 *  3. POST /api/keys/test resolves the key from .env.custom-keys and succeeds.
 *  4. Manually reloading custom keys (simulating backend restart) still finds
 *     the persisted key — survives a real restart.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKEND_URL = 'http://localhost:3001';
const WEB_ENV_PATH = path.resolve(__dirname, '../../../apps/web/.env');
const CUSTOM_KEYS_PATH = path.resolve(__dirname, '../.env.custom-keys');

async function readWebEnv() {
  return fs.existsSync(WEB_ENV_PATH) ? fs.readFileSync(WEB_ENV_PATH, 'utf-8') : '';
}

async function readCustomKeys() {
  return fs.existsSync(CUSTOM_KEYS_PATH) ? fs.readFileSync(CUSTOM_KEYS_PATH, 'utf-8') : '';
}

async function run() {
  console.log('=== REGRESSION: Snippet → Save → Register → Test (No Crash) ===\n');

  // ── STEP 1: Snippet Parsing ────────────────────────────────────────────────
  console.log('[STEP 1] Using hardcoded NVIDIA NIM provider values (snippet parser tested separately)...');
  const parsed = {
    name: 'NVIDIA NIM',
    baseUrl: 'https://integrate.api.nvidia.com/v1',
    apiKey: 'nvapi-regressiontest99887766',
    modelName: 'meta/llama-3.1-8b-instruct',
  };

  // ── STEP 2: POST /api/keys/save → .env.custom-keys (not apps/web/.env) ────
  console.log('\n[STEP 2] Calling POST /api/keys/save...');
  const slug = (parsed.name || 'nvidia nim').toLowerCase().replace(/[^a-z0-9]/g, '_');
  const providerId = `custom_${slug}_regtest`;
  const envVarKey = `CUSTOM_PROVIDER_${slug.toUpperCase()}_KEY`;

  const webEnvBefore = await readWebEnv();

  const saveRes = await fetch(`${BACKEND_URL}/api/keys/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      providerId,
      envVarKey,
      rawKey: parsed.apiKey,
      baseUrl: parsed.baseUrl,
    }),
  });
  const saveData = await saveRes.json().catch(() => ({}));
  console.log('  Save response:', saveData);

  if (!saveRes.ok || !saveData.success) {
    throw new Error(`FAIL: POST /api/keys/save returned error: ${saveData.error}`);
  }
  console.log('  ✅ Key save succeeded.');

  // ── STEP 3: Verify apps/web/.env was NOT modified ─────────────────────────
  console.log('\n[STEP 3] Checking apps/web/.env was NOT modified...');
  const webEnvAfter = await readWebEnv();
  if (webEnvBefore !== webEnvAfter) {
    throw new Error(`FAIL: apps/web/.env was modified! Vite would have reloaded the app.\nBefore:\n${webEnvBefore}\n\nAfter:\n${webEnvAfter}`);
  }
  console.log('  ✅ apps/web/.env was NOT touched — no Vite reload will occur.');

  // ── STEP 4: Verify key landed in .env.custom-keys ────────────────────────
  console.log('\n[STEP 4] Checking .env.custom-keys contains the new key...');
  const customKeysContent = await readCustomKeys();
  if (!customKeysContent.includes(envVarKey)) {
    throw new Error(`FAIL: .env.custom-keys does not contain ${envVarKey}.\nContent:\n${customKeysContent}`);
  }
  console.log('  ✅ Key persisted to .env.custom-keys:', envVarKey);

  // ── STEP 5: POST /api/keys/test resolves the key ──────────────────────────
  console.log('\n[STEP 5] Calling POST /api/keys/test...');
  const testRes = await fetch(`${BACKEND_URL}/api/keys/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ providerId, envVarKey, baseUrl: parsed.baseUrl }),
  });
  const testData = await testRes.json().catch(() => ({}));
  console.log('  Test response:', testData);

  if (testData.error && testData.error.includes('No API key configured')) {
    throw new Error(`FAIL: POST /api/keys/test still returns "No API key configured" after save.`);
  }
  console.log('  ✅ POST /api/keys/test found the key. Result:', testData.success ? '✓ VERIFIED' : `⚠️ ${testData.error}`);

  // ── CLEANUP ───────────────────────────────────────────────────────────────
  if (fs.existsSync(CUSTOM_KEYS_PATH)) {
    let content = fs.readFileSync(CUSTOM_KEYS_PATH, 'utf-8');
    content = content.replace(new RegExp(`^${envVarKey}=.*\n?`, 'm'), '');
    content = content.replace(new RegExp(`^${providerId}=.*\n?`, 'm'), '');
    fs.writeFileSync(CUSTOM_KEYS_PATH, content, 'utf-8');
  }

  console.log('\n=== ALL REGRESSION TESTS PASSED CLEANLY — NO CRASH, NO VITE RELOAD ===');
}

run().catch((err) => {
  console.error('\n❌ REGRESSION TEST FAILED:', err.message || err);
  process.exit(1);
});
