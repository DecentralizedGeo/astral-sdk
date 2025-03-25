## **6. AstralSDK Class Implementation** 
 
   - [ ] *Description*: Implement the main `AstralSDK` class that serves as the entry point for the library, providing a unified interface for both offchain and onchain workflows while maintaining their separation.
   
   - *Sub-tasks*: 
     - [ ] Review `.ai/api.md` to understand the complete API design
     
     - [ ] In `src/core/AstralSDK.ts`, implement the class:
       - [ ] Create constructor accepting configuration options:
         - [ ] `baseUrl`: API URL (default: "https://api.astral.global")
         - [ ] `defaultChain`: Default blockchain (default: "sepolia")
         - [ ] `provider`: ethers Provider for blockchain operations (optional)
         - [ ] `signer`: ethers Signer for signatures and transactions (optional)
         - [ ] `ipfsConfig`: Optional IPFS configuration (placeholder for future)
         - [ ] `apiKey`: Astral API key (optional)
     
     - [ ] Initialize core components:
       - [ ] `this.api = new AstralApiClient(options.baseUrl, options.apiKey)`
       - [ ] `this.offchainSigner = new OffchainSigner(options.signer)`
       - [ ] `this.onchainRegistrar = new OnchainRegistrar(options.provider || options.signer, options.defaultChain)`
       - [ ] Initialize location format utilities
       - [ ] Initialize media format utilities
     
     - [ ] Implement config fetching:
       - [ ] `async fetchConfig(): Promise<AstralConfig>`
       - [ ] Make config fetching optional but available
       - [ ] Cache config data when fetched
     
     - [ ] Implement offchain workflow methods:
       - [ ] `async createOffchainLocationProof(input: LocationProofInput, options?: OffchainProofOptions): Promise<OffchainLocationProof>`
         - [ ] Validate and normalize input
         - [ ] Format location data using appropriate formatter
         - [ ] Process media data if provided
         - [ ] Call offchainSigner.signOffchainLocationProof()
         - [ ] Return the signed OffchainLocationProof
       
       - [ ] `async verifyOffchainLocationProof(proof: OffchainLocationProof): Promise<boolean>`
         - [ ] Call offchainSigner.verifyOffchainLocationProof()
         - [ ] Return verification result
       
       - [ ] `async publishOffchainLocationProof(proof: OffchainLocationProof): Promise<void>`
         - [ ] Placeholder for future publishing functionality
         - [ ] Throw NotImplementedError in v0.1
     
     - [ ] Implement onchain workflow methods:
       - [ ] `async createOnchainLocationProof(input: LocationProofInput, options?: OnchainProofOptions): Promise<OnchainLocationProof>`
         - [ ] Validate and normalize input
         - [ ] Format location data using appropriate formatter
         - [ ] Process media data if provided
         - [ ] Call onchainRegistrar.registerOnchainLocationProof()
         - [ ] Return the registered OnchainLocationProof
       
       - [ ] `async verifyOnchainLocationProof(proof: OnchainLocationProof): Promise<boolean>`
         - [ ] Call onchainRegistrar.verifyOnchainLocationProof()
         - [ ] Return verification result
       
       - [ ] `async revokeOnchainLocationProof(proof: OnchainLocationProof): Promise<void>`
         - [ ] Call onchainRegistrar.revokeOnchainLocationProof()
     
     - [ ] Implement query methods:
       - [ ] `async getLocationProof(uid: string): Promise<LocationProof>`
         - [ ] Call this.api.getLocationProof()
         - [ ] Return properly typed result based on proof metadata
       
       - [ ] `async getLocationProofs(query: ProofQuery): Promise<LocationProofCollection>`
         - [ ] Call this.api.getLocationProofs()
         - [ ] Return collection with properly typed proofs
     
     - [ ] Implement convenience methods:
       - [ ] `async createAndPublishOffchainProof(input: LocationProofInput, options?: OffchainProofOptions): Promise<OffchainLocationProof>`
         - [ ] Combination of create + publish in one call
         - [ ] Will throw NotImplementedError in v0.1 for publishing part
       
       - [ ] `isOffchainLocationProof(proof: LocationProof): proof is OffchainLocationProof`
         - [ ] Type guard re-export
       
       - [ ] `isOnchainLocationProof(proof: LocationProof): proof is OnchainLocationProof`
         - [ ] Type guard re-export
     
     - [ ] Implement utility methods:
       - [ ] `getVersion(): string`
         - [ ] Returns library version
       
       - [ ] `disconnect(): void`
         - [ ] Clean up any resources (provider listeners, etc.)
     
     - [ ] Write comprehensive tests:
       - [ ] Test constructor with various options combinations
       - [ ] Test each offchain workflow method
       - [ ] Test each onchain workflow method
       - [ ] Test query methods
       - [ ] Test convenience methods
       - [ ] Use dependency injection to mock dependencies
       - [ ] Verify correct method delegation to underlying components
   
   - [ ] *Output*: 
     - [ ] A complete AstralSDK class that serves as the main entry point
     - [ ] Clear separation between offchain and onchain workflows
     - [ ] Proper delegation to specialized components
     - [ ] Comprehensive test coverage
   
   - *Technical considerations*:
     - [ ] Keep the main class clean by delegating implementation details to specialized components
     - [ ] Maintain clear method naming that indicates workflow (offchain vs onchain)
     - [ ] Document all public methods with JSDoc comments
     - [ ] Include appropriate error handling and validation
     - [ ] Support both Node.js and browser environments
     - [ ] Allow flexibility in configuration
     - [ ] Consider lazy initialization of heavy components
     - [ ] Add debug logging for troubleshooting (optional)
     - [ ] Ensure thread safety for concurrent operations
     - [ ] Keep the API surface clean and intuitive
     - [ ] Avoid method overloading that could confuse the distinction between workflows

Complete: ⬜️

Commit hash: <todo>

## Implementation Report:

[TODO]