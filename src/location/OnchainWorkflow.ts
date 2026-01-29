// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

/**
 * OnchainWorkflow handles onchain attestation operations
 */

import { OnchainRegistrar } from '../eas/OnchainRegistrar';
import {
  LocationConfig,
  UnsignedLocationAttestation,
  OnchainLocationAttestation,
  VerificationResult,
  OnchainAttestationOptions,
  RuntimeSchemaConfig,
} from '../core/types';
import { ValidationError } from '../core/errors';
import { getChainId, getChainName, getSchemaUID, getSchemaString } from '../eas/chains';

/**
 * OnchainWorkflow provides methods for onchain location attestations
 */
export class OnchainWorkflow {
  private readonly config: LocationConfig;
  private onchainRegistrar?: OnchainRegistrar;
  private readonly defaultSchema: RuntimeSchemaConfig;

  constructor(config: LocationConfig) {
    this.config = config;

    // Determine default schema
    if (config.defaultSchema) {
      this.defaultSchema = config.defaultSchema;
    } else {
      const chainId = config.chainId || getChainId(config.defaultChain || 'sepolia');
      this.defaultSchema = {
        uid: getSchemaUID(chainId),
        rawString: getSchemaString(),
      };
    }

    // Initialize OnchainRegistrar if we have a provider or signer
    if (config.provider || config.signer) {
      this.initializeOnchainRegistrar();
    }
  }

  private initializeOnchainRegistrar(): void {
    let chain: string;
    if (this.config.chainId) {
      chain = getChainName(this.config.chainId);
    } else {
      chain = this.config.defaultChain || 'sepolia';
    }

    this.onchainRegistrar = new OnchainRegistrar({
      provider: this.config.provider,
      signer: this.config.signer,
      chain,
    });
  }

  private ensureOnchainRegistrarInitialized(options?: OnchainAttestationOptions): void {
    if (!this.onchainRegistrar) {
      if (options && (options.provider || options.signer)) {
        this.onchainRegistrar = new OnchainRegistrar({
          provider: options.provider || this.config.provider,
          signer: options.signer || this.config.signer,
          chain: options.chain || this.config.defaultChain || 'sepolia',
        });
      } else {
        throw new ValidationError(
          'No provider or signer available for onchain operations.',
          undefined,
          { config: this.config, options }
        );
      }
    }
  }

  private resolveSchema(options?: { schema?: RuntimeSchemaConfig }): RuntimeSchemaConfig {
    return options?.schema || this.defaultSchema;
  }

  /**
   * Creates an onchain location attestation (combines build + register)
   */
  async create(
    input: import('../core/types').LocationAttestationInput,
    options?: OnchainAttestationOptions,
    buildFn?: (
      input: import('../core/types').LocationAttestationInput
    ) => Promise<UnsignedLocationAttestation>
  ): Promise<OnchainLocationAttestation> {
    if (!buildFn) {
      throw new ValidationError('Build function is required for create operation');
    }
    const unsigned = await buildFn(input);
    return this.register(unsigned, options);
  }

  /**
   * Registers an unsigned location attestation on-chain
   */
  async register(
    unsigned: UnsignedLocationAttestation,
    options?: OnchainAttestationOptions
  ): Promise<OnchainLocationAttestation> {
    this.ensureOnchainRegistrarInitialized(options);
    const schema = this.resolveSchema(options);
    const optionsWithSchema: OnchainAttestationOptions = { ...options, schema };
    return await this.onchainRegistrar!.registerOnchainLocationAttestation(
      unsigned,
      optionsWithSchema
    );
  }

  /**
   * Verifies an onchain location attestation
   */
  async verify(
    attestation: OnchainLocationAttestation,
    options?: OnchainAttestationOptions
  ): Promise<VerificationResult> {
    try {
      this.ensureOnchainRegistrarInitialized(options);
      return await this.onchainRegistrar!.verifyOnchainLocationAttestation(attestation);
    } catch (error) {
      return {
        isValid: false,
        attestation,
        reason: error instanceof Error ? error.message : 'Unknown verification error',
      };
    }
  }

  /**
   * Revokes an onchain location attestation
   */
  async revoke(
    attestation: OnchainLocationAttestation,
    options?: OnchainAttestationOptions
  ): Promise<unknown> {
    this.ensureOnchainRegistrarInitialized(options);

    if (!attestation.revocable) {
      throw new ValidationError('This location attestation is not revocable', undefined, {
        attestation,
      });
    }
    if (attestation.revoked) {
      throw new ValidationError('This location attestation is already revoked', undefined, {
        attestation,
      });
    }

    return await this.onchainRegistrar!.revokeOnchainLocationAttestation(attestation);
  }
}
