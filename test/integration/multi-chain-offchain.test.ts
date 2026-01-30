// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

/**
 * Integration tests for multi-chain offchain attestations
 *
 * This test suite verifies that offchain attestations work correctly
 * across all supported chains (Sepolia, Celo, Arbitrum, Base).
 */

import { jest } from '@jest/globals';
import { AstralSDK } from '../../src/core/AstralSDK';
import { OffchainLocationAttestation } from '../../src/core/types';
import { isOffchainLocationAttestation } from '../../src/utils/typeGuards';
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

// Mock EAS SDK with chain-specific behavior
jest.mock('@ethereum-attestation-service/eas-sdk', () => {
  return {
    EAS: jest.fn().mockImplementation(() => {
      return {
        connect: jest.fn(),
      };
    }),
    Offchain: jest.fn().mockImplementation((config: unknown) => {
      // Verify the chain ID is correctly passed
      const chainId = Number((config as { chainId: bigint }).chainId);

      return {
        signOffchainAttestation: jest.fn().mockImplementation(async () => {
          // Generate a unique UID based on the chain ID
          const uid = `0x${chainId.toString(16).padStart(64, '0')}`;

          return {
            uid,
            signature: {
              v: 27,
              r: `0xr${chainId}`,
              s: `0xs${chainId}`,
            },
          };
        }),
      };
    }),
    OffchainAttestationVersion: {
      Version2: 2,
    },
    SchemaEncoder: jest.fn().mockImplementation(() => ({
      encodeData: jest.fn().mockReturnValue('0xencodeddata'),
    })),
  };
});

describe('Multi-chain Offchain Attestation Integration', () => {
  let mockSigner: Wallet;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSigner = new Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
  });

  describe('Chain-specific offchain attestations', () => {
    interface ChainTestCase {
      chainId: number;
      chainName: string;
      easAddress: string;
      description: string;
    }

    const chainTestCases: ChainTestCase[] = [
      {
        chainId: 11155111,
        chainName: 'sepolia',
        easAddress: '0xC2679fBD37d54388Ce493F1DB75320D236e1815e',
        description: 'Sepolia testnet',
      },
      {
        chainId: 42220,
        chainName: 'celo',
        easAddress: '0x72E1d8ccf5299fb36fEfD8CC4394B8ef7e98Af92',
        description: 'Celo mainnet',
      },
      {
        chainId: 42161,
        chainName: 'arbitrum',
        easAddress: '0xbD75f629A22Dc1ceD33dDA0b68c546A1c035c458',
        description: 'Arbitrum One',
      },
      {
        chainId: 8453,
        chainName: 'base',
        easAddress: '0x4200000000000000000000000000000000000021',
        description: 'Base mainnet',
      },
    ];

    test.each(chainTestCases)(
      'should create offchain attestation on $description using chainId',
      async ({ chainId, chainName }) => {
        // Initialize SDK with chain ID
        const sdk = new AstralSDK({
          chainId,
          signer: mockSigner,
        });

        // Create location attestation
        const unsignedProof = await sdk.buildLocationAttestation({
          location: {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [-122.4194, 37.7749], // San Francisco
            },
            properties: {
              name: `${chainName} test location`,
            },
          },
          locationType: 'geojson',
          memo: `Testing offchain attestation on ${chainName} (${chainId})`,
        });

        expect(unsignedProof).toBeDefined();
        expect(unsignedProof.eventTimestamp).toBeGreaterThan(0);

        // Sign the attestation
        const signedProof = await sdk.signOffchainLocationAttestation(unsignedProof);

        // Verify the signed proof
        expect(isOffchainLocationAttestation(signedProof)).toBe(true);
        expect(signedProof.uid).toBeDefined();
        expect(signedProof.signature).toBeDefined();
        expect(signedProof.signer).toBe('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');

        // Verify chain-specific UID (mocked to include chainId)
        expect(signedProof.uid).toContain(chainId.toString(16));
      }
    );

    test.each(chainTestCases)(
      'should create offchain attestation on $description using chain name',
      async ({ chainName }) => {
        // Initialize SDK with chain name
        const sdk = new AstralSDK({
          defaultChain: chainName,
          signer: mockSigner,
        });

        // Create location attestation
        const unsignedProof = await sdk.buildLocationAttestation({
          location: { type: 'Point', coordinates: [12.34, 56.78] },
          locationType: 'geojson',
          memo: `Testing with chain name: ${chainName}`,
        });

        // Sign the attestation
        const signedProof = await sdk.signOffchainLocationAttestation(unsignedProof);

        // Verify the signed proof
        expect(isOffchainLocationAttestation(signedProof)).toBe(true);
        expect(signedProof.uid).toBeDefined();
        expect(signedProof.signature).toBeDefined();
      }
    );
  });

  describe('Chain configuration edge cases', () => {
    test('should handle chainId and defaultChain conflict correctly', async () => {
      // When both are provided, chainId should take precedence
      const sdk = new AstralSDK({
        chainId: 42220, // Celo
        defaultChain: 'sepolia', // This should be ignored
        signer: mockSigner,
      });

      const unsignedProof = await sdk.buildLocationAttestation({
        location: { type: 'Point', coordinates: [20, 10] },
        locationType: 'geojson',
        memo: 'Testing chainId priority',
      });

      const signedProof = await sdk.signOffchainLocationAttestation(unsignedProof);

      // The UID should indicate Celo was used (42220 = 0xa4ec in hex)
      expect(signedProof.uid).toContain('a4ec');
    });

    test('should throw error for unsupported chain ID', async () => {
      expect(() => {
        new AstralSDK({
          chainId: 9999, // Unsupported
          signer: mockSigner,
        });
      }).toThrow();
    });

    test('should throw error for unsupported chain name', async () => {
      expect(() => {
        new AstralSDK({
          defaultChain: 'unsupported-chain',
          signer: mockSigner,
        });
      }).toThrow();
    });
  });

  describe('Multi-attestation workflow', () => {
    test('should create attestations on multiple chains sequentially', async () => {
      const attestations: OffchainLocationAttestation[] = [];

      // Create attestations on different chains
      for (const chainId of [11155111, 42220, 42161, 8453]) {
        const sdk = new AstralSDK({
          chainId,
          signer: mockSigner,
        });

        // Ensure extensions are loaded
        await sdk.extensions.ensureInitialized();

        const unsignedProof = await sdk.buildLocationAttestation({
          location: { type: 'Point', coordinates: [-74.006, 40.7128] }, // New York
          locationType: 'geojson',
          memo: `Multi-chain test on ${chainId}`,
        });

        const signedProof = await sdk.signOffchainLocationAttestation(unsignedProof);
        attestations.push(signedProof);
      }

      // Verify we have attestations from all chains
      expect(attestations).toHaveLength(4);

      // Each attestation should have a unique UID
      const uids = attestations.map(a => a.uid);
      expect(new Set(uids).size).toBe(4);
    });
  });

  describe('Backward compatibility', () => {
    test('should maintain compatibility with existing defaultChain usage', async () => {
      // Existing code that uses defaultChain should continue to work
      const sdk = new AstralSDK({
        defaultChain: 'celo',
        signer: mockSigner,
      });

      const unsignedProof = await sdk.buildLocationAttestation({
        location: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [
              [
                [-73.9876, 40.7661],
                [-73.9857, 40.7641],
                [-73.9837, 40.7621],
                [-73.9876, 40.7661],
              ],
            ],
          },
        },
        locationType: 'geojson',
        memo: 'Backward compatibility test',
      });

      const signedProof = await sdk.signOffchainLocationAttestation(unsignedProof);

      expect(isOffchainLocationAttestation(signedProof)).toBe(true);
      expect(signedProof.uid).toBeDefined();
    });
  });
});
