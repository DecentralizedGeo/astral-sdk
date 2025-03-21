# Astral SDK Tests

This directory contains tests for the Astral SDK.

## Running Tests

```bash
# Run all tests
pnpm test

# Run specific test
pnpm test -- -t "test name"
```

## Test Structure

Tests are organized to match the package structure:

- `core/` - Tests for core SDK functionality
- `eas/` - Tests for EAS integration
- `extensions/` - Tests for extensions
- `api/` - Tests for API client
- `integration/` - End-to-end integration tests