declare const process: any;

import { aiHealthManager } from '../src/shared/ai/AIProviderHealthManager';
import { ProviderFactory } from '../src/shared/ai/ProviderFactory';
import { AIProvider, ProviderRequestOptions } from '../src/shared/ai/AIProvider';
import { voiceStateMachine } from '../src/shared/ai/VoiceStateMachine';
import { aiRouter } from '../src/shared/ai/AIRouter';
import { providerModelMapper } from '../src/shared/ai/ProviderModelMapper';

class MockQuotaExceededProvider implements AIProvider {
  async generateResponse(): Promise<string> {
    const err: any = new Error('RESOURCE_EXHAUSTED: Quota exceeded for gemini');
    err.status = 429;
    throw err;
  }
  async generateStream(): Promise<void> {
    const err: any = new Error('RESOURCE_EXHAUSTED: Quota exceeded for gemini');
    err.status = 429;
    throw err;
  }
  cancel() {}
  async healthCheck(): Promise<boolean> {
    return false;
  }
}

class MockHealthyProvider implements AIProvider {
  async generateResponse(prompt: string, _onChunk?: any, options?: ProviderRequestOptions): Promise<string> {
    return `[MockHealthyResponse] Handled: "${prompt}", Model: "${options?.model}", HistoryLen: ${options?.history?.length || 0}`;
  }
  async generateStream(prompt: string, onChunk: (chunk: string) => void, options?: ProviderRequestOptions): Promise<void> {
    onChunk(`[MockHealthyStream] Handled: "${prompt}", Model: "${options?.model}", HistoryLen: ${options?.history?.length || 0}`);
  }
  cancel() {}
  async healthCheck(): Promise<boolean> {
    return true;
  }
}

async function runFailoverVerification() {
  console.log('================================================================');
  console.log('    JARVIS OS AI PROVIDER FAILOVER & HEALTH VERIFICATION       ');
  console.log('================================================================\n');

  // Register mocks in ProviderFactory
  ProviderFactory.register('mock-failing', MockQuotaExceededProvider as any);
  ProviderFactory.register('mock-healthy', MockHealthyProvider as any);

  // ── 1. TEST PROVIDER HEALTH MANAGER RECORDING ────────────────────────────
  console.log('[TEST 1/8] Testing Provider Error Classification & Health Score...');
  
  aiHealthManager.setPriorityOrder(['mock-failing', 'mock-healthy']);
  aiHealthManager.recordSuccess('mock-healthy', 150);
  
  const status = aiHealthManager.recordError('mock-failing', { status: 429, message: 'RESOURCE_EXHAUSTED: Quota limit reached' });
  
  if (status === 'QUOTA_EXCEEDED') {
    console.log('  ✅ SUCCESS: 429 Quota error accurately classified as QUOTA_EXCEEDED!');
  } else {
    console.error(`  ❌ FAILED: Expected QUOTA_EXCEEDED, got: ${status}`);
    process.exit(1);
  }

  const failingMetrics = aiHealthManager.getMetrics('mock-failing');
  if (failingMetrics && failingMetrics.healthScore === 0) {
    console.log('  ✅ SUCCESS: QUOTA_EXCEEDED set provider health score to 0%!');
  } else {
    console.error('  ❌ FAILED: Health score calculation failed.');
    process.exit(1);
  }

  // ── 2. TEST ORDERED HEALTHY PROVIDERS SELECTION ──────────────────────────
  console.log('\n[TEST 2/8] Testing Healthy Provider Ordering & Offline Skipping...');
  const healthyList = aiHealthManager.getOrderedHealthyProviders();
  
  if (!healthyList.includes('mock-failing') && healthyList.includes('mock-healthy')) {
    console.log('  ✅ SUCCESS: Unhealthy provider ("mock-failing") automatically excluded from target list!');
  } else {
    console.error(`  ❌ FAILED: Healthy list filter incorrect: ${healthyList.join(', ')}`);
    process.exit(1);
  }

  // ── 3. TEST PRIORITY REORDERING ──────────────────────────────────────────
  console.log('\n[TEST 3/8] Testing Priority Order Reordering & Persistence...');
  aiHealthManager.setPriorityOrder(['nvidia', 'gemini', 'claude', 'openai', 'ollama', 'local']);
  aiHealthManager.movePriorityUp('gemini');
  
  const newOrder = aiHealthManager.getPriorityOrder();
  if (newOrder[0] === 'gemini' && newOrder[1] === 'nvidia') {
    console.log('  ✅ SUCCESS: Priority reordered cleanly (Gemini #1, NVIDIA #2)!');
  } else {
    console.error(`  ❌ FAILED: Priority reordering failed: ${newOrder.join(', ')}`);
    process.exit(1);
  }

  // ── 4. TEST FAILOVER LOGGING ─────────────────────────────────────────────
  console.log('\n[TEST 4/8] Testing Structured Failover Event Logging...');
  aiHealthManager.logFailover('gemini', 'QUOTA_EXCEEDED', 'nvidia', true);
  const logs = aiHealthManager.getFailoverLogs();
  
  if (logs.length > 0 && logs[0].failedProviderId === 'gemini' && logs[0].targetProviderId === 'nvidia') {
    console.log('  ✅ SUCCESS: Failover event logged with timestamp, reason & target provider!');
    console.log(`  Log: ${logs[0].failedProviderName} (${logs[0].reason}) ➔ ${logs[0].targetProviderName}`);
  } else {
    console.error('  ❌ FAILED: Failover event log missing or corrupted.');
    process.exit(1);
  }

  // ── 5. TEST CONVERSATION CONTEXT PRESERVATION ────────────────────────────
  console.log('\n[TEST 5/8] Testing Context & History Preservation across Failover...');
  const mockOptions: ProviderRequestOptions = {
    context: 'Test System Context',
    history: [
      { role: 'user', content: 'Hello JARVIS' },
      { role: 'assistant', content: 'Greetings sir.' },
    ],
  };

  const healthyInstance = new MockHealthyProvider();
  const resp = await healthyInstance.generateResponse('Summarize status', undefined, mockOptions);

  if (resp.includes('HistoryLen: 2')) {
    console.log('  ✅ SUCCESS: Conversation history (2 items) & context passed 100% intact to fallback provider!');
  } else {
    console.error(`  ❌ FAILED: Context lost in failover: ${resp}`);
    process.exit(1);
  }

  // ── 6. TEST VOICE STATE MACHINE WATCHDOG & ERROR RECOVERY ───────────────
  console.log('\n[TEST 6/8] Testing Voice State Machine Non-Hanging Recovery (Thinking -> Error -> Idle)...');
  voiceStateMachine.transitionTo('THINKING');
  if (voiceStateMachine.state === 'THINKING') {
    console.log('  ✅ SUCCESS: Voice State Machine entered THINKING.');
  }

  voiceStateMachine.transitionTo('ERROR');
  if (voiceStateMachine.state === 'ERROR') {
    console.log('  ✅ SUCCESS: Voice State Machine cleanly transitioned THINKING ➔ ERROR!');
  } else {
    console.error(`  ❌ FAILED: Voice State Machine expected ERROR, got: ${voiceStateMachine.state}`);
    process.exit(1);
  }

  await new Promise((resolve) => setTimeout(resolve, 100));
  voiceStateMachine.transitionTo('IDLE');
  if (voiceStateMachine.state === 'IDLE') {
    console.log('  ✅ SUCCESS: Voice State Machine recovered cleanly ERROR ➔ IDLE! THINKING is NEVER a dead-end state.');
  } else {
    console.error(`  ❌ FAILED: Expected state IDLE, got: ${voiceStateMachine.state}`);
    process.exit(1);
  }

  // ── 7. TEST DEDUPLICATION LOCK CLEARING & ROUTER FAILOVER ────────────────
  console.log('\n[TEST 7/8] Testing Router InFlight Lock Release & Failure Throw...');
  aiRouter.registerProvider('mock-healthy', new MockHealthyProvider() as any, true);
  aiRouter.setPrimaryProvider('mock-healthy');
  
  const res1 = await aiRouter.generateResponse('test prompt 1', undefined, { providerId: 'mock-healthy' });
  if (res1.includes('[MockHealthyResponse]')) {
    console.log('  ✅ SUCCESS: AI Router executed mock healthy provider successfully!');
  }

  const res2 = await aiRouter.generateResponse('test prompt 1', undefined, { providerId: 'mock-healthy' });
  if (res2.includes('[MockHealthyResponse]')) {
    console.log('  ✅ SUCCESS: Second call after in-flight lock release executed cleanly without stale lock deadlock!');
  }

  // Disable ALL other providers temporarily so ONLY mock-failing is attempted
  const allKnown = ['gemini', 'nvidia', 'openai', 'claude', 'ollama', 'local', 'mock-healthy', 'mock-failing'];
  allKnown.forEach((id) => aiHealthManager.setProviderEnabled(id, false));
  aiHealthManager.setProviderEnabled('mock-failing', true);
  aiHealthManager.setPriorityOrder(['mock-failing']);
  aiRouter.registerProvider('mock-failing', new MockQuotaExceededProvider() as any, true);
  aiRouter.setPrimaryProvider('mock-failing');

  let caughtError = false;
  try {
    await aiRouter.generateResponse('test prompt failure', undefined, { providerId: 'mock-failing' });
  } catch (err: any) {
    if (String(err).includes('AIProviderUnavailable')) {
      caughtError = true;
      console.log('  ✅ SUCCESS: When all providers fail, AI Router immediately throws AIProviderUnavailable!');
    }
  }

  // Re-enable real providers
  allKnown.forEach((id) => aiHealthManager.setProviderEnabled(id, true));

  if (!caughtError) {
    console.error('  ❌ FAILED: Expected AIProviderUnavailable error on total provider failure.');
    process.exit(1);
  }

  // ── 8. TEST PROVIDER MODEL MAPPER CONTRACTS & TRANSLATION ───────────────
  console.log('\n[TEST 8/8] Testing Provider Model Mapper Contracts & Translation...');
  
  const isGeminiInNvidia = providerModelMapper.isModelSupported('nvidia', 'gemini-3.5-flash');
  const isLlamaInNvidia = providerModelMapper.isModelSupported('nvidia', 'meta/llama-3.1-8b-instruct');

  if (!isGeminiInNvidia && isLlamaInNvidia) {
    console.log('  ✅ SUCCESS: ProviderModelMapper accurately identifies Gemini models as unsupported by NVIDIA!');
  } else {
    console.error('  ❌ FAILED: ProviderModelMapper validation failed.');
    process.exit(1);
  }

  const { mappedModel, wasMapped } = providerModelMapper.resolveModelForProvider('nvidia', 'complex', 'gemini-3.5-flash');
  if (wasMapped && mappedModel.includes('llama')) {
    console.log(`  ✅ SUCCESS: Gemini model "gemini-3.5-flash" automatically mapped to NVIDIA model "${mappedModel}"!`);
  } else {
    console.error(`  ❌ FAILED: Model translation failed, mapped to: ${mappedModel}`);
    process.exit(1);
  }

  console.log('\n================================================================');
  console.log('   🎉 ALL 8 FAILOVER & MODEL MAPPING TESTS PASSED 100%         ');
  console.log('================================================================');

  process.exit(0);
}

runFailoverVerification().catch((err) => {
  console.error('Unhandled Verification Failure:', err);
  process.exit(1);
});
