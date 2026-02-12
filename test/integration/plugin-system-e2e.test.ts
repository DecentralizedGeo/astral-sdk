// Copyright © 2026 Sophia Systems Corporation

/**
 * Plugin System E2E Test
 *
 * This test demonstrates the complete plugin system workflow:
 * 1. Collecting location signals from proof-of-location plugins
 * 2. Creating unsigned stamps from raw signals
 * 3. Signing stamps with cryptographic signatures
 * 4. Verifying individual stamps
 * 5. Building proofs (claim + stamps)
 * 6. Evaluating proofs with multidimensional assessment
 * 7. Making trust decisions with custom weighting functions
 *
 * Run this test to verify the plugin system works end-to-end.
 */

import { AstralSDK } from '../../src/AstralSDK';
import { MockPlugin } from '../../src/plugins/mock';
import { ProofsModule } from '../../src/proofs/ProofsModule';
import type { LocationClaim, CredibilityVector } from '../../src/plugins/types';

// Deterministic key for reproducible tests
const TEST_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

// Test locations
const EMPIRE_STATE = { lat: 40.7484, lon: -73.9857 }; // New York
const TIMES_SQUARE = { lat: 40.758, lon: -73.9855 }; // ~1km from Empire State
const GOLDEN_GATE = { lat: 37.8199, lon: -122.4783 }; // San Francisco (~4,000km away)

describe('Plugin System E2E', () => {
  let sdk: AstralSDK;

  beforeEach(() => {
    // Initialize SDK with minimal config (no chain required for plugin system)
    sdk = new AstralSDK({ chainId: 11155111 });
  });

  describe('Scenario 1: Perfect Single-Stamp Proof', () => {
    it('should create and verify a proof with perfect co-location and temporal alignment', async () => {
      console.log('\n=== Scenario 1: Perfect Single-Stamp Proof ===\n');

      // Step 1: Register a plugin
      // Note: In production, plugin names represent PoL systems (e.g., 'proofmode', 'witnesschain').
      // Numbered here (mock-1, mock-2, etc.) only to allow multiple test scenarios in one suite.
      const plugin = new MockPlugin({
        name: 'mock-1',
        ...EMPIRE_STATE,
        timestamp: 1500, // Within claim time window
        privateKey: TEST_PRIVATE_KEY,
      });
      sdk.registry.register(plugin);
      console.log('✓ Registered MockPlugin');

      // Step 2: Collect location signals
      const signals = await sdk.stamps.collect({ plugins: ['mock-1'] });
      expect(signals).toHaveLength(1);
      expect(signals[0].plugin).toBe('mock-1');
      console.log('✓ Collected signals:', {
        plugin: signals[0].plugin,
        timestamp: signals[0].timestamp,
        lat: signals[0].data.latitude,
        lon: signals[0].data.longitude,
      });

      // Step 3: Create unsigned stamp
      const unsigned = await sdk.stamps.create({ plugin: 'mock-1' }, signals[0]);
      expect(unsigned.lpVersion).toBe('0.2');
      expect(unsigned.plugin).toBe('mock-1');
      console.log('✓ Created unsigned stamp');

      // Step 4: Sign stamp
      const stamp = await sdk.stamps.sign({ plugin: 'mock-1' }, unsigned, {
        algorithm: 'secp256k1',
        signer: { scheme: 'eth-address', value: plugin['wallet'].address },
        sign: async (data: string) => plugin['wallet'].signMessage(data),
      });
      expect(stamp.signatures).toHaveLength(1);
      expect(stamp.signatures[0].algorithm).toBe('secp256k1');
      console.log(
        '✓ Signed stamp with signature:',
        stamp.signatures[0].value.substring(0, 20) + '...'
      );

      // Step 5: Verify stamp
      const stampVerification = await sdk.stamps.verify(stamp);
      expect(stampVerification.valid).toBe(true);
      expect(stampVerification.signaturesValid).toBe(true);
      expect(stampVerification.structureValid).toBe(true);
      console.log('✓ Stamp verification passed');

      // Step 6: Create claim
      const claim: LocationClaim = {
        lpVersion: '0.2',
        locationType: 'geojson-point',
        location: { type: 'Point', coordinates: [EMPIRE_STATE.lon, EMPIRE_STATE.lat] },
        srs: 'EPSG:4326',
        subject: { scheme: 'eth-address', value: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' },
        radius: 100, // 100m radius
        time: { start: 1000, end: 2000 },
      };
      console.log('✓ Created claim for Empire State Building (100m radius)');

      // Step 7: Build proof
      const proof = sdk.proofs.create(claim, [stamp]);
      expect(proof.claim).toBe(claim);
      expect(proof.stamps).toHaveLength(1);
      console.log('✓ Built proof (1 stamp)');

      // Step 8: Verify proof with multidimensional assessment
      const vector = await sdk.proofs.verify(proof); // this should require specification of where to verify - and then we should run with flags for local, staging, production or custom and pass in verification api endpoint - no?
      console.log('\n📊 Credibility Assessment:\n');

      // Spatial dimension
      console.log('Spatial Dimension:');
      console.log('  - Mean distance:', vector.dimensions.spatial.meanDistanceMeters, 'm');
      console.log('  - Max distance:', vector.dimensions.spatial.maxDistanceMeters, 'm');
      console.log('  - Within radius fraction:', vector.dimensions.spatial.withinRadiusFraction);
      expect(vector.dimensions.spatial.meanDistanceMeters).toBe(0); // Perfect co-location
      expect(vector.dimensions.spatial.withinRadiusFraction).toBe(1); // 100% within radius

      // Temporal dimension
      console.log('\nTemporal Dimension:');
      console.log('  - Mean overlap:', vector.dimensions.temporal.meanOverlap);
      console.log('  - Min overlap:', vector.dimensions.temporal.minOverlap);
      console.log(
        '  - Fully overlapping fraction:',
        vector.dimensions.temporal.fullyOverlappingFraction
      );
      expect(vector.dimensions.temporal.meanOverlap).toBe(1); // Perfect temporal alignment
      expect(vector.dimensions.temporal.fullyOverlappingFraction).toBe(1);

      // Validity dimension
      console.log('\nValidity Dimension:');
      console.log('  - Signatures valid:', vector.dimensions.validity.signaturesValidFraction);
      console.log('  - Structure valid:', vector.dimensions.validity.structureValidFraction);
      console.log('  - Signals consistent:', vector.dimensions.validity.signalsConsistentFraction);
      expect(vector.dimensions.validity.signaturesValidFraction).toBe(1);
      expect(vector.dimensions.validity.structureValidFraction).toBe(1);
      expect(vector.dimensions.validity.signalsConsistentFraction).toBe(1);

      // Independence dimension
      console.log('\nIndependence Dimension:');
      console.log('  - Unique plugin ratio:', vector.dimensions.independence.uniquePluginRatio);
      console.log('  - Spatial agreement:', vector.dimensions.independence.spatialAgreement);
      console.log('  - Plugin names:', vector.dimensions.independence.pluginNames);
      expect(vector.dimensions.independence.uniquePluginRatio).toBe(1); // Single plugin
      expect(vector.dimensions.independence.pluginNames).toEqual(['mock-1']);

      // Metadata
      console.log('\nMetadata:');
      console.log('  - Stamp count:', vector.meta.stampCount);
      console.log('  - Evaluation mode:', vector.meta.evaluationMode);
      expect(vector.meta.stampCount).toBe(1);
      expect(vector.meta.evaluationMode).toBe('local');

      console.log('\n✅ Perfect proof: All dimensions show maximum support\n');
    });
  });

  describe('Scenario 2: Multi-Stamp Proof (Diverse Sources)', () => {
    it('should evaluate a proof with multiple stamps from the same location', async () => {
      console.log('\n=== Scenario 2: Multi-Stamp Proof ===\n');

      // Register two "different" plugins (simulating ProofMode + WitnessChain)
      const plugin1 = new MockPlugin({
        name: 'mock-gps',
        ...EMPIRE_STATE,
        timestamp: 1500,
        privateKey: TEST_PRIVATE_KEY,
      });

      const plugin2 = new MockPlugin({
        name: 'mock-wifi',
        ...EMPIRE_STATE,
        timestamp: 1600,
        // Hardhat test account #1 (different from #0) to simulate independent signers
        privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d',
      });

      sdk.registry.register(plugin1);
      sdk.registry.register(plugin2);
      console.log('✓ Registered 2 plugins (simulating GPS + WiFi)');

      // Collect from both
      const signals1 = await sdk.stamps.collect({ plugins: ['mock-gps'] });
      const signals2 = await sdk.stamps.collect({ plugins: ['mock-wifi'] });
      console.log('✓ Collected signals from both sources');

      // Create and sign stamps
      const unsigned1 = await sdk.stamps.create({ plugin: 'mock-gps' }, signals1[0]);
      const unsigned2 = await sdk.stamps.create({ plugin: 'mock-wifi' }, signals2[0]);

      const stamp1 = await sdk.stamps.sign({ plugin: 'mock-gps' }, unsigned1, {
        algorithm: 'secp256k1',
        signer: { scheme: 'eth-address', value: plugin1['wallet'].address },
        sign: async (data: string) => plugin1['wallet'].signMessage(data),
      });

      const stamp2 = await sdk.stamps.sign({ plugin: 'mock-wifi' }, unsigned2, {
        algorithm: 'secp256k1',
        signer: { scheme: 'eth-address', value: plugin2['wallet'].address },
        sign: async (data: string) => plugin2['wallet'].signMessage(data),
      });

      console.log('✓ Created and signed 2 stamps');

      // Build multi-stamp proof
      const claim: LocationClaim = {
        lpVersion: '0.2',
        locationType: 'geojson-point',
        location: { type: 'Point', coordinates: [EMPIRE_STATE.lon, EMPIRE_STATE.lat] },
        srs: 'EPSG:4326',
        subject: { scheme: 'eth-address', value: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' },
        radius: 100,
        time: { start: 1000, end: 2000 },
      };

      const proof = sdk.proofs.create(claim, [stamp1, stamp2]);
      console.log('✓ Built multi-stamp proof');

      // Verify with dimensional assessment
      const vector = await sdk.proofs.verify(proof);
      console.log('\n📊 Multi-Stamp Assessment:\n');

      console.log('Independence:');
      console.log('  - Unique plugin ratio:', vector.dimensions.independence.uniquePluginRatio);
      console.log('  - Plugin names:', vector.dimensions.independence.pluginNames);
      console.log('  - Spatial agreement:', vector.dimensions.independence.spatialAgreement);

      expect(vector.dimensions.independence.uniquePluginRatio).toBe(1); // 2 plugins / 2 stamps
      expect(vector.dimensions.independence.pluginNames).toHaveLength(2);
      expect(vector.dimensions.independence.spatialAgreement).toBe(1); // Both agree

      console.log('\nSpatial:');
      console.log('  - Mean distance:', vector.dimensions.spatial.meanDistanceMeters, 'm');
      console.log('  - Within radius fraction:', vector.dimensions.spatial.withinRadiusFraction);
      expect(vector.dimensions.spatial.withinRadiusFraction).toBe(1);

      console.log('\nMetadata:');
      console.log('  - Stamp count:', vector.meta.stampCount);
      expect(vector.meta.stampCount).toBe(2);

      console.log('\n✅ Multi-source proof shows strong independence\n');
    });
  });

  describe('Scenario 3: Nearby Stamp (Partial Support)', () => {
    it('should show reduced spatial support for a nearby but not co-located stamp', async () => {
      console.log('\n=== Scenario 3: Nearby Stamp ===\n');

      const plugin = new MockPlugin({
        name: 'mock-2',
        ...TIMES_SQUARE, // ~1km from claim
        timestamp: 1500,
        privateKey: TEST_PRIVATE_KEY,
      });
      sdk.registry.register(plugin);
      console.log('✓ Registered plugin at Times Square (~1km from claim)');

      // Full flow
      const signals = await sdk.stamps.collect({ plugins: ['mock-2'] });
      const unsigned = await sdk.stamps.create({ plugin: 'mock-2' }, signals[0]);
      const stamp = await sdk.stamps.sign({ plugin: 'mock-2' }, unsigned, {
        algorithm: 'secp256k1',
        signer: { scheme: 'eth-address', value: plugin['wallet'].address },
        sign: async (data: string) => plugin['wallet'].signMessage(data),
      });

      const claim: LocationClaim = {
        lpVersion: '0.2',
        locationType: 'geojson-point',
        location: { type: 'Point', coordinates: [EMPIRE_STATE.lon, EMPIRE_STATE.lat] },
        srs: 'EPSG:4326',
        subject: { scheme: 'eth-address', value: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' },
        radius: 100, // 100m radius
        time: { start: 1000, end: 2000 },
      };

      const proof = sdk.proofs.create(claim, [stamp]);
      const vector = await sdk.proofs.verify(proof);

      console.log('\n📊 Nearby Stamp Assessment:\n');
      console.log('Spatial:');
      console.log('  - Distance:', vector.dimensions.spatial.meanDistanceMeters, 'm');
      console.log('  - Within radius?:', vector.stampResults[0].withinRadius);
      console.log('  - Within radius fraction:', vector.dimensions.spatial.withinRadiusFraction);

      expect(vector.dimensions.spatial.meanDistanceMeters).toBeGreaterThan(500); // ~1km
      expect(vector.dimensions.spatial.withinRadiusFraction).toBe(0); // Outside 100m radius

      console.log('\nValidity (still perfect):');
      console.log('  - Signatures valid:', vector.dimensions.validity.signaturesValidFraction);
      expect(vector.dimensions.validity.signaturesValidFraction).toBe(1);

      console.log('\n⚠️  Stamp is valid but spatially distant from claim\n');
    });
  });

  describe('Scenario 4: Distant Stamp (No Support)', () => {
    it('should show zero spatial support for a stamp from a different city', async () => {
      console.log('\n=== Scenario 4: Distant Stamp ===\n');

      const plugin = new MockPlugin({
        name: 'mock-3',
        ...GOLDEN_GATE, // San Francisco, ~4000km away
        timestamp: 1500,
        privateKey: TEST_PRIVATE_KEY,
      });
      sdk.registry.register(plugin);
      console.log('✓ Registered plugin at Golden Gate Bridge (~4000km from claim)');

      const signals = await sdk.stamps.collect({ plugins: ['mock-3'] });
      const unsigned = await sdk.stamps.create({ plugin: 'mock-3' }, signals[0]);
      const stamp = await sdk.stamps.sign({ plugin: 'mock-3' }, unsigned, {
        algorithm: 'secp256k1',
        signer: { scheme: 'eth-address', value: plugin['wallet'].address },
        sign: async (data: string) => plugin['wallet'].signMessage(data),
      });

      const claim: LocationClaim = {
        lpVersion: '0.2',
        locationType: 'geojson-point',
        location: { type: 'Point', coordinates: [EMPIRE_STATE.lon, EMPIRE_STATE.lat] },
        srs: 'EPSG:4326',
        subject: { scheme: 'eth-address', value: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' },
        radius: 100,
        time: { start: 1000, end: 2000 },
      };

      const proof = sdk.proofs.create(claim, [stamp]);
      const vector = await sdk.proofs.verify(proof);

      console.log('\n📊 Distant Stamp Assessment:\n');
      console.log('Spatial:');
      console.log('  - Distance:', vector.dimensions.spatial.meanDistanceMeters, 'm');
      console.log('  - Within radius fraction:', vector.dimensions.spatial.withinRadiusFraction);

      expect(vector.dimensions.spatial.meanDistanceMeters).toBeGreaterThan(4_000_000);
      expect(vector.dimensions.spatial.withinRadiusFraction).toBe(0);

      console.log('\nValidity (still checks signatures):');
      console.log('  - Signatures valid:', vector.dimensions.validity.signaturesValidFraction);
      expect(vector.dimensions.validity.signaturesValidFraction).toBe(1);

      console.log('\n❌ Stamp is cryptographically valid but geographically irrelevant\n');
    });
  });

  describe('Scenario 5: Custom Weighting Functions', () => {
    it('should allow applications to make trust decisions with custom weighting', async () => {
      console.log('\n=== Scenario 5: Custom Weighting Functions ===\n');

      // Create a proof for testing different weighting strategies
      const plugin = new MockPlugin({
        name: 'mock-4',
        ...EMPIRE_STATE,
        timestamp: 1500,
        privateKey: TEST_PRIVATE_KEY,
      });
      sdk.registry.register(plugin);

      const signals = await sdk.stamps.collect({ plugins: ['mock-4'] });
      const unsigned = await sdk.stamps.create({ plugin: 'mock-4' }, signals[0]);
      const stamp = await sdk.stamps.sign({ plugin: 'mock-4' }, unsigned, {
        algorithm: 'secp256k1',
        signer: { scheme: 'eth-address', value: plugin['wallet'].address },
        sign: async (data: string) => plugin['wallet'].signMessage(data),
      });

      const claim: LocationClaim = {
        lpVersion: '0.2',
        locationType: 'geojson-point',
        location: { type: 'Point', coordinates: [EMPIRE_STATE.lon, EMPIRE_STATE.lat] },
        srs: 'EPSG:4326',
        subject: { scheme: 'eth-address', value: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' },
        radius: 100,
        time: { start: 1000, end: 2000 },
      };

      const proof = sdk.proofs.create(claim, [stamp]);
      const vector = await sdk.proofs.verify(proof);

      console.log('Testing different weighting strategies:\n');

      // Example 1: SDK's basic weighting
      const basicScore = ProofsModule.exampleWeighting(vector);
      console.log('1. SDK Example Weighting:', basicScore);
      expect(basicScore).toBeGreaterThan(0.8);

      // Example 2: High-security application (strict requirements)
      function highSecurityWeighting(v: CredibilityVector): number {
        // Require multi-source AND perfect validity
        if (v.meta.stampCount < 2) return 0; // Must have multiple sources
        if (v.dimensions.validity.signaturesValidFraction < 1.0) return 0; // All must verify

        return (
          0.5 * v.dimensions.spatial.withinRadiusFraction +
          0.3 * v.dimensions.independence.uniquePluginRatio +
          0.2 * v.dimensions.temporal.meanOverlap
        );
      }
      const securityScore = highSecurityWeighting(vector);
      console.log('2. High-Security Weighting:', securityScore, '(requires 2+ sources)');
      expect(securityScore).toBe(0); // Fails due to single stamp

      // Example 3: Navigation app (just care about spatial)
      function navigationWeighting(v: CredibilityVector): number {
        return v.dimensions.spatial.withinRadiusFraction;
      }
      const navScore = navigationWeighting(vector);
      console.log('3. Navigation Weighting:', navScore, '(only cares about location)');
      expect(navScore).toBe(1);

      // Example 4: Balanced approach
      function balancedWeighting(v: CredibilityVector): number {
        return (
          0.4 * v.dimensions.spatial.withinRadiusFraction +
          0.3 * v.dimensions.temporal.meanOverlap +
          0.2 * v.dimensions.validity.signaturesValidFraction +
          0.1 * v.dimensions.independence.uniquePluginRatio
        );
      }
      const balancedScore = balancedWeighting(vector);
      console.log('4. Balanced Weighting:', balancedScore);
      expect(balancedScore).toBeGreaterThan(0.9);

      console.log('\n✅ Applications can implement custom trust models\n');
    });
  });

  describe('Scenario 6: Temporal Mismatch', () => {
    it('should show reduced temporal support for stamps outside claim time window', async () => {
      console.log('\n=== Scenario 6: Temporal Mismatch ===\n');

      const plugin = new MockPlugin({
        name: 'mock-5',
        ...EMPIRE_STATE,
        timestamp: 3000, // Outside claim time window (1000-2000)
        privateKey: TEST_PRIVATE_KEY,
      });
      sdk.registry.register(plugin);
      console.log('✓ Registered plugin with timestamp 3000 (claim window: 1000-2000)');

      const signals = await sdk.stamps.collect({ plugins: ['mock-5'] });
      const unsigned = await sdk.stamps.create({ plugin: 'mock-5' }, signals[0]);
      const stamp = await sdk.stamps.sign({ plugin: 'mock-5' }, unsigned, {
        algorithm: 'secp256k1',
        signer: { scheme: 'eth-address', value: plugin['wallet'].address },
        sign: async (data: string) => plugin['wallet'].signMessage(data),
      });

      const claim: LocationClaim = {
        lpVersion: '0.2',
        locationType: 'geojson-point',
        location: { type: 'Point', coordinates: [EMPIRE_STATE.lon, EMPIRE_STATE.lat] },
        srs: 'EPSG:4326',
        subject: { scheme: 'eth-address', value: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' },
        radius: 100,
        time: { start: 1000, end: 2000 },
      };

      const proof = sdk.proofs.create(claim, [stamp]);
      const vector = await sdk.proofs.verify(proof);

      console.log('\n📊 Temporal Mismatch Assessment:\n');
      console.log('Spatial (still perfect):');
      console.log('  - Distance:', vector.dimensions.spatial.meanDistanceMeters, 'm');
      console.log('  - Within radius fraction:', vector.dimensions.spatial.withinRadiusFraction);
      expect(vector.dimensions.spatial.withinRadiusFraction).toBe(1);

      console.log('\nTemporal (no overlap):');
      console.log('  - Mean overlap:', vector.dimensions.temporal.meanOverlap);
      console.log(
        '  - Fully overlapping fraction:',
        vector.dimensions.temporal.fullyOverlappingFraction
      );
      expect(vector.dimensions.temporal.meanOverlap).toBe(0); // No overlap
      expect(vector.dimensions.temporal.fullyOverlappingFraction).toBe(0);

      console.log('\n⏰ Stamp is in the right place but wrong time\n');
    });
  });
});
