// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

/* eslint-disable no-console */

/**
 * Offchain Attestation E2E Test
 *
 * This script tests creating, signing, and verifying an offchain attestation
 * using the custom Asset Tracking schema.
 *
 * Prerequisites:
 * - Schema deployed via deploy-schema.ts (need the UID)
 *
 * Usage:
 *   SCHEMA_UID=0x... npx tsx examples/e2e/offchain-test.ts
 *
 * Note: Offchain attestations don't require Anvil to be running since
 * they are signed locally without blockchain interaction.
 */

import { Wallet } from 'ethers';
import { AstralSDK } from '../../src/core/AstralSDK';
import { getPrimaryAccount, ANVIL_CONFIG } from './anvil-config';
import { withSchemaUID, createExampleAssetData } from './custom-schema';

/**
 * Get the schema UID from environment or command line argument.
 */
function getSchemaUID(): `0x${string}` {
  const envUID = process.env.SCHEMA_UID;
  if (envUID && envUID.startsWith('0x')) {
    return envUID as `0x${string}`;
  }

  const argUID = process.argv[2];
  if (argUID && argUID.startsWith('0x')) {
    return argUID as `0x${string}`;
  }

  console.error('Error: Schema UID required');
  console.error('');
  console.error('Usage:');
  console.error('  SCHEMA_UID=0x... npx tsx examples/e2e/offchain-test.ts');
  console.error('  npx tsx examples/e2e/offchain-test.ts 0x...');
  console.error('');
  console.error('First run deploy-schema.ts to get the UID:');
  console.error('  npx tsx examples/e2e/deploy-schema.ts');
  process.exit(1);
}

/**
 * Run the offchain attestation E2E test.
 */
async function runOffchainTest(): Promise<void> {
  console.log('='.repeat(60));
  console.log('Offchain Attestation E2E Test');
  console.log('='.repeat(60));
  console.log('');

  // Get schema UID
  const schemaUID = getSchemaUID();
  const schema = withSchemaUID(schemaUID);
  console.log(`Schema UID: ${schemaUID}`);
  console.log('');

  // Setup wallet (no provider needed for offchain)
  const testAccount = getPrimaryAccount();
  const wallet = new Wallet(testAccount.privateKey);

  console.log(`Test Account: ${testAccount.address}`);
  console.log(`Chain ID: ${ANVIL_CONFIG.chainId} (for EIP-712 domain)`);
  console.log('');

  // Initialize SDK with custom schema
  console.log('Step 1: Initialize SDK with custom schema');
  console.log('-'.repeat(50));

  const sdk = new AstralSDK({
    signer: wallet,
    defaultSchema: schema,
    chainId: ANVIL_CONFIG.chainId,
    debug: true,
  });

  console.log('✓ SDK initialized with custom Asset Tracking schema');

  // Verify schema is configured correctly
  const defaultSchema = sdk.getDefaultSchema();
  if (defaultSchema.uid !== schemaUID) {
    console.error(`✗ Schema UID mismatch: expected ${schemaUID}, got ${defaultSchema.uid}`);
    process.exit(1);
  }
  console.log('✓ Default schema UID matches');

  // Build unsigned attestation
  console.log('');
  console.log('Step 2: Build unsigned location attestation');
  console.log('-'.repeat(50));

  const exampleData = createExampleAssetData({
    assetId: 'ASSET-OFFCHAIN-001',
    owner: testAccount.address,
  });

  const unsignedAttestation = await sdk.buildLocationAttestation({
    locationType: 'geojson-point',
    location: {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-122.4194, 37.7749], // San Francisco
      },
      properties: {},
    },
    memo: `Asset: ${exampleData.assetId}, Owner: ${exampleData.owner}`,
  });

  console.log('✓ Built unsigned attestation');
  console.log(`  Location Type: ${unsignedAttestation.locationType}`);
  console.log(`  Memo: ${unsignedAttestation.memo}`);
  console.log(`  Event Timestamp: ${unsignedAttestation.eventTimestamp}`);

  // Sign the attestation
  console.log('');
  console.log('Step 3: Sign attestation with EIP-712');
  console.log('-'.repeat(50));

  let signedAttestation;
  try {
    signedAttestation = await sdk.signOffchainLocationAttestation(unsignedAttestation, {
      schema,
    });
    console.log('✓ Attestation signed');
    console.log(`  UID: ${signedAttestation.uid}`);
    console.log(`  Signer: ${signedAttestation.signer}`);
    console.log(`  Signature: ${signedAttestation.signature.slice(0, 50)}...`);
    console.log(`  Version: ${signedAttestation.version}`);
  } catch (error) {
    console.error('✗ Failed to sign attestation');
    console.error(error);
    process.exit(1);
  }

  // Verify signer matches test account
  if (signedAttestation.signer.toLowerCase() !== testAccount.address.toLowerCase()) {
    console.error('✗ Signer address mismatch');
    console.error(`  Expected: ${testAccount.address}`);
    console.error(`  Got: ${signedAttestation.signer}`);
    process.exit(1);
  }
  console.log('✓ Signer address matches test account');

  // Verify the signature
  console.log('');
  console.log('Step 4: Verify signature');
  console.log('-'.repeat(50));

  try {
    const verificationResult = await sdk.verifyOffchainLocationAttestation(signedAttestation);

    if (!verificationResult.isValid) {
      console.error('✗ Signature verification failed');
      console.error(`  Reason: ${verificationResult.reason}`);
      process.exit(1);
    }

    console.log('✓ Signature verified successfully');
    console.log(`  Valid: ${verificationResult.isValid}`);
    if (verificationResult.signerAddress) {
      console.log(`  Recovered Signer: ${verificationResult.signerAddress}`);
    }
  } catch (error) {
    console.error('✗ Failed to verify signature');
    console.error(error);
    process.exit(1);
  }

  // Verify data integrity
  console.log('');
  console.log('Step 5: Verify data integrity');
  console.log('-'.repeat(50));

  // Check that original fields are preserved
  if (signedAttestation.locationType !== unsignedAttestation.locationType) {
    console.error('✗ Location type mismatch');
    process.exit(1);
  }
  console.log('✓ Location type preserved');

  if (signedAttestation.location !== unsignedAttestation.location) {
    console.error('✗ Location data mismatch');
    process.exit(1);
  }
  console.log('✓ Location data preserved');

  if (signedAttestation.memo !== unsignedAttestation.memo) {
    console.error('✗ Memo mismatch');
    process.exit(1);
  }
  console.log('✓ Memo preserved');

  if (signedAttestation.eventTimestamp !== unsignedAttestation.eventTimestamp) {
    console.error('✗ Event timestamp mismatch');
    process.exit(1);
  }
  console.log('✓ Event timestamp preserved');

  // Parse and validate signature structure
  console.log('');
  console.log('Step 6: Validate signature structure');
  console.log('-'.repeat(50));

  try {
    const sig = JSON.parse(signedAttestation.signature);

    if (!sig.r || !sig.s || sig.v === undefined) {
      console.error('✗ Signature missing required fields (r, s, v)');
      process.exit(1);
    }
    console.log('✓ Signature has r, s, v components');

    if (!sig.r.startsWith('0x') || !sig.s.startsWith('0x')) {
      console.error('✗ Signature r/s not in hex format');
      process.exit(1);
    }
    console.log('✓ Signature components in correct format');
  } catch {
    console.error('✗ Failed to parse signature JSON');
    process.exit(1);
  }

  // Success
  console.log('');
  console.log('='.repeat(60));
  console.log('✓ All offchain attestation tests PASSED');
  console.log('='.repeat(60));
  console.log('');
  console.log('Attestation Details:');
  console.log(`  UID: ${signedAttestation.uid}`);
  console.log(`  Signer: ${signedAttestation.signer}`);
  console.log(`  Version: ${signedAttestation.version}`);
  console.log('');
  console.log('The offchain attestation can be published to Astral API or stored locally.');
  console.log('');
}

// Run the test
runOffchainTest().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
