# Astral SDK Demo Examples

This folder contains demo scripts for the Astral SDK that showcase how to create and verify location attestations using the Ethereum Attestation Service (EAS).

## Available Demos

### 1. Minimal Demo (Basic SDK)
```
node examples/minimal-demo.js
```
This demo shows basic SDK initialization and configuration. It's the simplest way to verify that the SDK builds correctly and can be imported.

### 2. Reference Demo (SDK Overview)
```
node examples/reference-demo.js
```
This demo provides a comprehensive overview of the SDK, including different location format examples, workflow patterns, and documentation references.

### 3. OffchainSigner Demo (Component Focus)
```
node examples/offchain-signer-demo.js
```
This demo focuses specifically on the OffchainSigner component, showing available methods and data format requirements.

### 4. Working Attestation Demo (End-to-End)
```
node examples/working-attestation-demo.js
```
This demo creates and verifies a complete location attestation by manually registering extensions, signing with EIP-712, and validating the signature.

## Setup

To run these demos:

1. Make sure you've built the SDK:
```
pnpm run build
```

2. Run any of the example scripts from the project root:
```
node examples/working-attestation-demo.js
```

## What You'll See

Each demo illustrates different aspects of the SDK:
- SDK initialization with a wallet/signer
- Extension registration and management
- Location data formats and validation
- Cryptographic signing and verification
- Complete attestation workflow

The Working Attestation Demo is particularly useful as it demonstrates an end-to-end workflow that results in a valid, verifiable location attestation.

## Troubleshooting

If you encounter issues:

1. Ensure the SDK is built with `pnpm run build`
2. Check that dependencies are installed with `pnpm install`
3. Make sure you're running demos from the project root
4. For extension-related errors, see the working-attestation-demo.js approach that manually registers extensions

For more details, see the main DEMO.md file in the project root.