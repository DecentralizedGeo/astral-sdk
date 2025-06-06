# Astral SDK

**A spatial extension for the decentralized web.**

Astral SDK lets you create location attestations - signed records that prove "this location data came from this person at this time." Think of them like digital signatures for geographic information.

→ **Get started in 30 seconds** - [Quick Start](#quick-start)  
→ **Complete guide** - [Getting Started](https://docs.astral.global/sdk/guides/getting-started)  
→ **API docs** - [API Reference](https://docs.astral.global/sdk/api)

## What you can build

**Location-based apps** - Verify user locations without trusting a central server

**Supply chain tracking** - Create tamper-proof records of where goods have been

**Compliance reporting** - Prove where operations took place for regulations or audits

**Digital identity** - Add verifiable location history to user profiles

**IoT and sensors** - Sign location data from devices so others can trust it

## How it works

Instead of just storing coordinates in a database, you create **signed records** that include:
- The location data (coordinates, boundaries, etc.)
- Who created it
- When it was created
- A cryptographic signature proving it hasn't been tampered with

These records can be held privately, stored on a server, or stored on a blockchain or IPFS. Anyone can verify these records without asking you or trusting a third party. Astral brings location data to the decentralized web.

## Installation

```bash
npm install @decentralized-geo/astral-sdk
```

## Quick Start

### Create a signed location record (no blockchain required)

```typescript
import { AstralSDK } from '@decentralized-geo/astral-sdk';

// Connect to your wallet
const sdk = new AstralSDK({ 
  provider: window.ethereum,
  chainId: 11155111 // Sepolia testnet
});

// Create a signed location record
const attestation = await sdk.createOffchainLocationAttestation({
  location: {
    type: 'Point',
    coordinates: [-122.4194, 37.7749] // San Francisco
  },
  memo: 'Checked in at conference'
});

// You now have a signed record that proves you created this location data
console.log('Record ID:', attestation.uid);
console.log('Your signature:', attestation.signature);
```

### Verify someone else's location record

```typescript
// Verify any location record
const result = await sdk.verifyOffchainLocationAttestation(attestation);

if (result.isValid) {
  console.log('✓ Valid - signed by:', result.signerAddress);
  console.log('✓ Location data hasn\'t been tampered with');
} else {
  console.log('✗ Invalid or corrupted');
}
```

### Store records permanently on blockchain

```typescript
// Same API, but stores on blockchain forever
const onchainRecord = await sdk.createOnchainLocationAttestation({
  location: {
    type: 'Polygon',
    coordinates: [[
      [-122.4, 37.8], [-122.4, 37.7], 
      [-122.3, 37.7], [-122.3, 37.8], 
      [-122.4, 37.8]
    ]]
  },
  memo: 'Service area boundary'
});

console.log('Blockchain transaction:', onchainRecord.txHash);
```

## Two ways to create records

**Offchain (recommended for most use cases)**
- No blockchain fees
- Instant creation
- Private until you share them
- Still cryptographically verifiable

**Onchain (for permanent public records)**
- Stored on blockchain forever
- Public by default
- Costs gas fees
- Integrates with smart contracts

## Supported location formats

Currently supports **GeoJSON** (the web standard for geographic data):

```typescript
// All of these work:

// Points (coordinates)
{ type: 'Point', coordinates: [-122.4194, 37.7749] }

// Areas (polygons)
{ 
  type: 'Polygon', 
  coordinates: [[[-122.4, 37.8], [-122.4, 37.7], [-122.3, 37.7], [-122.4, 37.8]]]
}

// Places with metadata
{
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [-122.4194, 37.7749] },
  properties: { name: 'Moscone Center', event: 'Conference 2024' }
}
```

*Coming soon: Simple coordinate arrays, Well-Known Text (WKT), and H3 cells*

## Supported networks

Works on Ethereum testnets and Layer 2 networks:
- **Sepolia** (testnet - free for development)
- **Base** (Coinbase's L2)
- **Arbitrum** (Ethereum L2)
- **Celo** (mobile-first blockchain)

## Documentation

| Guide | Description |
|-------|-------------|
| [**Getting Started**](https://docs.astral.global/sdk/guides/getting-started) | Complete tutorial from setup to first record |
| [**API Reference**](https://docs.astral.global/sdk/api) | All methods and options |
| [**Offchain Guide**](https://docs.astral.global/sdk/guides/offchain-workflow) | Creating signed records without blockchain |
| [**Onchain Guide**](https://docs.astral.global/sdk/guides/onchain-workflow) | Storing records on blockchain |
| [**Core Concepts**](https://docs.astral.global/sdk/core-concepts) | How location attestations work |

## Development

```bash
# Clone and install
git clone https://github.com/DecentralizedGeo/astral-sdk
cd astral-sdk
npm install

# Run tests
npm test

# Build
npm run build
```

**→ See [Development Guide](https://docs.astral.global/sdk/guides/development) for contributing guidelines.**

## What's the Location Protocol?

Astral SDK implements the **Location Protocol** - an open standard for creating portable, verifiable location records. 

The protocol defines:
- How to structure location data so it's interoperable
- How to sign records so others can verify them
- How to include proof that location claims are accurate

While our SDK uses Ethereum Attestation Service (EAS), the protocol itself works with any signing system. Records created with different tools can still verify each other.

## License

Licensed under the Apache 2.0 License. See [LICENSE](LICENSE) for details.

Copyright © 2025 Sophia Systems Corporation