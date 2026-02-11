// Copyright © 2025 Sophia Systems Corporation

/**
 * VerifyModule — verification orchestration
 *
 * Delegates to plugin verify/evaluate methods for local verification,
 * or to the hosted service for TEE-attested verification.
 *
 * Local verification calls plugin code directly — same logic, no attestation.
 * Hosted verification calls the Astral service — adds a TEE attestation on top.
 */

import { PluginRegistry } from '../plugins/registry';
import type {
  LocationStamp,
  LocationProof,
  StampVerificationResult,
  CredibilityVector,
  CredibilityAssessment,
  StampResult,
  CorrelationAssessment,
  PluginMetadata,
} from '../plugins/types';

// Confidence scoring constants
const MAX_SINGLE_STAMP = 0.85;
const INVALID_PENALTY = 0.05;
const INDEPENDENCE_THRESHOLD = 0.5;
const INDEPENDENCE_BONUS_WEIGHT = 0.1;
const AGREEMENT_THRESHOLD = 0.7;
const AGREEMENT_BONUS_WEIGHT = 0.15;

export interface VerifyOptions {
  /** Use the hosted service instead of local verification. */
  hosted?: boolean;
  /** API URL for hosted verification. */
  apiUrl?: string;
}

/**
 * VerifyModule provides stamp and proof verification.
 *
 * Usage:
 * ```typescript
 * // Verify a single stamp
 * const result = await astral.verify.stamp(stamp);
 *
 * // Verify a full proof (claim + stamps)
 * const assessment = await astral.verify.proof(proof);
 *
 * // List available plugins
 * const plugins = astral.verify.plugins();
 * ```
 */
export class VerifyModule {
  constructor(private readonly registry: PluginRegistry) {}

  /**
   * Verify a stamp's internal validity using its plugin's verify method.
   */
  async stamp(stamp: LocationStamp, options?: VerifyOptions): Promise<StampVerificationResult> {
    if (options?.hosted) {
      throw new Error('Hosted verification not yet implemented — use local verification');
    }

    const plugin = this.registry.get(stamp.plugin);
    if (!plugin.verify) {
      throw new Error(`Plugin '${plugin.name}' does not implement verify()`);
    }
    return plugin.verify(stamp);
  }

  /**
   * Verify a full proof: verify each stamp, evaluate against the claim,
   * and compute a credibility assessment.
   */
  async proof(proof: LocationProof, options?: VerifyOptions): Promise<CredibilityAssessment> {
    if (options?.hosted) {
      throw new Error('Hosted verification not yet implemented — use local verification');
    }

    const stampResults: StampResult[] = [];

    for (let i = 0; i < proof.stamps.length; i++) {
      const s = proof.stamps[i];
      const plugin = this.registry.get(s.plugin);

      // Verify internal validity
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

      // Evaluate against claim
      let evaluation: CredibilityVector = {
        supportsClaim: false,
        score: 0,
        spatial: 0,
        temporal: 0,
        details: {},
      };
      if (plugin.evaluate) {
        try {
          evaluation = await plugin.evaluate(s, proof.claim);
        } catch (error) {
          throw new Error(
            `Plugin '${plugin.name}' evaluate() failed for stamp at index ${i}: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
      }

      stampResults.push({
        stampIndex: i,
        plugin: s.plugin,
        signaturesValid: verification.signaturesValid,
        structureValid: verification.structureValid,
        signalsConsistent: verification.signalsConsistent,
        supportsClaim: evaluation.supportsClaim,
        claimSupportScore: evaluation.score,
        pluginResult: {
          verification: verification.details,
          evaluation: evaluation.details,
          spatial: evaluation.spatial,
          temporal: evaluation.temporal,
        },
      });
    }

    const correlation = proof.stamps.length > 1 ? this.analyzeCorrelation(stampResults) : undefined;

    const confidence = this.computeConfidence(stampResults, correlation);

    return {
      confidence,
      stampResults,
      correlation,
    };
  }

  /**
   * List metadata for all registered plugins.
   */
  plugins(): PluginMetadata[] {
    return this.registry.list();
  }

  /**
   * Analyze cross-correlation between stamps from different plugins.
   *
   * Independence metric:
   * Measures source diversity as uniquePlugins / totalStamps.
   * - 1.0 = all stamps from different plugins (maximum independence)
   * - 0.5 = half the stamps are duplicates from the same plugin
   * - Lower values indicate correlated evidence sources
   *
   * Rationale: Independent evidence sources are more valuable than
   * multiple stamps from the same system, as they reduce systemic bias
   * and single points of failure.
   */
  private analyzeCorrelation(results: StampResult[]): CorrelationAssessment {
    const uniquePlugins = new Set(results.map(r => r.plugin));
    const independence = uniquePlugins.size / results.length;

    const validScores = results.filter(r => r.structureValid).map(r => r.claimSupportScore);

    let agreement = 0;
    if (validScores.length > 1) {
      const mean = validScores.reduce((a, b) => a + b, 0) / validScores.length;
      const variance =
        validScores.reduce((sum, s) => sum + (s - mean) ** 2, 0) / validScores.length;
      // Lower variance = higher agreement (1 - normalized variance)
      agreement = Math.max(0, 1 - Math.sqrt(variance));
    }

    const notes: string[] = [];
    if (independence === 1) {
      notes.push('All stamps from independent plugins');
    } else if (independence < 0.5) {
      notes.push('Most stamps from the same plugin — limited independence');
    }
    if (agreement > 0.8) {
      notes.push('Strong agreement between stamps');
    }

    return { independence, agreement, notes };
  }

  /**
   * Compute overall confidence from stamp results and correlation.
   */
  private computeConfidence(results: StampResult[], correlation?: CorrelationAssessment): number {
    const validResults = results.filter(r => r.structureValid && r.signaturesValid);
    if (validResults.length === 0) return 0;

    const avgScore =
      validResults.reduce((sum, r) => sum + r.claimSupportScore, 0) / validResults.length;

    let confidence = results.length === 1 ? Math.min(avgScore, MAX_SINGLE_STAMP) : avgScore;

    // Multi-stamp bonuses
    if (correlation) {
      if (correlation.independence > INDEPENDENCE_THRESHOLD) {
        confidence += correlation.independence * INDEPENDENCE_BONUS_WEIGHT;
      }
      if (correlation.agreement > AGREEMENT_THRESHOLD) {
        confidence += (correlation.agreement - AGREEMENT_THRESHOLD) * AGREEMENT_BONUS_WEIGHT;
      }
    }

    // Penalty for invalid stamps
    const invalidCount = results.length - validResults.length;
    confidence -= invalidCount * INVALID_PENALTY;

    return Math.max(0, Math.min(1, confidence));
  }
}
