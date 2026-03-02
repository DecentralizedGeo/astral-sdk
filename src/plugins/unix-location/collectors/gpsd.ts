// Copyright © 2025 Sophia Systems Corporation

/**
 * GPS daemon collector
 *
 * Reads location from gpsd via `gpspipe -w -n 10`.
 * Requires gpsd to be running with a GPS device attached.
 * Works on Linux and macOS.
 */

import { spawn } from 'child_process';

export interface GpsdReading {
  source: 'gpsd';
  lat: number;
  lon: number;
  /** Estimated horizontal accuracy in metres (from epx/epy) */
  accuracyMeters: number;
  altitudeMeters?: number;
  speedMs?: number;
  timestamp: number;
}

/**
 * Try to collect a GPS fix from gpsd.
 * Resolves with a reading or null if gpsd is unavailable or has no fix.
 */
export async function collectGpsd(timeoutMs = 5000): Promise<GpsdReading | null> {
  return new Promise(resolve => {
    const proc = spawn('gpspipe', ['-w', '-n', '10'], { stdio: ['ignore', 'pipe', 'ignore'] });
    const timer = setTimeout(() => {
      proc.kill();
      resolve(null);
    }, timeoutMs);

    let buffer = '';

    proc.stdout.on('data', (chunk: Buffer) => {
      buffer += chunk.toString();
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        try {
          const msg = JSON.parse(line) as Record<string, unknown>;
          // TPV = Time-Position-Velocity report, mode 2 = 2D fix, 3 = 3D fix
          if (msg.class === 'TPV' && (msg.mode === 2 || msg.mode === 3)) {
            const lat = msg.lat as number | undefined;
            const lon = msg.lon as number | undefined;
            if (lat !== undefined && lon !== undefined) {
              clearTimeout(timer);
              proc.kill();

              const epx = (msg.epx as number | undefined) ?? 10;
              const epy = (msg.epy as number | undefined) ?? 10;
              resolve({
                source: 'gpsd',
                lat,
                lon,
                accuracyMeters: Math.max(epx, epy),
                altitudeMeters: msg.alt as number | undefined,
                speedMs: msg.speed as number | undefined,
                timestamp: Math.floor(Date.now() / 1000),
              });
              return;
            }
          }
        } catch {
          // Not JSON or not a TPV message — skip
        }
      }
    });

    proc.on('error', () => {
      clearTimeout(timer);
      resolve(null);
    });

    proc.on('close', () => {
      clearTimeout(timer);
      resolve(null);
    });
  });
}
