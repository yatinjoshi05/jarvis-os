// @ts-nocheck
import { parseProviderSnippet } from '../src/shared/ai/SnippetParser';
import { customProviderManager } from '../src/shared/ai/CustomProviderManager';
import { aiRouter } from '../src/shared/ai/AIRouter';

async function testSnippetAutoParseFlow() {
  console.log("=== TESTING QUICKSTART CODE SNIPPET AUTO-PARSE & REGISTRATION FLOW ===");

  const snippet = `
from openai import OpenAI

client = OpenAI(
  base_url = "https://integrate.api.nvidia.com/v1",
  api_key = "nvapi-test1234567890"
)

completion = client.chat.completions.create(
  model="z-ai/glm-5.2",
  messages=[{"role":"user","content":"Ping"}]
)
`;

  // 1. Auto-Parse Snippet
  console.log("\n[STEP 1] Auto-parsing pasted Python code snippet...");
  const parsed = parseProviderSnippet(snippet);
  console.log("Parsed Metadata:", parsed);

  if (!parsed.baseUrl || !parsed.apiKey || !parsed.modelName) {
    throw new Error("Failed to auto-extract required fields from snippet!");
  }
  console.log("  ✅ Extracted Base URL:", parsed.baseUrl);
  console.log("  ✅ Extracted Model ID:", parsed.modelName);
  console.log("  ✅ Extracted Provider Label:", parsed.name);

  // 2. Register Extracted Custom Provider into CustomProviderManager
  console.log("\n[STEP 2] Registering extracted provider into CustomProviderManager...");
  const config = await customProviderManager.addCustomProvider({
    name: parsed.name || 'Test Custom Provider',
    baseUrl: parsed.baseUrl,
    modelName: parsed.modelName,
    rawApiKey: parsed.apiKey,
    customHeaders: parsed.customHeaders,
  });

  console.log("Registered Config:", config);

  // 3. Verify AIRouter Integration
  console.log("\n[STEP 3] Verifying AIRouter registration...");
  const provider = aiRouter.getProvider(config.id);
  if (!provider) {
    throw new Error(`Provider ${config.id} was not registered in AIRouter!`);
  }
  console.log(`  ✅ Custom provider ${config.id} registered in AIRouter successfully!`);

  // Clean up
  customProviderManager.removeCustomProvider(config.id);
  console.log("\n=== ALL SNIPPET AUTO-PARSE FLOW TESTS PASSED CLEANLY ===");
}

testSnippetAutoParseFlow().catch((err) => {
  console.error("❌ TEST FAILED:", err);
  process.exit(1);
});
