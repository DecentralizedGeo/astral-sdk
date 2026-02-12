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
        expect(result.stampResults).toHaveLength(1);
        expect(result.stampResults[0].distanceMeters).toBe(0);
        expect(result.stampResults[0].temporalOverlap).toBe(1);
        expect(result.stampResults[0].withinRadius).toBe(true);
        expect(result.confidence).toBe(1);
        expect(result.correlation).toBeUndefined();
      });

      it('returns zero confidence when stamp verification fails', async () => {
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
        expect(result.confidence).toBe(0);
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
        expect(result.confidence).toBe(0);
      });
    });

    describe('multi-stamp proofs', () => {
      it('includes correlation for multi-stamp proofs', async () => {
        registry.register(createVerifyPlugin('alpha'));
        registry.register(createVerifyPlugin('beta'));
        const proof: LocationProof = {
          claim: baseClaim,
          stamps: [makeStamp('alpha'), makeStamp('beta')],
        };

        const result = await proofs.verify(proof);
        expect(result.stampResults).toHaveLength(2);
        expect(result.correlation).toBeDefined();
        expect(result.correlation!.independence).toBe(1);
        expect(result.correlation!.agreement).toBe(1);
      });

      it('reports higher confidence when more stamps support claim', async () => {
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

        // Both should be 1.0 since all stamps are co-located and co-temporal
        expect(singleResult.confidence).toBe(1);
        expect(multiResult.confidence).toBe(1);
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
        expect(result.confidence).toBe(1);
      });

      it('verifies locally when mode is explicitly set to local', async () => {
        registry.register(createVerifyPlugin('mock'));
        const proof: LocationProof = {
          claim: baseClaim,
          stamps: [makeStamp('mock')],
        };

        const result = await proofs.verify(proof, { mode: 'local' });
        expect(result.confidence).toBe(1);
      });

      it('throws for TEE verification (not yet implemented)', async () => {
        registry.register(createVerifyPlugin('mock'));
        const proof: LocationProof = {
          claim: baseClaim,
          stamps: [makeStamp('mock')],
        };

        await expect(proofs.verify(proof, { mode: 'tee' })).rejects.toThrow(
          'TEE verification not yet implemented'
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
