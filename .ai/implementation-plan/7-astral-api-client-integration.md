## **7. AstralApiClient Integration with AstralSDK**  
  *Description*: Integrate the AstralApiClient with the AstralSDK class to support query operations and proof publishing for both offchain and onchain workflows.
   
   - *Sub-tasks*: 
     - [ ] Update AstralSDK constructor to initialize AstralApiClient:
       - [ ] Add `private api?: AstralApiClient` property to AstralSDK class
       - [ ] Initialize AstralApiClient with baseURL and apiKey from config
       - [ ] Add debug logging for API client initialization
       - [ ] Handle initialization failures gracefully

     - [ ] Implement `ensureApiClientInitialized` method in AstralSDK:
       - [ ] Create a private method that ensures AstralApiClient is initialized before use
       - [ ] Initialize lazily if not done in constructor
       - [ ] Throw appropriate error if initialization fails
       - [ ] Add debug logging for initialization process

     - [ ] Implement `fetchConfig` method in AstralSDK:
       - [ ] Ensure AstralApiClient is initialized
       - [ ] Call api.getConfig() to fetch configuration data
       - [ ] Cache the results for subsequent calls
       - [ ] Add debug logging for configuration fetching
       - [ ] Handle API errors appropriately

     - [ ] Implement query methods in AstralSDK:
       - [ ] `async getLocationProof(uid: string): Promise<LocationProof>`
         - [ ] Ensure AstralApiClient is initialized
         - [ ] Call api.getLocationProof(uid)
         - [ ] Validate and process the response
         - [ ] Use type guards to return properly typed LocationProof
         - [ ] Handle API errors and not found cases

       - [ ] `async getLocationProofs(query: ProofQuery): Promise<LocationProofCollection>`
         - [ ] Ensure AstralApiClient is initialized
         - [ ] Call api.getLocationProofs(query)
         - [ ] Process and validate the collection
         - [ ] Ensure proper typing of all collection entries
         - [ ] Handle pagination metadata
         - [ ] Add support for iteration helpers if needed

     - [ ] Implement publishing functionality in AstralSDK:
       - [ ] `async publishOffchainLocationProof(proof: OffchainLocationProof): Promise<OffchainLocationProof>`
         - [ ] Ensure AstralApiClient is initialized
         - [ ] Validate the proof is properly signed
         - [ ] Call api.publishOffchainProof(proof)
         - [ ] Update the proof with publication information
         - [ ] Return the updated proof
         - [ ] Handle API errors appropriately

       - [ ] `async createAndPublishOffchainProof(input: LocationProofInput, options?: OffchainProofOptions): Promise<OffchainLocationProof>`
         - [ ] Create the proof using createOffchainLocationProof
         - [ ] Publish the proof using publishOffchainLocationProof
         - [ ] Return the published proof
         - [ ] Implement comprehensive error handling

     - [ ] Write comprehensive tests for API client integration:
       - [ ] Create mock responses for API endpoints
       - [ ] Test getLocationProof with valid and invalid UIDs
       - [ ] Test getLocationProofs with various query parameters
       - [ ] Test publishOffchainLocationProof with valid and invalid proofs
       - [ ] Test createAndPublishOffchainProof workflow
       - [ ] Test error handling for all API operations
       - [ ] Test config fetching and caching behavior

     - [ ] Update example files to demonstrate API integration:
       - [ ] Create a new example file for querying proofs
       - [ ] Create a new example for publishing proofs
       - [ ] Add appropriate comments explaining key steps
       - [ ] Include error handling examples

     - [ ] Implement type guards and utility functions:
       - [ ] Export isOffchainLocationProof and isOnchainLocationProof from AstralSDK
       - [ ] Create helper functions for common tasks if needed
       - [ ] Ensure proper type narrowing is available throughout the SDK

     - [ ] Perform integration testing:
       - [ ] Test against mock API endpoints
       - [ ] Document API expectations and response formats
       - [ ] Verify error handling with various failure scenarios

     - [ ] Review and refine implementation:
       - [ ] Ensure clean API surface with consistent patterns
       - [ ] Verify consistent error handling across all methods
       - [ ] Add or update JSDoc comments for all public methods
       - [ ] Run linting and fix any issues
       - [ ] Run TypeScript type checking and fix any issues

   - [ ] *Output*: A fully integrated AstralSDK with AstralApiClient, supporting query operations and proof publishing for both workflows.
   
   - *Technical considerations*: 
     - [ ] Consider caching strategies for frequent queries
     - [ ] Implement the NotImplementedError pattern for v0.1 features not yet available
     - [ ] Ensure proper error mapping from API errors to SDK errors
     - [ ] Document API requirements and endpoints
     - [ ] Handle API versioning gracefully
     - [ ] Consider rate limiting and backoff strategies
     - [ ] Ensure all API calls have appropriate timeouts
     - [ ] Add clear debugging and logging to help troubleshoot API operations
     - [ ] Document authentication requirements for protected endpoints

   - [ ] Run linting: `pnpm run lint`
   - [ ] Run typechecking: `pnpm run typecheck`
   - [ ] Run tests: `pnpm run test`
   - [ ] Commit changes with descriptive message

Complete: ⬜️

Commit hash: <todo>

## Implementation Report:

[TODO]