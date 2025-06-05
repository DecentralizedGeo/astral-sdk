// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

/* eslint-disable no-console */
/**
 * Hello World Example - Astral SDK
 *
 * The simplest possible location attestation example.
 * Creates a gasless offchain attestation in about 10 lines of code.
 *
 * Prerequisites:
 * - Build the SDK: `pnpm run build`
 * - No wallet or gas required for this example
 *
 * Usage:
 * npx tsx examples/hello-world.ts
 */

import { AstralSDK } from '@decentralized-geo/astral-sdk';
import { ethers } from 'ethers';

async function main() {
  console.log('🌍 Astral SDK - Hello World Example\n');

  // Create a test wallet (never use this private key for anything real!)
  const testPrivateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
  const signer = new ethers.Wallet(testPrivateKey);

  // Create SDK instance with signer
  const sdk = new AstralSDK({
    signer,
    defaultChain: 'sepolia',
    debug: true,
  });

  // Wait for extensions to load
  await sdk.extensions.ensureInitialized();

  // Create and sign a location attestation for London
  const attestation = await sdk.createOffchainLocationAttestation({
    location: {
      type: 'Point',
      coordinates: [-0.1276, 51.5074], // London [longitude, latitude]
    },
    memo: 'Hello from London!',
  });

  console.log('✅ Location attestation created and signed!');
  console.log('📍 Location type:', attestation.locationType);
  console.log('📝 Memo:', attestation.memo);
  console.log('🕐 Timestamp:', new Date(attestation.eventTimestamp * 1000));
  console.log('🔐 Signed by:', attestation.signer);
  console.log('🆔 UID:', attestation.uid);
  console.log(
    "\n🎉 Success! You've created your first signed spatial attestation with Astral SDK."
  );
}

// Run the example
main().catch(console.error);
