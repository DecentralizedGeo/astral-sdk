// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

/**
 * Schema type definitions for the Location Protocol
 *
 * These types provide a structured way to work with EAS schemas
 * for location attestations across different networks.
 *
 * ## Relationship with EAS_CONFIG
 *
 * This module provides developer-friendly schema constants that complement
 * the internal `EAS_CONFIG` in `src/core/config.ts`. While `EAS_CONFIG` is
 * used internally by the SDK for chain configuration and contract addresses,
 * these schema constants are designed for direct developer use.
 *
 * The schema UID and rawString values are derived from the same source
 * (the deployed EAS schema) to ensure consistency.
 *
 * @see {@link ../core/config.ts} for internal EAS configuration
 */

/**
 * Supported network identifiers for Location Protocol schema deployments.
 *
 * These correspond to the chains where the Location Protocol schema
 * has been registered with EAS (Ethereum Attestation Service).
 */
export type SupportedNetwork = 'sepolia' | 'base' | 'arbitrum' | 'celo' | 'optimism';

/**
 * Valid Solidity types that can appear in EAS schema definitions.
 *
 * This type restricts the values that can be used in schema interface
 * definitions to valid Solidity types supported by EAS.
 */
export type SolidityType =
  | 'uint256'
  | 'string'
  | 'string[]'
  | 'bytes'
  | 'bytes[]'
  | 'address'
  | 'bool';

/**
 * Schema interface for Location Protocol v0.1.
 *
 * This interface explicitly defines the fields and their Solidity types
 * for the Location Protocol v0.1 schema as registered with EAS.
 *
 * @example
 * ```typescript
 * // Access field types programmatically
 * const timestampType = LOCATION_V1_SCHEMA.schemaInterface.eventTimestamp; // 'uint256'
 * ```
 */
export interface LocationV1SchemaInterface {
  /** Unix timestamp (seconds) when the location event occurred */
  readonly eventTimestamp: 'uint256';
  /** Spatial Reference System identifier (e.g., "EPSG:4326") */
  readonly srs: 'string';
  /** Location format identifier (e.g., "geojson-point", "wkt-polygon") */
  readonly locationType: 'string';
  /** Location data in the format specified by locationType */
  readonly location: 'string';
  /** Recipe type identifiers (reserved for v0.2) */
  readonly recipeType: 'string[]';
  /** Recipe payloads (reserved for v0.2) */
  readonly recipePayload: 'bytes[]';
  /** MIME types for attached media (e.g., "image/jpeg") */
  readonly mediaType: 'string[]';
  /** Media references (base64, IPFS CIDs, URLs) */
  readonly mediaData: 'string[]';
  /** Optional human-readable note */
  readonly memo: 'string';
  /** Index signature for generic access */
  readonly [key: string]: SolidityType;
}

/**
 * Generic schema interface for extensibility.
 *
 * While LocationV1SchemaInterface provides strict typing for v0.1,
 * this generic interface allows for future schema versions with
 * different field structures.
 */
export interface SchemaInterface {
  readonly [fieldName: string]: SolidityType;
}

/**
 * Configuration for an EAS schema used in the Location Protocol.
 *
 * This interface provides all the information needed to work with
 * a specific version of the Location Protocol schema, including
 * the schema UID, raw encoding string, and deployment information.
 *
 * @constant
 *
 * @property uid - The unique identifier of the schema as registered with EAS.
 *   This is a 32-byte hex string prefixed with '0x' that uniquely identifies
 *   the schema across all EAS deployments.
 *
 * @property rawString - The raw schema definition string used by EAS SchemaEncoder.
 *   This is the comma-separated list of typed fields that defines the attestation
 *   data structure. Use this with the EAS SDK's SchemaEncoder class.
 *
 * @property version - The semantic version identifier for this schema.
 *   Follows the Location Protocol versioning scheme (e.g., 1 for v0.1, 2 for v0.2).
 *
 * @property networks - Array of network identifiers where this schema is deployed.
 *   Each network has the same schema UID, allowing cross-chain compatibility.
 *
 * @property schemaInterface - Mapping of field names to their Solidity types.
 *   Useful for programmatic access to schema structure and type information.
 *
 * @example
 * ```typescript
 * import { LOCATION_V1_SCHEMA } from '@astral-protocol/sdk';
 * import { SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';
 *
 * // Use the schema with EAS SDK
 * const encoder = new SchemaEncoder(LOCATION_V1_SCHEMA.rawString);
 *
 * // Check if a network is supported
 * if (LOCATION_V1_SCHEMA.networks.includes('sepolia')) {
 *   console.log('Sepolia is supported!');
 * }
 *
 * // Access the schema UID for contract interactions
 * const schemaUID = LOCATION_V1_SCHEMA.uid;
 * ```
 */
export interface SchemaConfig<T extends Record<string, SolidityType> = SchemaInterface> {
  /**
   * The unique identifier of the schema as registered with EAS.
   * This 32-byte hex string (prefixed with '0x') uniquely identifies
   * the schema across all EAS deployments on supported networks.
   */
  readonly uid: string;

  /**
   * The raw schema definition string for use with EAS SchemaEncoder.
   * This comma-separated list of typed fields defines the attestation
   * data structure (e.g., "uint256 eventTimestamp,string location,...").
   */
  readonly rawString: string;

  /**
   * The version number for this schema.
   * Follows Location Protocol versioning (1 = v0.1, 2 = v0.2, etc.).
   */
  readonly version: number;

  /**
   * Array of network identifiers where this schema is deployed.
   * All networks share the same schema UID for cross-chain compatibility.
   */
  readonly networks: readonly SupportedNetwork[];

  /**
   * Mapping of field names to their Solidity types.
   * Provides programmatic access to the schema structure.
   */
  readonly schemaInterface: T;
}

/**
 * Type alias for Location Protocol v0.1 schema configuration.
 *
 * This provides the most specific typing for the v0.1 schema,
 * with literal types for all field values.
 */
export type LocationV1SchemaConfig = SchemaConfig<LocationV1SchemaInterface>;
