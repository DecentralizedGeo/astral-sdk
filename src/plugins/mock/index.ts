// Copyright © 2025 Sophia Systems Corporation

/**
 * Mock Location Proof Plugin
 *
 * A complete LocationProofPlugin implementation for testing and development.
 * All four methods (collect, create, sign, verify), real ECDSA crypto,
 * configurable behavior.
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
 * astral.plugins.register(mock);
 * ```
 */

import { ethers } from 'ethers';
import type {
  LocationProofPlugin,
  Runtime,
  RawSignals,
  UnsignedLocationStamp,
  LocationStamp,
  StampSigner,
  StampVerificationResult,
} from '../types';

export interface MockPluginOptions {
  /** Plugin name (must start with 'mock-', defaults to 'mock-default') */
  name?: string;
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

export class MockPlugin implements LocationProofPlugin {
  readonly name: string;
  readonly version = '0.1.0';
  readonly runtimes: Runtime[] = ['react-native', 'node', 'browser'];
  readonly requiredCapabilities: string[] = [];
  readonly description = 'Mock plugin for testing and development';

  private readonly options: Required<
    Omit<MockPluginOptions, 'privateKey' | 'timestamp' | 'name'>
  > & {
    timestamp?: number;
  };
  private readonly wallet: ethers.Wallet | ethers.HDNodeWallet;

  constructor(options: MockPluginOptions = {}) {
    // Validate and set name (must be 'mock' or start with 'mock-')
    const name = options.name ?? 'mock-default';
    if (name !== 'mock' && !name.startsWith('mock-')) {
      throw new Error(`MockPlugin name must be 'mock' or start with 'mock-', got: ${name}`);
    }
    this.name = name;

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
  async collect(): Promise<RawSignals> {
    let { lat, lon } = this.options;

    // Apply jitter if configured
    if (this.options.jitterMeters > 0) {
      const jitterDeg = this.options.jitterMeters / 111_320; // Rough meters-to-degrees
      lat += (Math.random() - 0.5) * 2 * jitterDeg;
      lon += (Math.random() - 0.5) * 2 * jitterDeg;
    }

    const now = this.options.timestamp ?? Math.floor(Date.now() / 1000);

    return {
      plugin: this.name,
      timestamp: now,
      data: {
        latitude: lat,
        longitude: lon,
        accuracy: this.options.accuracy,
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
      plugin: this.name,
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
    if (stamp.plugin !== this.name) {
      structureValid = false;
      details.pluginMismatch = `Expected '${this.name}', got '${stamp.plugin}'`;
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
}
