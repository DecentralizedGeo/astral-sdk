# Astral SDK Extensions

This document provides information about the extension system in the Astral SDK.

## Overview

The Astral SDK uses an extension system to support different location formats and media types. This allows for flexibility and extensibility while maintaining a consistent API.

### Supported Formats in MVP

#### Location Formats

- **GeoJSON**: The primary location format supporting all GeoJSON types (Point, LineString, Polygon, MultiPoint, MultiLineString, MultiPolygon, Feature, FeatureCollection)

#### Media Types

- **Images**: JPEG and PNG formats

### Planned Future Extensions

Additional formats planned for v0.1:

#### Location Formats

- **Coordinate**: Decimal coordinates in array and object format
- **WKT**: Well-Known Text format
- **H3**: Hexagonal hierarchical geospatial indexing

#### Media Types

- **Video**: MP4 format
- **Audio**: MP3 format
- **Documents**: PDF format

## Extension ID Format

Extensions follow a URI-like namespace pattern:

```
astral:<extension-type>:<format>
```

For example:
- `astral:location:geojson` - GeoJSON location format extension
- `astral:media:image` - Image media type extension

This format provides a hierarchical structure that can be extended in the future.

## Using Extensions in the SDK

Extensions are automatically registered when you create an SDK instance:

```typescript
// Create a new SDK instance
const sdk = new AstralSDK();

// SDK will automatically use the appropriate extensions based on the data format
const unsignedProof = await sdk.buildLocationProof({
  location: {
    type: 'Point',
    coordinates: [12.34, 56.78]
  },
  memo: 'Using GeoJSON format'
});
```

### Format Detection and Conversion

The SDK can automatically detect the format of location data:

```typescript
// Format will be auto-detected as 'geojson'
const unsignedProof = await sdk.buildLocationProof({
  location: {
    type: 'Point',
    coordinates: [12.34, 56.78]
  }
});
```

You can also specify a target format for conversion:

```typescript
// In future versions, this will convert between different formats
const unsignedProof = await sdk.buildLocationProof({
  location: {
    type: 'Point',
    coordinates: [12.34, 56.78]
  },
  targetLocationFormat: 'wkt'  // Convert to WKT format
});
```

### Adding Media Attachments

You can include media attachments in your location proofs:

```typescript
const unsignedProof = await sdk.buildLocationProof({
  location: {
    type: 'Point',
    coordinates: [12.34, 56.78]
  },
  media: [
    {
      mediaType: 'image/jpeg',
      data: '...base64-encoded-data...'
    }
  ]
});
```

## Advanced Usage

### Extension Registry

You can access the extension registry through the SDK instance:

```typescript
// Get all registered location extensions
const locationExtensions = sdk.extensions.getAllLocationExtensions();

// Get all registered media extensions
const mediaExtensions = sdk.extensions.getAllMediaExtensions();

// Get an extension for a specific format
const geoJsonExtension = sdk.extensions.getLocationExtension('geojson');
const jpegExtension = sdk.extensions.getMediaExtension('image/jpeg');
```

### Custom Extensions

You can register custom extensions:

```typescript
// Create a custom location extension
class MyCustomLocationExtension extends BaseExtension implements LocationTypeExtension {
  readonly id = 'astral:location:custom';
  readonly name = 'My Custom Format';
  readonly description = 'Handles a custom location format';
  readonly locationType = 'custom';
  
  // Implement required methods...
}

// Register the custom extension
sdk.extensions.registerLocationExtension(new MyCustomLocationExtension());
```

## Extension Development

When implementing a new extension, you need to follow these interfaces:

### Location Format Extensions

Implement the `LocationTypeExtension` interface:

```typescript
interface LocationTypeExtension extends BaseExtension {
  readonly locationType: string;
  validateLocation(location: unknown): boolean;
  locationToString(location: unknown): string;
  locationToGeoJSON(location: unknown): object;
  parseLocationString(locationString: string): unknown;
}
```

### Media Type Extensions

Implement the `MediaAttachmentExtension` interface:

```typescript
interface MediaAttachmentExtension extends BaseExtension {
  readonly supportedMediaTypes: string[];
  validateMedia(mediaType: string, data: string): boolean;
  processMedia(mediaType: string, data: string): string;
  supportsMediaType(mediaType: string): boolean;
}
```

See the existing extensions in `src/extensions/location/builtins/` and `src/extensions/media/builtins/` for examples.