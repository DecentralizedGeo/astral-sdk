## **4. EAS Client Integration**  
  *Description*: Develop the EAS integration module with separate components for offchain signing and onchain registration workflows, leveraging the EAS SDK for all core functionality. Each SDK instance will be bound to a single chain.
   
   - *Sub-tasks*: 
     - [ ] Review `.ai/eas-context.md` to understand EAS capabilities, particularly the differences between offchain and onchain attestations. Review EAS SDK documentation to understand the different methods and options available.
     
     - [ ] Implement `src/eas/chains.ts`:
       - [ ] Function to load chain configuration from `config/EAS-config.json`
       - [ ] Helper function `getChainConfig(chainId)` to retrieve config for a specific chain
       - [ ] Utility functions to convert between chain names and IDs
       - [ ] Initially focus on Sepolia testnet for development and testing
       - [ ] Single chain loading pattern aligned with SDK initialization
     
     - [ ] Implement `src/eas/SchemaEncoder.ts`:
       - [ ] Thin wrapper around EAS SDK's `SchemaEncoder` class
       - [ ] Use the EAS SDK `SchemaEncoder` directly for encoding operations
       - [ ] Add convenience methods to convert between our types and EAS format
     
     - [ ] Implement `src/eas/OffchainSigner.ts` for the offchain workflow:
       - [ ] Constructor accepting ethers Signer
       - [ ] Method `signOffchainLocationProof(unsignedProof: UnsignedLocationProof): Promise<OffchainLocationProof>`
         - [ ] **Use EAS SDK's `EAS.getOffchainAttestationSignature` method** for obtaining signatures
         - [ ] **Use EAS SDK's offchain modules** for all EIP-712 type construction
         - [ ] Return complete OffchainLocationProof with signature
       
       - [ ] Method `verifyOffchainLocationProof(proof: OffchainLocationProof): Promise<boolean>`
         - [ ] **Use EAS SDK's built-in verification methods** for basic signature verification
         - [ ] Keep validation focused on signature correctness for MVP
     
     - [ ] Implement `src/eas/OnchainRegistrar.ts` for the onchain workflow:
       - [ ] Constructor accepting ethers Provider/Signer and specific chain ID/name
       - [ ] Initialize a single EAS instance for the specified chain
       - [ ] Method `registerOnchainLocationProof(unsignedProof: UnsignedLocationProof, options: OnchainProofOptions): Promise<OnchainLocationProof>`
         - [ ] **Use EAS SDK's `EAS.attest` method** directly for submitting attestations
         - [ ] Configure EAS instance using EAS SDK's connection methods
         - [ ] Return OnchainLocationProof with transaction details, UID, and chain information
       
       - [ ] Method `verifyOnchainLocationProof(proof: OnchainLocationProof): Promise<boolean>`
         - [ ] **Use EAS SDK's `EAS.getAttestation` method** to retrieve attestation data
         - [ ] Implement simple existence check for MVP verification
         - [ ] Use chain information from the proof object to verify on the correct chain
       
       - [ ] Method `revokeOnchainLocationProof(proof: OnchainLocationProof): Promise<void>`
         - [ ] **Use EAS SDK's `EAS.revoke` method** to submit revocation
     
     - [ ] Add streamlined error handling:
       - [ ] Create basic error classes for common failure scenarios
       - [ ] Provide clear context for each error
       - [ ] Focus on helpful error messages that guide developers
     
     - [ ] Update AstralSDK to specify chain at initialization:
       - [ ] Document that each SDK instance works with a single chain
       - [ ] Make chain ID/name a required parameter for onchain operations
       - [ ] Clarify in documentation that multi-chain operations require multiple SDK instances
     
     - [ ] Write targeted tests:
       - [ ] **Unit tests**:
         - [ ] Mock EAS SDK methods to test core integration paths
         - [ ] Focus on testing happy paths and common error cases
         - [ ] Verify correct parameters are passed to EAS SDK
       
       - [ ] **Integration tests**:
         - [ ] Test with actual EAS contracts on Sepolia testnet
         - [ ] Focus on end-to-end testing of the primary workflows
   
   - [ ] *Output*: 
     - [ ] Two distinct client implementations that leverage EAS SDK functionality for their respective workflows
     - [ ] Chain-specific SDK design with clear documentation
     - [ ] Type-safe wrappers around EAS SDK functionality
   
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

Complete: ⬜️

Commit hash: <todo>

## Implementation Report:

[TODO]