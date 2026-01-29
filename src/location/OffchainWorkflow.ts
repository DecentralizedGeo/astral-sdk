// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

/**
 * OffchainWorkflow handles offchain attestation operations
 */

import { OffchainSigner } from '../eas/OffchainSigner';
import {
  LocationConfig,
  UnsignedLocationAttestation,
  OffchainLocationAttestation,
  VerificationResult,
  OffchainAttestationOptions,
  RuntimeSchemaConfig,
} from '../core/types';
import { ValidationError } from '../core/errors';
import { getChainId, getSchemaUID, getSchemaString } from '../eas/chains';

/**
 * OffchainWorkflow provides methods for offchain location attestations
 */
export class OffchainWorkflow {
  private readonly config: LocationConfig;
  private offchainSigner?: OffchainSigner;
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

    // Initialize OffchainSigner if we have a signer
    if (config.signer) {
      this.initializeOffchainSigner();
    }
  }

  private initializeOffchainSigner(): void {
    const chainId = this.config.chainId || getChainId(this.config.defaultChain || 'sepolia');
    this.offchainSigner = new OffchainSigner({
      signer: this.config.signer,
      chainId,
    });
  }

  private ensureOffchainSignerInitialized(options?: OffchainAttestationOptions): void {
    if (!this.offchainSigner) {
      if (options && (options.signer || options.privateKey)) {
        const chainId = this.config.chainId || getChainId(this.config.defaultChain || 'sepolia');
        this.offchainSigner = new OffchainSigner({
          signer: options.signer,
          privateKey: options.privateKey,
          chainId,
        });
      } else {
        throw new ValidationError(
          'No signer available for offchain operations. Provide a signer in SDK constructor or options.',
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
   * Creates an offchain location attestation (combines build + sign)
   */
  async create(
    input: import('../core/types').LocationAttestationInput,
    options?: OffchainAttestationOptions,
    buildFn?: (
      input: import('../core/types').LocationAttestationInput
    ) => Promise<UnsignedLocationAttestation>
  ): Promise<OffchainLocationAttestation> {
    if (!buildFn) {
      throw new ValidationError('Build function is required for create operation');
    }
    const unsigned = await buildFn(input);
    return this.sign(unsigned, options);
  }

  /**
   * Signs an unsigned location attestation using EIP-712 signatures
   */
  async sign(
    unsigned: UnsignedLocationAttestation,
    options?: OffchainAttestationOptions
  ): Promise<OffchainLocationAttestation> {
    this.ensureOffchainSignerInitialized(options);
    const schema = this.resolveSchema(options);
    return await this.offchainSigner!.signOffchainLocationAttestation(unsigned, schema);
  }

  /**
   * Verifies an offchain location attestation's signature
   */
  async verify(
    attestation: OffchainLocationAttestation,
    options?: OffchainAttestationOptions
  ): Promise<VerificationResult> {
    try {
      this.ensureOffchainSignerInitialized(options);
      return await this.offchainSigner!.verifyOffchainLocationAttestation(attestation);
    } catch (error) {
      return {
        isValid: false,
        attestation,
        reason: error instanceof Error ? error.message : 'Unknown verification error',
      };
    }
  }

  /**
   * Publishes an offchain location attestation to storage
   */
  async publish(attestation: OffchainLocationAttestation): Promise<OffchainLocationAttestation> {
    // Placeholder - will integrate with storage adapters
    return attestation;
  }
}
