/**
 * AstralApiClient for Astral SDK
 *
 * This module provides communication with the Astral API for retrieving
 * location proofs and other operations like fetching configuration.
 */

import { AstralAPIError } from '../core/errors';

/**
 * Configuration options for the AstralApiClient
 */
interface AstralApiClientConfig {
  baseURL?: string;
  apiKey?: string;
  timeout?: number;
}

/**
 * AstralApiClient handles communication with the Astral API
 * for retrieving proofs and configuration.
 */
export class AstralApiClient {
  private readonly baseURL: string;
  private readonly apiKey?: string;
  private readonly timeout: number;

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

      const queryString = params.toString();
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
          if (error instanceof AstralAPIError) {
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
      if (error instanceof AstralAPIError) {
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
   * Gets the Astral API configuration.
   *
   * This is a placeholder method that will be implemented in a future update.
   *
   * @returns Configuration object with schema UIDs and supported chains
   */
  async getConfig(): Promise<Record<string, unknown>> {
    return this.request<Record<string, unknown>>('GET', '/config');
  }
}
