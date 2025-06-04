// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

/**
 * Manual test for onchain functionality with real signer
 * This tests the actual onchain workflow end-to-end
 */

import { ethers } from 'ethers';
import { AstralSDK } from '../src/core/AstralSDK';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testOnchainWorkflow() {
  console.log('🧪 Testing onchain workflow with real signer...\n');

  try {
    // Get private key from environment
    const privateKey = process.env.TEST_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('TEST_PRIVATE_KEY not found in .env.local');
    }

    const infuraKey = process.env.INFURA_API_KEY;
    if (!infuraKey) {
      throw new Error('INFURA_API_KEY not found in .env.local');
    }

    // Create provider and signer
    const provider = new ethers.JsonRpcProvider(
      process.env.SEPOLIA_RPC_URL || `https://sepolia.infura.io/v3/${infuraKey}`
    );
    const signer = new ethers.Wallet(privateKey, provider);

    console.log('🔗 Signer address:', await signer.getAddress());
    console.log(
      '💰 Balance:',
      ethers.formatEther(await provider.getBalance(signer.address)),
      'ETH\n'
    );

    // Create SDK with signer
    const sdk = new AstralSDK({
      signer,
      provider,
      defaultChain: 'sepolia',
      debug: true,
    });

    // Wait for extensions to load
    await new Promise(resolve => setTimeout(resolve, 100));

    console.log('📍 Testing buildLocationProof...');
    const unsignedProof = await sdk.buildLocationProof({
      location: {
        type: 'Point',
        coordinates: [-0.1278, 51.5074], // London
      },
      memo: 'Manual test from Astral SDK - London location',
    });

    console.log('✅ Unsigned proof created:', {
      locationType: unsignedProof.locationType,
      location: unsignedProof.location,
      memo: unsignedProof.memo,
    });

    console.log('\n🔐 Testing createOnchainLocationProof...');
    const onchainProof = await sdk.createOnchainLocationProof({
      location: {
        type: 'Point',
        coordinates: [-0.1278, 51.5074], // London
      },
      memo: 'Onchain test from Astral SDK - London location',
    });

    console.log('✅ Onchain proof created successfully!', {
      uid: onchainProof.uid,
      txHash: onchainProof.txHash,
      blockNumber: onchainProof.blockNumber,
      attester: onchainProof.attester,
    });

    //   console.log('\n🔍 Testing verifyOnchainLocationProof...');
    //   const verification = await sdk.verifyOnchainLocationProof(onchainProof);

    //   console.log('✅ Verification result:', {
    //     isValid: verification.isValid,
    //     reason: verification.reason
    //   });

    //   console.log('\n🎉 All onchain tests passed!');

    // } catch (error) {
    //   console.error('❌ Test failed:', error);
    //   if (error.message.includes('insufficient funds')) {
    //     console.log('💡 Note: Make sure your test account has sufficient sepETH');
    //   }
    //   if (error.message.includes('No extension found')) {
    //     console.log('💡 Note: This suggests the async extension loading race condition');
    //   }
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testOnchainWorkflow();
