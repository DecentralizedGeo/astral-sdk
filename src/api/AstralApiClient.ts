/**
 * AstralApiClient for Astral SDK
 *
 * This module provides communication with the Astral API for retrieving
 * location proofs and other operations like fetching configuration.
 */

import { AstralAPIError, NotFoundError } from '../core/errors';
import { LocationProof, LocationProofCollection, ProofQuery } from '../core/types';

/**
 * Configuration options for the AstralApiClient
 */
interface AstralApiClientConfig {
  baseURL?: string;
  apiKey?: string;
  timeout?: number;
}

/**
 * Configuration response from the Astral API
 */
export interface AstralApiConfig {
  /** Schema UIDs for various attestation types */
  schemas: {
    location: string;
    media?: string;
    recipe?: string;
  };
  /** Supported chains and their configurations */
  chains: {
    [chainId: string]: {
      name: string;
      contracts: {
        eas: string;
        schemaRegistry: string;
      };
    };
  };
  /** API version information */
  version: {
    api: string;
    protocol: string;
  };
  /** Feature flags for the API */
  features?: {
    [featureName: string]: boolean;
  };
}

/**
 * AstralApiClient handles communication with the Astral API
 * for retrieving proofs and configuration.
 */
export class AstralApiClient {
  private readonly baseURL: string;
  private readonly apiKey?: string;
  private readonly timeout: number;
  private configCache?: AstralApiConfig;

  /**
   * Creates a new AstralApiClient instance.
   *
   * @param configOrBaseURL - Configuration options or base URL string
   * @param apiKey - Optional API key for authentication (when first param is string)
   */
  constructor(configOrBaseURL?: AstralApiClientConfig | string, apiKey?: string) {
    // Default configuration
    this.baseURL = 'https://api.astral.global';
    this.timeout = 30000; // 30 seconds default timeout
    this.apiKey = undefined;

    // Process configuration
    if (typeof configOrBaseURL === 'string') {
      this.baseURL = configOrBaseURL;
      this.apiKey = apiKey;
    } else if (configOrBaseURL) {
      this.baseURL = configOrBaseURL.baseURL || this.baseURL;
      this.apiKey = configOrBaseURL.apiKey;
      this.timeout = configOrBaseURL.timeout || this.timeout;
    }

    // Ensure baseURL doesn't end with a slash
    this.baseURL = this.baseURL.endsWith('/') ? this.baseURL.slice(0, -1) : this.baseURL;
  }

  /**
   * Makes a request to the Astral API.
   *
   * @param method - HTTP method (GET, POST, etc.)
   * @param path - API endpoint path
   * @param data - Optional request data (for POST, PUT requests)
   * @param queryParams - Optional query parameters
   * @returns The parsed response data
   * @throws AstralAPIError if the request fails
   * @private
   */
  private async request<T>(
    method: string,
    path: string,
    data?: unknown,
    queryParams?: Record<string, string | number | boolean | undefined>
  ): Promise<T> {
    // Build URL with query parameters
    let url = `${this.baseURL}${path}`;

    if (queryParams) {
      const params = new URLSearchParams();
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, String(value));
        }
      });

      let queryString = params.toString();

      // Fix over-encoding of comma-separated values (bbox, attester)
      // URLSearchParams encodes commas, but our API expects them unencoded
      queryString = queryString.replace(/%2C/g, ',');

      if (queryString) {
        url += `?${queryString}`;
      }
    }

    // Prepare request options
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      // Timeout is not directly supported in RequestInit, but will be handled by the fetch polyfill or wrapper
      // in real implementations, either via signal or through wrapper libraries
    };

    // Add API key if available
    if (this.apiKey) {
      (options.headers as Record<string, string>)['Authorization'] = `Bearer ${this.apiKey}`;
    }

    // Add request body for non-GET requests
    if (method !== 'GET' && data !== undefined) {
      options.body = JSON.stringify(data);
    }

    try {
      // Make the request with exponential backoff for rate limiting
      let retries = 3;
      let delay = 1000; // Start with 1 second delay

      while (retries >= 0) {
        try {
          const response = await fetch(url, options);

          // If rate limited, retry with exponential backoff
          if (response.status === 429 && retries > 0) {
            retries--;
            await new Promise(resolve => setTimeout(resolve, delay));
            delay *= 2; // Exponential backoff
            continue;
          }

          // Handle 404 responses specially for resource not found
          if (response.status === 404) {
            const contentType = response.headers.get('content-type');
            let responseData: unknown;

            if (contentType && contentType.includes('application/json')) {
              responseData = await response.json();
            } else {
              responseData = await response.text();
            }

            throw new NotFoundError(`Resource not found: ${path}`, undefined, {
              path,
              response: responseData,
            });
          }

          // Parse response JSON
          let responseData: unknown;
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            responseData = await response.json();
          } else {
            responseData = await response.text();
          }

          // Handle error responses
          if (!response.ok) {
            throw AstralAPIError.fromResponse(response.status, response.statusText, responseData);
          }

          return responseData as T;
        } catch (error) {
          if (error instanceof AstralAPIError || error instanceof NotFoundError) {
            throw error;
          }
          if (retries <= 0) {
            throw new AstralAPIError(
              `API request failed: ${error instanceof Error ? error.message : String(error)}`,
              undefined,
              error instanceof Error ? error : undefined,
              { method, path, data }
            );
          }
          retries--;
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2;
        }
      }

      // This code should never be reached as the loop will either return or throw
      throw new AstralAPIError('API request failed with unknown error', undefined, undefined, {
        method,
        path,
        data,
      });
    } catch (error) {
      if (error instanceof AstralAPIError || error instanceof NotFoundError) {
        throw error;
      }

      throw new AstralAPIError(
        `API request failed: ${error instanceof Error ? error.message : String(error)}`,
        undefined,
        error instanceof Error ? error : undefined,
        { method, path, data }
      );
    }
  }

  /**
   * Maps API responses to the appropriate LocationProof type.
   *
   * @param response - The raw API response
   * @returns A properly typed LocationProof object
   * @private
   */
  private mapResponseToProof(response: unknown): LocationProof {
    // This is a placeholder implementation that will be enhanced in a future update
    // to properly distinguish between OffchainLocationProof and OnchainLocationProof
    // For now, we just cast to LocationProof and let consumers use type guards
    return response as LocationProof;
  }

  /**
   * Gets the Astral API configuration.
   *
   * @returns Configuration object with schema UIDs and supported chains
   */
  async getConfig(): Promise<AstralApiConfig> {
    // Return cached config if available to reduce API calls
    if (this.configCache) {
      return this.configCache;
    }

    const config = await this.request<AstralApiConfig>('GET', '/config');
    this.configCache = config;
    return config;
  }

  /**
   * Gets a single location proof by its UID.
   *
   * @param uid - The unique identifier of the proof
   * @returns The location proof if found
   * @throws NotFoundError if the proof doesn't exist
   */
  async getLocationProof(uid: string): Promise<LocationProof> {
    try {
      const response = await this.request<unknown>('GET', `/proofs/${uid}`);
      return this.mapResponseToProof(response);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw NotFoundError.forResource('LocationProof', uid);
      }
      throw error;
    }
  }

  /**
   * Gets a collection of location proofs matching the query criteria.
   *
   * @param query - Query parameters to filter proofs
   * @returns A collection of location proofs
   */
  async getLocationProofs(query?: ProofQuery): Promise<LocationProofCollection> {
    // Build query parameters from the ProofQuery object
    const queryParams: Record<string, string | number | boolean | undefined> = {};

    if (query) {
      if (query.uid) queryParams.uid = query.uid;
      if (query.chain) queryParams.chain = query.chain;
      if (query.limit) queryParams.limit = query.limit;
      if (query.offset !== undefined) queryParams.offset = query.offset; // Include offset=0

      // Handle arrays and complex types
      if (query.attester && query.attester.length > 0) {
        queryParams.attester = query.attester.join(',');
      }

      // Handle bbox as comma-separated list
      if (query.bbox) {
        queryParams.bbox = query.bbox.join(',');
      }

      // Handle time range as ISO strings
      if (query.timeRange) {
        queryParams.startTime = query.timeRange[0].toISOString();
        queryParams.endTime = query.timeRange[1].toISOString();
      }
    }

    // Make the request
    const apiResponse = await this.request<Record<string, unknown>>(
      'GET',
      '/proofs',
      undefined,
      queryParams
    );

    // Map the proof objects and create a properly typed response
    const proofs = Array.isArray(apiResponse.proofs)
      ? apiResponse.proofs.map((proof: unknown) => this.mapResponseToProof(proof))
      : [];

    // Create a new LocationProofCollection with mapped proofs
    const response: LocationProofCollection = {
      proofs,
      total: typeof apiResponse.total === 'number' ? apiResponse.total : proofs.length,
      pageSize: typeof apiResponse.pageSize === 'number' ? apiResponse.pageSize : proofs.length,
      currentPage: typeof apiResponse.currentPage === 'number' ? apiResponse.currentPage : 1,
      totalPages: typeof apiResponse.totalPages === 'number' ? apiResponse.totalPages : 1,
      hasNextPage: !!apiResponse.hasNextPage,
      hasPrevPage: !!apiResponse.hasPrevPage,
      query: query || ({} as ProofQuery),
    };

    return response;
  }

  /**
   * Publishes an offchain location proof to the Astral API.
   *
   * This is a placeholder method that will be implemented in a future update.
   *
   * @param proof - The signed offchain location proof to publish
   * @returns The published proof with updated publication records
   */
  async publishOffchainProof(proof: unknown): Promise<LocationProof> {
    // This is a placeholder implementation that will be completed in a future update
    throw new AstralAPIError(
      'The publishOffchainProof method is not yet implemented',
      501, // Not Implemented
      undefined,
      { proof }
    );
  }
}
