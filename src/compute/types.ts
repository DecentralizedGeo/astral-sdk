// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

/**
 * Compute module type definitions
 */

import type { Geometry } from 'geojson';

/**
 * Raw GeoJSON geometry input
 */
export type RawGeometryInput = Geometry;

/**
 * Reference to an onchain attestation
 */
export interface OnchainInput {
  readonly uid: string;
}

/**
 * Reference to an offchain attestation
 */
export interface OffchainInput {
  readonly uid: string;
  readonly uri: string;
}

/**
 * Input types for compute operations
 * - string: Direct attestation UID
 * - RawGeometryInput: GeoJSON Geometry
 * - OnchainInput: Reference to onchain attestation
 * - OffchainInput: Reference to offchain attestation with URI
 */
export type Input = string | RawGeometryInput | OnchainInput | OffchainInput;

/**
 * Options for compute operations
 */
export interface ComputeOptions {
  readonly schema: string;
  readonly recipient?: string;
}

/**
 * Delegated attestation message structure
 */
export interface DelegatedAttestationMessage {
  readonly schema: string;
  readonly recipient: string;
  readonly expirationTime: bigint;
  readonly revocable: boolean;
  readonly refUID: string;
  readonly data: string;
  readonly value: bigint;
  readonly nonce: bigint;
  readonly deadline: bigint;
}

/**
 * Delegated attestation signature
 */
export interface DelegatedAttestationSignature {
  readonly v: number;
  readonly r: string;
  readonly s: string;
}

/**
 * Complete delegated attestation for EAS submission
 */
export interface DelegatedAttestation {
  readonly message: DelegatedAttestationMessage;
  readonly signature: DelegatedAttestationSignature;
  readonly attester: string;
}

/**
 * Attestation object from API response
 */
export interface AttestationObject {
  readonly schema: string;
  readonly attester: string;
  readonly recipient: string;
  readonly data: string;
  readonly signature: string;
}

/**
 * Delegated attestation object for submission
 */
export interface DelegatedAttestationObject {
  readonly signature: string;
  readonly attester: string;
  readonly deadline: number;
}

/**
 * Result for numeric compute operations (distance, area, length)
 */
export interface NumericComputeResult {
  readonly result: number;
  readonly units: string;
  readonly operation: string;
  readonly timestamp: number;
  readonly inputRefs: string[];
  readonly attestation: AttestationObject;
  readonly delegatedAttestation: DelegatedAttestationObject;
}

/**
 * Result for boolean compute operations (contains, within, intersects)
 */
export interface BooleanComputeResult {
  readonly result: boolean;
  readonly operation: string;
  readonly timestamp: number;
  readonly inputRefs: string[];
  readonly attestation: AttestationObject;
  readonly delegatedAttestation: DelegatedAttestationObject;
}

/**
 * Union type for all compute results
 */
export type ComputeResult = NumericComputeResult | BooleanComputeResult;

/**
 * Result from attestation submission
 */
export interface AttestationResult {
  readonly uid: string;
}

/**
 * Health check response
 */
export interface HealthStatus {
  readonly status: string;
  readonly database: string;
}
