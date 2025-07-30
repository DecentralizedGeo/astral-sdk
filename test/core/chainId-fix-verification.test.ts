// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

/**
 * Simple test to verify chainId configuration fix for issue #37
 */

import { jest } from '@jest/globals';
import { AstralSDK } from '../../src/core/AstralSDK';
import { OffchainSigner } from '../../src/eas/OffchainSigner';
import { Wallet } from 'ethers';

// Mock the EAS SDK
jest.mock('@ethereum-attestation-service/eas-sdk', () => ({
  EAS: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
  })),
  Offchain: jest.fn().mockImplementation((config: unknown) => {
    // Capture the chainId that was passed
    const chainId = Number((config as { chainId: bigint }).chainId);
    return {
      signOffchainAttestation: () =>
        Promise.resolve({
          uid: `0x${chainId.toString(16).padStart(64, '0')}`,
          signature: { v: 27, r: '0xmockr', s: '0xmocks' },
        }),
    };
  }),
  OffchainAttestationVersion: { Version2: 2 },
  SchemaEncoder: jest.fn().mockImplementation(() => ({
    encodeData: () => '0xmockencodeddata',
  })),
}));

describe('Issue #37 - ChainId Configuration Fix Verification', () => {
  let mockSigner: Wallet;

  beforeEach(() => {
    mockSigner = new Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
  });

  test('AstralSDK should use chainId when provided in config', () => {
    // Test Celo mainnet chainId
    const sdk = new AstralSDK({
      chainId: 42220,
      signer: mockSigner,
    });

    // Access private property to verify the offchain signer is using correct chainId
    const privateSdk = sdk as unknown as { offchainSigner?: { chainId: number } };
    expect(privateSdk.offchainSigner).toBeDefined();

    // Verify the signer was initialized with Celo chainId
    const offchainSigner = privateSdk.offchainSigner as { chainId: number };
    expect(offchainSigner.chainId).toBe(42220);
  });

  test('AstralSDK should prioritize chainId over defaultChain', () => {
    // Provide both chainId and defaultChain
    const sdk = new AstralSDK({
      chainId: 42220, // Celo
      defaultChain: 'sepolia',
      signer: mockSigner,
    });

    // Verify Celo chainId is used, not Sepolia
    const privateSdk = sdk as unknown as { offchainSigner?: { chainId: number } };
    const offchainSigner = privateSdk.offchainSigner as { chainId: number };
    expect(offchainSigner.chainId).toBe(42220);
  });

  test('AstralSDK should log warning when both chainId and defaultChain are provided in debug mode', () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

    // Create SDK with both chainId and defaultChain in debug mode
    new AstralSDK({
      chainId: 42220, // Celo
      defaultChain: 'sepolia',
      signer: mockSigner,
      debug: true,
    });

    // Verify warning was logged
    expect(consoleSpy).toHaveBeenCalledWith(
      'Both chainId (42220) and defaultChain (sepolia) provided. Using chainId.'
    );

    consoleSpy.mockRestore();
  });

  test('OffchainSigner should accept chainId directly', () => {
    // Test each supported chain
    const chains = [
      { chainId: 11155111, name: 'Sepolia' },
      { chainId: 42220, name: 'Celo' },
      { chainId: 42161, name: 'Arbitrum' },
      { chainId: 8453, name: 'Base' },
    ];

    for (const { chainId } of chains) {
      const signer = new OffchainSigner({
        signer: mockSigner,
        chainId,
      });

      const privateSigner = signer as unknown as { chainId: number };
      expect(privateSigner.chainId).toBe(chainId);
    }
  });

  test('Error handling for unsupported chainId', () => {
    // This should throw an error for unsupported chain
    expect(() => {
      new AstralSDK({
        chainId: 9999,
        signer: mockSigner,
      });
    }).toThrow();
  });
});
