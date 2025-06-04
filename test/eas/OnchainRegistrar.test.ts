// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

/**
 * Tests for OnchainRegistrar
 */

import { Wallet } from 'ethers';
import { OnchainRegistrar } from '../../src/eas/OnchainRegistrar';
import {
  UnsignedLocationProof,
  OnchainLocationProof,
  OnchainProofOptions,
  VerificationError,
} from '../../src/core/types';
import { ValidationError, RegistrationError } from '../../src/core/errors';

// Mock the EAS SDK
jest.mock('@ethereum-attestation-service/eas-sdk', () => {
  return {
    EAS: jest.fn().mockImplementation(() => ({
      connect: jest.fn(),
      attest: jest.fn().mockImplementation(() => ({
        hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        wait: jest
          .fn()
          .mockResolvedValue('0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'), // Returns UID
        receipt: {
          hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          blockNumber: 12345678,
          status: 1,
        },
      })),
      getAttestation: jest.fn().mockImplementation(uid => {
        if (uid === '0x0000000000000000000000000000000000000000000000000000000000000000') {
          return null;
        }
        if (uid === '0xrevoked000000000000000000000000000000000000000000000000000000000') {
          return {
            uid,
            schema: '0xba4171c92572b1e4f241d044c32cdf083be9fd946b8766977558ca6378c824e2',
            attester: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
            recipient: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
            revoked: true,
            expirationTime: BigInt(0),
            time: BigInt(1612345678),
            data: '0x1234567890abcdef',
          };
        }
        if (uid === '0xexpired00000000000000000000000000000000000000000000000000000000000') {
          return {
            uid,
            schema: '0xba4171c92572b1e4f241d044c32cdf083be9fd946b8766977558ca6378c824e2',
            attester: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
            recipient: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
            revoked: false,
            expirationTime: BigInt(1612345678), // Expired time
            time: BigInt(1612345678),
            data: '0x1234567890abcdef',
          };
        }
        return {
          uid,
          schema: '0xba4171c92572b1e4f241d044c32cdf083be9fd946b8766977558ca6378c824e2',
          attester: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
          recipient: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
          revoked: false,
          expirationTime: BigInt(0),
          time: BigInt(1612345678),
          data: '0x1234567890abcdef',
        };
      }),
      revoke: jest.fn().mockImplementation(() => ({
        hash: '0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456',
        wait: jest
          .fn()
          .mockResolvedValue('0xrevoke7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'), // Returns UID
        receipt: {
          hash: '0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456',
          blockNumber: 12345679,
          status: 1,
        },
      })),
    })),
    SchemaEncoder: jest.fn().mockImplementation(() => ({
      encodeData: jest.fn().mockReturnValue('0x1234567890abcdef'),
    })),
  };
});

// Mock the chains module
jest.mock('../../src/eas/chains', () => ({
  getSchemaString: jest
    .fn()
    .mockReturnValue(
      'uint256 eventTimestamp,string srs,string locationType,string location,string[] recipeType,bytes[] recipePayload,string[] mediaType,string[] mediaData,string memo'
    ),
  getChainConfig: jest.fn().mockImplementation((chainId, version, chainName) => {
    if (chainName === 'sepolia' || chainId === 11155111) {
      return {
        11155111: {
          chain: 'sepolia',
          deploymentBlock: 6269763,
          rpcUrl: 'https://sepolia.infura.io/v3/',
          easContractAddress: '0xC2679fBD37d54388Ce493F1DB75320D236e1815e',
          schemaUID: '0xba4171c92572b1e4f241d044c32cdf083be9fd946b8766977558ca6378c824e2',
        },
      };
    }
    return {
      42220: {
        chain: 'celo',
        deploymentBlock: 26901063,
        rpcUrl: 'https://celo-mainnet.infura.io/v3/',
        easContractAddress: '0x72E1d8ccf5299fb36fEfD8CC4394B8ef7e98Af92',
        schemaUID: '0xba4171c92572b1e4f241d044c32cdf083be9fd946b8766977558ca6378c824e2',
      },
    };
  }),
  getChainNameById: jest.fn().mockImplementation(chainId => {
    if (chainId === 11155111) return 'sepolia';
    if (chainId === 42220) return 'celo';
    return 'unknown';
  }),
  getSchemaUID: jest
    .fn()
    .mockImplementation(() => '0xba4171c92572b1e4f241d044c32cdf083be9fd946b8766977558ca6378c824e2'),
}));

// Mock the ethers network call
jest.mock('ethers', () => {
  const originalModule = jest.requireActual('ethers');
  return {
    ...originalModule,
    Provider: jest.fn().mockImplementation(() => ({
      getNetwork: jest.fn().mockResolvedValue({ chainId: BigInt(11155111) }),
    })),
    Wallet: originalModule.Wallet,
  };
});

// Sample data for testing
const testWallet = new Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
const testUnsignedProof: UnsignedLocationProof = {
  eventTimestamp: 1612345678,
  srs: 'EPSG:4326',
  locationType: 'geojson',
  location: '{"type":"Point","coordinates":[12.34,56.78]}',
  recipeType: [],
  recipePayload: [],
  mediaType: [],
  mediaData: [],
  memo: 'Test location proof',
};

// Sample onchain proof for testing
const testOnchainProof: OnchainLocationProof = {
  ...testUnsignedProof,
  uid: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  attester: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
  chain: 'sepolia',
  chainId: 11155111,
  txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
  blockNumber: 12345678,
  revocable: true,
  revoked: false,
};

// Revoked proof for testing
const revokedProof: OnchainLocationProof = {
  ...testOnchainProof,
  uid: '0xrevoked000000000000000000000000000000000000000000000000000000000',
  revoked: true,
};

// Expired proof for testing
const expiredProof: OnchainLocationProof = {
  ...testOnchainProof,
  uid: '0xexpired00000000000000000000000000000000000000000000000000000000000',
  expirationTime: 1612345678, // Expired
};

// Type for accessing private properties
interface PrivateOnchainRegistrar {
  eas: {
    connect: (providerOrSigner: unknown) => void;
    attest: (params: unknown) => Promise<{
      hash: string;
      wait: () => Promise<string>; // Returns UID
      receipt: { hash: string; blockNumber: number; status: number };
    }>;
    getAttestation: (uid: string) => Promise<unknown | null>;
    revoke: (params: unknown) => Promise<{
      hash: string;
      wait: () => Promise<string>; // Returns UID
      receipt: { hash: string; blockNumber: number; status: number };
    }>;
  };
  schemaEncoder: {
    encodeData: (items: unknown) => string;
  };
}

describe('OnchainRegistrar', () => {
  let registrar: OnchainRegistrar;

  beforeEach(() => {
    // Create a new registrar for each test
    registrar = new OnchainRegistrar({
      signer: testWallet,
      chain: 'sepolia',
    });

    // Mock getAddress to always return the same address
    (testWallet.getAddress as jest.Mock) = jest
      .fn()
      .mockResolvedValue('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');

    // Ensure fields are initialized by accessing the private properties
    const privateRegistrar = registrar as unknown as PrivateOnchainRegistrar;
    privateRegistrar.eas = privateRegistrar.eas || {
      connect: jest.fn(),
      attest: jest.fn().mockImplementation(() => ({
        hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        wait: jest
          .fn()
          .mockResolvedValue('0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890'), // Returns UID
        receipt: {
          hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          blockNumber: 12345678,
          status: 1,
        },
      })),
      getAttestation: jest.fn().mockImplementation(uid => {
        if (uid === '0x0000000000000000000000000000000000000000000000000000000000000000') {
          return null;
        }
        if (uid === '0xrevoked000000000000000000000000000000000000000000000000000000000') {
          return {
            uid,
            schema: '0xba4171c92572b1e4f241d044c32cdf083be9fd946b8766977558ca6378c824e2',
            attester: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
            recipient: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
            revoked: true,
            expirationTime: BigInt(0),
            time: BigInt(1612345678),
            data: '0x1234567890abcdef',
          };
        }
        if (uid === '0xexpired00000000000000000000000000000000000000000000000000000000000') {
          return {
            uid,
            schema: '0xba4171c92572b1e4f241d044c32cdf083be9fd946b8766977558ca6378c824e2',
            attester: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
            recipient: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
            revoked: false,
            expirationTime: BigInt(1612345678), // Expired time
            time: BigInt(1612345678),
            data: '0x1234567890abcdef',
          };
        }
        return {
          uid,
          schema: '0xba4171c92572b1e4f241d044c32cdf083be9fd946b8766977558ca6378c824e2',
          attester: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
          recipient: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
          revoked: false,
          expirationTime: BigInt(0),
          time: BigInt(1612345678),
          data: '0x1234567890abcdef',
        };
      }),
      revoke: jest.fn().mockImplementation(() => ({
        hash: '0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456',
        wait: jest
          .fn()
          .mockResolvedValue('0xrevoke7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'), // Returns UID
        receipt: {
          hash: '0x7890abcdef1234567890abcdef1234567890abcdef1234567890abcdef123456',
          blockNumber: 12345679,
          status: 1,
        },
      })),
    };

    privateRegistrar.schemaEncoder = privateRegistrar.schemaEncoder || {
      encodeData: jest.fn().mockReturnValue('0x1234567890abcdef'),
    };
  });

  describe('constructor', () => {
    it('should create an OnchainRegistrar with a signer and chain', () => {
      const registrarInstance = new OnchainRegistrar({
        signer: testWallet,
        chain: 'sepolia',
      });

      expect(registrarInstance).toBeInstanceOf(OnchainRegistrar);
    });

    it('should create an OnchainRegistrar with a signer and contract address', () => {
      const registrarInstance = new OnchainRegistrar({
        signer: testWallet,
        contractAddress: '0xC2679fBD37d54388Ce493F1DB75320D236e1815e',
        schemaUID: '0xba4171c92572b1e4f241d044c32cdf083be9fd946b8766977558ca6378c824e2',
      });

      expect(registrarInstance).toBeInstanceOf(OnchainRegistrar);
    });

    it('should throw ValidationError if neither provider nor signer is provided', () => {
      expect(
        () =>
          new OnchainRegistrar({
            chain: 'sepolia',
          })
      ).toThrow(ValidationError);
    });
  });

  describe('registerOnchainLocationProof', () => {
    it('should register an unsigned location proof', async () => {
      const onchainProof = await registrar.registerOnchainLocationProof(testUnsignedProof);

      expect(onchainProof).toBeDefined();
      expect(onchainProof.uid).toBeDefined();
      expect(onchainProof.chain).toBe('sepolia');
      expect(onchainProof.chainId).toBe(11155111);
      expect(onchainProof.txHash).toBeDefined();
      expect(onchainProof.blockNumber).toBeDefined();
      expect(onchainProof.attester).toBeDefined();
      expect(onchainProof.revocable).toBe(true);
      expect(onchainProof.revoked).toBe(false);

      // Check that all original fields are preserved
      expect(onchainProof.eventTimestamp).toBe(testUnsignedProof.eventTimestamp);
      expect(onchainProof.srs).toBe(testUnsignedProof.srs);
      expect(onchainProof.locationType).toBe(testUnsignedProof.locationType);
      expect(onchainProof.location).toBe(testUnsignedProof.location);
      expect(onchainProof.memo).toBe(testUnsignedProof.memo);
    });

    it('should register with transaction overrides', async () => {
      const options: OnchainProofOptions = {
        txOverrides: {
          gasLimit: 500000,
          maxFeePerGas: 1000000000,
        },
      };

      const onchainProof = await registrar.registerOnchainLocationProof(testUnsignedProof, options);

      expect(onchainProof).toBeDefined();
      expect(onchainProof.uid).toBeDefined();
    });

    it('should throw RegistrationError if transaction fails', async () => {
      // Force a transaction failure by making the wait method return null
      const privateRegistrar = registrar as unknown as PrivateOnchainRegistrar;
      privateRegistrar.eas.attest = jest.fn().mockImplementation(() => ({
        hash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        wait: jest.fn().mockResolvedValue(null),
      }));

      await expect(registrar.registerOnchainLocationProof(testUnsignedProof)).rejects.toThrow(
        RegistrationError
      );
    });
  });

  describe('verifyOnchainLocationProof', () => {
    it('should verify a valid onchain location proof', async () => {
      const result = await registrar.verifyOnchainLocationProof(testOnchainProof);

      expect(result.isValid).toBe(true);
      expect(result.signerAddress).toBe('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
      expect(result.proof).toBe(testOnchainProof);
    });

    it('should return invalid for a revoked proof', async () => {
      const result = await registrar.verifyOnchainLocationProof(revokedProof);

      expect(result.isValid).toBe(false);
      expect(result.revoked).toBe(true);
      expect(result.reason).toBe(VerificationError.PROOF_REVOKED);
    });

    it('should return invalid for an expired proof', async () => {
      const result = await registrar.verifyOnchainLocationProof(expiredProof);

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe(VerificationError.PROOF_EXPIRED);
    });

    it('should return invalid for a non-existent proof', async () => {
      const nonExistentProof: OnchainLocationProof = {
        ...testOnchainProof,
        uid: '0x0000000000000000000000000000000000000000000000000000000000000000',
      };

      const result = await registrar.verifyOnchainLocationProof(nonExistentProof);

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe(VerificationError.PROOF_NOT_FOUND);
    });

    it('should return invalid for a proof from a different chain', async () => {
      const differentChainProof: OnchainLocationProof = {
        ...testOnchainProof,
        chain: 'celo',
        chainId: 42220,
      };

      const result = await registrar.verifyOnchainLocationProof(differentChainProof);

      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Proof was registered on chain celo');
    });
  });

  describe('revokeOnchainLocationProof', () => {
    it('should revoke a valid onchain location proof', async () => {
      const tx = await registrar.revokeOnchainLocationProof(testOnchainProof);

      expect(tx).toBeDefined();
      // The tx is of unknown type but we know it has a hash for testing purposes
      expect((tx as { hash: string }).hash).toBeDefined();
    });

    it('should throw error for a non-revocable proof', async () => {
      const nonRevocableProof: OnchainLocationProof = {
        ...testOnchainProof,
        revocable: false,
      };

      await expect(registrar.revokeOnchainLocationProof(nonRevocableProof)).rejects.toThrow();
    });

    it('should throw error for an already revoked proof', async () => {
      await expect(registrar.revokeOnchainLocationProof(revokedProof)).rejects.toThrow();
    });

    it('should throw error for a proof from a different chain', async () => {
      const differentChainProof: OnchainLocationProof = {
        ...testOnchainProof,
        chain: 'celo',
        chainId: 42220,
      };

      await expect(registrar.revokeOnchainLocationProof(differentChainProof)).rejects.toThrow();
    });
  });
});
