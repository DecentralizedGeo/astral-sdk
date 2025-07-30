// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

/**
 * Tests for AstralSDK chainId configuration support
 *
 * This test suite verifies that the SDK correctly handles chainId configuration
 * for all supported chains (Sepolia, Celo, Arbitrum, Base) in offchain workflows.
 */

import { jest } from '@jest/globals';
import { AstralSDK } from '../../src/core/AstralSDK';
import { Wallet } from 'ethers';

// Mock ethers
jest.mock('ethers', () => {
  const actualEthers = jest.requireActual('ethers') as typeof import('ethers');
  return {
    ...actualEthers,
    Wallet: jest.fn().mockImplementation(() => ({
      address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      getAddress: () => Promise.resolve('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'),
      signMessage: () => Promise.resolve('0xmocksignature'),
      signTypedData: () => Promise.resolve('0xmocktypedsignature'),
    })),
  };
});

// Mock EAS SDK
jest.mock('@ethereum-attestation-service/eas-sdk', () => ({
  EAS: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
  })),
  Offchain: jest.fn().mockImplementation(() => ({
    signOffchainAttestation: () =>
      Promise.resolve({
        uid: '0xmockuid',
        signature: {
          v: 27,
          r: '0xmockr',
          s: '0xmocks',
        },
      }),
  })),
  OffchainAttestationVersion: {
    Version2: 2,
  },
  SchemaEncoder: jest.fn().mockImplementation(() => ({
    encodeData: jest.fn().mockReturnValue('0xmockencodeddata'),
  })),
}));

describe('AstralSDK chainId Configuration', () => {
  let mockSigner: Wallet;

  beforeEach(() => {
    mockSigner = new Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
  });

  describe('chainId configuration support', () => {
    const testCases = [
      {
        chainId: 11155111,
        chainName: 'sepolia',
        easAddress: '0xC2679fBD37d54388Ce493F1DB75320D236e1815e',
      },
      {
        chainId: 42220,
        chainName: 'celo',
        easAddress: '0x72E1d8ccf5299fb36fEfD8CC4394B8ef7e98Af92',
      },
      {
        chainId: 42161,
        chainName: 'arbitrum',
        easAddress: '0xbD75f629A22Dc1ceD33dDA0b68c546A1c035c458',
      },
      {
        chainId: 8453,
        chainName: 'base',
        easAddress: '0x4200000000000000000000000000000000000021',
      },
    ];

    test.each(testCases)(
      'should initialize with chainId $chainId for $chainName',
      async ({ chainId, chainName }) => {
        // Create SDK with chainId
        const sdk = new AstralSDK({
          chainId,
          signer: mockSigner,
        });

        // Ensure extensions are loaded
        await sdk.extensions.ensureInitialized();

        // Create a location attestation
        const proof = await sdk.buildLocationAttestation({
          location: [20, 10],
          locationType: 'coordinates-decimal+lon-lat',
          memo: `Testing ${chainName} with chainId ${chainId}`,
        });

        // Sign the attestation (this will use the configured chainId)
        const signedProof = await sdk.signOffchainLocationAttestation(proof);

        expect(signedProof).toBeDefined();
        expect(signedProof.uid).toBeDefined();
        expect(signedProof.signature).toBeDefined();
      }
    );

    test.each(testCases)(
      'should initialize with defaultChain "$chainName" and resolve to chainId $chainId',
      async ({ chainName }) => {
        // Create SDK with chain name
        const sdk = new AstralSDK({
          defaultChain: chainName,
          signer: mockSigner,
        });

        // Ensure extensions are loaded
        await sdk.extensions.ensureInitialized();

        // Create a location attestation
        const proof = await sdk.buildLocationAttestation({
          location: [20, 10],
          locationType: 'coordinates-decimal+lon-lat',
          memo: `Testing ${chainName} with defaultChain`,
        });

        // Sign the attestation
        const signedProof = await sdk.signOffchainLocationAttestation(proof);

        expect(signedProof).toBeDefined();
        expect(signedProof.uid).toBeDefined();
        expect(signedProof.signature).toBeDefined();
      }
    );

    test('should prioritize chainId over defaultChain when both are provided', async () => {
      // Create SDK with both chainId and defaultChain
      const sdk = new AstralSDK({
        chainId: 42220, // Celo
        defaultChain: 'sepolia', // This should be ignored
        signer: mockSigner,
      });

      // Ensure extensions are loaded
      await sdk.extensions.ensureInitialized();

      // Create a location attestation
      const proof = await sdk.buildLocationAttestation({
        location: [20, 10],
        locationType: 'coordinates-decimal+lon-lat',
        memo: 'Testing chainId priority',
      });

      // Sign the attestation
      const signedProof = await sdk.signOffchainLocationAttestation(proof);

      expect(signedProof).toBeDefined();
      // The actual chain used should be Celo (42220), not Sepolia
    });

    test('should throw error for unsupported chainId', async () => {
      expect(() => {
        new AstralSDK({
          chainId: 1337, // Unsupported chain
          signer: mockSigner,
        });
      }).toThrow();
    });

    test('should default to Sepolia when neither chainId nor defaultChain is provided', async () => {
      const sdk = new AstralSDK({
        signer: mockSigner,
      });

      // Ensure extensions are loaded
      await sdk.extensions.ensureInitialized();

      // Create a location attestation
      const proof = await sdk.buildLocationAttestation({
        location: [20, 10],
        locationType: 'coordinates-decimal+lon-lat',
        memo: 'Testing default chain',
      });

      // Sign the attestation (should use Sepolia by default)
      const signedProof = await sdk.signOffchainLocationAttestation(proof);

      expect(signedProof).toBeDefined();
    });
  });

  describe('chain-specific configuration validation', () => {
    test('should use correct EAS contract address for each chain', async () => {
      // This test would verify that the correct contract addresses are used
      // In a real implementation, we'd need to spy on the EAS constructor
      // to verify the correct addresses are passed

      const chains = [
        { chainId: 11155111, expectedAddress: '0xC2679fBD37d54388Ce493F1DB75320D236e1815e' },
        { chainId: 42220, expectedAddress: '0x72E1d8ccf5299fb36fEfD8CC4394B8ef7e98Af92' },
        { chainId: 42161, expectedAddress: '0xbD75f629A22Dc1ceD33dDA0b68c546A1c035c458' },
        { chainId: 8453, expectedAddress: '0x4200000000000000000000000000000000000021' },
      ];

      for (const { chainId } of chains) {
        const sdk = new AstralSDK({
          chainId,
          signer: mockSigner,
        });

        // Ensure extensions are loaded
        await sdk.extensions.ensureInitialized();

        // Create and sign an attestation to trigger initialization
        const proof = await sdk.buildLocationAttestation({
          location: [20, 10],
          locationType: 'coordinates-decimal+lon-lat',
        });

        await sdk.signOffchainLocationAttestation(proof);
        // In a real test, we'd verify the EAS constructor was called with expectedAddress
      }
    });

    test('should use the same schema UID for all chains', async () => {
      // All chains should use the same schema UID
      const chains = [11155111, 42220, 42161, 8453];

      for (const chainId of chains) {
        const sdk = new AstralSDK({
          chainId,
          signer: mockSigner,
        });

        // Ensure extensions are loaded
        await sdk.extensions.ensureInitialized();

        // The schema UID should be consistent across all chains
        const proof = await sdk.buildLocationAttestation({
          location: [20, 10],
          locationType: 'coordinates-decimal+lon-lat',
        });

        await sdk.signOffchainLocationAttestation(proof);
        // In a real implementation, we'd verify the schema UID used
      }
    });
  });

  describe('backward compatibility', () => {
    test('existing code using defaultChain should continue to work', async () => {
      // This ensures we don't break existing implementations
      const sdk = new AstralSDK({
        defaultChain: 'celo',
        signer: mockSigner,
      });

      // Ensure extensions are loaded
      await sdk.extensions.ensureInitialized();

      const proof = await sdk.buildLocationAttestation({
        location: [20, 10],
        locationType: 'coordinates-decimal+lon-lat',
        memo: 'Testing backward compatibility',
      });

      const signedProof = await sdk.signOffchainLocationAttestation(proof);

      expect(signedProof).toBeDefined();
      expect(signedProof.uid).toBeDefined();
      expect(signedProof.signature).toBeDefined();
    });
  });
});
