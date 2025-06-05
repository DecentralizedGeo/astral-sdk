// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

/**
 * Example script to test the OffchainSigner
 *
 * This script demonstrates how to use the OffchainSigner directly to create
 * a signed offchain location proof.
 *
 * Usage:
 * 1. Build the SDK: pnpm run build
 * 2. Run this example: npx ts-node examples/offchain-signer-test.ts
 */

import { ethers } from 'ethers';
import { OffchainSigner } from '../src/eas/OffchainSigner';
import { UnsignedLocationAttestation } from '../src/core/types';

async function main() {
  try {
    console.log('Testing OffchainSigner for location proofs...');

    // Create a wallet for testing (use your own private key or generate one)
    // WARNING: Never use this private key for anything other than testing
    const wallet = new ethers.Wallet(
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
    );
    console.log(`Using wallet address: ${await wallet.getAddress()}`);

    // Create an OffchainSigner instance
    const signer = new OffchainSigner({
      signer: wallet,
      chainId: 11155111, // Sepolia testnet
    });

    // Create an unsigned location proof with GeoJSON data
    const unsignedProof: UnsignedLocationAttestation = {
      eventTimestamp: Math.floor(Date.now() / 1000),
      srs: 'EPSG:4326',
      locationType: 'geojson',
      location: JSON.stringify({
        type: 'Point',
        coordinates: [-122.4194, 37.7749], // San Francisco coordinates
      }),
      recipeType: [],
      recipePayload: [],
      mediaType: [],
      mediaData: [],
      memo: 'Test location proof from example script',
    };

    console.log('\nUnsigned proof created:', unsignedProof);

    // Sign the proof to create an offchain location proof
    console.log('\nSigning the location proof...');
    const offchainProof = await signer.signOffchainLocationAttestation(unsignedProof);

    console.log('\nOffchain proof created successfully!');
    console.log('UID:', offchainProof.uid);
    console.log('Signer:', offchainProof.signer);
    console.log('Version:', offchainProof.version);
    console.log('Signature (truncated):', offchainProof.signature.substring(0, 64) + '...');

    // Verify the signed proof
    console.log('\nVerifying the offchain proof...');
    const verificationResult = await signer.verifyOffchainLocationAttestation(offchainProof);

    if (verificationResult.isValid) {
      console.log('✅ Proof verification succeeded!');
      console.log('Verified signer address:', verificationResult.signerAddress);
    } else {
      console.error('❌ Proof verification failed:', verificationResult.reason);
    }

    return offchainProof;
  } catch (error) {
    console.error('Error in test script:', error);
    throw error;
  }
}

// Run the example
main()
  .then(proof => {
    console.log('\nTest completed successfully!');
    console.log('\nFull proof object:');
    console.log(JSON.stringify(proof, null, 2));
  })
  .catch(error => {
    console.error('Test failed with error:', error);
    process.exit(1);
  });
