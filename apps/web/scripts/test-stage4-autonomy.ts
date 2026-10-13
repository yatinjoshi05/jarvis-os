declare const process: any;

import { bootstrap } from '../src/app/bootstrap';
import { agentManager } from '../src/shared/agents/AgentManager';
import { agentRegistry } from '../src/shared/agents/AgentRegistry';
import { agentOrchestrator } from '../src/shared/agents/AgentOrchestrator';
import { autonomySafetyManager } from '../src/shared/agents/safety/AutonomySafetyManager';
import { selfUpdateManager } from '../src/shared/agents/safety/SelfUpdateManager';
import { systemControl } from '../src/shared/ai/SystemControl';
import { AbstractBaseAgent } from '../src/shared/agents/BaseAgent';
import { Task, ExecutionContext, AgentResult } from '../src/shared/agents/interfaces';

bootstrap();

class BrokenTestAgent extends AbstractBaseAgent {
  constructor() {
    super('broken_test_agent', 'Broken Test Agent', 'tester');
    this.state = 'Error';
    this.capabilities = [];
  }
  public async execute(_task: Task, _context: ExecutionContext): Promise<AgentResult> {
    return { agentId: this.id, success: false, error: 'Simulated Agent Failure' };
  }
}

async function runStage4Verification() {
  console.log('================================================================');
  console.log('   JARVIS OS STAGE 4 EXTENSION: FULL AUTONOMY & SAFETY SUITE   ');
  console.log('================================================================\n');

  // ── 1. SUPERVISOR TEST ──────────────────────────────────────────────────────
  console.log('[TEST 1/7] Testing Supervisor Agent Health Monitoring & Auto-Fix...');
  const brokenAgent = new BrokenTestAgent();
  agentRegistry.register(brokenAgent);

  const supervisor = agentManager.getAgent('supervisor_agent');
  if (!supervisor) {
    console.error('❌ Supervisor Agent not found in AgentManager!');
    process.exit(1);
  }

  const task1 = agentManager.tasks.createTask('Supervisor Check', 'Check agent status and fix broken agents');
  const supResult = await supervisor!.execute(task1, { userId: 'usr_test', conversationId: 'conv_test', workspaceId: 'ws_test', variables: {} });

  if (brokenAgent.state === 'Ready' && supResult.success) {
    console.log('  ✅ SUCCESS: Supervisor detected broken agent and auto-fixed state from Error → Ready!');
  } else {
    console.error('  ❌ FAILED: Supervisor failed to repair broken agent.');
    process.exit(1);
  }

  // ── 2. AUTONOMOUS META-AGENT NAME QUALITY & SUBSTANTIVE ANSWER TEST ─────────
  console.log('\n[TEST 2/7] Testing Autonomous Meta-Agent Naming Quality & Substantive Direct Answer...');
  const metaPrompt = 'create a agent which can create a website for me';
  const metaRes = await agentOrchestrator.orchestrate(metaPrompt);

  const isHollowAnswer = metaRes.text.includes('How else can I assist you with this?') || metaRes.text.length < 150;
  const isBadName = metaRes.text.includes('WhichAgent') || metaRes.text.includes('which_auto_agent') || metaRes.text.includes('Which Agent');
  const isGoodName = metaRes.text.includes('WebsiteBuilderAgent') || metaRes.text.includes('Website Builder Agent');

  if (metaRes.handled && isGoodName && !isBadName && !isHollowAnswer) {
    console.log('  ✅ SUCCESS: Meta-Agent created "WebsiteBuilderAgent" and provided a substantive direct answer!');
  } else {
    console.error('  ❌ FAILED: Meta-Agent failed naming quality or direct answer substance check.');
    console.error('     isGoodName:', isGoodName, '| isBadName:', isBadName, '| isHollowAnswer:', isHollowAnswer);
    console.error('     Response Text:\n', metaRes.text);
    process.exit(1);
  }

  // Test 2b: Phrasing Generalization Test 1
  const prompt2 = 'build an agent for tracking daily workouts and exercise';
  const metaRes2 = await agentOrchestrator.orchestrate(prompt2);
  if (!metaRes2.text.includes('FitnessAgent') && !metaRes2.text.includes('Fitness Agent') && !metaRes2.text.includes('Workout')) {
    console.error('  ❌ FAILED: Phrasing generalization test 1 failed to derive meaningful name:', metaRes2.text);
    process.exit(1);
  } else {
    console.log('  ✅ SUCCESS: Phrasing generalization 1 derived semantic agent name!');
  }

  // Test 2c: Phrasing Generalization Test 2
  const prompt3 = 'make an agent that calculates monthly budget expenses';
  const metaRes3 = await agentOrchestrator.orchestrate(prompt3);
  if (!metaRes3.text.includes('CustomFinanceAgent') && !metaRes3.text.includes('Finance') && !metaRes3.text.includes('Budget')) {
    console.error('  ❌ FAILED: Phrasing generalization test 2 failed to derive meaningful name:', metaRes3.text);
    process.exit(1);
  } else {
    console.log('  ✅ SUCCESS: Phrasing generalization 2 derived semantic agent name!');
  }

  // ── 3. AUDIT TRAIL VERIFICATION ─────────────────────────────────────────────
  console.log('\n[TEST 3/7] Verifying Persistent Audit Trail Log Entries...');
  const auditLogs = autonomySafetyManager.getAuditLog(10);
  if (auditLogs.length >= 2) {
    console.log(`  ✅ SUCCESS: ${auditLogs.length} structured audit trail entries captured!`);
    console.log(`  Sample Entry: [${auditLogs[0].actionType}] Agent: ${auditLogs[0].agentId} | ${auditLogs[0].summary}`);
  } else {
    console.error('  ❌ FAILED: Audit trail entries missing or insufficient.');
    process.exit(1);
  }

  // ── 4. RATE LIMITER TEST ────────────────────────────────────────────────────
  console.log('\n[TEST 4/7] Testing Self-Expansion Rate Limiter Cap...');
  for (let i = 0; i < 5; i++) {
    autonomySafetyManager.recordAutonomousAction();
  }

  const rateCheck = autonomySafetyManager.checkRateLimit();
  if (!rateCheck.allowed && rateCheck.reason?.includes('Rate limit cap reached')) {
    console.log('  ✅ SUCCESS: Rate limiter triggered cap after 5 rapid actions!');
    console.log(`  Reason logged: ${rateCheck.reason}`);
  } else {
    console.error('  ❌ FAILED: Rate limiter did not enforce cap.');
    process.exit(1);
  }

  // Reset rate limiter for remaining tests
  (autonomySafetyManager as any).actionTimestamps = [];

  // ── 5. KILL SWITCH TEST ─────────────────────────────────────────────────────
  console.log('\n[TEST 5/7] Testing Global Autonomy Kill Switch...');
  const pauseCmd = await systemControl.tryExecute('Jarvis, pause self-modification');
  if (!pauseCmd.handled || !autonomySafetyManager.isKillSwitchActive()) {
    console.error('  ❌ FAILED: Kill switch failed to activate via voice command.');
    process.exit(1);
  }

  // Attempt autonomous self-update while kill switch is active
  const blockedUpdate = await selfUpdateManager.selfUpdateAgent('research_agent', 'Quantum Computing', 'New quantum logic');
  if (!blockedUpdate.success && blockedUpdate.reason?.includes('Kill switch is ACTIVE')) {
    console.log('  ✅ SUCCESS: Autonomous self-update blocked by Kill Switch!');
  } else {
    console.error('  ❌ FAILED: Kill switch failed to block self-update.');
    process.exit(1);
  }

  // Resume via voice command
  const resumeCmd = await systemControl.tryExecute('Jarvis, resume self-modification');
  if (resumeCmd.handled && !autonomySafetyManager.isKillSwitchActive()) {
    console.log('  ✅ SUCCESS: Kill switch deactivated successfully via voice command!');
  } else {
    console.error('  ❌ FAILED: Kill switch failed to deactivate.');
    process.exit(1);
  }

  // ── 6. CALLING & WHATSAPP CONFIRMATION & CREDENTIAL CHECK TEST ──────────────
  console.log('\n[TEST 6/7] Testing Calling & WhatsApp Confirmation & Credential Check...');
  const callRes = await agentOrchestrator.orchestrate('Jarvis, call Mom and tell her I will be late for dinner');
  if (callRes.handled && callRes.text.includes('MANDATORY PRE-ACTION CONFIRMATION') && callRes.text.includes('Mom')) {
    console.log('  ✅ SUCCESS: Outbound call generated mandatory pre-action confirmation!');
  } else {
    console.error('  ❌ FAILED: Calling agent failed to generate confirmation request.');
    process.exit(1);
  }

  // Confirm call and verify credential requirement report
  const confirmCallRes = await systemControl.tryExecute('Jarvis, confirm call');
  if (confirmCallRes.handled && confirmCallRes.message?.includes('REAL API SETUP REQUIRED') && confirmCallRes.message?.includes('TWILIO_ACCOUNT_SID')) {
    console.log('  ✅ SUCCESS: Confirmed call reported real Twilio API setup requirement cleanly without faking!');
  } else {
    console.error('  ❌ FAILED: Calling agent failed missing credential report.');
    process.exit(1);
  }

  // WhatsApp test
  const waRes = await agentOrchestrator.orchestrate('Jarvis, send WhatsApp to Alex saying Happy Birthday!');
  if (waRes.handled && waRes.text.includes('MANDATORY PRE-ACTION CONFIRMATION') && waRes.text.includes('Alex')) {
    console.log('  ✅ SUCCESS: Outbound WhatsApp generated mandatory pre-action confirmation!');
  } else {
    console.error('  ❌ FAILED: WhatsApp agent failed to generate confirmation request.');
    process.exit(1);
  }

  const confirmWaRes = await systemControl.tryExecute('Jarvis, confirm whatsapp');
  if (confirmWaRes.handled && confirmWaRes.message?.includes('REAL API SETUP REQUIRED') && confirmWaRes.message?.includes('WHATSAPP_API_TOKEN')) {
    console.log('  ✅ SUCCESS: Confirmed WhatsApp reported real WhatsApp Business API setup requirement cleanly!');
  } else {
    console.error('  ❌ FAILED: WhatsApp agent failed missing credential report.');
    process.exit(1);
  }

  // ── 7. ROLLBACK VERIFICATION & CLEANUP TEST ──────────────────────────
  console.log('\n[TEST 7/7] Testing Broken Agent Rollback & Removal...');
  const brokenCheck = agentRegistry.getAgent('which_auto_agent');
  if (brokenCheck === null) {
    console.log('  ✅ SUCCESS: Broken WhichAgent ("which_auto_agent") has been completely deregistered and removed from AgentRegistry!');
  } else {
    console.error('  ❌ FAILED: WhichAgent ("which_auto_agent") is still registered in AgentRegistry.');
    process.exit(1);
  }

  console.log('\n================================================================');
  console.log('   🎉 ALL 7 STAGE 4 AUTONOMY & SAFETY VERIFICATIONS PASSED 100% ');
  console.log('================================================================');
}

runStage4Verification().catch((err) => {
  console.error('Unhandled Verification Failure:', err);
  process.exit(1);
});
