## **3. Extension System Implementation**  
  *Description*: Implement robust Location Type and Media Type extensions supporting common formats specified in the Astral documentation, working seamlessly with both offchain and onchain workflows.

  The overall goal is to allow developers to add location data formatted in the supported types, have it validated, and gracefully added to the location proof. The system should be flexible enough to accommodate different formats while ensuring data integrity.
   
   - *Sub-tasks*: 
     - [x] Review Astral documentation (.ai/docs/*) to understand our designs and identify core supported formats:
       - [x] Location formats: `coordinate-decimal`, `geojson`, `wkt`, `h3`
       - [x] Media types: `image`, `video`, `audio`, `document`. Focus on the most commonly-used subtypes only (JPEG, PNG, mp4, mp3, PDF, maybe others if it's easy)
     
     - [x] Implement `ExtensionRegistry` system in `src/extensions/index.ts`:
       - [x] Design extension registry to manage all extension types
       - [x] Implement methods to register and retrieve extensions
       - [x] Ensure AstralSDK instances have their own extension registries
       - [x] Pre-register all built-in extensions by default
       - [x] Support custom extension registration
     
     Task 2: Location Extensions
     - [x] Create `src/extensions/location/index.ts` exporting all location extensions:
       - [ ] Implement location format handlers using established libraries:
         - [x] `GeoJSONExtension`: Support ALL GeoJSON types (Point, LineString, Polygon, MultiPoint, MultiLineString, MultiPolygon, Feature, FeatureCollection) using @turf/turf
         - [ ] `CoordinateExtension`: Parse/format decimal lat/lng coordinates as both array and object ([lat, lng] and {lat: 0, lng: 0})
         - [ ] `WKTExtension`: Well-Known Text format (wellknown library)
         - [ ] `H3Extension`: Hexagonal hierarchical geospatial indexing (h3-js)
         - [x] Use GeoJSON as the central "hub" format for conversions between types
         - [x] Implement warning system that triggers on ANY coordinate value changes during conversion
         - [ ] Preserve original input data in `_originalInputs` field 
       
       - [x] Implement helper functions to simplify usage:
         - [x] `detectLocationFormat(location: unknown): string` - Auto-detect format
         - [x] `getLocationExtension(locationType: string): LocationTypeExtension` - Get handler
         - [x] `convertLocationFormat(location: unknown, sourceType: string, targetType: string): unknown` - Convert between formats
     
     Task 3: GeoJSON Extension Refinements (Based on Dev Review)
     - [ ] Enhance error handling in GeoJSON extension:
       - [ ] Use specific error types from our error hierarchy instead of generic Error instances (LocationFormatError, ConversionError, etc.)
       - [ ] Provide detailed error messages that help developers understand what went wrong
     - [ ] Optimize Turf.js imports:
       - [ ] Import only the specific functions we need instead of the entire library
       - [ ] Measure the bundle size reduction
     - [ ] Add coordinate range validation:
       - [ ] Validate longitude is within [-180, 180]
       - [ ] Validate latitude is within [-90, 90]
     - [ ] Enhance coordinate preservation in conversions:
       - [ ] Use checkCoordinatePreservation in the conversion process
       - [ ] Add support for tolerance thresholds (configurable)
     - [ ] Clarify parseLocationString purpose:
       - [ ] Update JSDoc comments to clearly explain the expected format
       - [ ] Document the flow between different format conversions
     - [ ] Extension ID format documentation:
       - [ ] Document the URI-like namespace pattern (astral:location:geojson)
       - [ ] Decide on standardization across all extensions
     - [ ] Address type specificity questions:
       - [ ] Evaluate the benefits/drawbacks of stricter return types
       - [ ] Make consistent decisions across all extensions
     - [ ] Remove in-code review comments after addressing them

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
       - [x] Full test coverage for GeoJSON format
       - [ ] Full test coverage for Coordinate format
       - [ ] Full test coverage for WKT format
       - [ ] Full test coverage for H3 format
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
     - [x] **Prioritize progress over completeness** - implement core functionality first
     - [x] Use established libraries rather than implementing from scratch:
       - [x] @turf/turf for GeoJSON operations
       - [ ] wellknown for WKT parsing
       - [ ] h3-js for H3 index handling
       - [ ] file-type for basic media validation
     - [x] Design extensions to be developer-friendly - gracefully handle minor issues
     - [x] Use GeoJSON as the central conversion format for all location types
     - [ ] For media, focus on validation rather than conversion
     - [ ] Make note of potential enhancements for future versions
     - [ ] Ensure all extensions work with both offchain and onchain workflows
     - [ ] If implementation of a specific format becomes time-consuming, document the limitation and move on
     - [x] Issue warnings for ANY coordinate value changes during conversion to maintain data integrity
     - [ ] Include appropriate warnings for other non-coordinate data modifications

Complete: ⬜️

Commit hash: c66b5ec77ff281032c9d85b779248a7a0546df31, b170c734112784a9ecfa25bbfdf408c7e7d0baf4

## Implementation Report:

### Task 1: ExtensionRegistry Implementation

#### Initial Implementation:
- Created the `ExtensionRegistry` class in `src/extensions/index.ts`
- Implemented registration methods for location, media, and recipe extensions
- Added retrieval methods to get extensions by their respective types
- Implemented a format detection method for location data
- Set up a placeholder for registering built-in extensions
- Created comprehensive tests for the registry functionality

#### Dev Review & Discussion:
- Identified the need for warnings when replacing existing extensions
- Clarified the approach for handling Location Format Identifiers:
  - Extensions should be registered by their base type (e.g., 'geojson', 'coordinate')
  - The registry extracts the base type from complex identifiers like 'geojson-point'
  - Subtypes and additional details are handled by the extension itself
- Discussed Media Extension design:
  - Media Extensions align with primary MIME types ('image', 'video', etc.)
  - Each extension handles all subtypes for its primary type
  - Full MIME types are used for lookup in the registry
- Noted potential ambiguity with multiple valid extensions for a location
  - Solution: Register extensions in preferred order and return the first match
- Confirmed approach for Solidity `bytes` compatibility:
  - Uint8Array is a good JavaScript representation for binary data
  - For Solidity integration, conversion between Uint8Array and hex strings will be handled

#### Enhancements:
- Implemented warning system for overwriting extensions
- Updated location extension retrieval to extract base types from format identifiers
- Added detailed documentation for extension matching behavior
- Improved test coverage for warnings and base type extraction
- Added comments clarifying design decisions

#### Technical Notes:
- The ExtensionRegistry follows a per-instance pattern, with each SDK instance having its own registry
- Extensions are registered in maps for efficient lookup
- Media extensions use a dual mapping system:
  - By extension ID (for getAllMediaExtensions)
  - By MIME type (for getMediaExtension)
- Extensions are validated before registration
- Warnings are issued when replacing existing extensions

#### Additional Design Considerations:

1. **Extension Priority**:
   - Extensions should be registered in a deliberate order, with more specific formats taking precedence
   - The `detectLocationFormat` method returns the first matching extension, so registration order matters
   - Recommended order: GeoJSON, WKT, Coordinate, H3

2. **Type Definitions**:
   - We'll use `@types/geojson` for proper TypeScript typing of GeoJSON structures
   - This will improve type safety when converting between different location formats

3. **Warning Mechanism**:
   - Currently using `console.warn` for extension replacements
   - For a production library, we may want to implement a more sophisticated logging system
   - This could be configurable via the SDK's debug/verbose settings

4. **SDK Integration**:
   - The AstralSDK class will initialize an ExtensionRegistry instance
   - It will expose methods to register custom extensions
   - Built-in extensions will be registered during SDK initialization
   - Example: `sdk.extensions.registerLocationExtension(myCustomExtension)`

5. **Conversion Precision**:
   - We'll implement strict equality checks to detect ANY change in coordinate values
   - This will involve comparing coordinates before and after format conversion
   - If any coordinates change, we'll trigger appropriate warnings

6. **Error Handling**:
   - Clear error messages will be provided for validation failures
   - Messages should help developers understand how to fix issues
   - Extensions should validate input data thoroughly

### Task 2: GeoJSON Extension Implementation

#### Initial Implementation:
- Created the `GeoJSONExtension` class in `src/extensions/location/builtins/GeoJSON.ts` 
- Integrated with Turf.js for GeoJSON operations and validation
- Implemented comprehensive validation for all GeoJSON types
- Added support for coordinate preservation checking
- Created helper type guards (`isGeoJSON`, `isPosition`)
- Implemented the full `LocationTypeExtension` interface
- Updated `src/extensions/location/index.ts` with helper functions

#### Test Coverage:
- Created comprehensive tests in `test/extensions/location/GeoJSON.test.ts`
- Tests cover all core GeoJSON functionalities:
  - Type guards for Position and GeoJSON structures
  - Validation of various GeoJSON types
  - Conversion methods
  - Coordinate extraction and preservation
- Validated edge cases like invalid GeoJSON structures
- Tested polygon-specific validation (ring closure)

#### Dev Review & Discussion:
- **Extension ID Format**: Created an ID format `astral:location:geojson` that follows a URI-like namespace pattern. This provides a hierarchical identifier system but needs to be documented as a convention.
- **JSON Canonicalization**: Discussed trade-offs of using `JSON.stringify` as a canonicalization method:
  - Pro: Simple implementation with standard JavaScript
  - Con: Doesn't guarantee property ordering, which might lose important structure
  - Consideration: For coordinate values in arrays, ordering is preserved, which is most critical
  - Future improvement: Consider implementing formal JSON Canonicalization Scheme (JCS) for properties if needed

- **Type Specificity**: Discussed the benefits of stricter return types:
  - Current implementation uses broad types (`object`, `unknown`) in some places
  - Benefits of specific types: Better developer experience, type safety, autocomplete
  - Drawbacks: May restrict valid use cases or require excessive type casting
  - Recommendation: Use more specific types where the structure is well-defined, keeping broader types for flexible interfaces

- **Error Handling**: Identified opportunities to use the SDK's error hierarchy more effectively:
  - Currently using generic `Error` instances
  - Should use specific error types (`LocationFormatError`, `ConversionError`)
  - Will enhance developer experience with more precise error handling

- **Coordinate Validation**: Noted lack of coordinate range validation:
  - Current implementation checks structure but not value ranges
  - Should validate longitude [-180, 180] and latitude [-90, 90]
  - Planned enhancement in next iteration

#### Technical Notes:
- GeoJSON serves as the "hub" format for all location conversions
- Coordinate preservation is critical for data integrity
- GeoJSON validation handles both structural and semantic validity
- Polygon-specific validation ensures rings are properly closed
- The implementation handles all GeoJSON types as specified in RFC 7946

#### Next Steps:
1. Enhance error handling with specific error types
2. Optimize Turf.js imports to reduce bundle size
3. Implement coordinate range validation
4. Integrate coordinate preservation checking in conversions
5. Document extension ID format convention
6. Clarify parseLocationString purpose and flow
7. Continue with remaining location format extensions (Coordinate, WKT, H3)