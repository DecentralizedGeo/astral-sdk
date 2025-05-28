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

async function main() {
  try {
    console.log('Demonstrating AstralSDK workflows (coming soon)...');
    
    // Create a wallet for testing (use your own private key or generate one)
    const wallet = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
    
    // Create an RPC provider for Sepolia
    const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/YOUR_INFURA_KEY');
    const connectedWallet = wallet.connect(provider);
    
    // Initialize the SDK with a signer and chain ID
    const sdk = new AstralSDK({
      provider: connectedWallet,
      chainId: 11155111, // Sepolia testnet
      debug: true
    });
    
    // === Offchain Workflow ===
    console.log('\n=== Offchain Workflow ===');
    
    // Build an unsigned location proof
    const unsignedProof = await sdk.buildLocationProof({
      location: {
        type: "Feature",
        properties: {},
        geometry: {
          coordinates: [
            -0.163808,
            51.5101
          ],
          type: "Point"
        }
      },
      locationType: 'geojson-point',
      memo: 'Testing offchain workflow'
    });
    
    console.log('Unsigned proof created.');
    
    // Sign the proof to create an offchain location proof
    const offchainProof = await sdk.signOffchainLocationProof(unsignedProof);
    console.log('Offchain proof signed: ' + offchainProof.uid);
    
    // Optionally publish the proof to Astral's API
    const publishedProof = await sdk.publishOffchainLocationProof(offchainProof);
    console.log('Offchain proof published to API: ' + publishedProof.uid);
    
    // === Onchain Workflow ===
    console.log('\n=== Onchain Workflow ===');
    
    // Build another unsigned location proof
    const onchainUnsignedProof = await sdk.buildLocationProof({
      location: [12.34, 56.78],
      locationType: 'coordinates-decimal+lon-lat',
      memo: 'Testing onchain workflow'
    });
    
    console.log('Unsigned proof created for onchain registration.');
    
    // Register the proof on-chain
    const onchainProof = await sdk.registerOnchainLocationProof(onchainUnsignedProof);
    console.log('Onchain proof registered: ' + onchainProof.uid);
    console.log('Transaction hash: ' + onchainProof.txHash);
    
    // Verify proofs
    const offchainVerification = await sdk.verifyOffchainLocationProof(offchainProof);
    console.log('Offchain verification result: ' + (offchainVerification.isValid ? 'Valid' : 'Invalid'));
    
    const onchainVerification = await sdk.verifyOnchainLocationProof(onchainProof);
    console.log('Onchain verification result: ' + (onchainVerification.isValid ? 'Valid' : 'Invalid'));
    
    return {
      offchainProof,
      onchainProof
    };
  } catch (error) {
    console.error('Error in example:', error);
    throw error;
  }
}

// This example is for reference only
console.log('Note: This example demonstrates the intended SDK interface once integration is complete.');
console.log('It is not yet functional as the SDK integration is still in progress.');