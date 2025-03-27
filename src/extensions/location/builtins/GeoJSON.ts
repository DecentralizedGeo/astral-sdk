/**
 * GeoJSON Format Extension
 *
 * Provides support for GeoJSON format in location proofs.
 * This extension handles all GeoJSON types as defined in the GeoJSON specification:
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
import * as turf from '@turf/turf';
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
 * Type guard for a Position array [longitude, latitude, (elevation?)]
 */
export function isPosition(arr: unknown): arr is Position {
  return (
    Array.isArray(arr) &&
    (arr.length === 2 || arr.length === 3) &&
    typeof arr[0] === 'number' &&
    typeof arr[1] === 'number' &&
    (arr.length === 2 || typeof arr[2] === 'number')
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
   * @param location - The GeoJSON data to validate
   * @returns True if the data is valid GeoJSON
   */
  validateLocation(location: unknown): boolean {
    try {
      if (!isGeoJSON(location)) {
        return false;
      }

      // Use turf.js for deeper validation
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
            }
          }
        }

        // General GeoJSON validation
        if (isGeoJSON(location)) {
          // turf.booleanValid only accepts Geometry or Feature, not FeatureCollection
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
   * @throws Error if the input is not valid GeoJSON
   */
  locationToString(location: unknown): string {
    if (!this.validateLocation(location)) {
      throw new Error('Invalid GeoJSON data');
    }

    // JSON.stringify ensures a canonical representation
    return JSON.stringify(location);
  }

  /**
   * Returns the GeoJSON object since this extension already works with GeoJSON.
   *
   * @param location - The GeoJSON data
   * @returns The same GeoJSON object
   * @throws Error if the input is not valid GeoJSON
   */
  locationToGeoJSON(location: unknown): object {
    if (!this.validateLocation(location)) {
      throw new Error('Invalid GeoJSON data');
    }

    // For GeoJSON extension, this is a pass-through as we're already in GeoJSON format
    return location as object;
  }

  /**
   * Parses a GeoJSON string.
   *
   * @param locationString - The GeoJSON string to parse
   * @returns Parsed GeoJSON object
   * @throws Error if the input string is not valid GeoJSON
   */
  parseLocationString(locationString: string): unknown {
    try {
      const parsed = JSON.parse(locationString);

      if (!this.validateLocation(parsed)) {
        throw new Error('Invalid GeoJSON data');
      }

      return parsed;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error(`Invalid GeoJSON string: ${error.message}`);
      }
      throw error;
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
