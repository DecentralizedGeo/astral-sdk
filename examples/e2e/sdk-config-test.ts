// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

/* eslint-disable no-console */

/**
 * SDK Configuration Test for Multi-Schema Support
 *
 * This script tests that the AstralSDK properly handles custom schemas
 * including pre-registration, default schema configuration, and validation caching.
 *
 * Prerequisites:
 * - Schema deployed via deploy-schema.ts (need the UID)
 *
 * Usage:
 *   SCHEMA_UID=0x... npx tsx examples/e2e/sdk-config-test.ts
 *
 * Or run deploy-schema.ts first and copy the UID.
 */

import { AstralSDK } from '../../src/core/AstralSDK';
import { ASSET_TRACKING_SCHEMA_STRING, withSchemaUID, SCHEMA_VALIDATION } from './custom-schema';
import { RuntimeSchemaConfig } from '../../src/core/types';

/**
 * Get the schema UID from environment or command line argument.
 */
function getSchemaUID(): `0x${string}` {
  // Check environment variable first
  const envUID = process.env.SCHEMA_UID;
  if (envUID && envUID.startsWith('0x')) {
    return envUID as `0x${string}`;
  }

  // Check command line argument
  const argUID = process.argv[2];
  if (argUID && argUID.startsWith('0x')) {
    return argUID as `0x${string}`;
  }

  console.error('Error: Schema UID required');
  console.error('');
  console.error('Usage:');
  console.error('  SCHEMA_UID=0x... npx tsx examples/e2e/sdk-config-test.ts');
  console.error('  npx tsx examples/e2e/sdk-config-test.ts 0x...');
  console.error('');
  console.error('First run deploy-schema.ts to get the UID:');
  console.error('  npx tsx examples/e2e/deploy-schema.ts');
  process.exit(1);
}

/**
 * Test 1: Initialize SDK with pre-registered schemas
 */
function testPreRegisteredSchema(schema: RuntimeSchemaConfig): boolean {
  console.log('Test 1: Pre-registered schema initialization');
  console.log('-'.repeat(50));

  try {
    const sdk = new AstralSDK({
      schemas: [schema],
      debug: true,
    });

    const cache = sdk.getSchemaCache();

    // Verify schema is in cache
    if (!cache.has(schema.uid)) {
      console.error('  ✗ Schema not found in cache');
      return false;
    }
    console.log('  ✓ Schema found in cache');

    // Verify cache size
    const cacheSize = cache.size;
    // Cache should have at least 2 entries: default schema + our custom schema
    if (cacheSize < 2) {
      console.error(`  ✗ Cache size unexpected: ${cacheSize}`);
      return false;
    }
    console.log(`  ✓ Cache contains ${cacheSize} schemas`);

    console.log('  ✓ Test 1 PASSED');
    return true;
  } catch (error) {
    console.error('  ✗ Test 1 FAILED:', error);
    return false;
  }
}

/**
 * Test 2: Initialize SDK with custom default schema
 */
function testCustomDefaultSchema(schema: RuntimeSchemaConfig): boolean {
  console.log('');
  console.log('Test 2: Custom default schema configuration');
  console.log('-'.repeat(50));

  try {
    const sdk = new AstralSDK({
      defaultSchema: schema,
      debug: true,
    });

    const defaultSchema = sdk.getDefaultSchema();

    // Verify default schema UID matches
    if (defaultSchema.uid !== schema.uid) {
      console.error(`  ✗ Default schema UID mismatch`);
      console.error(`    Expected: ${schema.uid}`);
      console.error(`    Got: ${defaultSchema.uid}`);
      return false;
    }
    console.log('  ✓ Default schema UID matches');

    // Verify default schema raw string matches
    if (defaultSchema.rawString !== schema.rawString) {
      console.error('  ✗ Default schema rawString mismatch');
      return false;
    }
    console.log('  ✓ Default schema rawString matches');

    console.log('  ✓ Test 2 PASSED');
    return true;
  } catch (error) {
    console.error('  ✗ Test 2 FAILED:', error);
    return false;
  }
}

/**
 * Test 3: Verify schema validation result
 */
function testSchemaValidation(schema: RuntimeSchemaConfig): boolean {
  console.log('');
  console.log('Test 3: Schema validation result verification');
  console.log('-'.repeat(50));

  try {
    const sdk = new AstralSDK({
      schemas: [schema],
      debug: true,
    });

    const cache = sdk.getSchemaCache();
    const cachedResult = cache.get(schema.uid);

    if (!cachedResult) {
      console.error('  ✗ Validation result not found in cache');
      return false;
    }
    console.log('  ✓ Validation result retrieved from cache');

    // Extract the actual validation result from the cache wrapper
    const validationResult = cachedResult.result;

    // Verify conformance
    if (!validationResult.conformant) {
      console.error('  ✗ Schema not marked as conformant');
      console.error(`    Missing: ${validationResult.missing.join(', ')}`);
      return false;
    }
    console.log('  ✓ Schema is Location Protocol conformant');

    // Verify version detection
    if (validationResult.version !== 2) {
      console.error(`  ✗ Version detection failed: expected 2, got ${validationResult.version}`);
      return false;
    }
    console.log('  ✓ Detected as Location Protocol v0.2');

    // Verify field detection
    const expectedFields = [
      'specVersion',
      'srs',
      'locationType',
      'location',
      'assetId',
      'owner',
      'timestamp',
    ];
    const actualFieldNames = validationResult.fields.map(f => f.name);

    for (const field of expectedFields) {
      if (!actualFieldNames.includes(field)) {
        console.error(`  ✗ Missing expected field: ${field}`);
        return false;
      }
    }
    console.log(`  ✓ All ${expectedFields.length} fields detected`);

    console.log('  ✓ Test 3 PASSED');
    return true;
  } catch (error) {
    console.error('  ✗ Test 3 FAILED:', error);
    return false;
  }
}

/**
 * Test 4: Verify module-level schema validation
 */
function testModuleLevelValidation(): boolean {
  console.log('');
  console.log('Test 4: Module-level schema validation');
  console.log('-'.repeat(50));

  try {
    // SCHEMA_VALIDATION is computed at module load time
    if (!SCHEMA_VALIDATION.valid) {
      console.error('  ✗ Schema not valid EAS format');
      return false;
    }
    console.log('  ✓ Valid EAS schema format');

    if (!SCHEMA_VALIDATION.conformant) {
      console.error('  ✗ Schema not LP conformant at module level');
      return false;
    }
    console.log('  ✓ LP conformant at module level');

    if (SCHEMA_VALIDATION.version !== 2) {
      console.error(`  ✗ Version mismatch: expected 2, got ${SCHEMA_VALIDATION.version}`);
      return false;
    }
    console.log('  ✓ Version v0.2 detected at module level');

    console.log('  ✓ Test 4 PASSED');
    return true;
  } catch (error) {
    console.error('  ✗ Test 4 FAILED:', error);
    return false;
  }
}

/**
 * Test 5: Strict validation mode
 */
function testStrictValidationMode(schema: RuntimeSchemaConfig): boolean {
  console.log('');
  console.log('Test 5: Strict validation mode');
  console.log('-'.repeat(50));

  try {
    // With a conformant schema, strict mode should work fine
    const sdk = new AstralSDK({
      schemas: [schema],
      strictSchemaValidation: true,
      debug: true,
    });

    const cache = sdk.getSchemaCache();
    if (!cache.has(schema.uid)) {
      console.error('  ✗ Schema not cached in strict mode');
      return false;
    }
    console.log('  ✓ Conformant schema accepted in strict mode');

    console.log('  ✓ Test 5 PASSED');
    return true;
  } catch (error) {
    console.error('  ✗ Test 5 FAILED:', error);
    return false;
  }
}

/**
 * Run all SDK configuration tests.
 */
async function runTests(): Promise<void> {
  console.log('='.repeat(60));
  console.log('SDK Multi-Schema Configuration Tests');
  console.log('='.repeat(60));
  console.log('');

  // Get schema UID from environment or CLI
  const schemaUID = getSchemaUID();
  console.log(`Schema UID: ${schemaUID}`);
  console.log(`Schema String: ${ASSET_TRACKING_SCHEMA_STRING}`);
  console.log('');

  // Create schema config with the deployed UID
  const schema = withSchemaUID(schemaUID);

  // Run tests
  const results: boolean[] = [];

  results.push(testPreRegisteredSchema(schema));
  results.push(testCustomDefaultSchema(schema));
  results.push(testSchemaValidation(schema));
  results.push(testModuleLevelValidation());
  results.push(testStrictValidationMode(schema));

  // Summary
  console.log('');
  console.log('='.repeat(60));
  const passed = results.filter(r => r).length;
  const total = results.length;

  if (passed === total) {
    console.log(`✓ All ${total} tests PASSED`);
    console.log('='.repeat(60));
    console.log('');
    console.log('SDK multi-schema configuration is working correctly.');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Run offchain attestation test: npx tsx examples/e2e/offchain-test.ts');
    console.log('  2. Run onchain attestation test: npx tsx examples/e2e/onchain-test.ts');
  } else {
    console.log(`✗ ${passed}/${total} tests passed`);
    console.log('='.repeat(60));
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
