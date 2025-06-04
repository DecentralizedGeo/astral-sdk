// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

/**
 * Astral SDK
 *
 * A TypeScript SDK for creating, verifying, and querying location proofs
 * using Ethereum Attestation Service (EAS).
 *
 * @module @astral-protocol/sdk
 */

// Core exports
export * from './core';

// Utils exports
export * from './utils';

// Extension system exports
export * from './extensions';

// Workflow-specific exports
export * from './offchain';
export * from './onchain';

// For advanced usage, also export internal components
export { OffchainSigner } from './eas/OffchainSigner';
export { OnchainRegistrar } from './eas/OnchainRegistrar';
export { SchemaEncoder } from './eas/SchemaEncoder';
export { AstralApiClient } from './api/AstralApiClient';
export { StorageAdapter } from './storage/StorageAdapter';
