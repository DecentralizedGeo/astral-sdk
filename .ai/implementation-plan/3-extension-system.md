## **3. Extension System Implementation**  
  *Description*: Implement robust Location Type and Media Type extensions supporting common formats specified in the Astral documentation, working seamlessly with both offchain and onchain workflows.

  The overall goal is to allow developers to add location data formatted in the supported types, and have it validated and added to the location proof. 
   
   - *Sub-tasks*: 
     - [ ] Review Astral documentation (.ai/docs/*) to understand our designs and identify core supported formats:
       - [ ] Location formats: `coordinate-decimal`, `geojson`, `wkt`, `h3`
       - [ ] Media types: `image`, `video`, `audio`, `document`. Focus on the most commonly-used subtypes only (JPEG, PNG, mp4, mp3, PDF, maybe others if it's easy)
     
     - [ ] Create `src/extensions/location/index.ts` exporting all location utilities:
       - [ ] Implement comprehensive location format handlers:
         - [ ] `GeoJSONHandler`: Support point, polygon, linestring with validation (primary focus). Use well-known libraries for parsing and formatting. Which do you recommend? 
         - [ ] `CoordinatesHandler`: Parse/format decimal lat/lng coordinates
         - [ ] `WKTHandler`: Well-Known Text format parsing/formatting
         - [ ] `H3Handler`: Hexagonal hierarchical geospatial indexing system
         Do note that all the handlers should retain the original input data exactly as it was received. If it needs to be modified in order to conform to the format, make sure to keep a copy of the original data and raise a warning.
         If the developer specifies a `targetLocationFormat`, convert the data to that format before returning an `UnsignedLocationProof` object.
         The purpose of this workflow is to accommodate different location formats, and to ensure that the location data is always in the correct format before being added to the location proof. This is important for downstream workflows that use the location data — we need it coerced into a format we can interpret.
         
       - [ ] Create unified interface for all location formats:
         - [ ] `formatLocation(data: any, format: LocationFormat): string` - Convert to standardized format. Include a return locationType string that adheres to the Location Type Format Identifier Naming Convention.
         - [ ] `parseLocation(location: string, format: LocationFormat): any` - Parse from string
         - [ ] `validateLocation(location: string, format: LocationFormat): boolean` - Validate format
         - [ ] `detectFormat(location: string): LocationFormat` - Auto-detect format
     
     - [ ] Create `src/extensions/media/index.ts` with focused scope:
       - [ ] **Priority 1**: Implement basic image handling
         - [ ] Support for JPEG and PNG formats
         - [ ] Simple validation of image data
         - [ ] Base64 encoding/decoding utilities
      - [ ] **Priority 2**: Implement basic video handling
        - [ ] Support for mp4 formats
        - [ ] Simple validation of video data
        - [ ] Base64 encoding/decoding utilities
      - [ ] **Priority 3**: Add minimal support for common audio formats
        - [ ] Support for mp3 formats
        - [ ] Simple validation of audio data
        - [ ] Base64 encoding/decoding utilities
      - [ ] **Priority 4**: Add minimal support for common document formats
         - [ ] Basic PDF handling
         - [ ] Simple MIME type validation
         
       - [ ] **Note explicitly in the code**: "Additional media types can be added in future versions"
         
       - [ ] Create simplified media interface:
         - [ ] `formatMedia(data: string, mimeType: string): MediaData` - Format media with correct metadata
         - [ ] `validateMedia(data: string, mimeType: string): boolean` - Validate basic format compliance
         - [ ] `isValidMimeType(mimeType: string): boolean` - Check if MIME type is supported
     
     - [ ] Implement common interfaces in `src/extensions/types.ts`:
       - [ ] Enum `LocationFormat` with all supported formats
       - [ ] Enum `MediaType` with limited supported types initially
       - [ ] Interface `LocationData` with standardized structure
       - [ ] Interface `MediaData` with standardized structure
     
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
     - [ ] Clear interfaces that can be extended in the future
     - [ ] Good test coverage for all implemented features
     - [ ] Documentation that sets appropriate expectations
   
   - *Technical considerations*: 
     - [ ] **Prioritize progress over completeness** - implement core functionality first
     - [ ] Keep implementation simple and maintainable
     - [ ] Design interfaces to be extendable for future media types
     - [ ] Focus on correctness for supported formats rather than breadth of format support
     - [ ] Use standard web APIs where possible to avoid dependencies
     - [ ] Make note of potential enhancements for future versions
     - [ ] Ensure all utilities work with both offchain and onchain workflows
     - [ ] If implementation of a specific format becomes time-consuming, document the limitation and move on
     - [ ] Include appropriate error messages when unsupported formats are attempted

Complete: ⬜️

Commit hash: <todo>

## Implementation Report:

[TODO]