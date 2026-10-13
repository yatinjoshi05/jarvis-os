// @ts-nocheck
import { parseProviderSnippet } from '../src/shared/ai/SnippetParser';
import { customProviderManager } from '../src/shared/ai/CustomProviderManager';
import { aiRouter } from '../src/shared/ai/AIRouter';

async function testCustomProviderKeyPersistenceEndToEnd() {
  console.log("=== TESTING CUSTOM PROVIDER KEY PERSISTENCE END-TO-END ===");

  const snippet = `
from openai import OpenAI

client = OpenAI(
  base_url = "https://integrate.api.nvidia.com/v1",
  api_key = "nvapi-test998877665544332211"
)

completion = client.chat.completions.create(
  model="z-ai/glm-5.2",
  messages=[{"role":"user","content":"Hello"}]
)
`;

  // STEP 1: Auto-Parse snippet
  console.log("\n[STEP 1] Auto-parsing pasted code snippet...");
  const parsed = parseProviderSnippet(snippet);
  console.log("Parsed result:", parsed);

  if (!parsed.baseUrl || !parsed.apiKey || !parsed.modelName) {
    throw new Error("❌ FAIL: Snippet parser failed to extract required fields!");
  }
  console.log("  ✅ Snippet parsed cleanly! API Key extracted:", `${parsed.apiKey.slice(0, 8)}...`);

  // STEP 2: Add Custom Provider with Extracted Key
  console.log("\n[STEP 2] Adding custom provider with extracted API Key...");
  const config = await customProviderManager.addCustomProvider({
    name: parsed.name || 'NVIDIA NIM',
    baseUrl: parsed.baseUrl,
    modelName: parsed.modelName,
    rawApiKey: parsed.apiKey,
    customHeaders: parsed.customHeaders,
  });

  console.log("Registered Custom Provider Config:", config);

  // STEP 3: Verify Provider Instance Key Resolution
  console.log("\n[STEP 3] Verifying Provider Instance Key Resolution...");
  const provider = aiRouter.getProvider(config.id);
  if (!provider) {
    throw new Error(`❌ FAIL: Provider ${config.id} not found in AIRouter!`);
  }

  const resolvedKey = provider.getApiKey();
  console.log("Resolved API Key from provider instance:", resolvedKey ? `${resolvedKey.slice(0, 8)}...` : 'EMPTY');

  if (!resolvedKey || resolvedKey !== 'nvapi-test998877665544332211') {
    throw new Error(`❌ FAIL: Expected resolved API key 'nvapi-test998877665544332211', got '${resolvedKey}'`);
  }
  console.log("  ✅ SUCCESS: Provider instance resolved the persisted API Key cleanly!");

  // STEP 4: Call Backend POST /api/keys/test Endpoint
  console.log("\n[STEP 4] Calling POST /api/keys/test on backend proxy server...");
  const backendUrl = 'http://localhost:3001';
  const testRes = await fetch(`${backendUrl}/api/keys/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      providerId: config.id,
      envVarKey: config.envVarKey,
      baseUrl: config.baseUrl,
    }),
  });

  const testData = await testRes.json();
  console.log("Test Connection Endpoint Response:", testData);

  if (testData.error && testData.error.includes("No API key configured")) {
    throw new Error("❌ FAIL: Backend POST /api/keys/test returned 'No API key configured'!");
  }
  console.log("  ✅ SUCCESS: Backend POST /api/keys/test located the persisted key cleanly!");

  // Clean up
  customProviderManager.removeCustomProvider(config.id);
  console.log("\n=== ALL KEY PERSISTENCE END-TO-END TESTS PASSED CLEANLY ===");
}

testCustomProviderKeyPersistenceEndToEnd().catch((err) => {
  console.error("❌ TEST FAILED:", err);
  process.exit(1);
});
