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
  isValidLatitude,
  isValidLongitude
} from '../../../src/extensions/location/builtins/GeoJSON';
import { LocationValidationError } from '../../../src/core/errors';
import { Feature, FeatureCollection, GeometryCollection, LineString, Point } from 'geojson';

describe('GeoJSON Type Guards', () => {
  test('isValidLongitude should validate longitude values', () => {
    // Valid longitudes (within [-180, 180])
    expect(isValidLongitude(0)).toBe(true);
    expect(isValidLongitude(180)).toBe(true);
    expect(isValidLongitude(-180)).toBe(true);
    expect(isValidLongitude(179.999999)).toBe(true);
    expect(isValidLongitude(-179.999999)).toBe(true);
    
    // Invalid longitudes
    expect(isValidLongitude(180.00001)).toBe(false);
    expect(isValidLongitude(-180.00001)).toBe(false);
    expect(isValidLongitude(NaN)).toBe(false);
    expect(isValidLongitude(Infinity)).toBe(false);
    expect(isValidLongitude(-Infinity)).toBe(false);
  });
  
  test('isValidLatitude should validate latitude values', () => {
    // Valid latitudes (within [-90, 90])
    expect(isValidLatitude(0)).toBe(true);
    expect(isValidLatitude(90)).toBe(true);
    expect(isValidLatitude(-90)).toBe(true);
    expect(isValidLatitude(89.999999)).toBe(true);
    expect(isValidLatitude(-89.999999)).toBe(true);
    
    // Invalid latitudes
    expect(isValidLatitude(90.00001)).toBe(false);
    expect(isValidLatitude(-90.00001)).toBe(false);
    expect(isValidLatitude(NaN)).toBe(false);
    expect(isValidLatitude(Infinity)).toBe(false);
    expect(isValidLatitude(-Infinity)).toBe(false);
  });

  test('isPosition should correctly identify GeoJSON positions', () => {
    // Valid positions
    expect(isPosition([0, 0])).toBe(true);
    expect(isPosition([180, 90])).toBe(true);
    expect(isPosition([-180, -90])).toBe(true);
    expect(isPosition([0, 0, 0])).toBe(true);

    // Invalid positions due to structure
    expect(isPosition([])).toBe(false);
    expect(isPosition([0])).toBe(false);
    expect(isPosition([0, 0, 0, 0])).toBe(false);
    expect(isPosition(['0', '0'])).toBe(false);
    expect(isPosition(null)).toBe(false);
    expect(isPosition(undefined)).toBe(false);
    expect(isPosition('not a position')).toBe(false);
    expect(isPosition({ lat: 0, lng: 0 })).toBe(false);
    
    // Invalid positions due to coordinate range
    expect(isPosition([181, 0])).toBe(false); // longitude out of range
    expect(isPosition([0, 91])).toBe(false); // latitude out of range
    expect(isPosition([-181, 0])).toBe(false); // longitude out of range
    expect(isPosition([0, -91])).toBe(false); // latitude out of range
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
    expect(extension.id).toBe('astral:location:geojson'); // CLAUDE: Again, what is this identifier?
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

    // Should throw LocationValidationError for invalid GeoJSON
    expect(() => extension.locationToString(null)).toThrow(LocationValidationError);
    expect(() => extension.locationToString('not an object')).toThrow(LocationValidationError);
  });

  test('locationToGeoJSON should pass through valid GeoJSON objects', () => {
    const pointGeoJSON = extension.locationToGeoJSON(point);
    const featureGeoJSON = extension.locationToGeoJSON(feature);

    expect(pointGeoJSON).toEqual(point);
    expect(featureGeoJSON).toEqual(feature);

    // Should throw LocationValidationError for invalid GeoJSON
    expect(() => extension.locationToGeoJSON(null)).toThrow(LocationValidationError);
    expect(() => extension.locationToGeoJSON('not an object')).toThrow(LocationValidationError);
  });

  test('parseLocationString should parse GeoJSON strings', () => {
    const pointString = JSON.stringify(point);
    const featureString = JSON.stringify(feature);

    const parsedPoint = extension.parseLocationString(pointString);
    const parsedFeature = extension.parseLocationString(featureString);

    expect(parsedPoint).toEqual(point);
    expect(parsedFeature).toEqual(feature);

    // Should throw LocationValidationError for invalid JSON strings
    expect(() => extension.parseLocationString('not a JSON string')).toThrow(LocationValidationError);
    expect(() => extension.parseLocationString('{"invalid": "json"}')).toThrow(LocationValidationError);
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
    // CLAUDE: Should we include a toEqual test here?
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
    expect(extension.checkCoordinatePreservation(point, modifiedPoint)).toBe(false); // CLAUDE: Future work — implementing a warning for a tolerance threshold, and an error above that tolerance. Dev can set the threshold as they see fit.

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

/*
CLAUDE (for future work and the implementation report): 
Missing or Could Be Enhanced:
Coordinate Range Validation
  The tests don't verify if longitude is within [-180, 180]
  The tests don't verify if latitude is within [-90, 90]
More Complex Geometry Types
  MultiPoint
  MultiLineString
  MultiPolygon
Polygon-Specific Rules
  Linear ring closure (partially tested)
  Counter-clockwise exterior rings
  Clockwise interior rings (holes)
  Self-intersecting polygons
Edge Cases
  Empty collections
  Nested collections
  Very large coordinates
  Decimal precision handling
  Additional coordinate dimensions (altitude, etc.)

**Short Answer**: This test suite is *quite thorough* for common GeoJSON validation scenarios but is *not fully comprehensive* because GeoJSON has numerous edge cases and advanced features that aren’t covered (e.g., bounding boxes, multi-geometries, ring-closure rules, coordinate range checks, etc.). However, for typical use cases—Points, LineStrings, Polygons, Features, FeatureCollections, GeometryCollections—it provides a strong baseline.

---

## What This Suite Covers Well

1. **Type Guards**  
   - The `isPosition` and `isGeoJSON` tests cover valid/invalid inputs and confirm that correct objects pass while incorrect structures fail.  
   - You’re checking everything from simple arrays to null/undefined to string/object mismatches.

2. **Core GeoJSON Structures**  
   - **Point**, **LineString**, **Polygon**, **Feature**, **FeatureCollection**, and **GeometryCollection**.  
   - Tests demonstrate both successful and unsuccessful validations.

3. **Integration with a GeoJSON Extension**  
   - Tests for methods like `validateLocation`, `locationToString`, `locationToGeoJSON`, `parseLocationString`, and `getAllCoordinates`.  
   - Each method is validated for correct and incorrect inputs, which ensures good coverage for the extension’s main entry points.

4. **Coordinate Preservation**  
   - Verifying that small numeric differences cause a failure.  
   - Checking that identical copies pass, while different coordinates fail.

---

## Potential Gaps for Truly Comprehensive Testing

1. **Multi-Geometries**  
   - **MultiPoint**, **MultiLineString**, and **MultiPolygon** are core GeoJSON geometry types but appear only indirectly or not at all in tests.  
   - You might want explicit tests for these if your application uses them.

2. **Polygon Winding / Ring Closure Rules**  
   - GeoJSON polygons require each “ring” to be closed (first and last coordinates must match).  
   - You have a single test for a semantically invalid polygon that doesn’t close, but you could add more cases:
     - Polygons with multiple rings (holes)  
     - Correct vs. incorrect ring ordering  
     - Precisely matching first and last coordinates  

3. **Bounding Boxes**  
   - GeoJSON optionally supports a `bbox` property at various levels (e.g., on a Feature or FeatureCollection).  
   - If you need to validate or handle bounding boxes, additional tests would be needed.

4. **Coordinate Range / CRS**  
   - Strictly speaking, the default GeoJSON specification (RFC 7946) uses WGS84 (EPSG:4326) with longitude from -180 to 180 and latitude from -90 to 90.  
   - Your `isPosition` test includes a comment questioning whether range checking is done for lat/lon, which suggests it’s not. If you need that in your domain, you’d need more tests (or custom logic) to enforce those ranges.

5. **Optional Properties**  
   - Some advanced or optional properties like `id`, `bbox`, or extended geometry definitions are not tested.  

6. **Performance and Stress Testing**  
   - If you expect very large GeoJSON inputs, you may want performance-oriented tests to ensure your validations handle big datasets efficiently (though this is less about correctness and more about reliability at scale).

---

### Conclusion

Your test suite already provides a **solid coverage** of common GeoJSON shapes and validation scenarios, especially for typical usage with Points, LineStrings, Polygons, and FeatureCollections. For most day-to-day needs, this level of coverage is excellent.

If you need *truly exhaustive* coverage of the GeoJSON specification—particularly for multi-geometries, ring rules, bounding boxes, or coordinate range checks—you’ll want to add a few more targeted tests. Otherwise, this suite is a great foundation for ensuring your code can handle the standard GeoJSON cases properly.

*/
