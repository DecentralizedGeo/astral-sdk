---
title: Developer Experience
sidebar_position: 4
description: Development workflow, testing, and best practices for Astral SDK
---

# Developer Experience Guide

Essential information for developing with and contributing to the Astral SDK.

## Development Setup

### Prerequisites

• Node.js 18+ and pnpm<br/>
• A Web3 wallet (MetaMask or similar)<br/>
• Access to a blockchain RPC endpoint<br/>

### Environment Configuration

Create a `.env` file in your project root:

```bash
# Required for onchain operations
ETHEREUM_RPC_URL=https://sepolia.infura.io/v3/YOUR_KEY
PRIVATE_KEY=your_test_wallet_private_key

# Required for API operations
ASTRAL_API_URL=https://api.astral.global

# Optional
DEBUG=astral:*
```

※ **Security Note**: Never commit `.env` files or expose private keys in code.

## Module Workflow

### Creating a New Extension

1. **Create the extension file**:

```typescript
// src/extensions/location/builtins/MyFormat.ts
import { LocationFormatExtension } from '../../types';

export class MyFormatExtension implements LocationFormatExtension {
  name = 'my-format';
  
  validate(location: unknown): boolean {
    // Validation logic
  }
  
  encode(location: unknown): string {
    // Encoding logic
  }
  
  decode(encoded: string): unknown {
    // Decoding logic
  }
}
```

2. **Register the extension**:

```typescript
// src/extensions/location/index.ts
import { MyFormatExtension } from './builtins/MyFormat';

export const locationExtensions = [
  // ... existing extensions
  new MyFormatExtension()
];
```

3. **Add tests**:

```typescript
// test/extensions/location/MyFormat.test.ts
import { MyFormatExtension } from '@/extensions/location/builtins/MyFormat';

describe('MyFormatExtension', () => {
  const extension = new MyFormatExtension();
  
  it('validates correct format', () => {
    expect(extension.validate(validData)).toBe(true);
  });
});
```

## JavaScript vs TypeScript

### Why the SDK Publishes JavaScript

The published NPM package contains:
• Transpiled JavaScript (ES2020) for broad compatibility
• TypeScript declaration files (`.d.ts`) for type safety
• Source maps for debugging

### Development is TypeScript

All source code is written in TypeScript:
• Full type safety during development
• Better IDE support and autocomplete
• Compile-time error checking

### Build Process

```bash
# TypeScript source → JavaScript output
pnpm run build

# Output structure:
dist/
├── index.js        # Transpiled JavaScript
├── index.d.ts      # Type declarations
└── index.js.map    # Source maps
```

## Testing Patterns

### Unit Test Setup

```typescript
import { vi } from 'vitest';
import { AstralSDK } from '@/core/AstralSDK';

// Mock provider
const mockProvider = {
  request: vi.fn(),
  getSigner: vi.fn()
};

// Test instance
const sdk = new AstralSDK({ 
  provider: mockProvider 
});
```

### Integration Test Pattern

```typescript
describe('Offchain Workflow', () => {
  let sdk: AstralSDK;
  
  beforeEach(async () => {
    // Use test wallet
    const provider = new ethers.JsonRpcProvider(process.env.TEST_RPC);
    const signer = new ethers.Wallet(process.env.TEST_PRIVATE_KEY, provider);
    
    sdk = new AstralSDK({ signer });
  });
  
  it('creates and verifies attestation', async () => {
    const attestation = await sdk.createOffchainLocationAttestation({
      location: { type: 'Point', coordinates: [0, 0] }
    });
    
    const result = await sdk.verifyOffchainLocationAttestation(attestation);
    expect(result.isValid).toBe(true);
  });
});
```

### Mocking Best Practices

```typescript
// Mock ethers provider
vi.mock('ethers', () => ({
  ethers: {
    JsonRpcProvider: vi.fn(() => mockProvider),
    Wallet: vi.fn(() => mockSigner)
  }
}));

// Mock network requests
vi.mock('@/api/AstralApiClient', () => ({
  AstralApiClient: vi.fn(() => ({
    publishAttestation: vi.fn().mockResolvedValue({ uid: '0x123' })
  }))
}));
```

## Common Development Tasks

### Running Tests

```bash
# All tests
pnpm test

# Specific test file
pnpm test MyFormat.test.ts

# Watch mode
pnpm test -- --watch

# Coverage
pnpm test -- --coverage
```

### Debugging

Enable debug logging:

```typescript
const sdk = new AstralSDK({
  provider,
  debug: true  // Enables console logging
});
```

Or via environment:

```bash
DEBUG=astral:* pnpm test
```

### Type Checking

```bash
# Check types
pnpm run typecheck

# Watch mode
pnpm run typecheck -- --watch
```

## Project Structure Best Practices

### File Organization

```
src/
├── core/           # Core SDK logic
├── eas/            # EAS-specific code
├── extensions/     # Extension system
├── api/            # External API clients
├── storage/        # Storage adapters
└── utils/          # Shared utilities
```

### Import Conventions

```typescript
// 1. Node built-ins
import { readFile } from 'fs/promises';

// 2. External packages
import { ethers } from 'ethers';
import { EAS } from '@ethereum-attestation-service/eas-sdk';

// 3. Internal absolute imports
import { AstralSDK } from '@/core/AstralSDK';
import { LocationFormatExtension } from '@/extensions/types';

// 4. Relative imports
import { validateLocation } from './validation';
```

### Naming Conventions

• **Files**: `PascalCase.ts` for classes, `camelCase.ts` for utilities
• **Extensions**: Suffix with `Extension` (e.g., `GeoJSONExtension`)
• **Tests**: Mirror source structure with `.test.ts` suffix
• **Types**: Export from dedicated `types.ts` files

## Performance Considerations

### Batch Operations

```typescript
// Good: Batch attestations
const attestations = await Promise.all(
  locations.map(location => 
    sdk.createOffchainLocationAttestation({ location })
  )
);

// Avoid: Sequential operations
for (const location of locations) {
  await sdk.createOffchainLocationAttestation({ location });
}
```

### Caching Patterns

```typescript
// Cache provider instances
const providerCache = new Map<string, ethers.Provider>();

function getProvider(rpcUrl: string) {
  if (!providerCache.has(rpcUrl)) {
    providerCache.set(rpcUrl, new ethers.JsonRpcProvider(rpcUrl));
  }
  return providerCache.get(rpcUrl)!;
}
```

## Troubleshooting

### Common Issues

**TypeScript errors after install**
```bash
# Regenerate types
pnpm run build
```

**Test failures with providers**
```bash
# Ensure test environment
cp .env.example .env.test
# Add your test RPC and private key
```

**Module resolution errors**
```bash
# Clear cache and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

### Debug Commands

```bash
# Verbose logging
DEBUG=* pnpm test

# Check build output
pnpm run build && ls -la dist/

# Verify types
pnpm run typecheck -- --listFiles
```

## Contributing Guidelines

### Before Submitting PR

1. **Run all checks**:
```bash
pnpm run lint
pnpm run typecheck
pnpm test
```

2. **Update documentation** if adding features

3. **Follow commit conventions**:
```
feat: add new location format
fix: correct validation logic
docs: update API examples
test: add integration tests
```

### Code Review Checklist

□ Tests pass and cover new code
□ Types are properly defined
□ Documentation is updated
□ No hardcoded values
□ Follows project conventions

## Next Steps

• **[API Reference](/sdk/api)** - Complete method documentation
• **[Extension System](/sdk/extensions)** - Build custom extensions
• **[Examples](/sdk/examples)** - Real-world usage patterns