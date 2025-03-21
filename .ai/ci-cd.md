## Continuous Integration & Deployment (CI/CD)  
A strong CI/CD setup will keep the project quality high and streamline releases:

- **GitHub Actions Workflows:** We will create at least two workflows: 
  - **CI (Continuous Integration)**: Triggers on pull requests and pushes to main. Runs build, lint, tests. If any check fails, the PR cannot be merged (enforce status checks). We'll include specific test runs for both offchain and onchain workflows to ensure both paths work correctly. We can also enable branch protection requiring PRs to pass CI and perhaps require code review approvals. This ensures only vetted code enters the main branch.
  - **Release/Deployment**: We can automate NPM publishing when we tag a new release. For instance, using a workflow that triggers on pushing a Git tag like `v1.0.0`, which then runs the build and publishes to NPM. This can integrate with a tool like **semantic-release** or we can handle version bump manually but automate the publish. If using semantic-release, our commit messages must follow Conventional Commits to auto-generate release notes and bump versions appropriately. This might be a good practice to adopt (we can add a commit lint step to enforce style).
  
- **Versioning Strategy:** We will use **semantic versioning** (SemVer) for releases (e.g., 1.0.0, 1.1.0, 2.0.0). During initial development, versions might be 0.x while unstable, but as it matures, 1.x for stable. We define what constitutes a major vs minor vs patch change in our CONTRIBUTING.md:
  - Major version changes (1.0.0 → 2.0.0): Breaking changes to public API, like renaming core methods or changing the type system for proofs
  - Minor version changes (1.0.0 → 1.1.0): New non-breaking features, such as adding new extension types or convenience methods
  - Patch version changes (1.0.0 → 1.0.1): Bug fixes and non-breaking improvements, like performance optimizations
  
  To avoid confusion, only maintain one active version branch unless needed (like if a breaking change is in main, we can still backport critical fixes to a 1.x branch). 
  - If using semantic-release, it can update the version and changelog automatically on each merge to main with appropriate commit tags.
  - Regardless, we'll maintain a **CHANGELOG.md** documenting changes in each release for transparency.

- **NPM Publishing:** The package will be published to npm as `astral-location-proof-sdk` or similar (name to be finalized). We'll ensure the package.json has proper fields (name, description, repository, keywords like `EAS`, `geospatial`, `offchain`, `onchain`, etc., license MIT if open source). The build step will produce a `dist/` directory with all compiled outputs. We configure package.json `"files"` or use `.npmignore` to include dist and exclude tests, etc., so the package is clean.
  - We'll provide both CJS and ESM builds in the package, as well as TypeScript declaration files (`.d.ts`). In package.json, use the `"exports"` field to map `"import"` to ESM build and `"require"` to CJS build, also pointing `"types"` to the types file (so IDEs find our type definitions).
  - **Architecture-Specific Exports**: Configure the package exports to allow explicit importing of offchain or onchain components:
    ```json
    "exports": {
      ".": {
        "import": "./dist/esm/index.js",
        "require": "./dist/cjs/index.js",
        "types": "./dist/types/index.d.ts"
      },
      "./offchain": {
        "import": "./dist/esm/offchain/index.js",
        "require": "./dist/cjs/offchain/index.js",
        "types": "./dist/types/offchain/index.d.ts"
      },
      "./onchain": {
        "import": "./dist/esm/onchain/index.js",
        "require": "./dist/cjs/onchain/index.js",
        "types": "./dist/types/onchain/index.d.ts"
      }
    }
    ```
  - This allows users to import only what they need: `import { createOffchainLocationProof } from 'astral-sdk/offchain'` or `import { createOnchainLocationProof } from 'astral-sdk/onchain'`, optimizing bundle size.
  - Tree-shaking: ensure the ESM build is the default for modern bundlers (since they can shake it). Also mark `"sideEffects": false` (our code has no side effect on import) to enable tree shaking even in CJS contexts for those bundlers that can do it with module wrappers.

- **Bundle and Testing in CI:** Include steps that validate both architecture paths:
  - Create a simple test application that imports and uses offchain workflows, verifying bundle size and correctness
  - Create a second test application that uses onchain workflows, ensuring both paths can be used independently
  - Verify a third application that uses both, to ensure the unified API works as expected
  - This catches any packaging mistakes (like missing file or wrong path in exports) and confirms our architecture separation works as intended

- **Workflow-Specific CI Tests:** Create specific CI jobs that validate:
  - Offchain workflow: Build → Sign → Optionally Publish
  - Onchain workflow: Build → Register
  - Query functionality for both proof types
  - This ensures both paths are properly tested in isolation

- **Pre-commit & Pre-publish Hooks:** In addition to pre-commit (lint/test), we might use a tool like **lint-staged** with Husky to only lint changed files for speed. Also, we can set up a `npm run prepublishOnly` script that runs automatically before `npm publish` (ensuring the build is up to date and tests pass one last time, to avoid publishing broken code). Since we likely automate publish via CI, this is secondary.

- **Code Quality Checks:** Besides tests and lint, we integrate other tools in CI:
  - **Prettier** for code formatting – run as part of lint or separately. Enforce a consistent style that the team agrees on (we have Prettier config in repo and maybe a format check).
  - **CodeQL** security analysis (optional but good practice for an SDK).
  - **Typing tests**: run `tsc` in strict mode. We should have `"strict": true` in tsconfig for maximum type safety anyway, which forces us to handle undefined cases etc. This is particularly important for our type guards and the proper handling of the union type `LocationProof`.

- **Documentation Deployment:** If we plan to host documentation (like a GitHub Pages or a docs site via docusaurus/gitbook), CI can auto-deploy docs on release or when docs change. For example, generate TypeDoc HTML and push to gh-pages branch. The documentation should clearly represent our architecture with separate sections for:
  - Core concepts (including the distinction between offchain and onchain attestations)
  - Offchain workflow (building, signing, publishing)
  - Onchain workflow (building, registering)
  - Query and verification APIs
  
  This makes sure the documentation is always up-to-date with the latest release. We might separate this from the main build to not slow down every CI run; maybe run on main branch push or daily.

- **Multi-chain Testing:** Include matrix jobs to test our SDK with different chains and their corresponding EAS deployments:
  - Test offchain attestations for compatibility across chains (should work with any EAS schema)
  - Test onchain registration against multiple chains (Ethereum, Optimism, Arbitrum, etc.)
  - Verify query functionality works correctly across chains
  - Test the chain-specific configuration options

- **Maintainer notifications**: Set up CI to report status to PR, and use GitHub's code owners or reviewers for certain files (if needed, e.g., require a security review for changes in sensitive modules).

This CI/CD setup ensures continuous quality and makes releasing new versions straightforward and less error-prone. By automating tests and checks specifically tailored to our dual-workflow architecture, we catch issues early, which is especially important if multiple independent contributors are working. The separate exports and testing for offchain and onchain paths ensure that our architecture remains clean and that the performance benefits of tree-shaking can be realized in production applications.