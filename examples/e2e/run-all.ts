// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

/* eslint-disable no-console */

/**
 * E2E Integration Suite Runner
 *
 * Runs all E2E tests in sequence and produces a summary report.
 *
 * Prerequisites:
 * - Anvil fork running: ./examples/e2e/start-anvil.sh
 * - Schema deployed via deploy-schema.ts (need the UID)
 *
 * Usage:
 *   SCHEMA_UID=0x... npx tsx examples/e2e/run-all.ts
 *
 * Quick start:
 *   1. Start Anvil: ./examples/e2e/start-anvil.sh
 *   2. Deploy schema: npx tsx examples/e2e/deploy-schema.ts
 *   3. Copy the UID and run: SCHEMA_UID=0x... npx tsx examples/e2e/run-all.ts
 */

import { spawnSync } from 'child_process';
import { ANVIL_CONFIG } from './anvil-config';

interface TestResult {
  name: string;
  file: string;
  passed: boolean;
  duration: number;
  error?: string;
}

/**
 * Get the schema UID from environment or command line argument.
 */
function getSchemaUID(): string {
  const envUID = process.env.SCHEMA_UID;
  if (envUID && envUID.startsWith('0x')) {
    return envUID;
  }

  const argUID = process.argv[2];
  if (argUID && argUID.startsWith('0x')) {
    return argUID;
  }

  console.error('Error: Schema UID required');
  console.error('');
  console.error('Usage:');
  console.error('  SCHEMA_UID=0x... npx tsx examples/e2e/run-all.ts');
  console.error('  npx tsx examples/e2e/run-all.ts 0x...');
  console.error('');
  console.error('First run deploy-schema.ts to get the UID:');
  console.error('  npx tsx examples/e2e/deploy-schema.ts');
  process.exit(1);
}

/**
 * Check if Anvil is running.
 */
async function checkAnvilConnection(): Promise<boolean> {
  try {
    const response = await fetch(ANVIL_CONFIG.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_blockNumber',
        params: [],
        id: 1,
      }),
    });
    const data = await response.json();
    return data.result !== undefined;
  } catch {
    return false;
  }
}

/**
 * Run a single test file.
 */
function runTest(name: string, file: string, schemaUID: string): TestResult {
  const startTime = Date.now();

  try {
    // Run test with schema UID as environment variable
    const result = spawnSync('npx', ['tsx', `examples/e2e/${file}`, schemaUID], {
      stdio: 'inherit',
      env: { ...process.env, SCHEMA_UID: schemaUID },
      timeout: 60000, // 60 second timeout per test
    });

    const duration = Date.now() - startTime;

    if (result.status === 0) {
      return { name, file, passed: true, duration };
    } else {
      return {
        name,
        file,
        passed: false,
        duration,
        error: result.error?.message || `Exit code: ${result.status}`,
      };
    }
  } catch (error) {
    const duration = Date.now() - startTime;
    return {
      name,
      file,
      passed: false,
      duration,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Format duration in human-readable format.
 */
function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Run the full E2E integration suite.
 */
async function runE2ESuite(): Promise<void> {
  console.log('');
  console.log('╔' + '═'.repeat(58) + '╗');
  console.log('║' + '  ASTRAL SDK - Multi-Schema E2E Integration Suite  '.padEnd(58) + '║');
  console.log('╚' + '═'.repeat(58) + '╝');
  console.log('');

  // Get schema UID
  const schemaUID = getSchemaUID();
  console.log(`Schema UID: ${schemaUID}`);
  console.log('');

  // Check Anvil connection (required for onchain test)
  console.log('Checking Anvil connection...');
  const anvilRunning = await checkAnvilConnection();

  if (!anvilRunning) {
    console.log('');
    console.log('⚠️  Warning: Anvil is not running');
    console.log('   Onchain tests will fail without Anvil.');
    console.log('   Start Anvil with: ./examples/e2e/start-anvil.sh');
    console.log('');
  } else {
    console.log('✓ Anvil is running');
    console.log('');
  }

  // Define test suite
  const tests = [
    { name: 'SDK Configuration', file: 'sdk-config-test.ts' },
    { name: 'Offchain Attestation', file: 'offchain-test.ts' },
    { name: 'Onchain Attestation', file: 'onchain-test.ts' },
  ];

  const results: TestResult[] = [];
  const suiteStartTime = Date.now();

  // Run each test
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log('');
    console.log('─'.repeat(60));
    console.log(`[${i + 1}/${tests.length}] Running: ${test.name}`);
    console.log('─'.repeat(60));
    console.log('');

    const result = runTest(test.name, test.file, schemaUID);
    results.push(result);

    if (!result.passed) {
      console.log('');
      console.log(`✗ ${test.name} FAILED`);
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }
    }
  }

  const suiteDuration = Date.now() - suiteStartTime;

  // Print summary
  console.log('');
  console.log('');
  console.log('╔' + '═'.repeat(58) + '╗');
  console.log('║' + '  TEST SUMMARY  '.padStart(37).padEnd(58) + '║');
  console.log('╠' + '═'.repeat(58) + '╣');

  for (const result of results) {
    const status = result.passed ? '✓ PASS' : '✗ FAIL';
    const duration = formatDuration(result.duration);
    const line = `  ${status}  ${result.name}`.padEnd(45) + duration.padStart(10);
    console.log('║' + line.padEnd(58) + '║');
  }

  console.log('╠' + '═'.repeat(58) + '╣');

  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  const allPassed = passed === total;

  const summaryLine = allPassed
    ? `  ALL ${total} TESTS PASSED`.padEnd(45) + formatDuration(suiteDuration).padStart(10)
    : `  ${passed}/${total} TESTS PASSED`.padEnd(45) + formatDuration(suiteDuration).padStart(10);

  console.log('║' + summaryLine.padEnd(58) + '║');
  console.log('╚' + '═'.repeat(58) + '╝');
  console.log('');

  if (allPassed) {
    console.log('🎉 All E2E tests passed! Multi-schema support is working correctly.');
    console.log('');
  } else {
    console.log('❌ Some tests failed. Check the output above for details.');
    console.log('');

    // List failed tests
    const failedTests = results.filter(r => !r.passed);
    console.log('Failed tests:');
    for (const failed of failedTests) {
      console.log(`  - ${failed.name}: ${failed.error || 'Unknown error'}`);
    }
    console.log('');
  }

  process.exit(allPassed ? 0 : 1);
}

// Run the suite
runE2ESuite().catch(error => {
  console.error('Suite execution failed:', error);
  process.exit(1);
});
