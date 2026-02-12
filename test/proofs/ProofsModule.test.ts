// Copyright © 2026 Sophia Systems Corporation

import { PluginRegistry } from '../../src/plugins/registry';
import { ProofsModule } from '../../src/proofs/ProofsModule';
import type {
  LocationClaim,
  LocationStamp,
  LocationProof,
  LocationProofPlugin,
} from '../../src/plugins/types';

const baseClaim: LocationClaim = {
  lpVersion: '0.2',
  locationType: 'geojson-point',
  location: { type: 'Point', coordinates: [-73.9857, 40.7484] },
  srs: 'EPSG:4326',
  subject: { scheme: 'eth-address', value: '0x123' },
  radius: 100,
  time: { start: 1000, end: 2000 },
};

function makeStamp(plugin: string, overrides: Partial<LocationStamp> = {}): LocationStamp {
  return {
    lpVersion: '0.2',
    locationType: 'geojson-point',
    location: { type: 'Point', coordinates: [-73.9857, 40.7484] },
    srs: 'EPSG:4326',
    temporalFootprint: { start: 1000, end: 2000 },
    plugin,
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
    ...overrides,
  };
}

function createVerifyPlugin(
  name: string,
  verifyResult = {
    valid: true,
    signaturesValid: true,
    structureValid: true,
    signalsConsistent: true,
    details: {},
  }
): LocationProofPlugin {
  return {
    name,
    version: '0.1.0',
    runtimes: ['node'],
    requiredCapabilities: [],
    description: `Test plugin ${name}`,
    verify: jest.fn().mockResolvedValue(verifyResult),
  };
}

describe('ProofsModule', () => {
  let registry: PluginRegistry;
  let proofs: ProofsModule;

  beforeEach(() => {
    registry = new PluginRegistry('node');
    proofs = new ProofsModule(registry);
  });

  describe('create', () => {
    it('creates a proof from a claim and stamps', () => {
      const stamp = makeStamp('mock');
      const proof = proofs.create(baseClaim, [stamp]);
      expect(proof.claim).toBe(baseClaim);
      expect(proof.stamps).toHaveLength(1);
      expect(proof.stamps[0]).toBe(stamp);
    });

    it('creates a multi-stamp proof', () => {
      const stamp = makeStamp('mock');
      const proof = proofs.create(baseClaim, [stamp, stamp]);
      expect(proof.stamps).toHaveLength(2);
    });

    it('throws when no stamps provided', () => {
      expect(() => proofs.create(baseClaim, [])).toThrow('At least one stamp is required');
    });
  });

  describe('verify', () => {
    describe('single stamp proofs', () => {
      it('measures a co-located, co-temporal stamp', async () => {
        registry.register(createVerifyPlugin('mock'));
        const proof: LocationProof = {
          claim: baseClaim,
          stamps: [makeStamp('mock')],
        };

        const result = await proofs.verify(proof);

        // Stamp-level measurements
        expect(result.stampResults).toHaveLength(1);
        expect(result.stampResults[0].distanceMeters).toBe(0);
        expect(result.stampResults[0].temporalOverlap).toBe(1);
        expect(result.stampResults[0].withinRadius).toBe(true);

        // Dimensional assessment
        expect(result.dimensions.spatial.meanDistanceMeters).toBe(0);
        expect(result.dimensions.spatial.withinRadiusFraction).toBe(1);
        expect(result.dimensions.temporal.meanOverlap).toBe(1);
        expect(result.dimensions.temporal.fullyOverlappingFraction).toBe(1);
        expect(result.dimensions.validity.signaturesValidFraction).toBe(1);
        expect(result.dimensions.independence.uniquePluginRatio).toBe(1);

        // Metadata
        expect(result.meta.stampCount).toBe(1);
        expect(result.meta.evaluationMode).toBe('local');
      });

      it('reports zero validity fractions when stamp verification fails', async () => {
        const failResult = {
          valid: false,
          signaturesValid: false,
          structureValid: false,
          signalsConsistent: false,
          details: { error: 'invalid' },
        };
        registry.register(createVerifyPlugin('mock', failResult));
        const proof: LocationProof = {
          claim: baseClaim,
          stamps: [makeStamp('mock')],
        };

        const result = await proofs.verify(proof);
        expect(result.dimensions.validity.signaturesValidFraction).toBe(0);
        expect(result.dimensions.validity.structureValidFraction).toBe(0);
        expect(result.dimensions.validity.signalsConsistentFraction).toBe(0);
      });

      it('reports distance for a distant stamp', async () => {
        registry.register(createVerifyPlugin('mock'));
        const sfStamp = makeStamp('mock', {
          location: { type: 'Point', coordinates: [-122.4194, 37.7749] },
        });
        const proof: LocationProof = {
          claim: baseClaim,
          stamps: [sfStamp],
        };

        const result = await proofs.verify(proof);
        expect(result.stampResults[0].distanceMeters).toBeGreaterThan(4_000_000);
        expect(result.stampResults[0].withinRadius).toBe(false);
        expect(result.dimensions.spatial.withinRadiusFraction).toBe(0);
        expect(result.dimensions.spatial.meanDistanceMeters).toBeGreaterThan(4_000_000);
      });
    });

    describe('multi-stamp proofs', () => {
      it('reports independence metrics for multi-stamp proofs', async () => {
        registry.register(createVerifyPlugin('alpha'));
        registry.register(createVerifyPlugin('beta'));
        const proof: LocationProof = {
          claim: baseClaim,
          stamps: [makeStamp('alpha'), makeStamp('beta')],
        };

        const result = await proofs.verify(proof);
        expect(result.stampResults).toHaveLength(2);
        expect(result.dimensions.independence.uniquePluginRatio).toBe(1); // 2 plugins / 2 stamps
        expect(result.dimensions.independence.spatialAgreement).toBe(1); // Both agree
        expect(result.dimensions.independence.pluginNames).toEqual(['alpha', 'beta']);
      });

      it('shows stamp count in metadata', async () => {
        registry.register(createVerifyPlugin('alpha'));
        registry.register(createVerifyPlugin('beta'));

        const singleProof: LocationProof = {
          claim: baseClaim,
          stamps: [makeStamp('alpha')],
        };
        const multiProof: LocationProof = {
          claim: baseClaim,
          stamps: [makeStamp('alpha'), makeStamp('beta')],
        };

        const singleResult = await proofs.verify(singleProof);
        const multiResult = await proofs.verify(multiProof);

        expect(singleResult.meta.stampCount).toBe(1);
        expect(multiResult.meta.stampCount).toBe(2);

        // Both have perfect validity since all stamps verify
        expect(singleResult.dimensions.validity.signaturesValidFraction).toBe(1);
        expect(multiResult.dimensions.validity.signaturesValidFraction).toBe(1);
      });
    });

    describe('verification mode options', () => {
      it('verifies locally by default', async () => {
        registry.register(createVerifyPlugin('mock'));
        const proof: LocationProof = {
          claim: baseClaim,
          stamps: [makeStamp('mock')],
        };

        const result = await proofs.verify(proof);
        expect(result.meta.evaluationMode).toBe('local');
        expect(result.dimensions.validity.signaturesValidFraction).toBe(1);
      });

      it('verifies locally when mode is explicitly set to local', async () => {
        registry.register(createVerifyPlugin('mock'));
        const proof: LocationProof = {
          claim: baseClaim,
          stamps: [makeStamp('mock')],
        };

        const result = await proofs.verify(proof, { mode: 'local' });
        expect(result.meta.evaluationMode).toBe('local');
        expect(result.dimensions.validity.signaturesValidFraction).toBe(1);
      });

      it('throws for TEE verification without API client configured', async () => {
        registry.register(createVerifyPlugin('mock'));
        const proof: LocationProof = {
          claim: baseClaim,
          stamps: [makeStamp('mock')],
        };

        await expect(proofs.verify(proof, { mode: 'tee' })).rejects.toThrow(
          'TEE verification requires an API client'
        );
      });

      it('throws for ZK verification (not yet implemented)', async () => {
        registry.register(createVerifyPlugin('mock'));
        const proof: LocationProof = {
          claim: baseClaim,
          stamps: [makeStamp('mock')],
        };

        await expect(proofs.verify(proof, { mode: 'zk' })).rejects.toThrow(
          'ZK verification not yet implemented'
        );
      });
    });

    it('throws when plugin does not implement verify', async () => {
      registry.register({
        name: 'no-verify',
        version: '0.1.0',
        runtimes: ['node'],
        requiredCapabilities: [],
        description: 'No verify',
      });
      const proof: LocationProof = {
        claim: baseClaim,
        stamps: [makeStamp('no-verify')],
      };

      await expect(proofs.verify(proof)).rejects.toThrow('does not implement verify()');
    });
  });
});
