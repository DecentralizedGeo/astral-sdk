## Technology Stack & Tooling Justification  
To achieve a top-tier developer experience and code quality, we carefully choose modern tools and libraries that support our dual-workflow architecture:

- **Language & Compiler:** TypeScript (latest stable, e.g., TS 5.x). We enable **strict mode** and additional compiler checks (noImplicitAny, strictNullChecks, etc.) to enforce type safety. TypeScript is essential for our architecture as it allows us to:
  - Define and enforce the distinct types for `UnsignedLocationProof`, `OffchainLocationProof`, and `OnchainLocationProof`
  - Implement proper type guards between proof types
  - Create union type `LocationProof` with discriminated unions
  - Provide clear method signatures that communicate workflow boundaries
  
  We will target output to ES2020 or later to allow modern syntax while ensuring Node 14+ compatibility (Node 18+ for fetch, with polyfills as needed).

- **Ethereum Library:** **ethers.js (v6)** as the underlying blockchain library. Ethers is widely used, well-documented, and integrates smoothly with EAS SDK. The EAS SDK itself depends on ethers, which provides:
  - Signer abstraction for our offchain workflow (critical for EIP-712 signatures)
  - Provider management for our onchain workflow
  - Transaction handling for attestation registration
  - Utilities like typed data verification and BigNumber

  Ethers v6 has full TypeScript typings and is tree-shakable. We'll mark `ethers` as a peer dependency to avoid multiple versions and ensure compatibility.

- **Ethereum Attestation Service SDK:** **@ethereum-attestation-service/eas-sdk**. This is a direct dependency handling our core attestation functionality:
  - For offchain workflow: Creating and verifying EIP-712 signatures
  - For onchain workflow: Submitting attestations to the blockchain
  - Schema encoding and decoding for both workflows
  
  The EAS SDK abstracts contract interactions and ensures we stay aligned with EAS updates. At ~265kB gzipped, it's a bit heavy but justified given its complexity. We'll mark it as external in our bundler config so users can deduplicate if they also use it elsewhere.

- **HTTP Client:** We'll use the **fetch API** via a lightweight wrapper for our API interactions. Node 18+ supports fetch natively, and we can include `node-fetch` as a fallback for older environments if needed. This approach keeps dependencies slim while supporting:
  - Querying both offchain and onchain proofs
  - Publishing offchain proofs
  - Fetching schema information

- **GeoJSON and Location Format Handling:** For our initial implementation, we'll keep this simple and focused:

  - **GeoJSON Validation:** We'll use lightweight validation functions to ensure GeoJSON objects conform to specification. Rather than including a full library, we'll implement simple validation functions that check for required properties based on the GeoJSON spec.
  
  - **Coordinate Format Support:** Initially, we'll focus on supporting the basic WGS84 (latitude/longitude) format as our default. This requires no additional libraries, just simple validation to ensure coordinates are within valid ranges.
  
  - **Extensibility:** Our architecture will be designed to make adding support for additional location formats easy in the future (like MGRS, Geohash, etc.), but we won't include these libraries in the initial implementation to keep our bundle size minimal.
  
  This approach keeps our geospatial dependencies at zero while still providing solid support for standard location formats. If specific formats become necessary, we can add targeted libraries later.

- **Bundler:** After evaluating options, we'll use **tsup** (which uses esbuild under the hood) for our build process. Tsup provides:
  - Fast builds that speed up development
  - Easy configuration for outputting ESM, CJS, and declaration files
  - Support for tree-shaking via ESM modules
  - Code splitting capabilities that align with our dual-workflow architecture
  
  We'll configure tsup to generate separate entry points for the full SDK, offchain-only, and onchain-only workflows, allowing efficient imports. For example:
  
  ```js
  // Full SDK (includes both workflows)
  import { AstralSDK } from 'astral-sdk';
  
  // Offchain workflow only
  import { createOffchainLocationProof } from 'astral-sdk/offchain';
  
  // Onchain workflow only  
  import { createOnchainLocationProof } from 'astral-sdk/onchain';
  ```
  
  This structure will allow bundlers to efficiently tree-shake unused code.

- **Testing Framework:** **Jest** with **ts-jest** for TypeScript support. We'll structure our tests to reflect our architecture:
  - Core tests for shared components
  - Offchain workflow tests
  - Onchain workflow tests
  - Integration tests that verify the workflows remain properly separated
  
  Jest's mocking capabilities will be particularly useful for simulating EAS SDK responses for both offchain signatures and onchain registrations.

- **Linting:** **ESLint** with TypeScript ESLint plugin. We'll extend from recommended configs and add additional rules to enforce our architectural boundaries:
  - No direct imports between offchain and onchain specific code
  - Type safety for proof handling
  - Consistent naming patterns that reflect workflow boundaries
  
  We'll add `eslint-plugin-security` to catch potential security issues and ensure we're following best practices for handling blockchain interactions.

- **Formatting:** **Prettier** to auto-format code uniformly. We'll use a standard configuration that matches popular TypeScript projects.

- **Pre-commit Hooks:** **Husky** with **lint-staged** to enforce code quality at commit time:
  - Run linters on changed files
  - Verify type correctness
  - Run relevant tests for modified components

- **Documentation Tools:** **TypeDoc** for API reference generation with additional documentation to clearly explain our architecture:
  - Visual diagrams of the offchain and onchain workflows
  - Example code for each path
  - API reference grouped by workflow
  
  We'll maintain comprehensive guides in a `/docs` folder covering the distinct workflows and how to choose between them.

- **Continuous Deployment Tools:** We'll use **semantic-release** for automated versioning and publishing, configured to understand our workflow-specific exports.

- **Source Control & Workflow:** GitHub with a standard git flow: feature branches -> PR -> main. We'll organize issues by workflow (offchain, onchain, shared) to maintain architectural clarity.

- **IDE Configurations:** Provide recommended settings for VSCode that support our development approach, including workspace-specific settings that help maintain architectural boundaries.

**Justification of Choices:** This technology stack has been carefully selected to support our core architectural decision of maintaining separate offchain and onchain workflows. TypeScript's type system is essential for creating the clear separation between different proof types, while still providing a unified API through union types. Our minimal approach to geospatial libraries ensures we keep the bundle size small while still providing a solid foundation for future extensions.

Furthermore, these tools ensure we meet requirements for type safety, extensibility, multi-chain support, and comprehensive testing. The architecture-aware structuring of tests, documentation, and linting rules will help maintain the clean separation between workflows as the project evolves.

In conclusion, this stack provides a **solid foundation** to implement our dual-workflow SDK architecture with the desired qualities. It's chosen to maximize productivity for maintainers and contributors while ensuring the final package meets the needs of end developers, whether they're working with offchain proofs, onchain proofs, or both.