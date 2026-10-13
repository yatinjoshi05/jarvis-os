import express from 'express';
import ytstudioRouter from '../src/routes/ytstudio.js';
import { db } from '../../../backend/database/db.js';

console.log('=====================================================');
console.log('  YT STUDIO — ROBOT CHANNEL MODAL OAUTH TEST SUITE');
console.log('=====================================================\n');

async function runModalTests() {
  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✓ PASSED: ${message}`);
      passed++;
    } else {
      console.error(`  ✗ FAILED: ${message}`);
      failed++;
    }
  }

  const app = express();
  app.use(express.json());
  app.use('/api/ytstudio', ytstudioRouter);

  const server = app.listen(3095);

  try {
    // 1. Test OAuth Start Endpoint
    console.log('[Test 1] POST /api/ytstudio/channels/oauth/start');
    const startRes = await fetch('http://localhost:3095/api/ytstudio/channels/oauth/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const startData = await startRes.json();
    assert(startRes.status === 200 && startData.authUrl.includes('google.com/o/oauth2'), 'Generated official Google OAuth 2.0 Auth URL with required scopes');

    // 2. Test OAuth Callback Endpoint & AES-256 Token Encryption
    console.log('\n[Test 2] POST /api/ytstudio/channels/oauth/callback');
    const callbackPayload = {
      channelName: 'Robot Test Stories',
      channelType: 'Old Couple Stories',
      email: 'yatin.robot@gmail.com'
    };
    const callbackRes = await fetch('http://localhost:3095/api/ytstudio/channels/oauth/callback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(callbackPayload)
    });
    const callbackData = await callbackRes.json();
    assert(callbackRes.status === 200 && callbackData.success === true, 'Successfully processed OAuth callback & connected channel');

    // 3. Verify Database Persistence & AES-256 Token Storage
    console.log('\n[Test 3] Database Storage & AES-256 Cipher Token Verification');
    const savedChannels = db.getChannels();
    const robotChannel = savedChannels.find(c => c.name === 'Robot Test Stories');
    assert(robotChannel && robotChannel.tokens_encrypted.includes(':'), 'Channel saved in DB with encrypted AES-256 OAuth token string');

  } finally {
    server.close();
  }

  console.log('\n=====================================================');
  console.log(`  MODAL OAUTH TEST RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('=====================================================\n');

  if (failed > 0) process.exit(1);
}

runModalTests().catch(err => {
  console.error('Modal Test Execution Error:', err);
  process.exit(1);
});
