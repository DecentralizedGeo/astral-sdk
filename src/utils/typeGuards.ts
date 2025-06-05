// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

/**
 * Type guard utilities for Astral SDK
 *
 * This file provides type guards that help to safely distinguish between
 * different types of location attestations in the dual-workflow architecture.
 */

import {
  LocationAttestation,
  OffchainLocationAttestation,
  OnchainLocationAttestation,
} from '../core/types';

/**
 * Determines if a location attestation is an OffchainLocationAttestation.
 *
 * This type guard allows for safely narrowing a LocationAttestation union type
 * to an OffchainLocationAttestation by checking for the presence of signature-related fields.
 *
 * This function is used in the offchain workflow.
 *
 * @param attestation - The location attestation to check
 * @returns True if the attestation is an OffchainLocationAttestation
 *
 * @example
 * ```ts
 * const attestation: LocationAttestation = await astral.getLocationAttestation(uid);
 *
 * if (isOffchainLocationAttestation(attestation)) {
 *   // TypeScript knows attestation is OffchainLocationAttestation here
 *   console.log(`Signature: ${attestation.signature}`);
 * }
 * ```
 */
export function isOffchainLocationAttestation(
  attestation: LocationAttestation
): attestation is OffchainLocationAttestation {
  return (
    'signature' in attestation &&
    typeof attestation.signature === 'string' &&
    'signer' in attestation &&
    typeof attestation.signer === 'string'
  );
}

/**
 * Determines if a location attestation is an OnchainLocationAttestation.
 *
 * This type guard allows for safely narrowing a LocationAttestation union type
 * to an OnchainLocationAttestation by checking for the presence of blockchain-related fields.
 *
 * This function is used in the onchain workflow.
 *
 * @param attestation - The location attestation to check
 * @returns True if the attestation is an OnchainLocationAttestation
 *
 * @example
 * ```ts
 * const attestation: LocationAttestation = await astral.getLocationAttestation(uid);
 *
 * if (isOnchainLocationAttestation(attestation)) {
 *   // TypeScript knows attestation is OnchainLocationAttestation here
 *   console.log(`Transaction hash: ${attestation.txHash}`);
 *   console.log(`Chain: ${attestation.chain} (${attestation.chainId})`);
 * }
 * ```
 */
export function isOnchainLocationAttestation(
  attestation: LocationAttestation
): attestation is OnchainLocationAttestation {
  return (
    'txHash' in attestation &&
    typeof attestation.txHash === 'string' &&
    'chain' in attestation &&
    typeof attestation.chain === 'string' &&
    'chainId' in attestation &&
    typeof attestation.chainId === 'number'
  );
}

/**
 * Checks if a value is a non-empty string.
 *
 * This is a utility type guard used for validation throughout the SDK.
 *
 * @param value - The value to check
 * @returns True if the value is a non-empty string
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Checks if a value is a valid Ethereum address.
 *
 * This is a simple format validation and does not verify checksum.
 *
 * @param value - The value to check
 * @returns True if the value appears to be a valid Ethereum address
 */
export function isEthereumAddress(value: unknown): value is string {
  // TODO: Could test for case-sensitive checksum here as well
  return isNonEmptyString(value) && /^0x[a-fA-F0-9]{40}$/.test(value);
}

/**
 * Checks if a value is a valid UID for a location attestation.
 *
 * This is a simple format validation for the 32-byte hex string UID.
 *
 * @param value - The value to check
 * @returns True if the value appears to be a valid location attestation UID
 */
export function isLocationAttestationUID(value: unknown): value is string {
  return isNonEmptyString(value) && /^0x[a-fA-F0-9]{64}$/.test(value);
}

/**
 * Checks if a value is a valid UNIX timestamp (seconds since epoch).
 *
 * @param value - The value to check
 * @returns True if the value is a valid UNIX timestamp
 */
export function isUnixTimestamp(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0;
}

/**
 * Checks if a value is a Date object.
 *
 * @param value - The value to check
 * @returns True if the value is a Date object
 */
export function isDate(value: unknown): value is Date {
  return value instanceof Date && !isNaN(value.getTime());
}
