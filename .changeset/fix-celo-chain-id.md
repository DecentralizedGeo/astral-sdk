---
"@decentralized-geo/astral-sdk": patch
---

fix: add chainId support to AstralSDK for multi-chain offchain attestations

- Add chainId parameter to AstralSDKConfig interface
- Update AstralSDK to prioritize chainId over defaultChain
- Fix issue #37 where Celo mainnet attestations failed with chain ID mismatch
- Support all chains: Sepolia (11155111), Celo (42220), Arbitrum (42161), Base (8453)
- Add debug warning when both chainId and defaultChain are provided
- Improve documentation to highlight chainId precedence behavior