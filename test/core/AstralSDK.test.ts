/**
 * Tests for the AstralSDK class with extension system integration.
 *
 * These tests verify that the AstralSDK properly uses extensions to process
 * location and media data when building location proofs.
 */

import { AstralSDK } from '../../src/core/AstralSDK';
import { LocationProofInput } from '../../src/core/types';
import { 
  ExtensionError,
  ValidationError 
} from '../../src/core/errors';

// Sample location data in different formats
const pointGeoJSON = {
  type: 'Point',
  coordinates: [12.34, 56.78]
};

const featureGeoJSON = {
  type: 'Feature',
  properties: {},
  geometry: pointGeoJSON
};

// Sample base64 encoded tiny images
const jpegBase64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q==';
const pngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

describe('AstralSDK', () => {
  let sdk: AstralSDK;
  
  beforeEach(() => {
    // Create SDK instance with debug mode for better test output
    sdk = new AstralSDK({ debug: true });
  });
  
  describe('buildLocationProof', () => {
    test('should build a proof with GeoJSON location data', async () => {
      const input: LocationProofInput = {
        location: pointGeoJSON,
        memo: 'Test GeoJSON point location proof',
        timestamp: new Date('2023-01-01T12:00:00Z')
      };
      
      const proof = await sdk.buildLocationProof(input);
      
      // Verify the proof properties
      expect(proof).toBeDefined();
      expect(proof.eventTimestamp).toBe(Math.floor(new Date('2023-01-01T12:00:00Z').getTime() / 1000));
      expect(proof.locationType).toBe('geojson');
      expect(proof.location).toBe(JSON.stringify(pointGeoJSON));
      expect(proof.memo).toBe('Test GeoJSON point location proof');
      
      // Arrays should be empty for this simple case
      expect(proof.mediaTypes).toEqual([]);
      expect(proof.mediaData).toEqual([]);
      expect(proof.recipeTypes).toEqual([]);
      expect(proof.recipePayloads).toEqual([]);
    });
    
    test('should auto-detect GeoJSON format if not specified', async () => {
      const input: LocationProofInput = {
        location: featureGeoJSON,
        memo: 'Test GeoJSON feature auto-detection'
      };
      
      const proof = await sdk.buildLocationProof(input);
      
      expect(proof.locationType).toBe('geojson');
      expect(JSON.parse(proof.location)).toEqual(featureGeoJSON);
    });
    
    test('should process media attachments', async () => {
      const input: LocationProofInput = {
        location: pointGeoJSON,
        memo: 'Test location proof with media',
        media: [
          {
            mediaType: 'image/jpeg',
            data: jpegBase64
          },
          {
            mediaType: 'image/png',
            data: pngBase64
          }
        ]
      };
      
      const proof = await sdk.buildLocationProof(input);
      
      // Verify media processing
      expect(proof.mediaTypes).toEqual(['image/jpeg', 'image/png']);
      expect(proof.mediaData).toHaveLength(2);
      
      // Verify that media data was processed correctly
      expect(proof.mediaData[0]).toContain('data:image/jpeg;base64,');
      expect(proof.mediaData[1]).toContain('data:image/png;base64,');
    });
    
    test('should convert location format if targetLocationFormat is specified', async () => {
      // Currently this is just a passthrough since we only have GeoJSON
      // In a fully implemented SDK, this would convert between formats
      const input: LocationProofInput = {
        location: pointGeoJSON,
        locationType: 'geojson',
        targetLocationFormat: 'geojson', // Same format, no actual conversion
        memo: 'Test location format conversion'
      };
      
      const proof = await sdk.buildLocationProof(input);
      
      expect(proof.locationType).toBe('geojson');
      expect(JSON.parse(proof.location)).toEqual(pointGeoJSON);
    });
    
    test('should throw ValidationError for missing location', async () => {
      const input: LocationProofInput = {
        location: undefined as any,
        memo: 'Missing location'
      };
      
      await expect(sdk.buildLocationProof(input)).rejects.toThrow(ValidationError);
    });
    
    test('should throw ExtensionError for unknown location format', async () => {
      const input: LocationProofInput = {
        location: 'not a valid location',
        memo: 'Invalid location format'
      };
      
      await expect(sdk.buildLocationProof(input)).rejects.toThrow(ExtensionError);
    });
    
    test('should throw ExtensionError for unknown media type', async () => {
      const input: LocationProofInput = {
        location: pointGeoJSON,
        media: [
          {
            mediaType: 'unknown/type',
            data: 'data'
          }
        ]
      };
      
      await expect(sdk.buildLocationProof(input)).rejects.toThrow(ExtensionError);
    });
    
    test('should throw ValidationError for invalid media data', async () => {
      const input: LocationProofInput = {
        location: pointGeoJSON,
        media: [
          {
            mediaType: 'image/jpeg',
            data: 'not a valid image' // Not base64 encoded
          }
        ]
      };
      
      await expect(sdk.buildLocationProof(input)).rejects.toThrow(ValidationError);
    });
  });
  
  // Placeholder tests for the workflow methods
  describe('createOffchainLocationProof', () => {
    test('should build an unsigned proof (placeholder for future implementation)', async () => {
      const input: LocationProofInput = {
        location: pointGeoJSON,
        memo: 'Test offchain proof'
      };
      
      const result = await sdk.createOffchainLocationProof(input);
      
      // For now, this just returns the unsigned proof
      expect(result).toBeDefined();
      expect(result.locationType).toBe('geojson');
    });
  });
  
  describe('createOnchainLocationProof', () => {
    test('should build an unsigned proof (placeholder for future implementation)', async () => {
      const input: LocationProofInput = {
        location: pointGeoJSON,
        memo: 'Test onchain proof'
      };
      
      const result = await sdk.createOnchainLocationProof(input);
      
      // For now, this just returns the unsigned proof
      expect(result).toBeDefined();
      expect(result.locationType).toBe('geojson');
    });
  });
});