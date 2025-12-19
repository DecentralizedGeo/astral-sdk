// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

/**
 * Deploy custom schema to EAS SchemaRegistry on Anvil fork.
 *
 * This script registers the Asset Tracking schema with EAS and outputs
 * the schema UID that should be used in custom-schema.ts.
 *
 * Prerequisites:
 * - Anvil fork running: ./examples/e2e/start-anvil.sh
 *
 * Usage:
 *   npx tsx examples/e2e/deploy-schema.ts
 */

import {
  createWalletClient,
  createPublicClient,
  http,
  parseAbi,
  decodeEventLog,
  type Hash,
  type TransactionReceipt,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { foundry } from 'viem/chains';
import { ANVIL_CONFIG, getPrimaryAccount } from './anvil-config';
import { ASSET_TRACKING_SCHEMA_STRING } from './custom-schema';

/**
 * SchemaRegistry ABI - only the functions we need.
 *
 * The register function returns the schema UID (bytes32).
 * The Registered event is emitted with the schema UID as indexed topic.
 *
 * Note: We omit the tuple parameter from the event since parseAbi doesn't
 * support inline tuple syntax, and we only need the indexed uid anyway.
 */
const SCHEMA_REGISTRY_ABI = parseAbi([
  'function register(string schema, address resolver, bool revocable) returns (bytes32)',
  'event Registered(bytes32 indexed uid, address indexed registerer)',
]);

/**
 * Extract schema UID from transaction receipt logs.
 */
function extractSchemaUID(receipt: TransactionReceipt): `0x${string}` | null {
  for (const log of receipt.logs) {
    try {
      const decoded = decodeEventLog({
        abi: SCHEMA_REGISTRY_ABI,
        data: log.data,
        topics: log.topics,
      });

      if (decoded.eventName === 'Registered') {
        // The UID is the first indexed parameter
        return decoded.args.uid as `0x${string}`;
      }
    } catch {
      // Not our event, skip
      continue;
    }
  }
  return null;
}

/**
 * Deploy the Asset Tracking schema to EAS SchemaRegistry.
 */
async function deploySchema(): Promise<void> {
  console.log('='.repeat(60));
  console.log('EAS Schema Deployment');
  console.log('='.repeat(60));
  console.log('');

  // Setup account and clients
  const testAccount = getPrimaryAccount();
  const account = privateKeyToAccount(testAccount.privateKey);

  console.log(`Deployer: ${account.address}`);
  console.log(`SchemaRegistry: ${ANVIL_CONFIG.schemaRegistry}`);
  console.log(`RPC: ${ANVIL_CONFIG.rpcUrl}`);
  console.log('');

  const walletClient = createWalletClient({
    account,
    chain: foundry,
    transport: http(ANVIL_CONFIG.rpcUrl),
  });

  const publicClient = createPublicClient({
    chain: foundry,
    transport: http(ANVIL_CONFIG.rpcUrl),
  });

  // Check connection to Anvil
  try {
    const blockNumber = await publicClient.getBlockNumber();
    console.log(`✓ Connected to Anvil (block ${blockNumber})`);
  } catch (error) {
    console.error('✗ Failed to connect to Anvil');
    console.error('  Make sure Anvil is running: ./examples/e2e/start-anvil.sh');
    process.exit(1);
  }

  // Display schema being deployed
  console.log('');
  console.log('Schema to deploy:');
  console.log(`  ${ASSET_TRACKING_SCHEMA_STRING}`);
  console.log('');

  // Register the schema
  console.log('Registering schema...');

  let txHash: Hash;
  try {
    txHash = await walletClient.writeContract({
      address: ANVIL_CONFIG.schemaRegistry,
      abi: SCHEMA_REGISTRY_ABI,
      functionName: 'register',
      args: [
        ASSET_TRACKING_SCHEMA_STRING,
        '0x0000000000000000000000000000000000000000', // No resolver
        true, // Revocable
      ],
    });
    console.log(`✓ Transaction sent: ${txHash}`);
  } catch (error) {
    console.error('✗ Failed to send transaction');
    console.error(error);
    process.exit(1);
  }

  // Wait for receipt
  console.log('Waiting for confirmation...');
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

  if (receipt.status !== 'success') {
    console.error('✗ Transaction failed');
    process.exit(1);
  }

  console.log(`✓ Transaction confirmed in block ${receipt.blockNumber}`);

  // Extract UID from logs
  const schemaUID = extractSchemaUID(receipt);

  if (!schemaUID) {
    console.error('✗ Could not extract schema UID from logs');
    process.exit(1);
  }

  // Success output
  console.log('');
  console.log('='.repeat(60));
  console.log('✓ Schema deployed successfully!');
  console.log('='.repeat(60));
  console.log('');
  console.log('Schema UID:');
  console.log(`  ${schemaUID}`);
  console.log('');
  console.log('Next step: Update custom-schema.ts with this UID:');
  console.log('');
  console.log('  export const ASSET_TRACKING_SCHEMA: RuntimeSchemaConfig = {');
  console.log(`    uid: '${schemaUID}',`);
  console.log('    rawString: ASSET_TRACKING_SCHEMA_STRING,');
  console.log('  };');
  console.log('');
}

// Run deployment
deploySchema().catch(error => {
  console.error('Deployment failed:', error);
  process.exit(1);
});
