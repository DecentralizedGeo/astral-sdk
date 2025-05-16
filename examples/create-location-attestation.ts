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

import { ethers } from 'ethers';
import { OffchainSigner } from '../src/eas/OffchainSigner';
import { UnsignedLocationProof } from '../src/core/types';

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

    // Create an OffchainSigner instance
    const signer = new OffchainSigner({
      signer: wallet,
      chainId: 11155111, // Sepolia testnet
    });

    // Create an unsigned location proof with GeoJSON data
    const unsignedProof: UnsignedLocationProof = {
      eventTimestamp: Math.floor(Date.now() / 1000),
      srs: 'EPSG:4326', // Standard spatial reference system
      locationType: 'geojson',
      location: JSON.stringify({
        type: 'Point',
        coordinates: [-122.4194, 37.7749], // San Francisco coordinates
      }),
      // These fields can be populated for more complex attestations
      recipeTypes: [],
      recipePayloads: [],
      mediaTypes: [],
      mediaData: [],
      memo: 'Example location attestation',
    };

    console.log('\nCreated unsigned location proof:', {
      ...unsignedProof,
      location: JSON.parse(unsignedProof.location), // Parse for better display
    });

    // Sign the proof to create an offchain location attestation
    console.log('\nSigning the location proof...');
    const offchainProof = await signer.signOffchainLocationProof(unsignedProof);

    console.log('\nOffchain attestation created successfully!');
    console.log('UID:', offchainProof.uid);
    console.log('Signer:', offchainProof.signer);
    console.log('Version:', offchainProof.version);
    console.log('Signature (truncated):', offchainProof.signature.substring(0, 64) + '...');

    // Verify the signed proof
    console.log('\nVerifying the attestation...');
    const verificationResult = await signer.verifyOffchainLocationProof(offchainProof);

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
