// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

/* eslint-disable no-console */
/**
 * Basic Workflows Example - Astral SDK
 *
 * Demonstrates both offchain and onchain workflows with proper error handling.
 * Shows the two core patterns developers need to understand.
 *
 * Prerequisites:
 * - Build the SDK: `pnpm run build`
 * - For onchain: Set TEST_PRIVATE_KEY and INFURA_API_KEY in .env.local
 * - For onchain: Have sepolia ETH in test wallet
 *
 * Usage:
 * npx tsx examples/basic-workflows.ts
 */

import { AstralSDK } from '@decentralized-geo/astral-sdk';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function offchainWorkflow() {
  console.log('🔐 Offchain Workflow - Gasless Signatures');
  console.log('==========================================\n');

  try {
    // Create SDK instance (no provider needed)
    const sdk = new AstralSDK({
      mode: 'offchain',
      debug: true,
    });

    // Wait for extensions
    await sdk.extensions.ensureInitialized();

    // Build unsigned attestation
    console.log('📍 Building location attestation for Mumbai...');
    const unsignedAttestation = await sdk.buildLocationAttestation({
      location: {
        type: 'Point',
        coordinates: [72.8777, 19.076], // Mumbai coordinates
      },
      memo: 'Air quality monitoring station - Mumbai Central',
    });

    console.log('✅ Unsigned attestation created');
    console.log('   Location type:', unsignedAttestation.locationType);
    console.log('   Memo:', unsignedAttestation.memo);

    // For signing, you'd need a wallet connection
    console.log('\n💡 To sign this attestation, connect a wallet:');
    console.log('   const signer = await provider.getSigner();');
    console.log(
      '   const signedAttestation = await sdk.signOffchainLocationAttestation(unsignedAttestation);'
    );
  } catch (error) {
    console.error('❌ Offchain workflow failed:', error.message);
  }
}

async function onchainWorkflow() {
  console.log('\n⛓️  Onchain Workflow - Blockchain Registration');
  console.log('==============================================\n');

  // Check if we have the required environment variables
  if (!process.env.TEST_PRIVATE_KEY || !process.env.INFURA_API_KEY) {
    console.log('⚠️  Onchain workflow requires environment setup:');
    console.log('   1. Create .env.local file');
    console.log('   2. Add TEST_PRIVATE_KEY=0x... (test wallet private key)');
    console.log('   3. Add INFURA_API_KEY=... (get from infura.io)');
    console.log('   4. Fund test wallet with sepolia ETH from sepoliafaucet.com');
    console.log('\n💡 This workflow creates real blockchain transactions!');
    return;
  }

  try {
    // Create provider and signer
    const provider = new ethers.JsonRpcProvider(
      `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`
    );
    const signer = new ethers.Wallet(process.env.TEST_PRIVATE_KEY, provider);

    console.log('🔗 Connected to Sepolia testnet');
    console.log('   Wallet address:', await signer.getAddress());

    // Check balance
    const balance = await provider.getBalance(signer.address);
    const balanceEth = ethers.formatEther(balance);
    console.log('   Balance:', balanceEth, 'sepETH');

    if (balance === 0n) {
      console.log('❌ No balance! Get sepETH from https://sepoliafaucet.com/');
      return;
    }

    // Create SDK with signer
    const sdk = new AstralSDK({
      provider,
      signer,
      defaultChain: 'sepolia',
      debug: true,
    });

    await sdk.extensions.ensureInitialized();

    // Create onchain attestation
    console.log('\n📍 Creating onchain attestation for São Paulo...');
    const onchainAttestation = await sdk.createOnchainLocationAttestation({
      location: {
        type: 'Point',
        coordinates: [-46.6333, -23.5505], // São Paulo coordinates
      },
      memo: 'Infrastructure monitoring point - São Paulo Metro',
    });

    console.log('✅ Onchain attestation created!');
    console.log('   UID:', onchainAttestation.uid);
    console.log('   Transaction hash:', onchainAttestation.txHash);
    console.log('   Block number:', onchainAttestation.blockNumber);
    console.log(
      '   View on Etherscan:',
      `https://sepolia.etherscan.io/tx/${onchainAttestation.txHash}`
    );

    // Verify the attestation
    console.log('\n🔍 Verifying onchain attestation...');
    const verification = await sdk.verifyOnchainLocationAttestation(onchainAttestation);

    if (verification.isValid) {
      console.log('✅ Verification successful!');
      console.log('   Attester:', verification.signerAddress);
      console.log('   Revoked:', verification.revoked || false);
    } else {
      console.log('❌ Verification failed:', verification.reason);
    }
  } catch (error) {
    console.error('❌ Onchain workflow failed:', error.message);

    if (error.message.includes('insufficient funds')) {
      console.log('💡 Get sepolia ETH from https://sepoliafaucet.com/');
    } else if (error.message.includes('network')) {
      console.log('💡 Check your INFURA_API_KEY and internet connection');
    }
  }
}

async function main() {
  console.log('🌍 Astral SDK - Basic Workflows Example');
  console.log('=====================================\n');

  console.log('This example shows both core patterns for creating location attestations:\n');
  console.log('🔐 Offchain: Gasless signatures (private until published)');
  console.log('⛓️  Onchain: Blockchain transactions (permanent public records)\n');

  // Run offchain workflow (always works)
  await offchainWorkflow();

  // Run onchain workflow (requires setup)
  await onchainWorkflow();

  console.log('\n🎉 Example complete!');
  console.log('\nNext steps:');
  console.log('- Check out environmental-monitoring.ts for a real-world use case');
  console.log('- Read the documentation at docs/getting-started.md');
  console.log('- Explore the workflow guides for deeper understanding');
}

// Run the example
main().catch(console.error);
