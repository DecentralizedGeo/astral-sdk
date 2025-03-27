/**
 * Tests for the GeoJSON extension.
 *
 * These tests verify that the GeoJSONExtension properly handles
 * all GeoJSON types and operations as specified in the GeoJSON specification.
 */

import {
  GeoJSONExtension,
  isGeoJSON,
  isPosition,
} from '../../../src/extensions/location/builtins/GeoJSON';
import { Feature, FeatureCollection, GeometryCollection, LineString, Point } from 'geojson';

describe('GeoJSON Type Guards', () => {
  test('isPosition should correctly identify GeoJSON positions', () => {
    // Valid positions
    expect(isPosition([0, 0])).toBe(true);
    expect(isPosition([180, 90])).toBe(true);
    expect(isPosition([-180, -90])).toBe(true);
    expect(isPosition([0, 0, 0])).toBe(true);

    // Invalid positions
    expect(isPosition([])).toBe(false);
    expect(isPosition([0])).toBe(false);
    expect(isPosition([0, 0, 0, 0])).toBe(false);
    expect(isPosition(['0', '0'])).toBe(false);
    expect(isPosition(null)).toBe(false);
    expect(isPosition(undefined)).toBe(false);
    expect(isPosition('not a position')).toBe(false);
    expect(isPosition({ lat: 0, lng: 0 })).toBe(false);
  });

  test('isGeoJSON should correctly identify GeoJSON objects', () => {
    // Valid GeoJSON objects
    expect(isGeoJSON({ type: 'Point', coordinates: [0, 0] })).toBe(true);
    expect(
      isGeoJSON({
        type: 'LineString',
        coordinates: [
          [0, 0],
          [1, 1],
        ],
      })
    ).toBe(true);
    expect(
      isGeoJSON({
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [1, 1],
            [1, 0],
            [0, 0],
          ],
        ],
      })
    ).toBe(true);
    expect(
      isGeoJSON({
        type: 'Feature',
        properties: {},
        geometry: { type: 'Point', coordinates: [0, 0] },
      })
    ).toBe(true);
    expect(
      isGeoJSON({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            properties: {},
            geometry: { type: 'Point', coordinates: [0, 0] },
          },
        ],
      })
    ).toBe(true);
    expect(
      isGeoJSON({
        type: 'GeometryCollection',
        geometries: [{ type: 'Point', coordinates: [0, 0] }],
      })
    ).toBe(true);

    // Invalid GeoJSON objects
    expect(isGeoJSON(null)).toBe(false);
    expect(isGeoJSON(undefined)).toBe(false);
    expect(isGeoJSON('not an object')).toBe(false);
    expect(isGeoJSON({})).toBe(false);
    expect(isGeoJSON({ type: 'Invalid' })).toBe(false);
    expect(isGeoJSON({ type: 'Point' })).toBe(false);
    expect(isGeoJSON({ coordinates: [0, 0] })).toBe(false);
  });
});

describe('GeoJSONExtension', () => {
  let extension: GeoJSONExtension;

  // Sample GeoJSON objects for testing
  const point: Point = { type: 'Point', coordinates: [10, 20] };
  const feature: Feature = {
    type: 'Feature',
    properties: { name: 'Test Point' },
    geometry: point,
  };
  const featureCollection: FeatureCollection = {
    type: 'FeatureCollection',
    features: [feature],
  };

  beforeEach(() => {
    extension = new GeoJSONExtension();
  });

  test('should have correct metadata', () => {
    expect(extension.id).toBe('astral:location:geojson');
    expect(extension.name).toBe('GeoJSON');
    expect(extension.locationType).toBe('geojson');
    expect(extension.validate()).toBe(true);
  });

  test('validateLocation should correctly validate GeoJSON objects', () => {
    // Valid GeoJSON objects
    expect(extension.validateLocation(point)).toBe(true);
    expect(extension.validateLocation(feature)).toBe(true);
    expect(extension.validateLocation(featureCollection)).toBe(true);

    // Invalid GeoJSON objects
    expect(extension.validateLocation(null)).toBe(false);
    expect(extension.validateLocation(undefined)).toBe(false);
    expect(extension.validateLocation('not an object')).toBe(false);
    expect(extension.validateLocation({})).toBe(false);

    // Invalid GeoJSON (structurally correct but semantically invalid)
    const invalidPolygon = {
      type: 'Polygon',
      coordinates: [
        [
          [0, 0],
          [1, 1],
          [2, 2],
        ],
      ], // Polygon doesn't close
    };
    expect(extension.validateLocation(invalidPolygon)).toBe(false);
  });

  test('locationToString should convert GeoJSON objects to strings', () => {
    const pointString = extension.locationToString(point);
    const featureString = extension.locationToString(feature);

    expect(JSON.parse(pointString)).toEqual(point);
    expect(JSON.parse(featureString)).toEqual(feature);

    // Should throw for invalid GeoJSON
    expect(() => extension.locationToString(null)).toThrow();
    expect(() => extension.locationToString('not an object')).toThrow();
  });

  test('locationToGeoJSON should pass through valid GeoJSON objects', () => {
    const pointGeoJSON = extension.locationToGeoJSON(point);
    const featureGeoJSON = extension.locationToGeoJSON(feature);

    expect(pointGeoJSON).toEqual(point);
    expect(featureGeoJSON).toEqual(feature);

    // Should throw for invalid GeoJSON
    expect(() => extension.locationToGeoJSON(null)).toThrow();
    expect(() => extension.locationToGeoJSON('not an object')).toThrow();
  });

  test('parseLocationString should parse GeoJSON strings', () => {
    const pointString = JSON.stringify(point);
    const featureString = JSON.stringify(feature);

    const parsedPoint = extension.parseLocationString(pointString);
    const parsedFeature = extension.parseLocationString(featureString);

    expect(parsedPoint).toEqual(point);
    expect(parsedFeature).toEqual(feature);

    // Should throw for invalid JSON strings
    expect(() => extension.parseLocationString('not a JSON string')).toThrow();
    expect(() => extension.parseLocationString('{"invalid": "json"}')).toThrow();
  });

  test('getAllCoordinates should extract all positions from a GeoJSON object', () => {
    // Test with Point
    const coords = extension.getAllCoordinates(point);
    expect(coords).toHaveLength(1);
    expect(coords[0]).toEqual([10, 20]);

    // Test with Feature
    const featureCoords = extension.getAllCoordinates(feature);
    expect(featureCoords).toHaveLength(1);
    expect(featureCoords[0]).toEqual([10, 20]);

    // Test with FeatureCollection
    const collectionCoords = extension.getAllCoordinates(featureCollection);
    expect(collectionCoords).toHaveLength(1);
    expect(collectionCoords[0]).toEqual([10, 20]);

    // Test with LineString
    const lineString: LineString = {
      type: 'LineString',
      coordinates: [
        [0, 0],
        [1, 1],
        [2, 2],
      ],
    };
    const lineCoords = extension.getAllCoordinates(lineString);
    expect(lineCoords).toHaveLength(3);
    expect(lineCoords).toEqual([
      [0, 0],
      [1, 1],
      [2, 2],
    ]);

    // Test with GeometryCollection
    const geometryCollection: GeometryCollection = {
      type: 'GeometryCollection',
      geometries: [point, lineString],
    };
    const geomCollectionCoords = extension.getAllCoordinates(geometryCollection);
    // We expect all 4 coordinates (1 from point + 3 from lineString)
    expect(geomCollectionCoords).toHaveLength(4);
  });

  test('checkCoordinatePreservation should detect any coordinate changes', () => {
    // Test with identical objects
    expect(extension.checkCoordinatePreservation(point, point)).toBe(true);
    expect(extension.checkCoordinatePreservation(feature, feature)).toBe(true);

    // Test with structurally identical but different object instances
    const pointCopy = { ...point };
    expect(extension.checkCoordinatePreservation(point, pointCopy)).toBe(true);

    // Test with modified coordinates
    const modifiedPoint = {
      type: 'Point',
      coordinates: [10.0000001, 20], // Very small change
    };
    expect(extension.checkCoordinatePreservation(point, modifiedPoint)).toBe(false);

    // Test with completely different coordinates
    const differentPoint = {
      type: 'Point',
      coordinates: [15, 25],
    };
    expect(extension.checkCoordinatePreservation(point, differentPoint)).toBe(false);

    // Test with invalid inputs
    expect(extension.checkCoordinatePreservation(null, point)).toBe(false);
    expect(extension.checkCoordinatePreservation(point, null)).toBe(false);
    expect(extension.checkCoordinatePreservation('not GeoJSON', point)).toBe(false);
  });
});
