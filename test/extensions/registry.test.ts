/**
 * Tests for the ExtensionRegistry system.
 * 
 * These tests verify that the ExtensionRegistry properly manages
 * location format, media type, and proof recipe extensions.
 */

import { ExtensionRegistry } from '../../src/extensions';
import { 
  BaseExtension, 
  LocationTypeExtension, 
  MediaAttachmentExtension,
  ProofRecipeExtension 
} from '../../src/extensions/types';

// Mock implementations for testing

class MockLocationExtension implements LocationTypeExtension {
  readonly id = 'mock-location';
  readonly name = 'Mock Location Extension';
  readonly description = 'A mock location extension for testing';
  readonly locationType = 'mock-location-type';

  validate(): boolean {
    return true;
  }

  validateLocation(location: unknown): boolean {
    // Simple validation for testing
    return typeof location === 'object' && location !== null;
  }

  locationToString(location: unknown): string {
    return JSON.stringify(location);
  }

  locationToGeoJSON(location: unknown): object {
    return { type: 'Point', coordinates: [0, 0] };
  }

  parseLocationString(locationString: string): unknown {
    return JSON.parse(locationString);
  }
}

class MockMediaExtension implements MediaAttachmentExtension {
  readonly id = 'mock';
  readonly name = 'Mock Media Extension';
  readonly description = 'A mock media extension for testing';
  readonly supportedMediaTypes = ['mock/mock1', 'mock/mock2']; // CLAUDE: I am currently thinking Media Extensions should align to MIME type,
  //  and subtypes should be handled by the extension itself. 
  // Meaning the first part of the MIME type identifier should probably be the extension identifier.
  // What do you think about this?

  validate(): boolean {
    return true;
  }

  validateMedia(mediaType: string, data: string): boolean {
    return this.supportedMediaTypes.includes(mediaType);
  }

  processMedia(mediaType: string, data: string): string {
    return data;
  }

  supportsMediaType(mediaType: string): boolean {
    return this.supportedMediaTypes.includes(mediaType);
  }
}

class MockRecipeExtension implements ProofRecipeExtension {
  readonly id = 'mock-recipe';
  readonly name = 'Mock Recipe Extension';
  readonly description = 'A mock recipe extension for testing';
  readonly recipeType = 'mock-recipe-type';

  validate(): boolean {
    return true;
  }

  validateRecipe(recipeData: unknown): boolean {
    return true;
  }

  recipeToString(recipeData: unknown): Uint8Array { // CLAUDE: I am not sure if Uint8Array is compatible with Solidity `bytes` type. Can you confirm?
    return new Uint8Array([1, 2, 3]);
  }

  parseRecipeBytes(recipeBytes: Uint8Array): unknown {
    return { mockData: true };
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
    
    const retrieved = registry.getLocationExtension('mock-location-type');
    
    expect(retrieved).toBe(locationExt);
    expect(retrieved?.id).toBe('mock-location');
  });

  test('should register and retrieve media extensions by MIME type', () => {
    registry.registerMediaExtension(mediaExt);
    
    const retrievedMock1 = registry.getMediaExtension('mock/mock1'); // CLAUDE: Does this need to be refactored based on the above comment?
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
    
    const detectedFormat = registry.detectLocationFormat(validLocation); // CLAUDE: Is this going to work?
    const unknownFormat = registry.detectLocationFormat(invalidLocation);
    
    expect(detectedFormat).toBe('mock-location-type');
    expect(unknownFormat).toBeUndefined();
  });

  test('should validate extensions before registering', () => {
    const invalidLocationExt = new MockLocationExtension();
    jest.spyOn(invalidLocationExt, 'validate').mockReturnValue(false);
    
    expect(() => {
      registry.registerLocationExtension(invalidLocationExt);
    }).toThrow();
  });

  test('should replace extensions with the same identifier and issue a warning', () => { // CLAUDE: You still need to implement the warning system.
    registry.registerLocationExtension(locationExt);
    
    const newLocationExt = new MockLocationExtension();
    newLocationExt.id = 'new-mock-location';
    
    registry.registerLocationExtension(newLocationExt);
    
    const retrieved = registry.getLocationExtension('mock-location-type');
    
    expect(retrieved).toBe(newLocationExt);
    expect(retrieved?.id).toBe('new-mock-location');
  });
});