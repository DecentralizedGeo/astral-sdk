// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

/**
 * Example script demonstrating how the AstralSDK will work once fully integrated
 *
 * This is not fully functional yet as the SDK integration is still in progress,
 * but it shows the intended developer experience.
 *
 * Usage:
 * This is for reference only until the SDK integration is complete.
 */

import { ethers } from 'ethers';
import { AstralSDK } from '../src/core/AstralSDK';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function main() {
  try {
    console.log('Demonstrating AstralSDK workflows (coming soon)...');

    // Create a wallet for testing from environment variables
    const privateKey = process.env.TEST_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('TEST_PRIVATE_KEY not found in environment');
    }
    const wallet = new ethers.Wallet(privateKey);

    // Create an RPC provider for Sepolia
    const infuraKey = process.env.INFURA_API_KEY;
    if (!infuraKey) {
      throw new Error('INFURA_API_KEY not found in environment');
    }
    const provider = new ethers.JsonRpcProvider(`https://sepolia.infura.io/v3/${infuraKey}`);
    const connectedWallet = wallet.connect(provider);

    // Initialize the SDK with a signer and chain ID
    const sdk = new AstralSDK({
      provider: connectedWallet,
      chainId: 11155111, // Sepolia testnet
      debug: true,
    });

    // === Offchain Workflow ===
    console.log('\n=== Offchain Workflow ===');

    // Build an unsigned location proof
    const unsignedProof = await sdk.buildLocationAttestation({
      location: {
        type: 'Feature',
        properties: {},
        geometry: {
          coordinates: [-0.163808, 51.5101],
          type: 'Point',
        },
      },
      locationType: 'geojson-point',
      memo: 'Testing offchain workflow',
    });

    console.log('Unsigned proof created.');

    // Sign the proof to create an offchain location proof
    const offchainProof = await sdk.signOffchainLocationAttestation(unsignedProof);
    console.log('Offchain proof signed: ' + offchainProof.uid);

    // Optionally publish the proof to Astral's API
    const publishedProof = await sdk.publishOffchainLocationAttestation(offchainProof);
    console.log('Offchain proof published to API: ' + publishedProof.uid);

    // === Onchain Workflow ===
    console.log('\n=== Onchain Workflow ===');

    // Build another unsigned location proof
    const onchainUnsignedProof = await sdk.buildLocationAttestation({
      location: [12.34, 56.78],
      locationType: 'coordinates-decimal+lon-lat',
      memo: 'Testing onchain workflow',
    });

    console.log('Unsigned proof created for onchain registration.');

    // Register the proof on-chain
    const onchainProof = await sdk.registerOnchainLocationAttestation(onchainUnsignedProof);
    console.log('Onchain proof registered: ' + onchainProof.uid);
    console.log('Transaction hash: ' + onchainProof.txHash);

    // Verify proofs
    const offchainVerification = await sdk.verifyOffchainLocationAttestation(offchainProof);
    console.log(
      'Offchain verification result: ' + (offchainVerification.isValid ? 'Valid' : 'Invalid')
    );

    const onchainVerification = await sdk.verifyOnchainLocationAttestation(onchainProof);
    console.log(
      'Onchain verification result: ' + (onchainVerification.isValid ? 'Valid' : 'Invalid')
    );

    return {
      offchainProof,
      onchainProof,
    };
  } catch (error) {
    console.error('Error in example:', error);
    throw error;
  }
}

// This example is for reference only
console.log(
  'Note: This example demonstrates the intended SDK interface once integration is complete.'
);
console.log('It is not yet functional as the SDK integration is still in progress.');
