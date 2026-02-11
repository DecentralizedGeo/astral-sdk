// Copyright © 2026 Sophia Systems Corporation

import { ProofsModule } from '../../src/proofs/ProofsModule';
import type { LocationClaim, LocationStamp } from '../../src/plugins/types';

const claim: LocationClaim = {
  lpVersion: '0.2',
  locationType: 'geojson-point',
  location: { type: 'Point', coordinates: [-73.9857, 40.7484] },
  srs: 'EPSG:4326',
  subject: { scheme: 'eth-address', value: '0x123' },
  radius: 100,
  time: { start: 1000, end: 2000 },
};

const stamp: LocationStamp = {
  lpVersion: '0.2',
  locationType: 'geojson-point',
  location: { type: 'Point', coordinates: [-73.9857, 40.7484] },
  srs: 'EPSG:4326',
  temporalFootprint: { start: 1000, end: 2000 },
  plugin: 'mock',
  pluginVersion: '0.1.0',
  signals: {},
  signatures: [
    {
      signer: { scheme: 'eth-address', value: '0xabc' },
      algorithm: 'secp256k1',
      value: '0xdeadbeef',
      timestamp: 1000,
    },
  ],
};

describe('ProofsModule', () => {
  const proofs = new ProofsModule();

  it('creates a proof from a claim and stamps', () => {
    const proof = proofs.create(claim, [stamp]);
    expect(proof.claim).toBe(claim);
    expect(proof.stamps).toHaveLength(1);
    expect(proof.stamps[0]).toBe(stamp);
  });

  it('creates a multi-stamp proof', () => {
    const proof = proofs.create(claim, [stamp, stamp]);
    expect(proof.stamps).toHaveLength(2);
  });

  it('throws when no stamps provided', () => {
    expect(() => proofs.create(claim, [])).toThrow('At least one stamp is required');
  });
});
