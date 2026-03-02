// Copyright © 2025 Sophia Systems Corporation

/**
 * Unix Location Plugin
 *
 * A server-side LocationProofPlugin that collects location evidence from
 * native Unix processes and system daemons. Runs all available collectors
 * in parallel and synthesises the best available fix.
 *
 * Collectors (in order of accuracy):
 *   1. gpsd       — GPS hardware via `gpspipe` (~3 m)
 *   2. geoclue2   — Linux location daemon via `gdbus` (~10–50 m)
 *   3. wifi       — AP scan via nmcli/airport + Mozilla Location Service (~30–200 m)
 *   4. ip         — Public IP via ipinfo.io (~5–50 km)
 *
 * Each available collector contributes a stamp. The synthesised location uses
 * the most accurate fix. All raw readings are stored in `signals` for
 * downstream credibility assessment.
 *
 * Usage:
 * ```typescript
 * import { UnixLocationPlugin } from '@decentralized-geo/astral-sdk/plugins';
 *
 * const plugin = new UnixLocationPlugin();
 * const astral = new AstralSDK({ chainId: 84532 });
 * astral.plugins.register(plugin);
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
import { collectGpsd, type GpsdReading } from './collectors/gpsd';
import { collectGeoclue, type GeoclueReading } from './collectors/geoclue';
import { collectWifi, type WifiReading } from './collectors/wifi';
import { collectIp, type IpReading } from './collectors/ip';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SourceReading = GpsdReading | GeoclueReading | WifiReading | IpReading;

export interface UnixLocationPluginOptions {
  /**
   * Per-collector timeout in milliseconds (default: 8000).
   * Collectors that exceed this are skipped.
   */
  timeoutMs?: number;
  /**
   * Deterministic private key for signing stamps.
   * If omitted, a random wallet is generated per instance.
   */
  privateKey?: string;
  /**
   * Duration of temporal footprint in seconds (default: 60).
   */
  durationSeconds?: number;
}

// ---------------------------------------------------------------------------
// Plugin
// ---------------------------------------------------------------------------

export class UnixLocationPlugin implements LocationProofPlugin {
  readonly name = 'unix-location';
  readonly version = '0.1.0';
  readonly runtimes: Runtime[] = ['node'];
  readonly requiredCapabilities: string[] = [];
  readonly description =
    'Server-side location plugin using native Unix processes: ' +
    'gpsd, GeoClue2, WiFi scanning (nmcli/airport), and IP geolocation. ' +
    'Runs all available collectors in parallel for multi-signal proofs.';

  private readonly timeoutMs: number;
  private readonly durationSeconds: number;
  private readonly wallet: ethers.Wallet | ethers.HDNodeWallet;

  constructor(options: UnixLocationPluginOptions = {}) {
    this.timeoutMs = options.timeoutMs ?? 8000;
    this.durationSeconds = options.durationSeconds ?? 60;
    this.wallet = options.privateKey
      ? new ethers.Wallet(options.privateKey)
      : ethers.Wallet.createRandom();
  }

  // -------------------------------------------------------------------------
  // collect — run all collectors in parallel, return whatever succeeds
  // -------------------------------------------------------------------------

  async collect(): Promise<RawSignals> {
    const results = await Promise.allSettled([
      collectGpsd(this.timeoutMs),
      collectGeoclue(this.timeoutMs),
      collectWifi(),
      collectIp(this.timeoutMs),
    ]);

    const sources: SourceReading[] = results.flatMap(r =>
      r.status === 'fulfilled' && r.value !== null ? [r.value] : []
    );

    if (sources.length === 0) {
      throw new Error(
        'unix-location: no location signals available. ' +
          'Ensure at least one of gpsd, geoclue2, nmcli/airport, or internet access is available.'
      );
    }

    return {
      plugin: this.name,
      timestamp: Math.floor(Date.now() / 1000),
      data: { sources },
    };
  }

  // -------------------------------------------------------------------------
  // create — synthesise the best available fix from collected signals
  // -------------------------------------------------------------------------

  async create(signals: RawSignals): Promise<UnsignedLocationStamp> {
    const sources = signals.data.sources as SourceReading[];

    // Pick the most accurate source (lowest accuracyMeters)
    const best = sources.reduce((a, b) => (a.accuracyMeters <= b.accuracyMeters ? a : b));

    const now = signals.timestamp;

    return {
      lpVersion: '0.2',
      locationType: 'geojson-point',
      location: {
        type: 'Point',
        coordinates: [best.lon, best.lat], // GeoJSON: [lon, lat]
      },
      srs: 'EPSG:4326',
      temporalFootprint: {
        start: now,
        end: now + this.durationSeconds,
      },
      plugin: this.name,
      pluginVersion: this.version,
      signals: {
        sources: sources,
        primarySource: best.source,
        accuracyMeters: best.accuracyMeters,
        sourceCount: sources.length,
      },
    };
  }

  // -------------------------------------------------------------------------
  // sign — ECDSA via ethers (same pattern as MockPlugin)
  // -------------------------------------------------------------------------

  async sign(stamp: UnsignedLocationStamp, signer?: StampSigner): Promise<LocationStamp> {
    const data = JSON.stringify(stamp);
    const now = Math.floor(Date.now() / 1000);

    let sigValue: string;
    let signerIdentifier = { scheme: 'eth-address', value: this.wallet.address };

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

  // -------------------------------------------------------------------------
  // verify — structure + signature + signal sanity checks
  // -------------------------------------------------------------------------

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
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { signatures: _, ...unsigned } = stamp;
          const message = JSON.stringify(unsigned);
          const recovered = ethers.verifyMessage(message, sig.value);
          if (recovered.toLowerCase() !== sig.signer.value.toLowerCase()) {
            signaturesValid = false;
            details.signatureMismatch = { expected: sig.signer.value, recovered };
          }
        } catch (e) {
          signaturesValid = false;
          details.signatureError = e instanceof Error ? e.message : String(e);
        }
      }
    }

    // Signal sanity: check coordinates are in valid range
    if (stamp.signals) {
      const sources = stamp.signals.sources as SourceReading[] | undefined;
      if (sources) {
        for (const s of sources) {
          if (s.lat < -90 || s.lat > 90) {
            signalsConsistent = false;
            details.invalidLatitude = s.lat;
          }
          if (s.lon < -180 || s.lon > 180) {
            signalsConsistent = false;
            details.invalidLongitude = s.lon;
          }
        }
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
