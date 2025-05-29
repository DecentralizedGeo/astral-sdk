/**
 * Minimal Demo script for the Astral SDK
 *
 * This demonstrates a minimal setup of AstralSDK with a test wallet.
 * It initializes the SDK and displays the configuration.
 */
// override the eslint no-console rule for this example
/* eslint-disable no-console */

// Import ethers
const { ethers } = require('ethers');

// Import only the AstralSDK from the built package
const { AstralSDK, ExtensionRegistry } = require('../dist/index');

// Create a minimal demo
async function main() {
  try {
    console.log('='.repeat(50));
    console.log('ASTRAL SDK MINIMAL DEMO');
    console.log('='.repeat(50));

    // Create a test wallet with a known key
    const wallet = new ethers.Wallet(
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
    );
    console.log(`\nWallet address: ${wallet.address}`);

    // Initialize the SDK with debug enabled
    console.log('\nInitializing AstralSDK...');
    const sdk = new AstralSDK({
      signer: wallet,
      defaultChain: 'sepolia',
      debug: true,
    });

    console.log('\nSDK initialized successfully!');

    // Create dummy location input - just for display
    const locationInputExample = {
      location: {
        type: 'Point',
        coordinates: [-122.4194, 37.7749], // San Francisco
      },
      locationType: 'geojson',
      memo: 'Demo location from San Francisco',
      timestamp: new Date(),
    };

    console.log('\nExample location input:');
    console.log(JSON.stringify(locationInputExample, null, 2));

    // Demonstrate SDK's extension system
    const registry = new ExtensionRegistry(true);

    // Wait a bit for built-in extensions to be registered asynchronously
    console.log('\nWaiting for extensions to register...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log('\nSDK capabilities:');
    console.log('- Create and sign offchain location attestations');
    console.log('- Verify attestation signatures');
    console.log('- Convert between different location formats');
    console.log('- Encode and decode attestation data');

    console.log('\n='.repeat(50));
    console.log('DEMO COMPLETE');
    console.log('='.repeat(50));

    return {
      status: 'success',
      message: 'SDK demonstration complete',
    };
  } catch (error) {
    console.error('\nError in demo:', error);
    return {
      status: 'error',
      message: error.message,
    };
  }
}

// Run the demo
main()
  .then(result => {
    console.log(`\nDemo Status: ${result.status}`);
    console.log(`Demo Message: ${result.message}`);
  })
  .catch(console.error);
