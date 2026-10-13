import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKEND_URL = 'http://localhost:3001';

async function runMasterAuditVerification() {
  console.log('====================================================');
  console.log('  MASTER AUDIT VERIFICATION: JARVIS OS REAL FIXES   ');
  console.log('====================================================\n');

  // 1. Verify Backend Health
  console.log('[STEP 1] Checking backend health...');
  const healthRes = await fetch(`${BACKEND_URL}/api/health`);
  if (!healthRes.ok) {
    throw new Error(`Backend health check failed with status HTTP ${healthRes.status}`);
  }
  console.log('  ✅ Backend service is running and healthy.');

  // 2. Verify Durable Settings Persistence
  console.log('\n[STEP 2] Testing Durable Settings Store persistence...');
  const testSettingsPayload = {
    settings: {
      jarvis_user_identity: JSON.stringify({ name: 'AuditTester', role: 'Engineer' }),
      jarvis_ai_personality: JSON.stringify({ mode: 'concise', formality: 'high' }),
      jarvis_dashboard_density: 'compact',
      jarvis_test_timestamp: Date.now().toString(),
    }
  };

  const saveSettingsRes = await fetch(`${BACKEND_URL}/api/settings/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(testSettingsPayload),
  });

  const saveSettingsData = await saveSettingsRes.json();
  if (!saveSettingsRes.ok || !saveSettingsData.success) {
    throw new Error(`POST /api/settings/save failed: ${saveSettingsData.error}`);
  }
  console.log('  ✅ Saved settings successfully via POST /api/settings/save');

  // Verify file write on disk in services/backend/config/settings.json
  const settingsFilePath = path.resolve(__dirname, '../config/settings.json');
  if (!fs.existsSync(settingsFilePath)) {
    throw new Error(`settings.json was not created at ${settingsFilePath}`);
  }
  const diskContent = JSON.parse(fs.readFileSync(settingsFilePath, 'utf-8'));
  if (diskContent.jarvis_dashboard_density !== 'compact') {
    throw new Error('Durable settings content on disk did not match expectations.');
  }
  console.log('  ✅ Confirmed settings.json exists on disk and contains persisted settings.');

  const getSettingsRes = await fetch(`${BACKEND_URL}/api/settings/get`);
  const getSettingsData = await getSettingsRes.json();
  if (!getSettingsRes.ok || !getSettingsData.success || getSettingsData.settings.jarvis_dashboard_density !== 'compact') {
    throw new Error('GET /api/settings/get did not return persisted settings');
  }
  console.log('  ✅ GET /api/settings/get successfully read back durable settings.');

  // 3. Verify Real System File Writing
  console.log('\n[STEP 3] Testing Real System File Writing (/api/system/write-file)...');
  const testFilePath = path.resolve(__dirname, '../temp_audit_test.txt');
  const testContent = `JARVIS OS Real System Action Execution Test File\nCreated at: ${new Date().toISOString()}`;

  const writeRes = await fetch(`${BACKEND_URL}/api/system/write-file`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: testFilePath, content: testContent }),
  });

  const writeData = await writeRes.json();
  if (!writeRes.ok || !writeData.success) {
    throw new Error(`POST /api/system/write-file failed: ${writeData.error}`);
  }
  console.log('  ✅ Server returned success for write-file:', writeData.message);

  if (!fs.existsSync(testFilePath)) {
    throw new Error(`File ${testFilePath} was NOT found on host disk!`);
  }
  const readBackText = fs.readFileSync(testFilePath, 'utf-8');
  if (readBackText !== testContent) {
    throw new Error('File content on host disk does not match written content!');
  }
  console.log('  ✅ Host OS file system verification PASSED: File exists with exact matching content.');
  fs.unlinkSync(testFilePath); // Clean up temp test file

  // 4. Verify Real Command Execution
  console.log('\n[STEP 4] Testing Real System Command Execution (/api/system/execute-command)...');
  const execRes = await fetch(`${BACKEND_URL}/api/system/execute-command`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command: 'echo "JARVIS REAL EXECUTION VERIFIED"' }),
  });

  const execData = await execRes.json();
  if (!execRes.ok || !execData.success || execData.exitCode !== 0) {
    throw new Error(`POST /api/system/execute-command failed: ${execData.error}`);
  }
  if (!execData.stdout.includes('JARVIS REAL EXECUTION VERIFIED')) {
    throw new Error(`Unexpected stdout output: ${execData.stdout}`);
  }
  console.log('  ✅ Real command execution returned exitCode 0 and expected stdout:');
  console.log(`     "${execData.stdout}"`);

  // 5. Verify App Launching (e.g. notepad.exe or calc.exe)
  console.log('\n[STEP 5] Testing Real App Launching (/api/system/open-app)...');
  const openAppRes = await fetch(`${BACKEND_URL}/api/system/open-app`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'calc.exe' }),
  });
  const openAppData = await openAppRes.json();
  if (!openAppRes.ok || !openAppData.success) {
    throw new Error(`POST /api/system/open-app failed: ${openAppData.error}`);
  }
  console.log('  ✅ Real app launching returned success:', openAppData.message);

  // 6. Verify Browser Preview Launching
  console.log('\n[STEP 6] Testing Real Browser Preview Launching (/api/system/browser-preview)...');
  const previewRes = await fetch(`${BACKEND_URL}/api/system/browser-preview`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: 'https://httpbin.org/get' }),
  });
  const previewData = await previewRes.json();
  if (!previewRes.ok || !previewData.success) {
    throw new Error(`POST /api/system/browser-preview failed: ${previewData.error}`);
  }
  console.log('  ✅ Browser preview launching returned success:', previewData.message);

  console.log('\n====================================================');
  console.log('  ALL MASTER AUDIT VERIFICATION CHECKS PASSED 100%  ');
  console.log('====================================================');
}

runMasterAuditVerification().catch((err) => {
  console.error('\n❌ VERIFICATION TEST FAILED:', err.message);
  process.exit(1);
});
