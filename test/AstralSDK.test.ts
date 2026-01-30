// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

import { AstralSDK } from '../src/AstralSDK';
import { LocationModule } from '../src/location';
import { ComputeModule } from '../src/compute';

// Sepolia testnet chain ID (supported in EAS config)
const SEPOLIA_CHAIN_ID = 11155111;

describe('AstralSDK Unified', () => {
  describe('constructor', () => {
    it('should initialize with required chainId', () => {
      const sdk = new AstralSDK({ chainId: SEPOLIA_CHAIN_ID });
      expect(sdk).toBeInstanceOf(AstralSDK);
    });

    it('should initialize location module', () => {
      const sdk = new AstralSDK({ chainId: SEPOLIA_CHAIN_ID });
      expect(sdk.location).toBeInstanceOf(LocationModule);
    });

    it('should initialize compute module', () => {
      const sdk = new AstralSDK({ chainId: SEPOLIA_CHAIN_ID });
      expect(sdk.compute).toBeInstanceOf(ComputeModule);
    });

    it('should use default apiUrl when not provided', () => {
      const sdk = new AstralSDK({ chainId: SEPOLIA_CHAIN_ID });
      expect(sdk.compute).toBeDefined();
    });

    it('should accept custom apiUrl', () => {
      const sdk = new AstralSDK({
        chainId: SEPOLIA_CHAIN_ID,
        apiUrl: 'https://custom.api.com',
      });
      expect(sdk.compute).toBeDefined();
    });

    it('should propagate config to location module', () => {
      const sdk = new AstralSDK({
        chainId: SEPOLIA_CHAIN_ID,
        debug: true,
        strictSchemaValidation: false,
      });
      expect(sdk.location).toBeDefined();
    });
  });

  describe('location namespace', () => {
    it('should have offchain sub-namespace', () => {
      const sdk = new AstralSDK({ chainId: SEPOLIA_CHAIN_ID });
      expect(sdk.location.offchain).toBeDefined();
    });

    it('should have onchain sub-namespace', () => {
      const sdk = new AstralSDK({ chainId: SEPOLIA_CHAIN_ID });
      expect(sdk.location.onchain).toBeDefined();
    });

    it('should have build method', () => {
      const sdk = new AstralSDK({ chainId: SEPOLIA_CHAIN_ID });
      expect(typeof sdk.location.build).toBe('function');
    });

    it('should have encode method', () => {
      const sdk = new AstralSDK({ chainId: SEPOLIA_CHAIN_ID });
      expect(typeof sdk.location.encode).toBe('function');
    });

    it('should have decode method', () => {
      const sdk = new AstralSDK({ chainId: SEPOLIA_CHAIN_ID });
      expect(typeof sdk.location.decode).toBe('function');
    });
  });

  describe('compute namespace', () => {
    it('should have distance method', () => {
      const sdk = new AstralSDK({ chainId: SEPOLIA_CHAIN_ID });
      expect(typeof sdk.compute.distance).toBe('function');
    });

    it('should have area method', () => {
      const sdk = new AstralSDK({ chainId: SEPOLIA_CHAIN_ID });
      expect(typeof sdk.compute.area).toBe('function');
    });

    it('should have contains method', () => {
      const sdk = new AstralSDK({ chainId: SEPOLIA_CHAIN_ID });
      expect(typeof sdk.compute.contains).toBe('function');
    });

    it('should have within method', () => {
      const sdk = new AstralSDK({ chainId: SEPOLIA_CHAIN_ID });
      expect(typeof sdk.compute.within).toBe('function');
    });

    it('should have intersects method', () => {
      const sdk = new AstralSDK({ chainId: SEPOLIA_CHAIN_ID });
      expect(typeof sdk.compute.intersects).toBe('function');
    });

    it('should have submit method', () => {
      const sdk = new AstralSDK({ chainId: SEPOLIA_CHAIN_ID });
      expect(typeof sdk.compute.submit).toBe('function');
    });

    it('should have estimate method', () => {
      const sdk = new AstralSDK({ chainId: SEPOLIA_CHAIN_ID });
      expect(typeof sdk.compute.estimate).toBe('function');
    });

    it('should have health method', () => {
      const sdk = new AstralSDK({ chainId: SEPOLIA_CHAIN_ID });
      expect(typeof sdk.compute.health).toBe('function');
    });
  });
});
