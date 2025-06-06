# Astral SDK

**Create, store, and verify location attestations on any blockchain.**

Astral SDK is a developer-friendly TypeScript library that makes location-based attestations simple. Built on Ethereum Attestation Service (EAS), it supports both gasless offchain signatures and permanent onchain registration across multiple networks.

→ **Get started in 30 seconds** - [Quick Start](#quick-start)  
→ **Complete guide** - [Getting Started](https://docs.astral.global/sdk/guides/getting-started)  
→ **API docs** - [API Reference](https://docs.astral.global/sdk/api)

## Why Astral SDK?

**→ Two ways to create location attestations:**
- **Offchain**: Gasless EIP-712 signatures, instant verification
- **Onchain**: Permanent blockchain registration with smart contract integration

**→ Location format support:**
- GeoJSON (Points, Polygons, Features, FeatureCollections) - ■ Available now
- Decimal coordinates, WKT, H3 indexing - □ Coming soon

**→ Multi-chain ready:**
- Sepolia (testnet) • Base • Arbitrum • Celo

**→ Developer experience:**
- 100% TypeScript with full type safety
- Clear workflow separation (no confusion)
- Comprehensive docs and working examples

## Installation

```bash
# Using pnpm (recommended)
pnpm add @decentralized-geo/astral-sdk

# Using npm
npm install @decentralized-geo/astral-sdk

# Using yarn
yarn add @decentralized-geo/astral-sdk
```

## Quick Start

### Installation
```bash
pnpm add @decentralized-geo/astral-sdk  # or npm/yarn
```

### 30-Second Example: Offchain Attestation (No Gas Required)
```typescript
import { AstralSDK } from '@decentralized-geo/astral-sdk';

// Connect to your wallet
const sdk = new AstralSDK({ 
  provider: window.ethereum,
  chainId: 11155111 // Sepolia
});

// Create a location attestation with GeoJSON Point
const attestation = await sdk.createOffchainLocationAttestation({
  location: {
    type: 'Point',
    coordinates: [-0.163808, 51.5101] // [longitude, latitude]
  },
  memo: 'Visited Big Ben today!'
});

// Done! You have a cryptographically signed location attestation
console.log('Attestation UID:', attestation.uid);
```

### Onchain Attestation (Permanent Blockchain Record)
```typescript
// Same API, different method - registers permanently on blockchain
const onchainAttestation = await sdk.createOnchainLocationAttestation({
  location: { 
    type: 'Point', 
    coordinates: [2.3522, 48.8566] // Paris [longitude, latitude]
  },
  memo: 'Onchain proof from the Eiffel Tower'
});

console.log('Transaction:', onchainAttestation.txHash);
```

### GeoJSON Location Support
```typescript
// Supports all GeoJSON geometry types
const locations = [
  // Point
  {
    type: 'Point',
    coordinates: [-0.163808, 51.5101] // [longitude, latitude]
  },
  // Polygon
  {
    type: 'Polygon',
    coordinates: [[[-1, 50], [1, 50], [1, 52], [-1, 52], [-1, 50]]]
  },
  // Feature with properties
  {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [-0.163808, 51.5101]
    },
    properties: {
      name: 'Big Ben'
    }
  }
];

// All GeoJSON formats work the same way
for (const location of locations) {
  const attestation = await sdk.createOffchainLocationAttestation({
    location,
    memo: 'GeoJSON location proof'
  });
}
```

### Verification & Type Safety
```typescript
// Verify any attestation 
const result = await sdk.verifyOffchainLocationAttestation(attestation);
if (result.isValid) {
  console.log('Valid signature from:', result.signerAddress);
} else {
  console.log('Invalid:', result.reason);
}

// Type guards for handling mixed attestation types
import { isOffchainLocationAttestation } from '@decentralized-geo/astral-sdk';

if (isOffchainLocationAttestation(someAttestation)) {
  // TypeScript knows this is an offchain attestation
  console.log('Signed by:', someAttestation.signer);
}
```

## How It Works

Astral SDK provides **two distinct workflows** for different use cases:

### → Offchain Workflow
```
Build Attestation → Sign with EIP-712 → Optionally Publish
```
**Perfect for:** High-volume apps, private proofs, gasless operations
- Free (no gas costs)
- Instant (no blockchain wait times)
- Private until you publish
- Works without blockchain connection

### → Onchain Workflow  
```
Build Attestation → Submit Transaction → Permanent Blockchain Record
```
**Perfect for:** Smart contracts, immutable records, public verification
- Permanent blockchain storage
- Smart contract integration
- Public verification by default
- Native EAS ecosystem compatibility

> **Note:** These workflows create different attestation types with unique identifiers. An offchain attestation cannot be "moved" onchain while preserving its identity.

## Supported Networks & Formats

**→ Networks:** Sepolia (testnet) • Base • Arbitrum • Celo  
**→ Formats:** GeoJSON (all types) • [Custom extensions](https://docs.astral.global/sdk/extensions)

## Documentation

| Guide | Description |
|-------|-------------|
| [**Getting Started**](https://docs.astral.global/sdk/guides/getting-started) | Step-by-step tutorial from zero to first attestation |
| [**API Reference**](https://docs.astral.global/sdk/api) | Complete API documentation with types |
| [**Offchain Guide**](https://docs.astral.global/sdk/guides/offchain-workflow) | Deep dive into gasless attestations |
| [**Onchain Guide**](https://docs.astral.global/sdk/guides/onchain-workflow) | Blockchain integration patterns |
| [**Core Concepts**](https://docs.astral.global/sdk/core-concepts) | Key terminology and concepts |
| [**Extension System**](https://docs.astral.global/sdk/extensions) | Custom location formats and media types |

## Development

### Quick Setup
```bash
# Clone and install
git clone <repo-url>
cd astral-sdk
pnpm install

# Copy environment template
cp .env.example .env.local

# Build and test
pnpm build
pnpm test
```

### Environment Variables
```bash
# Required for onchain testing
TEST_PRIVATE_KEY=0x...     # Test wallet private key
INFURA_API_KEY=...         # Get from infura.io

# Optional
ASTRAL_API_URL=...         # Custom API endpoint
```

### Commands
```bash
pnpm build      # Build the SDK
pnpm test       # Run all tests  
pnpm lint       # Check code style
pnpm typecheck  # Verify TypeScript
pnpm dev        # Watch mode
```

**→ See [Development Guide](https://docs.astral.global/sdk/guides/development) for contributing guidelines.**

## License

Licensed under the Apache 2.0 License. See [LICENSE](LICENSE) for details.

Copyright © 2025 Sophia Systems Corporation