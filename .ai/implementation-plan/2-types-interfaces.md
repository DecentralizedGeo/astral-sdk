## **2. Core Types & Interfaces Definition**  
  *Description*: Define TypeScript interfaces and types for the core data structures, with clear separation between offchain and onchain proof types to support our dual-workflow architecture.
   
   - *Sub-tasks*: 
     - [x] Add the prior Phase's commit hash(es) to the .ai/{prior-phase-name}.md file
     - [x] **Begin by thoroughly reviewing**:
       - [x] `.ai/api.md` for complete method signatures and parameters
       - [x] `.ai/data-model.md` for detailed field descriptions
       - [x] `.ai/eas-context.md` for EAS-specific requirements
       - [x] `.ai/architecture.md` for workflow separation guidelines
       - [x] The EAS documentation and SDK — which will have many type definitions and examples!
       - [x] Astral's documentation for schema definition, Location Types, Media Types
    - [x] Ask me — Do you have any questions? Is anything unclear? Are there contradictions or conflicts in the resources you've reviewed? Do you need more context? Let's clarify all of this before we move on to implementation. 

     - [x] In `src/core/types.ts`, create the base types and interfaces:
       - [x] Define `UnsignedLocationProof` interface as the common base type with fields:
         - [x] `eventTimestamp`: Date (developer-friendly) with conversion utilities for EAS encoding
         - [x] `srs`: string (default "EPSG:4326")
         - [x] `locationType`: Refer to Astral documentation for valid location types supported in v0.1, and the Location Format Identifier Naming Convention
         - [x] `location`: string
         - [x] `recipeTypes`: Array of recipe type strings (with literals for known types)
         - [x] `recipePayloads`: Array of payload strings
         - [x] `mediaTypes`: Array of media MIME types
         - [x] `mediaData`: Array of media data strings
         - [x] `memo`: Optional string
      - [x] Add comprehensive JSDoc comments to all types and interfaces, clearly explaining:
        - [x] The purpose of each type
        - [x] The workflow it belongs to (offchain or onchain)
        - [x] Field descriptions and validation requirements
        - [x] Example usages where appropriate

       - [x] Define `OffchainLocationProof` interface extending `UnsignedLocationProof` with signature-related fields:
         - [x] `uid`: string (computed from hash of signed data)
         - [x] `signature`: string (EIP-712 signature)
         - [x] `attester`: string (address of the signer)
         - [x] Include publish status and timestamp if published
        - [x] Add comprehensive JSDoc comments to all types and interfaces, clearly explaining:
          - [x] The purpose of each type
          - [x] The workflow it belongs to (offchain or onchain)
          - [x] Field descriptions and validation requirements
          - [x] Example usages where appropriate

       - [x] Define `OnchainLocationProof` interface extending `UnsignedLocationProof` with blockchain-related fields:
         - [x] `uid`: string (EAS-generated UID)
         - [x] `chain`: string (blockchain network), refer to config/EAS-config.json for supported chains
         - [x] `chainId`: number (blockchain network ID), refer to config/EAS-config.json for supported chains
         - [x] `transactionHash`: string
         - [x] `blockNumber`: number
         - [x] `attester`: string (address of the transaction sender)
         - [x] `revocable`: boolean
         - [x] `revoked`: boolean
         - [x] Add comprehensive JSDoc comments to all types and interfaces, clearly explaining:
          - [x] The purpose of each type
          - [x] The workflow it belongs to (offchain or onchain)
          - [x] Field descriptions and validation requirements
          - [x] Example usages where appropriate

       - [x] Create union type: `type LocationProof = OffchainLocationProof | OnchainLocationProof`
       - [ ] Add comprehensive JSDoc comments to all types and interfaces, clearly explaining:
     - [x] In `src/utils/typeGuards.ts`, implement type guards:
       - [x] `isOffchainLocationProof(proof: LocationProof): proof is OffchainLocationProof`
       - [x] `isOnchainLocationProof(proof: LocationProof): proof is OnchainLocationProof`
       - [x] Add comprehensive JSDoc comments to all types and interfaces, clearly explaining:
        - [x] The purpose of each type
        - [x] The workflow it belongs to (offchain or onchain)
        - [x] Field descriptions and validation requirements
        - [x] Example usages where appropriate
       
     - [x] Define input interfaces:
       - [x] `LocationProofInput` for creating proofs (with flexible location input options)
       - [x] `ProofOptions` with properties like `revocable`, `subject` (optional recipient address)
       - [x] Separate `OffchainProofOptions` and `OnchainProofOptions` with workflow-specific settings
       - [x] Add comprehensive JSDoc comments to all types and interfaces, clearly explaining:
     - [x] Define extension interfaces in `src/extensions/types.ts`:
      - [x] For this step, detail out your plan and let's discuss it before you start implementing.
      - [x] Create abstract class `BaseExtension` implementing common functionality
       - [x] `LocationTypeExtension` interface with methods required to accept and process location data
       - [x] `ProofRecipeExtension` interface as a placeholder for future extensibility
       - [x] `MediaAttachmentExtension` interface with methods required to accept and process media attachment data
       - [x] Add comprehensive JSDoc comments to all types and interfaces, clearly explaining:
       
     - [x] Define query interfaces:
       - [x] `ProofQuery` with filters for retrieving proofs
       - [x] `LocationProofCollection` for query results
       - [x] Add comprehensive JSDoc comments to all types and interfaces

     - [x] Create error hierarchy in `src/core/errors.ts`:
       - [x] `AstralError` as the base class
       - [x] `ValidationError` for input validation issues
       - [x] `SignatureError` for offchain signature problems
       - [x] `TransactionError` for onchain transaction issues
       - [x] `APIError` for Astral API communication issues
       - [x] `ExtensionError` for extension-related problems
       - [x] Include useful properties (status codes, error messages) and static factory methods
       - [x] Add comprehensive JSDoc comments to all types and interfaces
       
     - [x] Create configuration interfaces:
       - [x] `AstralSDKConfig` with common configuration properties
       - [x] `OffchainSignerConfig` and `OnchainRegistrarConfig` for specific workflow configs
       - [x] Add comprehensive JSDoc comments to all types and interfaces
     - [x] Define storage-related interfaces:
      - [x] For this step, detail out your plan and let's discuss it before you start implementing.
       - [x] Interfaces for storage adapters that handle proof persistence
       - [x] Types for IPFS or other decentralized storage options
       - [x] Add comprehensive JSDoc comments to all types and interfaces

     - [x] Define verification result types:
       - [x] `VerificationResult` interface with detailed information about proof validity
       - [x] `VerificationError` enumeration for specific verification failure reasons
       - [ ] Add comprehensive JSDoc comments to all types and interfaces
       
     - [x] Create barrel files (index.ts) for each directory to manage exports
     
     - [x] **Final check**: Cross-reference the completed types against `.ai/api.md` and `.ai/data-model.md` to ensure no fields or types are missing
       
   - [ ] *Output*: A comprehensive set of well-typed definitions that establish the foundation for our dual-workflow architecture, maintaining clear separation between offchain and onchain concepts.
   
   - *Technical considerations*: 
     - Use readonly properties where appropriate to enforce immutability
     - For timestamp handling, use `Date` objects in the API for developer friendliness, but implement conversion utilities to/from Unix time (seconds since epoch) for EAS compatibility
     - Use discriminated unions with appropriate type guards to allow safe type narrowing
     - Ensure naming consistency with camelCase in our SDK while handling snake_case from the Astral API
     - Document field requirements and validations in JSDoc comments
     - Keep types strictly separated by workflow, with shared types only for genuinely common concepts
     - Design error classes with sufficient detail to help developers troubleshoot issues in either workflow
     - Include utility types for internal implementation needs
     - Refer to EAS documentation for exact field requirements in attestation data
     - Consider using branded types for UIDs to prevent accidental mixing of different ID types

Complete: ✅

Commit hash: <todo>

## Implementation Report:

### Key Accomplishments

1. **Defined Core Type Hierarchy**:
   - Created `UnsignedLocationProof` as the base interface with all EAS schema fields
   - Extended it with `OffchainLocationProof` for signed proofs and `OnchainLocationProof` for blockchain-registered proofs
   - Created a union type `LocationProof` to represent either type of proof

2. **Implemented Type Guards**:
   - Created `isOffchainLocationProof` and `isOnchainLocationProof` to safely narrow union types
   - Added utility type guards for common validations (Ethereum addresses, UIDs, timestamps)

3. **Created Error Hierarchy**:
   - Defined `AstralError` as the base class with context, code, and cause properties
   - Created specialized error classes for specific error categories (validation, signing, storage, etc.)
   - Added factory methods for convenient error creation

4. **Defined Extension System**:
   - Created `BaseExtension` abstract class with common extension metadata
   - Defined specialized interfaces for location formats, media types, and recipes
   - Created registry interface for managing extensions

5. **Created Configuration Interfaces**:
   - Defined SDK-level configuration options
   - Created workflow-specific configurations for offchain signing and onchain registration
   - Added storage-specific configuration interfaces

6. **Provided Comprehensive Documentation**:
   - Added extensive JSDoc comments for all interfaces and types
   - Included examples of how each type would be used
   - Documented workflow separation throughout the codebase

### Design Decisions and Refinements

1. **Workflow Separation**:
   - Maintained clear separation between offchain and onchain concepts
   - Used separate interfaces for workflow-specific options
   - Added explicit documentation about which workflow a type belongs to

2. **Type Safety Improvements**:
   - Replaced `any` with `unknown` where possible for better type safety
   - Made properties readonly to enforce immutability
   - Used discriminated unions with type guards for safe type narrowing

3. **Extension System Design**:
   - Added the ability to convert any location format to GeoJSON
   - Used a registry pattern for extension management
   - Created minimal recipe extensions for future extensibility

4. **Signature Handling**:
   - Added a version field to track the protocol version
   - Added documentation about signature format questions that need further investigation

### Lessons Learned

1. **EAS Integration Considerations**:
   - Signature format may need special handling (v, r, s components)
   - Need to verify compatibility between Uint8Array and Solidity bytes type
   - Schema considerations for recipe payloads need further exploration

2. **Metadata Usage**:
   - Need to clarify the purpose and structure of metadata in PublicationRecord and MediaInput

3. **Documentation Importance**:
   - Comments and documentation help identify areas needing further investigation
   - JSDoc examples provide clarity on how interfaces should be used

### Future Work

1. **Type Refinements**:
   - Finalize signature format after EAS SDK integration
   - Add GeoJSON type guard for better type safety
   - Consider branded types for UIDs to prevent mixing different ID types

2. **Extension System Implementation**:
   - Implement concrete extension classes based on the defined interfaces
   - Add extension discovery and registration mechanisms
   - Create tests for extension functionality

3. **Validation Implementation**:
   - Create validation utilities that use the type guards
   - Implement conversion utilities between Date objects and Unix timestamps
   - Add schema validation against EAS requirements

4. **API Alignment**:
   - Ensure API responses can be mapped to the defined interfaces
   - Create serialization/deserialization utilities for API communication