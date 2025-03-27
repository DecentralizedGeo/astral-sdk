## **3. Extension System Implementation**  
  *Description*: Implement robust Location Type and Media Type extensions supporting common formats specified in the Astral documentation, working seamlessly with both offchain and onchain workflows.
   
   - *Sub-tasks*: 
     - [ ] Review Astral documentation to identify core supported formats:
       - [ ] Location formats: GeoJSON, decimal coordinates, WKT, H3
       - [ ] Media types: Focus on common web formats only (JPEG, PNG, PDF)
     
     - [ ] Create `src/extensions/location/index.ts` exporting all location utilities:
       - [ ] Implement comprehensive location format handlers:
         - [ ] `GeoJSONHandler`: Support point, polygon, linestring with validation (primary focus)
         - [ ] `DecimalCoordinatesHandler`: Parse/format decimal lat/lng coordinates
         - [ ] `WKTHandler`: Well-Known Text format parsing/formatting
         - [ ] `H3Handler`: Hexagonal hierarchical geospatial indexing system
         
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
         
       - [ ] **Priority 2**: Add minimal support for common document formats
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
       
     - [ ] Implement ethical considerations documentation:
       - [ ] Create ETHICS.md documenting key tensions and privacy considerations
       - [ ] Create THREAT-MODELS.md outlining potential misuse scenarios 
       - [ ] Create VALUES.md articulating guiding principles
       - [ ] Add precision warnings for high-precision coordinates
       - [ ] Document the offchain workflow as a privacy-preserving option
     
   - [ ] *Output*: 
     - [ ] Robust, well-tested utilities for handling all location formats in the Astral documentation
     - [ ] Focused media handling for the most common web formats (JPEG, PNG, PDF)
     - [ ] Clear interfaces that can be extended in the future
     - [ ] Good test coverage for all implemented features
     - [ ] Documentation that sets appropriate expectations
     - [ ] Ethical considerations documentation establishing foundation for responsible use
   
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
     - [ ] Balance immediate implementation with future ethical enhancements
     - [ ] Add PR template section for ethical considerations
     - [ ] Make ethical documentation transparent about current capabilities and limitations

Complete: ⬜️

Commit hash: <todo>

## Implementation Report:

[TODO]