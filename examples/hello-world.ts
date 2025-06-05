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

async function main() {
  console.log('🌍 Astral SDK - Hello World Example\n');

  // Create SDK instance (no wallet required for offchain)
  const sdk = new AstralSDK({
    mode: 'offchain',
    debug: true,
  });

  // Wait for extensions to load
  await sdk.extensions.ensureInitialized();

  // Create a location attestation for London
  const attestation = await sdk.buildLocationAttestation({
    location: {
      type: 'Point',
      coordinates: [-0.1276, 51.5074], // London [longitude, latitude]
    },
    memo: 'Hello from London!',
  });

  console.log('✅ Location attestation created!');
  console.log('📍 Location type:', attestation.locationType);
  console.log('📝 Memo:', attestation.memo);
  console.log('🕐 Timestamp:', new Date(attestation.eventTimestamp * 1000));
  console.log("\n🎉 Success! You've created your first spatial record with Astral SDK.");
}

// Run the example
main().catch(console.error);
