## **1. Project Setup & Initial Scaffold**  

   - *Description*: Initialize the repository with basic configuration and structure that supports our dual-workflow architecture for offchain and onchain attestations.
   - *Sub-tasks*: 
     - Set up `package.json` with project info using `pnpm init`, configure scripts (build, test, lint, etc.), and install dev dependencies:
       - TypeScript (latest stable)
       - Jest, ts-jest for testing
       - ESLint with TypeScript support and security plugins
       - Prettier for code formatting
       - tsup for building (with support for ESM, CJS, and declaration files)
       - husky and lint-staged for pre-commit hooks
       - Add ethers.js and @ethereum-attestation-service/eas-sdk as peer dependencies
       
     - Create `.npmrc` with appropriate pnpm settings:
       - `node-linker=hoisted` for better compatibility
       - `save-exact=true` for deterministic dependency versions
       
     - Create `tsconfig.json` with the following key configurations:
       - Enable strict mode and all strict checks (noImplicitAny, strictNullChecks, etc.)
       - Target ES2020, module ESNext
       - Path aliasing for cleaner imports
       - Ensure proper types resolution
       
     - Create initial folder structure that reflects our architecture:
       ```
       src/
         core/           # Core types, interfaces, and errors
           types.ts      # Shared types including proof interfaces
           errors.ts     # Error hierarchy
         offchain/       # Offchain workflow components
         onchain/        # Onchain workflow components
         extensions/     # Extension system
           builtins/     # Built-in extensions
         storage/        # Storage adapters
         api/            # Astral API client
         eas/            # EAS integration
         utils/          # Utility functions including type guards
         index.ts        # Main entry point with exports
       ```
     
     - Configure build process with tsup to generate:
       - ESM build for modern bundlers (with tree-shaking)
       - CJS build for Node.js compatibility
       - TypeScript declaration files
       - Separate entry points for offchain and onchain workflows
       
     - Initialize Git (if not already) and configure Husky hooks:
       - Pre-commit: Run lint-staged for linting/formatting AND run tests to catch issues early
       - Add a script to skip tests with `--no-verify` when needed for work-in-progress commits
       
     - Update the existing CLAUDE.md file with:
       - Update any build/test/lint commands to use pnpm
       - Any additional architecture guidelines
       
     - Expand the README with:
       - Project name and brief description
       - Key architectural concepts (offchain vs onchain workflows)
       - Installation instructions (using pnpm)
       - Basic usage example placeholders
       
   - *Output*: A repository with all configuration files and initial folder structure that clearly establishes the foundation for our dual-workflow architecture, with passing CI setup.
   
   - *Technical considerations*: 
     - Use `pnpm` for all package management operations for better performance and deterministic builds
     - Configure the test command to run in watch mode during development but exit cleanly in CI
     - Ensure MIT license is included
     - Configure ESLint rules to enforce our architectural boundaries
     - Set up exports field in package.json to support:
       ```json
       "exports": {
         ".": "./dist/index.js",
         "./offchain": "./dist/offchain/index.js",
         "./onchain": "./dist/onchain/index.js"
       }
       ```
     - Keep the initial structure minimal but clear, with placeholder files that establish the architecture
     - Ensure all linting and tests pass from the beginning to establish quality standards
     - Include `.gitignore` with appropriate entries for Node.js projects and IDE files

Complete: ✅

Commit hash: <to be added after commit>

## Implementation Report:

We've successfully set up the project with the dual-workflow architecture in mind. Key accomplishments:

1. Established core project files:
   - package.json with all dependencies
   - tsconfig.json with strict TypeScript configuration
   - ESLint + Prettier for code quality
   - Jest for testing
   - Husky for pre-commit hooks

2. Set up the directory structure for our dual-workflow approach:
   - Core directories for shared functionality
   - Separate offchain and onchain directories
   - Extension system structure
   - Support services (storage, API client)

3. Configured exports to support separate entry points for offchain and onchain workflows

4. Added comprehensive documentation:
   - README with usage examples
   - CLAUDE.md with detailed development guidance
   - Directory-specific READMEs

5. Set up developer tooling:
   - Husky pre-commit hooks for quality control
   - VSCode configurations for consistent development experience
   - Added commit-wip script for work-in-progress commits

Future improvements needed:
- Add checkboxes to subtasks in each phase of the implementation plan to better track progress
- Review and harmonize repository structure documentation across multiple files (.ai/structure.md, CLAUDE.md, etc.) to ensure consistency
- Ensure folder structure is consistent with the architecture described in our documentation