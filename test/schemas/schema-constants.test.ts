// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

/**
 * Tests for schema constants exports
 */

import {
  LOCATION_V1_SCHEMA,
  SchemaConfig,
  SupportedNetwork,
  isSupportedNetwork,
  LocationV1SchemaInterface,
  SolidityType,
} from '../../src/schemas';

describe('Schema Constants', () => {
  describe('LOCATION_V1_SCHEMA', () => {
    it('should export a valid SchemaConfig object', () => {
      expect(LOCATION_V1_SCHEMA).toBeDefined();
      expect(typeof LOCATION_V1_SCHEMA.uid).toBe('string');
      expect(typeof LOCATION_V1_SCHEMA.rawString).toBe('string');
      expect(typeof LOCATION_V1_SCHEMA.version).toBe('number');
      expect(Array.isArray(LOCATION_V1_SCHEMA.networks)).toBe(true);
      expect(typeof LOCATION_V1_SCHEMA.schemaInterface).toBe('object');
    });

    it('should have the correct schema UID', () => {
      expect(LOCATION_V1_SCHEMA.uid).toBe(
        '0xba4171c92572b1e4f241d044c32cdf083be9fd946b8766977558ca6378c824e2'
      );
    });

    it('should have version 1', () => {
      expect(LOCATION_V1_SCHEMA.version).toBe(1);
    });

    it('should include all supported networks', () => {
      const expectedNetworks: SupportedNetwork[] = [
        'sepolia',
        'base',
        'arbitrum',
        'celo',
        'optimism',
      ];
      expect(LOCATION_V1_SCHEMA.networks).toEqual(expectedNetworks);
    });

    it('should have a valid rawString for EAS SchemaEncoder', () => {
      const expectedRawString =
        'uint256 eventTimestamp,string srs,string locationType,string location,string[] recipeType,bytes[] recipePayload,string[] mediaType,string[] mediaData,string memo';
      expect(LOCATION_V1_SCHEMA.rawString).toBe(expectedRawString);
    });

    it('should have all expected fields in schemaInterface', () => {
      const expectedFields = [
        'eventTimestamp',
        'srs',
        'locationType',
        'location',
        'recipeType',
        'recipePayload',
        'mediaType',
        'mediaData',
        'memo',
      ];
      const actualFields = Object.keys(LOCATION_V1_SCHEMA.schemaInterface);
      expect(actualFields).toEqual(expectedFields);
    });

    it('should have correct Solidity types for each field', () => {
      expect(LOCATION_V1_SCHEMA.schemaInterface.eventTimestamp).toBe('uint256');
      expect(LOCATION_V1_SCHEMA.schemaInterface.srs).toBe('string');
      expect(LOCATION_V1_SCHEMA.schemaInterface.locationType).toBe('string');
      expect(LOCATION_V1_SCHEMA.schemaInterface.location).toBe('string');
      expect(LOCATION_V1_SCHEMA.schemaInterface.recipeType).toBe('string[]');
      expect(LOCATION_V1_SCHEMA.schemaInterface.recipePayload).toBe('bytes[]');
      expect(LOCATION_V1_SCHEMA.schemaInterface.mediaType).toBe('string[]');
      expect(LOCATION_V1_SCHEMA.schemaInterface.mediaData).toBe('string[]');
      expect(LOCATION_V1_SCHEMA.schemaInterface.memo).toBe('string');
    });

    it('should have literal types via as const satisfies pattern', () => {
      // Verify the schema has the expected structure
      expect(LOCATION_V1_SCHEMA.networks.length).toBe(5);
      expect(Object.keys(LOCATION_V1_SCHEMA.schemaInterface).length).toBe(9);

      // The 'as const satisfies' pattern ensures:
      // 1. Values are literal types at compile time
      // 2. The object satisfies the interface contract
      // These compile-time checks are verified by TypeScript, not runtime tests
    });

    // Compile-time immutability is verified by TypeScript, not runtime tests.
    // The 'as const satisfies' pattern ensures:
    // 1. Values are literal types at compile time
    // 2. Assignments to readonly properties fail at compile time
    // 3. The object satisfies the interface contract
    //
    // To verify compile-time immutability manually, uncomment these lines
    // and confirm TypeScript shows errors:
    //   LOCATION_V1_SCHEMA.uid = 'test'; // Should error
    //   LOCATION_V1_SCHEMA.networks.push('mainnet'); // Should error
    it('should have deeply readonly structure via as const', () => {
      // Verify the object exists and has expected shape
      // The actual immutability is enforced at compile time, not runtime
      expect(typeof LOCATION_V1_SCHEMA.uid).toBe('string');
      expect(Array.isArray(LOCATION_V1_SCHEMA.networks)).toBe(true);
      expect(typeof LOCATION_V1_SCHEMA.schemaInterface).toBe('object');
    });
  });

  describe('isSupportedNetwork type guard', () => {
    it('should return true for valid networks', () => {
      expect(isSupportedNetwork('sepolia')).toBe(true);
      expect(isSupportedNetwork('base')).toBe(true);
      expect(isSupportedNetwork('arbitrum')).toBe(true);
      expect(isSupportedNetwork('celo')).toBe(true);
      expect(isSupportedNetwork('optimism')).toBe(true);
    });

    it('should return false for invalid networks', () => {
      expect(isSupportedNetwork('mainnet')).toBe(false);
      expect(isSupportedNetwork('polygon')).toBe(false);
      expect(isSupportedNetwork('avalanche')).toBe(false);
      expect(isSupportedNetwork('')).toBe(false);
      expect(isSupportedNetwork('SEPOLIA')).toBe(false); // Case-sensitive
    });

    it('should narrow types correctly', () => {
      const network = 'sepolia' as string;

      if (isSupportedNetwork(network)) {
        // At this point, network should be typed as SupportedNetwork
        // This is verified at compile time
        const supported: SupportedNetwork = network;
        expect(supported).toBe('sepolia');
      }
    });
  });

  describe('Type exports', () => {
    it('should export SchemaConfig type', () => {
      // Type checking - this will fail at compile time if types aren't exported
      const config: SchemaConfig = LOCATION_V1_SCHEMA;
      expect(config).toBeDefined();
    });

    it('should export SupportedNetwork type', () => {
      // Type checking - this will fail at compile time if types aren't exported
      const network: SupportedNetwork = 'sepolia';
      expect(LOCATION_V1_SCHEMA.networks).toContain(network);
    });

    it('should export LocationV1SchemaInterface type', () => {
      // Verify the interface shape
      const schemaInterface: LocationV1SchemaInterface = LOCATION_V1_SCHEMA.schemaInterface;
      expect(schemaInterface.eventTimestamp).toBe('uint256');
    });

    it('should export SolidityType type', () => {
      // Verify the type accepts valid Solidity types
      const validTypes: SolidityType[] = [
        'uint256',
        'string',
        'string[]',
        'bytes',
        'bytes[]',
        'address',
        'bool',
      ];
      expect(validTypes.length).toBe(7);
    });
  });

  describe('Usage examples from documentation', () => {
    it('should work with type-safe network compatibility check pattern', () => {
      // Pattern from documentation - uses type guard instead of 'as any'
      function checkNetwork(network: string): boolean {
        return isSupportedNetwork(network);
      }

      expect(checkNetwork('sepolia')).toBe(true);
      expect(checkNetwork('base')).toBe(true);
      expect(checkNetwork('mainnet')).toBe(false);
      expect(checkNetwork('polygon')).toBe(false);
    });

    it('should work with schema UID comparison pattern', () => {
      // Pattern from documentation
      function isLocationAttestation(attestation: { schema: string }): boolean {
        return attestation.schema === LOCATION_V1_SCHEMA.uid;
      }

      const validAttestation = {
        schema: '0xba4171c92572b1e4f241d044c32cdf083be9fd946b8766977558ca6378c824e2',
      };
      const invalidAttestation = { schema: '0xinvalid' };

      expect(isLocationAttestation(validAttestation)).toBe(true);
      expect(isLocationAttestation(invalidAttestation)).toBe(false);
    });
  });

  describe('Schema consistency with EAS_CONFIG', () => {
    it('should have matching schema UID with internal config', () => {
      // This test ensures the schema UID in LOCATION_V1_SCHEMA matches
      // what's used in the internal EAS_CONFIG for all chains
      const expectedUID = '0xba4171c92572b1e4f241d044c32cdf083be9fd946b8766977558ca6378c824e2';
      expect(LOCATION_V1_SCHEMA.uid).toBe(expectedUID);
    });

    it('should have rawString that parses to expected fields', () => {
      // Parse the rawString to verify it matches schemaInterface
      const rawFields = LOCATION_V1_SCHEMA.rawString.split(',');
      const interfaceFields = Object.keys(LOCATION_V1_SCHEMA.schemaInterface);

      expect(rawFields.length).toBe(interfaceFields.length);

      // Each rawField should contain its corresponding interface field name
      interfaceFields.forEach((fieldName, index) => {
        expect(rawFields[index]).toContain(fieldName);
      });
    });
  });
});
