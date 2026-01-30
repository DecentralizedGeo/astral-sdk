// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

/**
 * Schema Constants for the Location Protocol
 *
 * This module exports reusable schema constants for working with location
 * attestations across the Astral SDK. These constants provide a standardized
 * way to reference EAS schemas without manual configuration.
 *
 * ## Relationship with EAS_CONFIG
 *
 * These schema constants complement the internal `EAS_CONFIG` in `src/core/config.ts`.
 * While `EAS_CONFIG` provides chain-specific configuration (contract addresses, RPC URLs),
 * these constants provide schema definitions for direct developer use.
 *
 * ## Available Schemas
 *
 * - **LOCATION_V1_SCHEMA**: Location Protocol v0.1 schema configuration
 *
 * ## Usage
 *
 * ```typescript
 * import {
 *   LOCATION_V1_SCHEMA,
 *   isSupportedNetwork,
 *   SchemaConfig
 * } from '@astral-protocol/sdk';
 *
 * // Access schema UID for contract interactions
 * const schemaUID = LOCATION_V1_SCHEMA.uid;
 *
 * // Use with EAS SchemaEncoder
 * const encoder = new SchemaEncoder(LOCATION_V1_SCHEMA.rawString);
 *
 * // Check supported networks (type-safe)
 * if (isSupportedNetwork('sepolia')) {
 *   console.log('Sepolia is supported!');
 * }
 * ```
 *
 * @module schemas
 */

// Export types
export type {
  SchemaConfig,
  SchemaInterface,
  SupportedNetwork,
  SolidityType,
  LocationV1SchemaConfig,
  LocationV1SchemaInterface,
} from './types';

// Export schema constants
export { LOCATION_V1_SCHEMA, isSupportedNetwork } from './location-v1';
