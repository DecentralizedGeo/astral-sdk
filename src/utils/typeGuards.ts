/**
 * Type guard utilities for Astral SDK
 *
 * This file provides type guards that help to safely distinguish between
 * different types of location proofs in the dual-workflow architecture.
 */

import { LocationProof, OffchainLocationProof, OnchainLocationProof } from '../core/types';

/**
 * Determines if a location proof is an OffchainLocationProof.
 *
 * This type guard allows for safely narrowing a LocationProof union type
 * to an OffchainLocationProof by checking for the presence of signature-related fields.
 *
 * This function is used in the offchain workflow.
 *
 * @param proof - The location proof to check
 * @returns True if the proof is an OffchainLocationProof
 *
 * @example
 * ```ts
 * const proof: LocationProof = await astral.getLocationProof(uid);
 *
 * if (isOffchainLocationProof(proof)) {
 *   // TypeScript knows proof is OffchainLocationProof here
 *   console.log(`Signature: ${proof.signature}`);
 * }
 * ```
 */
export function isOffchainLocationProof(proof: LocationProof): proof is OffchainLocationProof {
  return (
    'signature' in proof &&
    typeof proof.signature === 'string' &&
    'signer' in proof &&
    typeof proof.signer === 'string'
  );
}

/**
 * Determines if a location proof is an OnchainLocationProof.
 *
 * This type guard allows for safely narrowing a LocationProof union type
 * to an OnchainLocationProof by checking for the presence of blockchain-related fields.
 *
 * This function is used in the onchain workflow.
 *
 * @param proof - The location proof to check
 * @returns True if the proof is an OnchainLocationProof
 *
 * @example
 * ```ts
 * const proof: LocationProof = await astral.getLocationProof(uid);
 *
 * if (isOnchainLocationProof(proof)) {
 *   // TypeScript knows proof is OnchainLocationProof here
 *   console.log(`Transaction hash: ${proof.txHash}`);
 *   console.log(`Chain: ${proof.chain} (${proof.chainId})`);
 * }
 * ```
 */
export function isOnchainLocationProof(proof: LocationProof): proof is OnchainLocationProof {
  return (
    'txHash' in proof &&
    typeof proof.txHash === 'string' &&
    'chain' in proof &&
    typeof proof.chain === 'string' &&
    'chainId' in proof &&
    typeof proof.chainId === 'number'
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
 * Checks if a value is a valid UID for a location proof.
 *
 * This is a simple format validation for the 32-byte hex string UID.
 *
 * @param value - The value to check
 * @returns True if the value appears to be a valid location proof UID
 */
export function isLocationProofUID(value: unknown): value is string {
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
