/**
 * Tests for OffchainSigner
 */

import { Wallet } from 'ethers';
import { OffchainSigner } from '../../src/eas/OffchainSigner';
import {
  UnsignedLocationProof,
  OffchainLocationProof,
  VerificationError,
} from '../../src/core/types';
import { ValidationError, EASError } from '../../src/core/errors';

// Mock the EAS SDK
jest.mock('@ethereum-attestation-service/eas-sdk', () => {
  return {
    EAS: jest.fn().mockImplementation(() => ({
      connect: jest.fn(),
    })),
    Offchain: jest.fn().mockImplementation(() => ({
      getDomainTypedData: jest.fn().mockReturnValue({
        chainId: BigInt(11155111),
        name: 'EAS',
        verifyingContract: '0xC2679fBD37d54388Ce493F1DB75320D236e1815e',
        version: '1.0.0',
      }),
      signingType: {
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
          ],
          Attest: [
            { name: 'schema', type: 'bytes32' },
            { name: 'recipient', type: 'address' },
            { name: 'time', type: 'uint256' },
            { name: 'expirationTime', type: 'uint256' },
            { name: 'revocable', type: 'bool' },
            { name: 'refUID', type: 'bytes32' },
            { name: 'data', type: 'bytes' },
          ],
        },
      },
      signOffchainAttestation: jest.fn().mockImplementation(() => ({
        uid: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        signature: {
          r: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          s: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          v: 28,
        },
        version: 2,
      })),
      verifyOffchainAttestationSignature: jest.fn().mockImplementation((signer, _) => {
        // Mock verification - return true for the test address, false otherwise
        return signer === '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
      }),
    })),
    OffchainAttestationVersion: {
      Version2: 2,
    },
    SchemaEncoder: jest.fn().mockImplementation(() => ({
      encodeData: jest.fn().mockReturnValue('0x1234567890abcdef'),
    })),
  };
});

// Mock the chains module
jest.mock('../../src/eas/chains', () => ({
  getChainConfig: jest.fn().mockImplementation(() => ({
    chain: 'sepolia',
    deploymentBlock: 6269763,
    rpcUrl: 'https://sepolia.infura.io/v3/',
    easContractAddress: '0xC2679fBD37d54388Ce493F1DB75320D236e1815e',
    schemaUID: '0xba4171c92572b1e4f241d044c32cdf083be9fd946b8766977558ca6378c824e2',
  })),
  getSchemaUID: jest
    .fn()
    .mockImplementation(() => '0xba4171c92572b1e4f241d044c32cdf083be9fd946b8766977558ca6378c824e2'),
  getSchemaString: jest
    .fn()
    .mockReturnValue(
      'uint256 eventTimestamp,string srs,string locationType,string location,string[] recipeType,bytes[] recipePayload,string[] mediaType,string[] mediaData,string memo'
    ),
}));

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

// Type for accessing private properties
interface PrivateOffchainSigner {
  offchainModule: {
    getDomainTypedData: () => unknown;
    signingType: { types: unknown };
    signOffchainAttestation: (params: unknown, signer: unknown) => Promise<unknown>;
    verifyOffchainAttestationSignature: (signer: string, _: unknown) => boolean;
  };
  schemaEncoder: {
    encodeData: (items: unknown) => string;
  };
}

describe('OffchainSigner', () => {
  let signer: OffchainSigner;

  beforeEach(() => {
    // Create a new signer for each test
    signer = new OffchainSigner({
      signer: testWallet,
      chainId: 11155111, // Sepolia
    });

    // Ensure fields are initialized by accessing the private properties
    (signer as unknown as PrivateOffchainSigner).offchainModule = (
      signer as unknown as PrivateOffchainSigner
    ).offchainModule || {
      getDomainTypedData: jest.fn().mockReturnValue({
        chainId: BigInt(11155111),
        name: 'EAS',
        verifyingContract: '0xC2679fBD37d54388Ce493F1DB75320D236e1815e',
        version: '1.0.0',
      }),
      signingType: {
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
            { name: 'verifyingContract', type: 'address' },
          ],
          Attest: [
            { name: 'schema', type: 'bytes32' },
            { name: 'recipient', type: 'address' },
            { name: 'time', type: 'uint256' },
            { name: 'expirationTime', type: 'uint256' },
            { name: 'revocable', type: 'bool' },
            { name: 'refUID', type: 'bytes32' },
            { name: 'data', type: 'bytes' },
          ],
        },
      },
      signOffchainAttestation: jest.fn().mockImplementation(() => ({
        uid: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        signature: {
          r: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          s: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          v: 28,
        },
        version: 2,
      })),
      verifyOffchainAttestationSignature: jest.fn().mockImplementation((signerAddr, _) => {
        // Mock verification - return true for a specific address
        return signerAddr === '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
      }),
    };

    (signer as unknown as PrivateOffchainSigner).schemaEncoder = (
      signer as unknown as PrivateOffchainSigner
    ).schemaEncoder || {
      encodeData: jest.fn().mockReturnValue('0x1234567890abcdef'),
    };
  });

  describe('constructor', () => {
    it('should create an OffchainSigner with a signer', () => {
      const signerInstance = new OffchainSigner({
        signer: testWallet,
        chainId: 11155111, // Sepolia
      });

      expect(signerInstance).toBeInstanceOf(OffchainSigner);
    });

    it('should throw ValidationError if neither signer nor privateKey is provided', () => {
      expect(
        () =>
          new OffchainSigner({
            chainId: 11155111, // Sepolia
          })
      ).toThrow(ValidationError);
    });
  });

  describe('signOffchainLocationProof', () => {
    it('should sign an unsigned location proof', async () => {
      // Mock the signer.getAddress method
      (testWallet.getAddress as jest.Mock) = jest
        .fn()
        .mockResolvedValue('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');

      const offchainProof = await signer.signOffchainLocationProof(testUnsignedProof);

      expect(offchainProof).toBeDefined();
      expect(offchainProof.uid).toBeDefined();
      expect(offchainProof.signature).toBeDefined();
      expect(offchainProof.signer).toBeDefined();
      expect(offchainProof.version).toBeDefined();

      // Check that all original fields are preserved
      expect(offchainProof.eventTimestamp).toBe(testUnsignedProof.eventTimestamp);
      expect(offchainProof.srs).toBe(testUnsignedProof.srs);
      expect(offchainProof.locationType).toBe(testUnsignedProof.locationType);
      expect(offchainProof.location).toBe(testUnsignedProof.location);
      expect(offchainProof.memo).toBe(testUnsignedProof.memo);
    });

    it('should throw SigningError if signing fails', async () => {
      // Force a signing failure by making the offchainModule throw
      (signer as unknown as PrivateOffchainSigner).offchainModule.signOffchainAttestation = jest
        .fn()
        .mockImplementation(() => {
          throw new Error('Signature creation failed');
        });

      await expect(signer.signOffchainLocationProof(testUnsignedProof)).rejects.toThrow(EASError);
    });
  });

  describe('verifyOffchainLocationProof', () => {
    it('should verify a valid offchain location proof', async () => {
      // Create a valid proof for testing
      const validProof: OffchainLocationProof = {
        ...testUnsignedProof,
        uid: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        signature: JSON.stringify({
          r: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          s: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          v: 28,
        }),
        signer: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Address that will pass verification
        version: 'astral-sdk-v0.1.0',
      };

      const result = await signer.verifyOffchainLocationProof(validProof);

      expect(result.isValid).toBe(true);
      expect(result.signerAddress).toBe('0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266');
      expect(result.proof).toBe(validProof);
    });

    it('should return invalid for an invalid signature', async () => {
      // Create a proof with invalid signature
      const invalidProof: OffchainLocationProof = {
        ...testUnsignedProof,
        uid: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        signature: JSON.stringify({
          r: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          s: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          v: 28,
        }),
        signer: '0x0000000000000000000000000000000000000000', // Address that will fail verification
        version: 'astral-sdk-v0.1.0',
      };

      const result = await signer.verifyOffchainLocationProof(invalidProof);

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe(VerificationError.INVALID_SIGNATURE);
    });

    it('should return invalid for an expired proof', async () => {
      // Create an expired proof
      const expiredProof: OffchainLocationProof = {
        ...testUnsignedProof,
        uid: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        signature: JSON.stringify({
          r: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          s: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          v: 28,
        }),
        signer: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266', // Valid signer
        version: 'astral-sdk-v0.1.0',
        expirationTime: Math.floor(Date.now() / 1000) - 3600, // Expired 1 hour ago
      };

      const result = await signer.verifyOffchainLocationProof(expiredProof);

      expect(result.isValid).toBe(false);
      expect(result.reason).toBe(VerificationError.PROOF_EXPIRED);
    });
  });
});
