// Copyright © 2025 Sophia Systems Corporation

/**
 * GeoClue2 collector (Linux only)
 *
 * Queries the GeoClue2 system location daemon via gdbus.
 * GeoClue2 aggregates WiFi, cell, and IP signals itself.
 * Requires: geoclue-2.0 package, D-Bus system bus access.
 */

import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface GeoclueReading {
  source: 'geoclue2';
  lat: number;
  lon: number;
  accuracyMeters: number;
  altitudeMeters?: number;
  timestamp: number;
}

/**
 * Try to get a location fix from GeoClue2 via gdbus.
 * Resolves with a reading or null if GeoClue2 is unavailable.
 */
export async function collectGeoclue(timeoutMs = 8000): Promise<GeoclueReading | null> {
  // Only available on Linux
  if (process.platform !== 'linux') return null;

  try {
    // Step 1: Get a client path from the manager
    const { stdout: clientOut } = await execFileAsync(
      'gdbus',
      [
        'call',
        '--system',
        '--dest',
        'org.freedesktop.GeoClue2',
        '--object-path',
        '/org/freedesktop/GeoClue2/Manager',
        '--method',
        'org.freedesktop.GeoClue2.Manager.GetClient',
      ],
      { timeout: timeoutMs }
    );

    // Output format: "('/org/freedesktop/GeoClue2/Client/N',)\n"
    const clientMatch = clientOut.match(/'(\/org\/freedesktop\/GeoClue2\/Client\/\d+)'/);
    if (!clientMatch) return null;
    const clientPath = clientMatch[1];

    // Step 2: Set DesktopId (required by GeoClue2)
    await execFileAsync(
      'gdbus',
      [
        'call',
        '--system',
        '--dest',
        'org.freedesktop.GeoClue2',
        '--object-path',
        clientPath,
        '--method',
        'org.freedesktop.DBus.Properties.Set',
        'org.freedesktop.GeoClue2.Client',
        'DesktopId',
        '"openclaw-unix-location"',
      ],
      { timeout: timeoutMs }
    );

    // Step 3: Start the client
    await execFileAsync(
      'gdbus',
      [
        'call',
        '--system',
        '--dest',
        'org.freedesktop.GeoClue2',
        '--object-path',
        clientPath,
        '--method',
        'org.freedesktop.GeoClue2.Client.Start',
      ],
      { timeout: timeoutMs }
    );

    // Step 4: Read the Location property
    const { stdout: locPathOut } = await execFileAsync(
      'gdbus',
      [
        'get-property',
        '--system',
        '--dest',
        'org.freedesktop.GeoClue2',
        '--object-path',
        clientPath,
        'org.freedesktop.GeoClue2.Client',
        'Location',
      ],
      { timeout: timeoutMs }
    );

    const locMatch = locPathOut.match(/'(\/org\/freedesktop\/GeoClue2\/Location\/[^']+)'/);
    if (!locMatch) return null;
    const locPath = locMatch[1];

    // Step 5: Read latitude, longitude, accuracy
    const [latOut, lonOut, accOut] = await Promise.all([
      execFileAsync(
        'gdbus',
        [
          'get-property',
          '--system',
          '--dest',
          'org.freedesktop.GeoClue2',
          '--object-path',
          locPath,
          'org.freedesktop.GeoClue2.Location',
          'Latitude',
        ],
        { timeout: timeoutMs }
      ),
      execFileAsync(
        'gdbus',
        [
          'get-property',
          '--system',
          '--dest',
          'org.freedesktop.GeoClue2',
          '--object-path',
          locPath,
          'org.freedesktop.GeoClue2.Location',
          'Longitude',
        ],
        { timeout: timeoutMs }
      ),
      execFileAsync(
        'gdbus',
        [
          'get-property',
          '--system',
          '--dest',
          'org.freedesktop.GeoClue2',
          '--object-path',
          locPath,
          'org.freedesktop.GeoClue2.Location',
          'Accuracy',
        ],
        { timeout: timeoutMs }
      ),
    ]);

    const lat = parseFloat(latOut.stdout.trim());
    const lon = parseFloat(lonOut.stdout.trim());
    const acc = parseFloat(accOut.stdout.trim());

    if (isNaN(lat) || isNaN(lon)) return null;

    return {
      source: 'geoclue2',
      lat,
      lon,
      accuracyMeters: isNaN(acc) ? 1000 : acc,
      timestamp: Math.floor(Date.now() / 1000),
    };
  } catch {
    return null;
  }
}
