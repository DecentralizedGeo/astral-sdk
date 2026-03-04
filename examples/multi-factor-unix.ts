/**
 * Multi-factor Unix location proof example
 *
 * Demonstrates the SDK orchestrating four independent location proof plugins
 * to create a multi-factor location proof. Each plugin collects evidence from
 * a different signal source; the SDK's StampsModule and ProofsModule compose
 * them into a single proof with cross-correlated credibility assessment.
 *
 * Signal sources (in order of accuracy):
 *   1. gpsd       — GPS hardware via gpspipe (~3 m)
 *   2. geoclue    — Linux GeoClue2 D-Bus daemon (~10-50 m)
 *   3. wifi-mls   — AP scan + Mozilla Location Service (~30-200 m)
 *   4. ip-geolocation — ipinfo.io public IP lookup (~5-50 km)
 *
 * Each plugin is its own package with its own trust model, verification
 * logic, and platform requirements. The SDK handles composition.
 *
 * Usage:
 *   npx tsx examples/multi-factor-unix.ts
 */

import { AstralSDK } from '@decentralized-geo/astral-sdk';
import type { LocationClaim, LocationStamp } from '@decentralized-geo/astral-sdk/plugins';

// Each plugin is an independent package
import { GpsdPlugin } from '@location-proofs/plugin-gpsd';
import { GeocluePlugin } from '@location-proofs/plugin-geoclue';
import { WifiMlsPlugin } from '@location-proofs/plugin-wifi-mls';
import { IpGeolocationPlugin } from '@location-proofs/plugin-ip-geolocation';

async function main() {
  // --- 1. Initialize the SDK and register plugins ---

  const sdk = new AstralSDK({ chainId: 11155111 }); // Sepolia testnet

  const plugins = [
    new GpsdPlugin(),
    new GeocluePlugin(),
    new WifiMlsPlugin(),
    new IpGeolocationPlugin(),
  ];

  for (const plugin of plugins) {
    sdk.plugins.register(plugin);
  }

  console.log(`Registered ${plugins.length} plugins: ${plugins.map(p => p.name).join(', ')}`);

  // --- 2. Collect stamps from all available plugins ---

  const pluginNames = ['gpsd', 'geoclue', 'wifi-mls', 'ip-geolocation'];
  const stamps: LocationStamp[] = [];

  console.log('\nCollecting from all plugins...');
  for (const name of pluginNames) {
    try {
      const signals = await sdk.stamps.collect({ plugins: [name] });
      // signals is an array of RawSignals, one per plugin
      for (const signal of signals) {
        const plugin = sdk.plugins.get(signal.plugin);
        if (plugin?.create && plugin?.sign) {
          const unsigned = await plugin.create(signal);
          const stamp = await plugin.sign(unsigned);
          stamps.push(stamp);
          console.log(`  [ok] ${name} — ${JSON.stringify(signal.data).slice(0, 80)}...`);
        }
      }
    } catch (e) {
      console.log(`  [skip] ${name} — ${(e as Error).message}`);
    }
  }

  if (stamps.length === 0) {
    console.error('\nNo stamps collected. At least one plugin must succeed.');
    process.exit(1);
  }

  console.log(`\nCollected ${stamps.length} stamp(s)`);

  // --- 3. Define a location claim ---

  // Grab coordinates from the first stamp for the demo claim
  const coords = (stamps[0].location as { coordinates: number[] }).coordinates;

  const claim: LocationClaim = {
    lpVersion: '0.2',
    locationType: 'geojson-point',
    location: { type: 'Point', coordinates: coords },
    srs: 'EPSG:4326',
    subject: { scheme: 'eth-address', value: '0x0000000000000000000000000000000000000000' },
    radius: 1000, // 1km claim radius
    time: {
      start: Math.floor(Date.now() / 1000) - 60,
      end: Math.floor(Date.now() / 1000),
    },
  };

  // --- 4. Create and evaluate the multi-factor proof ---

  const proof = await sdk.proofs.create(claim, stamps);
  console.log(`\nCreated proof with ${proof.stamps.length} stamps`);

  const credibility = await sdk.proofs.evaluate(proof);
  console.log('\nCredibility assessment:');
  console.log(
    `  Spatial — mean distance: ${credibility.dimensions.spatial.meanDistanceMeters.toFixed(0)}m`
  );
  console.log(
    `  Temporal — mean overlap: ${(credibility.dimensions.temporal.meanOverlap * 100).toFixed(1)}%`
  );
  console.log(
    `  Validity — signatures: ${(credibility.dimensions.validity.signaturesValidFraction * 100).toFixed(0)}%`
  );
  console.log(
    `  Independence — unique plugins: ${credibility.dimensions.independence.pluginNames.join(', ')}`
  );
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
