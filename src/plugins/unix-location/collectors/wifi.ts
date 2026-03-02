// Copyright © 2025 Sophia Systems Corporation

/**
 * WiFi-based location collector
 *
 * Scans for nearby WiFi access points using native OS tools:
 *   Linux:  nmcli (NetworkManager CLI)
 *   macOS:  airport utility (Apple80211 private framework)
 *
 * AP data (BSSID + signal strength) is resolved to coordinates via the
 * Mozilla Location Service (MLS) — an open, free geolocation API.
 * Typical accuracy: 20–200 metres depending on AP density.
 */

import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const MLS_ENDPOINT = 'https://location.services.mozilla.com/v1/geolocate?key=geoclue';

const AIRPORT_BIN =
  '/System/Library/PrivateFrameworks/Apple80211.framework/Versions/Current/Resources/airport';

export interface WifiReading {
  source: 'wifi';
  lat: number;
  lon: number;
  accuracyMeters: number;
  timestamp: number;
  /** Number of APs used for resolution */
  apCount: number;
}

interface AccessPoint {
  macAddress: string;
  signalStrength: number;
}

// ---------------------------------------------------------------------------
// Platform-specific AP scanning
// ---------------------------------------------------------------------------

async function scanLinux(): Promise<AccessPoint[]> {
  const { stdout } = await execFileAsync(
    'nmcli',
    ['-t', '-f', 'BSSID,SIGNAL', 'dev', 'wifi', 'list'],
    { timeout: 8000 }
  );

  return stdout
    .trim()
    .split('\n')
    .flatMap(line => {
      // nmcli -t format: "AA\:BB\:CC\:DD\:EE\:FF:75"
      const parts = line.split(':');
      if (parts.length < 7) return [];
      // Last part is signal, first 6 are MAC octets (with escaped colons)
      const signal = parseInt(parts[parts.length - 1], 10);
      const mac = parts.slice(0, 6).join(':').replace(/\\/g, '');
      if (isNaN(signal) || !mac) return [];
      // MLS expects dBm; nmcli reports 0-100 signal quality — convert
      const dBm = signal / 2 - 100;
      return [{ macAddress: mac, signalStrength: dBm }];
    });
}

async function scanMacos(): Promise<AccessPoint[]> {
  const { stdout } = await execFileAsync(AIRPORT_BIN, ['-s'], { timeout: 8000 });

  // airport -s output:
  //           SSID BSSID             RSSI CHANNEL HT CC SECURITY (auth/unicast/group)
  //      MyNetwork aa:bb:cc:dd:ee:ff  -55  6       Y  -- WPA2(PSK/AES/AES)
  return stdout
    .trim()
    .split('\n')
    .slice(1) // skip header
    .flatMap(line => {
      const parts = line.trim().split(/\s+/);
      if (parts.length < 3) return [];
      // BSSID is the second column, RSSI is third
      const mac = parts[1];
      const rssi = parseInt(parts[2], 10);
      if (!mac || isNaN(rssi)) return [];
      return [{ macAddress: mac, signalStrength: rssi }];
    });
}

// ---------------------------------------------------------------------------
// MLS resolution
// ---------------------------------------------------------------------------

async function resolveViaMLS(
  aps: AccessPoint[]
): Promise<{ lat: number; lon: number; accuracy: number } | null> {
  if (aps.length === 0) return null;

  const body = JSON.stringify({ wifiAccessPoints: aps.slice(0, 20) });

  const res = await fetch(MLS_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) return null;

  const data = (await res.json()) as { location?: { lat: number; lng: number }; accuracy?: number };
  if (!data.location) return null;

  return {
    lat: data.location.lat,
    lon: data.location.lng,
    accuracy: data.accuracy ?? 200,
  };
}

// ---------------------------------------------------------------------------
// Public collector
// ---------------------------------------------------------------------------

export async function collectWifi(): Promise<WifiReading | null> {
  let aps: AccessPoint[] = [];

  try {
    if (process.platform === 'linux') {
      aps = await scanLinux();
    } else if (process.platform === 'darwin') {
      aps = await scanMacos();
    } else {
      return null;
    }
  } catch {
    return null;
  }

  if (aps.length === 0) return null;

  const resolved = await resolveViaMLS(aps);
  if (!resolved) return null;

  return {
    source: 'wifi',
    lat: resolved.lat,
    lon: resolved.lon,
    accuracyMeters: resolved.accuracy,
    timestamp: Math.floor(Date.now() / 1000),
    apCount: aps.length,
  };
}
