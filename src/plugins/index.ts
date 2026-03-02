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
  VerifiedLocationProof,

  // Shared types
  SubjectIdentifier,
  TimeBounds,
  LocationData,
  LPGeometry,
  LPGeometryType,
} from './types';

export {
  getPluginMetadata,
  isGeoJSONGeometry,
  isMultiStampProof,
  isUnsignedStamp,
  isVerifiedLocationProof,
} from './types';

// Mock plugin
export { MockPlugin } from './mock';
export type { MockPluginOptions } from './mock';

// Unix location plugin (Node.js / server-side)
export { UnixLocationPlugin } from './unix-location';
export type { UnixLocationPluginOptions, SourceReading } from './unix-location';
