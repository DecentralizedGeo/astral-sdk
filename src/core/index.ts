// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

/**
 * Core module exports for Astral SDK
 */

// Export types but rename VerificationError to prevent collision
export {
  UnsignedLocationProof,
  OffchainLocationProof,
  OnchainLocationProof,
  LocationProof,
  PublicationRecord,
  LocationProofInput,
  MediaInput,
  ProofOptions,
  OffchainProofOptions,
  OnchainProofOptions,
  ProofQuery,
  LocationProofCollection,
  VerificationResult,
  VerificationError as VerificationErrorEnum,
  AstralSDKConfig,
  OffchainSignerConfig,
  OnchainRegistrarConfig,
  StorageConfig,
  IPFSStorageConfig,
} from './types';

// Export all errors
export * from './errors';

// Export main SDK class
export { AstralSDK } from './AstralSDK';
