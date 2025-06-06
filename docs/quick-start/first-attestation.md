---
title: First Attestation
sidebar_position: 4
description: Create your first location attestation
---

# First Attestation

Create and verify your first location attestation.

## Offchain Attestation (No Gas)

Start with an offchain attestation - no blockchain fees required:

```typescript
import { AstralSDK } from '@decentralized-geo/astral-sdk';

// Initialize SDK
const sdk = new AstralSDK({ 
  provider: window.ethereum,
  defaultChain: 'sepolia' 
});

// Create attestation
const attestation = await sdk.createOffchainLocationAttestation({
  location: [-0.163808, 51.5101], // [lng, lat]
  memo: 'Westminster Bridge, London'
});

console.log('Created attestation:', attestation.uid);
console.log('Signed by:', attestation.signer);
```

## Verify the Attestation

```typescript
// Verify signature
const verification = await sdk.verifyOffchainLocationAttestation(attestation);

console.log('Valid signature:', verification.isValid);
console.log('Signer address:', verification.signer);
console.log('Location data:', verification.locationData);
```

## Understanding the Response

An offchain attestation contains:

```typescript
{
  uid: "0x...",           // Unique identifier
  signer: "0x...",        // Wallet that signed
  signature: "0x...",     // EIP-712 signature
  locationData: {...},    // Your location data
  timestamp: 1234567890,  // Unix timestamp
  memo: "..."            // Your memo text
}
```

## Try Different Locations

### GeoJSON Point

```typescript
const pointAttestation = await sdk.createOffchainLocationAttestation({
  location: {
    type: 'Point',
    coordinates: [139.6503, 35.6762] // Tokyo
  },
  memo: 'Tokyo Tower observation'
});
```

### GeoJSON Feature

```typescript
const featureAttestation = await sdk.createOffchainLocationAttestation({
  location: {
    type: 'Feature',
    properties: { 
      name: 'Eiffel Tower',
      height: 330 
    },
    geometry: {
      type: 'Point',
      coordinates: [2.2945, 48.8584] // Paris
    }
  },
  memo: 'Landmark documentation'
});
```

## What's Next?

✓ You've created your first location attestation!

### → Continue Learning

• **[Offchain Workflow Guide](/sdk/guides/offchain-workflow)** - Deep dive into offchain attestations
• **[Onchain Workflow Guide](/sdk/guides/onchain-workflow)** - Create permanent blockchain records
• **[Core Concepts](/sdk/core-concepts)** - Understand the fundamentals

### → Build Something

• Environmental monitoring station
• Delivery confirmation system
• Location-based rewards
• Geospatial data registry

### → Get Help

• Review [common issues](/sdk/guides/getting-started#troubleshooting)
• Check the [API Reference](/sdk/api)
• See [example projects](/sdk/examples)