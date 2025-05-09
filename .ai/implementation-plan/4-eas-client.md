## **4. EAS Client Integration**  
  *Description*: Develop the EAS integration module with separate components for offchain signing and onchain registration workflows, leveraging the EAS SDK for all core functionality.
   
   - *Sub-tasks*: 
     - [ ] Review `.ai/eas-context.md` to understand EAS capabilities, particularly the differences between offchain and onchain attestations. Review EAS SDK documentation to understand the different methods and options available.
     
     - [ ] Create shared utilities in `src/eas/utils.ts`:
       - [ ] Constants for schema UID and schema string
       - [ ] Contract address mapping per supported chain
       - [ ] Type conversion helpers to align our types with EAS SDK expected formats
     
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
         - [ ] **Use EAS SDK's built-in verification methods** for signature verification
         - [ ] Validate our specific proof data format
     
     - [ ] Implement `src/eas/OnchainRegistrar.ts` for the onchain workflow:
       - [ ] Constructor accepting ethers Provider/Signer and optional chain
       - [ ] Method `registerOnchainLocationProof(unsignedProof: UnsignedLocationProof, options: OnchainProofOptions): Promise<OnchainLocationProof>`
         - [ ] **Use EAS SDK's `EAS.attest` method** directly for submitting attestations
         - [ ] Configure EAS instance using EAS SDK's connection methods
         - [ ] Return OnchainLocationProof with transaction details and UID
       
       - [ ] Method `verifyOnchainLocationProof(proof: OnchainLocationProof): Promise<boolean>`
         - [ ] **Use EAS SDK's `EAS.getAttestation` method** to retrieve attestation data
         - [ ] Verify attestation exists and matches our proof data
       
       - [ ] Method `revokeOnchainLocationProof(proof: OnchainLocationProof): Promise<void>`
         - [ ] **Use EAS SDK's `EAS.revoke` method** to submit revocation
     
     - [ ] Create configuration utilities:
       - [ ] Initialize EAS SDK instances properly for each chain
       - [ ] Set up providers and signers according to EAS SDK requirements
     
     - [ ] Add robust error handling:
       - [ ] Wrap EAS SDK errors in our own error classes
       - [ ] Provide clear context for each error
     
     - [ ] Write comprehensive tests:
       - [ ] **Unit tests**:
         - [ ] Mock EAS SDK methods to test our integration
         - [ ] Verify correct parameters are passed to EAS SDK
       
       - [ ] **Integration tests** (if possible):
         - [ ] Test with actual EAS contracts on testnets
         - [ ] Verify entire workflows with the real EAS SDK
   
   - [ ] *Output*: 
     - [ ] Two distinct client implementations that leverage EAS SDK functionality for their respective workflows
     - [ ] Clean integration with minimal code duplication
     - [ ] Type-safe wrappers around EAS SDK functionality
   
   - *Technical considerations*: 
     - [ ] Use EAS SDK functionality rather than reimplementing any cryptographic or blockchain operations whenever you can
     - [ ] Properly import and initialize all EAS SDK components according to their documentation
     - [ ] Follow EAS SDK patterns and best practices
     - [ ] Handle EAS SDK versioning appropriately (currently v2.7.0+)
     - [ ] Document any EAS SDK limitations or quirks
     - [ ] Ensure proper error propagation from EAS SDK
     - [ ] Set up ethers providers and signers exactly as recommended by EAS documentation
     - [ ] Keep our wrappers thin and focused on converting between our domain models and EAS requirements
     - [ ] Add JSDoc references to relevant EAS documentation where appropriate

Complete: ⬜️

Commit hash: <todo>

## Implementation Report:

[TODO]