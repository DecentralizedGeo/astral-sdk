// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

/**
 * Chain configurations for EAS integration
 *
 * This module loads chain configuration from config/EAS-config.json
 * and provides utilities for working with EAS contracts on different chains.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ChainConnectionError } from '../core/errors';

/**
 * Interface for EAS schema configuration
 */
export interface EASSchemaConfig {
  interface: Record<string, string>;
  rawString: string;
}

/**
 * Interface for EAS chain configuration
 */
export interface EASChainConfig {
  chain: string;
  deploymentBlock: number;
  rpcUrl: string;
  easContractAddress: string;
  schemaUID: string;
}

/**
 * Interface for version-specific EAS configuration
 */
export interface EASVersionConfig {
  schema: EASSchemaConfig;
  chains: Record<string, EASChainConfig>;
}

/**
 * Complete EAS configuration with version support
 */
export interface EASConfig {
  [version: string]: EASVersionConfig;
}

// Default path to the EAS configuration file
const CONFIG_PATH = path.resolve(process.cwd(), 'config', 'EAS-config.json');

// Cache the loaded configuration
let cachedConfig: EASConfig | null = null;

/**
 * Loads the EAS configuration from the config file
 *
 * @param configPath - Optional custom path to the config file
 * @returns The parsed EAS configuration
 * @throws {ChainConnectionError} If the config file cannot be loaded or parsed
 */
export function loadEASConfig(configPath: string = CONFIG_PATH): EASConfig {
  // Return cached config if available and not in test mode
  if (cachedConfig !== null && process.env.NODE_ENV !== 'test') {
    return cachedConfig;
  }

  try {
    // Read and parse the configuration file
    const configData = fs.readFileSync(configPath, 'utf-8');
    cachedConfig = JSON.parse(configData) as EASConfig;
    return cachedConfig;
  } catch (error) {
    throw new ChainConnectionError(
      `Failed to load EAS configuration from ${configPath}`,
      error instanceof Error ? error : undefined,
      { configPath }
    );
  }
}

/**
 * Gets the latest version of the EAS configuration
 *
 * @param config - The EAS configuration object
 * @returns The latest version configuration
 * @throws {ChainConnectionError} If no versions are available
 */
export function getLatestVersionConfig(config: EASConfig): EASVersionConfig {
  const versions = Object.keys(config).sort();

  if (versions.length === 0) {
    throw new ChainConnectionError('No EAS configuration versions available', undefined, {
      availableVersions: versions,
    });
  }

  // Return the latest version
  return config[versions[versions.length - 1]];
}

/**
 * Gets a specific version of the EAS configuration
 *
 * @param config - The EAS configuration object
 * @param version - The version to retrieve
 * @returns The specified version configuration
 * @throws {ChainConnectionError} If the requested version is not available
 */
export function getVersionConfig(config: EASConfig, version: string): EASVersionConfig {
  if (!config[version]) {
    const availableVersions = Object.keys(config);
    throw new ChainConnectionError(`EAS configuration version '${version}' not found`, undefined, {
      requestedVersion: version,
      availableVersions,
    });
  }

  return config[version];
}

/**
 * Gets the EAS configuration for a specific chain by chain ID
 *
 * @param chainId - The chain ID to retrieve configuration for
 * @param version - Optional specific version to use (defaults to latest)
 * @returns The chain configuration
 * @throws {ChainConnectionError} If the chain is not supported
 */
export function getChainConfig(chainId: number, version?: string): EASChainConfig {
  const config = loadEASConfig();
  const versionConfig = version
    ? getVersionConfig(config, version)
    : getLatestVersionConfig(config);

  const chainIdStr = chainId.toString();

  if (!versionConfig.chains[chainIdStr]) {
    const supportedChains = Object.keys(versionConfig.chains);
    throw new ChainConnectionError(
      `Chain ID ${chainId} is not supported by EAS configuration`,
      undefined,
      {
        requestedChainId: chainId,
        supportedChains,
        version: version || 'latest',
      }
    );
  }

  return versionConfig.chains[chainIdStr];
}

/**
 * Gets the EAS configuration for a specific chain by chain name
 *
 * @param chainName - The chain name to retrieve configuration for
 * @param version - Optional specific version to use (defaults to latest)
 * @returns The chain configuration
 * @throws {ChainConnectionError} If the chain is not supported
 */
export function getChainConfigByName(chainName: string, version?: string): EASChainConfig {
  const config = loadEASConfig();
  const versionConfig = version
    ? getVersionConfig(config, version)
    : getLatestVersionConfig(config);

  // Find the chain by name
  const chainEntry = Object.entries(versionConfig.chains).find(
    ([_, chainConfig]) => chainConfig.chain.toLowerCase() === chainName.toLowerCase()
  );

  if (!chainEntry) {
    const supportedChains = Object.values(versionConfig.chains).map(c => c.chain);
    throw new ChainConnectionError(
      `Chain '${chainName}' is not supported by EAS configuration`,
      undefined,
      {
        requestedChain: chainName,
        supportedChains,
        version: version || 'latest',
      }
    );
  }

  return chainEntry[1];
}

/**
 * Gets the chain ID for a chain name
 *
 * @param chainName - The chain name to get the ID for
 * @param version - Optional specific version to use (defaults to latest)
 * @returns The chain ID
 * @throws {ChainConnectionError} If the chain name is not supported
 */
export function getChainId(chainName: string, version?: string): number {
  const config = loadEASConfig();
  const versionConfig = version
    ? getVersionConfig(config, version)
    : getLatestVersionConfig(config);

  // Find the chain ID by name
  const chainEntry = Object.entries(versionConfig.chains).find(
    ([_, chainConfig]) => chainConfig.chain.toLowerCase() === chainName.toLowerCase()
  );

  if (!chainEntry) {
    const supportedChains = Object.values(versionConfig.chains).map(c => c.chain);
    throw new ChainConnectionError(
      `Chain '${chainName}' is not supported by EAS configuration`,
      undefined,
      {
        requestedChain: chainName,
        supportedChains,
        version: version || 'latest',
      }
    );
  }

  return parseInt(chainEntry[0], 10);
}

/**
 * Gets the chain name for a chain ID
 *
 * @param chainId - The chain ID to get the name for
 * @param version - Optional specific version to use (defaults to latest)
 * @returns The chain name
 * @throws {ChainConnectionError} If the chain ID is not supported
 */
export function getChainName(chainId: number, version?: string): string {
  const chainConfig = getChainConfig(chainId, version);
  return chainConfig.chain;
}

/**
 * Gets all supported chain IDs
 *
 * @param version - Optional specific version to use (defaults to latest)
 * @returns Array of supported chain IDs
 */
export function getSupportedChainIds(version?: string): number[] {
  const config = loadEASConfig();
  const versionConfig = version
    ? getVersionConfig(config, version)
    : getLatestVersionConfig(config);

  return Object.keys(versionConfig.chains)
    .map(id => parseInt(id, 10))
    .sort((a, b) => a - b);
}

/**
 * Gets all supported chain names
 *
 * @param version - Optional specific version to use (defaults to latest)
 * @returns Array of supported chain names
 */
export function getSupportedChainNames(version?: string): string[] {
  const config = loadEASConfig();
  const versionConfig = version
    ? getVersionConfig(config, version)
    : getLatestVersionConfig(config);

  return Object.values(versionConfig.chains)
    .map(chainConfig => chainConfig.chain)
    .sort();
}

/**
 * Gets the schema configuration for a specific version
 *
 * @param version - Optional specific version to use (defaults to latest)
 * @returns The schema configuration
 */
export function getSchemaConfig(version?: string): EASSchemaConfig {
  const config = loadEASConfig();
  const versionConfig = version
    ? getVersionConfig(config, version)
    : getLatestVersionConfig(config);

  return versionConfig.schema;
}

/**
 * Gets the schema UID for a specific chain
 *
 * @param chainIdOrName - The chain ID or name
 * @param version - Optional specific version to use (defaults to latest)
 * @returns The schema UID for the specified chain
 */
export function getSchemaUID(chainIdOrName: number | string, version?: string): string {
  const chainConfig =
    typeof chainIdOrName === 'number'
      ? getChainConfig(chainIdOrName, version)
      : getChainConfigByName(chainIdOrName, version);

  return chainConfig.schemaUID;
}

/**
 * Gets the raw schema string for use with SchemaEncoder
 *
 * @param version - Optional specific version to use (defaults to latest)
 * @returns The raw schema string for the SchemaEncoder
 * @throws {ChainConnectionError} If schema string is not found
 */
export function getSchemaString(version?: string): string {
  const schemaConfig = getSchemaConfig(version);

  if (!schemaConfig.rawString) {
    throw new ChainConnectionError('Schema string not found in configuration', undefined, {
      version: version || 'latest',
    });
  }

  return schemaConfig.rawString;
}

/**
 * Default export for convenience
 */
export default {
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
  getSchemaString,
};
