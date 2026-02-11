// Copyright © 2026 Sophia Systems Corporation

import { PluginRegistry } from '../../src/plugins/registry';
import { VerifyModule } from '../../src/verify/VerifyModule';
import type {
  LocationProofPlugin,
  LocationStamp,
  LocationClaim,
  LocationProof,
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
  },
  evaluateResult = { supportsClaim: true, score: 0.8, spatial: 0.85, temporal: 0.9, details: {} }
): LocationProofPlugin {
  return {
    name,
    version: '0.1.0',
    runtimes: ['node'],
    requiredCapabilities: [],
    description: `Test plugin ${name}`,
    verify: jest.fn().mockResolvedValue(verifyResult),
    evaluate: jest.fn().mockResolvedValue(evaluateResult),
  };
}

describe('VerifyModule', () => {
  let registry: PluginRegistry;
  let verify: VerifyModule;

  beforeEach(() => {
    registry = new PluginRegistry('node');
    verify = new VerifyModule(registry);
  });

  describe('stamp', () => {
    it('verifies a stamp using its plugin', async () => {
      registry.register(createVerifyPlugin('mock'));
      const result = await verify.stamp(makeStamp('mock'));
      expect(result.valid).toBe(true);
      expect(result.signaturesValid).toBe(true);
    });

    it('throws when plugin has no verify method', async () => {
      registry.register({
        name: 'no-verify',
        version: '0.1.0',
        runtimes: ['node'],
        requiredCapabilities: [],
        description: 'No verify',
      });
      await expect(verify.stamp(makeStamp('no-verify'))).rejects.toThrow(
        'does not implement verify()'
      );
    });

    it('throws for hosted verification (not yet implemented)', async () => {
      registry.register(createVerifyPlugin('mock'));
      await expect(verify.stamp(makeStamp('mock'), { hosted: true })).rejects.toThrow(
        'Hosted verification not yet implemented'
      );
    });
  });

  describe('proof (single stamp)', () => {
    it('verifies and evaluates a single-stamp proof', async () => {
      registry.register(createVerifyPlugin('mock'));
      const proof: LocationProof = {
        claim: baseClaim,
        stamps: [makeStamp('mock')],
      };

      const result = await verify.proof(proof);
      expect(result.stampResults).toHaveLength(1);
      expect(result.stampResults[0].supportsClaim).toBe(true);
      expect(result.stampResults[0].claimSupportScore).toBe(0.8);
      expect(result.confidence).toBeLessThanOrEqual(0.85); // Single stamp cap
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

      const result = await verify.proof(proof);
      expect(result.confidence).toBe(0);
    });
  });

  describe('proof (multi-stamp)', () => {
    it('includes correlation for multi-stamp proofs', async () => {
      registry.register(createVerifyPlugin('alpha'));
      registry.register(createVerifyPlugin('beta'));
      const proof: LocationProof = {
        claim: baseClaim,
        stamps: [makeStamp('alpha'), makeStamp('beta')],
      };

      const result = await verify.proof(proof);
      expect(result.stampResults).toHaveLength(2);
      expect(result.correlation).toBeDefined();
      expect(result.correlation!.independence).toBe(1); // Two different plugins
      expect(result.correlation!.agreement).toBeGreaterThan(0); // Same scores
    });

    it('gives independence bonus for diverse plugins', async () => {
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

      const singleResult = await verify.proof(singleProof);
      const multiResult = await verify.proof(multiProof);

      // Multi-stamp with independent plugins should score higher
      expect(multiResult.confidence).toBeGreaterThan(singleResult.confidence);
    });
  });

  describe('plugins', () => {
    it('lists registered plugins', () => {
      registry.register(createVerifyPlugin('alpha'));
      registry.register(createVerifyPlugin('beta'));
      const list = verify.plugins();
      expect(list).toHaveLength(2);
      expect(list.map(p => p.name)).toEqual(['alpha', 'beta']);
    });
  });
});
