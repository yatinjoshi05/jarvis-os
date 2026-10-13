declare const process: any;

import { bootstrap } from '../src/app/bootstrap';
import { systemControl } from '../src/shared/ai/SystemControl';
import { MemoryContextBuilder } from '../src/shared/memory/MemoryContextBuilder';

bootstrap();

async function runTest() {
  console.log('========================================================');
  console.log('    TESTING JARVIS OS REAL-TIME SYSTEM & WEATHER ACCESS  ');
  console.log('========================================================\n');

  // Test 1: Current Time Intent
  console.log('[1] Testing prompt: "what is the current time"...');
  const timeRes = await systemControl.tryExecute('what is the current time');
  if (timeRes.handled && timeRes.message) {
    console.log(`  SUCCESS: Handled natively!\n  Response:\n${timeRes.message}`);
  } else {
    console.error('  ❌ FAILED to handle current time prompt.');
    process.exit(1);
  }

  // Test 2: Current Date Intent
  console.log('\n[2] Testing prompt: "what is today\'s date"...');
  const dateRes = await systemControl.tryExecute("what is today's date");
  if (dateRes.handled && dateRes.message) {
    console.log(`  SUCCESS: Handled natively!\n  Response:\n${dateRes.message}`);
  } else {
    console.error('  ❌ FAILED to handle current date prompt.');
    process.exit(1);
  }

  // Test 3: Live Weather Intent
  console.log('\n[3] Testing prompt: "what is the weather in London"...');
  const weatherRes = await systemControl.tryExecute('what is the weather in London');
  if (weatherRes.handled && weatherRes.message) {
    console.log(`  SUCCESS: Live weather fetched successfully!\n  Response:\n${weatherRes.message}`);
  } else {
    console.error('  ❌ FAILED to handle weather prompt.');
    process.exit(1);
  }

  // Test 4: System Status Intent
  console.log('\n[4] Testing prompt: "system status"...');
  const sysRes = await systemControl.tryExecute('system status');
  if (sysRes.handled && sysRes.message) {
    console.log(`  SUCCESS: Handled system status!\n  Response:\n${sysRes.message}`);
  } else {
    console.error('  ❌ FAILED to handle system status prompt.');
    process.exit(1);
  }

  // Test 5: MemoryContextBuilder system environment prompt injection
  console.log('\n[5] Testing MemoryContextBuilder environment context injection...');
  const memContext = await MemoryContextBuilder.buildContext('Help me organize my work');
  if (memContext.includes('JARVIS OS COMPUTER SYSTEM CONTEXT') && memContext.includes('Current Local Time:')) {
    console.log('  SUCCESS: Environment context successfully injected into LLM memory context!');
  } else {
    console.error('  ❌ FAILED: Environment context missing from MemoryContextBuilder output.');
    process.exit(1);
  }

  console.log('\n========================================================');
  console.log('    JARVIS OS SYSTEM & WEATHER ACCESS TEST PASSED 100%   ');
  console.log('========================================================');
}

runTest();
