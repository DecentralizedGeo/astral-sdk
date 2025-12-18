// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

/**
 * Tests for the schema validation utility.
 *
 * These tests verify Location Protocol schema validation,
 * including v0.1/v0.2 detection, conformance checking, and error handling.
 */

import {
  validateLocationProtocolSchema,
  parseSchemaString,
  isLocationProtocolV2,
  getSchemaFieldNames,
} from '../../src/utils/schemaValidation';
import { ValidationError } from '../../src/core/errors';

// Test schema strings
const V01_SCHEMA =
  'uint256 eventTimestamp,string srs,string locationType,string location,string[] recipeType,bytes[] recipePayload,string[] mediaType,string[] mediaData,string memo';

const V02_SCHEMA = 'uint8 specVersion,string srs,string locationType,string location,string memo';

const V02_FULL_SCHEMA =
  'uint8 specVersion,uint256 eventTimestamp,string srs,string locationType,string location,string[] recipeType,bytes[] recipePayload,string[] mediaType,string[] mediaData,string memo';

const MINIMAL_V02_SCHEMA = 'uint8 specVersion,string srs,string locationType,string location';

const MINIMAL_V01_SCHEMA = 'string srs,string locationType,string location';

describe('parseSchemaString', () => {
  test('should parse valid schema strings', () => {
    const fields = parseSchemaString('uint256 eventTimestamp,string srs');
    expect(fields).not.toBeNull();
    expect(fields).toHaveLength(2);
    expect(fields![0]).toEqual({ type: 'uint256', name: 'eventTimestamp' });
    expect(fields![1]).toEqual({ type: 'string', name: 'srs' });
  });

  test('should parse schema with array types', () => {
    const fields = parseSchemaString('string[] mediaType,bytes[] recipePayload');
    expect(fields).not.toBeNull();
    expect(fields).toHaveLength(2);
    expect(fields![0]).toEqual({ type: 'string[]', name: 'mediaType' });
    expect(fields![1]).toEqual({ type: 'bytes[]', name: 'recipePayload' });
  });

  test('should parse single field schema', () => {
    const fields = parseSchemaString('string memo');
    expect(fields).not.toBeNull();
    expect(fields).toHaveLength(1);
    expect(fields![0]).toEqual({ type: 'string', name: 'memo' });
  });

  test('should handle whitespace variations', () => {
    const fields = parseSchemaString('  uint256   eventTimestamp  ,  string   srs  ');
    expect(fields).not.toBeNull();
    expect(fields).toHaveLength(2);
    expect(fields![0].name).toBe('eventTimestamp');
    expect(fields![1].name).toBe('srs');
  });

  test('should return null for empty strings', () => {
    expect(parseSchemaString('')).toBeNull();
    expect(parseSchemaString('   ')).toBeNull();
  });

  test('should return null for invalid input types', () => {
    expect(parseSchemaString(null as unknown as string)).toBeNull();
    expect(parseSchemaString(undefined as unknown as string)).toBeNull();
    expect(parseSchemaString(123 as unknown as string)).toBeNull();
  });

  test('should return null for malformed field definitions', () => {
    // Missing type
    expect(parseSchemaString('eventTimestamp')).toBeNull();
    // Too many parts
    expect(parseSchemaString('uint256 event Timestamp')).toBeNull();
    // Empty field
    expect(parseSchemaString('uint256 eventTimestamp,,string srs')).toBeNull();
  });
});

describe('validateLocationProtocolSchema', () => {
  describe('version detection', () => {
    test('should detect v0.1 schema (no specVersion)', () => {
      const result = validateLocationProtocolSchema(V01_SCHEMA);
      expect(result.version).toBe(1);
    });

    test('should detect v0.2 schema (has specVersion)', () => {
      const result = validateLocationProtocolSchema(V02_SCHEMA);
      expect(result.version).toBe(2);
    });

    test('should detect v0.2 for full schema with specVersion', () => {
      const result = validateLocationProtocolSchema(V02_FULL_SCHEMA);
      expect(result.version).toBe(2);
    });
  });

  describe('v0.1 conformance', () => {
    test('should validate minimal v0.1 conformant schema', () => {
      const result = validateLocationProtocolSchema(MINIMAL_V01_SCHEMA);
      expect(result.valid).toBe(true);
      expect(result.version).toBe(1);
      expect(result.conformant).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    test('should validate full v0.1 schema', () => {
      const result = validateLocationProtocolSchema(V01_SCHEMA);
      expect(result.valid).toBe(true);
      expect(result.version).toBe(1);
      expect(result.conformant).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    test('should identify missing required fields for v0.1', () => {
      const result = validateLocationProtocolSchema('string srs,string locationType');
      expect(result.valid).toBe(true);
      expect(result.version).toBe(1);
      expect(result.conformant).toBe(false);
      expect(result.missing).toContain('location');
    });

    test('should add warning for v0.1 schemas', () => {
      const result = validateLocationProtocolSchema(MINIMAL_V01_SCHEMA);
      expect(result.warnings.some(w => w.includes('v0.1') && w.includes('legacy'))).toBe(true);
    });
  });

  describe('v0.2 conformance', () => {
    test('should validate minimal v0.2 conformant schema', () => {
      const result = validateLocationProtocolSchema(MINIMAL_V02_SCHEMA);
      expect(result.valid).toBe(true);
      expect(result.version).toBe(2);
      expect(result.conformant).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    test('should validate full v0.2 schema', () => {
      const result = validateLocationProtocolSchema(V02_FULL_SCHEMA);
      expect(result.valid).toBe(true);
      expect(result.version).toBe(2);
      expect(result.conformant).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    test('should identify missing required fields for v0.2', () => {
      // Has specVersion but missing location
      const result = validateLocationProtocolSchema(
        'uint8 specVersion,string srs,string locationType'
      );
      expect(result.valid).toBe(true);
      expect(result.version).toBe(2);
      expect(result.conformant).toBe(false);
      expect(result.missing).toContain('location');
    });

    test('should not add v0.1 legacy warning for v0.2 schemas', () => {
      const result = validateLocationProtocolSchema(MINIMAL_V02_SCHEMA);
      expect(result.warnings.some(w => w.includes('v0.1') && w.includes('legacy'))).toBe(false);
    });
  });

  describe('type validation', () => {
    test('should warn when specVersion is not uint8', () => {
      const result = validateLocationProtocolSchema(
        'uint256 specVersion,string srs,string locationType,string location'
      );
      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.includes('specVersion') && w.includes('uint8'))).toBe(
        true
      );
    });

    test('should warn when srs is not string', () => {
      const result = validateLocationProtocolSchema(
        'uint8 specVersion,bytes32 srs,string locationType,string location'
      );
      expect(result.valid).toBe(true);
      expect(result.warnings.some(w => w.includes('srs') && w.includes('string'))).toBe(true);
    });

    test('should reject invalid Solidity types', () => {
      const result = validateLocationProtocolSchema('invalidType field,string srs');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid Solidity type'))).toBe(true);
    });

    test('should accept all valid base Solidity types', () => {
      const types = [
        'uint8',
        'uint16',
        'uint32',
        'uint64',
        'uint128',
        'uint256',
        'int8',
        'int16',
        'int32',
        'int64',
        'int128',
        'int256',
        'address',
        'bool',
        'string',
        'bytes',
        'bytes1',
        'bytes2',
        'bytes4',
        'bytes8',
        'bytes16',
        'bytes32',
      ];

      for (const type of types) {
        const result = validateLocationProtocolSchema(`${type} testField`);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }
    });

    test('should accept array types', () => {
      const result = validateLocationProtocolSchema('string[] names,uint256[] values,bytes[] data');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('field name validation', () => {
    test('should accept valid Solidity identifiers', () => {
      const result = validateLocationProtocolSchema(
        'string validName,string _underscore,string camelCase'
      );
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid field names', () => {
      const result = validateLocationProtocolSchema('string 123invalid');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid field name'))).toBe(true);
    });

    test('should reject field names starting with numbers', () => {
      const result = validateLocationProtocolSchema('string 1field');
      expect(result.valid).toBe(false);
    });

    test('should detect duplicate field names', () => {
      const result = validateLocationProtocolSchema('string srs,string location,string srs');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Duplicate field names'))).toBe(true);
    });
  });

  describe('format validation', () => {
    test('should reject empty schema', () => {
      const result = validateLocationProtocolSchema('');
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid schema format'))).toBe(true);
    });

    test('should reject whitespace-only schema', () => {
      const result = validateLocationProtocolSchema('   ');
      expect(result.valid).toBe(false);
    });

    test('should reject malformed fields', () => {
      const result = validateLocationProtocolSchema('string');
      expect(result.valid).toBe(false);
    });
  });

  describe('strict mode', () => {
    test('should throw ValidationError for invalid schema in strict mode', () => {
      expect(() => {
        validateLocationProtocolSchema('invalid', { strict: true });
      }).toThrow(ValidationError);
    });

    test('should throw ValidationError for non-conformant schema in strict mode', () => {
      expect(() => {
        validateLocationProtocolSchema('string onlyOneField', { strict: true });
      }).toThrow(ValidationError);
    });

    test('should include context in ValidationError', () => {
      try {
        validateLocationProtocolSchema('string srs', { strict: true });
        fail('Expected ValidationError to be thrown');
      } catch (e) {
        expect(e).toBeInstanceOf(ValidationError);
        const error = e as ValidationError;
        expect(error.context).toBeDefined();
        expect(error.context!.missing).toBeDefined();
      }
    });

    test('should not throw for valid conformant schema in strict mode', () => {
      expect(() => {
        validateLocationProtocolSchema(MINIMAL_V02_SCHEMA, { strict: true });
      }).not.toThrow();
    });
  });

  describe('result structure', () => {
    test('should return readonly arrays', () => {
      const result = validateLocationProtocolSchema(V01_SCHEMA);

      // TypeScript should enforce these are readonly, but we verify the structure
      expect(Array.isArray(result.missing)).toBe(true);
      expect(Array.isArray(result.errors)).toBe(true);
      expect(Array.isArray(result.warnings)).toBe(true);
      expect(Array.isArray(result.fields)).toBe(true);
    });

    test('should include parsed fields in result', () => {
      const result = validateLocationProtocolSchema('string srs,string location');
      expect(result.fields).toHaveLength(2);
      expect(result.fields[0]).toEqual({ type: 'string', name: 'srs' });
      expect(result.fields[1]).toEqual({ type: 'string', name: 'location' });
    });
  });
});

describe('isLocationProtocolV2', () => {
  test('should return true for v0.2 schemas', () => {
    expect(isLocationProtocolV2(V02_SCHEMA)).toBe(true);
    expect(isLocationProtocolV2(V02_FULL_SCHEMA)).toBe(true);
    expect(isLocationProtocolV2(MINIMAL_V02_SCHEMA)).toBe(true);
  });

  test('should return false for v0.1 schemas', () => {
    expect(isLocationProtocolV2(V01_SCHEMA)).toBe(false);
    expect(isLocationProtocolV2(MINIMAL_V01_SCHEMA)).toBe(false);
  });

  test('should return false for invalid schemas', () => {
    expect(isLocationProtocolV2('')).toBe(false);
    expect(isLocationProtocolV2('invalid')).toBe(false);
  });
});

describe('getSchemaFieldNames', () => {
  test('should return field names for valid schema', () => {
    const names = getSchemaFieldNames('uint256 a,string b,bytes c');
    expect(names).toEqual(['a', 'b', 'c']);
  });

  test('should return empty array for invalid schema', () => {
    expect(getSchemaFieldNames('')).toEqual([]);
    expect(getSchemaFieldNames('invalid')).toEqual([]);
  });

  test('should extract names from complex schema', () => {
    const names = getSchemaFieldNames(V01_SCHEMA);
    expect(names).toContain('eventTimestamp');
    expect(names).toContain('srs');
    expect(names).toContain('locationType');
    expect(names).toContain('location');
    expect(names).toContain('memo');
    expect(names).toHaveLength(9);
  });
});

describe('integration with actual EAS schemas', () => {
  test('should validate the actual v0.1 Location Protocol schema', () => {
    // This is the actual schema deployed on-chain
    const actualSchema =
      'uint256 eventTimestamp,string srs,string locationType,string location,string[] recipeType,bytes[] recipePayload,string[] mediaType,string[] mediaData,string memo';

    const result = validateLocationProtocolSchema(actualSchema);

    expect(result.valid).toBe(true);
    expect(result.version).toBe(1);
    expect(result.conformant).toBe(true);
    expect(result.fields).toHaveLength(9);
  });

  test('should handle schema with custom fields', () => {
    // Custom schema that extends Location Protocol
    const customSchema =
      'uint8 specVersion,string srs,string locationType,string location,string parcelId,uint256 area,address owner';

    const result = validateLocationProtocolSchema(customSchema);

    expect(result.valid).toBe(true);
    expect(result.version).toBe(2);
    expect(result.conformant).toBe(true);
    expect(result.fields).toHaveLength(7);
  });
});
