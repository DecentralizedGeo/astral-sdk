// Copyright © 2025 Sophia Systems Corporation

/**
 * IP geolocation collector
 *
 * Queries ipinfo.io for the server's public IP coordinates.
 * Always available — no hardware required.
 * Accuracy: city level (~5–50 km). Lowest confidence of all collectors.
 *
 * Uses Node's built-in fetch (Node 18+). No external dependencies.
 */

export interface IpReading {
  source: 'ip-geolocation';
  lat: number;
  lon: number;
  /** IP geolocation is city-level; we report a conservative 25 km accuracy */
  accuracyMeters: number;
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  timestamp: number;
}

interface IpInfoResponse {
  ip: string;
  loc?: string; // "lat,lon"
  city?: string;
  region?: string;
  country?: string;
}

export async function collectIp(timeoutMs = 5000): Promise<IpReading | null> {
  try {
    const res = await fetch('https://ipinfo.io/json', {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(timeoutMs),
    });

    if (!res.ok) return null;

    const data = (await res.json()) as IpInfoResponse;
    if (!data.loc) return null;

    const [latStr, lonStr] = data.loc.split(',');
    const lat = parseFloat(latStr);
    const lon = parseFloat(lonStr);
    if (isNaN(lat) || isNaN(lon)) return null;

    return {
      source: 'ip-geolocation',
      lat,
      lon,
      accuracyMeters: 25_000, // conservative city-level estimate
      ip: data.ip,
      city: data.city,
      region: data.region,
      country: data.country,
      timestamp: Math.floor(Date.now() / 1000),
    };
  } catch {
    return null;
  }
}
