// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

/* eslint-disable no-console */

/**
 * Onchain Attestation E2E Test
 *
 * This script tests registering and verifying an onchain attestation
 * using the Astral SDK on a local Anvil fork.
 *
 * The test demonstrates:
 * - SDK initialization with schema pre-registration
 * - Building unsigned attestations
 * - Registering attestations onchain via EAS
 * - Querying attestations from the EAS contract
 * - Verifying attestations using the SDK
 *
 * Prerequisites:
 * - Anvil fork running: ./examples/e2e/start-anvil.sh
 * - Schema deployed via deploy-schema.ts (need the UID)
 *
 * Usage:
 *   SCHEMA_UID=0x... npx tsx examples/e2e/onchain-test.ts
 */

import { JsonRpcProvider, Wallet } from 'ethers';
import { createPublicClient, http } from 'viem';
import { foundry } from 'viem/chains';
import { AstralSDK } from '../../src/core/AstralSDK';
import { ANVIL_CONFIG, getPrimaryAccount } from './anvil-config';
import { withSchemaUID } from './custom-schema';

/**
 * EAS contract ABI for querying attestations.
 * Defined as a const to avoid parseAbi's tuple parsing limitations.
 */
const EAS_ABI = [
  {
    name: 'getAttestation',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'uid', type: 'bytes32' }],
    outputs: [
      {
        name: '',
        type: 'tuple',
        components: [
          { name: 'uid', type: 'bytes32' },
          { name: 'schema', type: 'bytes32' },
          { name: 'time', type: 'uint64' },
          { name: 'expirationTime', type: 'uint64' },
          { name: 'revocationTime', type: 'uint64' },
          { name: 'refUID', type: 'bytes32' },
          { name: 'attester', type: 'address' },
          { name: 'recipient', type: 'address' },
          { name: 'revocable', type: 'bool' },
          { name: 'data', type: 'bytes' },
        ],
      },
    ],
  },
] as const;

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

  // Get schema UID (for demonstrating schema pre-registration)
  const schemaUID = getSchemaUID();
  const customSchema = withSchemaUID(schemaUID);
  console.log(`Custom Schema UID: ${schemaUID}`);
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

  // Initialize SDK with pre-registered custom schema
  // Use Sepolia chain ID for SDK config (Anvil forks Sepolia's EAS contracts)
  // The wallet is connected to Anvil's RPC, so transactions still go there
  const SEPOLIA_CHAIN_ID = 11155111;

  console.log('');
  console.log('Step 1: Initialize SDK with schema pre-registration');
  console.log('-'.repeat(50));

  const sdk = new AstralSDK({
    signer: wallet,
    chainId: SEPOLIA_CHAIN_ID,
    schemas: [customSchema], // Pre-register custom schema
    debug: true,
  });

  console.log('✓ SDK initialized');

  // Verify custom schema is cached
  const cache = sdk.getSchemaCache();
  if (!cache.has(customSchema.uid)) {
    console.error('✗ Custom schema not found in cache');
    process.exit(1);
  }
  console.log('✓ Custom schema pre-registered and cached');

  // Show default schema being used
  const defaultSchema = sdk.getDefaultSchema();
  console.log(`✓ Default schema UID: ${defaultSchema.uid.slice(0, 20)}...`);

  // Build unsigned attestation
  console.log('');
  console.log('Step 2: Build unsigned location attestation');
  console.log('-'.repeat(50));

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
    memo: 'E2E onchain attestation test',
  });

  console.log('✓ Built unsigned attestation');
  console.log(`  Location Type: ${unsignedAttestation.locationType}`);
  console.log(`  Memo: ${unsignedAttestation.memo}`);

  // Register onchain attestation (uses default schema which matches data structure)
  console.log('');
  console.log('Step 3: Register attestation onchain');
  console.log('-'.repeat(50));

  let onchainAttestation;
  try {
    onchainAttestation = await sdk.registerOnchainLocationAttestation(unsignedAttestation);
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
  console.log(`  Chain: ${onchainAttestation.chain} (${onchainAttestation.chainId})`);
  console.log(`  TX: ${onchainAttestation.txHash}`);
  console.log('');
}

// Run the test
runOnchainTest().catch(error => {
  console.error('Test execution failed:', error);
  process.exit(1);
});
