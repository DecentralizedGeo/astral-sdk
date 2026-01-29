// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

import { LocationModule } from '../../src/location';
import { OffchainWorkflow } from '../../src/location/OffchainWorkflow';
import { OnchainWorkflow } from '../../src/location/OnchainWorkflow';

// Sepolia testnet chain ID (supported in EAS config)
const SEPOLIA_CHAIN_ID = 11155111;

describe('LocationModule', () => {
  describe('constructor', () => {
    it('should initialize with chainId', () => {
      const module = new LocationModule({ chainId: SEPOLIA_CHAIN_ID });
      expect(module).toBeInstanceOf(LocationModule);
    });

    it('should initialize offchain workflow', () => {
      const module = new LocationModule({ chainId: SEPOLIA_CHAIN_ID });
      expect(module.offchain).toBeInstanceOf(OffchainWorkflow);
    });

    it('should initialize onchain workflow', () => {
      const module = new LocationModule({ chainId: SEPOLIA_CHAIN_ID });
      expect(module.onchain).toBeInstanceOf(OnchainWorkflow);
    });

    it('should initialize extension registry', () => {
      const module = new LocationModule({ chainId: SEPOLIA_CHAIN_ID });
      expect(module.extensions).toBeDefined();
    });
  });

  describe('build method', () => {
    it('should throw error for missing location', async () => {
      const module = new LocationModule({ chainId: SEPOLIA_CHAIN_ID });
      // @ts-expect-error Testing invalid input
      await expect(module.build({})).rejects.toThrow('Location data is required');
    });

    it('should build attestation from GeoJSON point', async () => {
      const module = new LocationModule({ chainId: SEPOLIA_CHAIN_ID });
      const input = {
        location: { type: 'Point', coordinates: [-122.4, 37.8] },
        memo: 'Test location',
      };
      const result = await module.build(input);
      expect(result.locationType).toBe('geojson');
      expect(result.location).toContain('-122.4');
      expect(result.memo).toBe('Test location');
    });

    it('should include timestamp', async () => {
      const module = new LocationModule({ chainId: SEPOLIA_CHAIN_ID });
      const timestamp = new Date('2024-01-15T10:00:00Z');
      const input = {
        location: { type: 'Point', coordinates: [-122.4, 37.8] },
        timestamp,
        memo: 'Timestamp test', // memo is required for schema validation
      };
      const result = await module.build(input);
      expect(result.eventTimestamp).toBe(Math.floor(timestamp.getTime() / 1000));
    });
  });

  describe('encode method', () => {
    it('should encode attestation data', async () => {
      const module = new LocationModule({ chainId: SEPOLIA_CHAIN_ID });
      const input = {
        location: { type: 'Point', coordinates: [-122.4, 37.8] },
        memo: 'Encode test', // memo is required for schema validation
      };
      const unsigned = await module.build(input);
      const encoded = module.encode(unsigned);
      expect(typeof encoded).toBe('string');
      expect(encoded.startsWith('0x')).toBe(true);
    });
  });

  describe('decode method', () => {
    it('should decode encoded data', async () => {
      const module = new LocationModule({ chainId: SEPOLIA_CHAIN_ID });
      const input = {
        location: { type: 'Point', coordinates: [-122.4, 37.8] },
        memo: 'Test',
      };
      const unsigned = await module.build(input);
      const encoded = module.encode(unsigned);
      const decoded = module.decode(encoded);
      // The decoded format is { name, type, value } for each field
      expect((decoded.memo as { value: string }).value).toBe('Test');
    });
  });
});
