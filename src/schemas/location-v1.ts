// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

/**
 * Location Protocol v0.1 Schema Configuration
 *
 * This module exports the canonical schema constant for the Location Protocol v0.1,
 * providing developers with a standardized way to work with location attestations
 * across all supported EAS networks.
 *
 * ## Relationship with EAS_CONFIG
 *
 * This schema constant complements the internal `EAS_CONFIG` in `src/core/config.ts`.
 * While `EAS_CONFIG` provides chain-specific configuration (contract addresses, RPC URLs),
 * `LOCATION_V1_SCHEMA` provides the schema definition for direct developer use.
 *
 * Both use the same schema UID (`0xba4171c92572b1e4f241d044c32cdf083be9fd946b8766977558ca6378c824e2`)
 * to ensure consistency across the SDK.
 *
 * @module schemas/location-v1
 */

import type { LocationV1SchemaConfig, SupportedNetwork } from './types';

/**
 * Type guard to check if a network string is a supported network.
 *
 * Use this instead of casting to `any` when checking network support.
 *
 * @param network - The network string to check
 * @returns True if the network is a supported Location Protocol network
 *
 * @example
 * ```typescript
 * import { isSupportedNetwork, LOCATION_V1_SCHEMA } from '@astral-protocol/sdk';
 *
 * const userNetwork = 'sepolia';
 * if (isSupportedNetwork(userNetwork)) {
 *   // userNetwork is now typed as SupportedNetwork
 *   console.log(`${userNetwork} is supported!`);
 * }
 * ```
 */
export function isSupportedNetwork(network: string): network is SupportedNetwork {
  return (['sepolia', 'base', 'arbitrum', 'celo', 'optimism'] as readonly string[]).includes(
    network
  );
}

/**
 * Location Protocol v0.1 Schema Configuration
 *
 * The canonical schema for creating and verifying location attestations using
 * the Ethereum Attestation Service (EAS). This schema is deployed identically
 * across all supported networks, enabling cross-chain location attestations.
 *
 * @constant
 *
 * ## Schema Fields
 *
 * | Field | Type | Description |
 * |-------|------|-------------|
 * | `eventTimestamp` | `uint256` | Unix timestamp when the location event occurred |
 * | `srs` | `string` | Spatial Reference System (default: "EPSG:4326" for WGS84) |
 * | `locationType` | `string` | Format identifier (e.g., "geojson-point", "wkt-polygon") |
 * | `location` | `string` | Location data in the specified format |
 * | `recipeType` | `string[]` | Recipe type identifiers (reserved for v0.2) |
 * | `recipePayload` | `bytes[]` | Recipe payloads (reserved for v0.2) |
 * | `mediaType` | `string[]` | MIME types for attached media (e.g., "image/jpeg") |
 * | `mediaData` | `string[]` | Media references (base64, IPFS CIDs, URLs) |
 * | `memo` | `string` | Optional human-readable note |
 *
 * ## Supported Networks
 *
 * This schema is deployed on the following networks with the same UID:
 * - **Sepolia** (testnet) - Chain ID: 11155111
 * - **Base** - Chain ID: 8453
 * - **Arbitrum** - Chain ID: 42161
 * - **Celo** - Chain ID: 42220
 * - **Optimism** - Chain ID: 10
 *
 * ## Usage Examples
 *
 * ### With EAS SDK SchemaEncoder
 * ```typescript
 * import { LOCATION_V1_SCHEMA } from '@astral-protocol/sdk';
 * import { SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';
 *
 * const encoder = new SchemaEncoder(LOCATION_V1_SCHEMA.rawString);
 * const encodedData = encoder.encodeData([
 *   { name: 'eventTimestamp', value: Math.floor(Date.now() / 1000), type: 'uint256' },
 *   { name: 'srs', value: 'EPSG:4326', type: 'string' },
 *   { name: 'locationType', value: 'geojson-point', type: 'string' },
 *   { name: 'location', value: '{"type":"Point","coordinates":[-122.4194,37.7749]}', type: 'string' },
 *   { name: 'recipeType', value: [], type: 'string[]' },
 *   { name: 'recipePayload', value: [], type: 'bytes[]' },
 *   { name: 'mediaType', value: [], type: 'string[]' },
 *   { name: 'mediaData', value: [], type: 'string[]' },
 *   { name: 'memo', value: 'San Francisco City Hall', type: 'string' },
 * ]);
 * ```
 *
 * ### Checking Schema UID
 * ```typescript
 * import { LOCATION_V1_SCHEMA } from '@astral-protocol/sdk';
 *
 * // Verify an attestation uses the correct schema
 * function isLocationAttestation(attestation: { schema: string }): boolean {
 *   return attestation.schema === LOCATION_V1_SCHEMA.uid;
 * }
 * ```
 *
 * ### Network Compatibility Check (Type-Safe)
 * ```typescript
 * import { LOCATION_V1_SCHEMA, isSupportedNetwork } from '@astral-protocol/sdk';
 *
 * function checkNetwork(network: string): void {
 *   if (isSupportedNetwork(network)) {
 *     // network is now typed as SupportedNetwork
 *     console.log(`${network} is supported!`);
 *   } else {
 *     console.log(`${network} is not supported`);
 *   }
 * }
 *
 * checkNetwork('sepolia'); // "sepolia is supported!"
 * checkNetwork('mainnet'); // "mainnet is not supported"
 * ```
 *
 * @see {@link https://github.com/DecentralizedGeo/location-proofs | Location Protocol Specification}
 * @see {@link https://docs.attest.sh | EAS Documentation}
 */
export const LOCATION_V1_SCHEMA = {
  /**
   * Schema UID registered with EAS on all supported networks.
   * This identifier is derived from the schema definition and resolver address.
   */
  uid: '0xba4171c92572b1e4f241d044c32cdf083be9fd946b8766977558ca6378c824e2',

  /**
   * Raw schema string for use with EAS SchemaEncoder.
   * Pass this directly to `new SchemaEncoder(rawString)`.
   */
  rawString:
    'uint256 eventTimestamp,string srs,string locationType,string location,string[] recipeType,bytes[] recipePayload,string[] mediaType,string[] mediaData,string memo',

  /**
   * Schema version number (1 corresponds to Location Protocol v0.1).
   */
  version: 1,

  /**
   * Networks where this schema is deployed and available.
   * All networks share the same schema UID for cross-chain compatibility.
   */
  networks: ['sepolia', 'base', 'arbitrum', 'celo', 'optimism'],

  /**
   * Mapping of field names to their Solidity types.
   * Useful for programmatic schema inspection and validation.
   */
  schemaInterface: {
    eventTimestamp: 'uint256',
    srs: 'string',
    locationType: 'string',
    location: 'string',
    recipeType: 'string[]',
    recipePayload: 'bytes[]',
    mediaType: 'string[]',
    mediaData: 'string[]',
    memo: 'string',
  },
} as const satisfies LocationV1SchemaConfig;
