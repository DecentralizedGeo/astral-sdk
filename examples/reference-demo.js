/**
 * Astral SDK Reference Demo
 *
 * This is a reference implementation demonstrating the capabilities
 * of the Astral SDK for location attestations.
 */
// override the eslint no-console rule for this example
/* eslint-disable no-console */

// Import ethers for wallet functionality
const { ethers } = require('ethers');

// Import core components from the SDK
const { AstralSDK, ValidationError, SignerError, ExtensionError } = require('../dist/index');

// Create a reference implementation
async function main() {
  try {
    console.log('='.repeat(80));
    console.log('ASTRAL SDK REFERENCE DEMO');
    console.log('='.repeat(80));

    // Create a new wallet for testing
    // In a real application, you would connect to a user's wallet
    const wallet = new ethers.Wallet(
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
    );
    console.log(`\nWallet address: ${wallet.address}`);

    // Initialize the SDK with preferred configuration
    console.log('\nInitializing AstralSDK with debugging enabled...');
    const sdk = new AstralSDK({
      signer: wallet, // Ethereum signer for creating signatures
      defaultChain: 'sepolia', // Default chain for attestations
      debug: true, // Enable debugging output
    });

    // SECTION 1: Display key information about the SDK and its capabilities
    console.log('\n' + '#'.repeat(50));
    console.log('## SDK CAPABILITIES');
    console.log('#'.repeat(50));

    console.log('\nAstral SDK provides:');
    console.log('- Creation of verifiable location attestations');
    console.log('- Off-chain workflow with EIP-712 signatures');
    console.log('- On-chain workflow for blockchain registration (upcoming)');
    console.log('- Flexible location format support');
    console.log('- Media attachment handling (upcoming)');

    // SECTION 2: Example location data in different formats
    console.log('\n' + '#'.repeat(50));
    console.log('## LOCATION DATA EXAMPLES');
    console.log('#'.repeat(50));

    // GeoJSON Point (fundamental format)
    const geoJsonPoint = {
      type: 'Point',
      coordinates: [-122.4194, 37.7749], // San Francisco
    };
    console.log('\nGeoJSON Point:');
    console.log(JSON.stringify(geoJsonPoint, null, 2));

    // Feature with properties
    const geoJsonFeature = {
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-0.1278, 51.5074], // London
      },
      properties: {
        name: 'London',
        accuracy: 10, // meters
      },
    };
    console.log('\nGeoJSON Feature:');
    console.log(JSON.stringify(geoJsonFeature, null, 2));

    // SECTION 3: Creating a location attestation (workflow)
    console.log('\n' + '#'.repeat(50));
    console.log('## LOCATION ATTESTATION WORKFLOW');
    console.log('#'.repeat(50));

    console.log('\nStep 1: Prepare location data');
    const locationInput = {
      location: geoJsonPoint,
      locationType: 'geojson',
      memo: 'Example location attestation from San Francisco',
      timestamp: new Date(),
    };
    console.log(JSON.stringify(locationInput, null, 2));

    console.log('\nStep 2: Create and sign an offchain location proof');
    console.log('(Note: Actual proof creation requires properly registered extensions)');

    // This is a mock offchain proof for demonstration
    const mockOffchainProof = {
      uid: '0x' + '1'.repeat(64),
      signature: '0x' + '2'.repeat(130),
      signer: wallet.address,
      version: 'astral-sdk-v0.1.0',
      eventTimestamp: Math.floor(Date.now() / 1000),
      srs: 'EPSG:4326',
      locationType: 'geojson',
      location: JSON.stringify(geoJsonPoint),
      recipeTypes: [],
      recipePayloads: [],
      mediaTypes: [],
      mediaData: [],
      memo: 'Example location attestation from San Francisco',
      revocable: true,
    };

    console.log('\nMock offchain proof:');
    console.log(
      JSON.stringify(
        {
          uid: mockOffchainProof.uid,
          signer: mockOffchainProof.signer,
          signature: mockOffchainProof.signature.substring(0, 42) + '...',
          location: JSON.parse(mockOffchainProof.location),
          memo: mockOffchainProof.memo,
          timestamp: new Date(mockOffchainProof.eventTimestamp * 1000).toISOString(),
        },
        null,
        2
      )
    );

    // SECTION 4: Error handling
    console.log('\n' + '#'.repeat(50));
    console.log('## ERROR HANDLING');
    console.log('#'.repeat(50));

    console.log('\nAstral SDK provides a comprehensive error hierarchy:');
    console.log('- ValidationError: For input validation issues');
    console.log('- SignerError: For signature and signer-related issues');
    console.log('- ExtensionError: For extension-related issues');
    console.log('- NetworkError: For API and blockchain communication issues');

    // SECTION 5: Documentation
    console.log('\n' + '#'.repeat(50));
    console.log('## DOCUMENTATION');
    console.log('#'.repeat(50));

    console.log('\nFor more details, refer to:');
    console.log('- README.md: Main documentation');
    console.log('- Examples directory: Working code examples');
    console.log('- CLAUDE.md: Development guidelines');

    console.log('\n' + '='.repeat(80));
    console.log('DEMO COMPLETE');
    console.log('='.repeat(80));

    return {
      status: 'success',
      message: 'Reference demo completed successfully',
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
    console.log(`\nStatus: ${result.status}`);
    console.log(`Message: ${result.message}`);
  })
  .catch(error => {
    console.error('Unhandled error:', error);
  });
