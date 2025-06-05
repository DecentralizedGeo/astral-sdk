---
title: Getting Started Guide
sidebar_position: 1
description: Complete tutorial from installation to your first location attestation
---

# Getting Started with Astral SDK

This guide will take you from zero to creating your first location attestation in about 5 minutes.

## What You'll Learn

- How to install and set up the Astral SDK
- The difference between offchain and onchain workflows
- How to create your first location attestation
- How to verify attestations
- Common patterns and best practices

## Prerequisites

- Node.js 18+ and a package manager (pnpm, npm, or yarn)
- Basic familiarity with TypeScript/JavaScript
- For onchain examples: A wallet with testnet ETH

## Installation

```bash
# Using pnpm (recommended)
pnpm add @decentralized-geo/astral-sdk

# Using npm
npm install @decentralized-geo/astral-sdk

# Using yarn
yarn add @decentralized-geo/astral-sdk
```

## Core Concepts

### Two Workflows, Two Use Cases

Astral SDK offers two distinct ways to create location attestations:

**🔐 Offchain Workflow**
- Uses EIP-712 signatures (like MetaMask message signing)
- No gas costs, instant creation
- Perfect for: apps with many users, private attestations, real-time features

**⛓️ Onchain Workflow** 
- Creates permanent blockchain transactions
- Costs gas, takes time to confirm
- Perfect for: smart contracts, public records, immutable proofs

> **Important:** These create different attestation types with unique identifiers. You cannot convert between them while preserving identity.

## Your First Offchain Attestation (Gasless)

Let's start with the simpler offchain workflow that doesn't require any ETH.

### Step 1: Basic Setup

```typescript
import { AstralSDK } from '@decentralized-geo/astral-sdk';

// Create SDK instance - no wallet required for basic operations
const sdk = new AstralSDK({
  mode: 'offchain', // Focus on offchain features
  debug: true       // See what's happening under the hood
});
```

### Step 2: Create a Simple Location Attestation

```typescript
// Define your location (multiple formats supported)
const locationData = {
  location: [-0.1276, 51.5074], // London coordinates [longitude, latitude]
  memo: 'Visited London Eye today!',
  timestamp: new Date()
};

// Build the attestation structure
const unsignedAttestation = await sdk.buildLocationAttestation(locationData);

console.log('✅ Unsigned attestation created');
console.log('Location type detected:', unsignedAttestation.locationType);
console.log('Event timestamp:', new Date(unsignedAttestation.eventTimestamp * 1000));
```

### Step 3: Add a Signature (Requires Wallet)

Now we need a wallet to sign the attestation:

```typescript
import { ethers } from 'ethers';

// Connect to user's wallet (in browser)
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// Create SDK with signer
const signingSDK = new AstralSDK({
  signer,
  defaultChain: 'sepolia', // Use Sepolia testnet
  debug: true
});

// Create and sign in one step
const offchainAttestation = await signingSDK.createOffchainLocationAttestation({
  location: [-0.1276, 51.5074],
  memo: 'My first signed location attestation!'
});

console.log('🎉 Signed attestation created!');
console.log('UID:', offchainAttestation.uid);
console.log('Signer:', offchainAttestation.signer);
```

### Step 4: Verify the Attestation

```typescript
// Verify the signature
const verification = await signingSDK.verifyOffchainLocationAttestation(offchainAttestation);

if (verification.isValid) {
  console.log('✅ Signature is valid!');
  console.log('Signed by:', verification.signerAddress);
} else {
  console.log('❌ Invalid signature:', verification.reason);
}
```

## Your First Onchain Attestation

Onchain attestations are permanently stored on the blockchain and can be queried by smart contracts.

### Prerequisites

- A wallet with Sepolia testnet ETH
- Get free testnet ETH from: https://sepoliafaucet.com/

### Step 1: Setup with Provider

```typescript
import { ethers } from 'ethers';

// Setup provider and signer for blockchain interaction
const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/YOUR_INFURA_KEY');
const privateKey = 'YOUR_TEST_PRIVATE_KEY'; // Use a test wallet!
const signer = new ethers.Wallet(privateKey, provider);

const sdk = new AstralSDK({
  provider,
  signer,
  defaultChain: 'sepolia',
  debug: true
});

// Check balance before proceeding
const balance = await provider.getBalance(signer.address);
console.log('Balance:', ethers.formatEther(balance), 'sepETH');
```

### Step 2: Create Onchain Attestation

```typescript
// This will submit a real blockchain transaction
const onchainAttestation = await sdk.createOnchainLocationAttestation({
  location: {
    type: 'Point',
    coordinates: [2.3522, 48.8566] // Paris coordinates
  },
  memo: 'Permanent record from the Eiffel Tower'
});

console.log('🎉 Onchain attestation created!');
console.log('UID:', onchainAttestation.uid);
console.log('Transaction hash:', onchainAttestation.txHash);
console.log('Block number:', onchainAttestation.blockNumber);
console.log('View on Etherscan:', `https://sepolia.etherscan.io/tx/${onchainAttestation.txHash}`);
```

### Step 3: Verify Onchain

```typescript
const verification = await sdk.verifyOnchainLocationAttestation(onchainAttestation);

console.log('Verification result:', {
  isValid: verification.isValid,
  attester: verification.signerAddress,
  revoked: verification.revoked
});
```

## Location Format Examples

Astral SDK currently supports GeoJSON format with additional formats coming soon:

```typescript
// Currently supported: GeoJSON format
const geoJsonFormats = [
  // Point in Lagos, Nigeria
  {
    type: 'Point',
    coordinates: [3.3792, 6.5244]
  },
  
  // Feature with metadata in Jakarta
  {
    type: 'Feature',
    properties: { 
      name: 'National Monument',
      type: 'landmark' 
    },
    geometry: {
      type: 'Point',
      coordinates: [106.8272, -6.1751]
    }
  },
  
  // Polygon boundary around Sydney harbor area
  {
    type: 'Polygon',
    coordinates: [[[
      [151.2000, -33.8500], [151.2500, -33.8500],
      [151.2500, -33.8800], [151.2000, -33.8800], [151.2000, -33.8500]
    ]]]
  }
];

// Use GeoJSON format
for (const location of geoJsonFormats) {
  const attestation = await sdk.buildLocationAttestation({
    location,
    memo: `Spatial record: ${location.type || location.geometry?.type} feature`
  });
  
  console.log('Location type:', attestation.locationType);
}
```

:::info Coming Soon
Additional location formats are planned:
- **Coordinate arrays**: `[longitude, latitude]` pairs  
- **Well-Known Text (WKT)**: `POINT(-74.0060 40.7128)`, `POLYGON(...)`
- **H3 geospatial indexing**: Hexagonal cell identifiers

These have placeholder implementations in the codebase but are not yet functional.
:::

## Adding Media Attachments

You can attach images, videos, or other files to location attestations:

```typescript
// Base64 encoded image data (1x1 pixel PNG for demo)
const imageData = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

const attestationWithMedia = await sdk.createOffchainLocationAttestation({
  location: [-0.1276, 51.5074],
  memo: 'Photo evidence from London',
  media: [
    {
      mediaType: 'image/png',
      data: imageData
    }
  ]
});

console.log('Media types:', attestationWithMedia.mediaType);
console.log('Media data entries:', attestationWithMedia.mediaData.length);
```

## Error Handling Patterns

```typescript
import { AstralError, ValidationError, NetworkError } from '@astral-protocol/sdk';

try {
  const attestation = await sdk.createOffchainLocationAttestation({
    location: null, // This will cause a validation error
    memo: 'Invalid location'
  });
} catch (error) {
  if (error instanceof ValidationError) {
    console.log('❌ Invalid input:', error.message);
  } else if (error instanceof NetworkError) {
    console.log('🌐 Network problem:', error.message);
  } else if (error instanceof AstralError) {
    console.log('⚠️ SDK error:', error.message);
  } else {
    console.log('💥 Unexpected error:', error);
  }
}
```

## Working with Environment Variables

Create a `.env.local` file for your configuration:

```bash
# Required for onchain operations
TEST_PRIVATE_KEY=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
INFURA_API_KEY=your_infura_project_id

# Optional configuration
ASTRAL_API_URL=https://api.astral-protocol.com
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/your_project_id
```

Then load them in your application:

```typescript
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sdk = new AstralSDK({
  provider: new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL),
  signer: new ethers.Wallet(process.env.TEST_PRIVATE_KEY!),
  defaultChain: 'sepolia'
});
```

## Type Safety Tips

Astral SDK is fully typed. Use TypeScript features to catch errors early:

```typescript
import { 
  LocationAttestationInput, 
  OffchainLocationAttestation,
  OnchainLocationAttestation,
  isOffchainLocationAttestation 
} from '@decentralized-geo/astral-sdk';

// Input type ensures you provide required fields
const input: LocationAttestationInput = {
  location: { type: 'Point', coordinates: [100.5018, 13.7563] }, // Bangkok
  memo: 'Type-safe spatial record',
  timestamp: new Date() // Optional but typed
};

// Type guards help handle mixed attestation types
function handleAttestation(attestation: OffchainLocationAttestation | OnchainLocationAttestation) {
  if (isOffchainLocationAttestation(attestation)) {
    // TypeScript knows this is offchain
    console.log('Signer:', attestation.signer);
    console.log('Signature:', attestation.signature);
  } else {
    // TypeScript knows this is onchain
    console.log('Transaction:', attestation.txHash);
    console.log('Block:', attestation.blockNumber);
  }
}
```

## Next Steps

Now that you've created your first location attestations, explore these advanced topics:

- **[Offchain Workflow Guide](offchain-workflow.md)** - Deep dive into gasless attestations
- **[Onchain Workflow Guide](onchain-workflow.md)** - Blockchain integration patterns  
- **[API Reference](api-reference.md)** - Complete method documentation
- **[Examples Cookbook](examples.md)** - Real-world usage patterns
- **[Extension System](extensions.md)** - Custom location formats and media types

## Common Issues & Solutions

### "No extension found for location type"
```typescript
// Wait for extensions to load before using the SDK
await sdk.extensions.ensureInitialized();
```

### "Insufficient funds for gas"
- Get testnet ETH from https://sepoliafaucet.com/
- Check balance: `await provider.getBalance(address)`

### "Invalid signature" in verification
- Ensure the signer address matches the attestation signer
- Check that the attestation wasn't modified after signing

### Type errors with location data
```typescript
// Be explicit about GeoJSON coordinate order: [longitude, latitude]
const point = { 
  type: 'Point', 
  coordinates: [31.2357, 30.0444] // Cairo: lng, lat
};
```

## Support

- **Documentation**: Complete guides in the `docs/` folder
- **Examples**: Working code in the `examples/` folder  
- **Issues**: Report problems on GitHub
- **Community**: Join our Discord for questions

Ready to build something amazing with location attestations? Check out the [Examples Cookbook](examples.md) for real-world patterns!