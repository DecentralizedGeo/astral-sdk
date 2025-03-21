# Ethereum Attestation Service (EAS) Context

## Core Concepts

### What is EAS?
- **Ethereum Attestation Service (EAS)** is a decentralized protocol for creating, verifying, and revoking attestations on Ethereum and EVM-compatible blockchains.
- Attestations serve as verifiable claims made by one address about another address or entity.
- EAS provides a standardized, composable way to make signed statements that can be verified on and off chain.

### Fundamental EAS Components
1. **Schemas** - Templates that define the structure and data types for attestations
2. **Attestations** - The actual claims made using a schema
3. **UIDs** - Unique identifiers for attestations that are generated differently for onchain vs offchain attestations

## Onchain vs Offchain Attestations

### Critical Distinction
One of the most important aspects of EAS is the fundamental difference between onchain and offchain attestations:

#### Onchain Attestations
- Created directly on the blockchain using smart contract calls
- Generate UIDs through on-chain computation
- Stored permanently on the blockchain
- Higher cost but provide maximum verifiability
- Cannot be directly converted to offchain attestations while maintaining identity

#### Offchain Attestations
- Created using EIP-712 signatures without on-chain transaction
- Generate UIDs differently from onchain attestations
- Can be stored privately or in off-chain databases
- Lower cost and privacy-preserving
- Can be optionally published to the blockchain later, but as new attestations with new UIDs
- Cannot be directly converted to onchain attestations while maintaining identity

## How We're Using EAS in the SDK

### Location Proof Architecture
We're using EAS to create cryptographically verifiable location proofs:

1. **Basic Structure**
   - Location attestations using a specific EAS schema
   - Supporting both offchain (signed) and onchain (registered) workflows

2. **Two Distinct Workflows**
   - **Offchain workflow**: build → sign → optionally publish
   - **Onchain workflow**: build → register

3. **Data Model**
   - `UnsignedLocationProof`: Base type containing location data before signing/registration
   - `OffchainLocationProof`: Location proofs signed with EIP-712 signatures
   - `OnchainLocationProof`: Location proofs registered directly on a blockchain
   - Union `LocationProof` type: Either an offchain or onchain proof

4. **Current Use Cases**
   - User location verification
   - Environmental sampling
   - On-site attestations
   - Future: Spatial data registries and decentralized spatial applications

## Important Technical Details

### Schema Implementation
- Our EAS schema definitions include:
  - Coordinates (lat/long or other formats)
  - Timestamp
  - Location format identifier
  - Optional media references
  - Optional extension data

### EIP-712 Signing
- Used for creating offchain location proofs
- Enables typed data signing with clear user consent
- Creates cryptographically verifiable signatures without blockchain transactions

### Storage Strategies
- **Offchain storage**:
  - Local storage
  - IPFS
  - Centralized databases
- **Onchain reference**:
  - Direct blockchain storage for maximum verifiability
  - Optimized storage patterns to minimize costs

## Development Considerations

### Key Implementation Challenges
1. **Type Distinction**: Maintaining clear separation between offchain and onchain types
2. **UID Generation**: Understanding and properly implementing the different UID generation mechanisms
3. **Workflow Clarity**: Ensuring methods clearly belong to either the offchain or onchain workflow
4. **Type Conversion**: Remembering that conversion between types requires new attestation generation (new UIDs)

### Best Practices
1. Use explicit method naming that indicates workflow (offchain vs onchain)
2. Implement strong type guards for proof verification
3. Provide comprehensive error handling for workflow-specific failures
4. Document the distinction between workflows clearly for end users

## Resources
- [EAS Official Documentation](https://docs.attest.sh/)
- [EAS Schema Registry](https://easscan.org/)
- [EIP-712 Standard](https://eips.ethereum.org/EIPS/eip-712)
- [Location Proof Schema](https://github.com/astral-protocol/location-proof-schema)