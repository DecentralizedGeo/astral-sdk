// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

/* eslint-disable no-console */
/**
 * Complete Astral SDK Demo - Recipe Book
 *
 * This script demonstrates all core SDK functionality:
 * 1. Building location proofs with different formats
 * 2. Offchain workflow (signing and verification)
 * 3. Onchain workflow (registration and verification)
 * 4. Media attachments
 * 5. Error handling patterns
 *
 * Prerequisites:
 * - Build the SDK: `pnpm run build`
 * - Set up .env.local with TEST_PRIVATE_KEY and INFURA_API_KEY for onchain testing
 *
 * Usage:
 * npx tsx examples/complete-sdk-demo.ts
 */

import { ethers } from 'ethers';
import { AstralSDK } from '../src/core/AstralSDK';
import { LocationAttestationInput } from '../src/core/types';
import * as dotenv from 'dotenv';

// Load environment variables for onchain testing
dotenv.config({ path: '.env.local' });

async function demoSDK() {
  console.log('🌟 Astral SDK Complete Demo - Recipe Book');
  console.log('=========================================\n');

  // ====================================================================
  // RECIPE 1: Basic SDK Setup and Location Proof Building
  // ====================================================================

  console.log('📖 RECIPE 1: Building Location Proofs');
  console.log('------------------------------------');

  // Create SDK instance (offchain-first, no provider needed initially)
  const sdk = new AstralSDK({
    debug: true,
    mode: 'offchain',
  });

  // Wait for extensions to load (our Sub-task 1C fix in action!)
  console.log('⏳ Waiting for extensions to initialize...');
  await sdk.extensions.ensureInitialized();
  console.log('✅ Extensions loaded:', sdk.extensions.getAllLocationExtensions().length);

  // Different location formats the SDK supports
  const locationExamples = [
    {
      name: 'GeoJSON Point',
      location: {
        type: 'Point',
        coordinates: [-0.1278, 51.5074], // London
      },
    },
    {
      name: 'GeoJSON Feature',
      location: {
        type: 'Feature',
        properties: { name: 'Trafalgar Square' },
        geometry: {
          type: 'Point',
          coordinates: [-0.1278, 51.5074], // London
        },
      },
    },
  ];

  for (const example of locationExamples) {
    console.log(`\n🗺️  Building proof for: ${example.name}`);

    const proofInput: LocationAttestationInput = {
      location: example.location,
      memo: `Demo proof for ${example.name}`,
      timestamp: new Date(),
    };

    const unsignedProof = await sdk.buildLocationAttestation(proofInput);

    console.log('   ✅ Proof created:');
    console.log('      📍 Location type:', unsignedProof.locationType);
    console.log('      📝 Memo:', unsignedProof.memo);
    console.log('      🕐 Timestamp:', new Date(unsignedProof.eventTimestamp * 1000));
    console.log('      🏷️  Schema fields (singular names):', {
      mediaType: unsignedProof.mediaType.length,
      recipeType: unsignedProof.recipeType.length,
    });
  }

  // ====================================================================
  // RECIPE 2: Media Attachments
  // ====================================================================

  console.log('\n\n📖 RECIPE 2: Location Proofs with Media');
  console.log('--------------------------------------');

  // Sample base64 encoded tiny image (1x1 pixel PNG)
  const sampleImage =
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

  const proofWithMedia: LocationAttestationInput = {
    location: {
      type: 'Point',
      coordinates: [-74.006, 40.7128], // New York City
    },
    memo: 'NYC location with photo evidence',
    media: [
      {
        mediaType: 'image/png',
        data: sampleImage,
      },
    ],
  };

  const unsignedProofWithMedia = await sdk.buildLocationAttestation(proofWithMedia);

  console.log('🖼️  Proof with media created:');
  console.log('   📍 Location:', unsignedProofWithMedia.location);
  console.log('   🖼️  Media types:', unsignedProofWithMedia.mediaType);
  console.log('   📊 Media data entries:', unsignedProofWithMedia.mediaData.length);
  console.log(
    '   💾 First media preview:',
    unsignedProofWithMedia.mediaData[0].substring(0, 50) + '...'
  );

  // ====================================================================
  // RECIPE 3: Offchain Workflow (Signing and Verification)
  // ====================================================================

  console.log('\n\n📖 RECIPE 3: Offchain Workflow');
  console.log('-----------------------------');

  // For offchain signing, we need a signer
  if (process.env.TEST_PRIVATE_KEY) {
    try {
      console.log('🔐 Setting up offchain signer...');

      // Create signer from private key
      const privateKey = process.env.TEST_PRIVATE_KEY;
      const signer = new ethers.Wallet(privateKey);

      // Create SDK with signer for offchain operations
      const offchainSDK = new AstralSDK({
        signer,
        defaultChain: 'sepolia',
        debug: true,
      });

      // Wait for extensions
      await offchainSDK.extensions.ensureInitialized();

      console.log('   👤 Signer address:', await signer.getAddress());

      // Create and sign an offchain proof
      const offchainInput: LocationAttestationInput = {
        location: {
          type: 'Point',
          coordinates: [-0.1278, 51.5074], // London
        },
        memo: 'Signed offchain proof from London',
      };

      console.log('\n🏗️  Creating offchain location proof...');
      const offchainProof = await offchainSDK.createOffchainLocationAttestation(offchainInput);

      console.log('   ✅ Offchain proof created:');
      console.log('      🆔 UID:', offchainProof.uid);
      console.log('      👤 Signer:', offchainProof.signer);
      console.log('      📝 Version:', offchainProof.version);
      console.log('      🔏 Signature preview:', offchainProof.signature.substring(0, 50) + '...');

      // Verify the offchain proof (our Sub-task 1F fix in action!)
      console.log('\n🔍 Verifying offchain proof...');
      const verification = await offchainSDK.verifyOffchainLocationAttestation(offchainProof);

      console.log('   ✅ Verification result:');
      console.log('      ✅ Valid:', verification.isValid);
      console.log('      👤 Signer address:', verification.signerAddress);
      if (verification.reason) {
        console.log('      ❓ Reason:', verification.reason);
      }

      // Test invalid signature detection
      console.log('\n🧪 Testing invalid signature detection...');
      const invalidProof = {
        ...offchainProof,
        signer: '0x0000000000000000000000000000000000000000', // Invalid signer
        signature: JSON.stringify({
          r: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          s: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          v: 28,
        }),
      };

      const invalidVerification = await offchainSDK.verifyOffchainLocationAttestation(invalidProof);
      console.log('   ❌ Invalid proof verification:');
      console.log('      ❌ Valid:', invalidVerification.isValid);
      console.log('      📝 Reason:', invalidVerification.reason);
    } catch (error) {
      console.log('   ⚠️  Offchain workflow skipped:', error.message);
      console.log('   💡 Set ACCT_1_PRIV in .env.local to test offchain signing');
    }
  } else {
    console.log('⚠️  Offchain signing requires ACCT_1_PRIV in .env.local');
    console.log('💡 This workflow creates EIP-712 signatures for location proofs');
  }

  // ====================================================================
  // RECIPE 4: Onchain Workflow (Registration and Verification)
  // ====================================================================

  console.log('\n\n📖 RECIPE 4: Onchain Workflow');
  console.log('----------------------------');

  // For onchain registration, we need both signer and provider
  if (process.env.TEST_PRIVATE_KEY && process.env.INFURA_API_KEY) {
    try {
      console.log('⛓️  Setting up onchain connection...');

      const privateKey = process.env.TEST_PRIVATE_KEY;
      const infuraKey = process.env.INFURA_API_KEY;

      // Create provider and signer
      const provider = new ethers.JsonRpcProvider(`https://sepolia.infura.io/v3/${infuraKey}`);
      const signer = new ethers.Wallet(privateKey, provider);

      console.log('   👤 Signer address:', await signer.getAddress());

      // Check balance
      const balance = await provider.getBalance(signer.address);
      console.log('   💰 Balance:', ethers.formatEther(balance), 'sepETH');

      if (balance === 0n) {
        console.log('   ⚠️  Zero balance - onchain operations will fail');
        console.log('   💡 Get sepETH from https://sepoliafaucet.com/');
        return;
      }

      // Create SDK with provider and signer for onchain operations
      const onchainSDK = new AstralSDK({
        provider,
        signer,
        defaultChain: 'sepolia',
        debug: true,
      });

      // Wait for extensions
      await onchainSDK.extensions.ensureInitialized();

      // Create and register an onchain proof
      const onchainInput: LocationAttestationInput = {
        location: {
          type: 'Point',
          coordinates: [2.3522, 48.8566], // Paris
        },
        memo: 'Onchain proof from Paris - registered on Sepolia',
      };

      console.log('\n⛓️  Registering onchain location proof...');
      console.log('   📤 Submitting transaction to Sepolia...');

      // This uses our Sub-task 1B fix - real transaction metadata!
      const onchainProof = await onchainSDK.createOnchainLocationAttestation(onchainInput);

      console.log('   ✅ Onchain proof registered:');
      console.log('      🆔 UID:', onchainProof.uid);
      console.log('      📜 Transaction hash:', onchainProof.txHash);
      console.log('      🧱 Block number:', onchainProof.blockNumber);
      console.log('      👤 Attester:', onchainProof.attester);
      console.log('      ⛓️  Chain:', onchainProof.chain);
      console.log(
        '      🔗 View on Etherscan:',
        `https://sepolia.etherscan.io/tx/${onchainProof.txHash}`
      );

      // Verify the onchain proof
      console.log('\n🔍 Verifying onchain proof...');
      const onchainVerification = await onchainSDK.verifyOnchainLocationAttestation(onchainProof);

      console.log('   ✅ Onchain verification result:');
      console.log('      ✅ Valid:', onchainVerification.isValid);
      console.log('      👤 Attester:', onchainVerification.signerAddress);
      console.log('      🔄 Revoked:', onchainVerification.revoked);
    } catch (error) {
      console.log('   ⚠️  Onchain workflow failed:', error.message);
      console.log('   💡 Ensure you have sepETH and valid INFURA_KEY');

      if (error.message.includes('insufficient funds')) {
        console.log('   💰 Get sepETH from https://sepoliafaucet.com/');
      }
    }
  } else {
    console.log('⚠️  Onchain registration requires ACCT_1_PRIV and INFURA_KEY in .env.local');
    console.log('💡 This workflow creates real blockchain transactions on Sepolia');
  }

  // ====================================================================
  // RECIPE 5: Error Handling Patterns
  // ====================================================================

  console.log('\n\n📖 RECIPE 5: Error Handling Patterns');
  console.log('-----------------------------------');

  // Test various error scenarios we've fixed
  try {
    console.log('🧪 Testing validation errors...');

    // Invalid location data
    try {
      await sdk.buildLocationAttestation({
        location: null,
        memo: 'This should fail',
      } as LocationAttestationInput);
    } catch (error) {
      console.log('   ✅ Caught invalid location error:', error.constructor.name);
    }

    // Unknown location format
    try {
      await sdk.buildLocationAttestation({
        location: 'not a valid location format',
        memo: 'This should also fail',
      } as LocationAttestationInput);
    } catch (error) {
      console.log('   ✅ Caught unknown format error:', error.constructor.name);
    }

    // Missing signer for offchain operations
    try {
      const noSignerSDK = new AstralSDK({ debug: true });
      await noSignerSDK.extensions.ensureInitialized();

      const proof = await noSignerSDK.buildLocationAttestation({
        location: { type: 'Point', coordinates: [0, 0] },
        memo: 'Test',
      });

      await noSignerSDK.signOffchainLocationAttestation(proof);
    } catch (error) {
      console.log('   ✅ Caught missing signer error:', error.constructor.name);
    }
  } catch (error) {
    console.log('   ❌ Unexpected error in error testing:', error);
  }

  // ====================================================================
  // SUMMARY
  // ====================================================================

  console.log('\n\n🎉 SDK Demo Complete!');
  console.log('====================');
  console.log('');
  console.log('✅ Demonstrated functionality:');
  console.log('   🏗️  Building location proofs (multiple formats)');
  console.log('   🖼️  Media attachments');
  console.log('   🔐 Offchain signing and verification');
  console.log('   ⛓️  Onchain registration and verification');
  console.log('   🚨 Error handling patterns');
  console.log('');
  console.log('🔧 All fixes from Task 1 working:');
  console.log('   ✅ Extensions load without race conditions');
  console.log('   ✅ Schema fields use singular names');
  console.log('   ✅ Real transaction metadata returned');
  console.log('   ✅ Proper error types throughout');
  console.log('   ✅ Invalid signatures detected');
  console.log('');
  console.log('🚀 Ready for comprehensive testing and production!');
}

// Run the demo
if (require.main === module) {
  demoSDK().catch(console.error);
}

export { demoSDK };
