// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

/**
 * Tests for EAS chain configuration utilities
 */

import fs from 'fs';
import {
  loadEASConfig,
  getLatestVersionConfig,
  getVersionConfig,
  getChainConfig,
  getChainConfigByName,
  getChainId,
  getChainName,
  getSupportedChainIds,
  getSupportedChainNames,
  getSchemaConfig,
  getSchemaUID,
} from '../../src/eas/chains';
import { ChainConnectionError } from '../../src/core/errors';
import { EASConfig } from '@/core/config';

// Mock the configuration for testing
const mockConfig: EASConfig = {
  'v0.1': {
    schema: {
      interface: {
        eventTimestamp: 'uint256',
        srs: 'string',
        locationType: 'string',
        location: 'string',
        recipeType: 'string[]',
        recipePayload: 'bytes[]',
        mediaType: 'string[]',
        mediaData: 'string[]',
        memo: 'string',
      },
      rawString:
        'uint256 eventTimestamp,string srs,string locationType,string location,string[] recipeType,bytes[] recipePayload,string[] mediaType,string[] mediaData,string memo',
    },
    chains: {
      '10': {
        chain: 'optimism',
        deploymentBlock: 142210865,
        rpcUrl: 'https://optimism-mainnet.infura.io/v3/',
        easContractAddress: '0x4200000000000000000000000000000000000021',
        schemaUID: '0xba4171c92572b1e4f241d044c32cdf083be9fd946b8766977558ca6378c824e2',
      },
      '42220': {
        chain: 'celo',
        deploymentBlock: 26901063,
        rpcUrl: 'https://celo-mainnet.infura.io/v3/',
        easContractAddress: '0x72E1d8ccf5299fb36fEfD8CC4394B8ef7e98Af92',
        schemaUID: '0xba4171c92572b1e4f241d044c32cdf083be9fd946b8766977558ca6378c824e2',
      },
      '42161': {
        chain: 'arbitrum',
        deploymentBlock: 243446573,
        rpcUrl: 'https://arbitrum-mainnet.infura.io/v3/',
        easContractAddress: '0xbD75f629A22Dc1ceD33dDA0b68c546A1c035c458',
        schemaUID: '0xba4171c92572b1e4f241d044c32cdf083be9fd946b8766977558ca6378c824e2',
      },
      '11155111': {
        chain: 'sepolia',
        deploymentBlock: 6269763,
        rpcUrl: 'https://sepolia.infura.io/v3/',
        easContractAddress: '0xC2679fBD37d54388Ce493F1DB75320D236e1815e',
        schemaUID: '0xba4171c92572b1e4f241d044c32cdf083be9fd946b8766977558ca6378c824e2',
      },
      '8453': {
        chain: 'base',
        deploymentBlock: 25903221,
        rpcUrl: 'https://base-mainnet.infura.io/v3/',
        easContractAddress: '0x4200000000000000000000000000000000000021',
        schemaUID: '0xba4171c92572b1e4f241d044c32cdf083be9fd946b8766977558ca6378c824e2',
      },
      '84532': {
        chain: 'base-sepolia',
        deploymentBlock: 1,
        rpcUrl: 'https://sepolia.base.org',
        easContractAddress: '0x4200000000000000000000000000000000000021',
        schemaUID: '0xba4171c92572b1e4f241d044c32cdf083be9fd946b8766977558ca6378c824e2',
      },
    },
  },
};

// Mock fs module for tests
jest.mock('fs');

// Mock path module for tests
jest.mock('path', () => ({
  ...jest.requireActual('path'),
  resolve: jest.fn().mockImplementation((...args) => {
    // Handle the specific path we want for testing
    if (args.includes('mock-config.json') || args.includes('EAS-config.json')) {
      return '/mock-config-path';
    }
    return jest.requireActual('path').resolve(...args);
  }),
}));

// Mock the Node.js environment for testing
process.env.NODE_ENV = 'test';

describe('EAS Chain Configuration', () => {
  // Reset module cache before each test to reset cachedConfig
  beforeEach(() => {
    jest.resetModules();
    // Reset mocks
    jest.clearAllMocks();
    // Mock fs.readFileSync to return our test config
    (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify(mockConfig));
  });

  describe('loadEASConfig', () => {
    it('should load and parse the configuration file', () => {
      const config = loadEASConfig();

      expect(JSON.stringify(config)).toEqual(JSON.stringify(mockConfig));
    });

    it('should throw ChainConnectionError if the file cannot be read', () => {
      (fs.readFileSync as jest.Mock).mockImplementation(() => {
        throw new Error('File not found');
      });

      expect(() => loadEASConfig('./invaliddir')).toThrow(ChainConnectionError);
      expect(() => loadEASConfig('./invaliddir')).toThrow('Failed to load EAS configuration');
    });

    it('should throw appropriate error in browser environment', () => {
      // Save original window object
      const originalWindow = global.window;

      // Mock browser environment
      global.window = {} as Window & typeof globalThis;

      try {
        expect(() => loadEASConfig('./some-path')).toThrow(ChainConnectionError);
        expect(() => loadEASConfig('./some-path')).toThrow(
          'Custom configuration paths are not supported in browser environments'
        );
      } finally {
        // Restore original window object
        global.window = originalWindow;
      }
    });
  });

  describe('getLatestVersionConfig', () => {
    it('should return the latest version configuration', () => {
      const versionConfig = getLatestVersionConfig(mockConfig);

      expect(versionConfig).toEqual(mockConfig['v0.1']);
    });

    it('should throw ChainConnectionError if no versions are available', () => {
      expect(() => getLatestVersionConfig({})).toThrow(ChainConnectionError);
      expect(() => getLatestVersionConfig({})).toThrow('No EAS configuration versions available');
    });
  });

  describe('getVersionConfig', () => {
    it('should return the configuration for a specific version', () => {
      const versionConfig = getVersionConfig(mockConfig, 'v0.1');

      expect(versionConfig).toEqual(mockConfig['v0.1']);
    });

    it('should throw ChainConnectionError if the version is not found', () => {
      expect(() => getVersionConfig(mockConfig, 'v0.3')).toThrow(ChainConnectionError);
      expect(() => getVersionConfig(mockConfig, 'v0.3')).toThrow(
        "EAS configuration version 'v0.3' not found"
      );
    });
  });

  describe('getChainConfig', () => {
    it('should return the configuration for a specific chain ID', () => {
      const chainConfig = getChainConfig(11155111);

      expect(chainConfig).toEqual(mockConfig['v0.1'].chains['11155111']);
    });

    it('should return the configuration for a specific chain ID and version', () => {
      const chainConfig = getChainConfig(42161, 'v0.1');

      expect(chainConfig).toEqual(mockConfig['v0.1'].chains['42161']);
    });

    it('should throw ChainConnectionError if the chain ID is not supported', () => {
      expect(() => getChainConfig(1)).toThrow(ChainConnectionError);
      expect(() => getChainConfig(1)).toThrow('Chain ID 1 is not supported');
    });
  });

  describe('getChainConfigByName', () => {
    it('should return the configuration for a specific chain name', () => {
      const chainConfig = getChainConfigByName('sepolia');

      expect(chainConfig).toEqual(mockConfig['v0.1'].chains['11155111']);
    });

    it('should be case-insensitive when matching chain names', () => {
      const chainConfig = getChainConfigByName('SePoLiA');

      expect(chainConfig).toEqual(mockConfig['v0.1'].chains['11155111']);
    });

    it('should throw ChainConnectionError if the chain name is not supported', () => {
      expect(() => getChainConfigByName('mainnet')).toThrow(ChainConnectionError);
      expect(() => getChainConfigByName('mainnet')).toThrow("Chain 'mainnet' is not supported");
    });
  });

  describe('getChainId', () => {
    it('should return the chain ID for a chain name', () => {
      const chainId = getChainId('sepolia');

      expect(chainId).toBe(11155111);
    });

    it('should be case-insensitive when matching chain names', () => {
      const chainId = getChainId('BaSe', 'v0.1');

      expect(chainId).toBe(8453);
    });

    it('should throw ChainConnectionError if the chain name is not supported', () => {
      expect(() => getChainId('ethereum')).toThrow(ChainConnectionError);
      expect(() => getChainId('ethereum')).toThrow("Chain 'ethereum' is not supported");
    });
  });

  describe('getChainName', () => {
    it('should return the chain name for a chain ID', () => {
      const chainName = getChainName(11155111);

      expect(chainName).toBe('sepolia');
    });

    it('should work with specific versions', () => {
      const chainName = getChainName(42161, 'v0.1');

      expect(chainName).toBe('arbitrum');
    });

    it('should throw ChainConnectionError if the chain ID is not supported', () => {
      expect(() => getChainName(1337)).toThrow(ChainConnectionError);
      expect(() => getChainName(1337)).toThrow('Chain ID 1337 is not supported');
    });
  });

  describe('getSupportedChainIds', () => {
    it('should return all supported chain IDs for the latest version', () => {
      const chainIds = getSupportedChainIds();

      // IDs should be returned in ascending order
      expect(chainIds).toEqual([10, 8453, 42161, 42220, 84532, 11155111]);
    });

    it('should return all supported chain IDs for a specific version', () => {
      const chainIds = getSupportedChainIds('v0.1');

      // Since we're testing with mock data, we should expect what's in the mock, not the real config
      expect(chainIds).toContain(11155111);
      expect(chainIds).toContain(42161);
      expect(chainIds.length).toBe(6);
    });
  });

  describe('getSupportedChainNames', () => {
    it('should return all supported chain names for the latest version', () => {
      const chainNames = getSupportedChainNames();

      // Names should be alphabetically sorted
      expect(chainNames).toEqual([
        'arbitrum',
        'base',
        'base-sepolia',
        'celo',
        'optimism',
        'sepolia',
      ]);
    });

    it('should return all supported chain names for a specific version', () => {
      const chainNames = getSupportedChainNames('v0.1');

      // Names should be alphabetically sorted
      expect(chainNames).toEqual([
        'arbitrum',
        'base',
        'base-sepolia',
        'celo',
        'optimism',
        'sepolia',
      ]);
    });
  });

  describe('getSchemaConfig', () => {
    it('should return the schema configuration for the latest version', () => {
      const schemaConfig = getSchemaConfig();

      expect(schemaConfig).toEqual(mockConfig['v0.1'].schema);
    });

    it('should return the schema configuration for a specific version', () => {
      const schemaConfig = getSchemaConfig('v0.1');

      expect(schemaConfig).toEqual(mockConfig['v0.1'].schema);
    });
  });

  describe('getSchemaUID', () => {
    it('should return the schema UID for a specific chain ID', () => {
      const schemaUID = getSchemaUID(11155111);

      expect(schemaUID).toBe('0xba4171c92572b1e4f241d044c32cdf083be9fd946b8766977558ca6378c824e2');
    });

    it('should return the schema UID for a specific chain name', () => {
      const schemaUID = getSchemaUID('base');

      expect(schemaUID).toBe('0xba4171c92572b1e4f241d044c32cdf083be9fd946b8766977558ca6378c824e2');
    });

    it('should work with specific versions', () => {
      const schemaUID = getSchemaUID('arbitrum', 'v0.1');

      expect(schemaUID).toBe('0xba4171c92572b1e4f241d044c32cdf083be9fd946b8766977558ca6378c824e2');
    });
  });
});
