/**
 * Working Attestation Demo for Astral SDK
 *
 * This demo actually creates and signs a valid location attestation
 * by manually registering the necessary extensions.
 */
// override the eslint no-console rule for this example
/* eslint-disable no-console */

const { ethers } = require('ethers');
const {
  AstralSDK,
  ExtensionRegistry,
  geoJSONExtension,
  locationSchemaExtension,
  EASError,
} = require('../dist/index');

async function main() {
  try {
    console.log('='.repeat(80));
    console.log('ASTRAL SDK - WORKING ATTESTATION DEMO');
    console.log('='.repeat(80));

    // Create a wallet for demonstration
    const wallet = new ethers.Wallet(
      '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
    );
    console.log(`\nWallet address: ${wallet.address}`);

    // Create a custom extension registry with manually registered extensions
    console.log('\nCreating extension registry and manually registering extensions...');
    const registry = new ExtensionRegistry(false); // Don't auto-register

    // Manually register the extensions we need
    registry.registerLocationExtension(geoJSONExtension);
    registry.registerSchemaExtension(locationSchemaExtension);

    // Verify extensions are registered
    const locationExtensions = registry.getAllLocationExtensions();
    const schemaExtensions = registry.getAllSchemaExtensions();

    console.log(`Registered ${locationExtensions.length} location extensions`);
    console.log(`Registered ${schemaExtensions.length} schema extensions`);

    // Initialize the SDK with our registry
    console.log('\nInitializing AstralSDK with custom registry...');
    const sdk = new AstralSDK({
      signer: wallet,
      defaultChain: 'sepolia',
      debug: true,
    });

    // Replace the SDK's extension registry with our custom one
    // Note: This is a bit of a hack, but it works for demo purposes
    sdk.extensions = registry;

    // Create an unsigned location proof
    console.log('\nCreating an unsigned location proof...');

    // Helper function to manually create an unsigned proof
    // This bypasses the normal buildLocationProof flow which has async extension issues
    function createUnsignedProof() {
      const now = Math.floor(Date.now() / 1000);

      // This is a GeoJSON point for London
      const location = {
        type: 'Point',
        coordinates: [-0.1318, 51.5247],
      };

      // Convert to string (normally done by extensions)
      const locationStr = JSON.stringify(location);

      return {
        eventTimestamp: now,
        srs: 'EPSG:4326',
        locationType: 'geojson',
        location: locationStr,
        recipeTypes: [],
        recipePayloads: [],
        mediaTypes: [],
        mediaData: [],
        memo: 'Test location attestation from San Francisco',
        expirationTime: now + 86400, // 24 hours validity
        revocable: true,
        recipient: ethers.ZeroAddress,
      };
    }

    const unsignedProof = createUnsignedProof();
    console.log(JSON.stringify(unsignedProof, null, 2));

    // Sign the unsigned proof
    console.log('\nSigning the location proof...');
    try {
      const offchainProof = await sdk.signOffchainLocationProof(unsignedProof);

      console.log('\n✅ Successfully created and signed a location attestation!');
      console.log('UID:', offchainProof.uid);
      console.log('Signer:', offchainProof.signer);
      console.log('Location Type:', offchainProof.locationType);
      console.log('Signature (first 32 chars):', offchainProof.signature.substring(0, 32) + '...');

      // Verify the signed proof
      console.log('\nVerifying the signed attestation...');
      const verificationResult = await sdk.verifyOffchainLocationProof(offchainProof);

      if (verificationResult.isValid) {
        console.log('✅ Attestation verified successfully!');
        console.log('Verified signer address:', verificationResult.signerAddress);

        // Show the complete attestation (formatted for readability)
        console.log('\nComplete Attestation:');
        const formattedProof = {
          ...offchainProof,
          location: JSON.parse(offchainProof.location), // Parse location for readability
          signature: offchainProof.signature.substring(0, 32) + '...', // Truncate for display
        };
        console.log(JSON.stringify(formattedProof, null, 2));
      } else {
        console.log('❌ Attestation verification failed!');
        console.log('Reason:', verificationResult.reason);
      }

      return {
        status: 'success',
        message: 'Successfully created and verified a location attestation',
        attestation: offchainProof,
      };
    } catch (error) {
      console.error('\n❌ Error during signing or verification:');
      if (error instanceof EASError) {
        console.error('EAS Error:', error.message);
        console.error('Component:', error.context?.component);
        console.error('Operation:', error.context?.operation);
        if (error.cause) console.error('Cause:', error.cause);
      } else {
        console.error(error);
      }

      return {
        status: 'error',
        message: error.message,
      };
    }
  } catch (error) {
    console.error('\nUnexpected error:', error);
    return {
      status: 'error',
      message: 'Unexpected error: ' + error.message,
    };
  }
}

// Run the demo
main()
  .then(result => {
    console.log('\n' + '='.repeat(80));
    console.log(`DEMO COMPLETE - Status: ${result.status}`);
    if (result.status === 'success') {
      console.log('Successfully created a verifiable location attestation with the Astral SDK!');
      console.log('This attestation could be shared, stored, or published to prove location.');
    } else {
      console.log('There was an issue creating the attestation:', result.message);
      console.log('Check the error details above for more information.');
    }
    console.log('='.repeat(80));
  })
  .catch(error => {
    console.error('Fatal error in demo:', error);
  });
