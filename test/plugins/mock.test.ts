// Copyright © 2026 Sophia Systems Corporation

import { MockPlugin } from '../../src/plugins/mock';
import { PluginRegistry } from '../../src/plugins/registry';
import { StampsModule } from '../../src/stamps/StampsModule';
import { ProofsModule } from '../../src/proofs/ProofsModule';
import { VerifyModule } from '../../src/verify/VerifyModule';
import type { LocationClaim } from '../../src/plugins/types';

// Deterministic key for reproducible tests
const TEST_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

const NYC = { lat: 40.7484, lon: -73.9857 }; // Empire State Building
const SF = { lat: 37.7749, lon: -122.4194 }; // San Francisco

const nycClaim: LocationClaim = {
  lpVersion: '0.2',
  locationType: 'geojson-point',
  location: { type: 'Point', coordinates: [NYC.lon, NYC.lat] },
  srs: 'EPSG:4326',
  subject: { scheme: 'eth-address', value: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' },
  radius: 100,
  time: { start: 1000, end: 2000 },
};

describe('MockPlugin', () => {
  describe('full lifecycle: collect → create → sign → verify → evaluate', () => {
    it('completes the entire stamp lifecycle with valid results', async () => {
      const mock = new MockPlugin({
        ...NYC,
        timestamp: 1500,
        privateKey: TEST_PRIVATE_KEY,
      });

      // 1. Collect
      const signals = await mock.collect();
      expect(signals.plugin).toBe('mock');
      expect(signals.data.latitude).toBeCloseTo(NYC.lat, 3);
      expect(signals.data.longitude).toBeCloseTo(NYC.lon, 3);

      // 2. Create
      const unsigned = await mock.create(signals);
      expect(unsigned.lpVersion).toBe('0.2');
      expect(unsigned.plugin).toBe('mock');
      expect(unsigned.temporalFootprint.start).toBe(1500);

      // 3. Sign (uses internal wallet)
      const stamp = await mock.sign(unsigned);
      expect(stamp.signatures).toHaveLength(1);
      expect(stamp.signatures[0].algorithm).toBe('secp256k1');
      expect(stamp.signatures[0].value).toBeTruthy();

      // 4. Verify
      const verification = await mock.verify(stamp);
      expect(verification.valid).toBe(true);
      expect(verification.signaturesValid).toBe(true);
      expect(verification.structureValid).toBe(true);
      expect(verification.signalsConsistent).toBe(true);

      // 5. Evaluate against NYC claim
      const evaluation = await mock.evaluate(stamp, nycClaim);
      expect(evaluation.supportsClaim).toBe(true);
      expect(evaluation.spatial).toBeGreaterThan(0.5);
      expect(evaluation.temporal).toBeGreaterThan(0);
      expect(evaluation.score).toBeGreaterThan(0.3);
    });
  });

  describe('collect', () => {
    it('applies jitter when configured', async () => {
      const mock = new MockPlugin({ ...NYC, jitterMeters: 1000 });
      const s1 = await mock.collect();
      const s2 = await mock.collect();
      // With 1000m jitter, coordinates should vary between calls
      // (not deterministic, but extremely unlikely to be identical)
      const lat1 = s1.data.latitude as number;
      const lat2 = s2.data.latitude as number;
      // Just check they're in the right neighborhood
      expect(Math.abs(lat1 - NYC.lat)).toBeLessThan(0.1);
      expect(Math.abs(lat2 - NYC.lat)).toBeLessThan(0.1);
    });

    it('uses high accuracy when requested', async () => {
      const mock = new MockPlugin({ accuracy: 20 });
      const signals = await mock.collect({ accuracy: 'high' });
      expect(signals.data.accuracy).toBe(10); // half of 20
    });
  });

  describe('verify', () => {
    it('rejects stamp with wrong plugin name', async () => {
      const mock = new MockPlugin({ ...NYC, privateKey: TEST_PRIVATE_KEY });
      const signals = await mock.collect();
      const unsigned = await mock.create(signals);
      const stamp = await mock.sign(unsigned);

      // Tamper with plugin name
      const tampered = { ...stamp, plugin: 'fake' };
      const result = await mock.verify(tampered);
      expect(result.structureValid).toBe(false);
    });

    it('rejects stamp with no signatures', async () => {
      const mock = new MockPlugin({ ...NYC, privateKey: TEST_PRIVATE_KEY });
      const signals = await mock.collect();
      const unsigned = await mock.create(signals);
      const stamp = await mock.sign(unsigned);

      const noSigs = { ...stamp, signatures: [] };
      const result = await mock.verify(noSigs);
      expect(result.signaturesValid).toBe(false);
      expect(result.valid).toBe(false);
    });

    it('rejects stamp with tampered data', async () => {
      const mock = new MockPlugin({ ...NYC, privateKey: TEST_PRIVATE_KEY });
      const signals = await mock.collect();
      const unsigned = await mock.create(signals);
      const stamp = await mock.sign(unsigned);

      // Tamper with signals after signing
      const tampered = {
        ...stamp,
        signals: { ...stamp.signals, latitude: 0 },
      };
      const result = await mock.verify(tampered);
      expect(result.signaturesValid).toBe(false);
    });

    it('rejects stamp with invalid coordinates', async () => {
      const mock = new MockPlugin({ ...NYC, privateKey: TEST_PRIVATE_KEY });
      const signals = await mock.collect();
      const unsigned = await mock.create(signals);
      const stamp = await mock.sign(unsigned);

      const invalid = {
        ...stamp,
        signals: { ...stamp.signals, latitude: 999 },
      };
      const result = await mock.verify(invalid);
      expect(result.signalsConsistent).toBe(false);
    });
  });

  describe('evaluate', () => {
    it('gives high score for co-located stamp and claim', async () => {
      const mock = new MockPlugin({ ...NYC, timestamp: 1500, privateKey: TEST_PRIVATE_KEY });
      const signals = await mock.collect();
      const unsigned = await mock.create(signals);
      const stamp = await mock.sign(unsigned);

      const result = await mock.evaluate(stamp, nycClaim);
      expect(result.supportsClaim).toBe(true);
      expect(result.spatial).toBeGreaterThan(0.8);
    });

    it('gives low score for distant stamp', async () => {
      const mock = new MockPlugin({ ...SF, timestamp: 1500, privateKey: TEST_PRIVATE_KEY });
      const signals = await mock.collect();
      const unsigned = await mock.create(signals);
      const stamp = await mock.sign(unsigned);

      const result = await mock.evaluate(stamp, nycClaim);
      expect(result.supportsClaim).toBe(false);
      expect(result.spatial).toBe(0);
    });

    it('gives zero temporal score for non-overlapping times', async () => {
      const mock = new MockPlugin({ ...NYC, timestamp: 5000, privateKey: TEST_PRIVATE_KEY });
      const signals = await mock.collect();
      const unsigned = await mock.create(signals);
      const stamp = await mock.sign(unsigned);

      const result = await mock.evaluate(stamp, nycClaim);
      expect(result.temporal).toBe(0);
    });
  });

  describe('SDK integration', () => {
    it('works through the SDK stamps/proofs/verify pipeline', async () => {
      const mock = new MockPlugin({ ...NYC, timestamp: 1500, privateKey: TEST_PRIVATE_KEY });

      const registry = new PluginRegistry('node');
      registry.register(mock);

      const stamps = new StampsModule(registry);
      const proofs = new ProofsModule();
      const verify = new VerifyModule(registry);

      // Collect
      const signalResults = await stamps.collect({ plugins: ['mock'] });
      expect(signalResults).toHaveLength(1);

      // Create
      const unsigned = await stamps.create({ plugin: 'mock' }, signalResults[0]);

      // Sign
      const stamp = await stamps.sign({ plugin: 'mock' }, unsigned, {
        algorithm: 'secp256k1',
        signer: { scheme: 'eth-address', value: mock['wallet'].address },
        sign: async (data: string) => mock['wallet'].signMessage(data),
      });

      // Build proof
      const proof = proofs.create(nycClaim, [stamp]);

      // Verify
      const assessment = await verify.proof(proof);
      expect(assessment.confidence).toBeGreaterThan(0);
      expect(assessment.stampResults).toHaveLength(1);
      expect(assessment.stampResults[0].supportsClaim).toBe(true);
    });
  });
});
