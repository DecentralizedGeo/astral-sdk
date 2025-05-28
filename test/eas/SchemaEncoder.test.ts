/**
 * Tests for SchemaEncoder
 */

import fs from 'fs';
import { SchemaEncoder } from '../../src/eas/SchemaEncoder';
import { ValidationError } from '../../src/core/errors';

// Mock fs module for tests
jest.mock('fs');

// Mock path module for tests
jest.mock('path', () => ({
  ...jest.requireActual('path'),
  resolve: jest.fn().mockImplementation((...args) => {
    // Handle the specific path we want for testing
    if (args.includes('mock-config.json') || args.includes('EAS-config.json')) {
      return '/mock-config-path';
    }
    return jest.requireActual('path').resolve(...args);
  }),
}));

// Create a mock EAS config JSON with test schemas
const mockConfig = {
  'v0.1': {
    schema: {
      interface: {
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
      rawString:
        'uint256 eventTimestamp,string srs,string locationType,string location,string[] recipeType,bytes[] recipePayload,string[] mediaType,string[] mediaData,string memo',
    },
  },
};

// Mock the Node.js environment for testing
process.env.NODE_ENV = 'test';

describe('SchemaEncoder', () => {
  // Reset module cache before each test
  beforeEach(() => {
    jest.resetModules();
    // Reset mocks
    jest.clearAllMocks();
    // Mock fs.readFileSync to return our test config
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockConfig));
  });

  describe('constructor', () => {
    it('should create a SchemaEncoder from a schema string', () => {
      const schema = 'uint256 eventTimestamp,string srs,string locationType,string location';
      const encoder = new SchemaEncoder(schema);

      expect(encoder.getSchema()).toBe(schema);
    });

    it('should create a SchemaEncoder from a version', () => {
      const encoder = new SchemaEncoder('v0.1');

      expect(encoder.getSchema()).toBe(mockConfig['v0.1'].schema.rawString);
    });

    it('should throw ValidationError for an invalid schema string', () => {
      const invalidSchema = 'invalidSchemaFormat';

      expect(() => new SchemaEncoder(invalidSchema)).toThrow(ValidationError);
    });

    it('should throw ValidationError for a non-existent version', () => {
      expect(() => new SchemaEncoder('v9.9')).toThrow(ValidationError);
    });
  });

  describe('getSchemaInterface', () => {
    it('should return the schema interface for a schema string', () => {
      const schema = 'uint256 eventTimestamp,string srs';
      const encoder = new SchemaEncoder(schema);

      expect(encoder.getSchemaInterface()).toEqual({
        eventTimestamp: 'uint256',
        srs: 'string',
      });
    });

    it('should return the schema interface for a version', () => {
      const encoder = new SchemaEncoder('v0.1');

      expect(encoder.getSchemaInterface()).toEqual(mockConfig['v0.1'].schema.interface);
    });
  });

  describe('isSchemaValid', () => {
    it('should return true for a valid schema string', () => {
      const validSchema = 'uint256 eventTimestamp,string srs,string locationType';

      expect(SchemaEncoder.isSchemaValid(validSchema)).toBe(true);
    });

    it('should return false for an invalid schema string', () => {
      const invalidSchema = 'invalidSchemaFormat';

      expect(SchemaEncoder.isSchemaValid(invalidSchema)).toBe(false);
    });
  });

  describe('isEncodedDataValid', () => {
    it('should return false for invalid encoded data', () => {
      const schema = 'uint256 eventTimestamp,string srs';
      const encoder = new SchemaEncoder(schema);

      expect(encoder.isEncodedDataValid('0xinvalidData')).toBe(false);
    });
  });
});
