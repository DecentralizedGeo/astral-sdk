// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

/**
 * Tests for the onchain workflow functionality in AstralSDK.
 *
 * These tests verify that the AstralSDK properly delegates to the
 * OnchainRegistrar for registering, verifying, and revoking onchain attestations.
 */

import { AstralSDK } from '../../src/core/AstralSDK';
import { OnchainRegistrar } from '../../src/eas/OnchainRegistrar';
import {
  LocationAttestationInput,
  OnchainLocationAttestation,
  OnchainAttestationOptions,
} from '../../src/core/types';
import { ValidationError, NetworkError } from '../../src/core/errors';

// Mock dependencies
jest.mock('../../src/eas/OnchainRegistrar');

describe('AstralSDK - Onchain Workflow', () => {
  let sdk: AstralSDK;
  let mockProvider: {
    getNetwork: jest.Mock;
    getBlockNumber?: jest.Mock;
    getTransactionCount?: jest.Mock;
    estimateGas?: jest.Mock;
    getGasPrice?: jest.Mock;
    getBalance?: jest.Mock;
  };
  let mockSigner: { getAddress: jest.Mock; signTypedData?: jest.Mock; provider: unknown };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock provider and signer
    mockProvider = {
      getNetwork: jest.fn().mockResolvedValue({ chainId: 11155111 }),
      getBlockNumber: jest.fn().mockResolvedValue(12345678),
      getTransactionCount: jest.fn().mockResolvedValue(0),
      estimateGas: jest.fn().mockResolvedValue(BigInt(21000)),
      getGasPrice: jest.fn().mockResolvedValue(BigInt(1000000000)),
      getBalance: jest.fn().mockResolvedValue(BigInt('1000000000000000000')),
    };
    mockSigner = {
      getAddress: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
      signTypedData: jest
        .fn()
        .mockResolvedValue(
          '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1c'
        ),
      provider: mockProvider,
    };

    // Create SDK instance with mocks
    sdk = new AstralSDK({
      provider: mockProvider,
      signer: mockSigner,
      defaultChain: 'sepolia',
      debug: true,
    });
  });

  describe('createOnchainLocationAttestation', () => {
    test('should build and register a location proof onchain', async () => {
      // Create a spy on buildLocationAttestation
      const buildSpy = jest.spyOn(sdk, 'buildLocationAttestation');

      // Mock OnchainRegistrar.registerOnchainLocationAttestation
      const mockProof: OnchainLocationAttestation = {
        eventTimestamp: Math.floor(Date.now() / 1000),
        srs: 'EPSG:4326',
        locationType: 'geojson',
        location: '{"type":"Point","coordinates":[-122.4194,37.7749]}',
        recipeType: [],
        recipePayload: [],
        mediaType: [],
        mediaData: [],
        uid: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        attester: '0x1234567890123456789012345678901234567890',
        chain: 'sepolia',
        chainId: 11155111,
        txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        blockNumber: 12345678,
        revocable: true,
        revoked: false,
      };

      // Setup the mock to return our mock proof
      (
        OnchainRegistrar.prototype.registerOnchainLocationAttestation as jest.Mock
      ).mockResolvedValue(mockProof);

      // Create input for the test
      const input: LocationAttestationInput = {
        location: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749],
        },
        locationType: 'geojson',
        memo: 'Test onchain proof',
      };

      // Call the method
      const result = await sdk.createOnchainLocationAttestation(input);

      // Verify buildLocationAttestation was called with the input
      expect(buildSpy).toHaveBeenCalledWith(input);

      // Verify registerOnchainLocationAttestation was called
      expect(OnchainRegistrar.prototype.registerOnchainLocationAttestation).toHaveBeenCalled();

      // Verify the result is the mock proof
      expect(result).toBe(mockProof);
      expect(result.uid).toBe(mockProof.uid);
      expect(result.chain).toBe('sepolia');
      expect(result.txHash).toBe(mockProof.txHash);
    });

    test('should throw error if no provider or signer is available', async () => {
      // Create SDK without provider or signer
      const sdkWithoutProvider = new AstralSDK({
        debug: true,
      });

      // Create input for the test
      const input: LocationAttestationInput = {
        location: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749],
        },
        locationType: 'geojson',
      };

      // Expect the method to throw
      await expect(sdkWithoutProvider.createOnchainLocationAttestation(input)).rejects.toThrow(
        ValidationError
      );
    });

    test('should register proof with various location formats', async () => {
      // Mock buildLocationAttestation to avoid extension validation issues in unit tests
      const buildSpy = jest
        .spyOn(sdk, 'buildLocationAttestation')
        .mockImplementation(async input => ({
          eventTimestamp: Math.floor(Date.now() / 1000),
          srs: 'EPSG:4326',
          locationType: input.locationType || 'geojson',
          location: JSON.stringify(input.location),
          recipeType: [],
          recipePayload: [],
          mediaType: [],
          mediaData: [],
          memo: input.memo,
          revocable: true,
        }));

      const mockProof: OnchainLocationAttestation = {
        eventTimestamp: Math.floor(Date.now() / 1000),
        srs: 'EPSG:4326',
        locationType: 'coordinates-decimal+lon-lat',
        location: '[-122.4194,37.7749]',
        recipeType: [],
        recipePayload: [],
        mediaType: [],
        mediaData: [],
        uid: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        attester: '0x1234567890123456789012345678901234567890',
        chain: 'sepolia',
        chainId: 11155111,
        txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        blockNumber: 12345678,
        revocable: true,
        revoked: false,
      };

      (
        OnchainRegistrar.prototype.registerOnchainLocationAttestation as jest.Mock
      ).mockResolvedValue(mockProof);

      // Test with coordinates
      const coordInput: LocationAttestationInput = {
        location: [-122.4194, 37.7749],
        locationType: 'coordinates-decimal+lon-lat',
      };
      const coordResult = await sdk.createOnchainLocationAttestation(coordInput);
      expect(coordResult.locationType).toBe('coordinates-decimal+lon-lat');

      // Test with WKT
      const wktInput: LocationAttestationInput = {
        location: 'POINT(-122.4194 37.7749)',
        locationType: 'wkt-point',
      };
      const wktMockProof = {
        ...mockProof,
        locationType: 'wkt-point',
        location: 'POINT(-122.4194 37.7749)',
      };
      (
        OnchainRegistrar.prototype.registerOnchainLocationAttestation as jest.Mock
      ).mockResolvedValue(wktMockProof);
      const wktResult = await sdk.createOnchainLocationAttestation(wktInput);
      expect(wktResult.locationType).toBe('wkt-point');

      // Test with H3
      const h3Input: LocationAttestationInput = {
        location: '8f283082a365d25',
        locationType: 'h3',
      };
      const h3MockProof = { ...mockProof, locationType: 'h3', location: '8f283082a365d25' };
      (
        OnchainRegistrar.prototype.registerOnchainLocationAttestation as jest.Mock
      ).mockResolvedValue(h3MockProof);
      const h3Result = await sdk.createOnchainLocationAttestation(h3Input);
      expect(h3Result.locationType).toBe('h3');

      // Restore the original implementation
      buildSpy.mockRestore();
    });

    test('should register proof with media attachments', async () => {
      // Mock buildLocationAttestation to avoid extension validation issues in unit tests
      const buildSpy = jest
        .spyOn(sdk, 'buildLocationAttestation')
        .mockImplementation(async input => ({
          eventTimestamp: Math.floor(Date.now() / 1000),
          srs: 'EPSG:4326',
          locationType: input.locationType || 'geojson',
          location: JSON.stringify(input.location),
          recipeType: [],
          recipePayload: [],
          mediaType: input.media ? input.media.map(m => m.mediaType) : [],
          mediaData: input.media ? input.media.map(m => m.data) : [],
          memo: input.memo,
          revocable: true,
        }));
      const mockProof: OnchainLocationAttestation = {
        eventTimestamp: Math.floor(Date.now() / 1000),
        srs: 'EPSG:4326',
        locationType: 'geojson',
        location: '{"type":"Point","coordinates":[-122.4194,37.7749]}',
        recipeType: [],
        recipePayload: [],
        mediaType: ['image/jpeg', 'video/mp4'],
        mediaData: ['ipfs://QmXyz123', 'data:video/mp4;base64,AAAA...'],
        uid: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        attester: '0x1234567890123456789012345678901234567890',
        chain: 'sepolia',
        chainId: 11155111,
        txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        blockNumber: 12345678,
        revocable: true,
        revoked: false,
      };

      (
        OnchainRegistrar.prototype.registerOnchainLocationAttestation as jest.Mock
      ).mockResolvedValue(mockProof);

      const input: LocationAttestationInput = {
        location: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749],
        },
        locationType: 'geojson',
        media: [
          { mediaType: 'image/jpeg', data: 'ipfs://QmXyz123' },
          { mediaType: 'video/mp4', data: 'data:video/mp4;base64,AAAA...' },
        ],
      };

      const result = await sdk.createOnchainLocationAttestation(input);
      expect(result.mediaType).toEqual(['image/jpeg', 'video/mp4']);
      expect(result.mediaData).toEqual(['ipfs://QmXyz123', 'data:video/mp4;base64,AAAA...']);

      // Restore the original implementation
      buildSpy.mockRestore();
    });

    test('should register proof with OnchainAttestationOptions', async () => {
      // Mock buildLocationAttestation to avoid extension validation issues in unit tests
      const buildSpy = jest
        .spyOn(sdk, 'buildLocationAttestation')
        .mockImplementation(async input => ({
          eventTimestamp: Math.floor(Date.now() / 1000),
          srs: 'EPSG:4326',
          locationType: input.locationType || 'geojson',
          location: JSON.stringify(input.location),
          recipeType: [],
          recipePayload: [],
          mediaType: [],
          mediaData: [],
          memo: input.memo,
          revocable: true,
        }));
      const mockProof: OnchainLocationAttestation = {
        eventTimestamp: Math.floor(Date.now() / 1000),
        srs: 'EPSG:4326',
        locationType: 'geojson',
        location: '{"type":"Point","coordinates":[-122.4194,37.7749]}',
        recipeType: [],
        recipePayload: [],
        mediaType: [],
        mediaData: [],
        uid: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        attester: '0x1234567890123456789012345678901234567890',
        chain: 'sepolia',
        chainId: 11155111,
        txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        blockNumber: 12345678,
        revocable: false,
        revoked: false,
        recipient: '0x9876543210987654321098765432109876543210',
      };

      (
        OnchainRegistrar.prototype.registerOnchainLocationAttestation as jest.Mock
      ).mockResolvedValue(mockProof);

      const input: LocationAttestationInput = {
        location: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749],
        },
        locationType: 'geojson',
      };

      const options: OnchainAttestationOptions = {
        txOverrides: {
          gasLimit: 500000,
          maxFeePerGas: 100000000000,
          maxPriorityFeePerGas: 2000000000,
        },
        subject: '0x9876543210987654321098765432109876543210',
        revocable: false,
      };

      const result = await sdk.createOnchainLocationAttestation(input, options);
      expect(result.revocable).toBe(false);
      expect(result.recipient).toBe('0x9876543210987654321098765432109876543210');

      // Verify options were passed to registrar
      const registrarCall = (
        OnchainRegistrar.prototype.registerOnchainLocationAttestation as jest.Mock
      ).mock.calls[0];
      expect(registrarCall[1]).toEqual(options);

      // Restore the original implementation
      buildSpy.mockRestore();
    });

    test('should handle network errors', async () => {
      // Mock buildLocationAttestation to avoid extension validation issues in unit tests
      const buildSpy = jest
        .spyOn(sdk, 'buildLocationAttestation')
        .mockImplementation(async input => ({
          eventTimestamp: Math.floor(Date.now() / 1000),
          srs: 'EPSG:4326',
          locationType: input.locationType || 'geojson',
          location: JSON.stringify(input.location),
          recipeType: [],
          recipePayload: [],
          mediaType: [],
          mediaData: [],
          memo: input.memo,
          revocable: true,
        }));
      const networkError = new NetworkError('Failed to connect to blockchain');
      (
        OnchainRegistrar.prototype.registerOnchainLocationAttestation as jest.Mock
      ).mockRejectedValue(networkError);

      const input: LocationAttestationInput = {
        location: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749],
        },
        locationType: 'geojson',
      };

      await expect(sdk.createOnchainLocationAttestation(input)).rejects.toThrow(NetworkError);

      // Restore the original implementation
      buildSpy.mockRestore();
    });

    test('should handle invalid input errors', async () => {
      // Test with empty location
      const emptyLocationInput: LocationAttestationInput = {
        location: '',
        locationType: 'geojson',
      };

      await expect(sdk.createOnchainLocationAttestation(emptyLocationInput)).rejects.toThrow(
        ValidationError
      );

      // Test with invalid location type
      const invalidTypeInput: LocationAttestationInput = {
        location: 'some location',
        locationType: 'invalid-type',
      };

      await expect(sdk.createOnchainLocationAttestation(invalidTypeInput)).rejects.toThrow();
    });
  });

  describe('verifyOnchainLocationAttestation', () => {
    test('should verify an onchain location proof', async () => {
      // Mock proof to verify
      const mockProof: OnchainLocationAttestation = {
        eventTimestamp: Math.floor(Date.now() / 1000),
        srs: 'EPSG:4326',
        locationType: 'geojson',
        location: '{"type":"Point","coordinates":[-122.4194,37.7749]}',
        recipeType: [],
        recipePayload: [],
        mediaType: [],
        mediaData: [],
        uid: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        attester: '0x1234567890123456789012345678901234567890',
        chain: 'sepolia',
        chainId: 11155111,
        txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        blockNumber: 12345678,
        revocable: true,
        revoked: false,
      };

      // Mock verification result
      const mockResult = {
        isValid: true,
        signerAddress: '0x1234567890123456789012345678901234567890',
        attestation: mockProof,
      };

      // Setup the mock to return our result
      (OnchainRegistrar.prototype.verifyOnchainLocationAttestation as jest.Mock).mockResolvedValue(
        mockResult
      );

      // Call the method
      const result = await sdk.verifyOnchainLocationAttestation(mockProof);

      // Verify verifyOnchainLocationAttestation was called with the proof
      expect(OnchainRegistrar.prototype.verifyOnchainLocationAttestation).toHaveBeenCalledWith(
        mockProof
      );

      // Verify the result matches our mock
      expect(result).toBe(mockResult);
      expect(result.isValid).toBe(true);
    });

    test('should verify a revoked proof', async () => {
      const revokedProof: OnchainLocationAttestation = {
        eventTimestamp: Math.floor(Date.now() / 1000),
        srs: 'EPSG:4326',
        locationType: 'geojson',
        location: '{"type":"Point","coordinates":[-122.4194,37.7749]}',
        recipeType: [],
        recipePayload: [],
        mediaType: [],
        mediaData: [],
        uid: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        attester: '0x1234567890123456789012345678901234567890',
        chain: 'sepolia',
        chainId: 11155111,
        txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        blockNumber: 12345678,
        revocable: true,
        revoked: true,
      };

      const mockResult = {
        isValid: false,
        signerAddress: '0x1234567890123456789012345678901234567890',
        attestation: revokedProof,
        reason: 'Proof has been revoked',
      };

      (OnchainRegistrar.prototype.verifyOnchainLocationAttestation as jest.Mock).mockResolvedValue(
        mockResult
      );

      const result = await sdk.verifyOnchainLocationAttestation(revokedProof);
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Proof has been revoked');
    });

    test('should verify an expired proof', async () => {
      const expiredProof: OnchainLocationAttestation = {
        eventTimestamp: Math.floor(Date.now() / 1000) - 86400,
        srs: 'EPSG:4326',
        locationType: 'geojson',
        location: '{"type":"Point","coordinates":[-122.4194,37.7749]}',
        recipeType: [],
        recipePayload: [],
        mediaType: [],
        mediaData: [],
        uid: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        attester: '0x1234567890123456789012345678901234567890',
        chain: 'sepolia',
        chainId: 11155111,
        txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        blockNumber: 12345678,
        revocable: true,
        revoked: false,
        expirationTime: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
      };

      const mockResult = {
        isValid: false,
        signerAddress: '0x1234567890123456789012345678901234567890',
        attestation: expiredProof,
        reason: 'Proof has expired',
      };

      (OnchainRegistrar.prototype.verifyOnchainLocationAttestation as jest.Mock).mockResolvedValue(
        mockResult
      );

      const result = await sdk.verifyOnchainLocationAttestation(expiredProof);
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Proof has expired');
    });

    test('should handle non-existent proof', async () => {
      const nonExistentProof: OnchainLocationAttestation = {
        eventTimestamp: Math.floor(Date.now() / 1000),
        srs: 'EPSG:4326',
        locationType: 'geojson',
        location: '{"type":"Point","coordinates":[-122.4194,37.7749]}',
        recipeType: [],
        recipePayload: [],
        mediaType: [],
        mediaData: [],
        uid: '0x0000000000000000000000000000000000000000000000000000000000000000',
        attester: '0x0000000000000000000000000000000000000000',
        chain: 'sepolia',
        chainId: 11155111,
        txHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        blockNumber: 0,
        revocable: true,
        revoked: false,
      };

      const mockResult = {
        isValid: false,
        signerAddress: undefined,
        attestation: nonExistentProof,
        reason: 'Proof does not exist on chain',
      };

      (OnchainRegistrar.prototype.verifyOnchainLocationAttestation as jest.Mock).mockResolvedValue(
        mockResult
      );

      const result = await sdk.verifyOnchainLocationAttestation(nonExistentProof);
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('Proof does not exist on chain');
    });

    test('should verify proof with different chain configurations', async () => {
      // Create a new SDK instance for different chain
      const baseSdk = new AstralSDK({
        provider: mockProvider,
        signer: mockSigner,
        defaultChain: 'base',
        debug: true,
      });

      const baseProof: OnchainLocationAttestation = {
        eventTimestamp: Math.floor(Date.now() / 1000),
        srs: 'EPSG:4326',
        locationType: 'geojson',
        location: '{"type":"Point","coordinates":[-122.4194,37.7749]}',
        recipeType: [],
        recipePayload: [],
        mediaType: [],
        mediaData: [],
        uid: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        attester: '0x1234567890123456789012345678901234567890',
        chain: 'base',
        chainId: 8453,
        txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        blockNumber: 12345678,
        revocable: true,
        revoked: false,
      };

      const mockResult = {
        isValid: true,
        signerAddress: '0x1234567890123456789012345678901234567890',
        attestation: baseProof,
      };

      (OnchainRegistrar.prototype.verifyOnchainLocationAttestation as jest.Mock).mockResolvedValue(
        mockResult
      );

      const result = await baseSdk.verifyOnchainLocationAttestation(baseProof);
      expect(result.isValid).toBe(true);
      expect(result.attestation).toBeDefined();
      // Type guard to ensure it's an OnchainLocationAttestation
      if (result.attestation && 'chain' in result.attestation) {
        expect(result.attestation.chain).toBe('base');
        expect(result.attestation.chainId).toBe(8453);
      }
    });

    test('should handle verification errors gracefully', async () => {
      const mockProof: OnchainLocationAttestation = {
        eventTimestamp: Math.floor(Date.now() / 1000),
        srs: 'EPSG:4326',
        locationType: 'geojson',
        location: '{"type":"Point","coordinates":[-122.4194,37.7749]}',
        recipeType: [],
        recipePayload: [],
        mediaType: [],
        mediaData: [],
        uid: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        attester: '0x1234567890123456789012345678901234567890',
        chain: 'sepolia',
        chainId: 11155111,
        txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        blockNumber: 12345678,
        revocable: true,
        revoked: false,
      };

      // The SDK doesn't throw, it returns a result with isValid: false and reason
      const mockResult = {
        isValid: false,
        attestation: mockProof,
        reason: 'RPC connection failed',
      };

      (OnchainRegistrar.prototype.verifyOnchainLocationAttestation as jest.Mock).mockResolvedValue(
        mockResult
      );

      const result = await sdk.verifyOnchainLocationAttestation(mockProof);
      expect(result.isValid).toBe(false);
      expect(result.reason).toBe('RPC connection failed');
    });
  });

  describe('revokeOnchainLocationAttestation', () => {
    test('should revoke an onchain location proof', async () => {
      // Mock proof to revoke
      const mockProof: OnchainLocationAttestation = {
        eventTimestamp: Math.floor(Date.now() / 1000),
        srs: 'EPSG:4326',
        locationType: 'geojson',
        location: '{"type":"Point","coordinates":[-122.4194,37.7749]}',
        recipeType: [],
        recipePayload: [],
        mediaType: [],
        mediaData: [],
        uid: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        attester: '0x1234567890123456789012345678901234567890',
        chain: 'sepolia',
        chainId: 11155111,
        txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        blockNumber: 12345678,
        revocable: true,
        revoked: false,
      };

      // Mock transaction response
      const mockTxResponse = {
        hash: '0x9876543210abcdef9876543210abcdef9876543210abcdef9876543210abcdef',
      };

      // Setup the mock to return our response
      (OnchainRegistrar.prototype.revokeOnchainLocationAttestation as jest.Mock).mockResolvedValue(
        mockTxResponse
      );

      // Call the method
      const result = await sdk.revokeOnchainLocationAttestation(mockProof);

      // Verify revokeOnchainLocationAttestation was called with the proof
      expect(OnchainRegistrar.prototype.revokeOnchainLocationAttestation).toHaveBeenCalledWith(
        mockProof
      );

      // Verify the result is the mock response
      expect(result).toBe(mockTxResponse);
    });

    test('should throw error if proof is not revocable', async () => {
      // Mock proof that is not revocable
      const nonRevocableProof: OnchainLocationAttestation = {
        eventTimestamp: Math.floor(Date.now() / 1000),
        srs: 'EPSG:4326',
        locationType: 'geojson',
        location: '{"type":"Point","coordinates":[-122.4194,37.7749]}',
        recipeType: [],
        recipePayload: [],
        mediaType: [],
        mediaData: [],
        uid: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        attester: '0x1234567890123456789012345678901234567890',
        chain: 'sepolia',
        chainId: 11155111,
        txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        blockNumber: 12345678,
        revocable: false,
        revoked: false,
      };

      // Expect the method to throw
      await expect(sdk.revokeOnchainLocationAttestation(nonRevocableProof)).rejects.toThrow(
        ValidationError
      );

      // Verify the mock wasn't called
      expect(OnchainRegistrar.prototype.revokeOnchainLocationAttestation).not.toHaveBeenCalled();
    });

    test('should throw error if proof is already revoked', async () => {
      // Mock proof that is already revoked
      const revokedProof: OnchainLocationAttestation = {
        eventTimestamp: Math.floor(Date.now() / 1000),
        srs: 'EPSG:4326',
        locationType: 'geojson',
        location: '{"type":"Point","coordinates":[-122.4194,37.7749]}',
        recipeType: [],
        recipePayload: [],
        mediaType: [],
        mediaData: [],
        uid: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        attester: '0x1234567890123456789012345678901234567890',
        chain: 'sepolia',
        chainId: 11155111,
        txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        blockNumber: 12345678,
        revocable: true,
        revoked: true,
      };

      // Expect the method to throw
      await expect(sdk.revokeOnchainLocationAttestation(revokedProof)).rejects.toThrow(
        ValidationError
      );

      // Verify the mock wasn't called
      expect(OnchainRegistrar.prototype.revokeOnchainLocationAttestation).not.toHaveBeenCalled();
    });

    test('should revoke proof successfully', async () => {
      const mockProof: OnchainLocationAttestation = {
        eventTimestamp: Math.floor(Date.now() / 1000),
        srs: 'EPSG:4326',
        locationType: 'geojson',
        location: '{"type":"Point","coordinates":[-122.4194,37.7749]}',
        recipeType: [],
        recipePayload: [],
        mediaType: [],
        mediaData: [],
        uid: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        attester: '0x1234567890123456789012345678901234567890',
        chain: 'sepolia',
        chainId: 11155111,
        txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        blockNumber: 12345678,
        revocable: true,
        revoked: false,
      };

      const mockTxResponse = {
        hash: '0x9876543210abcdef9876543210abcdef9876543210abcdef9876543210abcdef',
        wait: jest.fn().mockResolvedValue({
          blockNumber: 12345679,
          transactionHash: '0x9876543210abcdef9876543210abcdef9876543210abcdef9876543210abcdef',
        }),
      };

      (OnchainRegistrar.prototype.revokeOnchainLocationAttestation as jest.Mock).mockResolvedValue(
        mockTxResponse
      );

      const result = await sdk.revokeOnchainLocationAttestation(mockProof);

      // Verify the method was called with the proof
      expect(OnchainRegistrar.prototype.revokeOnchainLocationAttestation).toHaveBeenCalledWith(
        mockProof
      );
      expect(result).toBe(mockTxResponse);
    });

    test('should fail to revoke from wrong signer', async () => {
      const mockProof: OnchainLocationAttestation = {
        eventTimestamp: Math.floor(Date.now() / 1000),
        srs: 'EPSG:4326',
        locationType: 'geojson',
        location: '{"type":"Point","coordinates":[-122.4194,37.7749]}',
        recipeType: [],
        recipePayload: [],
        mediaType: [],
        mediaData: [],
        uid: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        attester: '0x9999999999999999999999999999999999999999', // Different attester
        chain: 'sepolia',
        chainId: 11155111,
        txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        blockNumber: 12345678,
        revocable: true,
        revoked: false,
      };

      const error = new ValidationError('Only the original attester can revoke this proof');
      (OnchainRegistrar.prototype.revokeOnchainLocationAttestation as jest.Mock).mockRejectedValue(
        error
      );

      await expect(sdk.revokeOnchainLocationAttestation(mockProof)).rejects.toThrow(
        ValidationError
      );
    });

    test('should handle network errors during revocation', async () => {
      const mockProof: OnchainLocationAttestation = {
        eventTimestamp: Math.floor(Date.now() / 1000),
        srs: 'EPSG:4326',
        locationType: 'geojson',
        location: '{"type":"Point","coordinates":[-122.4194,37.7749]}',
        recipeType: [],
        recipePayload: [],
        mediaType: [],
        mediaData: [],
        uid: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        attester: '0x1234567890123456789012345678901234567890',
        chain: 'sepolia',
        chainId: 11155111,
        txHash: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
        blockNumber: 12345678,
        revocable: true,
        revoked: false,
      };

      const networkError = new NetworkError('Transaction failed: insufficient gas');
      (OnchainRegistrar.prototype.revokeOnchainLocationAttestation as jest.Mock).mockRejectedValue(
        networkError
      );

      await expect(sdk.revokeOnchainLocationAttestation(mockProof)).rejects.toThrow(NetworkError);
    });
  });
});
