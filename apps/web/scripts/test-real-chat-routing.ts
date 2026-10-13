if (typeof localStorage === 'undefined') {
  const store: Record<string, string> = {};
  (globalThis as any).localStorage = {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, val: string) => { store[key] = val; },
    removeItem: (key: string) => { delete store[key]; },
  };
}

if (typeof window === 'undefined') {
  (globalThis as any).window = {
    document: {
      documentElement: {
        classList: { add: () => {}, remove: () => {} },
      },
    },
  };
}

declare const process: any;

import { bootstrap } from '../src/app/bootstrap';
import { systemControl, isCompoundOrAnalyticalRequest } from '../src/shared/ai/SystemControl';
import { agentOrchestrator } from '../src/shared/agents/AgentOrchestrator';

bootstrap();

async function verifyRouting() {
  console.log('=== JARVIS OS: Chat Request Routing & Precedence Verification ===\n');

  const testCases = [
    {
      name: 'Bug Case: Search + Analyze',
      prompt: 'Search the web for the latest mutual fund rates and analyze if I should invest more',
      expectSystemControlHandled: false,
      expectOrchestratorHandled: true,
      expectedAgents: ['browser_agent', 'investment_agent'],
    },
    {
      name: 'Simple YouTube Search Command',
      prompt: 'search YouTube for lo-fi beats',
      expectSystemControlHandled: true,
      expectOrchestratorHandled: false,
    },
    {
      name: 'Simple Web Search Command',
      prompt: 'search the web for modern web design patterns',
      expectSystemControlHandled: true,
      expectOrchestratorHandled: false,
    },
    {
      name: 'Compound Analytical Query 1 (Stock + Calculate)',
      prompt: 'Look up AAPL stock price and calculate 5-day moving average',
      expectSystemControlHandled: false,
      expectOrchestratorHandled: true,
      expectedAgents: ['trading_agent'],
    },
    {
      name: 'Compound Analytical Query 2 (Search + Summarize)',
      prompt: 'Search Google for climate change statistics and summarize key findings',
      expectSystemControlHandled: false,
      expectOrchestratorHandled: true,
      expectedAgents: ['browser_agent'],
    },
  ];

  for (const tc of testCases) {
    console.log(`\n--------------------------------------------------`);
    console.log(`TEST: ${tc.name}`);
    console.log(`Prompt: "${tc.prompt}"`);

    const isCompound = isCompoundOrAnalyticalRequest(tc.prompt);
    console.log(`isCompoundOrAnalyticalRequest: ${isCompound}`);

    // Step 1: SystemControl check
    let systemHandled = false;
    let systemMessage = '';
    try {
      const sysRes = await systemControl.tryExecute(tc.prompt);
      systemHandled = sysRes.handled;
      if (sysRes.handled && sysRes.message) {
        systemMessage = sysRes.message;
      }
    } catch (e: any) {
      if (e.message?.includes('System Control is available only in the JARVIS desktop app')) {
        systemHandled = true;
        systemMessage = '[Tauri System Command Fired]';
      } else {
        console.error('SystemControl Error:', e);
      }
    }

    console.log(`SystemControl handled: ${systemHandled} (expected ${tc.expectSystemControlHandled})`);
    if (systemHandled) {
      console.log(`SystemControl Message: "${systemMessage}"`);
    }

    if (systemHandled !== tc.expectSystemControlHandled) {
      console.error(`❌ FAIL: SystemControl handled mismatch for "${tc.prompt}"`);
      process.exit(1);
    }

    // Step 2: If SystemControl didn't handle, route to AgentOrchestrator
    if (!systemHandled) {
      const orchResult = await agentOrchestrator.orchestrate(tc.prompt);
      console.log(`AgentOrchestrator handled: ${orchResult.handled} (expected ${tc.expectOrchestratorHandled})`);
      console.log(`Contributing Agents: ${JSON.stringify(orchResult.contributingAgents)}`);
      console.log(`Synthesized Response Output:\n${orchResult.text}\n`);

      if (orchResult.handled !== tc.expectOrchestratorHandled) {
        console.error(`❌ FAIL: AgentOrchestrator handled mismatch for "${tc.prompt}"`);
        process.exit(1);
      }

      if (tc.expectedAgents) {
        for (const expectedAgent of tc.expectedAgents) {
          const matched = orchResult.contributingAgents.some(a => a.toLowerCase().includes(expectedAgent.replace('_agent', '').toLowerCase()));
          if (!matched) {
            console.error(`❌ FAIL: Expected agent ${expectedAgent} in contributing agents: ${JSON.stringify(orchResult.contributingAgents)}`);
            process.exit(1);
          }
        }
      }
    }

    console.log(`✅ PASS: ${tc.name}`);
  }

  console.log('\n==================================================');
  console.log('ALL CHAT ROUTING AND PRECEDENCE TESTS PASSED!');
  console.log('==================================================\n');
}

verifyRouting().catch(err => {
  console.error('Test Execution Failed:', err);
  process.exit(1);
});
