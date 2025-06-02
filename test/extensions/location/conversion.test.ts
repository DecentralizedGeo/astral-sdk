/**
 * Tests for the location format conversion functions.
 *
 * These tests verify that the conversion between location formats properly handles
 * coordinate preservation and throws appropriate errors.
 */

import { convertLocationFormat } from '../../../src/extensions/location';
import { geoJSONExtension } from '../../../src/extensions/location/builtins/GeoJSON';
import { BaseExtension, LocationTypeExtension } from '../../../src/extensions/types';
import { ExtensionError, LocationValidationError } from '../../../src/core/errors';
import { Feature, Geometry } from 'geojson';

// Create a mock location extension for testing
class MockLocationExtension extends BaseExtension implements LocationTypeExtension {
  readonly id = 'astral:location:mock';
  readonly name = 'Mock Location Format';
  readonly description = 'A mock location format for testing.';
  readonly locationType = 'mock';

  validate(): boolean {
    return true;
  }

  validateLocation(location: unknown): boolean {
    return typeof location === 'object' && location !== null && 'mockLocation' in location;
  }

  locationToString(location: unknown): string {
    if (!this.validateLocation(location)) {
      throw new LocationValidationError('Invalid mock location data');
    }
    return JSON.stringify(location);
  }

  locationToGeoJSON(location: unknown): Feature | Geometry {
    if (!this.validateLocation(location)) {
      throw new LocationValidationError('Invalid mock location data');
    }
    // Convert mock location to GeoJSON
    return {
      type: 'Point',
      coordinates: [10, 20] // Fixed coordinates for testing
    };
  }

  parseLocationString(locationString: string): unknown {
    try {
      const parsed = JSON.parse(locationString);
      if ('type' in parsed && parsed.type === 'Point') {
        // Convert from GeoJSON to mock
        return {
          mockLocation: true,
          coords: parsed.coordinates
        };
      }
      throw new LocationValidationError('Invalid GeoJSON for mock format');
    } catch (error) {
      if (error instanceof LocationValidationError) {
        throw error;
      }
      throw new LocationValidationError('Failed to parse mock location string');
    }
  }
}

// Create a mock extension that modifies coordinates during conversion
class CoordinateModifyingExtension extends BaseExtension implements LocationTypeExtension {
  readonly id = 'astral:location:modifying';
  readonly name = 'Coordinate Modifying Format';
  readonly description = 'A format that modifies coordinates during conversion.';
  readonly locationType = 'modifying';

  validate(): boolean {
    return true;
  }

  validateLocation(location: unknown): boolean {
    return typeof location === 'object' && location !== null && 'modifyingFormat' in location;
  }

  locationToString(location: unknown): string {
    if (!this.validateLocation(location)) {
      throw new LocationValidationError('Invalid modifying format data');
    }
    return JSON.stringify(location);
  }

  locationToGeoJSON(location: unknown): Feature | Geometry {
    if (!this.validateLocation(location)) {
      throw new LocationValidationError('Invalid modifying format data');
    }
    // Convert to GeoJSON with slightly modified coordinates (simulate precision loss)
    return {
      type: 'Point',
      coordinates: [10.000001, 20.000001] // Modified coordinates
    };
  }

  parseLocationString(locationString: string): unknown {
    try {
      const parsed = JSON.parse(locationString);
      if ('type' in parsed && parsed.type === 'Point') {
        // Convert from GeoJSON with slightly modified coordinates
        return {
          modifyingFormat: true,
          coords: [parsed.coordinates[0] + 0.000001, parsed.coordinates[1] + 0.000001]
        };
      }
      throw new LocationValidationError('Invalid GeoJSON for modifying format');
    } catch (error) {
      if (error instanceof LocationValidationError) {
        throw error;
      }
      throw new LocationValidationError('Failed to parse modifying format string');
    }
  }
}

describe('Location Format Conversion', () => {
  // Create test extensions
  const mockExtension = new MockLocationExtension();
  const modifyingExtension = new CoordinateModifyingExtension();
  
  // Test data
  const mockLocation = { mockLocation: true, coords: [10, 20] };
  const modifyingLocation = { modifyingFormat: true, coords: [10, 20] };

  test('should convert between GeoJSON and mock format', () => {
    // Mock format -> GeoJSON
    const geoJSON = convertLocationFormat(
      mockLocation,
      'mock',
      'geojson',
      [geoJSONExtension, mockExtension]
    );
    
    expect(geoJSON).toEqual({
      type: 'Point',
      coordinates: [10, 20]
    });

    // GeoJSON -> Mock format
    const backToMock = convertLocationFormat(
      geoJSON,
      'geojson',
      'mock',
      [geoJSONExtension, mockExtension]
    );
    
    expect(backToMock).toEqual({
      mockLocation: true,
      coords: [10, 20]
    });
  });

  test('should throw ExtensionError for unknown format', () => {
    expect(() => {
      convertLocationFormat(
        mockLocation,
        'mock',
        'unknown',
        [geoJSONExtension, mockExtension]
      );
    }).toThrow(ExtensionError);

    expect(() => {
      convertLocationFormat(
        mockLocation,
        'unknown',
        'geojson',
        [geoJSONExtension, mockExtension]
      );
    }).toThrow(ExtensionError);
  });

  test('should detect and warn about coordinate modifications', () => {
    // Mock console.warn to track warnings
    const originalWarn = console.warn;
    const mockWarn = jest.fn();
    console.warn = mockWarn;

    try {
      // Convert from modifying format to mock format
      convertLocationFormat(
        modifyingLocation,
        'modifying',
        'mock',
        [geoJSONExtension, mockExtension, modifyingExtension]
      );
      
      // Verify warning was issued
      expect(mockWarn).toHaveBeenCalled();
      expect(mockWarn.mock.calls[0][0]).toContain('Coordinate values changed');
    } finally {
      // Restore console.warn
      console.warn = originalWarn;
    }
  });

  test('should pass through when source and target are the same', () => {
    const result = convertLocationFormat(
      mockLocation,
      'mock',
      'mock',
      [geoJSONExtension, mockExtension]
    );
    
    expect(result).toBe(mockLocation); // Should be the same object reference
  });

  test('should handle conversion errors gracefully', () => {
    // Create an invalid location that will fail validation
    const invalidLocation = { invalid: true };
    
    expect(() => {
      convertLocationFormat(
        invalidLocation,
        'mock',
        'geojson',
        [geoJSONExtension, mockExtension]
      );
    }).toThrow(LocationValidationError);
  });
});