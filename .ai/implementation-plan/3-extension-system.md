## **3. Extension System Implementation**  
  *Description*: Implement robust Location Type and Media Type extensions supporting common formats specified in the Astral documentation, working seamlessly with both offchain and onchain workflows.

  The overall goal is to allow developers to add location data formatted in the supported types, have it validated, and gracefully added to the location proof. The system should be flexible enough to accommodate different formats while ensuring data integrity.
   
   - *Sub-tasks*: 
     - [x] Review Astral documentation (.ai/docs/*) to understand our designs and identify core supported formats:
       - [x] Location formats: `coordinate-decimal`, `geojson`, `wkt`, `h3`
       - [x] Media types: `image`, `video`, `audio`, `document`. Focus on the most commonly-used subtypes only (JPEG, PNG, mp4, mp3, PDF, maybe others if it's easy)
     
     - [ ] Implement `ExtensionRegistry` system in `src/extensions/index.ts`:
       - [ ] Design extension registry to manage all extension types
       - [ ] Implement methods to register and retrieve extensions
       - [ ] Ensure AstralSDK instances have their own extension registries
       - [ ] Pre-register all built-in extensions by default
       - [ ] Support custom extension registration
     
     - [ ] Create `src/extensions/location/index.ts` exporting all location extensions:
       - [ ] Implement location format handlers using established libraries:
         - [ ] `GeoJSONExtension`: Support ALL GeoJSON types (Point, LineString, Polygon, MultiPoint, MultiLineString, MultiPolygon, Feature, FeatureCollection) using @turf/turf
         - [ ] `CoordinateExtension`: Parse/format decimal lat/lng coordinates
         - [ ] `WKTExtension`: Well-Known Text format (wellknown library)
         - [ ] `H3Extension`: Hexagonal hierarchical geospatial indexing (h3-js)
         - [ ] Use GeoJSON as the central "hub" format for conversions between types
         - [ ] Implement warning system that triggers on ANY coordinate value changes during conversion
         - [ ] Preserve original input data in `_originalInputs` field 
       
       - [ ] Implement helper functions to simplify usage:
         - [ ] `detectLocationFormat(location: unknown): string` - Auto-detect format
         - [ ] `getLocationExtension(locationType: string): LocationTypeExtension` - Get handler
         - [ ] `convertLocationFormat(location: unknown, sourceType: string, targetType: string): unknown` - Convert between formats
     
     - [ ] Create `src/extensions/media/index.ts` with focused scope:
       - [ ] **Priority 1**: Implement basic image handling
         - [ ] Support for JPEG and PNG formats
         - [ ] Light validation of image data (using file-type)
         - [ ] Base64 encoding/decoding utilities
      - [ ] **Priority 2**: Implement basic video handling
        - [ ] Support for mp4 formats
        - [ ] Simple MIME type validation
      - [ ] **Priority 3**: Add minimal support for common audio formats
        - [ ] Support for mp3 formats
        - [ ] Simple MIME type validation
      - [ ] **Priority 4**: Add minimal support for common document formats
         - [ ] Basic PDF handling
         - [ ] Simple MIME type validation
         
       - [ ] Create helper functions for media handling:
         - [ ] `isValidMediaType(mimeType: string): boolean` - Check if MIME type is supported
         - [ ] `getMediaExtension(mediaType: string): MediaAttachmentExtension` - Get handler
         - [ ] `validateMediaData(mediaType: string, data: string): boolean` - Basic validation
     
     - [ ] Integrate extensions with SDK workflow:
       - [ ] Update AstralSDK.buildLocationProof to use extensions
       - [ ] Allow for targetLocationFormat conversion
       - [ ] Implement warning system for data modifications
       - [ ] Document extension usage in examples
     
     - [ ] Write focused tests:
       - [ ] Full test coverage for all location formats
       - [ ] Tests for the priority media types (JPEG, PNG)
       - [ ] Test compatibility with both offchain and onchain workflows
       - [ ] Clearly mark "TODO" for future media format tests
     
     - [ ] Document all extensions thoroughly:
       - [ ] Add detailed JSDoc comments to all functions
       - [ ] Include examples for each supported format
       - [ ] Clearly document which media types are supported in v0.1
       - [ ] Add notes for planned future extensions
     
   - [ ] *Output*: 
     - [ ] Robust, well-tested utilities for handling all location formats in the Astral documentation
     - [ ] Focused media handling for the most common web formats (JPEG, PNG, PDF)
     - [ ] Clear extension registry system that supports custom extensions
     - [ ] Good test coverage for all implemented features
     - [ ] Documentation that sets appropriate expectations
   
   - *Technical considerations*: 
     - [ ] **Prioritize progress over completeness** - implement core functionality first
     - [ ] Use established libraries rather than implementing from scratch:
       - [ ] @turf/turf for GeoJSON operations
       - [ ] wellknown for WKT parsing
       - [ ] h3-js for H3 index handling
       - [ ] file-type for basic media validation
     - [ ] Design extensions to be developer-friendly - gracefully handle minor issues
     - [ ] Use GeoJSON as the central conversion format for all location types
     - [ ] For media, focus on validation rather than conversion
     - [ ] Make note of potential enhancements for future versions
     - [ ] Ensure all extensions work with both offchain and onchain workflows
     - [ ] If implementation of a specific format becomes time-consuming, document the limitation and move on
     - [ ] Issue warnings for ANY coordinate value changes during conversion to maintain data integrity
     - [ ] Include appropriate warnings for other non-coordinate data modifications

Complete: ⬜️

Commit hash: <todo>

## Implementation Report:

[TODO]