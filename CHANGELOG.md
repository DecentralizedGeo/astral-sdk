# @decentralized-geo/astral-sdk

## 0.1.4

### Patch Changes

- fe33323: Add Optimism Mainnet support. The SDK now works with Optimism (chain ID: 10) using the same Location Protocol schema deployed at block 142210865.

## 0.1.3

### Patch Changes

- 03cecc1: fix: add chainId support to AstralSDK for multi-chain attestations

  - Add chainId parameter to AstralSDKConfig interface
  - Update AstralSDK to prioritize chainId over defaultChain for both offchain and onchain workflows
  - Fix issue #37 where Celo mainnet attestations failed with chain ID mismatch
  - Support all chains: Sepolia (11155111), Celo (42220), Arbitrum (42161), Base (8453)
  - Add debug warning when both chainId and defaultChain are provided
  - Improve documentation to highlight chainId precedence behavior

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
