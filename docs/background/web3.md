---
title: Web3 Concepts
sidebar_position: 1
description: Blockchain, signatures, and verification concepts for geospatial developers
---

# Web3 Concepts for Geospatial Developers

If you're comfortable with spatial data but new to blockchain and Web3 concepts, this guide covers what you need to know to work with Astral SDK.

## What is Web3?

Web3 represents a vision for the internet built on three core principles:

### → Open
• **Open protocols** - Anyone can build on and interact with the system
• **Open source** - Code is transparent and auditable
• **Open participation** - No gatekeepers or permission required

### → Durable
• **Persistent data** - Information survives beyond any single organization
• **Decentralized storage** - No single point of failure
• **Cryptographic integrity** - Data cannot be tampered with

### → Consensual
• **User sovereignty** - You control your own data and identity
• **Explicit permissions** - Clear consent for data usage
• **Verifiable actions** - Every action has cryptographic proof

## Web3 for Location Data

These principles transform how we work with spatial information:

※ **Location data becomes portable** - Not locked in proprietary systems
※ **Provenance is built-in** - Every record has verifiable authorship
※ **Trust is mathematical** - No need to trust institutions for verification

Blockchains are one tool for achieving these principles, but Web3 encompasses more: decentralized storage (IPFS), peer-to-peer networks, cryptographic proofs, and user-controlled identity.

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
| **Base** | Layer 2 | Production (cheap) | $0.01-0.10 per transaction |
| **Arbitrum** | Layer 2 | Production (cheap) | $0.01-0.10 per transaction |

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

## External Resources

### → Learn More

• **[Ethereum.org Wallets Guide](https://ethereum.org/en/wallets/)** - Overview and security tips
• **[Set up Development Environment](https://ethereum.org/en/developers/local-environment/)** - Testnets and local nodes
• **[Hello World Smart Contract](https://ethereum.org/en/developers/tutorials/hello-world-smart-contract/)** - Wallet + testnet + deploy tutorial

### → Track Costs

• **[L2Fees.info](https://l2fees.info)** - Real-time Layer 2 fee dashboard
• **[L2Beat Activity](https://l2beat.com/scaling/activity)** - Base & Arbitrum TPS numbers

### → Dive Deeper

• **[EAS Documentation](https://docs.attest.sh)** - Ethereum Attestation Service
• **[IPFS Documentation](https://docs.ipfs.io)** - Decentralized storage
• **[Web3 Design Principles](https://www.web3designprinciples.com)** - UX best practices

## Next Steps

• **[Quick Start](/sdk/quick-start)** - Create your first attestation in 30 seconds
• **[Getting Started Guide](/sdk/guides/getting-started)** - Complete tutorial with wallet setup
• **[Geospatial Concepts](/sdk/background/geospatial)** - If you want to understand the spatial data side too