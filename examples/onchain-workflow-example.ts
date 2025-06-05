// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

/**
 * Example: Onchain Workflow with AstralSDK
 *
 * This example demonstrates how to create and register a location proof on-chain
 * using the AstralSDK.
 *
 * Usage:
 * 1. Ensure the SDK is built: pnpm run build
 * 2. Run this example: npx ts-node examples/onchain-workflow-example.ts
 *
 * Note: This requires a funded wallet on Sepolia testnet to pay for gas.
 * For testing without spending gas, the actual registration is commented out.
 */

import { ethers } from 'ethers';
import { AstralSDK } from '../src/core/AstralSDK';
import { LocationAttestationInput } from '../src/core/types';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function main() {
  try {
    console.log('Demonstrating onchain workflow with Astral SDK\n');

    // Create a wallet for demonstration from environment variables
    // In a real application, this would be the user's wallet
    const privateKey = process.env.TEST_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('TEST_PRIVATE_KEY not found in environment');
    }
    const wallet = new ethers.Wallet(privateKey);
    console.log(`Using wallet address: ${wallet.address}`);

    // Create an RPC provider for Sepolia
    const infuraKey = process.env.INFURA_API_KEY;
    if (!infuraKey) {
      throw new Error('INFURA_API_KEY not found in environment');
    }
    const provider = new ethers.JsonRpcProvider(`https://sepolia.infura.io/v3/${infuraKey}`);
    const connectedWallet = wallet.connect(provider);

    // Initialize the AstralSDK with a signer and chain info
    const sdk = new AstralSDK({
      signer: connectedWallet,
      provider: provider,
      defaultChain: 'sepolia',
      debug: true, // Enable debug logging
    });

    // Create location proof input with GeoJSON data
    const locationInput: LocationAttestationInput = {
      location: {
        type: 'Point',
        coordinates: [-122.4194, 37.7749], // San Francisco coordinates
      },
      locationType: 'geojson',
      memo: 'Example onchain location attestation created with AstralSDK',
      // Optional: provide a timestamp or it will use current time
      timestamp: new Date(),
    };

    console.log('\nLocation input:', locationInput);

    // Build an unsigned location proof
    console.log('\nBuilding unsigned location proof...');
    const unsignedProof = await sdk.buildLocationAttestation(locationInput);
    console.log('Unsigned proof created:', unsignedProof);

    // In a real application, you would uncomment the following code to register the proof on-chain
    // This requires a funded wallet with ETH for gas on the Sepolia testnet
    /*
    console.log('\nRegistering the location proof on-chain...');
    const onchainProof = await sdk.createOnchainLocationAttestation(locationInput);

    console.log('\nOnchain location proof created successfully!');
    console.log('UID:', onchainProof.uid);
    console.log('Chain:', onchainProof.chain);
    console.log('Transaction Hash:', onchainProof.txHash);
    console.log('Block Number:', onchainProof.blockNumber);

    // Verify the proof
    console.log('\nVerifying the onchain proof...');
    const verificationResult = await sdk.verifyOnchainLocationAttestation(onchainProof);

    if (verificationResult.isValid) {
      console.log('✅ Onchain proof verification succeeded!');
      if (verificationResult.signerAddress) {
        console.log('Verified attester address:', verificationResult.signerAddress);
      }
    } else {
      console.error('❌ Onchain proof verification failed:', verificationResult.reason);
    }

    // Optional: Demonstrate proof revocation (if the proof is revocable)
    if (onchainProof.revocable) {
      console.log('\nDemonstrating proof revocation...');
      
      // In a real application, you would uncomment the following code
      // const revocationResponse = await sdk.revokeOnchainLocationAttestation(onchainProof);
      // console.log('Revocation transaction:', revocationResponse);
      
      // Verify the proof is now revoked
      // const verificationAfterRevoke = await sdk.verifyOnchainLocationAttestation(onchainProof);
      // console.log('Verification after revocation:', verificationAfterRevoke);
    }

    return onchainProof;
    */

    // For this example, we'll just return the unsigned proof to avoid spending gas
    return unsignedProof;
  } catch (error) {
    console.error('Error in onchain workflow example:', error);
    throw error;
  }
}

// Run the example
main()
  .then(proof => {
    console.log('\nComplete proof object:');
    console.log(JSON.stringify(proof, null, 2));
    console.log('\nThis example showed how to use the onchain workflow with AstralSDK.');
    console.log(
      'To register proofs on-chain, uncomment the registration code and provide a funded wallet.'
    );
  })
  .catch(error => {
    console.error('Example failed:', error);
    process.exit(1);
  });
