## **3. Extension System Implementation**  
  *Description*: Implement a focused Extension System MVP supporting GeoJSON location format and image media type, with clean integration into both offchain and onchain workflows.

  The goal for the MVP is to deliver a working extension system with the most essential formats (GeoJSON for location, JPEG/PNG for images) that integrates properly with the SDK. This will provide immediate value while setting up the architecture for additional formats later.
   
   - *Sub-tasks*: 
     - [x] Review Astral documentation (.ai/docs/*) to understand our designs and identify core supported formats
     - [x] Implement `ExtensionRegistry` system in `src/extensions/index.ts`:
       - [x] Design extension registry to manage all extension types
       - [x] Implement methods to register and retrieve extensions
       - [x] Ensure AstralSDK instances have their own extension registries
       - [x] Pre-register all built-in extensions by default
       - [x] Support custom extension registration

     ## MVP Priority Tasks
     
     Task 1: GeoJSON Extension Refinement
     - [x] Create `src/extensions/location/index.ts` exporting location extensions
     - [x] `GeoJSONExtension`: Support ALL GeoJSON types using @turf/turf
     - [x] Implement helper functions for location handling:
       - [x] `detectLocationFormat(location: unknown): string` - Auto-detect format
       - [x] `getLocationExtension(locationType: string): LocationTypeExtension` - Get handler
       - [x] `convertLocationFormat(location: unknown, sourceType: string, targetType: string): unknown` - Convert between formats
     - [x] Critical GeoJSON improvements:
       - [x] Use specific error types from our error hierarchy instead of generic Error instances
       - [x] Optimize Turf.js imports to reduce bundle size (partial - identified imports but temporarily kept full import for compatibility)
       - [x] Add coordinate range validation (longitude [-180, 180], latitude [-90, 90])
       - [x] Use checkCoordinatePreservation in the conversion process
       - [x] Update JSDoc comments to clearly explain format expectations
     
     Task 2: Image Extension Implementation
     - [x] Create `src/extensions/media/index.ts` with focused scope:
       - [x] Implement basic image handling (Priority 1):
         - [x] Support for JPEG and PNG formats only
         - [x] Light validation of image data (using file signature checks instead of external library)
         - [x] Base64 encoding/decoding utilities
       - [x] Create essential helper functions for media handling:
         - [x] `isSupportedMimeType(mimeType: string): boolean` - Check if MIME type is supported
         - [x] `getMediaExtension(mediaType: string): MediaAttachmentExtension` - Get handler
         - [x] `validateMediaData(mediaType: string, data: string): boolean` - Basic validation
     
     Task 3: SDK Integration
     - [ ] Integrate extensions with SDK workflow:
       - [ ] Update AstralSDK.buildLocationProof to use the GeoJSON extension
       - [ ] Add support for targetLocationFormat conversion in SDK interface
       - [ ] Implement warning system for data modifications
       - [ ] Create at least one example showing extension usage
     
     Task 4: Testing and Documentation
     - [x] Full test coverage for GeoJSON format
     - [x] Tests for image handling (JPEG, PNG)
     - [ ] Test compatibility with both offchain and onchain workflows
     - [ ] Document the MVP extensions:
       - [x] Add JSDoc comments to all public functions
       - [ ] Document which formats are supported in MVP
       - [ ] Document the extension ID format convention
       - [ ] Note which formats are planned for future versions
     
     ## v0.1 Full Implementation (Deferred)
     
     Task 5: Additional Location Format Extensions
     - [ ] Implement `CoordinateExtension`: Parse/format decimal lat/lng coordinates as both array and object
     - [ ] Implement `WKTExtension`: Well-Known Text format using wellknown library
     - [ ] Implement `H3Extension`: Hexagonal hierarchical geospatial indexing using h3-js
     - [ ] Preserve original input data in `_originalInputs` field 
     - [ ] Full test coverage for additional location formats:
       - [ ] Full test coverage for Coordinate format
       - [ ] Full test coverage for WKT format
       - [ ] Full test coverage for H3 format
     
     Task 6: Additional Media Type Extensions
     - [ ] Implement video handling (Priority 2):
       - [ ] Support for mp4 formats
       - [ ] Simple MIME type validation
     - [ ] Implement audio handling (Priority 3):
       - [ ] Support for mp3 formats
       - [ ] Simple MIME type validation
     - [ ] Implement document handling (Priority 4):
       - [ ] Basic PDF handling
       - [ ] Simple MIME type validation
     - [ ] Tests for additional media types
     
     Task 7: Extension System Refinements
     - [ ] Address type specificity questions:
       - [ ] Evaluate the benefits/drawbacks of stricter return types
       - [ ] Make consistent decisions across all extensions
     - [ ] Extension ID format standardization:
       - [ ] Standardize the URI-like namespace pattern (astral:location:geojson)
       - [ ] Apply consistently across all extensions
     - [ ] Remove in-code review comments after addressing them
     - [ ] Enhance documentation with examples for each supported format
     - [ ] Add appropriate warnings for non-coordinate data modifications
   
   - [ ] *MVP Output*: 
     - [ ] Fully functional GeoJSON support with proper error handling
     - [ ] Basic image handling for JPEG and PNG formats
     - [ ] Extension registry that allows for custom extensions
     - [ ] Good test coverage for the MVP features
     - [ ] Clear documentation of supported formats and usage
   
   - *Technical considerations*: 
     - [x] **Prioritize progress over completeness** - implement core functionality first
     - [x] Use established libraries rather than implementing from scratch:
       - [x] @turf/turf for GeoJSON operations (optimize imports)
       - [ ] file-type for basic image validation
       - [ ] wellknown for WKT parsing (deferred)
       - [ ] h3-js for H3 index handling (deferred)
     - [x] Design extensions to be developer-friendly - gracefully handle minor issues
     - [x] Use GeoJSON as the central conversion format for all location types
     - [ ] For media, focus on validation rather than conversion
     - [ ] Document limitations clearly and note planned future enhancements
     - [ ] Ensure the MVP extensions work with both offchain and onchain workflows
     - [x] Issue warnings for ANY coordinate value changes during conversion to maintain data integrity

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