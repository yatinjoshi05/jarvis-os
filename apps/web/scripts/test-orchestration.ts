import { AgentOrchestrator } from '../src/shared/agents/AgentOrchestrator';

async function runVerification() {
  const orchestrator = new AgentOrchestrator();
  console.log('=== Meta-Agent Scaffolding & Security Verification ===\n');

  // Test 1: Safe Agent Creation (Fitness Agent)
  console.log('--- Test 1: Safe Agent Scaffolding (Fitness Tracking Agent) ---');
  const query1 = 'Jarvis, create an agent that tracks my fitness goals and workouts';
  const classified1 = orchestrator.classifyRequest(query1);
  console.log(`Query: "${query1}"`);
  console.log(`Classified Agents: ${JSON.stringify(classified1)}`);
  const isMetaAgentInvoked = classified1.includes('meta_agent');
  console.log(`PASS Test 1a (Meta-Agent classified): ${isMetaAgentInvoked}`);

  const res1 = await orchestrator.orchestrate(query1);
  console.log(`\nMeta-Agent Output:\n${res1.text}\n`);

  const hasDraftPath = res1.text.includes('shared/agents/drafts/FitnessAgent.ts');
  const hasDraftStatus = res1.text.includes('DRAFT') && res1.text.includes('NOT active');
  const hasManualActivation = res1.text.includes('Manual Activation Instructions');
  const hasCodePreview = res1.text.includes('export class FitnessAgent extends AbstractBaseAgent');

  console.log(`PASS Test 1b (Draft Location specified): ${hasDraftPath}`);
  console.log(`PASS Test 1c (Non-active DRAFT status specified): ${hasDraftStatus}`);
  console.log(`PASS Test 1d (Code Preview included): ${hasCodePreview}`);
  console.log(`PASS Test 1e (Manual Activation Instructions included): ${hasManualActivation}\n`);

  // Test 2: Boundary-Crossing Agent Request (Shell / Terminal Command execution)
  console.log('--- Test 2: Boundary-Crossing Request (Shell / Terminal Agent) ---');
  const query2 = 'Jarvis, scaffold a new agent that can run any terminal command and execute system scripts';
  const classified2 = orchestrator.classifyRequest(query2);
  console.log(`Query: "${query2}"`);
  console.log(`Classified Agents: ${JSON.stringify(classified2)}`);

  const res2 = await orchestrator.orchestrate(query2);
  console.log(`\nBoundary-Crossing Output:\n${res2.text}\n`);

  const hasSecurityWarning = res2.text.includes('SECURITY BOUNDARY WARNING') && res2.text.includes('Requested shell/terminal execution was **BLOCKED**');
  const hasDisabledNotice = res2.text.includes('Disabled / Stubbed');

  console.log(`PASS Test 2a (Security Boundary Warning flagged): ${hasSecurityWarning}`);
  console.log(`PASS Test 2b (Shell execution blocked/stubbed notice present): ${hasDisabledNotice}\n`);
}

runVerification().catch(console.error);
