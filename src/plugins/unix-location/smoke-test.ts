/* eslint-disable no-console */
/**
 * Smoke test — run with: npx tsx src/plugins/unix-location/smoke-test.ts
 *
 * Exercises the full collect → create → sign → verify flow.
 * Works on any machine with internet access (IP collector always runs).
 */

import { UnixLocationPlugin } from './index';

async function main() {
  const plugin = new UnixLocationPlugin({ timeoutMs: 8000 });

  console.log('unix-location plugin smoke test\n');
  console.log('Collecting signals (up to 8s)...');

  // collect
  const signals = await plugin.collect();
  const sources = signals.data.sources as Array<{
    source: string;
    lat: number;
    lon: number;
    accuracyMeters: number;
  }>;

  console.log(`\n✓ Got ${sources.length} signal(s):`);
  for (const s of sources) {
    console.log(
      `  ${s.source.padEnd(20)} lat=${s.lat.toFixed(4)} lon=${s.lon.toFixed(4)} accuracy=±${s.accuracyMeters}m`
    );
  }

  // create
  const unsigned = await plugin.create(signals);
  const coords = (unsigned.location as { coordinates: number[] }).coordinates;
  console.log(`\n✓ Synthesised location: [${coords[1].toFixed(6)}, ${coords[0].toFixed(6)}]`);
  console.log(`  Primary source: ${unsigned.signals.primarySource}`);
  console.log(`  Accuracy: ±${unsigned.signals.accuracyMeters}m`);

  // sign
  const stamp = await plugin.sign(unsigned);
  console.log(`\n✓ Signed by: ${stamp.signatures[0].signer.value}`);

  // verify
  const result = await plugin.verify(stamp);
  console.log(`\n✓ Verification: ${result.valid ? 'PASSED' : 'FAILED'}`);
  if (!result.valid) {
    console.log('  Details:', result.details);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('\n✗ Error:', err.message);
  process.exit(1);
});
