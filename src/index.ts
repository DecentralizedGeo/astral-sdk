// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

/**
 * Astral SDK v0.2.0
 *
 * A TypeScript SDK for creating, verifying, and querying location attestations
 * using Ethereum Attestation Service (EAS), with verifiable geospatial computations.
 *
 * @module @decentralized-geo/astral-sdk
 */

// Main unified SDK
export { AstralSDK } from './AstralSDK';

// Configuration types
export type { AstralConfig, LocationConfig, ComputeConfig } from './core/types';

// Submodules (for advanced usage)
export { LocationModule, OffchainWorkflow, OnchainWorkflow } from './location';
export { ComputeModule } from './compute';

// Location attestation types
export type {
  UnsignedLocationAttestation,
  OffchainLocationAttestation,
  OnchainLocationAttestation,
  LocationAttestation,
  LocationAttestationInput,
  MediaInput,
  PublicationRecord,
  VerificationResult,
  OffchainAttestationOptions,
  OnchainAttestationOptions,
  RuntimeSchemaConfig,
} from './core/types';

// Compute types
export type {
  Input,
  ComputeOptions,
  NumericComputeResult,
  BooleanComputeResult,
  ComputeResult,
  DelegatedAttestation,
  AttestationResult,
} from './compute';

// Plugin system
export { PluginRegistry, MockPlugin } from './plugins';
export type { MockPluginOptions } from './plugins';
export type {
  LocationProofPlugin,
  PluginMetadata,
  Runtime,
  CollectOptions,
  RawSignals,
  LocationStamp,
  UnsignedLocationStamp,
  Signature,
  StampSigner,
  LocationProof,
  LocationClaim,
  StampVerificationResult,
  CredibilityVector,
  StampResult,
  CorrelationAssessment,
  VerifiedLocationProof,
  SubjectIdentifier,
  TimeBounds,
  LocationData,
  LPGeometry,
  LPGeometryType,
} from './plugins';
export {
  getPluginMetadata,
  isGeoJSONGeometry,
  isMultiStampProof,
  isUnsignedStamp,
  isVerifiedLocationProof,
} from './plugins';

// Stamps and Proofs modules
export { StampsModule } from './stamps';
export type { StampsCollectOptions, StampsCreateOptions, StampsSignOptions } from './stamps';
export { ProofsModule } from './proofs';

// Error hierarchy
export * from './core/errors';

// Extension system
export { ExtensionRegistry } from './extensions';

// Legacy exports for backward compatibility with v0.1.x
// These will be deprecated in v0.3.0
export { AstralSDK as AstralSDKLegacy } from './core/AstralSDK';
export type { AstralSDKConfig } from './core/types';

// Internal components (for advanced usage)
export { OffchainSigner } from './eas/OffchainSigner';
export { OnchainRegistrar } from './eas/OnchainRegistrar';
export { SchemaEncoder } from './eas/SchemaEncoder';
export { AstralApiClient } from './api/AstralApiClient';
export type { VerifyProofOptions } from './api/AstralApiClient';
export { StorageAdapter } from './storage/StorageAdapter';

// Utils exports
export * from './utils';

// Schema constants exports
export * from './schemas';
