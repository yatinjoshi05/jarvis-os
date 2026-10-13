// @ts-nocheck
import fs from 'fs';
import path from 'path';

async function testApiKeySecurity() {
  console.log("=== VERIFYING API KEY SECURITY BOUNDARY ===");
  const baseUrl = "http://localhost:3001";

  // 1. Fetch initial keys status from backend proxy
  console.log("\n[STEP 1] Fetching GET /api/keys/status...");
  const statusRes = await fetch(`${baseUrl}/api/keys/status`);
  if (!statusRes.ok) {
    throw new Error(`HTTP ${statusRes.status} from GET /api/keys/status`);
  }
  const statusData = await statusRes.json();
  console.log("Status Response Received:", JSON.stringify(statusData, null, 2));

  // Verify that all returned key properties are either null or masked strings (containing '••••')
  for (const [provider, info] of Object.entries(statusData.keys)) {
    if (info.maskedKey) {
      if (!info.maskedKey.includes('••••')) {
        throw new Error(`SECURITY VIOLATION: Raw key returned for provider ${provider}: ${info.maskedKey}`);
      }
      console.log(`  ✅ Provider '${provider}' masked key verified: ${info.maskedKey}`);
    } else {
      console.log(`  ℹ️ Provider '${provider}' has no key configured (maskedKey: null).`);
    }
  }

  // 2. Test POST /api/keys/save for OpenAI provider
  console.log("\n[STEP 2] Testing POST /api/keys/save with dummy raw key 'sk-test1234567890abcdef'...");
  const saveRes = await fetch(`${baseUrl}/api/keys/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ providerId: 'openai', rawKey: 'sk-test1234567890abcdef' }),
  });

  if (!saveRes.ok) {
    throw new Error(`HTTP ${saveRes.status} from POST /api/keys/save`);
  }

  const saveData = await saveRes.json();
  console.log("Save Response Received:", JSON.stringify(saveData, null, 2));

  // Verify save response returns ONLY maskedKey and NO rawKey
  if ((saveData as any).rawKey) {
    throw new Error("SECURITY VIOLATION: Raw key leaked in POST /api/keys/save response!");
  }
  if (!saveData.maskedKey || !saveData.maskedKey.includes('••••')) {
    throw new Error(`SECURITY VIOLATION: Invalid or unmasked key in save response: ${saveData.maskedKey}`);
  }

  console.log(`  ✅ Save response verified! Masked Key returned: ${saveData.maskedKey}`);

  // 3. Re-check GET /api/keys/status
  console.log("\n[STEP 3] Re-verifying GET /api/keys/status for 'openai'...");
  const updatedStatusRes = await fetch(`${baseUrl}/api/keys/status`);
  const updatedData = await updatedStatusRes.json();
  const openaiInfo = updatedData.keys.openai;

  console.log("Updated OpenAI status:", openaiInfo);
  if (!openaiInfo.active || !openaiInfo.maskedKey || !openaiInfo.maskedKey.includes('••••')) {
    throw new Error("SECURITY VIOLATION: Updated status did not reflect active status with proper masking.");
  }

  console.log("\n=== ALL API KEY SECURITY TESTS PASSED CLEANLY ===");
}

testApiKeySecurity().catch((err) => {
  console.error("❌ TEST FAILED:", err);
  process.exit(1);
});
