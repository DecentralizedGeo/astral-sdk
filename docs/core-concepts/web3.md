---
title: Web3 Concepts
sidebar_position: 1
description: Blockchain, signatures, and verification concepts for geospatial developers
---

# Web3 Concepts for Geospatial Developers

If you're comfortable with spatial data but new to blockchain and Web3 concepts, this guide covers what you need to know to work with Astral SDK.

## What is Web3?

Web3 refers to decentralized internet applications built on blockchain technology. Instead of relying on centralized servers, Web3 systems use:

- **Distributed networks** - No single point of failure
- **Cryptographic verification** - Math-based trust instead of institutional trust  
- **User-controlled accounts** - You own your data and identity
- **Immutable records** - Once written, data cannot be altered

For spatial data, this means you can create location records that are verifiable by anyone, permanently stored, and don't depend on any single company or server.

## Ethereum and EAS

**Ethereum** is a blockchain network that allows programmable transactions through "smart contracts" - code that runs on the blockchain.

**EAS (Ethereum Attestation Service)** is a smart contract system that provides a standard way to create verifiable claims about anything. Think of it as a universal "digital notary" that can verify statements like:
- "This GPS coordinate was recorded at this time"
- "This polygon represents a protected area boundary"
- "This sensor reading came from this location"

Astral SDK uses EAS as its foundation, but the Location Protocol itself can work with other verification systems.

## Cryptographic Signatures

Instead of usernames and passwords, Web3 uses **cryptographic key pairs**:

- **Private key**: Secret key only you know (like a super-secure password)
- **Public key/Address**: Your public identifier (like an email address)
- **Digital signature**: Proof that you authorized something

When you sign a location attestation, you're creating mathematical proof that you created that record. Anyone can verify this without trusting a central authority.

```typescript
// When you sign an attestation:
const attestation = await sdk.createOffchainLocationAttestation({
  location: { type: 'Point', coordinates: [lng, lat] },
  memo: 'Field survey point'
});
// Results in: cryptographic signature + your public address + the data
```

## Wallets

A **wallet** is software that manages your private keys and interacts with blockchain networks. Popular wallets include:

- **MetaMask** (browser extension)
- **WalletConnect** (mobile wallets)  
- **Hardware wallets** (Ledger, Trezor)

For Astral SDK, you connect your wallet to sign attestations. The wallet handles the cryptography - you just approve transactions.

## Offchain vs Onchain

This is a key concept for understanding how Astral SDK works:

### Offchain (EIP-712 Signatures)
- **Like**: Signing a document with a notary stamp
- **Process**: Create attestation → Sign with wallet → Store wherever you want
- **Cost**: Free (no blockchain transaction)
- **Speed**: Instant
- **Verification**: Anyone can check the signature matches your address

### Onchain (Blockchain Transactions)  
- **Like**: Filing an official document with a government registry
- **Process**: Create attestation → Submit transaction → Permanent blockchain record
- **Cost**: Gas fees (usually $0.10 - $10 depending on network)
- **Speed**: 10 seconds to minutes (depending on network)
- **Verification**: Built into the blockchain, accessible by smart contracts

## Networks and Gas

**Blockchain networks** are different "versions" of the decentralized system:

| Network | Type | Purpose | Gas Cost |
|---------|------|---------|----------|
| **Sepolia** | Testnet | Development/testing | Free |
| **Ethereum** | Mainnet | Production (expensive) | $5-50 per transaction |
| **Base** | Layer 2 | Production (cheap) | $0.10-1 per transaction |
| **Arbitrum** | Layer 2 | Production (cheap) | $0.15-1.50 per transaction |

**Gas** is the fee you pay for blockchain transactions. Think of it as postage for sending mail through the blockchain network.

**Testnet** networks use fake money for development - perfect for learning and testing.

## Smart Contracts

**Smart contracts** are programs that run on the blockchain. They can:
- Automatically execute when conditions are met
- Hold and transfer funds
- Read and write data
- Interact with other contracts

For spatial applications, smart contracts might:
- Verify location attestations before releasing payments
- Automatically update maps when boundaries change
- Reward users for contributing accurate location data

## Integration with Your Spatial Stack

Astral SDK integrates with existing geospatial tools:

```typescript
// From PostGIS query to blockchain attestation
const gisQuery = `
  SELECT ST_AsGeoJSON(geom) as location, site_name, survey_date 
  FROM field_surveys 
  WHERE survey_date = '2024-01-15'
`;

const results = await database.query(gisQuery);

for (const row of results) {
  const attestation = await sdk.createOffchainLocationAttestation({
    location: JSON.parse(row.location),
    memo: `Field survey: ${row.site_name}`,
    timestamp: row.survey_date
  });
  
  // Now you have a verifiable, portable record
}
```

## Key Benefits for Geospatial Work

**Interoperability**: Location attestations work across different applications and organizations

**Attribution**: Always know who created spatial data and when

**Integrity**: Detect if spatial data has been modified or corrupted

**Decentralization**: No vendor lock-in or single points of failure

**Transparency**: Audit trails for sensitive spatial data (environmental monitoring, land rights, etc.)

## Getting Started

1. **Install a wallet** (MetaMask is easiest for development)
2. **Get test ETH** from a faucet for Sepolia testnet  
3. **Try the offchain workflow** first (no gas required)
4. **Move to onchain** when you need permanent records

The beauty of Web3 is that once you understand these concepts, they work the same way across all decentralized applications - not just spatial ones.

## Next Steps

- **[Quick Start](../quick-start)** - Create your first attestation in 30 seconds
- **[Getting Started Guide](../guides/getting-started)** - Complete tutorial with wallet setup
- **[Geospatial Concepts](./geospatial)** - If you want to understand the spatial data side too