# Contributing to Astral SDK

Thank you for your interest in contributing to the Astral SDK! This document provides guidelines for contributing to this project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Contributor License Agreement (CLA)](#contributor-license-agreement-cla)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Development Workflow](#development-workflow)
- [Code Style Guidelines](#code-style-guidelines)
- [Testing Requirements](#testing-requirements)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Release Process](#release-process)

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Contributor License Agreement (CLA)

**IMPORTANT**: Before contributing to this project, you must sign a Contributor License Agreement (CLA).

### Why do we require a CLA?

The CLA ensures that:
- Sophia Systems Corporation can redistribute your contributions under the Apache 2.0 license
- The project maintains clear legal ownership and licensing
- Contributors retain their rights while granting necessary permissions for the project

### How to sign the CLA

1. **Individual Contributors**: When you submit your first pull request, our CLA-assistant bot will guide you through signing the individual CLA.

2. **Corporate Contributors**: If you're contributing on behalf of your employer, you'll need to sign the [Entity CLA](.github/entity-cla.md). Contact us at [legal@sophiasystems.io] for assistance.

### CLA Requirements

- All pull requests require CLA signature before they can be merged
- The CLA is a one-time requirement per contributor
- Corporate contributors need both individual and entity CLAs

## Getting Started

### Prerequisites

- **Node.js**: 18.0.0 or higher
- **pnpm**: Recommended package manager (install with `npm install -g pnpm`)
- **Git**: For version control

### Fork and Clone

1. Fork the repository on GitHub
2. Clone your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/astral-sdk.git
   cd astral-sdk
   ```

3. Add the upstream repository:
   ```bash
   git remote add upstream https://github.com/DecentralizedGeo/astral-sdk.git
   ```

## Development Setup

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Set up environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration (see .env.example for details)
   ```

3. **Build the project**:
   ```bash
   pnpm run build
   ```

4. **Run tests to verify setup**:
   ```bash
   pnpm run test
   ```

### Required Environment Variables for Development

- `SEPOLIA_RPC_URL`: Sepolia testnet RPC URL (get from [Infura](https://infura.io/) or [Alchemy](https://alchemy.com/))
- `TEST_PRIVATE_KEY`: Private key for a test wallet with minimal Sepolia ETH (optional, for integration tests)

See [.env.example](.env.example) for the complete list of configuration options.

## Development Workflow

### Branching Strategy

- `main`: Production-ready code
- `develop`: Development branch (if used)
- Feature branches: `feature/description` or `fix/description`
- Follow semantic branch naming: `type/short-description`

### Making Changes

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our coding standards

3. **Run the development checks**:
   ```bash
   # Lint your code
   pnpm run lint
   
   # Type check
   pnpm run typecheck
   
   # Run tests
   pnpm run test
   
   # Build to ensure no build errors
   pnpm run build
   ```

4. **Commit your changes** using conventional commit format:
   ```bash
   git commit -m "feat: add new location format support"
   git commit -m "fix: resolve schema validation issue"
   git commit -m "docs: update API documentation"
   ```

## Code Style Guidelines

### TypeScript Standards

- **Strict TypeScript**: All code must pass `tsc --noEmit` with zero errors
- **Type Safety**: Prefer explicit types over `any`
- **Interface Design**: Use descriptive interface names and document complex types

### Code Formatting

- **Prettier**: All code is automatically formatted with Prettier
- **ESLint**: Follow ESLint rules defined in the project
- **Imports**: Group imports as follows:
  1. Node.js built-ins
  2. External packages
  3. Internal modules (absolute paths)
  4. Local imports (relative paths)

### Naming Conventions

- **Variables/Functions**: `camelCase`
- **Classes/Interfaces/Types**: `PascalCase`
- **Constants**: `UPPER_SNAKE_CASE`
- **Files**: `kebab-case.ts` or `PascalCase.ts` for classes

### Documentation

- **JSDoc**: Document all public APIs with JSDoc comments
- **Comments**: Use inline comments sparingly, prefer self-documenting code
- **README**: Update documentation when adding new features

### Architecture Guidelines

- **Error Handling**: Use typed errors from `src/core/errors.ts`
- **Async/Await**: Prefer async/await over Promises
- **Extension System**: Follow existing patterns when adding new extensions
- **Separation of Concerns**: Keep offchain and onchain workflows clearly separated

## Testing Requirements

### Test Coverage

- **Unit Tests**: Required for all new functionality
- **Integration Tests**: Required for workflow changes
- **Test Coverage**: Maintain high test coverage (aim for >90%)

### Test Types

1. **Unit Tests** (`test/**/*.test.ts`):
   - Test individual functions and classes
   - Use mocking for external dependencies
   - Fast execution

2. **Integration Tests** (`test/integration/*.test.ts`):
   - Test end-to-end workflows
   - Use real EAS SDK but mock blockchain interactions
   - Verify component interactions

### Running Tests

```bash
# Run all tests
pnpm run test

# Run specific test file
pnpm test -- test/core/AstralSDK.test.ts

# Run tests with coverage
pnpm run test:coverage

# Run tests in watch mode
pnpm run test:watch
```

### Test Guidelines

- **Descriptive Names**: Use clear, descriptive test names
- **Arrange-Act-Assert**: Follow AAA pattern
- **Test Data**: Use realistic test data that matches production scenarios
- **Mocking**: Mock external services but use real EAS SDK for integration tests

## Pull Request Process

### Before Submitting

1. **Sign the CLA**: Ensure you've signed the Contributor License Agreement
2. **Update Documentation**: Update relevant documentation for your changes
3. **Add Tests**: Include appropriate tests for your changes
4. **Run All Checks**: Ensure all linting, type checking, and tests pass
5. **Update Changelog**: Add entry to CHANGELOG.md if applicable

### Pull Request Guidelines

1. **Clear Title**: Use descriptive titles following conventional commit format
2. **Detailed Description**: Explain the changes and their purpose
3. **Link Issues**: Reference any related issues
4. **Breaking Changes**: Clearly mark and explain any breaking changes
5. **Testing Instructions**: Provide clear steps to test your changes

### Pull Request Template

When you submit a PR, please include:

- **What this PR does**
- **Why this change is needed**
- **How to test it**
- **CLA acknowledgment** (handled automatically by CLA-assistant)
- **Checklist of completed items**

### Review Process

1. **Automated Checks**: All CI checks must pass
2. **Code Review**: At least one maintainer review required
3. **CLA Verification**: CLA-assistant will verify your signature
4. **Testing**: Reviewers may run additional tests
5. **Approval**: Final approval from project maintainers

## Issue Reporting

### Bug Reports

When reporting bugs, please include:

- **Clear Title**: Descriptive summary of the issue
- **Environment**: Node.js version, operating system, SDK version
- **Steps to Reproduce**: Detailed steps to reproduce the issue
- **Expected Behavior**: What you expected to happen
- **Actual Behavior**: What actually happened
- **Error Messages**: Include full error messages and stack traces
- **Code Sample**: Minimal code that reproduces the issue

### Feature Requests

For feature requests, please include:

- **Use Case**: Describe your specific use case
- **Proposed Solution**: Your suggested approach
- **Alternatives**: Any alternative solutions you've considered
- **Additional Context**: Any other relevant information

### Security Issues

**DO NOT** create public issues for security vulnerabilities. Instead:

1. Email security issues to [security@sophiasystems.io]
2. Include detailed information about the vulnerability
3. Allow time for the issue to be addressed before public disclosure

## Release Process

### Semantic Versioning

This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR** (X.0.0): Breaking changes
- **MINOR** (0.X.0): New features, backward compatible
- **PATCH** (0.0.X): Bug fixes, backward compatible

### Release Steps (for maintainers)

1. **Update Version**: Update version in `package.json`
2. **Update Changelog**: Add release notes to `CHANGELOG.md`
3. **Create Release**: Use GitHub releases with proper tags
4. **Publish Package**: Publish to npm registry
5. **Announce**: Announce release to community

## Development Resources

### Architecture Documentation

- **Core SDK**: `src/core/AstralSDK.ts` - Main SDK entry point
- **Workflows**: Understand offchain vs onchain workflows
- **Extensions**: `src/extensions/` - Extensible format system
- **EAS Integration**: `src/eas/` - Ethereum Attestation Service integration

### Useful Commands

```bash
# Development mode (watch for changes)
pnpm run dev

# Clean build artifacts
pnpm run clean

# Format code
pnpm run format

# Lint and fix issues
pnpm run lint-fix

# Generate package for testing
pnpm pack
```

### Getting Help

- **Documentation**: Check existing docs in the `docs/` directory
- **Issues**: Search existing issues before creating new ones
- **Discussions**: Use GitHub Discussions for questions
- **Contact**: Reach out to maintainers via [info@sophiasystems.io]

## Legal Notice

By contributing to this project, you agree that your contributions will be licensed under the Apache 2.0 License and assign copyright to Sophia Systems Corporation as specified in the Contributor License Agreement.

---

Thank you for contributing to the Astral SDK! Your contributions help make location proofs more accessible and reliable for everyone.