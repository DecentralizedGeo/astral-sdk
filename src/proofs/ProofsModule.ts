// Copyright © 2025 Sophia Systems Corporation

/**
 * ProofsModule — proof construction and verification
 *
 * Bundles a location claim with one or more stamps into a LocationProof,
 * and verifies proofs by evaluating stamp credibility and correlation.
 */

import { PluginRegistry } from '../plugins/registry';
import type { AstralApiClient } from '../api/AstralApiClient';
import type { VerifyProofOptions } from '../api/AstralApiClient';
import type {
  LocationClaim,
  LocationStamp,
  LocationProof,
  LocationData,
  StampVerificationResult,
  CredibilityVector,
  VerifiedLocationProof,
  StampResult,
} from '../plugins/types';

// Earth radius in meters for haversine calculation
const EARTH_RADIUS_M = 6_371_000;

/**
 * Haversine distance between two GeoJSON-ordered [lon, lat] points in meters.
 */
function haversineDistance(lon1: number, lat1: number, lon2: number, lat2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.sqrt(a));
}

/**
 * Compute overlap ratio between two time intervals.
 * Returns 0 if no overlap, 1 if one fully contains the other.
 */
function temporalOverlap(
  a: { start: number; end: number },
  b: { start: number; end: number }
): number {
  const overlapStart = Math.max(a.start, b.start);
  const overlapEnd = Math.min(a.end, b.end);
  if (overlapEnd <= overlapStart) return 0;
  const overlap = overlapEnd - overlapStart;
  const shorter = Math.min(a.end - a.start, b.end - b.start);
  return shorter > 0 ? overlap / shorter : 0;
}

/**
 * Extract [lon, lat] from a LocationData value, or null if not extractable.
 * Returns GeoJSON coordinate order.
 */
function extractCoordinates(location: LocationData): [number, number] | null {
  if (typeof location !== 'object' || location === null || !('coordinates' in location))
    return null;
  const coords = location.coordinates as unknown;
  if (!Array.isArray(coords) || coords.length < 2) return null;
  const lon = coords[0];
  const lat = coords[1];
  if (typeof lon !== 'number' || !Number.isFinite(lon)) return null;
  if (typeof lat !== 'number' || !Number.isFinite(lat)) return null;
  return [lon, lat];
}

/**
 * ProofsModule provides proof construction and verification.
 *
 * Usage:
 * ```typescript
 * const proof = astral.proofs.create(claim, [stamp1, stamp2]);
 * const vector = await astral.proofs.verify(proof);
 * ```
 */
export class ProofsModule {
  constructor(
    private readonly registry: PluginRegistry,
    private readonly apiClient?: AstralApiClient
  ) {}

  /**
   * Example weighting function: Basic support ratio.
   *
   * Returns the fraction of stamps that pass all validity checks, are spatially
   * relevant, and have temporal overlap. This is a simple example — applications
   * should design weighting functions based on their trust models.
   *
   * @example
   * ```typescript
   * const vector = await proofs.verify(proof);
   * const score = ProofsModule.exampleWeighting(vector);
   *
   * if (score >= 0.8 && vector.meta.stampCount >= 2) {
   *   console.log('High confidence with multi-source evidence');
   * }
   * ```
   */
  static exampleWeighting(vector: CredibilityVector): number {
    const { dimensions } = vector;

    // All validity checks must pass
    if (dimensions.validity.signaturesValidFraction < 1.0) return 0;
    if (dimensions.validity.structureValidFraction < 1.0) return 0;
    if (dimensions.validity.signalsConsistentFraction < 1.0) return 0;

    // Combine spatial and temporal relevance
    return (dimensions.spatial.withinRadiusFraction + dimensions.temporal.meanOverlap) / 2;
  }

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

  /**
   * Verify and evaluate a proof: verify each stamp, measure alignment with claim,
   * analyze correlation between stamps (for multi-stamp proofs), and compute
   * credibility vector.
   *
   * The correlation analysis is critical for multifactor proofs — combining stamps
   * from different PoL systems (ProofMode device sensors + WitnessChain network
   * latency) provides stronger evidence than a single source. Independence and
   * agreement between diverse evidence sources increases confidence.
   *
   * @param proof - The proof to verify
   * @param options - Verification options
   * @param options.mode - Where to run verification:
   *   - 'local' (default): Run in current environment, returns CredibilityVector
   *   - 'tee': Run in TEE via hosted service, returns VerifiedLocationProof with EAS attestation
   *   - 'zk': Run in ZK prover (future)
   * @param options.chainId - Chain ID for EAS attestation (TEE mode only)
   * @param options.submitOnchain - Submit attestation onchain (TEE mode only)
   * @param options.schema - EAS schema UID override (TEE mode only)
   * @param options.recipient - Attestation recipient address (TEE mode only)
   * @returns CredibilityVector for local mode, VerifiedLocationProof for TEE mode.
   *   Use `isVerifiedLocationProof()` to narrow the return type.
   *
   * @example
   * ```typescript
   * // Verify locally first (free, fast)
   * const local = await proofs.verify(proof);
   * if (local.dimensions.spatial.withinRadiusFraction < 0.8) return;
   *
   * // Then get TEE attestation (API key optional, throttled without one)
   * const result = await proofs.verify(proof, { mode: 'tee' });
   * if (isVerifiedLocationProof(result)) {
   *   console.log('EAS attestation:', result.attestation.uid);
   * }
   * ```
   */
  async verify(
    proof: LocationProof,
    options: { mode: 'tee' } & VerifyProofOptions
  ): Promise<VerifiedLocationProof>;
  async verify(
    proof: LocationProof,
    options?: { mode?: 'local' | 'zk' }
  ): Promise<CredibilityVector>;
  async verify(
    proof: LocationProof,
    options?: { mode?: 'local' | 'tee' | 'zk' } & VerifyProofOptions
  ): Promise<CredibilityVector | VerifiedLocationProof> {
    const mode = options?.mode ?? 'local';

    if (mode === 'tee') {
      if (!this.apiClient) {
        throw new Error(
          'TEE verification requires a hosted service connection. ' +
            'Use AstralSDK (which configures this automatically) or pass an AstralApiClient.'
        );
      }
      const { chainId, submitOnchain, schema, recipient } = options ?? {};
      return this.apiClient.verifyProof(proof, {
        chainId,
        submitOnchain,
        schema,
        recipient,
      });
    }
    if (mode === 'zk') {
      throw new Error('ZK verification not yet implemented');
    }

    // Local verification
    const stampResults = await Promise.all(
      proof.stamps.map(async (s, i) => {
        const plugin = this.registry.get(s.plugin);

        if (!plugin.verify) {
          throw new Error(
            `Plugin '${plugin.name}' does not implement verify() - cannot verify stamp at index ${i}`
          );
        }

        let verification: StampVerificationResult;
        try {
          verification = await plugin.verify(s);
        } catch (error) {
          throw new Error(
            `Plugin '${plugin.name}' verify() failed for stamp at index ${i}: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }

        const measurements = this.measure(s, proof.claim);

        return {
          stampIndex: i,
          plugin: s.plugin,
          signaturesValid: verification.signaturesValid,
          structureValid: verification.structureValid,
          signalsConsistent: verification.signalsConsistent,
          distanceMeters: measurements.distanceMeters,
          temporalOverlap: measurements.temporalOverlap,
          withinRadius: measurements.withinRadius,
          details: {
            verification: verification.details,
            effectiveRadiusMeters: measurements.effectiveRadiusMeters,
          },
        } satisfies StampResult;
      })
    );

    // Compute multidimensional credibility assessment
    const dimensions = this.computeDimensions(stampResults);

    return {
      dimensions,
      stampResults,
      meta: {
        stampCount: stampResults.length,
        evaluatedAt: Math.floor(Date.now() / 1000),
        evaluationMode: mode,
      },
    };
  }

  /**
   * Measure spatial and temporal alignment between a stamp and a claim.
   * Returns raw measurements, no opinionated scoring.
   */
  private measure(
    stamp: LocationStamp,
    claim: LocationClaim
  ): {
    distanceMeters: number;
    temporalOverlap: number;
    withinRadius: boolean;
    effectiveRadiusMeters: number;
  } {
    const stampCoords = extractCoordinates(stamp.location);
    const claimCoords = extractCoordinates(claim.location);

    if (!stampCoords || !claimCoords) {
      return {
        distanceMeters: Infinity,
        temporalOverlap: 0,
        withinRadius: false,
        effectiveRadiusMeters: claim.radius,
      };
    }

    const distance = haversineDistance(
      stampCoords[0],
      stampCoords[1],
      claimCoords[0],
      claimCoords[1]
    );
    const accuracyMeters = (stamp.signals?.accuracyMeters as number | undefined) ?? 0;
    const effectiveRadius = claim.radius + accuracyMeters;

    return {
      distanceMeters: Math.round(distance),
      temporalOverlap: temporalOverlap(stamp.temporalFootprint, claim.time),
      withinRadius: distance <= effectiveRadius,
      effectiveRadiusMeters: effectiveRadius,
    };
  }

  /**
   * Compute multidimensional credibility assessment.
   *
   * Each dimension is independently quantifiable from stamp data.
   * Applications apply their own weighting schemes to make trust decisions.
   *
   * v0 dimensions: spatial, temporal, validity, independence
   * Future: economic security, decentralization, freshness, source reputation
   */
  private computeDimensions(results: StampResult[]): CredibilityVector['dimensions'] {
    if (results.length === 0) {
      // Return zero values for empty proofs
      return {
        spatial: {
          meanDistanceMeters: Infinity,
          maxDistanceMeters: Infinity,
          withinRadiusFraction: 0,
        },
        temporal: {
          meanOverlap: 0,
          minOverlap: 0,
          fullyOverlappingFraction: 0,
        },
        validity: {
          signaturesValidFraction: 0,
          structureValidFraction: 0,
          signalsConsistentFraction: 0,
        },
        independence: {
          uniquePluginRatio: 0,
          spatialAgreement: 0,
          pluginNames: [],
        },
      };
    }

    // Spatial dimension
    const distances = results.map(r => r.distanceMeters).filter(d => d !== Infinity);
    const meanDistanceMeters =
      distances.length > 0 ? distances.reduce((sum, d) => sum + d, 0) / distances.length : Infinity;
    const maxDistanceMeters = distances.length > 0 ? Math.max(...distances) : Infinity;
    const withinRadiusCount = results.filter(r => r.withinRadius).length;
    const withinRadiusFraction = withinRadiusCount / results.length;

    // Temporal dimension
    const overlaps = results.map(r => r.temporalOverlap);
    const meanOverlap = overlaps.reduce((sum, o) => sum + o, 0) / overlaps.length;
    const minOverlap = Math.min(...overlaps);
    const fullyOverlappingCount = overlaps.filter(o => o === 1.0).length;
    const fullyOverlappingFraction = fullyOverlappingCount / results.length;

    // Validity dimension
    const signaturesValidCount = results.filter(r => r.signaturesValid).length;
    const structureValidCount = results.filter(r => r.structureValid).length;
    const signalsConsistentCount = results.filter(r => r.signalsConsistent).length;

    // Independence dimension
    const uniquePlugins = new Set(results.map(r => r.plugin));
    const uniquePluginRatio = uniquePlugins.size / results.length;
    const withinRadiusAgree = results.filter(r => r.withinRadius).length;
    const majority = Math.max(withinRadiusAgree, results.length - withinRadiusAgree);
    const spatialAgreement = majority / results.length;
    const pluginNames = Array.from(uniquePlugins);

    return {
      spatial: {
        meanDistanceMeters: Math.round(meanDistanceMeters),
        maxDistanceMeters: Math.round(maxDistanceMeters),
        withinRadiusFraction,
      },
      temporal: {
        meanOverlap,
        minOverlap,
        fullyOverlappingFraction,
      },
      validity: {
        signaturesValidFraction: signaturesValidCount / results.length,
        structureValidFraction: structureValidCount / results.length,
        signalsConsistentFraction: signalsConsistentCount / results.length,
      },
      independence: {
        uniquePluginRatio,
        spatialAgreement,
        pluginNames,
      },
    };
  }
}
