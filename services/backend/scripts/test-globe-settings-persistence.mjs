/**
 * test-globe-settings-persistence.mjs
 * 
 * Validates that GlobeSettings round-trip correctly including Batch 1 Signature Animations.
 */

const BACKEND_URL = 'http://localhost:3001';
const GLOBE_SETTINGS_KEY = 'jarvis_globe_settings';

const testPayload = {
  globeRadius: 2.2,
  materialType: 'crystal',
  roughness: 0.15,
  metalness: 0.25,
  transmission: 0.85,
  ior: 1.8,
  transparent: true,
  opacity: 0.9,
  emissiveColor: '#FF00FF',
  emissiveIntensity: 1.2,
  baseColor: '#120424',
  hdrReflection: true,
  particleCount: 2500,
  particleSize: 1.5,
  particleSpeed: 1.8,
  spawnRadius: 3.0,
  particleLifetime: 4.5,
  fadeSpeed: 1.5,
  particleColor: '#00FFCC',
  particleRandomness: 0.35,
  particleGravity: 0.1,
  motionNoise: 0.25,
  particleVelocity: 1.5,
  particleOpacity: 0.88,
  bloomInfluence: 0.5,
  signatureSectionEnabled: true,
  shockwaveEnabled: true,
  shockwaveSpeed: 2.0,
  shockwaveCount: 4,
  shockwaveFadeDist: 6.0,
  shockwaveSensitivity: 0.08,
  heartbeatEnabled: true,
  heartbeatStrength: 0.4,
  heartbeatSpeed: 3.0,
  heartbeatBaseScale: 1.1,
  orbitPacketsEnabled: true,
  orbitPacketCount: 36,
  orbitPacketSpeed: 1.5,
  orbitPacketRadius: 3.2,
  orbitPacketColor: '#00FFCC',
};

async function run() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  JARVIS OS — Globe Settings Persistence Test (Batch 1 Animations)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Step 1: Write via POST /api/settings/save
  console.log('Step 1: Writing Globe settings via POST /api/settings/save...');
  const writeBody = {
    settings: {
      [GLOBE_SETTINGS_KEY]: JSON.stringify(testPayload),
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

  // Step 2: Read back via GET /api/settings/get
  console.log('\nStep 2: Reading back via GET /api/settings/get...');
  const readRes = await fetch(`${BACKEND_URL}/api/settings/get`);
  if (!readRes.ok) {
    throw new Error(`GET /api/settings/get failed with HTTP ${readRes.status}`);
  }
  const readData = await readRes.json();
  if (!readData.success) {
    throw new Error('GET /api/settings/get returned success:false');
  }

  // Step 3: Verify key is present & parse
  console.log('\nStep 3: Verifying round-trip for key:', GLOBE_SETTINGS_KEY);
  const rawValue = readData.settings?.[GLOBE_SETTINGS_KEY];
  if (!rawValue) {
    throw new Error(`Key "${GLOBE_SETTINGS_KEY}" NOT FOUND in backend settings store.`);
  }
  const parsedBack = JSON.parse(rawValue);

  // Step 4: Key assertions
  console.log('\nStep 4: Field-level assertions...');
  let allPassed = true;
  for (const [key, expected] of Object.entries(testPayload)) {
    const actual = parsedBack[key];
    const pass = JSON.stringify(actual) === JSON.stringify(expected);
    console.log(`  ${pass ? '✅' : '❌'} ${key}: expected=${JSON.stringify(expected)}, got=${JSON.stringify(actual)}`);
    if (!pass) allPassed = false;
  }

  console.log('\n' + '━'.repeat(40));
  if (allPassed) {
    console.log('  ✅ ALL ASSERTIONS PASSED — Batch 1 Signature Animations persist correctly.');
  } else {
    console.error('  ❌ SOME ASSERTIONS FAILED.');
    process.exit(1);
  }
  console.log('━'.repeat(40) + '\n');
}

run().catch((err) => {
  console.error('\n❌ TEST FAILED:', err.message);
  process.exit(1);
});
