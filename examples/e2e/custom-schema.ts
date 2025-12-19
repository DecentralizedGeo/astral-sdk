// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

/**
 * Custom schema definition for E2E testing of multi-schema support.
 *
 * This defines an "Asset Tracking" schema that extends Location Protocol v0.2
 * with custom fields for tracking physical assets.
 */

import { RuntimeSchemaConfig } from '../../src/core/types';
import {
  validateLocationProtocolSchema,
  SchemaValidationResult,
} from '../../src/utils/schemaValidation';

/**
 * Asset Tracking Schema - Location Protocol v0.2 Conformant
 *
 * Fields:
 * - specVersion (uint8): Location Protocol version, always 1 for v0.2
 * - srs (string): Spatial reference system, e.g., "EPSG:4326"
 * - locationType (string): Format identifier, e.g., "geojson-point"
 * - location (string): The actual location data
 * - assetId (string): Unique identifier for the tracked asset
 * - owner (address): Ethereum address of the asset owner
 * - timestamp (uint256): Unix timestamp when the location was recorded
 */
export const ASSET_TRACKING_SCHEMA_STRING =
  'uint8 specVersion,string srs,string locationType,string location,string assetId,address owner,uint256 timestamp';

/**
 * Validate the schema at module load time to catch errors early.
 */
export const SCHEMA_VALIDATION: SchemaValidationResult = validateLocationProtocolSchema(
  ASSET_TRACKING_SCHEMA_STRING
);

// Verify conformance
if (!SCHEMA_VALIDATION.conformant) {
  throw new Error(
    `Asset Tracking Schema is not Location Protocol conformant. ` +
      `Missing fields: ${SCHEMA_VALIDATION.missing.join(', ')}. ` +
      `Errors: ${SCHEMA_VALIDATION.errors.join(', ')}`
  );
}

// Log validation result
console.log(`Asset Tracking Schema validated:`);
console.log(`  - Valid EAS format: ${SCHEMA_VALIDATION.valid}`);
console.log(`  - LP Conformant: ${SCHEMA_VALIDATION.conformant}`);
console.log(`  - LP Version: v0.${SCHEMA_VALIDATION.version}`);
console.log(`  - Fields: ${SCHEMA_VALIDATION.fields.map(f => f.name).join(', ')}`);
if (SCHEMA_VALIDATION.warnings.length > 0) {
  console.log(`  - Warnings: ${SCHEMA_VALIDATION.warnings.join(', ')}`);
}

/**
 * Asset Tracking Schema configuration for use with AstralSDK.
 *
 * NOTE: The `uid` field must be populated after deploying the schema
 * to EAS using the deploy-schema.ts script.
 */
export const ASSET_TRACKING_SCHEMA: RuntimeSchemaConfig = {
  // TODO: Populate after running deploy-schema.ts
  // This will be the bytes32 UID returned by SchemaRegistry.register()
  uid: '',
  rawString: ASSET_TRACKING_SCHEMA_STRING,
};

/**
 * Updates the schema UID after deployment.
 * Call this after deploying the schema to EAS.
 *
 * @param uid - The schema UID returned by SchemaRegistry.register()
 * @returns Updated schema config
 */
export function withSchemaUID(uid: `0x${string}`): RuntimeSchemaConfig {
  return {
    uid,
    rawString: ASSET_TRACKING_SCHEMA_STRING,
  };
}

/**
 * Example attestation data structure for the Asset Tracking schema.
 * This shows what fields are expected when creating attestations.
 */
export interface AssetTrackingData {
  /** Location Protocol version (always 1 for v0.2) */
  specVersion: number;
  /** Spatial reference system */
  srs: string;
  /** Location format type */
  locationType: string;
  /** Location data (e.g., GeoJSON string) */
  location: string;
  /** Unique asset identifier */
  assetId: string;
  /** Asset owner's Ethereum address */
  owner: `0x${string}`;
  /** Unix timestamp */
  timestamp: bigint;
}

/**
 * Creates example attestation data for testing.
 *
 * @param overrides - Optional field overrides
 * @returns Complete attestation data
 */
export function createExampleAssetData(
  overrides: Partial<AssetTrackingData> = {}
): AssetTrackingData {
  return {
    specVersion: 1,
    srs: 'EPSG:4326',
    locationType: 'geojson-point',
    location: JSON.stringify({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [-122.4194, 37.7749], // San Francisco
      },
      properties: {},
    }),
    assetId: 'ASSET-001',
    owner: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    timestamp: BigInt(Math.floor(Date.now() / 1000)),
    ...overrides,
  };
}
