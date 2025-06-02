/**
 * Tests for the onchain workflow functionality in AstralSDK.
 *
 * These tests verify that the AstralSDK properly delegates to the
 * OnchainRegistrar for registering, verifying, and revoking onchain attestations.
 */

import { AstralSDK } from '../../src/core/AstralSDK';
import { OnchainRegistrar } from '../../src/eas/OnchainRegistrar';
import { LocationProofInput, OnchainLocationProof } from '../../src/core/types';
import { ValidationError } from '../../src/core/errors';

// Mock dependencies
jest.mock('../../src/eas/OnchainRegistrar');

describe('AstralSDK - Onchain Workflow', () => {
  let sdk: AstralSDK;
  let mockProvider: { getNetwork: jest.Mock };
  let mockSigner: { getAddress: jest.Mock; provider: unknown };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock provider and signer
    mockProvider = { getNetwork: jest.fn().mockResolvedValue({ chainId: 11155111 }) };
    mockSigner = {
      getAddress: jest.fn().mockResolvedValue('0x1234567890123456789012345678901234567890'),
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

  describe('createOnchainLocationProof', () => {
    test('should build and register a location proof onchain', async () => {
      // Create a spy on buildLocationProof
      const buildSpy = jest.spyOn(sdk, 'buildLocationProof');

      // Mock OnchainRegistrar.registerOnchainLocationProof
      const mockProof: OnchainLocationProof = {
        eventTimestamp: Math.floor(Date.now() / 1000),
        srs: 'EPSG:4326',
        locationType: 'geojson',
        location: '{"type":"Point","coordinates":[-122.4194,37.7749]}',
        recipeTypes: [],
        recipePayloads: [],
        mediaTypes: [],
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
      (OnchainRegistrar.prototype.registerOnchainLocationProof as jest.Mock).mockResolvedValue(
        mockProof
      );

      // Create input for the test
      const input: LocationProofInput = {
        location: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749],
        },
        locationType: 'geojson',
        memo: 'Test onchain proof',
      };

      // Call the method
      const result = await sdk.createOnchainLocationProof(input);

      // Verify buildLocationProof was called with the input
      expect(buildSpy).toHaveBeenCalledWith(input);

      // Verify registerOnchainLocationProof was called
      expect(OnchainRegistrar.prototype.registerOnchainLocationProof).toHaveBeenCalled();

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
      const input: LocationProofInput = {
        location: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749],
        },
        locationType: 'geojson',
      };

      // Expect the method to throw
      await expect(sdkWithoutProvider.createOnchainLocationProof(input)).rejects.toThrow(
        ValidationError
      );
    });
  });

  describe('verifyOnchainLocationProof', () => {
    test('should verify an onchain location proof', async () => {
      // Mock proof to verify
      const mockProof: OnchainLocationProof = {
        eventTimestamp: Math.floor(Date.now() / 1000),
        srs: 'EPSG:4326',
        locationType: 'geojson',
        location: '{"type":"Point","coordinates":[-122.4194,37.7749]}',
        recipeTypes: [],
        recipePayloads: [],
        mediaTypes: [],
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
        proof: mockProof,
      };

      // Setup the mock to return our result
      (OnchainRegistrar.prototype.verifyOnchainLocationProof as jest.Mock).mockResolvedValue(
        mockResult
      );

      // Call the method
      const result = await sdk.verifyOnchainLocationProof(mockProof);

      // Verify verifyOnchainLocationProof was called with the proof
      expect(OnchainRegistrar.prototype.verifyOnchainLocationProof).toHaveBeenCalledWith(mockProof);

      // Verify the result matches our mock
      expect(result).toBe(mockResult);
      expect(result.isValid).toBe(true);
    });
  });

  describe('revokeOnchainLocationProof', () => {
    test('should revoke an onchain location proof', async () => {
      // Mock proof to revoke
      const mockProof: OnchainLocationProof = {
        eventTimestamp: Math.floor(Date.now() / 1000),
        srs: 'EPSG:4326',
        locationType: 'geojson',
        location: '{"type":"Point","coordinates":[-122.4194,37.7749]}',
        recipeTypes: [],
        recipePayloads: [],
        mediaTypes: [],
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
      (OnchainRegistrar.prototype.revokeOnchainLocationProof as jest.Mock).mockResolvedValue(
        mockTxResponse
      );

      // Call the method
      const result = await sdk.revokeOnchainLocationProof(mockProof);

      // Verify revokeOnchainLocationProof was called with the proof
      expect(OnchainRegistrar.prototype.revokeOnchainLocationProof).toHaveBeenCalledWith(mockProof);

      // Verify the result is the mock response
      expect(result).toBe(mockTxResponse);
    });

    test('should throw error if proof is not revocable', async () => {
      // Mock proof that is not revocable
      const nonRevocableProof: OnchainLocationProof = {
        eventTimestamp: Math.floor(Date.now() / 1000),
        srs: 'EPSG:4326',
        locationType: 'geojson',
        location: '{"type":"Point","coordinates":[-122.4194,37.7749]}',
        recipeTypes: [],
        recipePayloads: [],
        mediaTypes: [],
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
      await expect(sdk.revokeOnchainLocationProof(nonRevocableProof)).rejects.toThrow(
        ValidationError
      );

      // Verify the mock wasn't called
      expect(OnchainRegistrar.prototype.revokeOnchainLocationProof).not.toHaveBeenCalled();
    });

    test('should throw error if proof is already revoked', async () => {
      // Mock proof that is already revoked
      const revokedProof: OnchainLocationProof = {
        eventTimestamp: Math.floor(Date.now() / 1000),
        srs: 'EPSG:4326',
        locationType: 'geojson',
        location: '{"type":"Point","coordinates":[-122.4194,37.7749]}',
        recipeTypes: [],
        recipePayloads: [],
        mediaTypes: [],
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
      await expect(sdk.revokeOnchainLocationProof(revokedProof)).rejects.toThrow(ValidationError);

      // Verify the mock wasn't called
      expect(OnchainRegistrar.prototype.revokeOnchainLocationProof).not.toHaveBeenCalled();
    });
  });
});
