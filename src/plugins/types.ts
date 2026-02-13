// Copyright © 2026 Sophia Systems Corporation

/**
 * Location Proof Plugin Types
 *
 * Canonical type definitions for the Astral location proof plugin system.
 * These types are the single source of truth — plugins, the SDK, and the
 * hosted service all import from here.
 *
 * Naming:
 * - A **stamp** is evidence from a single proof-of-location system
 * - A **proof** is a claim bundled with one or more stamps
 * - `verify` checks stamp internal validity (signatures, structure, signals)
 * - `evaluate` assesses how well a proof supports a claim → credibility vector
 *
 * @module plugins/types
 */

// ============================================
// Runtime and capability declarations
// ============================================

/**
 * Environments where a plugin can operate.
 */
export type Runtime = 'react-native' | 'node' | 'browser';

// ============================================
// Core identifiers
// ============================================

/**
 * Subject identifier following DID pattern (scheme:value).
 *
 * @example
 * { scheme: "eth-address", value: "0x1234..." }
 * { scheme: "device-pubkey", value: "0xabcd..." }
 * { scheme: "did:pkh", value: "eip155:1:0x..." }
 */
export interface SubjectIdentifier {
  scheme: string;
  value: string;
}

// ============================================
// Location Protocol types
// ============================================

/**
 * GeoJSON geometry types supported by Location Protocol.
 */
export type LPGeometryType =
  | 'Point'
  | 'MultiPoint'
  | 'LineString'
  | 'MultiLineString'
  | 'Polygon'
  | 'MultiPolygon'
  | 'GeometryCollection';

/**
 * GeoJSON geometry object.
 */
export interface LPGeometry {
  type: LPGeometryType;
  coordinates?: unknown;
  geometries?: LPGeometry[];
}

/**
 * Location data per Location Protocol v0.2.
 * Can be a GeoJSON geometry object or a string (H3 index, plus code, etc.).
 */
export type LocationData = LPGeometry | string;

// ============================================
// Temporal types
// ============================================

/**
 * Temporal bounds for a location claim or stamp.
 * Timestamps are Unix seconds.
 */
export interface TimeBounds {
  start: number;
  end: number;
}

// ============================================
// Location claim
// ============================================

/**
 * An assertion about the timing and location of an event.
 *
 * The event could be a person's presence, a transaction's origin,
 * an asset's location, a delivery, etc.
 */
export interface LocationClaim {
  /** Location Protocol version */
  lpVersion: string;
  /** Format of the location data (e.g., "geojson-point", "h3-index") */
  locationType: string;
  /** The claimed location */
  location: LocationData;
  /** Spatial reference system URI */
  srs: string;
  /** Subject of the claim (who/what was at the location) */
  subject: SubjectIdentifier;
  /** Spatial uncertainty in meters */
  radius: number;
  /** Temporal bounds for the claim */
  time: TimeBounds;
  /** What event is being claimed */
  eventType?: string;
}

// ============================================
// Cryptographic signatures
// ============================================

/**
 * Cryptographic signature binding evidence to a signer.
 */
export interface Signature {
  signer: SubjectIdentifier;
  /** Signing algorithm (e.g., "secp256k1", "ed25519", "pgp") */
  algorithm: string;
  /** Hex-encoded or base64-encoded signature value */
  value: string;
  /** When the signature was created (Unix seconds) */
  timestamp: number;
}

// ============================================
// Location stamp
// ============================================

/**
 * Evidence from a proof-of-location system.
 *
 * Stamps are independent of claims. They provide evidence about the timing
 * and location of an event, from sources like sensor data, network
 * measurements, hardware attestation, or institutional records.
 */
export interface LocationStamp {
  /** Location Protocol version */
  lpVersion: string;
  /** Format of the location data */
  locationType: string;
  /** Where evidence indicates the subject was */
  location: LocationData;
  /** Spatial reference system URI */
  srs: string;
  /** Temporal footprint of the evidence */
  temporalFootprint: TimeBounds;
  /** Plugin that created this stamp */
  plugin: string;
  /** Plugin version (semver) */
  pluginVersion: string;
  /** Plugin-specific evidence data */
  signals: Record<string, unknown>;
  /** Cryptographic binding */
  signatures: Signature[];
}

/**
 * A LocationStamp before cryptographic signing.
 * Created by `plugin.create()`, signed by `plugin.sign()`.
 */
export interface UnsignedLocationStamp {
  lpVersion: string;
  locationType: string;
  location: LocationData;
  srs: string;
  temporalFootprint: TimeBounds;
  plugin: string;
  pluginVersion: string;
  signals: Record<string, unknown>;
}

// ============================================
// Location proof
// ============================================

/**
 * A claim bundled with supporting evidence (stamps).
 *
 * This is the artifact submitted for verification. Single-stamp proofs
 * are valid; multi-stamp proofs enable cross-correlation analysis.
 */
export interface LocationProof {
  claim: LocationClaim;
  stamps: LocationStamp[];
}

// ============================================
// Collection types
// ============================================

/**
 * Options for evidence collection.
 */
export interface CollectOptions {
  /** Maximum time to wait for signals (milliseconds) */
  timeout?: number;
  /** Specific signals to collect (plugin-dependent) */
  signals?: string[];
}

/**
 * Raw observations from a proof-of-location system.
 * Plugin-specific — the structure varies by evidence source.
 */
export interface RawSignals {
  /** Plugin that collected these signals */
  plugin: string;
  /** When collection occurred (Unix seconds) */
  timestamp: number;
  /** Plugin-specific signal data */
  data: Record<string, unknown>;
}

// ============================================
// Signing types
// ============================================

/**
 * Abstraction over signing mechanisms.
 *
 * Plugins use this to sign stamps without coupling to a specific
 * crypto library or key storage system.
 */
export interface StampSigner {
  /** Signing algorithm identifier */
  algorithm: string;
  /** Subject identifier for the signer */
  signer: SubjectIdentifier;
  /** Sign arbitrary data and return the signature value */
  sign(data: string): Promise<string>;
}

// ============================================
// Verification results
// ============================================

/**
 * Result of verifying a stamp's internal validity (no claim assessment).
 */
export interface StampVerificationResult {
  valid: boolean;
  signaturesValid: boolean;
  structureValid: boolean;
  signalsConsistent: boolean;
  /** Plugin-specific verification details */
  details: Record<string, unknown>;
}

// ============================================
// Proof evaluation types
// ============================================

/**
 * Per-stamp result within a proof evaluation.
 *
 * Combines internal verification (is the stamp valid?) with
 * raw relevance measurements (how close is it to the claim?).
 * No opinionated scoring — consumers interpret the measurements.
 */
export interface StampResult {
  stampIndex: number;
  plugin: string;
  /** Signature verification passed */
  signaturesValid: boolean;
  /** Structure conforms to expected format */
  structureValid: boolean;
  /** Internal signals are self-consistent */
  signalsConsistent: boolean;
  /** Haversine distance from stamp to claim location (meters) */
  distanceMeters: number;
  /** Fraction of stamp/claim time windows that overlap (0-1) */
  temporalOverlap: number;
  /** Is the stamp within the claim's radius (accounting for stamp accuracy)? */
  withinRadius: boolean;
  /** Additional details (verification + evaluation) */
  details: Record<string, unknown>;
}

/**
 * Cross-correlation assessment for multi-stamp proofs.
 */
export interface CorrelationAssessment {
  /** Are stamps from independent systems? (0-1, higher = more independent) */
  independence: number;
  /** Do stamps corroborate each other? (0-1, higher = better agreement) */
  agreement: number;
  /** Analysis notes */
  notes: string[];
}

/**
 * Multidimensional assessment of how evidence supports a location claim.
 *
 * Based on the research framework: E(C, E) → P where P = (P₁, P₂, ..., Pₙ)
 *
 * v0 includes fundamental dimensions that can be objectively measured from
 * stamp data. Future versions will add:
 * - Economic security (cost-to-forge estimates)
 * - Decentralization (Nakamoto coefficient for PoL diversity)
 * - Freshness (recency of evidence collection)
 * - Source reputation (historical reliability metrics)
 *
 * See: https://github.com/AstralProtocol/research/blob/main/docs/towards-harder-location-proofs.md
 */
export interface CredibilityVector {
  /**
   * Multidimensional proof assessment.
   *
   * Each dimension is independently quantifiable. Applications apply their own
   * weighting schemes to collapse dimensions into trust decisions.
   */
  dimensions: {
    /**
     * Spatial relevance: How close are stamps to the claimed location?
     *
     * Applications decide thresholds (e.g., "require mean < 50m" or
     * "require 80%+ within radius").
     */
    spatial: {
      /** Mean haversine distance from stamps to claim center (meters) */
      meanDistanceMeters: number;
      /** Maximum distance of any stamp from claim center (meters) */
      maxDistanceMeters: number;
      /** Fraction of stamps within claim radius + stamp accuracy (0-1) */
      withinRadiusFraction: number;
    };

    /**
     * Temporal relevance: How well do stamp timeframes align with claim?
     *
     * Higher overlap = stronger temporal evidence.
     */
    temporal: {
      /** Mean overlap between stamp and claim time windows (0-1) */
      meanOverlap: number;
      /** Minimum overlap across all stamps (0-1) */
      minOverlap: number;
      /** Fraction of stamps with 100% temporal overlap (0-1) */
      fullyOverlappingFraction: number;
    };

    /**
     * Internal validity: Did stamps pass cryptographic and structural checks?
     *
     * From plugin.verify() - checks signatures, format, signal consistency.
     */
    validity: {
      /** Fraction of stamps with valid signatures (0-1) */
      signaturesValidFraction: number;
      /** Fraction of stamps with valid structure (0-1) */
      structureValidFraction: number;
      /** Fraction of stamps with consistent internal signals (0-1) */
      signalsConsistentFraction: number;
    };

    /**
     * Independence: Are stamps from diverse, uncorrelated sources?
     *
     * Higher independence = harder to forge all stamps with single compromise.
     *
     * v0: Plugin-level diversity (assumes plugins are independent systems).
     * Future: Deeper correlation analysis (network latency correlation,
     * shared infrastructure detection, etc.)
     */
    independence: {
      /** Ratio of unique plugins to total stamps (0-1, 1.0 = all different) */
      uniquePluginRatio: number;
      /** Fraction of stamps agreeing on spatial relevance (0-1) */
      spatialAgreement: number;
      /** List of unique plugin names contributing evidence */
      pluginNames: string[];
    };
  };

  /**
   * Per-stamp detailed results.
   *
   * PRIVACY NOTE: Future versions may omit this in privacy-preserving modes,
   * returning only aggregated dimensions. For v0, full stamp data is included
   * to enable custom evaluation functions.
   *
   * See: Compute module for privacy-preserving evaluation (TEE, ZK).
   */
  stampResults: StampResult[];

  /**
   * Evaluation metadata.
   */
  meta: {
    /** Total number of stamps evaluated */
    stampCount: number;
    /** Timestamp of evaluation (Unix seconds) */
    evaluatedAt: number;
    /** Where evaluation occurred */
    evaluationMode: 'local' | 'tee' | 'zk';
  };
}

/**
 * Verified Location Proof — the complete output of TEE/ZK verification.
 *
 * Contains everything needed to evaluate and verify a location proof:
 * the original proof, the full credibility assessment, and the EAS
 * attestation signed by the verifier (e.g., Astral TEE).
 *
 * Third parties can:
 * 1. Check `attestation.attester` — do I trust this verifier?
 * 2. Verify `attestation.signature` — is the attestation authentic?
 * 3. Inspect `credibility.dimensions` — apply my own trust model
 * 4. Optionally re-run verification on `proof` to validate the attester's work
 *
 * The attestation includes the FULL proof and credibility data (not hashes
 * or URIs) for v0. Future versions may optimize with hashes + offchain
 * storage for privacy and size.
 */
export interface VerifiedLocationProof {
  /** The original proof that was verified (claim + stamps) */
  proof: LocationProof;

  /** Full multidimensional credibility assessment (no summary score) */
  credibility: CredibilityVector;

  /** EAS attestation signed by the verifier (field names match EAS AttestationStruct) */
  attestation: {
    /** EAS attestation UID */
    uid: string;
    /** Schema UID used for this attestation */
    schema: string;
    /** Address of the verifier who signed (e.g., Astral TEE signer) */
    attester: string;
    /** Recipient of the attestation */
    recipient: string;
    /** Whether the attestation can be revoked */
    revocable: boolean;
    /** Reference to another attestation (bytes32, 0x0 if none) */
    refUID: string;
    /** ABI-encoded attestation data */
    data: string;
    /** When the attestation was created (Unix timestamp, matches EAS `time` field) */
    time: number;
    /** When the attestation expires (0 = never) */
    expirationTime: number;
    /** When revoked (0 = not revoked) */
    revocationTime: number;
    /**
     * Signature for offchain attestations.
     * Undefined for onchain attestations (verified via transaction instead).
     */
    signature?: string;
  };

  /**
   * Delegated attestation data for onchain submission via `attestByDelegation`.
   * Present when the verifier signs for delegated submission (TEE mode).
   */
  delegatedAttestation?: {
    /** EIP-712 signature for delegated attestation */
    signature: string;
    /** Address of the delegated attester (same as attestation.attester) */
    attester: string;
    /** Unix timestamp deadline for submission */
    deadline: number;
    /** Nonce used in signature (needed for EAS contract verification) */
    nonce: number;
  };

  /** Chain where the attestation was created (contextual, not part of EAS struct) */
  chainId?: number;

  /** TEE remote attestation, if available from the execution environment */
  remoteAttestation?: {
    /** TEE attestation quote */
    quote: string;
    /** TEE platform identifier (e.g., "sgx", "tdx", "sev") */
    platform: string;
    /** Additional platform-specific metadata */
    metadata?: Record<string, unknown>;
  };

  /** Identifier for the evaluation method (e.g., "astral-v0.3.0-tee") */
  evaluationMethod: string;

  /** When evaluation was performed (Unix seconds) */
  evaluatedAt: number;
}

/**
 * Type guard: check if a verification result is a VerifiedLocationProof
 * (from TEE/ZK mode) rather than a CredibilityVector (from local mode).
 */
export function isVerifiedLocationProof(
  result: CredibilityVector | VerifiedLocationProof
): result is VerifiedLocationProof {
  return (
    'attestation' in result &&
    'proof' in result &&
    'evaluationMethod' in result &&
    typeof (result as VerifiedLocationProof).attestation === 'object' &&
    'uid' in (result as VerifiedLocationProof).attestation
  );
}

// ============================================
// Plugin interface
// ============================================

/**
 * The canonical plugin interface for proof-of-location systems.
 *
 * All methods are optional. Plugins implement what makes sense for their
 * environment and capabilities:
 *
 * - ProofMode RN module: collect on mobile, verify anywhere
 * - WitnessChain Node client: collect via API, verify anywhere
 * - Mock plugin: runs everywhere, for testing
 *
 * Evaluation (assessing how well stamps support a claim) is handled by the
 * SDK's VerifyModule, not by individual plugins.
 */
export interface LocationProofPlugin {
  /** Plugin name (e.g., "proofmode", "witnesschain", "mock") */
  readonly name: string;
  /** Plugin version (semver) */
  readonly version: string;
  /** Runtimes where this plugin can operate */
  readonly runtimes: Runtime[];
  /** Capabilities the plugin needs from the environment (informational) */
  readonly requiredCapabilities: string[];
  /** Human-readable description */
  readonly description: string;

  /**
   * Collect raw signals from the environment.
   * Returns plugin-specific observations with timestamps.
   */
  collect?(options?: CollectOptions): Promise<RawSignals>;

  /**
   * Transform raw signals into an unsigned location stamp.
   */
  create?(signals: RawSignals): Promise<UnsignedLocationStamp>;

  /**
   * Cryptographically sign an unsigned stamp.
   */
  sign?(stamp: UnsignedLocationStamp, signer?: StampSigner): Promise<LocationStamp>;

  /**
   * Verify a stamp's internal validity (signatures, structure, signal consistency).
   */
  verify?(stamp: LocationStamp): Promise<StampVerificationResult>;
}

// ============================================
// Plugin metadata
// ============================================

/**
 * Serializable plugin metadata for listing and discovery.
 */
export interface PluginMetadata {
  name: string;
  version: string;
  runtimes: Runtime[];
  requiredCapabilities: string[];
  description: string;
}

/**
 * Extract metadata from a plugin instance.
 */
export function getPluginMetadata(plugin: LocationProofPlugin): PluginMetadata {
  return {
    name: plugin.name,
    version: plugin.version,
    runtimes: plugin.runtimes,
    requiredCapabilities: plugin.requiredCapabilities,
    description: plugin.description,
  };
}

// ============================================
// Type guards
// ============================================

/**
 * Check if a location is a GeoJSON geometry.
 */
export function isGeoJSONGeometry(location: LocationData): location is LPGeometry {
  return typeof location === 'object' && location !== null && 'type' in location;
}

/**
 * Check if a proof has multiple stamps.
 */
export function isMultiStampProof(proof: LocationProof): boolean {
  return proof.stamps.length > 1;
}

/**
 * Check if a stamp is unsigned (has no signatures array).
 */
export function isUnsignedStamp(
  stamp: LocationStamp | UnsignedLocationStamp
): stamp is UnsignedLocationStamp {
  return !('signatures' in stamp);
}
