# @decentralized-geo/astral-sdk

## 0.1.2

### Patch Changes

- 7e66ec9: Update quickstart examples to be self-contained

  - Replace window.ethereum with ethers Wallet creation in all examples
  - Make quickstart work without browser wallet requirement
  - Use GeoJSON format consistently (coordinate arrays not yet supported)
  - Clear distinction between offchain (no provider) and onchain (with provider)

  This ensures developers can run examples immediately without external dependencies.

## 0.1.0

### Minor Changes

- 6bdbc30: initial public release of the Astral SDK
