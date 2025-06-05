---
title: Quick Start
sidebar_position: 3
description: Get up and running with your first location attestation in 30 seconds
---

# Quick Start

Get your first location attestation working in under 30 seconds.

## Installation

```bash
pnpm add @decentralized-geo/astral-sdk  # or npm/yarn
```

## Offchain Attestation (No Gas Required)

Perfect for getting started - no blockchain setup needed:

```typescript
import { AstralSDK } from '@decentralized-geo/astral-sdk';

// Connect to your wallet
const sdk = new AstralSDK({ 
  provider: window.ethereum,
  defaultChain: 'sepolia' 
});

// Create a location attestation
const attestation = await sdk.createOffchainLocationAttestation({
  location: [-0.163808, 51.5101], // London coordinates [lng, lat]
  memo: 'GPS reading at Westminster Bridge'
});

// ✅ Done! You have a cryptographically signed location attestation
console.log('Attestation UID:', attestation.uid);
console.log('Signed by:', attestation.signer);

// Verify it works
const verification = await sdk.verifyOffchainLocationAttestation(attestation);
console.log('Valid signature:', verification.isValid);
```

## Onchain Attestation (Permanent Record)

For blockchain permanence (requires testnet ETH):

```typescript
// Same API, different method - creates permanent blockchain record
const onchainAttestation = await sdk.createOnchainLocationAttestation({
  location: { 
    type: 'Point', 
    coordinates: [-58.3816, -34.6037] // Buenos Aires
  },
  memo: 'Monitoring station deployment coordinates'
});

console.log('Transaction hash:', onchainAttestation.txHash);
console.log('View on Etherscan:', `https://sepolia.etherscan.io/tx/${onchainAttestation.txHash}`);
```

## Multiple Location Formats

The SDK automatically handles different location formats:

```typescript
// Currently supported: GeoJSON format
const geoJsonExamples = [
  // Point in London
  { type: 'Point', coordinates: [-0.163808, 51.5101] },
  
  // Feature with metadata in Mumbai  
  {
    type: 'Feature',
    properties: { name: 'Gateway of India' },
    geometry: { type: 'Point', coordinates: [72.8347, 18.9220] }
  },
  
  // Polygon boundary in Denver
  {
    type: 'Polygon',
    coordinates: [[[
      [-104.9903, 39.7392], [-104.9903, 39.7642],
      [-104.9503, 39.7642], [-104.9503, 39.7392], [-104.9903, 39.7392]
    ]]]
  }
];

for (const location of geoJsonExamples) {
  const attestation = await sdk.createOffchainLocationAttestation({
    location,
    memo: `Spatial record using ${location.type} geometry`
  });
  console.log('Created:', attestation.uid);
}
```

## Next Steps

🎉 **You've created your first location attestation!** 

**What's next?**

- **[Core Concepts](./core-concepts/)** - Understand offchain vs onchain workflows
- **[Getting Started Guide](./guides/getting-started)** - Complete tutorial with setup
- **[Examples Cookbook](./examples/cookbook)** - Real-world usage patterns
- **[API Reference](./api/reference)** - Complete method documentation

**Need help?**
- Check the troubleshooting section in [Getting Started](./guides/getting-started#common-issues--solutions)
- See working examples in the [Examples Cookbook](./examples/cookbook)
- Review the [Core Concepts](./core-concepts) for terminology