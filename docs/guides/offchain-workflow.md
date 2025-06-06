---
title: Offchain Workflow
sidebar_position: 2  
description: Deep dive into gasless EIP-712 signatures for location attestations
---

# Offchain Workflow Guide

Offchain attestations use EIP-712 signatures to create cryptographically verifiable location proofs without blockchain transactions. They're perfect for high-volume applications, private attestations, and real-time features.

## Overview

**What it is:** Location attestations signed with your wallet's private key using the EIP-712 standard  
**Gas cost:** Free (no blockchain transactions)  
**Speed:** Instant creation and verification  
**Privacy:** Completely private until you choose to publish  
**Use cases:** Social apps, gaming, analytics, high-frequency location tracking

※ **Data Persistence**: Offchain attestations exist only where you store them. If you delete the file or database record, they disappear. Consider backing up important attestations.

## Core Workflow

```
1. Build Attestation → 2. Sign with EIP-712 → 3. Optionally Publish
```

Each step is separate, giving you control over when and how attestations are created and shared.

## Quick Start

### Basic Offchain Attestation

```typescript
import { AstralSDK } from '@decentralized-geo/astral-sdk';
import { ethers } from 'ethers';

// Setup with wallet connection
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

const sdk = new AstralSDK({
  signer,
  defaultChain: 'sepolia'
});

// Create attestation (builds + signs in one step)
const attestation = await sdk.createOffchainLocationAttestation({
  location: { type: 'Point', coordinates: [-0.1276, 51.5074] }, // London coordinates
  memo: 'Geocache location verification'
});

console.log('Attestation created:', attestation.uid);
console.log('Signed by:', attestation.signer);
```

## Step-by-Step Breakdown

### Step 1: Build Unsigned Attestation

```typescript
// Create the attestation structure without signing
const unsignedAttestation = await sdk.buildLocationAttestation({
  location: {
    type: 'Point',
    coordinates: [55.2708, 25.2048] // Dubai
  },
  memo: 'Infrastructure monitoring point',
  timestamp: new Date(),
  
  // Optional: attach media
  media: [
    {
      mediaType: 'image/jpeg',
      data: base64ImageData
    }
  ]
});

console.log('Unsigned attestation built:');
console.log('- Location type:', unsignedAttestation.locationType);
console.log('- Event timestamp:', new Date(unsignedAttestation.eventTimestamp * 1000));
console.log('- Schema fields:', {
  mediaType: unsignedAttestation.mediaType,
  proofType: unsignedAttestation.proofType
});
```

### Step 2: Sign the Attestation

```typescript
// Sign the unsigned attestation with EIP-712
const signedAttestation = await sdk.signOffchainLocationAttestation(unsignedAttestation);

console.log('Signed attestation:');
console.log('- UID:', signedAttestation.uid);
console.log('- Signer:', signedAttestation.signer);
console.log('- Version:', signedAttestation.version);
console.log('- Signature:', signedAttestation.signature);
```

### Step 3: Verify the Signature

```typescript
// Verify the attestation signature
const verification = await sdk.verifyOffchainLocationAttestation(signedAttestation);

if (verification.isValid) {
  console.log('✅ Valid signature');
  console.log('Verified signer:', verification.signerAddress);
} else {
  console.log('❌ Invalid signature');
  console.log('Reason:', verification.reason);
}
```

## EIP-712 Signature Details

Offchain attestations use the EIP-712 standard for structured data signing. This is the same standard used by popular protocols like Uniswap and OpenSea.

### Typed Data Structure

```typescript
// The EIP-712 typed data structure used internally
const typedData = {
  types: {
    Attest: [
      { name: 'version', type: 'uint16' },
      { name: 'schema', type: 'bytes32' },
      { name: 'recipient', type: 'address' },
      { name: 'time', type: 'uint64' },
      { name: 'expirationTime', type: 'uint64' },
      { name: 'revocable', type: 'bool' },
      { name: 'refUID', type: 'bytes32' },
      { name: 'data', type: 'bytes' }
    ]
  },
  domain: {
    name: 'EAS Attestation',
    version: '1.3.0',
    chainId: 11155111, // Sepolia
    verifyingContract: '0x...' // EAS contract address
  },
  message: {
    // Attestation data
  }
};
```

### Signature Format

```typescript
// Signatures are stored as JSON with r, s, v components
const signatureObject = {
  r: '0x...',
  s: '0x...',
  v: 28
};

// This gets serialized to the signature field
attestation.signature = JSON.stringify(signatureObject);
```

## Advanced Patterns

### Batch Creation

```typescript
// Create multiple attestations efficiently
const locations = [
  { coords: { type: 'Point', coordinates: [-0.1276, 51.5074] }, name: 'London' },
  { coords: { type: 'Point', coordinates: [139.6917, 35.6895] }, name: 'Tokyo' },
  { coords: { type: 'Point', coordinates: [-105.0178, 39.7392] }, name: 'Denver' }
];

const attestations = await Promise.all(
  locations.map(loc => 
    sdk.createOffchainLocationAttestation({
      location: loc.coords,
      memo: `Spatial record at ${loc.name}`
    })
  )
);

console.log(`Created ${attestations.length} attestations`);
```

### Custom Metadata

```typescript
// Add custom data to attestations
const customAttestation = await sdk.createOffchainLocationAttestation({
  location: { type: 'Point', coordinates: [77.2090, 28.6139] }, // New Delhi
  memo: JSON.stringify({
    sensor_type: 'air_quality',
    pm25: 45.2,
    temperature: 28.5,
    station_id: 'DEL_AQ_001'
  }),
  timestamp: new Date()
});
```

### Media Attachments

```typescript
// Multiple media types supported
const mediaAttestation = await sdk.createOffchainLocationAttestation({
  location: { type: 'Point', coordinates: [12.4964, 41.9028] }, // Rome
  memo: 'Archaeological site documentation',
  media: [
    {
      mediaType: 'image/jpeg',
      data: photoBase64
    },
    {
      mediaType: 'audio/mp3', 
      data: audioRecordingBase64
    },
    {
      mediaType: 'application/pdf',
      data: ticketPdfBase64
    }
  ]
});

console.log('Media types attached:', mediaAttestation.mediaType);
```

## Verification Patterns

### Basic Verification

```typescript
const result = await sdk.verifyOffchainLocationAttestation(attestation);

// Result structure
interface VerificationResult {
  isValid: boolean;
  signerAddress?: string;
  reason?: string;
  attestation?: OffchainLocationAttestation;
}
```

### Batch Verification

```typescript
// Verify multiple attestations
async function verifyBatch(attestations: OffchainLocationAttestation[]) {
  const results = await Promise.all(
    attestations.map(attestation => 
      sdk.verifyOffchainLocationAttestation(attestation)
    )
  );
  
  const valid = results.filter(r => r.isValid);
  const invalid = results.filter(r => !r.isValid);
  
  console.log(`${valid.length} valid, ${invalid.length} invalid`);
  
  return { valid, invalid };
}
```

### Signer Verification

```typescript
// Verify attestation came from specific address
function verifyFromAddress(attestation: OffchainLocationAttestation, expectedSigner: string): boolean {
  return attestation.signer.toLowerCase() === expectedSigner.toLowerCase();
}

// More robust verification with signature check
async function verifyFromAddressWithSignature(
  attestation: OffchainLocationAttestation, 
  expectedSigner: string
): Promise<boolean> {
  const verification = await sdk.verifyOffchainLocationAttestation(attestation);
  
  return verification.isValid && 
         verification.signerAddress?.toLowerCase() === expectedSigner.toLowerCase();
}
```

## Publishing Attestations

Offchain attestations are private by default. Publishing capabilities are coming soon.

### Future: Publishing Options

```typescript
// Coming soon: Publish to make attestations discoverable
// const publishedAttestation = await sdk.publishOffchainLocationAttestation(attestation);
```

**Planned publishing targets:**
- Astral's discovery API  
- IPFS distributed storage
- Custom storage adapters

> **Note**: Publishing methods exist in the codebase as placeholders but are not yet functional. The `publishOffchainLocationAttestation` method currently returns the attestation unchanged.

## Error Handling

### Common Errors

```typescript
import { 
  SignerError, 
  ValidationError, 
  VerificationError 
} from '@decentralized-geo/astral-sdk';

try {
  const attestation = await sdk.createOffchainLocationAttestation({
    location: invalidLocation,
    memo: 'This will fail'
  });
} catch (error) {
  if (error instanceof SignerError) {
    console.log('❌ Wallet signing failed:', error.message);
    // User rejected signature, wallet not connected, etc.
    
  } else if (error instanceof ValidationError) {
    console.log('❌ Invalid input data:', error.message);
    // Bad location format, missing required fields, etc.
    
  } else if (error instanceof VerificationError) {
    console.log('❌ Signature verification failed:', error.message);
    // Invalid signature, wrong chain, etc.
  }
}
```

### Retry Patterns

```typescript
// Retry failed signatures (user might have rejected initially)
async function createWithRetry(input: LocationAttestationInput, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await sdk.createOffchainLocationAttestation(input);
    } catch (error) {
      if (error instanceof SignerError && i < maxRetries - 1) {
        console.log(`Signature failed, retry ${i + 1}/${maxRetries}`);
        continue;
      }
      throw error;
    }
  }
}
```

## Performance Optimization

### Extension Preloading

```typescript
// Ensure extensions are loaded before high-frequency operations
await sdk.extensions.ensureInitialized();

// Now create attestations without loading delays
const attestations = await Promise.all(
  locations.map(loc => sdk.createOffchainLocationAttestation(loc))
);
```

### Signature Caching

```typescript
// Cache signer for repeated operations
class SignerCache {
  private cachedSigner?: ethers.Signer;
  
  async getSigner(): Promise<ethers.Signer> {
    if (!this.cachedSigner) {
      const provider = new ethers.BrowserProvider(window.ethereum);
      this.cachedSigner = await provider.getSigner();
    }
    return this.cachedSigner;
  }
}

const signerCache = new SignerCache();
const sdk = new AstralSDK({
  signer: await signerCache.getSigner()
});
```

## Security Considerations

### Private Key Management

```typescript
// ❌ Never hardcode private keys
const badSDK = new AstralSDK({
  signer: new ethers.Wallet('0x1234567890abcdef...')
});

// ✅ Use environment variables for server-side
const serverSDK = new AstralSDK({
  signer: new ethers.Wallet(process.env.PRIVATE_KEY!)
});

// ✅ Use wallet connection for client-side
const clientSDK = new AstralSDK({
  signer: await provider.getSigner()
});
```

### Signature Validation

```typescript
// Always verify signatures when accepting attestations from others
async function acceptAttestation(attestation: OffchainLocationAttestation) {
  const verification = await sdk.verifyOffchainLocationAttestation(attestation);
  
  if (!verification.isValid) {
    throw new Error(`Invalid attestation: ${verification.reason}`);
  }
  
  // Additional business logic validation
  if (!isExpectedSigner(verification.signerAddress)) {
    throw new Error('Attestation from unexpected signer');
  }
  
  return verification.attestation;
}
```

### Data Privacy

```typescript
// Sensitive data should be hashed or encrypted in memo field
import { createHash } from 'crypto';

const sensitiveData = 'user-private-info';
const hashedMemo = createHash('sha256').update(sensitiveData).digest('hex');

const attestation = await sdk.createOffchainLocationAttestation({
  location: coords,
  memo: hashedMemo // Store hash instead of raw data
});
```

## Integration Examples

### React Hook

```typescript
import { useState, useCallback } from 'react';
import { AstralSDK, LocationAttestationInput } from '@astral-protocol/sdk';

export function useOffchainAttestation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const createAttestation = useCallback(async (
    sdk: AstralSDK, 
    input: LocationAttestationInput
  ) => {
    setLoading(true);
    setError(null);
    
    try {
      const attestation = await sdk.createOffchainLocationAttestation(input);
      return attestation;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);
  
  return { createAttestation, loading, error };
}
```

### Express.js API

```typescript
import express from 'express';
import { AstralSDK } from '@astral-protocol/sdk';

const app = express();
const sdk = new AstralSDK({
  signer: new ethers.Wallet(process.env.PRIVATE_KEY!)
});

app.post('/api/attestations', async (req, res) => {
  try {
    const { location, memo } = req.body;
    
    const attestation = await sdk.createOffchainLocationAttestation({
      location,
      memo,
      timestamp: new Date()
    });
    
    res.json({ 
      success: true, 
      uid: attestation.uid,
      signer: attestation.signer 
    });
  } catch (error) {
    res.status(400).json({ 
      success: false, 
      error: error.message 
    });
  }
});
```

## Best Practices

1. **Always verify signatures** when accepting attestations from external sources
2. **Preload extensions** before high-frequency operations  
3. **Cache signers** to avoid repeated wallet connections
4. **Use environment variables** for private keys in server environments
5. **Hash sensitive data** in memo fields rather than storing plaintext
6. **Implement retry logic** for user-rejected signatures
7. **Validate location data** before creating attestations
8. **Consider batch operations** for multiple attestations

## Comparison with Onchain

| Feature | Offchain | Onchain |
|---------|----------|---------|
| **Cost** | Free | Gas fees required |
| **Speed** | Instant | Blockchain confirmation time |
| **Privacy** | Private by default | Public by default |
| **Smart Contract Integration** | Limited | Native |
| **Permanence** | Depends on storage | Immutable |
| **Discoverability** | Opt-in publishing | Always discoverable |
| **Use Cases** | High-volume, analytics, privacy | DeFi, public records, smart contracts |

## Next Steps

- **[Onchain Workflow Guide](onchain-workflow.md)** - Learn about permanent blockchain attestations
- **[Extension System](/sdk/extensions)** - Custom location formats and media types