## Architecture & Module Overview  

To satisfy the requirements defined in the [PRD](./prd.md), we propose a modular architecture with clear separation of concerns:

- **Core Module:** Contains core types (`UnsignedLocationProof`, `OffchainLocationProof`, `OnchainLocationProof`, etc.), interfaces, and utilities. It defines the high-level `AstralSDK` class (the main entry point for developers) and common logic like input validation, type guards, and error classes. This module also handles configuration (API endpoints, network selection, API keys).  

- **EAS Integration Module:** Encapsulates all interactions with Ethereum Attestation Service. It will use the official EAS SDK under the hood for in-client, on-chain, and IPFS operations (attest, revoke, query attestation) and EAS's data encoding utilities. It manages multiple chain addresses (each chain's EAS contract address and schema ID) and off-chain attestation signing/verifying if needed. Crucially, it handles the different mechanisms for generating UIDs for offchain versus onchain attestations.  

- **Astral API Module:** Deals with querying the Astral REST API. It will implement wrappers for endpoints (e.g., `/location-proofs`, `/collections/{id}/items` for OGC compliance) ([OGC API Features Implementation | Astral Documentation](https://docs.astral.global/docs/api/ogc-api#:~:text=GET%20%2Fapi%2Fogc%2Fcollections%2F)). This includes building query strings for filters like `bbox`, `datetime`, `chain`, `prover`, etc., handling pagination (using `limit` and `offset` transparently) ([OGC API Features Implementation | Astral Documentation](https://docs.astral.global/docs/api/ogc-api#:~:text=Core%20Parameters)), and parsing the GeoJSON responses into strongly-typed objects or classes.  

- **Location Types Extensions Module:** Implements an **extensibility framework** for adding new location types. This will likely include abstract classes or interfaces such as `LocationTypeExtension` or `LocationType` that define hooks (e.g., how to collect data, how to validate or serialize it) which concrete extensions (like a `GeoJSON` class or `WKT` class) will implement. The SDK core can register these extensions so that `AstralSDK.buildLocationProof()` knows how to handle various `location_types`. v0.1 will require EPSG:4326 (WGS84) as the default spatial reference system, though future versions will support additional spatial reference systems or location formats. Refer to the Location Types Extensions page in the [Astral Documentation]https://docs.astral.global/docs/location-proof-protocol/location-types) for more information.

- **Location Proof Recipe Extensions Module:** FUTURE VERSION — Only include a placeholder in v0.1!! Implements an **extensibility framework** for adding new location proof "recipes". This will likely include abstract classes or interfaces such as `LocationProofExtension` or `ProofRecipe` that define hooks (e.g., how to collect data, how to validate or serialize it) which concrete extensions (like a `GPSProof` class or `WifiProof` class) will implement. The SDK core can register these extensions so that `AstralSDK.buildLocationProof()` knows how to handle various `recipe_types`. It also allows new spatial reference systems or location formats if Astral expands beyond WGS84 points.  

- **Media Attachments Module:** Implements an **extensibility framework** for adding new media types. This will likely include abstract classes or interfaces such as `MediaAttachment` or `MediaAttachmentExtension` that define hooks (e.g., how to collect data, how to validate or serialize it) which concrete extensions (like a `PhotoAttachment` class or `VideoAttachment` class) will implement. The SDK core can register these extensions so that `AstralSDK.buildLocationProof()` knows how to handle various `media_types`. It also allows new media types for when Astral expands beyond photos. Refer to the Media Extensions page in the [Astral Documentation](https://docs.astral.global/docs/location-proof-protocol/media-extensions) for more information.

- **Storage Adapters:** A subcomponent to abstract different storage targets for proofs:
  - **OffchainStorageAdapter:** For IPFS or other offchain storage of signed proofs
  - **OnchainStorageAdapter:** For direct registration of proofs through EAS smart contracts
  
  A unified interface allows the SDK to interact with these adapters through methods like `publishOffchainLocationProof()` and `registerOnchainLocationProof()` that handle the specific details of each storage type.

- **Utilities:** Common helper functions, e.g. for converting between coordinate formats (GeoJSON <-> latitude/longitude, H3 <-> GeoJSON polygon, WKT <-> GeoJSON, etc), formatting output, logging, and retry logic for network calls. We also include error handling utilities to wrap errors with context (e.g., an `AstralError` class hierarchy to categorize and handle different error types).

## Workflow Architecture

The SDK supports two distinct workflows for location proofs:

### Offchain Workflow
1. **Build**: `buildLocationProof()` creates an `UnsignedLocationProof`
2. **Sign**: `signOffchainLocationProof()` creates an `OffchainLocationProof` with an EIP-712 signature
3. **Publish** (optional): `publishOffchainLocationProof()` stores the signed proof in IPFS or elsewhere

### Onchain Workflow
1. **Build**: `buildLocationProof()` creates an `UnsignedLocationProof`
2. **Register**: `registerOnchainLocationProof()` creates an `OnchainLocationProof` with blockchain transaction details

These workflows are distinct and result in different proof types with different UIDs. This separation ensures that the fundamental differences between offchain and onchain attestations in EAS are properly represented in the SDK's architecture.

This design ensures **separation of concerns** (each module can be developed/tested independently) and **extensibility** (new extensions or storage methods can be added without altering core logic). The modules will interact through well-defined interfaces – for example, the Core will call the EAS module to submit an attestation, or call the API module to fetch proofs, without needing to know implementation details. This follows the best practice of *abstracting away complexities* of the underlying API from the end-user developer ([SDK Best Practices](https://www.speakeasy.com/post/sdk-best-practices#:~:text=2)).