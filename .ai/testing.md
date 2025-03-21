## Testing Strategy  
To ensure the SDK is robust and reliable, we will adopt a multilayered **testing strategy**, primarily using **Jest** as the testing framework (given its popularity in TS projects and built-in support for mocks and coverage). Our approach includes:

- **Unit Tests:** We will create thorough unit tests for every function and module. Each core piece (OffchainSigner, OnchainRegistrar, API client, extension manager, etc.) gets its own test file. We will use dependency injection or module-mocking to isolate tests:
  - For EAS-related functions, we will mock the EAS SDK calls. For example:
    - For offchain workflow: Simulate `eas.getOffchainAttestationSignature()` returning a mock signature
    - For onchain workflow: Simulate `eas.attest()` returning a fake UID without actually sending a transaction
  - We'll need different mocks for offchain vs onchain paths, ensuring clear separation in our tests.
  - For Astral API, we'll mock fetch responses. For instance, when testing proof query methods, intercept the HTTP call (using Jest's `jest.spyOn(global, 'fetch')` or similar) and return a sample JSON of features, then verify that the output is correctly parsed into our models.
  - Test validations: feed invalid inputs to functions and expect them to throw appropriate errors from our error hierarchy. E.g., call `createOffchainLocationProof` with an unsupported location format and check that it errors as expected.
  - Test extension mechanism: create a dummy extension, register it, and test that proof creation methods call its collect method. We can use spies to ensure extension methods were invoked.
  - Test type guards: verify that `isOffchainLocationProof` and `isOnchainLocationProof` correctly identify proof types.

- **Integration Tests:** These tests will verify end-to-end behavior in a controlled environment:
  - We can spin up a local Ethereum node (like Hardhat or Anvil) and deploy a minimal EAS contract (perhaps not trivial since EAS is a specific contract, but maybe use Sepolia as a live test network if acceptable). Given this is a library, we might rely on testnet integration rather than local EVM, unless EAS provides a local dev mode.
  - Write tests that verify both workflows separately:
    - Offchain workflow: Test creation, signing, storage, and verification of offchain proofs
    - Onchain workflow: Test creation, registration, and verification of onchain proofs
  - Test with a real wallet (could use ethers Wallet with a private key from env and a QuickNode/Infura RPC) to create attestations on Sepolia and verify proper handling of both workflows.
  - Integration test for Astral API: Verify the query methods correctly handle both offchain and onchain proofs, with appropriate filtering.
  - Test multi-chain: create proofs on different networks and verify correct chain-specific behavior.

- **Test Coverage and Automation:** We aim for a high test coverage (ideally 90%+ of statements). This gives confidence in each release. Jest can output coverage reports; we'll integrate that in CI (maybe fail if coverage drops below a threshold to keep contributors accountable).

- **Continuous Fuzz or Edge Testing:** For critical encoding functions, we might include some property-based tests or exhaustive edge cases. For instance, generate random coordinates and see if encoding-decoding yields consistent results, or test boundary values (max lat/long, weird time formats).

- **Linting and Type Checking as Testing:** We treat **TypeScript's compiler** as a first line of defense. We will run `tsc --noEmit` in CI to ensure no type errors. We'll also possibly use **tsd** (a package for testing type definitions) to verify that our exposed types behave as expected. For example, ensure that if a developer provides a wrong type to a function, the type system catches it (tsd tests are written by expecting compile errors in certain cases and none in others). This is "testing our types" – important for a type-safe SDK.

- **ESLint**: We will configure ESLint with recommended and possibly stricter rules (including coding style, but also potential error patterns). For instance, no floating `any` types allowed (except in truly necessary places), no usage of deprecated methods, etc. We treat lint rule violations as build failures (via pre-commit hook and CI). This prevents bad patterns from slipping in.

- **Pre-commit Hooks:** Using **Husky**, we'll set up a pre-commit hook that runs lint and basic tests on changed files. This ensures contributors run tests before commit. Also maybe a **pre-push hook** to run the full test suite, so you can't push code that fails tests (developers can skip if needed, but it's a good safeguard).

- **GitHub Actions CI:** We will set up a workflow that runs on every PR and push:
  1. Install dependencies (cache for speed).
  2. Run `npm run build` (to ensure it compiles).
  3. Run `npm run lint` and `npm run test` (with coverage).
  4. Possibly run on multiple Node versions (Node 18 LTS, Node 20) to ensure compatibility. 
  5. If all good, maybe run `npm run bundle-size` to check that the packaged size isn't ballooning unexpectedly (this can be done via tools or simply ensuring no huge dependencies got added).
  6. Also, we can use **CodeQL** (GitHub's security scanner) to catch any known vulnerability anti-patterns, which ties into security.

- **Mocking & Stubbing**: We will utilize Jest's mocking for external interactions:
  - Ethers provider can be stubbed (like, pretend a provider returns certain data).
  - EAS SDK – since it might be easier to treat it as a black box in tests, we might wrap EAS calls in our `OffchainSigner` and `OnchainRegistrar` classes and then in tests spy on those or override methods to simulate chain behavior.
  - For time-based tests (like verifying a proof's timestamp logic), use Jest's time mocks if needed to simulate current time.

- **Workflow Testing:** We will specifically test the distinct workflows:
  - Offchain flow: Build → Sign → Optionally Publish
  - Onchain flow: Build → Register
  - Verify transitions are handled correctly (e.g., cannot convert directly between offchain and onchain)

- **Documentation of Tests:** We will also use tests as examples where possible. For instance, tests for both `createOffchainLocationProof` and `createOnchainLocationProof` will double as sample usage. We might ensure tests are written clearly so they can be referenced in docs (or even automatically pulled in if using something like TypeDoc that can link to example tests).

By having such a rigorous testing regimen, we ensure each part of the SDK works in isolation and in concert. This gives confidence to top developers that the SDK is reliable. It also means future contributors can modify or add features and know quickly if they broke something. We treat testing not just as validation but as a living specification of how the SDK should behave.