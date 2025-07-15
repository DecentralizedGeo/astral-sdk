---
"@decentralized-geo/astral-sdk": patch
---

Update quickstart examples to be self-contained

- Replace window.ethereum with ethers Wallet creation in all examples
- Make quickstart work without browser wallet requirement  
- Use GeoJSON format consistently (coordinate arrays not yet supported)
- Clear distinction between offchain (no provider) and onchain (with provider)

This ensures developers can run examples immediately without external dependencies.