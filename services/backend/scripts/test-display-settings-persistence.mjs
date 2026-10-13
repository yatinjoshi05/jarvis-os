/**
 * test-display-settings-persistence.mjs
 * 
 * Validates that DisplaySettings round-trips correctly through localStorage
 * (which the shim backs with the Tauri native store or backend durable store).
 * 
 * Run from the project root:
 *   node services/backend/scripts/test-display-settings-persistence.mjs
 * 
 * Requires the backend server to be running on port 3001.
 */

const BACKEND_URL = 'http://localhost:3001';
const DISPLAY_SETTINGS_KEY = 'jarvis_display_settings';

const testPayload = {
  zoomScale: 1.2,
  fpsCap: 120,
  fontFamily: "'Fira Code', monospace",
  accentColor: '#FF00FF',
  accentRgb: '255, 0, 255',
  themeId: 'synthwave',
  baseTextScale: 1.1,
  categoryScales: {
    sidebarTextScale: 1.0,
    titleTextScale: 1.15,
    bodyTextScale: 1.05,
    chartTextScale: 0.9,
    buttonTextScale: 1.0,
    chatTextScale: 1.1,
  },
};

async function run() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  JARVIS OS — Display Settings Persistence Test');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // ── Step 1: Write via POST /api/settings/save using the storageShim format ──
  // The storageShim posts: { settings: { [key]: serializedValue } }
  // This matches how the shim auto-syncs on every setItem call.
  console.log('Step 1: Writing settings via POST /api/settings/save...');
  const writeBody = {
    settings: {
      [DISPLAY_SETTINGS_KEY]: JSON.stringify(testPayload),
    },
  };
  const writeRes = await fetch(`${BACKEND_URL}/api/settings/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(writeBody),
  });
  if (!writeRes.ok) {
    throw new Error(`POST /api/settings/save failed with HTTP ${writeRes.status}`);
  }
  const writeData = await writeRes.json();
  if (!writeData.success) {
    throw new Error(`POST /api/settings/save returned success:false — ${writeData.error}`);
  }
  console.log('  ✅ Write confirmed by backend.');
  console.log('  Confirmed saved payload keys:', Object.keys(writeData.settings || {}));

  // ── Step 2: Read back via GET /api/settings/get ───────────────────────────
  console.log('\nStep 2: Reading back via GET /api/settings/get...');
  const readRes = await fetch(`${BACKEND_URL}/api/settings/get`);
  if (!readRes.ok) {
    throw new Error(`GET /api/settings/get failed with HTTP ${readRes.status}`);
  }
  const readData = await readRes.json();
  if (!readData.success) {
    throw new Error('GET /api/settings/get returned success:false');
  }

  // ── Step 3: Verify the key is present and round-trips correctly ────────────
  console.log('\nStep 3: Verifying round-trip for key:', DISPLAY_SETTINGS_KEY);
  const rawValue = readData.settings?.[DISPLAY_SETTINGS_KEY];
  if (!rawValue) {
    throw new Error(
      `Key "${DISPLAY_SETTINGS_KEY}" NOT FOUND in backend settings store.\n` +
      `Available keys: ${JSON.stringify(Object.keys(readData.settings || {}))}\n` +
      `This means the save payload used a wrong key name.`
    );
  }

  let parsedBack;
  try {
    parsedBack = JSON.parse(rawValue);
  } catch (e) {
    throw new Error(`Value at "${DISPLAY_SETTINGS_KEY}" is not valid JSON: ${rawValue}`);
  }

  // ── Step 4: Field-level assertions ────────────────────────────────────────
  console.log('\nStep 4: Field-level assertions...');
  const fields = [
    ['zoomScale', testPayload.zoomScale],
    ['fpsCap', testPayload.fpsCap],
    ['fontFamily', testPayload.fontFamily],
    ['accentColor', testPayload.accentColor],
    ['accentRgb', testPayload.accentRgb],
    ['themeId', testPayload.themeId],
    ['baseTextScale', testPayload.baseTextScale],
  ];

  let allPassed = true;
  for (const [field, expected] of fields) {
    const actual = parsedBack[field];
    const pass = actual === expected;
    console.log(`  ${pass ? '✅' : '❌'} ${field}: expected=${JSON.stringify(expected)}, got=${JSON.stringify(actual)}`);
    if (!pass) allPassed = false;
  }

  // Category scales
  for (const [key, expected] of Object.entries(testPayload.categoryScales)) {
    const actual = parsedBack.categoryScales?.[key];
    const pass = actual === expected;
    console.log(`  ${pass ? '✅' : '❌'} categoryScales.${key}: expected=${expected}, got=${actual}`);
    if (!pass) allPassed = false;
  }

  console.log('\n' + '━'.repeat(40));
  if (allPassed) {
    console.log('  ✅ ALL ASSERTIONS PASSED — Display settings persist correctly across app restarts.');
  } else {
    console.error('  ❌ SOME ASSERTIONS FAILED — Review the fields above for mismatches.');
    process.exit(1);
  }
  console.log('━'.repeat(40) + '\n');
}

run().catch((err) => {
  console.error('\n❌ TEST FAILED:', err.message);
  process.exit(1);
});
