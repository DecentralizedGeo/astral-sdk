# Astral SDK

**Create, store, and verify location attestations on any blockchain.**

Astral SDK is a developer-friendly TypeScript library that makes location-based attestations simple. Built on Ethereum Attestation Service (EAS), it supports both gasless offchain signatures and permanent onchain registration across multiple networks.

🔥 **Get started in 30 seconds** → [Quick Start](#quick-start)  
📖 **Complete guide** → [Getting Started](docs/getting-started.md)  
🔍 **API docs** → [API Reference](docs/api-reference.md)

## Why Astral SDK?

**🚀 Two ways to create location attestations:**
- **Offchain**: Gasless EIP-712 signatures, instant verification
- **Onchain**: Permanent blockchain registration with smart contract integration

**📍 Universal location support:**
- GeoJSON (Points, Polygons, Features) 
- Decimal coordinates `[lng, lat]`
- Well-Known Text (WKT)
- H3 geospatial indexing

**⛓️ Multi-chain ready:**
- Sepolia (testnet) • Base • Arbitrum • Celo

**💫 Developer experience:**
- 100% TypeScript with full type safety
- Clear workflow separation (no confusion)
- Comprehensive docs and working examples

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

### Installation
```bash
pnpm add @astral-protocol/sdk  # or npm/yarn
```

### 30-Second Example: Offchain Attestation (No Gas Required)
```typescript
import { AstralSDK } from '@astral-protocol/sdk';

// Connect to your wallet
const sdk = new AstralSDK({ 
  provider: window.ethereum,
  defaultChain: 'sepolia' 
});

// Create a location attestation
const attestation = await sdk.createOffchainLocationAttestation({
  location: [-0.163808, 51.5101], // London coordinates
  memo: 'Visited Big Ben today!'
});

// ✅ Done! You have a cryptographically signed location attestation
console.log('Attestation UID:', attestation.uid);
```

### Onchain Attestation (Permanent Blockchain Record)
```typescript
// Same API, different method - registers permanently on blockchain
const onchainAttestation = await sdk.createOnchainLocationAttestation({
  location: { 
    type: 'Point', 
    coordinates: [2.3522, 48.8566] // Paris
  },
  memo: 'Onchain proof from the Eiffel Tower'
});

console.log('Transaction:', attestation.txHash);
```

### Location Format Flexibility
```typescript
// Supports multiple location formats automatically
const formats = [
  [-0.163808, 51.5101],                    // Coordinates [lng, lat]
  { type: 'Point', coordinates: [lng, lat] }, // GeoJSON
  'POINT(-0.163808 51.5101)',               // Well-Known Text
  '8c1fb46741ae9ff'                        // H3 cell ID
];

// All of these work the same way
for (const location of formats) {
  const attestation = await sdk.createOffchainLocationAttestation({
    location,
    memo: 'Different format, same result'
  });
}
```

### Verification & Type Safety
```typescript
// Verify any attestation 
const result = await sdk.verifyOffchainLocationAttestation(attestation);
if (result.isValid) {
  console.log('✅ Valid signature from:', result.signerAddress);
} else {
  console.log('❌ Invalid:', result.reason);
}

// Type guards for handling mixed attestation types
import { isOffchainLocationAttestation } from '@astral-protocol/sdk';

if (isOffchainLocationAttestation(someAttestation)) {
  // TypeScript knows this is an offchain attestation
  console.log('Signed by:', someAttestation.signer);
}
```

## How It Works

Astral SDK provides **two distinct workflows** for different use cases:

### 🔐 Offchain Workflow
```
Build Attestation → Sign with EIP-712 → Optionally Publish
```
**Perfect for:** High-volume apps, private proofs, gasless operations
- ✅ Free (no gas costs)
- ✅ Instant (no blockchain wait times)
- ✅ Private until you publish
- ✅ Works without blockchain connection

### ⛓️ Onchain Workflow  
```
Build Attestation → Submit Transaction → Permanent Blockchain Record
```
**Perfect for:** Smart contracts, immutable records, public verification
- ✅ Permanent blockchain storage
- ✅ Smart contract integration
- ✅ Public verification by default
- ✅ Native EAS ecosystem compatibility

> **Note:** These workflows create different attestation types with unique identifiers. An offchain attestation cannot be "moved" onchain while preserving its identity.

## Supported Networks & Formats

**🌐 Networks:** Sepolia (testnet) • Base • Arbitrum • Celo  
**📍 Formats:** GeoJSON • Coordinates • WKT • H3 • [Custom extensions](docs/extensions.md)

## 📚 Documentation

| Guide | Description |
|-------|-------------|
| [**Getting Started**](docs/getting-started.md) | Step-by-step tutorial from zero to first attestation |
| [**API Reference**](docs/api-reference.md) | Complete API documentation with types |
| [**Offchain Guide**](docs/offchain-workflow.md) | Deep dive into gasless attestations |
| [**Onchain Guide**](docs/onchain-workflow.md) | Blockchain integration patterns |
| [**Examples Cookbook**](docs/examples.md) | Real-world usage patterns |
| [**Extension System**](docs/extensions.md) | Custom location formats and media types |

## 🔧 Development

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

**📖 See [Development Guide](docs/development.md) for contributing guidelines.**

## License

Licensed under the Apache 2.0 License. See [LICENSE](LICENSE) for details.

Copyright © 2025 Sophia Systems Corporation