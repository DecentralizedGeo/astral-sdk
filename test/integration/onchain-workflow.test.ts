// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

/**
 * Integration tests for the complete onchain workflow in AstralSDK.
 *
 * These tests verify the full end-to-end flow:
 * SDK initialization → buildLocationAttestation → createOnchainLocationAttestation → verifyOnchainLocationAttestation
 */

import { AstralSDK } from '../../src/core/AstralSDK';
import { LocationAttestationInput, OnchainLocationAttestation } from '../../src/core/types';
import { isOnchainLocationAttestation } from '../../src/utils/typeGuards';

// Mock the OnchainRegistrar since we're not using a real blockchain
jest.mock('../../src/eas/OnchainRegistrar');

describe('AstralSDK - Onchain Workflow Integration', () => {
  let mockProvider: {
    getNetwork: jest.Mock;
    getBlockNumber: jest.Mock;
    getTransactionCount: jest.Mock;
    estimateGas: jest.Mock;
    getGasPrice: jest.Mock;
    getBalance: jest.Mock;
  };
  let mockSigner: {
    getAddress: jest.Mock;
    signTypedData: jest.Mock;
    provider: unknown;
    address: string;
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock provider
    mockProvider = {
      getNetwork: jest.fn().mockResolvedValue({ chainId: 11155111, name: 'sepolia' }),
      getBlockNumber: jest.fn().mockResolvedValue(12345678),
      getTransactionCount: jest.fn().mockResolvedValue(0),
      estimateGas: jest.fn().mockResolvedValue(BigInt(21000)),
      getGasPrice: jest.fn().mockResolvedValue(BigInt(1000000000)),
      getBalance: jest.fn().mockResolvedValue(BigInt('1000000000000000000')),
    };

    // Create mock signer with provider
    mockSigner = {
      getAddress: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
      signTypedData: jest
        .fn()
        .mockResolvedValue(
          '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1c'
        ),
      provider: mockProvider,
      address: '0x1234567890123456789012345678901234567890',
    };

    // Mock OnchainRegistrar methods
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { OnchainRegistrar } = require('../../src/eas/OnchainRegistrar');
    OnchainRegistrar.prototype.registerOnchainLocationAttestation = jest
      .fn()
      .mockImplementation(async (unsignedProof, options) => {
        const mockOnchainProof: OnchainLocationAttestation = {
          ...unsignedProof,
          uid: '0x' + '0'.repeat(64),
          attester: await mockSigner.getAddress(),
          chain: 'sepolia',
          chainId: 11155111,
          txHash: '0x' + '1'.repeat(64),
          blockNumber: 12345678,
          revocable:
            options?.revocable !== undefined
              ? options.revocable
              : (unsignedProof.revocable ?? true),
          revoked: false,
        };
        return mockOnchainProof;
      });

    OnchainRegistrar.prototype.verifyOnchainLocationAttestation = jest
      .fn()
      .mockImplementation(async proof => {
        return {
          isValid: !proof.revoked,
          attestation: proof,
          signerAddress: proof.attester,
        };
      });

    OnchainRegistrar.prototype.revokeOnchainLocationAttestation = jest
      .fn()
      .mockImplementation(async proof => {
        if (!proof.revocable) {
          throw new Error('Proof is not revocable');
        }
        if (proof.revoked) {
          throw new Error('Proof is already revoked');
        }
        return {
          hash: '0x' + '2'.repeat(64),
          wait: jest.fn().mockResolvedValue({
            blockNumber: 12345679,
            transactionHash: '0x' + '2'.repeat(64),
          }),
        };
      });
  });

  describe('End-to-end onchain workflow', () => {
    test('should complete full onchain workflow with GeoJSON location', async () => {
      // Initialize SDK with mock provider and signer
      const sdk = new AstralSDK({
        provider: mockProvider,
        signer: mockSigner,
        defaultChain: 'sepolia',
        debug: true,
      });

      // Ensure extensions are loaded
      await sdk.extensions.ensureInitialized();

      // Step 1: Create location proof input
      const input: LocationAttestationInput = {
        location: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Point',
            coordinates: [-74.006, 40.7128], // New York
          },
        },
        locationType: 'geojson-feature',
        memo: 'Integration test - New York location',
        timestamp: new Date(),
      };

      // Step 2: Build unsigned location proof
      const unsignedProof = await sdk.buildLocationAttestation(input);
      expect(unsignedProof).toBeDefined();
      expect(unsignedProof.locationType).toBe('geojson-feature');
      expect(unsignedProof.location).toContain('Point');
      expect(unsignedProof.memo).toBe('Integration test - New York location');

      // Step 3: Create onchain location proof
      const onchainProof = await sdk.createOnchainLocationAttestation(input);
      expect(onchainProof).toBeDefined();
      expect(isOnchainLocationAttestation(onchainProof)).toBe(true);
      expect(onchainProof.uid).toBeDefined();
      expect(onchainProof.txHash).toBeDefined();
      expect(onchainProof.chain).toBe('sepolia');
      expect(onchainProof.attester.toLowerCase()).toBe(
        (await mockSigner.getAddress()).toLowerCase()
      );

      // Step 4: Verify the onchain proof
      const verificationResult = await sdk.verifyOnchainLocationAttestation(onchainProof);
      expect(verificationResult.isValid).toBe(true);
      expect(verificationResult.signerAddress?.toLowerCase()).toBe(
        onchainProof.attester.toLowerCase()
      );
      expect(verificationResult.attestation).toEqual(onchainProof);

      // Step 5: Test revocation workflow
      const revokeTx = await sdk.revokeOnchainLocationAttestation(onchainProof);
      expect(revokeTx).toBeDefined();
      expect((revokeTx as Record<string, unknown>).hash).toBeDefined();
    });

    test('should complete onchain workflow with media attachments', async () => {
      const sdk = new AstralSDK({
        provider: mockProvider,
        signer: mockSigner,
        defaultChain: 'sepolia',
      });

      await sdk.extensions.ensureInitialized();

      const input: LocationAttestationInput = {
        location: {
          type: 'Point',
          coordinates: [139.6917, 35.6895], // Tokyo
        },
        locationType: 'geojson-point',
        media: [
          {
            mediaType: 'image/png',
            data: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          },
        ],
        memo: 'Location with image attachment',
      };

      const onchainProof = await sdk.createOnchainLocationAttestation(input);
      expect(onchainProof.mediaType).toEqual(['image/png']);
      expect(onchainProof.mediaData).toHaveLength(1);

      const verificationResult = await sdk.verifyOnchainLocationAttestation(onchainProof);
      expect(verificationResult.isValid).toBe(true);
    });

    test('should handle different provider configurations', async () => {
      // Test 1: Using mock JsonRpcProvider-like object
      const jsonRpcProvider = {
        ...mockProvider,
        connection: { url: 'https://sepolia.infura.io/v3/test' },
      };

      const sdk1 = new AstralSDK({
        provider: jsonRpcProvider,
        signer: mockSigner,
        defaultChain: 'sepolia',
      });

      await sdk1.extensions.ensureInitialized();

      const input: LocationAttestationInput = {
        location: {
          type: 'Point',
          coordinates: [0, 0],
        },
        locationType: 'geojson-point',
        memo: 'Testing provider configuration',
      };

      const onchainProof1 = await sdk1.createOnchainLocationAttestation(input);
      expect(onchainProof1).toBeDefined();
      expect(onchainProof1.chain).toBe('sepolia');

      // Test 2: Using different chain configuration
      const baseMockProvider = {
        ...mockProvider,
        getNetwork: jest.fn().mockResolvedValue({ chainId: 8453, name: 'base' }),
      };

      const baseMockSigner = {
        getAddress: jest.fn().mockResolvedValue('0xabcdef0123456789abcdef0123456789abcdef01'),
        signTypedData: jest
          .fn()
          .mockResolvedValue(
            '0xabcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef012345671c'
          ),
        provider: baseMockProvider,
        address: '0xabcdef0123456789abcdef0123456789abcdef01',
      };

      // Mock OnchainRegistrar for base chain - need to clear and reset the mock
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { OnchainRegistrar: OnchainRegistrar2 } = require('../../src/eas/OnchainRegistrar');
      OnchainRegistrar2.prototype.registerOnchainLocationAttestation = jest
        .fn()
        .mockImplementation(async unsignedProof => {
          const mockOnchainProof: OnchainLocationAttestation = {
            ...unsignedProof,
            uid: '0x' + '0'.repeat(64),
            attester: await baseMockSigner.getAddress(),
            chain: 'base',
            chainId: 8453,
            txHash: '0x' + '3'.repeat(64),
            blockNumber: 87654321,
            revocable: unsignedProof.revocable ?? true,
            revoked: false,
          };
          return mockOnchainProof;
        });

      const sdk2 = new AstralSDK({
        provider: baseMockProvider,
        signer: baseMockSigner,
        defaultChain: 'base',
      });

      await sdk2.extensions.ensureInitialized();

      const onchainProof2 = await sdk2.createOnchainLocationAttestation(input);
      expect(onchainProof2).toBeDefined();
      expect(onchainProof2.chain).toBe('base');
      expect(onchainProof2.chainId).toBe(8453);
    });

    test('should handle transaction options and overrides', async () => {
      const sdk = new AstralSDK({
        provider: mockProvider,
        signer: mockSigner,
        defaultChain: 'sepolia',
      });

      await sdk.extensions.ensureInitialized();

      const input: LocationAttestationInput = {
        location: {
          type: 'Point',
          coordinates: [13.405, 52.52], // Berlin
        },
        locationType: 'geojson-point',
        memo: 'Testing transaction overrides',
        recipient: '0x1234567890123456789012345678901234567890',
      };

      const options = {
        txOverrides: {
          gasLimit: 500000,
          maxFeePerGas: 100000000000,
          maxPriorityFeePerGas: 2000000000,
        },
        subject: '0x1234567890123456789012345678901234567890',
        revocable: false,
      };

      // Mock the registrar to verify options are passed
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { OnchainRegistrar } = require('../../src/eas/OnchainRegistrar');
      const registerSpy = jest.spyOn(
        OnchainRegistrar.prototype,
        'registerOnchainLocationAttestation'
      );

      const onchainProof = await sdk.createOnchainLocationAttestation(input, options);

      // Verify the options were passed to the registrar
      expect(registerSpy).toHaveBeenCalledWith(expect.any(Object), options);
      expect(onchainProof.revocable).toBe(false);
    });

    test('should handle error scenarios gracefully', async () => {
      // Test 1: No provider or signer
      const sdk1 = new AstralSDK({
        defaultChain: 'sepolia',
      });

      await sdk1.extensions.ensureInitialized();

      const input: LocationAttestationInput = {
        location: { type: 'Point', coordinates: [0, 0] },
        locationType: 'geojson-point',
        memo: 'Testing error scenarios',
      };

      await expect(sdk1.createOnchainLocationAttestation(input)).rejects.toThrow();

      // Test 2: Revoke non-revocable proof (using options to make it non-revocable)
      const sdk2 = new AstralSDK({
        provider: mockProvider,
        signer: mockSigner,
        defaultChain: 'sepolia',
      });

      await sdk2.extensions.ensureInitialized();

      const nonRevocableProof = await sdk2.createOnchainLocationAttestation(input, {
        revocable: false,
      });
      expect(nonRevocableProof.revocable).toBe(false);

      await expect(sdk2.revokeOnchainLocationAttestation(nonRevocableProof)).rejects.toThrow(
        'not revocable'
      );
    });

    test('should test registration, verification, and revocation workflow', async () => {
      const sdk = new AstralSDK({
        provider: mockProvider,
        signer: mockSigner,
        defaultChain: 'sepolia',
      });

      await sdk.extensions.ensureInitialized();

      // Step 1: Register a proof
      const input: LocationAttestationInput = {
        location: {
          type: 'Point',
          coordinates: [-0.1276, 51.5074], // London
        },
        locationType: 'geojson-point',
        memo: 'Full workflow test',
      };

      const onchainProof = await sdk.createOnchainLocationAttestation(input);
      expect(onchainProof).toBeDefined();
      expect(onchainProof.revoked).toBe(false);

      // Step 2: Verify the proof
      const verificationResult1 = await sdk.verifyOnchainLocationAttestation(onchainProof);
      expect(verificationResult1.isValid).toBe(true);

      // Step 3: Revoke the proof
      const revokeTx = await sdk.revokeOnchainLocationAttestation(onchainProof);
      expect(revokeTx).toBeDefined();

      // Step 4: Verification of revoked proof is tested in unit tests
      // This integration test verifies the workflow up to revocation
      expect((revokeTx as Record<string, unknown>).hash).toBeDefined();
    });
  });
});
