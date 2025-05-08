/**
 * Tests for the ExtensionRegistry system.
 *
 * These tests verify that the ExtensionRegistry properly manages
 * location format, media type, and proof recipe extensions.
 */

import { ExtensionRegistry } from '../../src/extensions';
import {
  LocationTypeExtension,
  MediaAttachmentExtension,
  ProofRecipeExtension,
} from '../../src/extensions/types';

// Mock implementations for testing

class MockLocationExtension implements LocationTypeExtension {
  readonly id: string = 'mock-location';
  readonly name: string = 'Mock Location Extension';
  readonly description: string = 'A mock location extension for testing';
  readonly locationType: string = 'mock'; // Base type only, subtypes handled by the extension

  validate(): boolean {
    return true;
  }

  validateLocation(location: unknown): boolean {
    // Simple validation for testing
    return typeof location === 'object' && location !== null;
  }

  locationToString(_location: unknown): string {
    return JSON.stringify({ type: 'Point', coordinates: [0, 0] });
  }

  locationToGeoJSON(_location: unknown): object {
    return { type: 'Point', coordinates: [0, 0] };
  }

  parseLocationString(locationString: string): unknown {
    return JSON.parse(locationString);
  }

  getMetadata() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      type: this.constructor.name,
    };
  }
}

class MockMediaExtension implements MediaAttachmentExtension {
  readonly id: string = 'mock';
  readonly name: string = 'Mock Media Extension';
  readonly description: string = 'A mock media extension for testing';
  readonly supportedMediaTypes: string[] = ['mock/mock1', 'mock/mock2'];
  // Using MIME type structure where the first part is the primary type
  // and the extension handles all subtypes

  validate(): boolean {
    return true;
  }

  validateMedia(mediaType: string, _data: string): boolean {
    return this.supportedMediaTypes.includes(mediaType);
  }

  processMedia(mediaType: string, data: string): string {
    return data;
  }

  supportsMediaType(mediaType: string): boolean {
    return this.supportedMediaTypes.includes(mediaType);
  }

  getMetadata() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      type: this.constructor.name,
    };
  }
}

class MockRecipeExtension implements ProofRecipeExtension {
  readonly id: string = 'mock-recipe';
  readonly name: string = 'Mock Recipe Extension';
  readonly description: string = 'A mock recipe extension for testing';
  readonly recipeType: string = 'mock-recipe-type';

  validate(): boolean {
    return true;
  }

  validateRecipe(_recipeData: unknown): boolean {
    return true;
  }

  recipeToString(_recipeData: unknown): Uint8Array {
    // For Solidity compatibility, this Uint8Array would be converted to a hex string
    // when sending to the blockchain, and vice versa when receiving
    return new Uint8Array([1, 2, 3]);
  }

  parseRecipeBytes(_recipeBytes: Uint8Array): unknown {
    return { mockData: true };
  }

  getMetadata() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      type: this.constructor.name,
    };
  }
}

// Tests for ExtensionRegistry
describe('ExtensionRegistry', () => {
  let registry: ExtensionRegistry;
  let locationExt: MockLocationExtension;
  let mediaExt: MockMediaExtension;
  let recipeExt: MockRecipeExtension;

  // Set up a fresh registry before each test
  beforeEach(() => {
    registry = new ExtensionRegistry(false); // Don't register built-ins for testing
    locationExt = new MockLocationExtension();
    mediaExt = new MockMediaExtension();
    recipeExt = new MockRecipeExtension();
  });

  test('should register and retrieve location extensions', () => {
    registry.registerLocationExtension(locationExt);

    // Test retrieving with the base type
    const retrieved = registry.getLocationExtension('mock');

    // Test retrieving with a subtype (should still work due to base type extraction)
    const retrievedWithSubtype = registry.getLocationExtension('mock-point');

    expect(retrieved).toBe(locationExt);
    expect(retrievedWithSubtype).toBe(locationExt);
    expect(retrieved?.id).toBe('mock-location');
  });

  test('should register and retrieve media extensions by MIME type', () => {
    registry.registerMediaExtension(mediaExt);

    const retrievedMock1 = registry.getMediaExtension('mock/mock1');
    const retrievedMock2 = registry.getMediaExtension('mock/mock2');

    expect(retrievedMock1).toBe(mediaExt);
    expect(retrievedMock2).toBe(mediaExt);
  });

  test('should register and retrieve recipe extensions', () => {
    registry.registerRecipeExtension(recipeExt);

    const retrieved = registry.getRecipeExtension('mock-recipe-type');

    expect(retrieved).toBe(recipeExt);
  });

  test('should get all registered extensions', () => {
    registry.registerLocationExtension(locationExt);
    registry.registerMediaExtension(mediaExt);
    registry.registerRecipeExtension(recipeExt);

    const allLocations = registry.getAllLocationExtensions();
    const allMedia = registry.getAllMediaExtensions();
    const allRecipes = registry.getAllRecipeExtensions();

    expect(allLocations).toHaveLength(1);
    expect(allMedia).toHaveLength(1);
    expect(allRecipes).toHaveLength(1);

    expect(allLocations[0]).toBe(locationExt);
    expect(allMedia[0]).toBe(mediaExt);
    expect(allRecipes[0]).toBe(recipeExt);
  });

  test('should detect location format', () => {
    registry.registerLocationExtension(locationExt);

    const validLocation = { lat: 10, lon: 20 };
    const invalidLocation = 'not an object';

    const detectedFormat = registry.detectLocationFormat(validLocation);
    const unknownFormat = registry.detectLocationFormat(invalidLocation);

    expect(detectedFormat).toBe('mock'); // Returns the base locationType
    expect(unknownFormat).toBeUndefined();
  });

  test('should validate extensions before registering', () => {
    const invalidLocationExt = new MockLocationExtension();
    jest.spyOn(invalidLocationExt, 'validate').mockReturnValue(false);

    expect(() => {
      registry.registerLocationExtension(invalidLocationExt);
    }).toThrow();
  });

  test('should replace extensions with the same identifier and issue a warning', () => {
    registry.registerLocationExtension(locationExt);

    // Create a spy on console.warn to verify warning is issued
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();

    // Need a custom class to override the readonly id property
    class CustomLocationExtension extends MockLocationExtension {
      readonly id = 'new-mock-location';
    }

    const customExt = new CustomLocationExtension();
    registry.registerLocationExtension(customExt);

    // Verify that the warning was issued
    expect(warnSpy).toHaveBeenCalled();
    expect(warnSpy.mock.calls[0][0]).toContain('Replacing existing location extension');

    const retrieved = registry.getLocationExtension('mock');

    expect(retrieved).toBe(customExt);
    expect(retrieved?.id).toBe('new-mock-location');
  });
  
  test('should register built-in extensions', async () => {
    // Create a registry that registers built-ins
    const builtInRegistry = new ExtensionRegistry(true);
    
    // Wait a bit for async extension registration to complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Verify that built-in extensions are registered
    const allLocations = builtInRegistry.getAllLocationExtensions();
    const allMedia = builtInRegistry.getAllMediaExtensions();
    
    // We should have at least the GeoJSON extension
    expect(allLocations.length).toBeGreaterThan(0);
    expect(allLocations.some(ext => ext.locationType === 'geojson')).toBe(true);
    
    // We should have at least the Image extension
    expect(allMedia.length).toBeGreaterThan(0);
    expect(allMedia.some(ext => 
      ext.supportedMediaTypes.includes('image/jpeg') && 
      ext.supportedMediaTypes.includes('image/png')
    )).toBe(true);
    
    // Check that we can get the image extension by MIME type
    const jpegExt = builtInRegistry.getMediaExtension('image/jpeg');
    const pngExt = builtInRegistry.getMediaExtension('image/png');
    
    expect(jpegExt).toBeDefined();
    expect(pngExt).toBeDefined();
    expect(jpegExt).toBe(pngExt); // Should be the same extension instance
    expect(jpegExt?.id).toContain('image');
  });
});
