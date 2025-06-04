// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

/**
 * Real EAS SDK Integration Tests
 *
 * These tests use the actual EAS SDK logic for UID generation, signature creation,
 * and schema encoding, while mocking only the blockchain provider/signer interactions
 * to prevent real transactions.
 *
 * Purpose: Verify that our SDK properly integrates with the EAS SDK and that
 * offchain and onchain UIDs are actually different when generated using real EAS logic.
 */

import { AstralSDK } from '../../src/core/AstralSDK';
import { LocationProofInput } from '../../src/core/types';
import { EAS, SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';
import { ethers } from 'ethers';

describe('Real EAS SDK Integration Tests', () => {
  let sdk: AstralSDK;
  let mockProvider: ethers.JsonRpcProvider;
  let mockSigner: ethers.Wallet;
  let realPrivateKey: string;

  beforeAll(() => {
    // Use a deterministic private key for testing
    realPrivateKey = '0x1234567890123456789012345678901234567890123456789012345678901234';
  });

  beforeEach(() => {
    // Create a real wallet with our test private key
    mockSigner = new ethers.Wallet(realPrivateKey);

    // Create a mock provider that won't make real network calls
    mockProvider = {
      getNetwork: jest.fn().mockResolvedValue({
        chainId: 11155111,
        name: 'sepolia',
      }),
      getBlockNumber: jest.fn().mockResolvedValue(12345678),
      getTransactionCount: jest.fn().mockResolvedValue(0),
      estimateGas: jest.fn().mockResolvedValue(BigInt(21000)),
      getGasPrice: jest.fn().mockResolvedValue(BigInt(1000000000)),
      getBalance: jest.fn().mockResolvedValue(BigInt('1000000000000000000')),
      // Mock sendTransaction to prevent real transactions
      sendTransaction: jest.fn().mockResolvedValue({
        hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        wait: jest.fn().mockResolvedValue({
          blockNumber: 12345679,
          transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        }),
      }),
      call: jest
        .fn()
        .mockResolvedValue('0x0000000000000000000000000000000000000000000000000000000000000001'),
      // Add the provider to the signer
      _networkPromise: Promise.resolve({ chainId: 11155111, name: 'sepolia' }),
    } as unknown as ethers.JsonRpcProvider;

    // Connect the signer to the mock provider
    mockSigner = mockSigner.connect(mockProvider);

    // Create SDK instance with real signer but mock provider
    sdk = new AstralSDK({
      provider: mockProvider,
      signer: mockSigner,
      defaultChain: 'sepolia',
      debug: true,
    });
  });

  describe('Real Offchain UID Generation', () => {
    test('should generate real offchain UIDs using EAS SDK', async () => {
      const input: LocationProofInput = {
        location: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749],
        },
        locationType: 'geojson',
        memo: 'Real EAS SDK test - offchain',
      };

      // Create and sign an offchain proof using real EAS SDK logic
      const unsignedProof = await sdk.buildLocationProof(input);
      const signedProof = await sdk.signOffchainLocationProof(unsignedProof);

      // Verify the UID is a real hex string, not a mock value
      expect(signedProof.uid).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(signedProof.uid).not.toBe(
        '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
      );

      // Verify the signature is real (EAS SDK returns JSON stringified signature object)
      expect(signedProof.signature).toContain('"r":"0x');
      expect(signedProof.signature).toContain('"s":"0x');
      expect(signedProof.signature).toContain('"v":');
      expect(signedProof.signature).not.toBe('0x1234567890abcdef...');

      // Verify the signer address matches our test wallet
      expect(signedProof.signer).toBe(await mockSigner.getAddress());

      console.log('Real Offchain UID:', signedProof.uid);
      console.log('Real Signature:', signedProof.signature);
    });

    test('should generate different UIDs for different proofs', async () => {
      const input1: LocationProofInput = {
        location: { type: 'Point', coordinates: [-122.4194, 37.7749] },
        locationType: 'geojson',
        memo: 'First proof',
      };

      const input2: LocationProofInput = {
        location: { type: 'Point', coordinates: [-122.4195, 37.775] },
        locationType: 'geojson',
        memo: 'Second proof',
      };

      const proof1 = await sdk.signOffchainLocationProof(await sdk.buildLocationProof(input1));
      const proof2 = await sdk.signOffchainLocationProof(await sdk.buildLocationProof(input2));

      expect(proof1.uid).not.toBe(proof2.uid);
      expect(proof1.signature).not.toBe(proof2.signature);
    });

    test('should verify real offchain signatures', async () => {
      const input: LocationProofInput = {
        location: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749],
        },
        locationType: 'geojson',
        memo: 'Verification test',
      };

      const unsignedProof = await sdk.buildLocationProof(input);
      const signedProof = await sdk.signOffchainLocationProof(unsignedProof);

      // Verify the proof using real EAS SDK verification
      const verificationResult = await sdk.verifyOffchainLocationProof(signedProof);

      expect(verificationResult.isValid).toBe(true);
      expect(verificationResult.signerAddress).toBe(await mockSigner.getAddress());
    });
  });

  describe('Real Schema Encoding/Decoding', () => {
    test('should use real EAS SchemaEncoder for location proofs', async () => {
      const input: LocationProofInput = {
        location: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749],
        },
        locationType: 'geojson',
        memo: 'Schema encoding test',
        media: [
          {
            mediaType: 'image/jpeg',
            data: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
          },
        ],
      };

      // Build the proof which should use real schema encoding
      const proof = await sdk.buildLocationProof(input);

      // The proof should have properly encoded data
      expect(proof.location).toBe('{"type":"Point","coordinates":[-122.4194,37.7749]}');
      expect(proof.locationType).toBe('geojson');
      expect(proof.mediaType).toEqual(['image/jpeg']);
      expect(proof.mediaData).toEqual([
        'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k=',
      ]);

      // Create a real SchemaEncoder instance to verify our encoding
      const schemaEncoder = new SchemaEncoder(
        'string srs,string locationType,string location,string[] recipeType,string[] recipePayload,string[] mediaType,string[] mediaData,string memo,bool revocable'
      );

      // Encode the same data with the real EAS SchemaEncoder
      const realEncodedData = schemaEncoder.encodeData([
        { name: 'srs', value: proof.srs, type: 'string' },
        { name: 'locationType', value: proof.locationType, type: 'string' },
        { name: 'location', value: proof.location, type: 'string' },
        { name: 'recipeType', value: proof.recipeType, type: 'string[]' },
        { name: 'recipePayload', value: proof.recipePayload, type: 'string[]' },
        { name: 'mediaType', value: proof.mediaType, type: 'string[]' },
        { name: 'mediaData', value: proof.mediaData, type: 'string[]' },
        { name: 'memo', value: proof.memo || '', type: 'string' },
        { name: 'revocable', value: proof.revocable || false, type: 'bool' },
      ]);

      // The encoded data should be valid hex
      expect(realEncodedData).toMatch(/^0x[a-fA-F0-9]+$/);

      console.log('Real Schema Encoded Data Length:', realEncodedData.length);
    });
  });

  describe('Offchain vs Onchain UID Differences', () => {
    test('should generate different UIDs for offchain vs onchain workflows with same data', async () => {
      const input: LocationProofInput = {
        location: {
          type: 'Point',
          coordinates: [-122.4194, 37.7749],
        },
        locationType: 'geojson',
        memo: 'UID comparison test',
      };

      // Create offchain proof with real EAS SDK
      const unsignedProof = await sdk.buildLocationProof(input);
      const offchainProof = await sdk.signOffchainLocationProof(unsignedProof);

      // Calculate what the onchain UID would be using real EAS logic
      const schemaUID = '0x853a55f39e2d1bf1e6731ae7148976fbfb0db06289d0de0c46d60d69dad9248a';
      const schemaEncoder = new SchemaEncoder(
        'string srs,string locationType,string location,string[] recipeType,string[] recipePayload,string[] mediaType,string[] mediaData,string memo,bool revocable'
      );

      const encodedData = schemaEncoder.encodeData([
        { name: 'srs', value: unsignedProof.srs, type: 'string' },
        { name: 'locationType', value: unsignedProof.locationType, type: 'string' },
        { name: 'location', value: unsignedProof.location, type: 'string' },
        { name: 'recipeType', value: unsignedProof.recipeType, type: 'string[]' },
        { name: 'recipePayload', value: unsignedProof.recipePayload, type: 'string[]' },
        { name: 'mediaType', value: unsignedProof.mediaType, type: 'string[]' },
        { name: 'mediaData', value: unsignedProof.mediaData, type: 'string[]' },
        { name: 'memo', value: unsignedProof.memo || '', type: 'string' },
        { name: 'revocable', value: unsignedProof.revocable || false, type: 'bool' },
      ]);

      // Calculate the onchain UID that would be generated using static method
      const onchainUID = EAS.getAttestationUID(
        schemaUID,
        await mockSigner.getAddress(), // recipient
        await mockSigner.getAddress(), // attester
        BigInt(unsignedProof.eventTimestamp), // time
        BigInt(0), // expirationTime
        true, // revocable
        '0x0000000000000000000000000000000000000000000000000000000000000000', // refUID
        encodedData,
        0 // bump
      );

      // Verify that offchain and onchain UIDs are different
      expect(offchainProof.uid).not.toBe(onchainUID);
      console.log('Offchain UID:', offchainProof.uid);
      console.log('Calculated Onchain UID:', onchainUID);

      // Both should be valid hex strings
      expect(offchainProof.uid).toMatch(/^0x[a-fA-F0-9]{64}$/);
      expect(onchainUID).toMatch(/^0x[a-fA-F0-9]{64}$/);
    });
  });

  describe('Real EAS SDK Error Handling', () => {
    test('should handle real EAS SDK validation errors', async () => {
      // Test with invalid schema encoding - this should trigger real EAS SDK validation
      const invalidInput: LocationProofInput = {
        location: '', // Invalid empty location
        locationType: 'geojson',
        memo: 'Error handling test',
      };

      await expect(sdk.buildLocationProof(invalidInput)).rejects.toThrow();
    });

    test('should handle signature verification failures with real EAS SDK', async () => {
      const input: LocationProofInput = {
        location: { type: 'Point', coordinates: [-122.4194, 37.7749] },
        locationType: 'geojson',
        memo: 'Signature failure test',
      };

      const unsignedProof = await sdk.buildLocationProof(input);
      const signedProof = await sdk.signOffchainLocationProof(unsignedProof);

      // Tamper with the signature to make it invalid
      const tamperedProof = {
        ...signedProof,
        signature: '0x' + '0'.repeat(130), // Invalid signature
      };

      const verificationResult = await sdk.verifyOffchainLocationProof(tamperedProof);
      expect(verificationResult.isValid).toBe(false);
    });
  });
});
