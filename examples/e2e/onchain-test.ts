// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

/* eslint-disable no-console */

/**
 * Onchain Attestation E2E Test
 *
 * This script tests registering and verifying an onchain attestation
 * using the custom Asset Tracking schema on a local Anvil fork.
 *
 * Prerequisites:
 * - Anvil fork running: ./examples/e2e/start-anvil.sh
 * - Schema deployed via deploy-schema.ts (need the UID)
 *
 * Usage:
 *   SCHEMA_UID=0x... npx tsx examples/e2e/onchain-test.ts
 */

import { JsonRpcProvider, Wallet } from 'ethers';
import { createPublicClient, http, parseAbi } from 'viem';
import { foundry } from 'viem/chains';
import { AstralSDK } from '../../src/core/AstralSDK';
import { ANVIL_CONFIG, getPrimaryAccount } from './anvil-config';
import { withSchemaUID, createExampleAssetData } from './custom-schema';

/**
 * EAS contract ABI for querying attestations.
 */
const EAS_ABI = parseAbi([
  'function getAttestation(bytes32 uid) view returns (tuple(bytes32 uid, bytes32 schema, uint64 time, uint64 expirationTime, uint64 revocationTime, bytes32 refUID, address attester, address recipient, bool revocable, bytes data))',
]);

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
  console.error('  SCHEMA_UID=0x... npx tsx examples/e2e/onchain-test.ts');
  console.error('  npx tsx examples/e2e/onchain-test.ts 0x...');
  console.error('');
  console.error('First run deploy-schema.ts to get the UID:');
  console.error('  npx tsx examples/e2e/deploy-schema.ts');
  process.exit(1);
}

/**
 * Run the onchain attestation E2E test.
 */
async function runOnchainTest(): Promise<void> {
  console.log('='.repeat(60));
  console.log('Onchain Attestation E2E Test');
  console.log('='.repeat(60));
  console.log('');

  // Get schema UID
  const schemaUID = getSchemaUID();
  const schema = withSchemaUID(schemaUID);
  console.log(`Schema UID: ${schemaUID}`);
  console.log('');

  // Setup ethers provider and wallet for SDK
  const testAccount = getPrimaryAccount();
  const provider = new JsonRpcProvider(ANVIL_CONFIG.rpcUrl);
  const wallet = new Wallet(testAccount.privateKey, provider);

  console.log(`Test Account: ${testAccount.address}`);
  console.log(`RPC URL: ${ANVIL_CONFIG.rpcUrl}`);
  console.log('');

  // Check connection to Anvil
  try {
    const blockNumber = await provider.getBlockNumber();
    console.log(`✓ Connected to Anvil (block ${blockNumber})`);
  } catch {
    console.error('✗ Failed to connect to Anvil');
    console.error('  Make sure Anvil is running: ./examples/e2e/start-anvil.sh');
    process.exit(1);
  }

  // Initialize SDK with custom schema
  console.log('');
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
    assetId: 'ASSET-E2E-001',
    owner: testAccount.address,
  });

  // Note: The SDK's buildLocationAttestation method uses the v0.1 schema fields
  // For custom schemas like Asset Tracking, we need to encode differently
  // For now, we'll use the standard location attestation format
  const unsignedAttestation = await sdk.buildLocationAttestation({
    locationType: 'geojson-point',
    location: {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-73.9857, 40.7484], // Empire State Building
      },
      properties: {},
    },
    memo: `Asset: ${exampleData.assetId}, Owner: ${exampleData.owner}`,
  });

  console.log('✓ Built unsigned attestation');
  console.log(`  Location Type: ${unsignedAttestation.locationType}`);
  console.log(`  Memo: ${unsignedAttestation.memo}`);

  // Register onchain attestation
  console.log('');
  console.log('Step 3: Register attestation onchain');
  console.log('-'.repeat(50));

  let onchainAttestation;
  try {
    onchainAttestation = await sdk.registerOnchainLocationAttestation(unsignedAttestation, {
      schema,
    });
    console.log('✓ Attestation registered onchain');
    console.log(`  UID: ${onchainAttestation.uid}`);
    console.log(`  TX Hash: ${onchainAttestation.txHash}`);
    console.log(`  Block: ${onchainAttestation.blockNumber}`);
    console.log(`  Attester: ${onchainAttestation.attester}`);
  } catch (error) {
    console.error('✗ Failed to register attestation onchain');
    console.error(error);
    process.exit(1);
  }

  // Query attestation from EAS contract using viem
  console.log('');
  console.log('Step 4: Query attestation from EAS contract');
  console.log('-'.repeat(50));

  const publicClient = createPublicClient({
    chain: foundry,
    transport: http(ANVIL_CONFIG.rpcUrl),
  });

  try {
    const attestationData = await publicClient.readContract({
      address: ANVIL_CONFIG.eas,
      abi: EAS_ABI,
      functionName: 'getAttestation',
      args: [onchainAttestation.uid as `0x${string}`],
    });

    console.log('✓ Attestation found in EAS contract');
    console.log(`  Schema: ${attestationData.schema}`);
    console.log(`  Attester: ${attestationData.attester}`);
    console.log(`  Revocable: ${attestationData.revocable}`);
    console.log(`  Time: ${new Date(Number(attestationData.time) * 1000).toISOString()}`);

    // Verify schema UID matches
    if (attestationData.schema.toLowerCase() !== schemaUID.toLowerCase()) {
      console.error(`✗ Schema UID mismatch in attestation`);
      console.error(`  Expected: ${schemaUID}`);
      console.error(`  Got: ${attestationData.schema}`);
      process.exit(1);
    }
    console.log('✓ Schema UID matches');

    // Verify attester matches
    if (attestationData.attester.toLowerCase() !== testAccount.address.toLowerCase()) {
      console.error(`✗ Attester mismatch`);
      console.error(`  Expected: ${testAccount.address}`);
      console.error(`  Got: ${attestationData.attester}`);
      process.exit(1);
    }
    console.log('✓ Attester address matches');
  } catch (error) {
    console.error('✗ Failed to query attestation from EAS');
    console.error(error);
    process.exit(1);
  }

  // Verify using SDK
  console.log('');
  console.log('Step 5: Verify attestation using SDK');
  console.log('-'.repeat(50));

  try {
    const verificationResult = await sdk.verifyOnchainLocationAttestation(onchainAttestation);

    if (!verificationResult.isValid) {
      console.error('✗ Attestation verification failed');
      console.error(`  Reason: ${verificationResult.reason}`);
      process.exit(1);
    }

    console.log('✓ Attestation verified successfully');
    console.log(`  Valid: ${verificationResult.isValid}`);
    console.log(`  Revoked: ${verificationResult.revoked}`);
    console.log(`  Signer: ${verificationResult.signerAddress}`);
  } catch (error) {
    console.error('✗ Failed to verify attestation');
    console.error(error);
    process.exit(1);
  }

  // Success
  console.log('');
  console.log('='.repeat(60));
  console.log('✓ All onchain attestation tests PASSED');
  console.log('='.repeat(60));
  console.log('');
  console.log('Attestation Details:');
  console.log(`  UID: ${onchainAttestation.uid}`);
  console.log(`  Schema: ${schemaUID}`);
  console.log(`  Chain: ${onchainAttestation.chain} (${onchainAttestation.chainId})`);
  console.log('');
}

// Run the test
runOnchainTest().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
