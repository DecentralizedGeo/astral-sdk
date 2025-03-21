## Product Requirements & Use Cases  

**User Needs:** The primary users are TypeScript developers building Web3 applications that leverage **location-based proofs**. They need an easy way to create location attestations (e.g., "prove this device was at location X at time Y"), attach supporting data (GPS coordinates, WiFi signals, images, etc.), and verify or query these proofs later. NOTE: v0.1 will not include support for attaching supporting evidence (i.e. recipe_payloads) — this will be added in a future version.

Developers seek *simplicity* – the SDK should abstract blockchain interactions and geospatial data handling, letting them call high-level functions rather than manually crafting transactions or HTTP calls ([SDK Best Practices](https://www.speakeasy.com/post/sdk-best-practices#:~:text=,users%2C%20and%20ultimately%2C%20more%20revenue)). They also require **type safety** for confidence when integrating (the SDK should surface errors at compile time) ([SDK Best Practices](https://www.speakeasy.com/post/sdk-best-practices#:~:text=1)) and comprehensive docs and examples for quick onboarding. 

**Use Cases:**  
- *Mobile Check-In:* A mobile app captures GPS coordinates and a timestamp, then uses the SDK to create an attestation proving a user's presence at an event. Later, a web service verifies this proof to grant an NFT reward.  
- *Proof of Attendance Protocol (POAP) Extension:* Developers can plug in a custom extension (e.g., scanning a venue's WiFi SSIDs as additional evidence) and the SDK will include that in the attestation.  
- *Spatial Queries:* An application queries the Astral API via SDK for all proofs within a geofence (using bounding box filtering) and displays them on a map. The SDK should handle pagination and formatting (GeoJSON to objects) seamlessly.  
- *Multi-Chain DApp:* A dApp accepts attestations from various networks (Celo, Base, Arbitrum, Sepolia). The SDK must allow verifying proofs regardless of which chain they were published on ([Getting Started | Astral Documentation](https://docs.astral.global/docs/getting-started#:~:text=The%20API%20currently%20supports%20the,following%20blockchains)), and even handle proofs stored off-chain (local or IPFS) for low-cost scenarios.
- *Low-Cost Offline Verification:* An application creates and signs offchain location proofs that can be verified without blockchain registration, then optionally registers them onchain for additional security when needed.

**API Requirements:** The SDK must provide:  
- Separate pathways for **offchain and onchain location proofs**:
  - Methods to **build unsigned location proofs** that can serve as the basis for either pathway
  - Functions to **sign offchain location proofs** using EIP-712 signatures
  - Functions to **publish offchain location proofs** to IPFS or other storage
  - Methods to **register onchain location proofs** directly on blockchains via EAS
  - Convenience methods that combine multiple steps for common workflows
- Functions to **query proofs** from the Astral API with text, numerical, spatial (bounding box, distance) and temporal filters, aligning with OGC API standards ([OGC API Features Implementation | Astral Documentation](https://docs.astral.global/docs/api/ogc-api#:~:text=The%20OGC%20API%20Features%20standard,spatial%20and%20temporal%20filtering%20capabilities)) ([OGC API Features Implementation | Astral Documentation](https://docs.astral.global/docs/api/ogc-api#:~:text=Core%20Parameters)).  
- Utilities to **verify proofs** – e.g. check EIP-712 signature validity, blockchain attestation status, and confirm the proof's data integrity (matching coordinates, etc.).
- A comprehensive **error handling system** with a hierarchical structure of typed errors for precise error management.
- An **extension mechanism** for custom proof types (e.g., new `recipe_types` like "cellular", "BLE") or media attachments, without modifying core code. NOTE THIS WILL BE ADDED IN A FUTURE VERSION — only include a placeholder for this feature in v0.1.
- Configuration options for **multi-chain support** (selecting target chain for onchain operations) and for connecting to user's Ethereum provider (ethers Signer or provider injection). 
- Hooks for **security** (e.g., verify attestation schema and prevent malicious data injection) and **performance** (caching frequent queries, batching calls).

**Constraints:** We must operate within EAS's structure and Astral's schema. The EAS schema for location proofs is predefined ([Data Model | Astral Documentation](https://docs.astral.global/docs/data-model#:~:text=EAS%20Schema)) (with fields like `eventTimestamp`, `location`, `recipe_types`, `recipe_payloads`, etc.), so our SDK's data models should match it exactly for accurate encoding/decoding. 

A fundamental constraint is that offchain and onchain attestations in EAS generate different UIDs and cannot be directly converted while maintaining identity. Our SDK must clearly represent this distinction through separate types and workflows.

The SDK should not assume heavy backend infrastructure – it will use the public Astral API and EVM networks. Also, network variability (latency, chain confirmations) means the SDK should handle async operations with proper feedback (promises, events). Another constraint is **package size and dependency management**: we should minimize bloat (for front-end use) by carefully choosing or writing lightweight libraries (limited dependencies) ([SDK Best Practices](https://www.speakeasy.com/post/sdk-best-practices#:~:text=4)). The SDK must support both browser and Node.js environments (isomorphic design), as developers may use it in web apps or server-side scripts.