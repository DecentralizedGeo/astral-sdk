## Project Structure & Organization  
We will structure the repository in a logical, feature-based layout consistent with modern TypeScript library conventions:

```
astral-ts-sdk/
├── package.json
├── tsconfig.json
├── jest.config.js
├── src/
│   ├── index.ts             # Entry point exporting public API
│   ├── core/                # Core types, interfaces, main AstralSDK class
│   │   ├── AstralSDK.ts
│   │   ├── types.ts         # e.g., UnsignedLocationProof, OffchainLocationProof, OnchainLocationProof interfaces
│   │   ├── errors.ts        # Error hierarchy definitions
│   │   └── utils.ts         # common helpers (validators, formatters)
│   ├── eas/                 # EAS integration module
│   │   ├── EASClient.ts     # wraps @ethereum-attestation-service/eas-sdk
│   │   ├── OffchainSigner.ts # EIP-712 signing for offchain proofs
│   │   ├── OnchainRegistrar.ts # Blockchain registration for onchain proofs
│   │   └── schemas.ts       # schema IDs, encoding logic
│   ├── api/                 # Astral API integration
│   │   ├── AstralApiClient.ts # handles HTTP requests
│   │   └── models.ts        # types for API responses (FeatureCollection, etc.)
│   ├── extensions/          # Base extension framework
│   │   ├── ExtensionManager.ts # Common extension registration/management
│   │   ├── Extension.ts     # Base extension interface or abstract class
│   │   ├── location/        # Location type extensions
│   │   │   ├── LocationExtension.ts # Base for all location extensions
│   │   │   ├── LocationExtensionManager.ts # Manager specific to location extensions
│   │   │   └── builtins/    # Built-in location extensions
│   │   │       ├── GeoJSONExtension.ts
│   │   │       └── WKTExtension.ts
│   │   ├── media/           # Media type extensions
│   │   │   ├── MediaExtension.ts # Base for all media extensions
│   │   │   ├── MediaExtensionManager.ts # Manager specific to media extensions
│   │   │   └── builtins/    # Built-in media extensions
│   │   │       ├── ImageExtension.ts
│   │   │       └── VideoExtension.ts
│   │   └── recipe/          # Recipe type extensions (placeholder for future versions)
│   │       ├── RecipeExtension.ts # Base for all recipe extensions
│   │       ├── RecipeExtensionManager.ts # Manager specific to recipe extensions
│   │       └── README.md    # Documentation for future implementation
│   ├── storage/             # Storage adapters for proofs
│   │   ├── StorageAdapter.ts # Common interface for storage adapters
│   │   ├── OnchainStorage.ts # Handles blockchain attestation storage
│   │   ├── OffchainStorage.ts # Handles offchain publication (IPFS, etc)
│   │   └── IPFSClient.ts    # IPFS integration
│   ├── utils/               # Shared utilities
│   │   ├── geo.ts           # Geospatial conversion utilities
│   │   ├── validation.ts    # Common validation functions
│   │   └── typeGuards.ts    # Type guards for proof types
│   └── __tests__/           # Test files (mirroring src structure)
│       ├── core/...
│       ├── eas/...
│       ├── api/...
│       ├── extensions/
│       │   ├── location/...
│       │   └── media/...
│       └── storage/...
├── docs/                    # Documentation markdown or generated docs
└── examples/                # Example scripts or sample usage
```

**Module Organization:** Each folder (core, eas, api, etc.) encapsulates related functionality. This makes it easy for contributors to find relevant code and for tree-shaking tools to drop what isn't used. The entry `index.ts` re-exports key classes and functions from sub-modules that form the public API of the SDK.

The **core** module now contains a more refined type system with distinct types for `UnsignedLocationProof`, `OffchainLocationProof`, and `OnchainLocationProof`, reflecting the fundamental difference between offchain and onchain attestations in EAS. We've also added a comprehensive error hierarchy in `errors.ts` to provide detailed, typed error handling throughout the SDK.

The **eas** module has been expanded with dedicated components for offchain and onchain operations:
- `OffchainSigner.ts`: Handles EIP-712 signing for offchain proofs
- `OnchainRegistrar.ts`: Manages direct blockchain registration for onchain proofs

The **storage** module has been similarly separated:
- `OffchainStorage.ts`: For IPFS and other offchain publishing mechanisms
- `OnchainStorage.ts`: For blockchain attestation registration

The extensions system is structured with clear separation between the three types:
- **Location extensions**: For handling different location formats (GeoJSON, WKT)
- **Media extensions**: For handling different media types (images, videos)
- **Recipe extensions**: Placeholder for future versions - will support custom proof recipes

Each extension type has its own base class/interface, dedicated manager, and builtins folder with reference implementations. This structure provides a clean separation of concerns while allowing for future expansion. For v0.1, we'll focus on implementing a few core built-in extensions for location and media types only, with recipe extensions serving as placeholders for future development.

**Why this structure?** It mirrors the logical architecture with a clear separation between offchain and onchain workflows, following patterns seen in well-regarded SDKs. The Azure SDK guidelines emphasize consistency and discoverability, making sure the API feels like a single cohesive product ([TypeScript Guidelines: Introduction | Azure SDKs](https://azure.github.io/azure-sdk/typescript_introduction.html#:~:text=Consistent)). 

By grouping logically (and naming clearly), developers can navigate the codebase easily and understand the architectural separation between offchain and onchain paths. We use consistent naming conventions (e.g., `OffchainSigner` and `OnchainRegistrar`) to make the SDK self-descriptive and clarify the distinct paths available to developers ([10 Best Practices For SDK Generation | Nordic APIs |](https://nordicapis.com/10-best-practices-for-sdk-generation/#:~:text=2,Convention)).

The directories and file structure also pave the way for future expansion (e.g., adding additional storage adapters, supporting new blockchain networks, or integrating zero-knowledge proofs). This structure will be documented in a **Project Structure Guide** so new contributors know where to add new files or find existing logic, and understand the fundamental separation between offchain and onchain attestation workflows.