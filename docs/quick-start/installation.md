---
title: Installation
sidebar_position: 2
description: Install the Astral SDK in your project
---

# Installation

Add the Astral SDK to your project in seconds.

## Package Managers

Choose your preferred package manager:

```bash
# Using pnpm (recommended)
pnpm add @decentralized-geo/astral-sdk

# Using npm
npm install @decentralized-geo/astral-sdk

# Using yarn
yarn add @decentralized-geo/astral-sdk
```

## Import the SDK

```typescript
// ES Modules (recommended)
import { AstralSDK } from '@decentralized-geo/astral-sdk';

// CommonJS
const { AstralSDK } = require('@decentralized-geo/astral-sdk');
```

## TypeScript Support

The SDK includes TypeScript definitions out of the box. No additional setup required!

```typescript
import { 
  AstralSDK,
  UnsignedLocationAttestation,
  OffchainLocationAttestation,
  OnchainLocationAttestation 
} from '@decentralized-geo/astral-sdk';
```

## Verify Installation

Quick check to ensure everything is working:

```typescript
import { AstralSDK } from '@decentralized-geo/astral-sdk';

console.log('Astral SDK imported successfully!');
```

→ **Next:** [Configuration](/sdk/quick-start/configuration)