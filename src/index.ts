/**
 * Astral SDK
 * 
 * A TypeScript SDK for creating, verifying, and querying location proofs
 * using Ethereum Attestation Service (EAS).
 * 
 * @module @astral-protocol/sdk
 */

// Core exports
export { AstralSDK } from './core/AstralSDK';
export * from './core/types';
export * from './core/errors';

// Type guards
export * from './utils/typeGuards';

// For advanced usage, also export internal components
export { OffchainSigner } from './eas/OffchainSigner';
export { OnchainRegistrar } from './eas/OnchainRegistrar';
export { AstralApiClient } from './api/AstralApiClient';