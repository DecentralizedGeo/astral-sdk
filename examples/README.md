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

## Current Examples

### **🚀 Essential Examples**

1. **`hello-world.ts`** - 30-second minimal example
   - Creates and signs an offchain attestation
   - Uses test private key for simplicity
   - Perfect starting point for new developers

2. **`basic-workflows.ts`** - Both workflow patterns
   - Demonstrates offchain (gasless) workflow
   - Demonstrates onchain (blockchain) workflow  
   - Includes proper error handling and environment setup

3. **`environmental-monitoring.ts`** - Real-world use case
   - Air quality sensor network across multiple cities
   - Uses structured data in mediaData (application/json)
   - Shows hybrid workflow for different purposes
   - Production-ready patterns

### **📖 Reference Example**

4. **`complete-sdk-demo.ts`** - Comprehensive demonstration
   - "Recipe book" format covering all features
   - Multiple location formats
   - Media attachments
   - Error handling patterns
   - Test suite for SDK functionality

## Running the Examples

Each example can be run independently:

```bash
# Quick start - creates and signs an attestation
npx tsx examples/hello-world.ts

# Learn both workflows
npx tsx examples/basic-workflows.ts

# See real-world patterns
npx tsx examples/environmental-monitoring.ts

# Explore all SDK features
npx tsx examples/complete-sdk-demo.ts
```

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