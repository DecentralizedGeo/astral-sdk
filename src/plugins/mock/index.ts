// Copyright © 2025 Sophia Systems Corporation

/**
 * Mock Location Proof Plugin
 *
 * A complete LocationProofPlugin implementation for testing and development.
 * All five methods, real ECDSA crypto, configurable behavior.
 *
 * Usage:
 * ```typescript
 * import { MockPlugin } from '@decentralized-geo/astral-sdk/plugins';
 *
 * const mock = new MockPlugin({
 *   location: { lat: 40.7484, lon: -73.9857 },
 *   jitterMeters: 10,
 * });
 *
 * const astral = new AstralSDK({ chainId: 84532 });
 * astral.registry.register(mock);
 * ```
 */

import { ethers } from 'ethers';
import type {
  LocationProofPlugin,
  Runtime,
  CollectOptions,
  RawSignals,
  UnsignedLocationStamp,
  LocationStamp,
  StampSigner,
  LocationClaim,
  StampVerificationResult,
  CredibilityVector,
} from '../types';

export interface MockPluginOptions {
  /** Default latitude (default: 40.7484 — Empire State Building) */
  lat?: number;
  /** Default longitude (default: -73.9857) */
  lon?: number;
  /** Random jitter radius in meters (default: 0) */
  jitterMeters?: number;
  /** Simulated accuracy in meters (default: 10) */
  accuracy?: number;
  /** Override timestamp (Unix seconds). If omitted, uses current time. */
  timestamp?: number;
  /** Duration of temporal footprint in seconds (default: 60) */
  durationSeconds?: number;
  /** Deterministic private key for signing. If omitted, generates a random wallet. */
  privateKey?: string;
}

// Earth radius in meters for haversine calculation
const EARTH_RADIUS_M = 6_371_000;

/**
 * Haversine distance between two lat/lon points in meters.
 */
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

export class MockPlugin implements LocationProofPlugin {
  readonly name = 'mock';
  readonly version = '0.1.0';
  readonly runtimes: Runtime[] = ['react-native', 'node', 'browser'];
  readonly requiredCapabilities: string[] = [];
  readonly description = 'Mock plugin for testing and development';

  private readonly options: Required<Omit<MockPluginOptions, 'privateKey' | 'timestamp'>> & {
    timestamp?: number;
  };
  private readonly wallet: ethers.Wallet | ethers.HDNodeWallet;

  constructor(options: MockPluginOptions = {}) {
    this.options = {
      lat: options.lat ?? 40.7484,
      lon: options.lon ?? -73.9857,
      jitterMeters: options.jitterMeters ?? 0,
      accuracy: options.accuracy ?? 10,
      durationSeconds: options.durationSeconds ?? 60,
      timestamp: options.timestamp,
    };
    this.wallet = options.privateKey
      ? new ethers.Wallet(options.privateKey)
      : ethers.Wallet.createRandom();
  }

  /**
   * Collect fake signals. Applies optional jitter to the configured location.
   */
  async collect(options?: CollectOptions): Promise<RawSignals> {
    let { lat, lon } = this.options;

    // Apply jitter if configured
    if (this.options.jitterMeters > 0) {
      const jitterDeg = this.options.jitterMeters / 111_320; // Rough meters-to-degrees
      lat += (Math.random() - 0.5) * 2 * jitterDeg;
      lon += (Math.random() - 0.5) * 2 * jitterDeg;
    }

    const now = this.options.timestamp ?? Math.floor(Date.now() / 1000);
    const accuracy =
      options?.accuracy === 'high' ? this.options.accuracy / 2 : this.options.accuracy;

    return {
      plugin: 'mock',
      timestamp: now,
      data: {
        latitude: lat,
        longitude: lon,
        accuracy,
        altitude: 0,
        provider: 'mock',
        speed: 0,
        bearing: 0,
      },
    };
  }

  /**
   * Transform raw signals into an unsigned location stamp.
   */
  async create(signals: RawSignals): Promise<UnsignedLocationStamp> {
    const { latitude, longitude, accuracy } = signals.data as {
      latitude: number;
      longitude: number;
      accuracy: number;
    };
    const now = signals.timestamp;
    const duration = this.options.durationSeconds;

    return {
      lpVersion: '0.2',
      locationType: 'geojson-point',
      location: {
        type: 'Point',
        coordinates: [longitude, latitude], // GeoJSON: [lon, lat]
      },
      srs: 'EPSG:4326',
      temporalFootprint: {
        start: now,
        end: now + duration,
      },
      plugin: 'mock',
      pluginVersion: this.version,
      signals: {
        ...signals.data,
        accuracyMeters: accuracy,
      },
    };
  }

  /**
   * Sign a stamp with ECDSA (real crypto via ethers).
   */
  async sign(stamp: UnsignedLocationStamp, signer?: StampSigner): Promise<LocationStamp> {
    const data = JSON.stringify(stamp);
    const now = Math.floor(Date.now() / 1000);

    let sigValue: string;
    let signerIdentifier = {
      scheme: 'eth-address',
      value: this.wallet.address,
    };

    if (signer) {
      sigValue = await signer.sign(data);
      signerIdentifier = signer.signer;
    } else {
      sigValue = await this.wallet.signMessage(data);
    }

    return {
      ...stamp,
      signatures: [
        {
          signer: signerIdentifier,
          algorithm: 'secp256k1',
          value: sigValue,
          timestamp: now,
        },
      ],
    };
  }

  /**
   * Verify a stamp's signature using ethers.verifyMessage.
   */
  async verify(stamp: LocationStamp): Promise<StampVerificationResult> {
    const details: Record<string, unknown> = {};
    let signaturesValid = true;
    let structureValid = true;
    let signalsConsistent = true;

    // Structure checks
    if (stamp.lpVersion !== '0.2') {
      structureValid = false;
      details.lpVersionError = `Expected '0.2', got '${stamp.lpVersion}'`;
    }
    if (!stamp.location || !stamp.temporalFootprint) {
      structureValid = false;
      details.missingFields = true;
    }
    if (stamp.plugin !== 'mock') {
      structureValid = false;
      details.pluginMismatch = `Expected 'mock', got '${stamp.plugin}'`;
    }

    // Signature verification
    if (!stamp.signatures || stamp.signatures.length === 0) {
      signaturesValid = false;
      details.noSignatures = true;
    } else {
      for (const sig of stamp.signatures) {
        try {
          // Reconstruct the unsigned stamp for verification
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { signatures: _, ...unsigned } = stamp;
          const message = JSON.stringify(unsigned);
          const recovered = ethers.verifyMessage(message, sig.value);
          if (recovered.toLowerCase() !== sig.signer.value.toLowerCase()) {
            signaturesValid = false;
            details.signatureMismatch = {
              expected: sig.signer.value,
              recovered,
            };
          }
        } catch (e) {
          signaturesValid = false;
          details.signatureError = e instanceof Error ? e.message : String(e);
        }
      }
    }

    // Signal consistency
    if (stamp.signals) {
      const lat = stamp.signals.latitude as number | undefined;
      const lon = stamp.signals.longitude as number | undefined;
      if (lat !== undefined && (lat < -90 || lat > 90)) {
        signalsConsistent = false;
        details.invalidLatitude = lat;
      }
      if (lon !== undefined && (lon < -180 || lon > 180)) {
        signalsConsistent = false;
        details.invalidLongitude = lon;
      }
    }

    return {
      valid: signaturesValid && structureValid && signalsConsistent,
      signaturesValid,
      structureValid,
      signalsConsistent,
      details,
    };
  }

  /**
   * Evaluate how well a stamp supports a location claim.
   * Uses haversine distance for spatial scoring and temporal overlap.
   */
  async evaluate(stamp: LocationStamp, claim: LocationClaim): Promise<CredibilityVector> {
    const details: Record<string, unknown> = {};

    // Extract stamp coordinates
    let stampLat: number;
    let stampLon: number;
    const loc = stamp.location;
    if (typeof loc === 'object' && 'coordinates' in loc) {
      const coords = loc.coordinates as number[];
      if (!Array.isArray(coords) || coords.length < 2) {
        return {
          supportsClaim: false,
          score: 0,
          spatial: 0,
          temporal: 0,
          details: { error: 'Stamp coordinates array must have at least 2 elements' },
        };
      }
      stampLon = coords[0];
      stampLat = coords[1];
    } else {
      return {
        supportsClaim: false,
        score: 0,
        spatial: 0,
        temporal: 0,
        details: { error: 'Cannot extract coordinates from stamp location' },
      };
    }

    // Extract claim coordinates
    let claimLat: number;
    let claimLon: number;
    const claimLoc = claim.location;
    if (typeof claimLoc === 'object' && 'coordinates' in claimLoc) {
      const coords = claimLoc.coordinates as number[];
      if (!Array.isArray(coords) || coords.length < 2) {
        return {
          supportsClaim: false,
          score: 0,
          spatial: 0,
          temporal: 0,
          details: { error: 'Claim coordinates array must have at least 2 elements' },
        };
      }
      claimLon = coords[0];
      claimLat = coords[1];
    } else {
      return {
        supportsClaim: false,
        score: 0,
        spatial: 0,
        temporal: 0,
        details: { error: 'Cannot extract coordinates from claim location' },
      };
    }

    // Spatial scoring: haversine distance vs claim radius
    const distance = haversineDistance(stampLat, stampLon, claimLat, claimLon);
    const accuracyMeters = (stamp.signals?.accuracyMeters as number | undefined) ?? 0;
    const effectiveRadius = claim.radius + accuracyMeters;

    let spatial: number;
    if (distance <= effectiveRadius) {
      spatial = 1.0 - distance / effectiveRadius;
    } else {
      // Outside radius — score decays with distance
      spatial = Math.max(0, 1.0 - distance / (effectiveRadius * 3));
    }
    details.distanceMeters = Math.round(distance);
    details.effectiveRadiusMeters = effectiveRadius;

    // Temporal scoring
    const temporal = temporalOverlap(stamp.temporalFootprint, claim.time);
    details.temporalOverlap = temporal;

    // Combined score (weighted: spatial 60%, temporal 40%)
    const score = spatial * 0.6 + temporal * 0.4;
    const supportsClaim = score > 0.3 && spatial > 0.1 && temporal > 0;

    return { supportsClaim, score, spatial, temporal, details };
  }
}
