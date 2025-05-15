## **4. EAS Client Integration**  
  *Description*: Develop the EAS integration module with separate components for offchain signing and onchain registration workflows, leveraging the EAS SDK for all core functionality. Each SDK instance will be bound to a single chain.

  *Implementation Approach*:
  - Use thin wrapper pattern around EAS SDK components
  - Leverage EAS SDK's built-in ethers.js integration for all blockchain interactions
  - Map our domain models to EAS schema data formats
  - Ensure clear separation between offchain and onchain workflows
  - Prioritize type safety and helpful error messages
  - Follow the existing extension system pattern for consistency
  - Use semantic commit messages following the pattern: `type(scope): description`
    - Types: feat, fix, docs, style, refactor, test, chore
    - Example: `feat(eas): implement chain configuration loader`
   
   - *Sub-tasks*: 
     - [x] Review `.ai/eas-context.md` to understand EAS capabilities, particularly the differences between offchain and onchain attestations. Review EAS SDK documentation to understand the different methods and options available.
       - [x] Create a semantic commit when complete: `docs(eas): review EAS capabilities and SDK documentation`
     
     - [x] Implement `src/eas/chains.ts`:
       - [x] Function to load chain configuration from `config/EAS-config.json`
       - [x] Helper function `getChainConfig(chainId)` to retrieve config for a specific chain
       - [x] Utility functions to convert between chain names and IDs
       - [x] Initially focus on Sepolia testnet for development and testing
       - [x] Single chain loading pattern aligned with SDK initialization
       - [x] Support for version-specific schema loading from EAS-config.json
       - [x] Create a semantic commit when complete: `feat(eas): implement chain configuration loader`
       - Commit hash: b13e632
     
     - [x] Implement `src/eas/SchemaEncoder.ts`:
       - [x] Thin wrapper around EAS SDK's `SchemaEncoder` class
       - [x] Use the EAS SDK `SchemaEncoder` directly for encoding operations
       - [x] Add convenience methods to convert between our types and EAS format
       - [x] Define interfaces for schema data validation
       - [x] Create a semantic commit when complete: `feat(eas): implement schema encoder wrapper`
       - Commit hash: 672ab10
     
     - [ ] Implement `src/eas/OffchainSigner.ts` for the offchain workflow:
       - [ ] Constructor accepting ethers Signer
       - [ ] Properly type ethers v6 Signer and refine the signer property in OffchainSignerConfig
       - [ ] Method `signOffchainLocationProof(unsignedProof: UnsignedLocationProof): Promise<OffchainLocationProof>`
         - [ ] **Use EAS SDK's `EAS.getOffchainAttestationSignature` method** for obtaining signatures
         - [ ] **Use EAS SDK's offchain modules** for all EIP-712 type construction
         - [ ] Define correct signature format based on EAS SDK implementation (string vs. v,r,s object)
         - [ ] Return complete OffchainLocationProof with signature
       
       - [ ] Method `verifyOffchainLocationProof(proof: OffchainLocationProof): Promise<boolean>`
         - [ ] **Use EAS SDK's built-in verification methods** for basic signature verification
         - [ ] Keep validation focused on signature correctness for MVP
       - [ ] Create a semantic commit when complete: `feat(eas): implement offchain signer for location proofs`
       - Commit hash: ________
     
     - [ ] Implement `src/eas/OnchainRegistrar.ts` for the onchain workflow:
       - [ ] Constructor accepting ethers Provider/Signer and specific chain ID/name
       - [ ] Properly type ethers v6 Provider/Signer and refine the provider/signer properties in OnchainRegistrarConfig
       - [ ] Initialize a single EAS instance for the specified chain
       - [ ] Method `registerOnchainLocationProof(unsignedProof: UnsignedLocationProof, options: OnchainProofOptions): Promise<OnchainLocationProof>`
         - [ ] **Use EAS SDK's `EAS.attest` method** directly for submitting attestations
         - [ ] Configure EAS instance using EAS SDK's connection methods
         - [ ] Leverage EAS SDK's built-in transaction handling
         - [ ] Return OnchainLocationProof with transaction details, UID, and chain information
       
       - [ ] Method `verifyOnchainLocationProof(proof: OnchainLocationProof): Promise<boolean>`
         - [ ] **Use EAS SDK's `EAS.getAttestation` method** to retrieve attestation data
         - [ ] Implement simple existence check for MVP verification
         - [ ] Use chain information from the proof object to verify on the correct chain
       
       - [ ] Method `revokeOnchainLocationProof(proof: OnchainLocationProof): Promise<void>`
         - [ ] **Use EAS SDK's `EAS.revoke` method** to submit revocation
       - [ ] Create a semantic commit when complete: `feat(eas): implement onchain registrar for location proofs`
       - Commit hash: ________
     
     - [ ] Implement schema extensibility:
       - [ ] Define `SchemaExtension` interface extending `BaseExtension`
       - [ ] Add schema extension support to `ExtensionRegistry`
       - [ ] Create built-in schema extension(s) for Astral location schema
       - [ ] Add methods for registering custom schema extensions
       - [ ] Provide schema validation helpers using the existing pattern
       - [ ] Create a semantic commit when complete: `feat(extensions): add schema extensions for EAS schemas`
       - Commit hash: ________
     
     - [ ] Add streamlined error handling:
       - [ ] Create basic error classes for common failure scenarios (e.g., SchemaError, EASConnectionError)
       - [ ] Properly propagate and contextualize EAS SDK errors
       - [ ] Provide clear context for each error
       - [ ] Focus on helpful error messages that guide developers
       - [ ] Create a semantic commit when complete: `feat(eas): add specialized error handling for EAS operations`
       - Commit hash: ________
     
     - [ ] Update AstralSDK to specify chain at initialization:
       - [ ] Document that each SDK instance works with a single chain
       - [ ] Make chain ID/name a required parameter for onchain operations
       - [ ] Clarify in documentation that multi-chain operations require multiple SDK instances
       - [ ] Ensure seamless integration with the existing extension system for location and media formats
       - [ ] Update SDK to use schema extensions when encoding/decoding data
       - [ ] Create a semantic commit when complete: `feat(sdk): integrate EAS client with AstralSDK`
       - Commit hash: ________
     
     - [ ] Write targeted tests:
       - [ ] **Unit tests**:
         - [ ] Mock EAS SDK methods to test core integration paths
         - [ ] Focus on testing happy paths and common error cases
         - [ ] Verify correct parameters are passed to EAS SDK
         - [ ] Test both built-in and custom schema extensions
       
       - [ ] **Integration tests**:
         - [ ] Test with actual EAS contracts on Sepolia testnet
         - [ ] Focus on end-to-end testing of the primary workflows
       - [ ] Create a semantic commit when complete: `test(eas): add unit and integration tests for EAS client`
       - Commit hash: ________
   
   - [ ] *Output*: 
     - [ ] Two distinct client implementations that leverage EAS SDK functionality for their respective workflows
     - [ ] Chain-specific SDK design with clear documentation
     - [ ] Type-safe wrappers around EAS SDK functionality
     - [ ] Extension-based schema system supporting both built-in and custom schemas
   
   - *Technical considerations*: 
     - [ ] Design for single-chain operation - each SDK instance connects to one specific chain
     - [ ] Use EAS SDK functionality rather than reimplementing any cryptographic or blockchain operations
     - [ ] Properly import and initialize all EAS SDK components according to their documentation
     - [ ] Follow EAS SDK patterns and best practices
     - [ ] Document that for multi-chain read operations, Astral API is the recommended path
     - [ ] Handle EAS SDK versioning appropriately (currently v2.7.0+)
     - [ ] Ensure proper error propagation from EAS SDK with helpful context
     - [ ] Set up ethers providers and signers exactly as recommended by EAS documentation
     - [ ] Keep our wrappers thin and focused on converting between our domain models and EAS requirements
     - [ ] Make it clear in documentation that multiple SDK instances are needed for multi-chain operations
     - [ ] Focus on Sepolia testnet first, then expand to other chains in subsequent iterations
     - [ ] Prioritize working core functionality over comprehensive edge case handling for MVP
     - [ ] Keep schema extension system aligned with the existing extension patterns for simplicity and elegance

Complete: ⬜️

Commit hash: <todo>

## Implementation Report:

[TODO]