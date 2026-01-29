---
"@decentralized-geo/astral-sdk": minor
---

Unified SDK with namespaced location and compute modules

## Breaking Changes

This release introduces a new unified API with namespaced modules. The v0.1.x API remains available via `AstralSDKLegacy` for backward compatibility.

### New API (v0.2.0)

```typescript
import { AstralSDK } from '@decentralized-geo/astral-sdk';

const astral = new AstralSDK({
  chainId: 84532,
  signer: wallet,
  apiUrl: 'https://api.astral.global'
});

// Location - offchain workflow
const attestation = await astral.location.offchain.create(input);
const signed = await astral.location.offchain.sign(unsigned);
const verified = await astral.location.offchain.verify(attestation);

// Location - onchain workflow
const onchain = await astral.location.onchain.create(input);
const registered = await astral.location.onchain.register(unsigned);

// Location - common
const unsigned = await astral.location.build(input);
const encoded = astral.location.encode(attestation);
const decoded = astral.location.decode(data);

// Compute
const distance = await astral.compute.distance(from, to, options);
const area = await astral.compute.area(geometry, options);
const contains = await astral.compute.contains(container, containee, options);
await astral.compute.submit(result.delegatedAttestation);
```

### Migration from v0.1.x

| Old Method | New Method |
|------------|------------|
| `sdk.buildLocationAttestation()` | `astral.location.build()` |
| `sdk.signOffchainLocationAttestation()` | `astral.location.offchain.sign()` |
| `sdk.createOffchainLocationAttestation()` | `astral.location.offchain.create()` |
| `sdk.verifyOffchainLocationAttestation()` | `astral.location.offchain.verify()` |
| `sdk.createOnchainLocationAttestation()` | `astral.location.onchain.create()` |
| `sdk.registerOnchainLocationAttestation()` | `astral.location.onchain.register()` |
| `sdk.verifyOnchainLocationAttestation()` | `astral.location.onchain.verify()` |
| `sdk.revokeOnchainLocationAttestation()` | `astral.location.onchain.revoke()` |
| `sdk.encodeLocationAttestation()` | `astral.location.encode()` |
| `sdk.decodeLocationAttestation()` | `astral.location.decode()` |

### New Features

- **ComputeModule**: Verifiable geospatial computations via Astral Location Services API
  - `distance()`, `area()`, `length()` - numeric computations
  - `contains()`, `within()`, `intersects()` - boolean computations
  - `submit()`, `estimate()` - EAS delegated attestation submission
  - `health()` - service health check

- **New exports**: Submodules can be imported directly
  - `@decentralized-geo/astral-sdk/location`
  - `@decentralized-geo/astral-sdk/compute`
