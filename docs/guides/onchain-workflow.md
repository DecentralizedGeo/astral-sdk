---
title: Onchain Workflow
sidebar_position: 3
description: Complete guide to permanent blockchain registration with smart contract integration
---

# Onchain Workflow Guide

Onchain attestations are permanently stored on the blockchain as EAS (Ethereum Attestation Service) records. They're perfect for smart contract integration, public verification, and immutable location proofs.

## Overview

**What it is:** Location attestations registered as blockchain transactions using EAS contracts  
**Gas cost:** Network-dependent (usually $0.01-0.10 on L2s, more on mainnet)  
**Speed:** Block confirmation time (seconds to minutes)  
**Privacy:** Public by default (anyone can query)  
**Use cases:** DeFi protocols, public records, smart contract integration, immutable proofs

※ **Privacy Warning**: These transactions publish location data to a public blockchain. Make sure users understand and consent before signing.

## Core Workflow

```
1. Build Attestation → 2. Submit Transaction → 3. Permanent Blockchain Record
```

Unlike offchain attestations, onchain attestations are registered in a single step that creates a permanent blockchain record.

## Quick Start

### Basic Onchain Attestation

```typescript
import { AstralSDK } from '@decentralized-geo/astral-sdk';
import { ethers } from 'ethers';

// Setup with provider and funded wallet
const provider = new ethers.JsonRpcProvider('https://sepolia.infura.io/v3/YOUR_KEY');
const signer = new ethers.Wallet('YOUR_PRIVATE_KEY', provider);

const sdk = new AstralSDK({
  provider,
  signer,
  defaultChain: 'sepolia'
});

// Create onchain attestation (builds + registers in one transaction)
const attestation = await sdk.createOnchainLocationAttestation({
  location: { type: 'Point', coordinates: [-0.1276, 51.5074] }, // London coordinates
  memo: 'Permanent monitoring station record'
});

console.log('✅ Onchain attestation created!');
console.log('UID:', attestation.uid);
console.log('Transaction:', attestation.txHash);
console.log('Block:', attestation.blockNumber);
console.log('View on Etherscan:', `https://sepolia.etherscan.io/tx/${attestation.txHash}`);
```

## Prerequisites

### Network Setup

```typescript
// Supported networks and their configurations
const networks = {
  sepolia: {
    chainId: 11155111,
    rpcUrl: 'https://sepolia.infura.io/v3/YOUR_KEY',
    easContract: '0xC2679fBD37d54388Ce493F1DB75320D236e1815e',
    faucet: 'https://sepoliafaucet.com/'
  },
  base: {
    chainId: 8453,
    rpcUrl: 'https://mainnet.base.org',
    easContract: '0x4200000000000000000000000000000000000021'
  },
  arbitrum: {
    chainId: 42161,
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    easContract: '0xbD75f629A22Dc1ceD33dDA0b68c546A1c035c458'
  },
  celo: {
    chainId: 42220,
    rpcUrl: 'https://forno.celo.org',
    easContract: '0x72E1d8ccf5299fb36fEfD8CC4394B8ef7e98Af92'
  }
};
```

### Wallet Funding

```typescript
// Check wallet balance before operations
async function checkWalletReady(provider: ethers.Provider, address: string) {
  const balance = await provider.getBalance(address);
  const balanceEth = ethers.formatEther(balance);
  
  console.log(`Wallet ${address}`);
  console.log(`Balance: ${balanceEth} ETH`);
  
  if (balance === 0n) {
    throw new Error('Wallet has no funds for gas fees');
  }
  
  return { balance: balanceEth, ready: true };
}

await checkWalletReady(provider, signer.address);
```

## Step-by-Step Process

### Step 1: Build Unsigned Attestation

```typescript
// Create the attestation structure (same as offchain)
const unsignedAttestation = await sdk.buildLocationAttestation({
  location: {
    type: 'Feature',
    properties: { name: 'Machu Picchu', type: 'archaeological_site' },
    geometry: {
      type: 'Point',
      coordinates: [-72.5450, -13.1631]
    }
  },
  memo: 'UNESCO heritage site boundary marker',
  timestamp: new Date()
});

console.log('Unsigned attestation built:');
console.log('- Location type:', unsignedAttestation.locationType);
console.log('- Schema UID:', unsignedAttestation.schema);
console.log('- Data payload size:', unsignedAttestation.data?.length || 0);
```

### Step 2: Register on Blockchain

```typescript
// Register the attestation as a blockchain transaction
const onchainAttestation = await sdk.registerOnchainLocationAttestation(unsignedAttestation);

console.log('Registration successful:');
console.log('- UID:', onchainAttestation.uid);
console.log('- Transaction hash:', onchainAttestation.txHash);
console.log('- Block number:', onchainAttestation.blockNumber);
console.log('- Gas used:', onchainAttestation.gasUsed);
console.log('- Attester:', onchainAttestation.attester);
```

### Step 3: Verify Registration

```typescript
// Verify the attestation exists on-chain
const verification = await sdk.verifyOnchainLocationAttestation(onchainAttestation);

console.log('Verification result:');
console.log('- Valid:', verification.isValid);
console.log('- Attester:', verification.signerAddress);
console.log('- Revoked:', verification.revoked);
console.log('- Expiration:', verification.expirationTime);
```

## Advanced Patterns

### Gas Estimation

```typescript
// Estimate gas before transaction
async function estimateAttestationGas(
  sdk: AstralSDK, 
  input: LocationAttestationInput
): Promise<bigint> {
  const unsignedAttestation = await sdk.buildLocationAttestation(input);
  
  // Get gas estimate from registrar
  const gasEstimate = await sdk.onchain.estimateGas(unsignedAttestation);
  
  console.log('Estimated gas:', gasEstimate.toString());
  
  return gasEstimate;
}

// Use estimate to set gas limit
const gasEstimate = await estimateAttestationGas(sdk, attestationInput);
const onchainAttestation = await sdk.createOnchainLocationAttestation(
  attestationInput,
  { 
    gasLimit: gasEstimate * 110n / 100n // Add 10% buffer
  }
);
```

### Custom Transaction Options

```typescript
// Advanced transaction configuration
const attestation = await sdk.createOnchainLocationAttestation(
  {
    location: coordinates,
    memo: 'High priority attestation'
  },
  {
    gasLimit: 200000n,
    gasPrice: ethers.parseUnits('20', 'gwei'), // Fast confirmation
    value: 0n, // No ETH value transfer
    nonce: await provider.getTransactionCount(signer.address)
  }
);
```

### Batch Attestations

```typescript
// Create multiple attestations in separate transactions
async function createBatchAttestations(
  sdk: AstralSDK,
  inputs: LocationAttestationInput[]
): Promise<OnchainLocationAttestation[]> {
  const results = [];
  
  for (const input of inputs) {
    try {
      const attestation = await sdk.createOnchainLocationAttestation(input);
      results.push(attestation);
      
      console.log(`✅ Created attestation ${attestation.uid}`);
      
      // Optional: wait between transactions to avoid nonce issues
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Failed to create attestation:`, error);
      // Continue with next attestation
    }
  }
  
  return results;
}
```

### Revocable Attestations

```typescript
// Create a revocable attestation
const revocableAttestation = await sdk.createOnchainLocationAttestation({
  location: { type: 'Point', coordinates: [151.2093, -33.8688] }, // Sydney
  memo: 'Temporary construction zone boundary',
  revocable: true // Enable revocation
});

// Later, revoke the attestation
const revocationTx = await sdk.revokeOnchainLocationAttestation(
  revocableAttestation,
  'Reason for revocation'
);

console.log('Revocation transaction:', revocationTx.txHash);
```

## EAS Integration Details

### Schema Information

```typescript
// Location attestation schema structure
const LOCATION_SCHEMA = {
  uid: '0x...',
  definition: [
    'uint64 eventTimestamp',
    'string srs', 
    'string locationType',
    'string location',
    'string[] proofType',
    'string[] proofPayload', 
    'string[] mediaType',
    'string[] mediaData',
    'string memo'
  ].join(','),
  resolver: '0x0000000000000000000000000000000000000000', // No custom resolver
  revocable: true
};
```

### Contract Interaction

```typescript
// Direct EAS contract interaction (advanced usage)
import { EAS } from '@ethereum-attestation-service/eas-sdk';

const eas = new EAS('0xC2679fBD37d54388Ce493F1DB75320D236e1815e');
eas.connect(signer);

// The SDK handles this internally, but you can access it directly
const attestationRequest = {
  schema: LOCATION_SCHEMA.uid,
  data: {
    recipient: '0x0000000000000000000000000000000000000000',
    expirationTime: 0n,
    revocable: true,
    refUID: '0x0000000000000000000000000000000000000000000000000000000000000000',
    data: encodedAttestationData
  }
};

const tx = await eas.attest(attestationRequest);
```

## Error Handling

### Transaction Failures

```typescript
import { 
  InsufficientFundsError,
  TransactionError,
  NetworkError,
  ContractError 
} from '@decentralized-geo/astral-sdk';

try {
  const attestation = await sdk.createOnchainLocationAttestation(input);
} catch (error) {
  if (error instanceof InsufficientFundsError) {
    console.log('❌ Insufficient funds for gas');
    console.log('💡 Get testnet ETH from faucet');
    
  } else if (error instanceof TransactionError) {
    console.log('❌ Transaction failed:', error.message);
    console.log('Transaction hash:', error.txHash);
    
  } else if (error instanceof NetworkError) {
    console.log('🌐 Network issue:', error.message);
    console.log('💡 Check RPC endpoint and connectivity');
    
  } else if (error instanceof ContractError) {
    console.log('📜 Smart contract error:', error.message);
    console.log('💡 Check EAS contract status');
  }
}
```

### Gas Price Management

```typescript
// Handle gas price fluctuations
async function createAttestationWithRetry(
  sdk: AstralSDK,
  input: LocationAttestationInput,
  maxRetries = 3
) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Get current gas price
      const feeData = await sdk.provider.getFeeData();
      const gasPrice = feeData.gasPrice;
      
      if (!gasPrice) {
        throw new Error('Unable to determine gas price');
      }
      
      console.log(`Attempt ${attempt}: Gas price ${ethers.formatUnits(gasPrice, 'gwei')} gwei`);
      
      const attestation = await sdk.createOnchainLocationAttestation(input, {
        gasPrice: gasPrice * 120n / 100n // 20% buffer
      });
      
      return attestation;
      
    } catch (error) {
      if (attempt === maxRetries) throw error;
      
      console.log(`Attempt ${attempt} failed, retrying...`);
      await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
    }
  }
}
```

## Smart Contract Integration

### Reading Attestations in Solidity

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@ethereum-attestation-service/eas-contracts/contracts/IEAS.sol";

contract LocationVerifier {
    IEAS private immutable _eas;
    bytes32 private immutable _locationSchema;
    
    constructor(address easContract, bytes32 locationSchema) {
        _eas = IEAS(easContract);
        _locationSchema = locationSchema;
    }
    
    function verifyLocation(bytes32 uid) external view returns (bool) {
        Attestation memory attestation = _eas.getAttestation(uid);
        
        // Verify the attestation exists and uses our schema
        return attestation.uid != bytes32(0) && 
               attestation.schema == _locationSchema &&
               !attestation.revoked &&
               (attestation.expirationTime == 0 || attestation.expirationTime > block.timestamp);
    }
    
    function getLocationData(bytes32 uid) external view returns (string memory) {
        Attestation memory attestation = _eas.getAttestation(uid);
        require(attestation.schema == _locationSchema, "Invalid schema");
        
        // Decode the location data from attestation.data
        // (Implementation depends on your specific encoding)
        return abi.decode(attestation.data, (string));
    }
}
```

### Frontend Integration

```typescript
// React component for onchain attestations
import { useState } from 'react';
import { AstralSDK, OnchainLocationAttestation } from '@astral-protocol/sdk';

function OnchainAttestationForm() {
  const [attestation, setAttestation] = useState<OnchainLocationAttestation | null>(null);
  const [txHash, setTxHash] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  const createAttestation = async (location: [number, number], memo: string) => {
    setLoading(true);
    try {
      const result = await sdk.createOnchainLocationAttestation({
        location,
        memo
      });
      
      setAttestation(result);
      setTxHash(result.txHash);
      
      // Show success notification
      console.log('✅ Attestation created:', result.uid);
      
    } catch (error) {
      console.error('❌ Creation failed:', error);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      {/* Form UI */}
      {attestation && (
        <div>
          <h3>Attestation Created!</h3>
          <p>UID: {attestation.uid}</p>
          <p>Block: {attestation.blockNumber}</p>
          <a 
            href={`https://sepolia.etherscan.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            View on Etherscan
          </a>
        </div>
      )}
    </div>
  );
}
```

## Querying Attestations

### By Attester

```typescript
// Find all attestations created by a specific address
const attestations = await sdk.queryLocationAttestations({
  attester: '0x742d35Cc6641C3bB8c9E8A93cf85c1E7f1A8c1E7',
  schema: LOCATION_SCHEMA_UID,
  limit: 50
});

console.log(`Found ${attestations.total} attestations`);
attestations.attestations.forEach(attestation => {
  console.log(`- ${attestation.uid}: ${attestation.decodedDataJson.memo}`);
});
```

### By Recipient

```typescript
// Find attestations made about a specific address
const attestations = await sdk.queryLocationAttestations({
  recipient: '0x...',
  revoked: false, // Only non-revoked
  orderBy: 'time',
  orderDirection: 'desc'
});
```

### GraphQL Queries

```typescript
// Advanced querying using EAS's GraphQL endpoint
const query = `
  query LocationAttestations($schema: String!, $attester: String!) {
    attestations(
      where: {
        schema: $schema,
        attester: $attester,
        revoked: false
      }
      orderBy: time
      orderDirection: desc
    ) {
      id
      uid
      attester
      recipient
      time
      data
      txid
    }
  }
`;

const result = await fetch('https://sepolia.easscan.org/graphql', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    query,
    variables: {
      schema: LOCATION_SCHEMA_UID,
      attester: '0x...'
    }
  })
});

const { data } = await result.json();
console.log('GraphQL results:', data.attestations);
```

## Performance Optimization

### Transaction Batching

```typescript
// Use multicall for multiple operations
import { Multicall3 } from '@ethereum-attestation-service/eas-sdk';

async function batchOperations(sdk: AstralSDK, operations: any[]) {
  const multicall = new Multicall3(sdk.provider);
  
  const calls = operations.map(op => ({
    target: EAS_CONTRACT_ADDRESS,
    callData: op.data
  }));
  
  const results = await multicall.aggregate(calls);
  return results;
}
```

### Gas Optimization

```typescript
// Optimize attestation data for lower gas costs
function optimizeAttestation(input: LocationAttestationInput) {
  return {
    ...input,
    // Use shorter memo texts
    memo: input.memo.substring(0, 100),
    
    // Compress location data when possible
    location: compressCoordinates(input.location),
    
    // Minimize media attachments
    media: input.media?.slice(0, 3) // Max 3 attachments
  };
}
```

## Security Considerations

### Input Validation

```typescript
// Validate inputs before expensive onchain operations
function validateAttestationInput(input: LocationAttestationInput) {
  if (!input.location) {
    throw new Error('Location is required');
  }
  
  if (input.memo && input.memo.length > 500) {
    throw new Error('Memo too long (max 500 characters)');
  }
  
  if (input.media && input.media.length > 5) {
    throw new Error('Too many media attachments (max 5)');
  }
  
  // Additional validation...
}
```

### Access Control

```typescript
// Restrict who can create attestations
async function createRestrictedAttestation(
  sdk: AstralSDK,
  input: LocationAttestationInput,
  allowedSigners: string[]
) {
  const signerAddress = await sdk.signer?.getAddress();
  
  if (!signerAddress || !allowedSigners.includes(signerAddress.toLowerCase())) {
    throw new Error('Unauthorized signer');
  }
  
  return sdk.createOnchainLocationAttestation(input);
}
```

## Cost Analysis

### Gas Costs by Network (Approximate)

| Network | Base Cost | With Media | USD Cost (ETH=$2000) |
|---------|-----------|------------|---------------------|
| Sepolia | 150,000 gas | 200,000 gas | Free (testnet) |
| Base | 150,000 gas | 200,000 gas | $0.10 - $1.00 |
| Arbitrum | 150,000 gas | 200,000 gas | $0.15 - $1.50 |
| Polygon | 150,000 gas | 200,000 gas | $0.01 - $0.10 |
| Ethereum | 150,000 gas | 200,000 gas | $5.00 - $50.00 |

### Cost Optimization Tips

1. **Use L2 networks** (Base, Arbitrum) for lower costs
2. **Minimize data size** - shorter memos, compressed media
3. **Batch operations** when possible
4. **Set appropriate gas prices** - don't overpay
5. **Consider offchain for high-volume** use cases

## Best Practices

1. **Always check wallet balance** before operations
2. **Estimate gas** for large or complex attestations  
3. **Handle transaction failures** gracefully with retries
4. **Validate inputs** before expensive onchain operations
5. **Use appropriate gas prices** for desired confirmation speed
6. **Monitor network congestion** and adjust accordingly
7. **Store transaction hashes** for reference and debugging
8. **Verify attestations** after creation to confirm success

## Comparison with Offchain

| Feature | Onchain | Offchain |
|---------|---------|----------|
| **Permanence** | Immutable blockchain record | Depends on storage |
| **Cost** | Gas fees required | Free |
| **Speed** | Block confirmation time | Instant |
| **Privacy** | Public by default | Private by default |
| **Smart Contract Access** | Native integration | Limited |
| **Discoverability** | Always discoverable | Opt-in publishing |
| **Revocation** | Blockchain transaction | Update signature/storage |

## Next Steps

- **[API Reference](/sdk/api)** - Complete method documentation
- **[Offchain Workflow Guide](offchain-workflow.md)** - Learn about gasless attestations  
- **[Examples Cookbook](examples.md)** - Real-world usage patterns
- **[Extension System](/sdk/extensions)** - Custom location formats and media types
- **[Smart Contract Integration](/sdk/api)** - Advanced blockchain patterns