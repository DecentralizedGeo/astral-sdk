# Extension Registry System Design

## Overview

The Extension Registry is a core component of the Astral SDK's extensibility system, designed to manage and provide access to various location and media format handlers. This document outlines the technical architecture, design decisions, and usage patterns for the extension system.

## Key Design Goals

1. **Modularity**: Enable clean separation between core SDK functionality and format-specific handlers
2. **Extensibility**: Allow developers to easily add support for additional formats
3. **Discoverability**: Make it easy to find and use the right extension for a given data format
4. **Encapsulation**: Keep format-specific logic isolated from the main workflow
5. **Developer-friendliness**: Gracefully handle common errors and provide useful feedback

## Architecture

### Extension Registry Implementation

The Extension Registry follows a per-instance pattern, where each AstralSDK instance has its own registry. This approach offers several advantages:

1. **Isolation**: Different SDK instances can have different extensions registered
2. **No global state**: Avoids potential issues with global registries
3. **Testability**: Easier to mock and test in isolation
4. **Configuration**: Extensions can be configured differently per instance

```typescript
export class ExtensionRegistry implements IExtensionRegistry {
  private locationExtensions: Map<string, LocationTypeExtension>;
  private mediaExtensions: Map<string, MediaAttachmentExtension>;
  private recipeExtensions: Map<string, ProofRecipeExtension>;

  constructor() {
    // Initialize empty maps
    this.locationExtensions = new Map();
    this.mediaExtensions = new Map();
    this.recipeExtensions = new Map();
    
    // Register built-in extensions
    this.registerBuiltInExtensions();
  }

  // Implementation of interface methods...
}
```

### Integration with AstralSDK

The Extension Registry is instantiated within the AstralSDK class:

```typescript
export class AstralSDK {
  public readonly extensions: ExtensionRegistry;
  
  constructor(config?: AstralSDKConfig) {
    // Initialize extension registry
    this.extensions = new ExtensionRegistry();
    
    // Other initialization...
  }
  
  // SDK methods that use extensions...
}
```

### Extension Registration

Extensions are registered through type-specific methods:

```typescript
// Register a custom location extension
const myExtension = new MyCustomLocationExtension();
sdk.extensions.registerLocationExtension(myExtension);

// Get an extension by type
const extension = sdk.extensions.getLocationExtension('my-custom-format');
```

## Extension Interfaces

Each extension type implements a common interface and adds type-specific methods:

```typescript
export interface LocationTypeExtension extends BaseExtension {
  readonly locationType: string;
  validateLocation(location: unknown): boolean;
  locationToString(location: unknown): string;
  locationToGeoJSON(location: unknown): object;
  parseLocationString(locationString: string): unknown;
}

export interface MediaAttachmentExtension extends BaseExtension {
  readonly supportedMediaTypes: string[];
  validateMedia(mediaType: string, data: string): boolean;
  processMedia(mediaType: string, data: string): string;
  supportsMediaType(mediaType: string): boolean;
}
```

## Built-in Extensions

The SDK includes several built-in extensions registered by default:

### Location Format Extensions
- `GeoJSONExtension`: Various GeoJSON geometries
- `CoordinateExtension`: Decimal coordinate pairs
- `WKTExtension`: Well-Known Text geometries
- `H3Extension`: H3 geospatial indices

### Media Type Extensions
- `ImageExtension`: JPEG, PNG formats
- `VideoExtension`: MP4 format
- `AudioExtension`: MP3 format
- `DocumentExtension`: PDF format

## Using the Extension System

### In SDK Implementation

The SDK uses extensions internally when processing location and media data:

```typescript
async buildLocationProof(input: LocationProofInput): Promise<UnsignedLocationProof> {
  // Detect or use provided location type
  const locationType = input.locationType || this.extensions.detectLocationFormat(input.location);
  
  // Get the appropriate extension
  const extension = this.extensions.getLocationExtension(locationType);
  if (!extension) {
    throw new UnsupportedLocationFormatError(`Unsupported location type: ${locationType}`);
  }
  
  // Validate and process location
  if (!extension.validateLocation(input.location)) {
    // Handle validation failure
  }
  
  // Convert to string for storage
  const locationString = extension.locationToString(input.location);
  
  // Optional format conversion
  let finalLocationType = locationType;
  let finalLocationString = locationString;
  
  if (input.targetLocationFormat && input.targetLocationFormat !== locationType) {
    // Convert to target format using GeoJSON as intermediary
    const geoJSON = extension.locationToGeoJSON(input.location);
    const targetExtension = this.extensions.getLocationExtension(input.targetLocationFormat);
    
    if (!targetExtension) {
      throw new UnsupportedLocationFormatError(`Unsupported target location format: ${input.targetLocationFormat}`);
    }
    
    finalLocationType = input.targetLocationFormat;
    finalLocationString = targetExtension.locationToString(geoJSON);
  }
  
  // Create the unsigned proof
  const proof: UnsignedLocationProof = {
    // ...other fields
    locationType: finalLocationType,
    location: finalLocationString,
    _originalInputs: {
      location: input.location
    }
  };
  
  return proof;
}
```

### For SDK Users

SDK users typically won't interact with extensions directly, but can register custom extensions if needed:

```typescript
// Register a custom location format
class MyCustomLocationExtension implements LocationTypeExtension {
  readonly id = 'my-custom-extension';
  readonly name = 'My Custom Location Format';
  readonly description = 'Handles my custom location format';
  readonly locationType = 'custom-format';
  
  // Implement required methods...
}

// Register the extension
const sdk = new AstralSDK();
sdk.extensions.registerLocationExtension(new MyCustomLocationExtension());

// Use the custom format
const proof = await sdk.buildLocationProof({
  location: myCustomData,
  locationType: 'custom-format'
});
```

## Implementation Strategy

1. Start with a minimal but extensible registry system
2. Implement core extensions for the most common formats
3. Define clear interfaces for adding custom extensions
4. Prioritize developer experience with graceful error handling
5. Document extension usage thoroughly

## Future Considerations

1. **Extension Versioning**: Support for versioned extensions
2. **Extension Discovery**: Methods to list available extensions
3. **Feature Detection**: Allow checking for specific extension capabilities
4. **Extension Configuration**: More granular configuration options per extension
5. **Extension Composition**: Allow extensions to build on each other