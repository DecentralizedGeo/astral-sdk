## Project Structure & Organization  
We will structure the repository in a logical, feature-based layout consistent with modern TypeScript library conventions:

```
astral-sdk/
├── package.json
├── tsconfig.json
├── jest.config.js
├── src/
│   ├── index.ts             # Main entry point
│   ├── core/                # Core SDK functionality
│   │   ├── types.ts         # Main type definitions
│   │   ├── errors.ts        # Error hierarchy
│   │   └── AstralSDK.ts     # Main SDK entry point
│   ├── eas/                 # EAS integration
│   │   ├── chains.ts        # Chain configurations
│   │   ├── SchemaEncoder.ts # EAS schema handling
│   │   ├── OffchainSigner.ts # Handles offchain attestations
│   │   └── OnchainRegistrar.ts # Handles onchain registrations
│   ├── offchain/            # Offchain workflow components
│   │   └── index.ts         # Offchain workflow exports
│   ├── onchain/             # Onchain workflow components
│   │   └── index.ts         # Onchain workflow exports
│   ├── extensions/          # Extension system
│   │   ├── location/        # Location format handlers
│   │   │   ├── builtins/    # Built-in location format implementations
│   │   │   │   ├── GeoJSON.ts # GeoJSON format support
│   │   │   │   ├── Coordinate.ts # Coordinate format support (decimal, degrees)
│   │   │   │   ├── WKT.ts    # Well-Known Text support
│   │   │   │   └── H3.ts     # H3 geospatial index support
│   │   │   └── index.ts      # Location extensions exports
│   │   ├── media/           # Media type handlers
│   │   │   ├── builtins/    # Built-in media format implementations
│   │   │   │   ├── image.ts  # Image handling (JPEG, PNG, GIF, TIFF)
│   │   │   │   ├── video.ts  # Video handling (MP4, MOV)
│   │   │   │   ├── audio.ts  # Audio handling (MP3, WAV, OGG, AAC)
│   │   │   │   └── application.ts # Application handling (PDF)
│   │   │   └── index.ts      # Media extensions exports
│   │   └── recipe/          # Other extension types (placeholder for future versions)
│   │       ├── builtins/    # Built-in recipe implementations (placeholder)
│   │       └── index.ts     # Recipe extensions exports
│   ├── api/                 # API client
│   │   └── AstralApiClient.ts # REST API communication
│   ├── storage/             # Storage adapters
│   │   └── StorageAdapter.ts # Storage interface
│   └── utils/               # Utility functions
│       ├── typeGuards.ts    # Type guard implementations
│       └── validation.ts    # Validation utilities
├── test/                    # Test files
├── examples/                # Example usage
└── docs/                    # Documentation
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