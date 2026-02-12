// Copyright © 2026 Sophia Systems Corporation

/**
 * ProofsModule — proof construction and verification
 *
 * Bundles a location claim with one or more stamps into a LocationProof,
 * and verifies proofs by evaluating stamp credibility and correlation.
 */

import { PluginRegistry } from '../plugins/registry';
import type {
  LocationClaim,
  LocationStamp,
  LocationProof,
  LocationData,
  StampVerificationResult,
  CredibilityVector,
  StampResult,
  CorrelationAssessment,
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
  if (typeof location !== 'object' || !('coordinates' in location)) return null;
  const coords = location.coordinates as unknown;
  if (!Array.isArray(coords) || coords.length < 2) return null;
  return [coords[0] as number, coords[1] as number];
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
  constructor(private readonly registry: PluginRegistry) {}

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
   *   - 'local' (default): Run in current environment
   *   - 'tee': Run in TEE via hosted service (returns EAS attestation)
   *   - 'zk': Run in ZK prover (future)
   * @returns Credibility vector with confidence score, stamp results, and correlation analysis
   */
  async verify(
    proof: LocationProof,
    options?: { mode?: 'local' | 'tee' | 'zk' }
  ): Promise<CredibilityVector> {
    const mode = options?.mode ?? 'local';

    if (mode === 'tee') {
      throw new Error('TEE verification not yet implemented');
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

    // NOTE: Correlation and confidence scoring here is a v0 placeholder.
    // In practice, evaluating cross-correlation of evidence from different PoL
    // systems is verifier-specific — different consumers place different value
    // on different proof sources. Future versions will support pluggable
    // evaluation strategies.
    const correlation = proof.stamps.length > 1 ? this.analyzeCorrelation(stampResults) : undefined;

    const confidence = this.computeConfidence(stampResults);

    return {
      confidence,
      stampResults,
      correlation,
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
   * Analyze cross-correlation between stamps from different plugins.
   *
   * Independence: uniquePlugins / totalStamps.
   * Agreement: do stamps agree on whether they're within the claim radius?
   */
  private analyzeCorrelation(results: StampResult[]): CorrelationAssessment {
    const uniquePlugins = new Set(results.map(r => r.plugin));
    const independence = uniquePlugins.size / results.length;

    // Agreement: fraction of stamps that agree on withinRadius
    const withinCount = results.filter(r => r.withinRadius).length;
    const majority = Math.max(withinCount, results.length - withinCount);
    const agreement = majority / results.length;

    const notes: string[] = [];
    if (independence === 1) {
      notes.push('All stamps from independent plugins');
    } else if (independence < 0.5) {
      notes.push('Most stamps from the same plugin — limited independence');
    }
    if (agreement === 1) {
      notes.push('All stamps agree on spatial relevance');
    }

    return { independence, agreement, notes };
  }

  /**
   * Confidence = fraction of verified stamps that support the claim.
   *
   * A stamp "supports" if it verified, is within the claim radius,
   * and has temporal overlap. No weighting, caps, or bonuses.
   */
  private computeConfidence(results: StampResult[]): number {
    if (results.length === 0) return 0;

    const supporting = results.filter(
      r =>
        r.signaturesValid &&
        r.structureValid &&
        r.signalsConsistent &&
        r.withinRadius &&
        r.temporalOverlap > 0
    );

    return supporting.length / results.length;
  }
}
