## **4. Astral API Client Module**  
   - [ ] *Description*: Implement the API client module that communicates with Astral's REST API, supporting both offchain and onchain proof retrieval and queries.
   
   - *Sub-tasks*: 
     - [ ] Review the Astral API documentation to understand the endpoints and response formats
     
     - [ ] Create `src/api/AstralApiClient.ts`:
       - [ ] Implement a class with constructor that accepts:
         - [ ] `baseURL`: string (default: "https://api.astral.global")
         - [ ] `apiKey`: optional string for authentication (not relevant right now)
       - [ ] Initialize HTTP client configuration with proper headers
     
     - [ ] Implement core API methods:
       - [ ] `getConfig(): Promise<AstralConfig>` 
         - [ ] Fetches schema UID, supported chains, etc.
         - [ ] Caches response for subsequent calls
         - [ ] Used to verify schema and configure EAS addresses
       
       - [ ] `getLocationProof(uid: string): Promise<LocationProof>`
         - [ ] Fetches a single proof by UID
         - [ ] Handles both offchain and onchain proofs
         - [ ] Maps response to appropriate proof type based on metadata
       
       - [ ] `getLocationProofs(query: ProofQuery): Promise<LocationProofCollection>`
         - [ ] Builds query parameters based on ProofQuery object
         - [ ] Supports filtering by chain, prover, time range, etc.
         - [ ] Returns properly typed collection with metadata
         - [ ] Handles pagination if needed
       
       - [ ] `publishOffchainProof(proof: OffchainLocationProof): Promise<void>`
         - [ ] Placeholder for future publishing functionality
         - [ ] Will validate proof format but throw NotImplementedError in v0.1
         - [ ] Future versions will integrate with web3.storage or similar service
     
     - [ ] Create internal utility methods:
       - [ ] `private async request<T>(method: string, path: string, params?: object): Promise<T>`
         - [ ] Uses fetch API with proper error handling
         - [ ] Sets correct content types and authentication
         - [ ] Throws appropriate APIError instances on failure
       
       - [ ] `private mapResponseToProof(response: any): LocationProof`
         - [ ] Converts API response to proper LocationProof type
         - [ ] Uses type guards to create either OffchainLocationProof or OnchainLocationProof
         - [ ] Handles date conversion, GeoJSON parsing, etc.
     
     - [ ] Implement pagination handling:
       - [ ] Support `limit` and `offset` parameters in queries
       - [ ] Add utility for fetching all results across multiple pages
       - [ ] Consider implementing async generator pattern for efficient iteration
     
     - [ ] Create proper error handling:
       - [ ] Extend APIError class from AstralError
       - [ ] Include HTTP status codes, error messages
       - [ ] Implement specific error types for common failures
     
     - [ ] Add robust response parsing:
       - [ ] Handle both simplified and OGC API formats
       - [ ] Convert snake_case to camelCase
       - [ ] Parse timestamps into Date objects
       - [ ] Parse GeoJSON strings into objects
       - [ ] Map proof types correctly based on metadata
     
     - [ ] Write comprehensive tests:
       - [ ] Mock fetch responses for all endpoints
       - [ ] Test error handling for different status codes
       - [ ] Test successful parsing of different proof types
       - [ ] Ensure query parameters are correctly formatted
       - [ ] Test with sample data for both offchain and onchain proofs
     
   - [ ] *Output*: A fully functional API client that correctly handles both offchain and onchain proof retrieval, with proper error handling, response parsing, and query building.
   
   - *Technical considerations*: 
     - [ ] Ensure cross-platform compatibility (Node.js 18+ and modern browsers)
     - [ ] Use the fetch API with appropriate polyfills if needed
     - [ ] Implement intelligent type mapping to distinguish between offchain and onchain proofs
     - [ ] Add proper JSDoc comments for all public methods
     - [ ] Handle rate limiting gracefully (implement exponential backoff for 429 responses)
     - [ ] Consider caching where appropriate (config, frequently accessed proofs)
     - [ ] Include timeouts for network requests
     - [ ] Design for testability with dependency injection
     - [ ] Prioritize type safety throughout the implementation
     - [ ] Add logging at appropriate levels (debug, info, error)
     - [ ] Document any assumptions about the API structure

Complete: ⬜️

Commit hash: <todo>

## Implementation Report:

[TODO]