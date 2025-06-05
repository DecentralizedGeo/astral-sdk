# Astral SDK Examples

This directory contains examples demonstrating how to use the Astral SDK for creating location attestations.

## Quick Start

1. **Build the SDK:**
   ```bash
   pnpm run build
   ```

2. **Run any example:**
   ```bash
   npx tsx examples/hello-world.ts
   ```

3. **For onchain examples, setup environment:**
   ```bash
   cp .env.example .env.local
   # Add your TEST_PRIVATE_KEY and INFURA_API_KEY
   ```

## Current Examples (v0.1.0)

### **🚀 Essential Examples**

- **`hello-world.ts`** - 30-second minimal working example (no setup required)
- **`basic-workflows.ts`** - Both offchain and onchain patterns with error handling
- **`environmental-monitoring.ts`** - Real-world sensor network use case with hybrid workflow

### **🧪 Development Examples**

- `complete-sdk-demo.ts` - Comprehensive SDK functionality demonstration
- `create-location-attestation.ts` - Basic attestation creation patterns
- `offchain-signer-test.ts` - Offchain workflow testing
- `onchain-workflow-example.ts` - Onchain workflow patterns
- `sdk-integration-example.ts` - Integration patterns and best practices

### **📋 Legacy Examples**

The following examples are maintained for compatibility but may use older patterns:
- `minimal-demo.js` - JavaScript minimal example
- `reference-demo.js` - Reference implementation patterns
- `working-attestation-demo.js` - Working attestation demonstration
- `extension-usage.ts` - Extension system usage

## Example Categories

### **🔐 Offchain Examples**
Perfect for high-volume applications, private data, or gasless operations:
- `hello-world.ts` - Unsigned attestation creation
- `basic-workflows.ts` - Complete offchain workflow with signing
- `offchain-signer-test.ts` - Advanced offchain patterns

### **⛓️ Onchain Examples** 
Great for permanent records, smart contract integration, or public verification:
- `basic-workflows.ts` - Complete onchain workflow
- `onchain-workflow-example.ts` - Advanced onchain patterns
- `environmental-monitoring.ts` - Regulatory compliance use case

### **🌍 Real-World Use Cases**
Production-ready patterns for specific industries:
- `environmental-monitoring.ts` - Air quality sensor network with compliance reporting

## Environment Setup

For onchain examples, create `.env.local`:

```bash
# Required for onchain examples
TEST_PRIVATE_KEY=0x...     # Test wallet private key (get sepolia ETH from faucet)
INFURA_API_KEY=...         # Get from infura.io

# Optional
ASTRAL_API_URL=...         # Custom API endpoint
```

## Key Concepts Demonstrated

- **Location Formats**: GeoJSON Points, Features, and Polygons
- **Workflows**: Offchain (gasless) vs Onchain (permanent) patterns
- **Error Handling**: Comprehensive error patterns and recovery
- **Global Coordinates**: Examples from cities worldwide
- **Professional Use Cases**: Environmental monitoring, infrastructure, compliance
- **Structured Data**: JSON metadata in memo fields for complex data

## Future Examples

See **[ROADMAP.md](./ROADMAP.md)** for planned expansion including:
- Frontend integration (React + Mapbox)
- Backend services (Node.js APIs)  
- Database integration (PostGIS)
- Advanced use cases (supply chain, field research, infrastructure)
- Architecture patterns (microservices, event-driven)

## Contributing Examples

When adding new examples:
1. Follow the established patterns and naming conventions
2. Include comprehensive error handling
3. Use diverse global coordinates
4. Add clear documentation and comments
5. Test with actual SDK installation
6. Update this README