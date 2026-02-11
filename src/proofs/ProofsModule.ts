// Copyright © 2025 Sophia Systems Corporation

/**
 * ProofsModule — proof construction
 *
 * Bundles a location claim with one or more stamps into a LocationProof.
 * The proof is the artifact submitted for verification.
 */

import type { LocationClaim, LocationStamp, LocationProof } from '../plugins/types';

/**
 * ProofsModule provides proof construction from claims and stamps.
 *
 * Usage:
 * ```typescript
 * const proof = astral.proofs.create(claim, [stamp1, stamp2]);
 * ```
 */
export class ProofsModule {
  /**
   * Bundle a claim and stamps into a LocationProof.
   *
   * @param claim - The location claim to prove
   * @param stamps - One or more stamps providing evidence
   * @returns A LocationProof ready for verification
   */
  create(claim: LocationClaim, stamps: LocationStamp[]): LocationProof {
    if (stamps.length === 0) {
      throw new Error('At least one stamp is required to create a proof');
    }
    return { claim, stamps };
  }
}
