// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

/**
 * Unified AstralSDK v0.2.0
 *
 * Main entry point for the Astral SDK with namespaced location and compute modules.
 *
 * @example
 * ```typescript
 * const astral = new AstralSDK({
 *   chainId: 84532,
 *   signer: wallet,
 *   apiUrl: 'https://api.astral.global'
 * });
 *
 * // Location - offchain workflow
 * const attestation = await astral.location.offchain.create(input);
 * const verified = await astral.location.offchain.verify(attestation);
 *
 * // Location - onchain workflow
 * const onchain = await astral.location.onchain.create(input);
 *
 * // Compute
 * const distance = await astral.compute.distance(from, to, options);
 * await astral.compute.submit(distance.delegatedAttestation);
 * ```
 */

import { LocationModule } from './location';
import { ComputeModule } from './compute';
import { AstralConfig } from './core/types';

/**
 * AstralSDK is the unified entry point for the Astral SDK v0.2.0.
 *
 * It provides namespaced access to:
 * - `location`: Location attestation operations (offchain and onchain workflows)
 * - `compute`: Verifiable geospatial computations
 */
export class AstralSDK {
  /**
   * Location module for attestation operations
   */
  public readonly location: LocationModule;

  /**
   * Compute module for spatial operations
   */
  public readonly compute: ComputeModule;

  /**
   * Creates a new unified AstralSDK instance.
   *
   * @param config - Configuration options for the SDK
   *
   * @example
   * ```typescript
   * const astral = new AstralSDK({
   *   chainId: 84532,
   *   signer: wallet,
   *   apiUrl: 'https://api.astral.global'
   * });
   * ```
   */
  constructor(config: AstralConfig) {
    // Initialize LocationModule
    this.location = new LocationModule({
      chainId: config.chainId,
      signer: config.signer,
      provider: config.provider,
      debug: config.debug,
      defaultChain: config.defaultChain,
      schemas: config.schemas,
      defaultSchema: config.defaultSchema,
      strictSchemaValidation: config.strictSchemaValidation,
    });

    // Initialize ComputeModule
    this.compute = new ComputeModule({
      apiUrl: config.apiUrl ?? 'https://api.astral.global',
      chainId: config.chainId,
      signer: config.signer,
    });
  }
}
