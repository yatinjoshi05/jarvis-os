import { parseProviderSnippet } from '../src/shared/ai/SnippetParser';

function runSnippetParserTests() {
  console.log("=== TESTING QUICKSTART CODE SNIPPET PARSER ===");

  // TEST 1: Python OpenAI SDK (NVIDIA NIM)
  console.log("\n[TEST 1] Python OpenAI SDK (NVIDIA NIM)...");
  const pythonSnippet = `
from openai import OpenAI

client = OpenAI(
  base_url = "https://integrate.api.nvidia.com/v1",
  api_key = "nvapi-test1234567890abcdef"
)

completion = client.chat.completions.create(
  model="z-ai/glm-5.2",
  messages=[{"role":"user","content":"Hello"}]
)
`;
  const res1 = parseProviderSnippet(pythonSnippet);
  console.log("Parsed Output:", res1);
  if (res1.baseUrl !== 'https://integrate.api.nvidia.com/v1') throw new Error("Failed to parse base_url!");
  if (res1.apiKey !== 'nvapi-test1234567890abcdef') throw new Error("Failed to parse api_key!");
  if (res1.modelName !== 'z-ai/glm-5.2') throw new Error("Failed to parse model!");
  if (res1.name !== 'NVIDIA NIM') throw new Error("Failed to infer provider name!");
  console.log("  ✅ Python OpenAI snippet parsed 100% cleanly!");

  // TEST 2: LangChain Python (Groq AI)
  console.log("\n[TEST 2] LangChain Python (Groq AI)...");
  const langchainSnippet = `
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    base_url="https://api.groq.com/openai/v1",
    api_key="gsk_groqtestkey1234567890",
    model="llama-3.3-70b-versatile",
    temperature=0.7
)
`;
  const res2 = parseProviderSnippet(langchainSnippet);
  console.log("Parsed Output:", res2);
  if (res2.baseUrl !== 'https://api.groq.com/openai/v1') throw new Error("Failed to parse base_url!");
  if (res2.apiKey !== 'gsk_groqtestkey1234567890') throw new Error("Failed to parse api_key!");
  if (res2.modelName !== 'llama-3.3-70b-versatile') throw new Error("Failed to parse model!");
  if (res2.name !== 'Groq AI') throw new Error("Failed to infer Groq AI!");
  console.log("  ✅ LangChain snippet parsed 100% cleanly!");

  // TEST 3: Node.js SDK (Together AI)
  console.log("\n[TEST 3] Node.js SDK (Together AI)...");
  const nodeSnippet = `
import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'https://api.together.xyz/v1',
  apiKey: 'tog_key_998877665544332211'
});

const response = await openai.chat.completions.create({
  model: 'meta-llama/Llama-3.3-70B-Instruct-Turbo',
  messages: [{ role: 'user', content: 'Say hello' }]
});
`;
  const res3 = parseProviderSnippet(nodeSnippet);
  console.log("Parsed Output:", res3);
  if (res3.baseUrl !== 'https://api.together.xyz/v1') throw new Error("Failed to parse baseURL!");
  if (res3.apiKey !== 'tog_key_998877665544332211') throw new Error("Failed to parse apiKey!");
  if (res3.modelName !== 'meta-llama/Llama-3.3-70B-Instruct-Turbo') throw new Error("Failed to parse model!");
  if (res3.name !== 'Together AI') throw new Error("Failed to infer Together AI!");
  console.log("  ✅ Node.js SDK snippet parsed 100% cleanly!");

  // TEST 4: cURL / Shell (OpenRouter)
  console.log("\n[TEST 4] Shell / cURL (OpenRouter)...");
  const curlSnippet = `
curl https://openrouter.ai/api/v1/chat/completions \\
  -H "Authorization: Bearer sk-or-v1-abcdef1234567890" \\
  -H "HTTP-Referer: https://jarvis.os" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "anthropic/claude-3.5-sonnet",
    "messages": [{"role": "user", "content": "Ping"}]
  }'
`;
  const res4 = parseProviderSnippet(curlSnippet);
  console.log("Parsed Output:", res4);
  if (res4.baseUrl !== 'https://openrouter.ai/api/v1') throw new Error("Failed to parse cURL URL!");
  if (res4.apiKey !== 'sk-or-v1-abcdef1234567890') throw new Error("Failed to parse Bearer token!");
  if (res4.modelName !== 'anthropic/claude-3.5-sonnet') throw new Error("Failed to parse JSON body model!");
  if (res4.customHeaders?.['HTTP-Referer'] !== 'https://jarvis.os') throw new Error("Failed to parse custom headers!");
  if (res4.name !== 'OpenRouter') throw new Error("Failed to infer OpenRouter!");
  console.log("  ✅ cURL / Shell snippet parsed 100% cleanly!");

  console.log("\n=== ALL SNIPPET PARSER TESTS PASSED CLEANLY ===");
}

runSnippetParserTests();
