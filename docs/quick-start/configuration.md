---
title: Configuration
sidebar_position: 3
description: Connect your wallet and configure the SDK
---

# Configuration

Connect the SDK to your Web3 wallet and choose your network.

## Basic Configuration

The simplest setup creates a test wallet:

```typescript
import { AstralSDK } from '@decentralized-geo/astral-sdk';
import { Wallet } from 'ethers';

// Create a test wallet (for production, use your actual wallet)
const privateKey = Wallet.createRandom().privateKey;
const wallet = new Wallet(privateKey);

// Initialize SDK with the signer
const sdk = new AstralSDK({ 
  signer: wallet
});
```

## Configuration Options

### → Supported Chains

```typescript
type SupportedChain = 
  | 'sepolia'    // Ethereum testnet (recommended for development)
  | 'base'       // Base mainnet
  | 'arbitrum'   // Arbitrum One
  | 'celo'       // Celo mainnet
```

### → Full Configuration

```typescript
const sdk = new AstralSDK({
  // Required
  signer: wallet,                    // Wallet signer
  
  // Optional
  chainId: 11155111,                 // Chain ID (11155111 = Sepolia)
  apiUrl: 'https://api.astral.com',  // Custom API endpoint
  debug: true                        // Enable debug logging
});
```

## Provider Options

### For Offchain Attestations (No Gas)

```typescript
// Simple wallet without provider - perfect for offchain attestations
const wallet = new Wallet(privateKey);
const sdk = new AstralSDK({ 
  signer: wallet 
});
```

### For Onchain Attestations (Requires Gas)

```typescript
import { JsonRpcProvider } from 'ethers';

// Connect wallet to provider for blockchain transactions
const provider = new JsonRpcProvider('https://sepolia.infura.io/v3/YOUR_KEY');
const walletWithProvider = wallet.connect(provider);

const sdk = new AstralSDK({ 
  signer: walletWithProvider,
  chainId: 11155111 // Sepolia
});
```

## Verify Configuration

```typescript
// Check connection
const address = await sdk.getAddress();
console.log('Connected wallet:', address);

// Check chain
const chainId = await sdk.getChainId();
console.log('Connected to chain:', chainId);
```

→ **Next:** [First Attestation](/sdk/quick-start/first-attestation)