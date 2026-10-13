declare const process: any;

import { bootstrap } from '../src/app/bootstrap';
import { financialManager } from '../src/entities/financial/FinancialManager';

bootstrap();

async function runTest() {
  console.log('========================================================');
  console.log('    TESTING FINANCIAL MANAGER GUEST PROFILE RETRIEVAL   ');
  console.log('========================================================\n');

  // Test 1: Retrieve profile for usr_guest without pre-creating it
  console.log('[1] Fetching profile for "usr_guest"...');
  try {
    const profile = financialManager.getProfile('usr_guest');
    console.log(`  SUCCESS: Retrieved profile for user "${profile.userId}"`);
    console.log(`  Name: ${profile.personalInfo.fullName}, Age: ${profile.personalInfo.age}`);
    console.log(`  Annual Income: $${profile.financialMetrics.annualIncome}, Assets: $${profile.financialMetrics.totalAssets}`);
    console.log(`  Risk Category: ${profile.riskCategory.toUpperCase()}`);
  } catch (e: any) {
    console.error(`  ❌ FAILED: getProfile threw error: ${e.message}`);
    process.exit(1);
  }

  // Test 2: Retrieve portfolio for usr_guest
  console.log('\n[2] Fetching portfolio for "usr_guest"...');
  try {
    const portfolio = financialManager.getPortfolio('usr_guest');
    console.log(`  SUCCESS: Retrieved portfolio with cash balance $${portfolio.cashBalance}`);
  } catch (e: any) {
    console.error(`  ❌ FAILED: getPortfolio threw error: ${e.message}`);
    process.exit(1);
  }

  // Test 3: Call getProfile without args (defaults to active user / usr_guest)
  console.log('\n[3] Calling getProfile() without args...');
  try {
    const profile = financialManager.getProfile();
    console.log(`  SUCCESS: Retrieved default profile for active user "${profile.userId}"`);
  } catch (e: any) {
    console.error(`  ❌ FAILED: getProfile() threw error: ${e.message}`);
    process.exit(1);
  }

  console.log('\n========================================================');
  console.log('    FINANCIAL MANAGER GUEST PROFILE TEST PASSED 100%    ');
  console.log('========================================================');
}

runTest();
