## **2. Core Types & Interfaces Definition**  
   - *Description*: Define TypeScript interfaces and types for the core data structures, with clear separation between offchain and onchain proof types to support our dual-workflow architecture.
   
   - *Sub-tasks*: 
     - **Begin by thoroughly reviewing**:
       - `.ai/api.md` for complete method signatures and parameters
       - `.ai/data-model.md` for detailed field descriptions
       - `.ai/eas-context.md` for EAS-specific requirements
       - `.ai/architecture.md` for workflow separation guidelines
       - The EAS documentation and SDK — which will have many type definitions and examples!
       - Astral's schema definition for field alignment

     - In `src/core/types.ts`, create the base types and interfaces:
       - Define `UnsignedLocationProof` interface as the common base type with fields:
         - `eventTimestamp`: Date (developer-friendly) with conversion utilities for EAS encoding
         - `srs`: string (default "WGS84")
         - `locationType`: Literal type ('point' | 'polygon' | 'linestring')
         - `location`: string (GeoJSON format) 
         - `recipeTypes`: Array of recipe type strings (with literals for known types)
         - `recipePayloads`: Array of payload strings
         - `mediaTypes`: Array of media MIME types
         - `mediaData`: Array of media data strings
         - `memo`: Optional string

       - Define `OffchainLocationProof` interface extending `UnsignedLocationProof` with signature-related fields:
         - `uid`: string (computed from hash of signed data)
         - `signature`: string (EIP-712 signature)
         - `attester`: string (address of the signer)
         - Include publish status and timestamp if published

       - Define `OnchainLocationProof` interface extending `UnsignedLocationProof` with blockchain-related fields:
         - `uid`: string (EAS-generated UID)
         - `chain`: string (blockchain network)
         - `transactionHash`: string
         - `blockNumber`: number
         - `attester`: string (address of the transaction sender)
         - `revocable`: boolean
         - `revoked`: boolean

       - Create union type: `type LocationProof = OffchainLocationProof | OnchainLocationProof`
       
     - In `src/utils/typeGuards.ts`, implement type guards:
       - `isOffchainLocationProof(proof: LocationProof): proof is OffchainLocationProof`
       - `isOnchainLocationProof(proof: LocationProof): proof is OnchainLocationProof`
       
     - Define input interfaces:
       - `LocationProofInput` for creating proofs (with flexible location input options)
       - `ProofOptions` with properties like `revocable`, `subject` (optional recipient address)
       - Separate `OffchainProofOptions` and `OnchainProofOptions` with workflow-specific settings
       
     - Define extension interfaces in `src/extensions/types.ts`:
       - `LocationProofExtension` interface with methods:
         - `collect(options?): Promise<RecipeData>`
         - `validate(proof: LocationProof): boolean`
       - Create abstract class `BaseExtension` implementing common functionality
       
     - Define query interfaces:
       - `ProofQuery` with filters for retrieving proofs
       - `LocationProofCollection` for query results
       
     - Create error hierarchy in `src/core/errors.ts`:
       - `AstralError` as the base class
       - `ValidationError` for input validation issues
       - `SignatureError` for offchain signature problems
       - `TransactionError` for onchain transaction issues
       - `APIError` for Astral API communication issues
       - `ExtensionError` for extension-related problems
       - Include useful properties (status codes, error messages) and static factory methods
       
     - Create configuration interfaces:
       - `AstralSDKConfig` with common configuration properties
       - `OffchainSignerConfig` and `OnchainRegistrarConfig` for specific workflow configs
       
     - Define storage-related interfaces:
       - Interfaces for storage adapters that handle proof persistence
       - Types for IPFS or other decentralized storage options
       
     - Define verification result types:
       - `VerificationResult` interface with detailed information about proof validity
       - `VerificationError` enumeration for specific verification failure reasons
       
     - Add comprehensive JSDoc comments to all types and interfaces, clearly explaining:
       - The purpose of each type
       - The workflow it belongs to (offchain or onchain)
       - Field descriptions and validation requirements
       - Example usages where appropriate
       
     - Create barrel files (index.ts) for each directory to manage exports
     
     - **Final check**: Cross-reference the completed types against `.ai/api.md` and `.ai/data-model.md` to ensure no fields or types are missing
       
   - *Output*: A comprehensive set of well-typed definitions that establish the foundation for our dual-workflow architecture, maintaining clear separation between offchain and onchain concepts.
   
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

Complete: ⬜️

Commit hash: <todo>

## Implementation Report:

[TODO]