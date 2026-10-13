import { MetaAgent } from '../src/shared/agents/impl/MetaAgent';

const metaAgent = new MetaAgent();

const testPrompts = [
  "tracks how much time I spend on my phone",
  "calculates solar panel efficiency based on daily cloud cover",
  "monitors sleep quality and REM cycles",
  "recommends books based on reader preference",
  "generates weekly meal prep shopping lists",
  "analyzes customer sentiment from survey feedback"
];

console.log("=== UPDATED META-AGENT NAMING TEST RESULTS ===");
testPrompts.forEach((prompt, index) => {
  const result = metaAgent.deriveAgentMetadata(prompt);
  console.log(`\n[Prompt ${index + 1}]: "${prompt}"`);
  console.log(`  Domain Name : ${result.domainName}`);
  console.log(`  Class Name  : ${result.className}`);
  console.log(`  Agent Name  : ${result.agentName}`);
  console.log(`  Agent ID    : ${result.agentId}`);
});
