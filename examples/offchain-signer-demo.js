/**
 * OffchainSigner Demo script
 * 
 * This demonstrates the OffchainSigner component's capabilities
 * for creating EIP-712 signatures for location attestations.
 */

// Import ethers
const { ethers } = require('ethers');

// Import OffchainSigner and related components from the main package
const { OffchainSigner, AstralSDK, EASError } = require('../dist/index');

async function main() {
  try {
    console.log('='.repeat(60));
    console.log('ASTRAL SDK - OFFCHAINSIGNER COMPONENT DEMO');
    console.log('='.repeat(60));

    // Create a wallet for demonstration
    const wallet = new ethers.Wallet(
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
    );
    console.log(`\nWallet address: ${wallet.address}`);

    // Initialize the OffchainSigner
    console.log('\nInitializing OffchainSigner...');
    const offchainSigner = new OffchainSigner({
      signer: wallet,
      chainId: 11155111, // Sepolia testnet
    });
    
    console.log('\nOffchainSigner initialized successfully!');
    
    // Print the available methods on OffchainSigner
    console.log('\nAvailable methods on OffchainSigner:');
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(offchainSigner))
      .filter(name => name !== 'constructor');
    methods.forEach(method => console.log(`- ${method}`));
    
    console.log('\nOffchainSigner Component Purpose:');
    console.log('The OffchainSigner component is responsible for:');
    console.log('- Creating EIP-712 signatures for location attestations');
    console.log('- Verifying attestation signatures');
    console.log('- Converting between different attestation formats');

    // Create a properly formatted unsigned location proof
    // Note: This follows the format expected by our interfaces
    console.log('\nExample Unsigned Location Proof Format:');
    const unsignedProofFormat = {
      eventTimestamp: Math.floor(Date.now() / 1000),
      srs: 'EPSG:4326',
      locationType: 'geojson',
      location: JSON.stringify({
        type: 'Point',
        coordinates: [-122.4194, 37.7749] // San Francisco coordinates
      }),
      recipeTypes: [],
      recipePayloads: [],
      mediaTypes: [],
      mediaData: [],
      memo: 'Demo location attestation',
      expirationTime: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
      revocable: true,
      recipient: ethers.ZeroAddress
    };
    
    console.log(JSON.stringify(unsignedProofFormat, null, 2));
    
    // Note on usage
    console.log('\nNormal Usage Pattern:');
    console.log('In a typical application, you would:');
    console.log('1. Create an AstralSDK instance with your signer');
    console.log('2. Use AstralSDK.createOffchainLocationProof() to generate proofs');
    console.log('3. Use AstralSDK.verifyOffchainLocationProof() to verify proofs');
    
    console.log('\nError Handling:');
    console.log('The OffchainSigner provides detailed error information through the EASError class');
    console.log('Example error format:');
    const sampleError = new EASError(
      'EAS SchemaEncoder error during encoding: Failed to encode proof data',
      undefined,
      { component: 'SchemaEncoder', operation: 'encoding' }
    );
    console.log(sampleError);
    
    console.log('\n' + '='.repeat(60));
    console.log('DEMO COMPLETE');
    console.log('='.repeat(60));
    
    return {
      status: 'success',
      message: 'OffchainSigner demonstration complete'
    };
  } catch (error) {
    console.error('Error in demo:', error);
    return {
      status: 'error',
      message: error.message
    };
  }
}

// Run the demo
main()
  .then(result => {
    console.log(`\nStatus: ${result.status}`);
    console.log(`Message: ${result.message}`);
    
    console.log('\nThe OffchainSigner component is a key part of the Astral SDK');
    console.log('for creating verifiable location attestations with EIP-712 signatures.');
  })
  .catch(console.error);