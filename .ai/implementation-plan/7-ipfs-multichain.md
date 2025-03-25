## **7. Multi-Chain & IPFS Support Enhancements**  
   - [ ] *Description*: Enhance the SDK with multi-chain support and basic IPFS integration, focusing on practical implementation for both offchain and onchain workflows.
   
   - *Sub-tasks*:
     - [ ] **Multi-Chain Support**:
       - [ ] Create `src/eas/chains.ts` with comprehensive chain configuration:
         - [ ] Define `ChainConfig` interface with:
           - [ ] `chainId`: Chain ID number
           - [ ] `name`: Human-readable name
           - [ ] `rpcUrl`: Default RPC endpoint (optional)
           - [ ] `easContractAddress`: EAS contract address
           - [ ] `schemaRegistryAddress`: Schema registry address
           - [ ] `explorerUrl`: Block explorer base URL
         
         - [ ] Populate configurations for supported chains:
           - [ ] Sepolia (testnet, primary development target)
           - [ ] Base (mainnet)
           - [ ] Arbitrum (mainnet)
           - [ ] Celo (mainnet)
           
         - [ ] Get contract addresses from:
           - [ ] EAS documentation: https://docs.attest.sh/docs/developer-tools/contract-addresses
           - [ ] EASScan: https://easscan.org/ (check network dropdown)
       
       - [ ] Implement chain utilities:
         - [ ] `getChainConfig(chain: string | number): ChainConfig`
         - [ ] `isChainSupported(chain: string | number): boolean`
         - [ ] `getDefaultChain(): string`
       
       - [ ] Update `OnchainRegistrar` to properly handle multi-chain:
         - [ ] Support dynamic chain switching
         - [ ] Initialize with specific chain configuration
         - [ ] Handle provider/signer connection for specific chains
       
       - [ ] Update `OffchainSigner` for multi-chain:
         - [ ] Support chainId in EIP-712 domain data
         - [ ] Handle chain-specific parameters if needed
       
       - [ ] Add multi-chain test cases:
         - [ ] Verify correct contract addresses for each chain
         - [ ] Test chain switching behavior
         - [ ] Verify proper domain separation in offchain signatures
     
     - [ ] **IPFS Integration (Minimal Viable Version)**:
       - [ ] Create `src/storage/StorageAdapter.ts` with interface:
         - [ ] `interface StorageAdapter { upload(data: any): Promise<string>; }`
         - [ ] This provides a clean extension point for future storage options
       
       - [ ] Implement `src/storage/IPFSStorageAdapter.ts` (placeholder):
         - [ ] Focus on clean interface rather than full implementation
         - [ ] Accept upload callback in constructor
         - [ ] Document usage pattern for future integration
       
       - [ ] Add IPFS configuration to SDK options:
         - [ ] Define `IPFSConfig` interface (placeholder for future)
         - [ ] Add to AstralSDKConfig
       
       - [ ] Implement minimal IPFS handling:
         - [ ] In `publishOffchainLocationProof` method, add code to:
           - [ ] Format proof for IPFS storage
           - [ ] Call storage adapter if provided
           - [ ] Return CID or throw NotImplementedError in v0.1
         
       - [ ] Add documentation for future IPFS usage:
         - [ ] Comment clearly that this is a future extension point
         - [ ] Document how users will integrate their own storage
     
   - [ ] *Output*: 
     - [ ] Functional multi-chain support for both offchain and onchain workflows
     - [ ] Clean extension point for IPFS support in future versions
     - [ ] Test coverage for chain-specific functionality
     - [ ] Documentation of multi-chain usage
   
   - *Technical considerations*:
     - [ ] **Chain Support**:
       - [ ] Double-check EAS contract addresses for each chain
       - [ ] EIP-712 domain data should include correct chainId
       - [ ] Handle chain-specific RPC limitations (rate limiting, etc.)
       - [ ] Document provider requirements for different chains
     
     - [ ] **IPFS Approach**:
       - [ ] Focus on building the right abstraction for storage
       - [ ] Clearly document the placeholder nature in v0.1
       - [ ] Allow flexible integration with external storage solutions
       - [ ] Design for backward compatibility when full implementation is added
     
     - [ ] **Error Handling**:
       - [ ] Provide specific error messages for unsupported chains
       - [ ] Add validation for chain-related parameters
     
     - [ ] **Documentation**:
       - [ ] Be explicit about which chains are fully tested
       - [ ] Clearly document IPFS as a future capability
       - [ ] Include examples of multi-chain usage
     
     - [ ] **Testing**:
       - [ ] Include mock tests for chain configuration
       - [ ] Test chain fallbacks and defaults

Complete: ⬜️

Commit hash: <todo>

## Implementation Report:

[TODO]