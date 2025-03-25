# Astral SDK

Astral's Location Proof Protocol lets users create, store, and verify geospatial proofs as attestations on multiple blockchains using Ethereum Attestation Service (EAS).

Our SDK wraps this complex workflow into a developer-friendly, type-safe library.

## Key Features

- **Dual-Workflow Architecture**:
  - **Offchain Workflow**: Create proofs with EIP-712 signatures without blockchain transactions
  - **Onchain Workflow**: Register proofs directly to any of our supported blockchains
  
- **Location Format Support**:
  - GeoJSON (Point, Polygon, LineString, Feature, FeatureCollection)
  - Decimal coordinates (latitude, longitude)
  - WKT (Well-Known Text)
  - H3 (Hexagonal hierarchical geospatial indexing)
  
- **Multi-Chain Support**:
  - Sepolia (testnet)
  - Base
  - Arbitrum
  - Celo
  
- **Developer Experience**:
  - Type-safe API with clear workflow separation
  - Comprehensive documentation and examples
  - Built with TypeScript

## Installation

```bash
# Using pnpm (recommended)
pnpm add @astral-protocol/sdk

# Using npm
npm install @astral-protocol/sdk

# Using yarn
yarn add @astral-protocol/sdk
```

## Quick Start

### Offchain Workflow Example
```typescript
// Create and sign an offchain location proof
const astral = new AstralSDK({
  provider: window.ethereum,
  chainId: 11155111 // Sepolia
});

// Create an unsigned proof
const unsignedProof = await astral.buildLocationProof({
  location: {
      "type": "Feature",
      "properties": {},
      "geometry": {
        "coordinates": [
          -0.163808,
          51.5101
        ],
        "type": "Point"
      }
    },
  locationType: 'geojson-point',
  memo: 'Testing offchain workflow'
});

// Sign the proof to create an offchain location proof
const offchainProof = await astral.signOffchainLocationProof(unsignedProof);

// Optionally publish the proof to IPFS (soon)
const publishedProof = await astral.publishOffchainLocationProof(offchainProof);
```

### Onchain Workflow Example
```typescript
// Create and register an onchain location proof
const astral = new AstralSDK({
  provider: window.ethereum,
  chainId: 11155111 // Sepolia
});

// Create an unsigned proof
const unsignedProof = await astral.buildLocationProof({
  location:  [12.34, 56.78],
  locationType: 'coordinates-decimal+lon-lat',
  memo: 'Testing onchain workflow'
});

// Register the proof on-chain
const onchainProof = await astral.registerOnchainLocationProof(unsignedProof);
```

### Verify a Location Proof

```typescript
// Verify an offchain proof
const isValidOffchain = await astral.verifyOffchainLocationProof(offchainProof);

// Verify an onchain proof
const isValidOnchain = await astral.verifyOnchainLocationProof(onchainProof);

// The SDK also provides type guards to determine proof type
import { isOffchainLocationProof, isOnchainLocationProof } from '@astral-protocol/sdk';

function verifyAnyProof(proof) {
  if (isOffchainLocationProof(proof)) {
    return astral.verifyOffchainLocationProof(proof);
  } else if (isOnchainLocationProof(proof)) {
    return astral.verifyOnchainLocationProof(proof);
  } else {
    throw new Error('Unknown proof type');
  }
}
```

### Query Location Proofs

```typescript
// Query all proofs for a specific address
const proofs = await astral.queryLocationProofs({
  attester: '0x1234...',  // For onchain proofs
  signer: '0x1234...',    // For offchain proofs
  // Other filter options available
});

// Access results
console.log(`Found ${proofs.total} proofs`);
proofs.proofs.forEach(proof => {
  console.log(`Proof ${proof.uid}: ${proof.location}`);
});
```

## Architecture

Astral SDK has a dual-workflow architecture that separates offchain and onchain attestation paths:

- **Offchain Workflow**: Build → Sign → Optionally Publish
- **Onchain Workflow**: Build → Register directly on blockchain

This separation exists because EAS's offchain and onchain attestations have different UIDs and cannot be directly converted while maintaining identity.

## Why Two Workflows?

- **Offchain**: 
  - No gas costs (free)
  - Faster (no waiting for transactions)
  - Completely private until you choose to publish
  - Great for high-volume applications

- **Onchain**:
  - Immediate blockchain verification
  - Integrated with smart contracts
  - Native to EAS ecosystem
  - Ideal for applications requiring immutable on-chain proof

### Supported Location Formats

- GeoJSON (point, polygon, linestring)
- Decimal coordinates (latitude, longitude)
- WKT (Well-Known Text)
- H3 (Hexagonal hierarchical geospatial indexing)

### Supported Chains

- Sepolia (testnet)
- Base
- Arbitrum
- Celo

## Documentation

For complete documentation, see:

- [Getting Started](docs/getting-started.md)
- [API Reference](docs/api-reference.md)
- [Workflows](docs/workflows/README.md)
- [Guides](docs/guides/README.md)
- [Examples](examples/README.md)

## Development

```bash
# Install dependencies
pnpm install

# Build the SDK
pnpm build

# Run tests
pnpm test

# Lint code
pnpm lint
```

## License

MIT