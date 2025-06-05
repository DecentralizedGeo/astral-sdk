---
title: Core Concepts
sidebar_position: 2
description: Essential concepts and terminology for working with location attestations
slug: /core-concepts
---

# Core Concepts

Understanding these key concepts will help you work effectively with Astral SDK and the Location Protocol.

## Quick Navigation

**New to this area? Choose your background:**

- **[Web3 Concepts](./web3)** - For geospatial developers who need blockchain context
- **[Geospatial Concepts](./geospatial)** - For Web3 developers who need spatial data context  
- **[Quick Start](./quick-start)** - Jump straight to code examples

**Learn more about the protocol:** [Location Protocol Specification](https://easierdata.org/updates/2025/2025-05-19-location-protocol-spec)

## Location Attestations

A **location attestation** is a cryptographically signed, structured spatial record. It can represent any location in any spatial or symbolic reference system - like a row in a spatial database, but portable and cryptographically verifiable.

Location attestations can describe:
- **Geographic features**: Trail runs, monuments, geocache coordinates, watershed boundaries
- **Administrative areas**: Local authority boundaries, event venue perimeters, protected zones  
- **Infrastructure**: Transportation networks, utility installations, monitoring stations
- **Events**: Timestamped spatial occurrences, environmental measurements, asset movements
- **Claims**: "I was here at this time" (though this is just one use case among many)

All records are signed to ensure integrity and authorship, and can be shared publicly, held privately, or disclosed selectively.

## Two Workflows: Offchain vs Onchain

Astral SDK provides **two distinct ways** to create location attestations, each optimized for different use cases:

### 🔐 Offchain Workflow

**What it is:** Location attestations signed with EIP-712 (like MetaMask message signing)

**Perfect for:**
- High-volume applications (thousands of attestations)
- Private location tracking
- Real-time features
- When you want to avoid gas costs

**How it works:**
```
Build Attestation → Sign with Wallet → Optionally Publish
```

**Key characteristics:**
- ✅ **Free** - No blockchain transactions or gas costs
- ✅ **Instant** - Created immediately without waiting
- ✅ **Private** - Only you have it until you choose to publish
- ✅ **Verifiable** - Cryptographically signed and provable

### ⛓️ Onchain Workflow  

**What it is:** Location attestations registered as blockchain transactions

**Perfect for:**
- Smart contract integration
- Public verification
- Permanent records
- DeFi applications

**How it works:**
```
Build Attestation → Submit Transaction → Permanent Blockchain Record
```

**Key characteristics:**
- ✅ **Permanent** - Stored on blockchain forever
- ✅ **Public** - Anyone can verify and query
- ✅ **Smart contract ready** - Directly accessible by contracts
- ✅ **Immutable** - Cannot be altered once created

:::info Important
These workflows create **different attestation types** with unique identifiers. An offchain attestation cannot be "converted" to onchain while preserving its identity.
:::

## Location Formats

Astral SDK uses a modular extension system to handle different spatial data formats:

### Currently Supported: GeoJSON
The SDK currently supports the full [GeoJSON specification (RFC 7946)](https://tools.ietf.org/html/rfc7946):

```typescript
// Point - single coordinate
{ type: 'Point', coordinates: [-0.1276, 51.5074] }

// Feature with metadata  
{
  type: 'Feature',
  properties: { name: 'London Eye' },
  geometry: { type: 'Point', coordinates: [-0.1276, 51.5074] }
}

// Polygon - area boundaries
{
  type: 'Polygon', 
  coordinates: [[[lng1, lat1], [lng2, lat2], [lng3, lat3], [lng1, lat1]]]
}
```

### Coming Soon
Additional format support is planned:
- **Coordinate arrays**: `[longitude, latitude]` pairs
- **Well-Known Text (WKT)**: `POINT(-0.1276 51.5074)`, `POLYGON(...)`
- **H3 geospatial indexing**: Hexagonal cell identifiers

> **Note**: These formats have placeholder implementations in the codebase but are not yet functional. See [Extension System](#extension-system) for details.

## Location Proof Extensions

Location attestations can include **location proofs** - supporting evidence that helps others assess whether a spatial claim should be trusted. This is implemented through a plugin-based extension system.

**Types of location proofs:**
- **Cryptographic evidence**: Zero-knowledge proofs, commitment schemes
- **Sensor data**: GPS readings, accelerometer data, environmental sensors  
- **Digital artifacts**: Photos with EXIF data, timestamped recordings
- **Network evidence**: WiFi/Bluetooth proximity, cellular tower data
- **External validation**: Third-party services, oracle data

```typescript
// Example: Attestation with location proof extensions (coming soon)
{
  location: { type: 'Point', coordinates: [-0.1276, 51.5074] },
  memo: "GPS reading at London Eye",
  proofs: [
    {
      type: "gps-sensor-data",
      data: "encrypted_sensor_reading_xyz",
      confidence: 0.95
    }
  ]
}
```

> **Note**: Location Proof Extensions are currently in development. The extension system exists but specific proof types are not yet implemented.

## Extension System

Astral SDK uses a modular extension architecture:

### Location Format Extensions
Handle different spatial data formats (GeoJSON implemented, others coming soon).

### Media Type Extensions  
Support various file types for media attachments (images, video, audio, documents).

### Location Proof Extensions
Enable attachment of supporting evidence to validate spatial claims (coming soon).

Learn more in the [Extension System Guide](./guides/extensions).

## Verification & Trust

### Offchain Verification
Offchain attestations are verified by checking the EIP-712 signature:

```typescript
const result = await sdk.verifyOffchainLocationAttestation(attestation);
if (result.isValid) {
  console.log('Signed by:', result.signerAddress);
}
```

### Onchain Verification
Onchain attestations are verified by querying the blockchain:

```typescript
const result = await sdk.verifyOnchainLocationAttestation(attestation);
if (result.isValid && !result.revoked) {
  console.log('Valid blockchain record');
}
```

## Ethereum Attestation Service (EAS)

Astral SDK is a **reference implementation** of the Location Protocol, built on top of [EAS](https://attest.sh/) (Ethereum Attestation Service). The Location Protocol itself is implementation-agnostic - any system that follows the specification can produce compatible records.

**Why EAS for the reference implementation:**
- **Standardized format** - Established attestation framework
- **Multi-chain support** - Works across different blockchains  
- **Ecosystem compatibility** - Integrates with other EAS-based applications
- **Battle-tested infrastructure** - Proven signature schemes and storage patterns

**Implementation flexibility:** While we use EAS, others can implement the Location Protocol using different signature schemes, storage layers, or verification workflows, as long as they follow the same structural rules.

## Media Attachments

Location attestations can include media files as supporting evidence:

```typescript
const attestation = await sdk.createOffchainLocationAttestation({
  location: [-0.1276, 51.5074],
  memo: 'Photo evidence from London Eye',
  media: [
    {
      mediaType: 'image/jpeg',
      data: base64ImageData
    }
  ]
});
```

Supported media types:
- **Images**: JPEG, PNG, GIF, TIFF
- **Video**: MP4, MOV  
- **Audio**: MP3, WAV, OGG, AAC
- **Documents**: PDF

## Chains & Networks

Astral SDK supports multiple blockchain networks:

| Network | Type | Chain ID | Use Case |
|---------|------|----------|----------|
| **Sepolia** | Testnet | 11155111 | Development & testing |
| **Base** | L2 Mainnet | 8453 | Low-cost production |
| **Arbitrum** | L2 Mainnet | 42161 | Fast, cheap transactions |
| **Celo** | L1 Mainnet | 42220 | Mobile-first applications |

## Common Patterns

### Development Workflow
```typescript
// 1. Start with offchain for development
const offchainAttestation = await sdk.createOffchainLocationAttestation(data);

// 2. Test verification
const isValid = await sdk.verifyOffchainLocationAttestation(offchainAttestation);

// 3. Move to onchain for production
const onchainAttestation = await sdk.createOnchainLocationAttestation(data);
```

### Hybrid Approach
```typescript
// Create offchain for immediate use
const offchainAttestation = await sdk.createOffchainLocationAttestation(data);

// Later, create onchain version for permanent record
const onchainAttestation = await sdk.createOnchainLocationAttestation(data);
// Note: These will have different UIDs but same content
```

## Security Considerations

### Private Keys
- **Never hardcode** private keys in your application
- **Use environment variables** for server-side applications  
- **Use wallet connections** for client-side applications

### Location Privacy
- **Hash sensitive data** in memo fields if needed
- **Consider precision** - exact coordinates vs approximate areas
- **Offchain first** for private location tracking

### Verification
- **Always verify** attestations from external sources
- **Check expiration** and revocation status for onchain attestations
- **Validate location data** format before processing

## Next Steps

Now that you understand the core concepts:

**Need more context?**
- **[Web3 Concepts](./web3)** - Blockchain, signatures, and verification for geospatial developers  
- **[Geospatial Concepts](./geospatial)** - Spatial data and coordinate systems for Web3 developers

**Ready to build?**
1. **[Quick Start](./quick-start)** - 30-second working example
2. **[Getting Started Guide](./guides/getting-started)** - Complete tutorial with setup
3. **[Workflow Guides](./guides/getting-started#workflows)** - Deep dives into offchain and onchain patterns
4. **[Examples Cookbook](./examples/cookbook)** - Real-world usage patterns

**Reference materials:**
- **[Location Protocol Specification](https://easierdata.org/updates/2025/2025-05-19-location-protocol-spec)** - Full protocol details
- **[API Reference](./api/reference)** - Complete method documentation