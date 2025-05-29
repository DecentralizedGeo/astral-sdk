/**
 * Example script to test the OnchainRegistrar
 *
 * This script demonstrates how to use the OnchainRegistrar directly to create
 * an on-chain location attestation.
 *
 * Usage:
 * 1. Build the SDK: pnpm run build
 * 2. Run this example: npx ts-node examples/onchain-registrar-test.ts
 *
 * Note: This requires a funded wallet on Sepolia testnet to pay for gas.
 */
// override the eslint no-console rule for this example
/* eslint-disable no-console */

import { ethers } from 'ethers';
// import { OnchainRegistrar } from '../src/eas/OnchainRegistrar';
import { UnsignedLocationProof } from '../src/core/types';

async function main() {
  try {
    console.log('Testing OnchainRegistrar for location proofs...');

    // Create a wallet for testing (use your own private key or generate one)
    // WARNING: Never use this private key for anything other than testing
    const wallet = new ethers.Wallet(
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
    );
    console.log(`Using wallet address: ${await wallet.getAddress()}`);

    // Create an RPC provider for Sepolia
    // NOTE: You'll need to replace this with a valid RPC URL, e.g. from Infura or Alchemy
    // const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/YOUR_INFURA_KEY');
    // const connectedWallet = wallet.connect(provider);

    // Create an OnchainRegistrar instance
    // const registrar = new OnchainRegistrar({
    //   signer: connectedWallet,
    //   chain: 'sepolia', // Sepolia testnet
    // });

    // Create an unsigned location proof with GeoJSON data
    const unsignedProof: UnsignedLocationProof = {
      eventTimestamp: Math.floor(Date.now() / 1000),
      srs: 'EPSG:4326',
      locationType: 'geojson',
      location: JSON.stringify({
        type: 'Point',
        coordinates: [-122.4194, 37.7749], // San Francisco coordinates
      }),
      recipeTypes: [],
      recipePayloads: [],
      mediaTypes: [],
      mediaData: [],
      memo: 'Test location proof from example script',
    };

    console.log('\nUnsigned proof created:', unsignedProof);

    // Register the proof on-chain
    console.log('\nRegistering the location proof on-chain...');
    console.log('This will submit a transaction to the Sepolia testnet...');

    // Uncomment this to actually submit a transaction (requires a funded wallet)
    /*
    const onchainProof = await registrar.registerOnchainLocationProof(unsignedProof);
    
    console.log('\nOn-chain proof created successfully!');
    console.log('UID:', onchainProof.uid);
    console.log('Chain:', onchainProof.chain);
    console.log('Transaction Hash:', onchainProof.txHash);
    console.log('Block Number:', onchainProof.blockNumber);
    
    // Verify the on-chain proof
    console.log('\nVerifying the on-chain proof...');
    const verificationResult = await registrar.verifyOnchainLocationProof(onchainProof);
    
    if (verificationResult.isValid) {
      console.log('✅ Proof verification succeeded!');
      console.log('Verified attester address:', verificationResult.signerAddress);
    } else {
      console.error('❌ Proof verification failed:', verificationResult.reason);
    }
    
    return onchainProof;
    */

    // For now, just return the unsigned proof to avoid submitting transactions
    return unsignedProof;
  } catch (error) {
    console.error('Error in test script:', error);
    throw error;
  }
}

// Run the example
main()
  .then(proof => {
    console.log('\nTest completed successfully!');
    console.log('\nProof object:');
    console.log(JSON.stringify(proof, null, 2));
  })
  .catch(error => {
    console.error('Test failed with error:', error);
    process.exit(1);
  });
