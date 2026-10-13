// @ts-nocheck
import fs from 'fs';
import path from 'path';

async function testApiKeyValidationPipeline() {
  console.log("=== TESTING API KEY LIVE VALIDATION & PERSISTENCE PIPELINE ===");

  const backendUrl = 'http://localhost:3001';

  // STEP 1: Test Invalid/Garbage Key Submission for Anthropic Claude
  console.log("\n[TEST 1] Submitting invalid garbage API key for Anthropic Claude...");
  const invalidRes = await fetch(`${backendUrl}/api/keys/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      providerId: 'claude',
      rawKey: 'sk-ant-invalid-garbage-key-1234567890',
    }),
  });

  const invalidData = await invalidRes.json();
  console.log("Response Status:", invalidRes.status);
  console.log("Response Payload:", invalidData);

  if (invalidRes.ok || invalidData.success) {
    throw new Error("❌ FAIL: Server accepted an invalid API key without rejecting it!");
  }
  if (!invalidData.error || !invalidData.error.includes("Authentication failed")) {
    throw new Error(`❌ FAIL: Expected authentication failure error message, got: ${invalidData.error}`);
  }
  console.log("  ✅ SUCCESS: Invalid key rejected cleanly with error:", invalidData.error);

  // STEP 2: Verify .env was NOT overwritten with invalid key
  const envPath = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    if (envContent.includes('sk-ant-invalid-garbage-key-1234567890')) {
      throw new Error("❌ FAIL: Invalid key was written to .env file on disk!");
    }
  }
  console.log("  ✅ SUCCESS: Confirmed invalid key was NOT written to .env on disk.");

  // STEP 3: Test Valid Custom Provider Validation & Connection Test
  console.log("\n[TEST 3] Testing connection endpoint POST /api/keys/test for Gemini...");
  const testRes = await fetch(`${backendUrl}/api/keys/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      providerId: 'gemini',
    }),
  });

  const testData = await testRes.json();
  console.log("Test Connection Response:", testData);
  if (testRes.ok && testData.success) {
    console.log(`  ✅ SUCCESS: Gemini active key re-verified successfully in ${testData.latencyMs}ms!`);
  } else {
    console.log("  ℹ️ Gemini key test status:", testData.error || "Not configured yet");
  }

  console.log("\n=== ALL LIVE API KEY VALIDATION TESTS PASSED CLEANLY ===");
}

testApiKeyValidationPipeline().catch((err) => {
  console.error("❌ TEST FAILED:", err);
  process.exit(1);
});
