// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

/**
 * Tests for AstralApiClient
 *
 * This file contains tests for the Astral API client which handles communication
 * with the Astral API for retrieving location proofs and other operations.
 */

// Using Jest's built-in expect
import { AstralApiClient, AstralApiConfig } from '../../src/api/AstralApiClient';
import { AstralAPIError, NotFoundError } from '../../src/core/errors';

describe('AstralApiClient', () => {
  // Mock global fetch for testing
  let originalFetch: typeof global.fetch;
  let fetchMock: jest.Mock;

  beforeEach(() => {
    // Save original fetch
    originalFetch = global.fetch;

    // Create a fetch mock
    fetchMock = jest.fn();
    global.fetch = fetchMock;
  });

  afterEach(() => {
    // Restore original fetch
    global.fetch = originalFetch;
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should set default values when no config is provided', () => {
      const client = new AstralApiClient();
      // @ts-expect-error - accessing private property for testing
      expect(client.baseURL).toBe('https://api.astral.global');
      // @ts-expect-error - accessing private property for testing
      expect(client.apiKey).toBeUndefined();
      // @ts-expect-error - accessing private property for testing
      expect(client.timeout).toBe(30000);
    });

    it('should set values from config object', () => {
      const client = new AstralApiClient({
        baseURL: 'https://custom.api.astral.global',
        apiKey: 'test-api-key',
        timeout: 10000,
      });

      // @ts-expect-error - accessing private property for testing
      expect(client.baseURL).toBe('https://custom.api.astral.global');
      // @ts-expect-error - accessing private property for testing
      expect(client.apiKey).toBe('test-api-key');
      // @ts-expect-error - accessing private property for testing
      expect(client.timeout).toBe(10000);
    });

    it('should set values from string URL and API key', () => {
      const client = new AstralApiClient('https://another.api.astral.global', 'another-key');

      // @ts-expect-error - accessing private property for testing
      expect(client.baseURL).toBe('https://another.api.astral.global');
      // @ts-expect-error - accessing private property for testing
      expect(client.apiKey).toBe('another-key');
    });

    it('should remove trailing slash from baseURL', () => {
      const client = new AstralApiClient('https://api.astral.global/');

      // @ts-expect-error - accessing private property for testing
      expect(client.baseURL).toBe('https://api.astral.global');
    });
  });

  describe('getConfig', () => {
    it('should fetch configuration from API', async () => {
      const mockConfig: AstralApiConfig = {
        schemas: {
          location: '0x1234567890abcdef',
        },
        chains: {
          '11155111': {
            name: 'sepolia',
            contracts: {
              eas: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
              schemaRegistry: '0xffffffffffffffffffffffffffffffffffffffff',
            },
          },
        },
        version: {
          api: '0.1.0',
          protocol: '0.1.0',
        },
      };

      // Mock successful response
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({
          'content-type': 'application/json',
        }),
        json: async () => mockConfig,
      });

      const client = new AstralApiClient();
      const config = await client.getConfig();

      expect(config).toEqual(mockConfig);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.astral.global/config',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Accept: 'application/json',
          }),
        })
      );
    });

    it('should return cached config on subsequent calls', async () => {
      const mockConfig: AstralApiConfig = {
        schemas: {
          location: '0x1234567890abcdef',
        },
        chains: {
          '11155111': {
            name: 'sepolia',
            contracts: {
              eas: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
              schemaRegistry: '0xffffffffffffffffffffffffffffffffffffffff',
            },
          },
        },
        version: {
          api: '0.1.0',
          protocol: '0.1.0',
        },
      };

      // Mock successful response for first call
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({
          'content-type': 'application/json',
        }),
        json: async () => mockConfig,
      });

      const client = new AstralApiClient();

      // First call should make the fetch request
      const firstConfig = await client.getConfig();
      expect(firstConfig).toEqual(mockConfig);
      expect(fetchMock).toHaveBeenCalledTimes(1);

      // Second call should use cached config
      const secondConfig = await client.getConfig();
      expect(secondConfig).toEqual(mockConfig);
      expect(fetchMock).toHaveBeenCalledTimes(1); // Still only one call
    });
  });

  describe('getLocationAttestation', () => {
    it('should fetch a location proof by UID', async () => {
      const mockProof = {
        uid: '0xabcdef1234567890',
        chain: 'sepolia',
        chainId: 11155111,
        eventTimestamp: 1636452345,
        srs: 'EPSG:4326',
        locationType: 'geojson-point',
        location: '{"type":"Point","coordinates":[12.34,56.78]}',
        attester: '0x1234567890abcdef1234567890abcdef12345678',
        txHash: '0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210',
        blockNumber: 123456,
        revocable: true,
        revoked: false,
      };

      // Mock successful response
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({
          'content-type': 'application/json',
        }),
        json: async () => mockProof,
      });

      const client = new AstralApiClient();
      const proof = await client.getLocationAttestation('0xabcdef1234567890');

      expect(proof).toEqual(mockProof);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.astral.global/proofs/0xabcdef1234567890',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should throw NotFoundError when proof does not exist', async () => {
      // Mock 404 response
      fetchMock.mockResolvedValueOnce({
        ok: false,
        status: 404,
        headers: new Headers({
          'content-type': 'application/json',
        }),
        json: async () => ({ error: 'Proof not found' }),
      });

      const client = new AstralApiClient();

      try {
        await client.getLocationAttestation('0xnonexistent');
        fail('Should have thrown NotFoundError');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundError);
        expect((error as NotFoundError).message).toContain('LocationAttestation not found');
      }
    });
  });

  describe('getLocationAttestations', () => {
    it('should fetch location proofs with query parameters', async () => {
      const mockProofs = {
        proofs: [
          {
            uid: '0xabcdef1234567890',
            chain: 'sepolia',
            chainId: 11155111,
            eventTimestamp: 1636452345,
          },
          {
            uid: '0x1234567890abcdef',
            chain: 'sepolia',
            chainId: 11155111,
            eventTimestamp: 1636452400,
          },
        ],
        total: 2,
        pageSize: 10,
        currentPage: 1,
        totalPages: 1,
        hasNextPage: false,
        hasPrevPage: false,
      };

      // Mock successful response
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({
          'content-type': 'application/json',
        }),
        json: async () => mockProofs,
      });

      const client = new AstralApiClient();
      const query = {
        chain: 'sepolia',
        limit: 10,
        offset: 0,
      };

      const results = await client.getLocationAttestations(query);

      expect(results.attestations).toHaveLength(2);
      expect(results.total).toBe(2);
      expect(fetchMock).toHaveBeenCalledWith(
        'https://api.astral.global/proofs?chain=sepolia&limit=10&offset=0',
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should handle complex query parameters', async () => {
      const mockProofs = {
        proofs: [],
        total: 0,
        pageSize: 10,
        currentPage: 1,
        totalPages: 0,
        hasNextPage: false,
        hasPrevPage: false,
      };

      // Mock successful response
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({
          'content-type': 'application/json',
        }),
        json: async () => mockProofs,
      });

      const client = new AstralApiClient();
      const startDate = new Date('2023-01-01T00:00:00Z');
      const endDate = new Date('2023-12-31T23:59:59Z');

      const query = {
        bbox: [10.0, 20.0, 11.0, 21.0] as [number, number, number, number],
        timeRange: [startDate, endDate] as [Date, Date],
        attester: ['0x1234567890abcdef', '0xfedcba0987654321'],
      };

      await client.getLocationAttestations(query);

      const url = fetchMock.mock.calls[0][0] as string;
      expect(url).toContain('bbox=10,20,11,21');
      expect(url).toContain('attester=0x1234567890abcdef,0xfedcba0987654321');
      expect(url).toContain(`startTime=${encodeURIComponent(startDate.toISOString())}`);
      expect(url).toContain(`endTime=${encodeURIComponent(endDate.toISOString())}`);
    });
  });

  describe('publishOffchainProof', () => {
    it('should throw not implemented error', async () => {
      const client = new AstralApiClient();

      try {
        await client.publishOffchainProof({});
        fail('Should have thrown AstralAPIError');
      } catch (error) {
        expect(error).toBeInstanceOf(AstralAPIError);
        expect((error as AstralAPIError).message).toContain('not yet implemented');
        expect((error as AstralAPIError).status).toBe(501);
      }
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      // Mock network error
      fetchMock.mockRejectedValueOnce(new Error('Network error'));

      const client = new AstralApiClient();

      try {
        await client.getConfig();
        fail('Should have thrown AstralAPIError');
      } catch (error) {
        expect(error).toBeInstanceOf(AstralAPIError);
        expect((error as AstralAPIError).message).toContain('API request failed');
      }
    }, 10000); // 10 second timeout

    it('should handle non-JSON responses', async () => {
      // Mock HTML response
      fetchMock.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({
          'content-type': 'text/html',
        }),
        text: async () => '<html><body>Not JSON</body></html>',
      });

      const client = new AstralApiClient();
      const result = await client.getConfig();

      // Result should be the text content
      expect(result).toEqual('<html><body>Not JSON</body></html>');
    });

    it.skip('should handle rate limiting with exponential backoff', async () => {
      // First two calls return 429, third call succeeds
      fetchMock
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          headers: new Headers({
            'content-type': 'application/json',
          }),
          json: async () => ({ error: 'Rate limit exceeded' }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          statusText: 'Too Many Requests',
          headers: new Headers({
            'content-type': 'application/json',
          }),
          json: async () => ({ error: 'Rate limit exceeded' }),
        })
        .mockResolvedValueOnce({
          ok: true,
          status: 200,
          headers: new Headers({
            'content-type': 'application/json',
          }),
          json: async () => ({
            schemas: { location: '0x123' },
            chains: {},
            version: { api: '0.1.0', protocol: '0.1.0' },
          }),
        });

      // Mock timer
      jest.useFakeTimers();

      const client = new AstralApiClient();
      const configPromise = client.getConfig();

      // Fast-forward through backoff delays
      jest.advanceTimersByTime(3000); // 1s + 2s

      const config = await configPromise;

      expect(config).toEqual({
        schemas: { location: '0x123' },
        chains: {},
        version: { api: '0.1.0', protocol: '0.1.0' },
      });
      expect(fetchMock).toHaveBeenCalledTimes(3);

      jest.useRealTimers();
    }, 10000); // 10 second timeout
  });
});
