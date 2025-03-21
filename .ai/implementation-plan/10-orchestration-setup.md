
## Orchestration & Project Setup Guide  
Setting up the development environment and orchestrating contributions will follow best practices:

**Development Environment Preparation:**  
- Ensure you have Node.js (>= 18.x recommended for native fetch and ESM support).  
- Clone the repository and run `pnpm install` to install dependencies.  
- The project uses npm scripts for common tasks:
  - `pnpm run build` – compiles TypeScript to `dist/` (both ESM and CJS).
  - `pnpm run lint` – runs ESLint (and Prettier check).
  - `pnpm run test` – runs Jest test suite.
  - `pnpm run test:coverage` – runs tests with coverage.
  - `pnpm run format` – runs Prettier to format code.
  - `pnpm run docs` – (if configured) generates documentation via TypeDoc.
  - We might also add `pnpm run demo` to run example usage, etc.

**Running and Debugging:**  
- During development, use `pnpm run build:watch` (if configured, e.g., via tsup’s watch mode or `tsc -w`) to continuously compile on file changes. For tests, `jest --watch` can be used to run relevant tests on change.  
- We recommend using VSCode with the provided settings (if any) for best DX. We include a `launch.json` so you can debug tests or example scripts within the IDE if needed.

**Contribution Workflow:**  
- Before committing, ensure you run `npm run lint` and `npm run test`. Our Husky pre-commit hook will do this automatically and abort commit on failures. 
- Write descriptive commit messages (if following Conventional Commits, e.g., `feat: add support for X`, `fix: resolve Y`). This helps in automated changelog generation.
- All changes should be done on a branch and submitted as a Pull Request. The CI on GitHub will run the full test suite on the PR. Make sure all checks pass and request a review from maintainers.
- For any new feature or bug fix, add corresponding tests. We strive for complete test coverage.

**Dependency Management:**  
- We pinned specific versions of dependencies for stability. If updating any (e.g., EAS SDK or ethers), run tests to ensure nothing breaks. Pay attention to release notes of those libs for breaking changes.
- We use `^` for minor/patch updates by default; dependabot will open PRs for updates which can be reviewed and merged if tests pass.

**Building & Publishing the SDK:**  
- The build process (via Rollup or tsup) generates outputs in the `dist/` directory. We produce:
  - `dist/index.esm.js` (ES Module build)
  - `dist/index.cjs.js` (CommonJS build)
  - `dist/index.d.ts` (Type definitions)
  - Possibly `dist/browser/umd.js` if we decide to supply a UMD build for direct script include (optional).
- We verify that `package.json` `exports` field is set so that Node and bundlers resolve the correct file. Example:
  ```json
  "exports": {
    ".": {
      "import": "./dist/index.esm.js",
      "require": "./dist/index.cjs.js",
      "types": "./dist/index.d.ts"
    }
  }
  ```
  and also `"types": "./dist/index.d.ts"` for older TS resolution.
- **Publishing**: Only maintainers should publish. Increment version in package.json (or use `npm version [major|minor|patch]` which also creates a Git tag) according to semantic versioning. Then run `npm publish --access public`. Our CI could do this on tagged commits automatically; if so, ensure you have permission and the tag is pushed.
- After publishing, double-check on npm that the package has the expected files (you can do `npm pack` locally to see the tarball contents before publishing).

**Maintenance Plan:**  
- We will keep an eye on Astral Protocol updates. If Astral releases a new schema version or adds new location proof types, we will update our types and perhaps add new built-in extensions accordingly.
- Similarly, monitor EAS updates. EAS may evolve (though core concepts likely stable). If a new network is supported (e.g., if Astral adds another chain), add the mapping and test it.
- Use GitHub issues for bug reports or feature requests. Triage them regularly. High priority for any security issues – fix and release a patch ASAP.
- Encourage community contributions: our contributing guide and extension system invites developers to create their own proof methods. Perhaps maintain a list in README of known third-party extensions (if any).
- Periodically review dependencies for vulnerabilities (`npm audit` or use GitHub alerts). Upgrade as needed.
- Ensure the CI remains green; update CI Node versions as Node releases LTS changes.
