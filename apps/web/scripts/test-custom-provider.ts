// @ts-nocheck
import fs from 'fs';
import path from 'path';

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

import { customProviderManager } from '../src/shared/ai/CustomProviderManager';
import { CustomOpenAICompatibleProvider } from '../src/shared/ai/CustomOpenAICompatibleProvider';
import { aiRouter } from '../src/shared/ai/AIRouter';
import { aiHealthManager } from '../src/shared/ai/AIProviderHealthManager';

async function testCustomProviderPipeline() {
  console.log("=== TESTING CUSTOM OPENAI-COMPATIBLE PROVIDER PIPELINE ===");

  // 1. Add a custom provider (pointing to NVIDIA NIM OpenAI-compatible chat completion endpoint as live test)
  console.log("\n[STEP 1] Registering Custom Provider 'Test Groq/NVIDIA Endpoint'...");
  const customConfig = await customProviderManager.addCustomProvider({
    name: "Test Groq Endpoint",
    baseUrl: "https://integrate.api.nvidia.com/v1",
    modelName: "meta/llama-3.1-8b-instruct",
    rawApiKey: process.env.NVIDIA_API_KEY || "nvapi-test123",
  });

  console.log("Registered Custom Provider Config:", customConfig);

  // 2. Verify registered in AIRouter & AIProviderHealthManager
  console.log("\n[STEP 2] Verifying registration in AIRouter & AIHealthManager...");
  const providerInstance = aiRouter.getProvider(customConfig.id);
  if (!providerInstance) {
    throw new Error(`Custom provider ${customConfig.id} was not found in AIRouter!`);
  }
  console.log(`  ✅ Provider '${customConfig.id}' is registered in AIRouter.`);

  const healthMetrics = aiHealthManager.getAllMetrics().get(customConfig.id);
  console.log("Health Metrics:", healthMetrics);
  if (!healthMetrics) {
    throw new Error(`Custom provider ${customConfig.id} was not found in AIHealthManager!`);
  }
  console.log(`  ✅ Provider '${customConfig.id}' is registered in AIHealthManager with name '${healthMetrics.name}'.`);

  // 3. Test generateResponse on the custom provider
  console.log("\n[STEP 3] Testing generateResponse() through CustomOpenAICompatibleProvider...");
  const apiKey = process.env.NVIDIA_API_KEY;
  if (apiKey) {
    const providerWithKey = new CustomOpenAICompatibleProvider({
      ...customConfig,
      apiKey,
    });
    const responseText = await providerWithKey.generateResponse("Hello JARVIS, respond with 5 words.");
    console.log("Live Custom Provider Response:", responseText);
    if (!responseText || !responseText.trim()) {
      throw new Error("Received empty response from live custom provider endpoint.");
    }
    console.log("  ✅ Live custom OpenAI-compatible provider response received successfully!");
  } else {
    console.log("  ℹ️ Skipping live HTTP request because NVIDIA_API_KEY is not in process.env (Configuration structure verified).");
  }

  // Clean up test provider
  customProviderManager.removeCustomProvider(customConfig.id);
  console.log("\n=== ALL CUSTOM PROVIDER TESTS PASSED CLEANLY ===");
}

testCustomProviderPipeline().catch((err) => {
  console.error("❌ CUSTOM PROVIDER TEST FAILED:", err);
  process.exit(1);
});
