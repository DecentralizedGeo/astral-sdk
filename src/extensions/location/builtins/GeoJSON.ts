/**
 * GeoJSON Format Extension
 *
 * Provides support for GeoJSON format in location proofs.
 * This extension handles all GeoJSON types as defined in the GeoJSON specification (RFC 7946):
 * - Point
 * - LineString
 * - Polygon
 * - MultiPoint
 * - MultiLineString
 * - MultiPolygon
 * - GeometryCollection
 * - Feature
 * - FeatureCollection
 *
 * GeoJSON serves as the central "hub" format in Astral SDK, with all other formats
 * converting to/from GeoJSON for interoperability.
 */

import { BaseExtension, LocationTypeExtension } from '../../types';
import { LocationValidationError } from '../../../core/errors';

// Import only the specific Turf.js functions we need instead of the entire library
import * as turf from '@turf/turf'; // Temporarily revert back to the full import until we can fix the dependency issues
import { Feature, FeatureCollection, Geometry, GeometryCollection, Position } from 'geojson';

/**
 * Type guard for any GeoJSON object
 */
export function isGeoJSON(obj: unknown): obj is Feature | FeatureCollection | Geometry {
  if (!obj || typeof obj !== 'object') return false;

  // Check for Feature type
  if ('type' in obj && 'properties' in obj && 'geometry' in obj) {
    return (obj as Feature).type === 'Feature';
  }

  // Check for FeatureCollection type
  if ('type' in obj && 'features' in obj) {
    return (obj as FeatureCollection).type === 'FeatureCollection';
  }

  // Check for Geometry types
  if ('type' in obj && 'coordinates' in obj) {
    const geoType = (obj as Geometry).type;
    return [
      'Point',
      'LineString',
      'Polygon',
      'MultiPoint',
      'MultiLineString',
      'MultiPolygon',
    ].includes(geoType);
  }

  // Check for GeometryCollection
  if ('type' in obj && 'geometries' in obj) {
    return (obj as GeometryCollection).type === 'GeometryCollection';
  }

  return false;
}

/**
 * Checks if a coordinate value is within valid longitude range [-180, 180]
 *
 * @param value - The longitude value to check
 * @returns True if the value is within valid longitude range
 */
export function isValidLongitude(value: number): boolean {
  return !isNaN(value) && value >= -180 && value <= 180;
}

/**
 * Checks if a coordinate value is within valid latitude range [-90, 90]
 *
 * @param value - The latitude value to check
 * @returns True if the value is within valid latitude range
 */
export function isValidLatitude(value: number): boolean {
  return !isNaN(value) && value >= -90 && value <= 90;
}

/**
 * Type guard for a Position array [longitude, latitude, (elevation?)]
 *
 * According to the GeoJSON specification (RFC 7946):
 * - Position is represented as an array of numbers
 * - First element is longitude (between -180 and 180)
 * - Second element is latitude (between -90 and 90)
 * - Optional third element is elevation or altitude
 *
 * @param arr - The array to check
 * @returns True if the array is a valid GeoJSON Position
 */
export function isPosition(arr: unknown): arr is Position {
  return (
    Array.isArray(arr) &&
    (arr.length === 2 || arr.length === 3) &&
    typeof arr[0] === 'number' &&
    typeof arr[1] === 'number' &&
    (arr.length === 2 || typeof arr[2] === 'number') &&
    isValidLongitude(arr[0]) &&
    isValidLatitude(arr[1])
  );
}

/**
 * GeoJSONExtension implements the LocationTypeExtension interface for GeoJSON data.
 *
 * This extension serves as the core location format for Astral, as all other formats
 * will convert to/from GeoJSON for interoperability.
 */
export class GeoJSONExtension extends BaseExtension implements LocationTypeExtension {
  readonly id = 'astral:location:geojson';
  readonly name = 'GeoJSON';
  readonly description = 'Handles all GeoJSON formats (Point, LineString, Polygon, etc.)';
  readonly locationType = 'geojson';

  /**
   * Validates that the extension is properly configured.
   *
   * @returns True if the extension is valid
   */
  validate(): boolean {
    return true;
  }

  /**
   * Validates GeoJSON data.
   *
   * GeoJSON validation includes:
   * - Structure validation (correct type and required properties)
   * - Semantic validation (e.g., Polygon rings must be closed)
   * - Coordinate range validation (longitude: [-180, 180], latitude: [-90, 90])
   *
   * @param location - The GeoJSON data to validate
   * @returns True if the data is valid GeoJSON
   */
  validateLocation(location: unknown): boolean {
    try {
      if (!isGeoJSON(location)) {
        return false;
      }

      // Try to validate using structure and coordinate values
      try {
        // Check for Polygon-specific validity (closed rings)
        if ('type' in location && location.type === 'Polygon' && 'coordinates' in location) {
          const polygonCoords = (location as { coordinates: Position[][] }).coordinates;
          if (Array.isArray(polygonCoords)) {
            // Each ring must close (first and last coordinates must be identical)
            for (const ring of polygonCoords) {
              if (!Array.isArray(ring) || ring.length < 4) return false;

              // Check if the first and last points are the same
              const first = ring[0];
              const last = ring[ring.length - 1];
              if (!this.arePositionsEqual(first, last)) {
                return false;
              }

              // Validate coordinate ranges
              for (const pos of ring) {
                if (!isPosition(pos)) return false;
              }
            }
          }
        }

        // General GeoJSON validation
        if (isGeoJSON(location)) {
          // Validate using Turf.js for structural validity
          // booleanValid only accepts Geometry or Feature, not FeatureCollection
          if (location.type === 'FeatureCollection') {
            // Check each feature in the collection
            const fc = location as FeatureCollection;
            for (const feature of fc.features) {
              if (!turf.booleanValid(feature)) {
                return false;
              }
            }
          } else {
            // For Geometry and Feature objects
            if (!turf.booleanValid(location as Geometry | Feature)) {
              return false;
            }
          }

          // Get all coordinates and check their ranges
          const allCoords = this.getAllCoordinates(location);
          for (const coord of allCoords) {
            if (!isValidLongitude(coord[0]) || !isValidLatitude(coord[1])) {
              return false;
            }
          }
        }
        return true;
      } catch (error) {
        return false;
      }
    } catch (error) {
      return false;
    }
  }

  /**
   * Converts GeoJSON data to a canonical string representation.
   *
   * @param location - The GeoJSON data to convert
   * @returns A canonical string representation of the GeoJSON data
   * @throws LocationValidationError if the input is not valid GeoJSON
   */
  locationToString(location: unknown): string {
    if (!this.validateLocation(location)) {
      throw new LocationValidationError('Invalid GeoJSON data', undefined, {
        locationType: this.locationType,
        data: location,
      });
    }

    // JSON.stringify ensures a canonical representation
    return JSON.stringify(location);
  }

  /**
   * Returns the GeoJSON object as-is.
   *
   * Since this extension already works with GeoJSON, this method is a pass-through
   * that validates the input GeoJSON and returns it.
   *
   * @param location - The GeoJSON data
   * @returns The same GeoJSON object as Feature, FeatureCollection, or Geometry
   * @throws LocationValidationError if the input is not valid GeoJSON
   */
  locationToGeoJSON(location: unknown): Feature | FeatureCollection | Geometry {
    if (!this.validateLocation(location)) {
      throw new LocationValidationError('Invalid GeoJSON data', undefined, {
        locationType: this.locationType,
        data: location,
      });
    }

    // For GeoJSON extension, this is a pass-through as we're already in GeoJSON format
    return location as Feature | FeatureCollection | Geometry;
  }

  /**
   * Parses a GeoJSON string into a GeoJSON object.
   *
   * This method performs two validations:
   * 1. JSON syntax validation (via JSON.parse)
   * 2. GeoJSON structural validation (via validateLocation)
   *
   * @param locationString - The GeoJSON string to parse
   * @returns Parsed GeoJSON object as Feature, FeatureCollection, or Geometry
   * @throws LocationValidationError if the input is not valid GeoJSON
   */
  parseLocationString(locationString: string): Feature | FeatureCollection | Geometry {
    try {
      const parsed = JSON.parse(locationString);

      if (!this.validateLocation(parsed)) {
        throw new LocationValidationError('Invalid GeoJSON structure', undefined, {
          locationType: this.locationType,
          data: parsed,
        });
      }

      return parsed as Feature | FeatureCollection | Geometry;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new LocationValidationError(`Invalid GeoJSON string: ${error.message}`, error, {
          locationType: this.locationType,
        });
      }
      if (error instanceof LocationValidationError) {
        throw error;
      }
      throw new LocationValidationError(
        'Invalid GeoJSON data',
        error instanceof Error ? error : undefined,
        {
          locationType: this.locationType,
        }
      );
    }
  }

  /**
   * Compares two coordinates for equality.
   *
   * @param pos1 - First position
   * @param pos2 - Second position
   * @returns True if positions are exactly equal
   */
  private arePositionsEqual(pos1: Position, pos2: Position): boolean {
    if (pos1.length !== pos2.length) return false;
    return pos1.every((val, idx) => val === pos2[idx]);
  }

  /**
   * Extracts all coordinates from a GeoJSON object for comparison.
   *
   * @param geoJSON - GeoJSON object
   * @returns Array of all coordinates
   */
  getAllCoordinates(geoJSON: Feature | FeatureCollection | Geometry): Position[] {
    // For flat GeoJSON structures, use turf's coordAll
    if ('coordinates' in geoJSON || geoJSON.type === 'Feature') {
      return turf.coordAll(geoJSON as Feature | Geometry);
    }

    // For FeatureCollection, process each feature
    if (geoJSON.type === 'FeatureCollection') {
      return geoJSON.features.flatMap(feature => turf.coordAll(feature));
    }

    // For GeometryCollection, process each geometry
    if (geoJSON.type === 'GeometryCollection') {
      return geoJSON.geometries.flatMap(geom => {
        if ('coordinates' in geom) {
          return turf.coordAll(geom as Geometry);
        }
        return [];
      });
    }

    return [];
  }

  /**
   * Checks if two GeoJSON objects have identical coordinates.
   *
   * This method is used to ensure data integrity when converting between formats.
   * It compares all coordinates between the original and converted GeoJSON objects.
   *
   * @param original - Original GeoJSON
   * @param converted - Converted GeoJSON
   * @returns True if all coordinates match exactly
   */
  checkCoordinatePreservation(original: unknown, converted: unknown): boolean {
    if (!isGeoJSON(original) || !isGeoJSON(converted)) {
      return false;
    }

    const origCoords = this.getAllCoordinates(original);
    const convCoords = this.getAllCoordinates(converted);

    if (origCoords.length !== convCoords.length) {
      return false;
    }

    // Check each coordinate
    for (let i = 0; i < origCoords.length; i++) {
      if (!this.arePositionsEqual(origCoords[i], convCoords[i])) {
        return false;
      }
    }

    return true;
  }
}

/**
 * Create and export a singleton instance of the GeoJSON extension
 */
export const geoJSONExtension = new GeoJSONExtension();
