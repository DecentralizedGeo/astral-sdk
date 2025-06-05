# Astral SDK Demo Guide

This guide provides instructions for running and understanding the Astral SDK demos. These demos showcase how the SDK creates cryptographically verifiable location attestations using the Ethereum Attestation Service (EAS). 

## Quick Start 

To get started immediately, run these commands from the project root:

```bash
# Install dependencies
pnpm install

# Build the SDK
pnpm run build

# Run the complete working attestation demo
node examples/working-attestation-demo.js
```

## Available Demos

We've created four demo scripts to showcase different aspects of the SDK:

### 1. Working Attestation Demo (Recommended)
```bash
node examples/working-attestation-demo.js
```
**This demo is fully functional** - it creates and verifies a complete location attestation:
- Manually registers the required extensions
- Creates an unsigned location proof with GeoJSON data
- Signs the proof using EIP-712 signatures
- Verifies the signature cryptographically
- Displays the complete attestation with valid UID and signature

### 2. Reference Demo (SDK Overview)
```bash
node examples/reference-demo.js
```
This comprehensive demo provides an overview of the SDK, including:
- Different location format examples (GeoJSON Point, Feature)
- Workflow for creating attestations
- Error handling patterns
- Documentation references

### 3. OffchainSigner Demo (Component Details)
```bash
node examples/offchain-signer-demo.js
```
This demo focuses on the OffchainSigner component for EIP-712 signatures:
- Component initialization
- Available methods in the OffchainSigner
- Data format requirements
- Example error handling

### 4. Minimal Demo (Quick Initialization Test)
```bash
node examples/minimal-demo.js
```
This minimal demo shows basic SDK initialization and configuration.

## What's Been Implemented

The Astral SDK now has a fully functional integration with the OffchainSigner component:

1. **Core AstralSDK**:
   - Initialization with wallet signers and chain configuration
   - Integration with the OffchainSigner component
   - Methods for signing and verifying proofs
   - Comprehensive error handling

2. **OffchainSigner Component**:
   - Creating EIP-712 signatures for location attestations
   - Verifying attestation signatures
   - Formatting location data for EAS compatibility

3. **Error Handling System**:
   - Specialized `EASError` for EAS operations
   - Detailed context information for debugging
   - Type-safe error hierarchy

## Implementation Notes

The current implementation allows for:
- Creating and signing location attestations (offchain workflow)
- Using different location formats via the extension system
- Error handling specialized for EAS operations
- Flexible configuration for different chains and schemas

## Next Steps for Integration

After running these demos, the next steps would typically be:

1. **Connect to a Real Provider**: 
   - Replace the test wallet with a Web3 provider like MetaMask
   - Configure for specific EVM chains (Sepolia, Ethereum, etc.)

2. **Implement Full Workflow**:
   - Use `createOffchainLocationProof()` to generate signed proofs
   - Use `verifyOffchainLocationProof()` to verify received proofs
   - Store proofs in your application's database or publish via API (future)

3. **Add Custom Extensions**:
   - Implement custom location format extensions if needed
   - Register schemas for your specific application needs

## Troubleshooting

If you encounter issues with the demos:

- **Build Errors**: 
  - Ensure all dependencies are installed: `pnpm install`
  - Make sure the SDK is built: `pnpm run build`
  - Delete node_modules and reinstall if experiencing strange errors

- **Runtime Errors**:
  - Check for any lint/type errors: `pnpm run lint` and `pnpm run typecheck`
  - Run demos from the project root directory
  - Enable debug mode in your SDK configuration for more details

- **Extension-Related Errors**:
  - Extensions are registered asynchronously, so there might be timing issues
  - Wait for extensions to register (a few seconds) or try adding explicit delays

## Example Code

Here's a working example of using the SDK in your application (based on our working demo):

```javascript
// Import the SDK and necessary components
const { ethers } = require('ethers');
const {
  AstralSDK,
  ExtensionRegistry,
  geoJSONExtension,
  locationSchemaExtension
} = require('@astral-protocol/sdk');

async function createAndVerifyAttestation() {
  // Create a wallet (in a real app, connect to user's wallet)
  const wallet = new ethers.Wallet('YOUR_PRIVATE_KEY');
  
  // Create and manually register extensions to avoid async issues
  const registry = new ExtensionRegistry(false);
  registry.registerLocationExtension(geoJSONExtension);
  registry.registerSchemaExtension(locationSchemaExtension);
  
  // Initialize SDK
  const sdk = new AstralSDK({
    signer: wallet,
    defaultChain: 'sepolia',
    debug: true
  });
  
  // Replace SDK's registry with our manually created one
  sdk.extensions = registry;
  
  // Create an unsigned location proof
  const now = Math.floor(Date.now() / 1000);
  const unsignedProof = {
    eventTimestamp: now,
    srs: 'EPSG:4326',
    locationType: 'geojson',
    location: JSON.stringify({
      type: 'Point',
      coordinates: [-0.1318, 51.5247] // London
    }),
    recipeTypes: [],
    recipePayloads: [],
    mediaTypes: [],
    mediaData: [],
    memo: 'My location attestation',
    expirationTime: now + 86400, // 24 hours
    revocable: true,
    recipient: ethers.ZeroAddress
  };
  
  // Sign the proof
  const attestation = await sdk.signOffchainLocationProof(unsignedProof);
  console.log('Created attestation:', attestation.uid);
  
  // Verify the attestation
  const result = await sdk.verifyOffchainLocationProof(attestation);
  if (result.isValid) {
    console.log('Attestation verified successfully!');
  }
  
  return attestation;
}
```