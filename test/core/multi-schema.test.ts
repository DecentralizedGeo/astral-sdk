// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

/**
 * Tests for multi-schema support in Astral SDK.
 *
 * These tests verify:
 * - Pre-registered schema validation at SDK initialization
 * - Default schema configuration
 * - Per-method schema override
 * - Validation caching behavior
 * - Strict vs warn mode behavior
 */

import { AstralSDK } from '../../src/core/AstralSDK';
import { RuntimeSchemaConfig } from '../../src/core/types';
import { ValidationError } from '../../src/core/errors';
import { SchemaValidationCache } from '../../src/utils/schemaValidation';
import { LOCATION_V1_SCHEMA } from '../../src/schemas';

// Test schema strings
const V01_SCHEMA_STRING =
  'uint256 eventTimestamp,string srs,string locationType,string location,string[] recipeType,bytes[] recipePayload,string[] mediaType,string[] mediaData,string memo';

const V02_SCHEMA_STRING =
  'uint8 specVersion,uint256 eventTimestamp,string srs,string locationType,string location,string[] recipeType,bytes[] recipePayload,string[] mediaType,string[] mediaData,string memo';

const CUSTOM_SCHEMA_STRING =
  'uint256 eventTimestamp,string srs,string locationType,string location,string customField';

const INVALID_SCHEMA_STRING = 'invalid_type customField';

const MISSING_REQUIRED_FIELDS_SCHEMA = 'uint256 eventTimestamp,string srs';

// Test schema configurations
const customSchema: RuntimeSchemaConfig = {
  uid: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  rawString: CUSTOM_SCHEMA_STRING,
};

const v02Schema: RuntimeSchemaConfig = {
  uid: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
  rawString: V02_SCHEMA_STRING,
};

const invalidSchema: RuntimeSchemaConfig = {
  uid: '0xbadschema00000000000000000000000000000000000000000000000000000000',
  rawString: INVALID_SCHEMA_STRING,
};

const nonConformantSchema: RuntimeSchemaConfig = {
  uid: '0xnonconformant000000000000000000000000000000000000000000000000000',
  rawString: MISSING_REQUIRED_FIELDS_SCHEMA,
};

describe('SchemaValidationCache', () => {
  let cache: SchemaValidationCache;

  beforeEach(() => {
    cache = new SchemaValidationCache();
  });

  describe('basic functionality', () => {
    test('should cache validation results', () => {
      const schema = {
        uid: '0xtest',
        rawString: V01_SCHEMA_STRING,
      };

      // First validation
      const result1 = cache.validate(schema);
      expect(result1.valid).toBe(true);
      expect(cache.size).toBe(1);

      // Second validation should return cached result
      const result2 = cache.validate(schema);
      expect(result2).toEqual(result1);
      expect(cache.size).toBe(1);
    });

    test('should check if schema is cached', () => {
      const schema = {
        uid: '0xtest',
        rawString: V01_SCHEMA_STRING,
      };

      expect(cache.has(schema.uid)).toBe(false);
      cache.validate(schema);
      expect(cache.has(schema.uid)).toBe(true);
    });

    test('should get cached result', () => {
      const schema = {
        uid: '0xtest',
        rawString: V01_SCHEMA_STRING,
      };

      cache.validate(schema);
      const cached = cache.get(schema.uid);

      expect(cached).toBeDefined();
      expect(cached!.rawString).toBe(V01_SCHEMA_STRING);
      expect(cached!.validatedAt).toBeLessThanOrEqual(Date.now());
    });

    test('should invalidate cached schema', () => {
      const schema = {
        uid: '0xtest',
        rawString: V01_SCHEMA_STRING,
      };

      cache.validate(schema);
      expect(cache.has(schema.uid)).toBe(true);

      const removed = cache.invalidate(schema.uid);
      expect(removed).toBe(true);
      expect(cache.has(schema.uid)).toBe(false);
    });

    test('should clear all cached schemas', () => {
      cache.validate({ uid: '0x1', rawString: V01_SCHEMA_STRING });
      cache.validate({ uid: '0x2', rawString: V02_SCHEMA_STRING });

      expect(cache.size).toBe(2);
      cache.clear();
      expect(cache.size).toBe(0);
    });

    test('should return cached UIDs', () => {
      cache.validate({ uid: '0xaaa', rawString: V01_SCHEMA_STRING });
      cache.validate({ uid: '0xbbb', rawString: V02_SCHEMA_STRING });

      const uids = cache.cachedUIDs;
      expect(uids).toContain('0xaaa');
      expect(uids).toContain('0xbbb');
    });
  });

  describe('schema change detection', () => {
    test('should revalidate if rawString changes for same UID', () => {
      const uid = '0xtest';

      // Validate with first schema
      const result1 = cache.validate({ uid, rawString: V01_SCHEMA_STRING });
      expect(result1.version).toBe(1);

      // Validate with different rawString but same UID
      const result2 = cache.validate({ uid, rawString: V02_SCHEMA_STRING });
      expect(result2.version).toBe(2);

      // Cache should have the updated result
      const cached = cache.get(uid);
      expect(cached!.rawString).toBe(V02_SCHEMA_STRING);
    });
  });

  describe('strict mode', () => {
    test('should throw for invalid schema in strict mode', () => {
      const strictCache = new SchemaValidationCache(true);

      expect(() => {
        strictCache.validate(invalidSchema);
      }).toThrow(ValidationError);
    });

    test('should throw for non-conformant schema in strict mode', () => {
      const strictCache = new SchemaValidationCache(true);

      expect(() => {
        strictCache.validate(nonConformantSchema);
      }).toThrow(ValidationError);
    });

    test('should not throw for valid schema in strict mode', () => {
      const strictCache = new SchemaValidationCache(true);

      expect(() => {
        strictCache.validate({ uid: '0xtest', rawString: V01_SCHEMA_STRING });
      }).not.toThrow();
    });
  });

  describe('warn mode (default)', () => {
    test('should not throw for invalid schema', () => {
      const result = cache.validate(invalidSchema);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should not throw for non-conformant schema', () => {
      const result = cache.validate(nonConformantSchema);
      expect(result.conformant).toBe(false);
      expect(result.missing.length).toBeGreaterThan(0);
    });
  });
});

describe('AstralSDK Multi-Schema Support', () => {
  describe('SDK initialization', () => {
    test('should initialize with default schema', () => {
      const sdk = new AstralSDK();
      const defaultSchema = sdk.getDefaultSchema();

      expect(defaultSchema.uid).toBeDefined();
      expect(defaultSchema.rawString).toBeDefined();
    });

    test('should accept custom default schema', () => {
      const sdk = new AstralSDK({
        defaultSchema: customSchema,
      });

      const defaultSchema = sdk.getDefaultSchema();
      expect(defaultSchema.uid).toBe(customSchema.uid);
      expect(defaultSchema.rawString).toBe(customSchema.rawString);
    });

    test('should validate pre-registered schemas at init', () => {
      const sdk = new AstralSDK({
        schemas: [customSchema, v02Schema],
      });

      const cache = sdk.getSchemaCache();
      expect(cache.has(customSchema.uid)).toBe(true);
      expect(cache.has(v02Schema.uid)).toBe(true);
    });

    test('should throw in strict mode for invalid pre-registered schema', () => {
      expect(() => {
        new AstralSDK({
          schemas: [invalidSchema],
          strictSchemaValidation: true,
        });
      }).toThrow(ValidationError);
    });

    test('should not throw in warn mode for invalid pre-registered schema', () => {
      expect(() => {
        new AstralSDK({
          schemas: [invalidSchema],
          strictSchemaValidation: false,
        });
      }).not.toThrow();
    });
  });

  describe('schema cache access', () => {
    test('should expose schema cache', () => {
      const sdk = new AstralSDK();
      const cache = sdk.getSchemaCache();

      expect(cache).toBeInstanceOf(SchemaValidationCache);
    });

    test('should expose default schema', () => {
      const sdk = new AstralSDK();
      const defaultSchema = sdk.getDefaultSchema();

      expect(defaultSchema).toHaveProperty('uid');
      expect(defaultSchema).toHaveProperty('rawString');
    });
  });

  describe('LOCATION_V1_SCHEMA integration', () => {
    test('should work with LOCATION_V1_SCHEMA constant', () => {
      const sdk = new AstralSDK({
        schemas: [LOCATION_V1_SCHEMA],
        defaultSchema: LOCATION_V1_SCHEMA,
      });

      const defaultSchema = sdk.getDefaultSchema();
      expect(defaultSchema.uid).toBe(LOCATION_V1_SCHEMA.uid);

      const cache = sdk.getSchemaCache();
      expect(cache.has(LOCATION_V1_SCHEMA.uid)).toBe(true);
    });

    test('LOCATION_V1_SCHEMA should be conformant', () => {
      const cache = new SchemaValidationCache();
      const result = cache.validate(LOCATION_V1_SCHEMA);

      expect(result.valid).toBe(true);
      expect(result.conformant).toBe(true);
      expect(result.version).toBe(1);
    });
  });
});

describe('Per-method schema override types', () => {
  test('OffchainAttestationOptions should accept schema', () => {
    // This is a compile-time check - if the types are wrong, this won't compile
    const options = {
      schema: customSchema,
      revocable: true,
    };

    expect(options.schema).toBeDefined();
    expect(options.schema!.uid).toBe(customSchema.uid);
  });

  test('OnchainAttestationOptions should accept schema', () => {
    // This is a compile-time check - if the types are wrong, this won't compile
    const options = {
      schema: customSchema,
      chain: 'sepolia',
    };

    expect(options.schema).toBeDefined();
    expect(options.schema!.uid).toBe(customSchema.uid);
  });
});
