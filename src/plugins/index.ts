// Copyright © 2026 Sophia Systems Corporation

/**
 * Location Proof Plugin System
 *
 * Provides the canonical plugin interface, shared types, and registry
 * for proof-of-location systems.
 *
 * @module plugins
 */

export { PluginRegistry } from './registry';

export type {
  // Plugin interface
  LocationProofPlugin,
  PluginMetadata,
  Runtime,

  // Collection
  CollectOptions,
  RawSignals,

  // Stamps
  LocationStamp,
  UnsignedLocationStamp,
  Signature,
  StampSigner,

  // Proofs and claims
  LocationProof,
  LocationClaim,

  // Verification results
  StampVerificationResult,
  CredibilityVector,
  StampResult,
  CorrelationAssessment,

  // Shared types
  SubjectIdentifier,
  TimeBounds,
  LocationData,
  LPGeometry,
  LPGeometryType,
} from './types';

export { getPluginMetadata, isGeoJSONGeometry, isMultiStampProof, isUnsignedStamp } from './types';

// Mock plugin
export { MockPlugin } from './mock';
export type { MockPluginOptions } from './mock';
