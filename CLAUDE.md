# Astral SDK Development Guide

## Commands
- Setup: `pnpm install`
- Build: `pnpm run build`
- Lint: `pnpm run lint`
- Typecheck: `pnpm run typecheck`
- Test all: `pnpm run test`
- Test single: `pnpm test -- -t "test name"`
- Development mode: `pnpm run dev`

## Development Workflow Requirements
For each task:
1. **Review**: Understand requirements and check existing code
2. **Plan**: Reflect on the implementation plan and make sure you have a clear sense of how you'll execute it. Add necessary context to the relevant .ai/implementation-plan/*.md file if needed
3. **Build**: Implement the changes following our architecture guidelines. Be extremely thorough and detailed. Comment well, etc — you're a world class developer, remember.
4. **Lint**: Run `pnpm run lint` to ensure code style compliance. Modify as necessary until the linting checks pass.
5. **Typecheck**: Run `pnpm run typecheck` to verify type safety. Modify as necessary until the typechecking checks pass.
6. **Test**: Write tests and run `pnpm run test` to verify implementation. Modify as necessary until the tests pass. 
7. **Report**: Summarize changes, challenges, and decisions made
8. **Commit**: Create a descriptive commit with meaningful message

## Project Structure
```
astral-sdk/
├── src/
│   ├── core/                 # Core SDK functionality
│   │   ├── types.ts          # Main type definitions
│   │   ├── errors.ts         # Error hierarchy
│   │   └── AstralSDK.ts      # Main SDK entry point
│   ├── eas/                  # EAS integration
│   │   ├── chains.ts         # Chain configurations
│   │   ├── SchemaEncoder.ts  # EAS schema handling
│   │   ├── OffchainSigner.ts # Handles offchain attestations
│   │   └── OnchainRegistrar.ts # Handles onchain registrations
│   ├── extensions/           # Extension system
│   │   ├── location/         # Location format handlers
│   │   │   ├── GeoJSON.ts    # GeoJSON format support
│   │   │   ├── Decimal.ts    # Decimal coordinates support
│   │   │   ├── WKT.ts        # Well-Known Text support
│   │   │   └── H3.ts         # H3 geospatial index support
│   │   ├── media/            # Media type handlers
│   │   |   ├── Image.ts      # Image handling (JPEG, PNG)
│   │   |   └── Document.ts   # Document handling (PDF)
│   │   └── recipe/           # Other extension types
│   │       └── <PLACEHOLDER> # Recipe handling (not implemented)
│   ├── api/                  # API client
│   │   └── AstralApiClient.ts # REST API communication
│   ├── storage/              # Storage adapters
│   │   └── StorageAdapter.ts # Storage interface
│   └── utils/                # Utility functions
│       ├── typeGuards.ts     # Type guard implementations
│       └── validation.ts     # Validation utilities
├── test/                     # Test files
├── examples/                 # Example usage
└── docs/                     # Documentation
```

## Workflow Diagrams

### Offchain Workflow
```
UnsignedLocationProof
       |
       v
[createOffchainLocationProof]
       |
       v
OffchainLocationProof (with signature)
       |
       v
[publishOffchainLocationProof] (optional)
       |
       v
Stored OffchainLocationProof
```

### Onchain Workflow
```
UnsignedLocationProof
       |
       v
[createOnchainLocationProof]
       |
       v
OnchainLocationProof (with txHash)
```

## Key Classes and Responsibilities

### AstralSDK (src/core/AstralSDK.ts)
- Main entry point for developers
- Exposes workflow-specific methods
- Handles configuration and initialization

### OffchainSigner (src/eas/OffchainSigner.ts)
- Creates EIP-712 signatures for offchain attestations
- Handles verification of offchain signatures
- Manages typed data for location proofs

### OnchainRegistrar (src/eas/OnchainRegistrar.ts)
- Sends transactions to register onchain attestations
- Handles chain-specific configurations
- Manages gas estimations and transaction tracking

### AstralApiClient (src/api/AstralApiClient.ts)
- Communicates with Astral's REST API
- Publishes offchain attestations
- Queries for existing attestations

## Code Style Guidelines
- Format with Prettier, configured in .prettierrc
- Use TypeScript with strict typing
- Imports: Organize in groups:
  1. Core Node modules
  2. External packages 
  3. Internal modules (absolute paths)
  4. Local imports (relative paths)
- Naming: 
  - camelCase for variables/functions
  - PascalCase for classes/interfaces/types/enums
  - Extensions should be named with suffix "Extension" (e.g., `GeoJSONExtension`)
- Error handling: 
  - Use typed errors with descriptive messages
  - Prefer async/await with try/catch blocks
  - Always return or throw, don't use callbacks for errors
- Module structure: Follow the extension system pattern for new extensions
- Document public APIs with JSDoc comments
- Keep functions small and focused on a single responsibility

## Architecture Guidelines
- Maintain clear separation between offchain and onchain workflows
- Follow the two-type approach for location proofs:
  - `UnsignedLocationProof`: Base type for all proofs before signing/registration
  - `OffchainLocationProof`: For proofs signed with EIP-712 signatures
  - `OnchainLocationProof`: For proofs registered directly on a blockchain
- Use descriptive method names that clearly indicate their workflow:
  - `signOffchainLocationProof` vs `registerOnchainLocationProof`
  - `publishOffchainLocationProof`
  - `createOffchainLocationProof` vs `createOnchainLocationProof`
- Remember that offchain and onchain attestations have different UIDs and cannot be directly converted

## Extension System
To add a new location format:
1. Create a new file in `src/extensions/location/`
2. Implement the `LocationFormatExtension` interface
3. Register the extension in `src/extensions/location/index.ts`
4. Add validation logic in `src/utils/validation.ts`

## SDK Usage Examples

### Offchain Workflow Example
```typescript
// Create and sign an offchain location proof
const sdk = new AstralSDK({
  provider: window.ethereum,
  chainId: 11155111 // Sepolia
});

// Create an unsigned proof
const unsignedProof = await sdk.buildLocationProof({
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
const offchainProof = await sdk.signOffchainLocationProof(unsignedProof);

// Optionally publish the proof to Astral's API
const publishedProof = await sdk.publishOffchainLocationProof(offchainProof);
```

### Onchain Workflow Example
```typescript
// Create and register an onchain location proof
const sdk = new AstralSDK({
  provider: window.ethereum,
  chainId: 11155111 // Sepolia
});

// Create an unsigned proof
const unsignedProof = await sdk.buildLocationProof({
  location:  [12.34, 56.78],
  locationType: 'coordinates-decimal+lon-lat',
  memo: 'Testing onchain workflow'
});

// Register the proof on-chain
const onchainProof = await sdk.registerOnchainLocationProof(unsignedProof);
```

## Search Keywords
- Workflow identification: "offchain", "onchain"
- Core types: "UnsignedLocationProof", "OffchainLocationProof", "OnchainLocationProof"
- Components: "OffchainSigner", "OnchainRegistrar", "AstralApiClient"
- Extension system: "Extension", "LocationFormatExtension", "MediaTypeExtension"
- Type guards: "isOffchainLocationProof", "isOnchainLocationProof"

## Common Development Tasks

### Testing the Offchain Workflow
```bash
# Run all offchain tests
pnpm test -- -t "offchain"

# Test signature verification
pnpm test -- -t "offchain verification"
```

### Testing the Onchain Workflow
```bash
# Run all onchain tests
pnpm test -- -t "onchain"

# Test registration process
pnpm test -- -t "onchain registration"
```

### Debugging Tips
- Check wallet connection status first for transaction errors
- Verify chain configuration matches EAS-config.json
- For offchain signature issues, confirm typedData structure
- For API connection issues, check API client configuration
- Use SDK's debug mode: `new AstralSDK({ debug: true })`

## Configuration Reference

### Environment Variables
- `ASTRAL_API_URL`: URL for Astral's REST API
- `INFURA_API_KEY`: API key for Infura (optional)
- `IPFS_GATEWAY`: Custom IPFS gateway URL (optional)
- `TEST_PRIVATE_KEY`: Private key for testing transactions

### Chain-Specific Considerations
- Sepolia: Primary development testnet
- Base: Uses a different EAS contract address
- Arbitrum: May require higher gas limit
- Celo: Uses different transaction format (does it?)