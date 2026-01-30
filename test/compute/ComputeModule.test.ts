// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

import { ComputeModule } from '../../src/compute';

// Sepolia testnet chain ID (supported in EAS config)
const SEPOLIA_CHAIN_ID = 11155111;

describe('ComputeModule', () => {
  describe('constructor', () => {
    it('should initialize with required config', () => {
      const module = new ComputeModule({
        apiUrl: 'https://api.astral.global',
        chainId: SEPOLIA_CHAIN_ID,
      });
      expect(module).toBeInstanceOf(ComputeModule);
    });

    it('should trim trailing slash from apiUrl', () => {
      const module = new ComputeModule({
        apiUrl: 'https://api.astral.global/',
        chainId: SEPOLIA_CHAIN_ID,
      });
      expect(module).toBeDefined();
    });
  });

  describe('methods exist', () => {
    let module: ComputeModule;

    beforeAll(() => {
      module = new ComputeModule({
        apiUrl: 'https://api.astral.global',
        chainId: SEPOLIA_CHAIN_ID,
      });
    });

    it('should have distance method', () => {
      expect(typeof module.distance).toBe('function');
    });

    it('should have area method', () => {
      expect(typeof module.area).toBe('function');
    });

    it('should have length method', () => {
      expect(typeof module.length).toBe('function');
    });

    it('should have contains method', () => {
      expect(typeof module.contains).toBe('function');
    });

    it('should have within method', () => {
      expect(typeof module.within).toBe('function');
    });

    it('should have intersects method', () => {
      expect(typeof module.intersects).toBe('function');
    });

    it('should have submit method', () => {
      expect(typeof module.submit).toBe('function');
    });

    it('should have estimate method', () => {
      expect(typeof module.estimate).toBe('function');
    });

    it('should have health method', () => {
      expect(typeof module.health).toBe('function');
    });
  });

  describe('submit without signer', () => {
    it('should throw error when submitting without signer', async () => {
      const module = new ComputeModule({
        apiUrl: 'https://api.astral.global',
        chainId: SEPOLIA_CHAIN_ID,
      });

      const mockAttestation = {
        message: {
          schema: '0x123',
          recipient: '0x456',
          expirationTime: BigInt(0),
          revocable: true,
          refUID: '0x0000000000000000000000000000000000000000000000000000000000000000',
          data: '0x',
          value: BigInt(0),
          nonce: BigInt(0),
          deadline: BigInt(0),
        },
        signature: { v: 27, r: '0x', s: '0x' },
        attester: '0x789',
      };

      await expect(module.submit(mockAttestation)).rejects.toThrow('Signer is required');
    });
  });

  describe('estimate without signer', () => {
    it('should throw error when estimating without signer', async () => {
      const module = new ComputeModule({
        apiUrl: 'https://api.astral.global',
        chainId: SEPOLIA_CHAIN_ID,
      });

      const mockAttestation = {
        message: {
          schema: '0x123',
          recipient: '0x456',
          expirationTime: BigInt(0),
          revocable: true,
          refUID: '0x0000000000000000000000000000000000000000000000000000000000000000',
          data: '0x',
          value: BigInt(0),
          nonce: BigInt(0),
          deadline: BigInt(0),
        },
        signature: { v: 27, r: '0x', s: '0x' },
        attester: '0x789',
      };

      await expect(module.estimate(mockAttestation)).rejects.toThrow('Signer is required');
    });
  });
});
