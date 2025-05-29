/**
 * Example: Creating a Location Attestation
 *
 * This example demonstrates how to create a signed offchain location attestation
 * using the Astral SDK.
 *
 * Usage:
 * 1. Ensure the SDK is built: pnpm run build
 * 2. Run this example: npx ts-node examples/create-location-attestation.ts
 */
// override the eslint no-console rule for this example
/* eslint-disable no-console */

import { ethers } from 'ethers';
import { AstralSDK } from '../src/core/AstralSDK';
import { LocationProofInput } from '../src/core/types';

async function main() {
  try {
    console.log('Creating a signed location attestation with Astral SDK\n');

    // Create a wallet for demonstration
    // In a real application, this would be the user's wallet
    // WARNING: Never use this private key for anything other than testing
    const wallet = new ethers.Wallet(
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
    );
    console.log(`Using wallet address: ${wallet.address}`);

    // Initialize the AstralSDK with a signer and chain info
    const sdk = new AstralSDK({
      signer: wallet,
      defaultChain: 'sepolia',
      debug: true, // Enable debug logging
    });

    // Create location proof input with GeoJSON data
    const locationInput: LocationProofInput = {
      location: {
        type: 'Point',
        coordinates: [-122.4194, 37.7749], // San Francisco coordinates
      },
      locationType: 'geojson',
      memo: 'Example location attestation created with AstralSDK',
      // Optional: provide a timestamp or it will use current time
      timestamp: new Date(),
    };

    console.log('\nLocation input:', locationInput);

    // Create and sign an offchain location proof in one step
    console.log('\nCreating and signing the location proof...');
    const offchainProof = await sdk.createOffchainLocationProof(locationInput);

    console.log('\nOffchain attestation created successfully!');
    console.log('UID:', offchainProof.uid);
    console.log('Signer:', offchainProof.signer);
    console.log('Version:', offchainProof.version);
    console.log(
      'Signature (truncated):',
      typeof offchainProof.signature === 'string'
        ? offchainProof.signature.substring(0, 64) + '...'
        : 'Non-string signature'
    );

    // Verify the signed proof
    console.log('\nVerifying the attestation...');
    const verificationResult = await sdk.verifyOffchainLocationProof(offchainProof);

    if (verificationResult.isValid) {
      console.log('✅ Attestation verified successfully!');
      console.log('Verified signer address:', verificationResult.signerAddress);
    } else {
      console.error('❌ Attestation verification failed:', verificationResult.reason);
    }

    return offchainProof;
  } catch (error) {
    console.error('Error creating location attestation:', error);
    throw error;
  }
}

// Run the example
main()
  .then(proof => {
    console.log('\nComplete location attestation:');
    // Convert to a more readable format for display
    const displayProof = {
      ...proof,
      location: JSON.parse(proof.location),
    };
    console.log(JSON.stringify(displayProof, null, 2));
    console.log('\nThis attestation can be published to the Astral API or stored locally.');
  })
  .catch(error => {
    console.error('Example failed:', error);
    process.exit(1);
  });
