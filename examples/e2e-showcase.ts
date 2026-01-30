/**
 * Astral SDK v0.2.0 End-to-End Showcase
 *
 * This script demonstrates the full SDK functionality with real onchain attestations.
 *
 * Run with:
 *   source .env && TEST_PRIVATE_KEY=$ACCT_A_PRIV npx tsx examples/e2e-showcase.ts
 */

import { ethers } from 'ethers';
import { AstralSDK } from '../src';

// Config - Base Sepolia
const STAGING_API = 'https://staging-api.astral.global';
const BASE_SEPOLIA_RPC = 'https://sepolia.base.org';
const BASE_SEPOLIA_CHAIN_ID = 84532;
const EAS_SCAN_URL = 'https://base-sepolia.easscan.org/attestation/view';

// Compute result schemas (registered on Base Sepolia)
const BOOLEAN_SCHEMA_UID = '0x4958625091a773dcfb37a1c33099a378f32a975a7fb61f33d53c4be7589898f5';
const NUMERIC_SCHEMA_UID = '0xc2b013ecb68d59b28f5d301203ec630335d97c37b400b16b359db6972572e02a';

// Test geometries
const LONDON_POINT = {
  type: 'Point' as const,
  coordinates: [-0.1276, 51.5074], // lon, lat
};

const DENVER_POINT = {
  type: 'Point' as const,
  coordinates: [-104.9903, 39.7392], // lon, lat
};

const LONDON_POLYGON = {
  type: 'Polygon' as const,
  coordinates: [
    [
      [-0.2, 51.6], // NW
      [-0.05, 51.6], // NE
      [-0.05, 51.4], // SE
      [-0.2, 51.4], // SW
      [-0.2, 51.6], // close ring
    ],
  ],
};

// Pretty logging
const log = {
  header: (msg: string) => console.log(`\n${'='.repeat(70)}\n  ${msg}\n${'='.repeat(70)}`),
  section: (msg: string) => console.log(`\n--- ${msg} ---`),
  step: (msg: string) => console.log(`\n>> ${msg}`),
  info: (msg: string) => console.log(`   ${msg}`),
  success: (msg: string) => console.log(`   ✓ ${msg}`),
  link: (label: string, url: string) => console.log(`   🔗 ${label}: ${url}`),
  result: (label: string, value: unknown) => console.log(`   ${label}: ${JSON.stringify(value)}`),
  warn: (msg: string) => console.log(`   ⚠ ${msg}`),
  error: (msg: string) => console.log(`   ✗ ${msg}`),
};

// Track all attestation UIDs for summary
const attestations: { label: string; uid: string; type: 'offchain' | 'onchain' | 'compute' }[] = [];

async function main() {
  log.header('Astral SDK v0.2.0 - End-to-End Showcase');

  // Setup
  const provider = new ethers.JsonRpcProvider(BASE_SEPOLIA_RPC);
  const privateKey = process.env.TEST_PRIVATE_KEY;

  if (!privateKey) {
    log.error('TEST_PRIVATE_KEY not set. Run with:');
    log.info('source .env && TEST_PRIVATE_KEY=$ACCT_A_PRIV npx tsx examples/e2e-showcase.ts');
    process.exit(1);
  }

  const signer = new ethers.Wallet(privateKey, provider);
  const address = await signer.getAddress();
  log.info(`Wallet: ${address}`);

  // Check balance
  const balance = await provider.getBalance(address);
  log.info(`Balance: ${ethers.formatEther(balance)} ETH`);

  if (balance === 0n) {
    log.warn('Wallet has no ETH. Onchain operations will fail.');
    log.info('Get Base Sepolia ETH from: https://www.alchemy.com/faucets/base-sepolia');
  }

  // Initialize SDK
  log.step('Initializing SDK');
  const astral = new AstralSDK({
    chainId: BASE_SEPOLIA_CHAIN_ID,
    signer,
    apiUrl: STAGING_API,
  });
  log.success('SDK initialized on Base Sepolia');

  // ============================================================
  // 1. OFFCHAIN ATTESTATION - London
  // ============================================================
  log.header('1. Offchain Attestation - London');

  log.step('Building unsigned attestation');
  const londonUnsigned = await astral.location.build({
    location: LONDON_POINT,
    memo: 'London coordinates - offchain attestation demo',
  });
  log.success(`Built: locationType=${londonUnsigned.locationType}`);

  log.step('Signing with EIP-712');
  const londonOffchain = await astral.location.offchain.sign(londonUnsigned);
  log.success(`Signed: uid=${londonOffchain.uid}`);
  log.info(`Signer: ${londonOffchain.signer}`);
  attestations.push({ label: 'London (offchain)', uid: londonOffchain.uid, type: 'offchain' });

  log.step('Verifying signature');
  const verification = await astral.location.offchain.verify(londonOffchain);
  log.success(`Verified: ${verification.isValid ? 'VALID' : 'INVALID'}`);

  // ============================================================
  // 2. ONCHAIN ATTESTATION - London Point
  // ============================================================
  log.header('2. Onchain Attestation - London Point');

  log.step('Building unsigned attestation');
  const londonPointUnsigned = await astral.location.build({
    location: LONDON_POINT,
    memo: 'London point - onchain attestation demo',
  });

  log.step('Registering onchain (sending tx)...');
  try {
    const londonOnchain = await astral.location.onchain.register(londonPointUnsigned);
    log.success(`Registered!`);
    log.result('UID', londonOnchain.uid);
    log.result('TxHash', londonOnchain.txHash);
    log.link('EAS Scan', `${EAS_SCAN_URL}/${londonOnchain.uid}`);
    attestations.push({ label: 'London Point (onchain)', uid: londonOnchain.uid, type: 'onchain' });
  } catch (err) {
    log.error(`Failed: ${(err as Error).message}`);
  }

  // ============================================================
  // 3. ONCHAIN ATTESTATION - Denver Point
  // ============================================================
  log.header('3. Onchain Attestation - Denver Point');

  log.step('Building unsigned attestation');
  const denverUnsigned = await astral.location.build({
    location: DENVER_POINT,
    memo: 'Denver point - onchain attestation demo',
  });

  log.step('Registering onchain (sending tx)...');
  try {
    const denverOnchain = await astral.location.onchain.register(denverUnsigned);
    log.success(`Registered!`);
    log.result('UID', denverOnchain.uid);
    log.result('TxHash', denverOnchain.txHash);
    log.link('EAS Scan', `${EAS_SCAN_URL}/${denverOnchain.uid}`);
    attestations.push({ label: 'Denver Point (onchain)', uid: denverOnchain.uid, type: 'onchain' });
  } catch (err) {
    log.error(`Failed: ${(err as Error).message}`);
  }

  // ============================================================
  // 4. ONCHAIN ATTESTATION - London Polygon
  // ============================================================
  log.header('4. Onchain Attestation - London Polygon');

  log.step('Building unsigned attestation');
  const polygonUnsigned = await astral.location.build({
    location: LONDON_POLYGON,
    memo: 'London polygon - onchain attestation demo',
  });

  log.step('Registering onchain (sending tx)...');
  try {
    const polygonOnchain = await astral.location.onchain.register(polygonUnsigned);
    log.success(`Registered!`);
    log.result('UID', polygonOnchain.uid);
    log.result('TxHash', polygonOnchain.txHash);
    log.link('EAS Scan', `${EAS_SCAN_URL}/${polygonOnchain.uid}`);
    attestations.push({
      label: 'London Polygon (onchain)',
      uid: polygonOnchain.uid,
      type: 'onchain',
    });
  } catch (err) {
    log.error(`Failed: ${(err as Error).message}`);
  }

  // ============================================================
  // 5. COMPUTE MODULE - Health Check
  // ============================================================
  log.header('5. Compute Module - Health Check');

  log.step('Checking service health');
  try {
    const health = await astral.compute.health();
    log.success(`Status: ${health.status}`);
    log.result('Database', health.database);
  } catch (err) {
    log.error(`Health check failed: ${(err as Error).message}`);
  }

  // ============================================================
  // 6. COMPUTE - Distance (Denver to London)
  // ============================================================
  log.header('6. Compute - Distance (Denver to London)');

  log.step('Calculating distance');
  try {
    const distanceResult = await astral.compute.distance(DENVER_POINT, LONDON_POINT, {
      schema: NUMERIC_SCHEMA_UID,
      recipient: address,
    });
    log.success(`Distance: ${distanceResult.result} ${distanceResult.units}`);
    log.info(`≈ ${(distanceResult.result / 1000).toFixed(1)} km`);
    log.info(`≈ ${(distanceResult.result / 1609.34).toFixed(1)} miles`);
  } catch (err) {
    log.error(`Distance calculation failed: ${(err as Error).message}`);
  }

  // ============================================================
  // 7. COMPUTE - Area (London Polygon)
  // ============================================================
  log.header('7. Compute - Area (London Polygon)');

  log.step('Calculating area');
  try {
    const areaResult = await astral.compute.area(LONDON_POLYGON, {
      schema: NUMERIC_SCHEMA_UID,
      recipient: address,
    });
    log.success(`Area: ${areaResult.result} ${areaResult.units}`);
    log.info(`≈ ${(areaResult.result / 1_000_000).toFixed(2)} km²`);
  } catch (err) {
    log.error(`Area calculation failed: ${(err as Error).message}`);
  }

  // ============================================================
  // 8. COMPUTE - Contains (London in London) - Should be TRUE
  // ============================================================
  log.header('8. Compute - Contains (London in London Polygon)');

  log.step('Checking if London point is inside London polygon');
  let londonContainsResult: Awaited<ReturnType<typeof astral.compute.contains>> | null = null;
  try {
    londonContainsResult = await astral.compute.contains(LONDON_POLYGON, LONDON_POINT, {
      schema: BOOLEAN_SCHEMA_UID,
      recipient: address,
    });
    log.success(`Contains: ${londonContainsResult.result}`);
    log.info(`Expected: true (London is in London)`);

    if (londonContainsResult.result !== true) {
      log.warn('Unexpected result! London should be inside the London polygon.');
    }
  } catch (err) {
    log.error(`Contains check failed: ${(err as Error).message}`);
  }

  // ============================================================
  // 9. SUBMIT COMPUTE RESULT - London in London
  // ============================================================
  log.header('9. Submit Compute Result to EAS');

  if (londonContainsResult?.delegatedAttestation && londonContainsResult?.attestation) {
    log.step('Submitting delegated attestation onchain');
    log.info(`Attester (Astral): ${londonContainsResult.delegatedAttestation.attester}`);
    log.info(`Recipient: ${londonContainsResult.attestation.recipient}`);

    try {
      const submitResult = await astral.compute.submit({
        attestation: londonContainsResult.attestation,
        delegatedAttestation: londonContainsResult.delegatedAttestation,
      });
      log.success(`Submitted!`);
      log.result('UID', submitResult.uid);
      log.link('EAS Scan', `${EAS_SCAN_URL}/${submitResult.uid}`);
      attestations.push({
        label: 'Contains: London in London (compute)',
        uid: submitResult.uid,
        type: 'compute',
      });
    } catch (err) {
      log.error(`Submit failed: ${(err as Error).message}`);
      if ((err as Error).cause) {
        log.info(`Cause: ${((err as Error).cause as Error).message || (err as Error).cause}`);
      }
    }
  } else {
    log.warn('No delegated attestation to submit (contains check may have failed)');
  }

  // ============================================================
  // 10. COMPUTE - Contains (Denver in London) - Should be FALSE
  // ============================================================
  log.header('10. Compute - Contains (Denver in London Polygon)');

  log.step('Checking if Denver point is inside London polygon');
  try {
    const denverContainsResult = await astral.compute.contains(LONDON_POLYGON, DENVER_POINT, {
      schema: BOOLEAN_SCHEMA_UID,
      recipient: address,
    });
    log.success(`Contains: ${denverContainsResult.result}`);
    log.info(`Expected: false (Denver is NOT in London)`);

    if (denverContainsResult.result !== false) {
      log.warn('Unexpected result! Denver should NOT be inside the London polygon.');
    }
  } catch (err) {
    log.error(`Contains check failed: ${(err as Error).message}`);
  }

  // ============================================================
  // 11. BONUS - Intersects Check
  // ============================================================
  log.header('11. Bonus - Intersects Check');

  // Create a small polygon around Denver
  const denverPolygon = {
    type: 'Polygon' as const,
    coordinates: [
      [
        [-105.1, 39.8],
        [-104.9, 39.8],
        [-104.9, 39.6],
        [-105.1, 39.6],
        [-105.1, 39.8],
      ],
    ],
  };

  log.step('Checking if London polygon intersects Denver polygon');
  try {
    const intersectsResult = await astral.compute.intersects(LONDON_POLYGON, denverPolygon, {
      schema: BOOLEAN_SCHEMA_UID,
      recipient: address,
    });
    log.success(`Intersects: ${intersectsResult.result}`);
    log.info(`Expected: false (London and Denver polygons don't overlap)`);
  } catch (err) {
    log.error(`Intersects check failed: ${(err as Error).message}`);
  }

  // ============================================================
  // SUMMARY
  // ============================================================
  log.header('Summary - All Attestations');

  if (attestations.length === 0) {
    log.warn('No attestations were created.');
  } else {
    console.log('');
    console.log('   Type       | Label                              | Link');
    console.log('   ' + '-'.repeat(80));

    for (const att of attestations) {
      const typeStr = att.type.padEnd(10);
      const labelStr = att.label.padEnd(35);
      if (att.type === 'offchain') {
        console.log(`   ${typeStr} | ${labelStr} | (offchain - no link)`);
      } else {
        console.log(`   ${typeStr} | ${labelStr} | ${EAS_SCAN_URL}/${att.uid}`);
      }
    }

    console.log('');
    log.info(`Total: ${attestations.length} attestations`);
    log.info(`  - Offchain: ${attestations.filter(a => a.type === 'offchain').length}`);
    log.info(`  - Onchain:  ${attestations.filter(a => a.type === 'onchain').length}`);
    log.info(`  - Compute:  ${attestations.filter(a => a.type === 'compute').length}`);
  }

  log.header('Done!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
