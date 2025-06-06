---
title: Configuration
sidebar_position: 3
description: Connect your wallet and configure the SDK
---

# Configuration

Connect the SDK to your Web3 wallet and choose your network.

## Basic Configuration

The simplest setup uses your browser wallet:

```typescript
import { AstralSDK } from '@decentralized-geo/astral-sdk';

// Connect to browser wallet (MetaMask, etc.)
const sdk = new AstralSDK({ 
  provider: window.ethereum,
  defaultChain: 'sepolia' // testnet for development
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
  provider: window.ethereum,          // Web3 provider
  
  // Optional
  defaultChain: 'sepolia',           // Default: 'sepolia'
  apiUrl: 'https://api.astral.com',  // Custom API endpoint
  debug: true                        // Enable debug logging
});
```

## Provider Options

### Browser Wallet (Recommended)

```typescript
// MetaMask or other injected wallets
const sdk = new AstralSDK({ 
  provider: window.ethereum 
});
```

### Custom Provider

```typescript
import { ethers } from 'ethers';

// Using ethers.js provider
const provider = new ethers.JsonRpcProvider('https://rpc.sepolia.org');
const signer = new ethers.Wallet(privateKey, provider);

const sdk = new AstralSDK({ 
  provider: signer 
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