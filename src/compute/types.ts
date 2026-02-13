// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

/**
 * Compute module type definitions
 */

import type { Geometry } from 'geojson';
import type { VerifiedLocationProof } from '../plugins/types';

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
 * Input from a verified location proof.
 * Geometry is extracted from the proof's claim; the attestation UID is used as ref.
 */
export interface VerifiedProofInput {
  readonly verifiedProof: VerifiedLocationProof;
}

/**
 * Input types for compute operations
 * - string: Direct attestation UID
 * - RawGeometryInput: GeoJSON Geometry
 * - OnchainInput: Reference to onchain attestation
 * - OffchainInput: Reference to offchain attestation with URI
 * - VerifiedProofInput: Geometry from a verified location proof
 */
export type Input = string | RawGeometryInput | OnchainInput | OffchainInput | VerifiedProofInput;

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
 * Proof metadata carried through from a verified proof input.
 * Loose typing (unknown) for forward compatibility with evolving credibility/claim shapes.
 */
export interface ProofInputContext {
  readonly ref: string;
  readonly credibility: unknown;
  readonly claim: unknown;
  readonly evaluatedAt: number;
  readonly evaluationMethod: string;
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
  readonly proofInputs?: ProofInputContext[];
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
  readonly proofInputs?: ProofInputContext[];
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
