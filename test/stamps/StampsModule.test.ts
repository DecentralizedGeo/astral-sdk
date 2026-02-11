// Copyright © 2026 Sophia Systems Corporation

import { PluginRegistry } from '../../src/plugins/registry';
import { StampsModule } from '../../src/stamps/StampsModule';
import type {
  LocationProofPlugin,
  RawSignals,
  UnsignedLocationStamp,
  LocationStamp,
  StampSigner,
} from '../../src/plugins/types';

const mockSignals: RawSignals = {
  plugin: 'test',
  timestamp: 1000,
  data: { lat: 40.7484, lon: -73.9857 },
};

const mockUnsigned: UnsignedLocationStamp = {
  lpVersion: '0.2',
  locationType: 'geojson-point',
  location: { type: 'Point', coordinates: [-73.9857, 40.7484] },
  srs: 'EPSG:4326',
  temporalFootprint: { start: 1000, end: 2000 },
  plugin: 'test',
  pluginVersion: '0.1.0',
  signals: { lat: 40.7484, lon: -73.9857 },
};

const mockSigned: LocationStamp = {
  ...mockUnsigned,
  signatures: [
    {
      signer: { scheme: 'eth-address', value: '0xabc' },
      algorithm: 'secp256k1',
      value: '0xdeadbeef',
      timestamp: 1000,
    },
  ],
};

function fullPlugin(): LocationProofPlugin {
  return {
    name: 'test',
    version: '0.1.0',
    runtimes: ['node'],
    requiredCapabilities: [],
    description: 'Test plugin',
    collect: jest.fn().mockResolvedValue(mockSignals),
    create: jest.fn().mockResolvedValue(mockUnsigned),
    sign: jest.fn().mockResolvedValue(mockSigned),
  };
}

describe('StampsModule', () => {
  let registry: PluginRegistry;
  let stamps: StampsModule;

  beforeEach(() => {
    registry = new PluginRegistry('node');
    stamps = new StampsModule(registry);
  });

  describe('collect', () => {
    it('collects signals from a named plugin', async () => {
      registry.register(fullPlugin());
      const results = await stamps.collect({ plugins: ['test'] });
      expect(results).toHaveLength(1);
      expect(results[0].plugin).toBe('test');
    });

    it('collects from all plugins when no names specified', async () => {
      registry.register(fullPlugin());
      const results = await stamps.collect();
      expect(results).toHaveLength(1);
    });

    it('throws when no plugins implement collect', async () => {
      registry.register({
        name: 'verify-only',
        version: '0.1.0',
        runtimes: ['node'],
        requiredCapabilities: [],
        description: 'No collect',
      });
      await expect(stamps.collect()).rejects.toThrow('No plugins available');
    });

    it('throws when named plugin does not implement collect', async () => {
      registry.register({
        name: 'verify-only',
        version: '0.1.0',
        runtimes: ['node'],
        requiredCapabilities: [],
        description: 'No collect',
      });
      await expect(stamps.collect({ plugins: ['verify-only'] })).rejects.toThrow(
        'does not implement collect()'
      );
    });
  });

  describe('create', () => {
    it('creates an unsigned stamp from signals', async () => {
      registry.register(fullPlugin());
      const result = await stamps.create({ plugin: 'test' }, mockSignals);
      expect(result.plugin).toBe('test');
      expect(result.lpVersion).toBe('0.2');
    });

    it('throws when plugin does not implement create', async () => {
      registry.register({
        name: 'no-create',
        version: '0.1.0',
        runtimes: ['node'],
        requiredCapabilities: [],
        description: 'No create',
      });
      await expect(stamps.create({ plugin: 'no-create' }, mockSignals)).rejects.toThrow(
        'does not implement create()'
      );
    });
  });

  describe('sign', () => {
    it('signs an unsigned stamp', async () => {
      registry.register(fullPlugin());
      const signer: StampSigner = {
        algorithm: 'secp256k1',
        signer: { scheme: 'eth-address', value: '0xabc' },
        sign: jest.fn().mockResolvedValue('0xdeadbeef'),
      };
      const result = await stamps.sign({ plugin: 'test' }, mockUnsigned, signer);
      expect(result.signatures).toHaveLength(1);
    });
  });
});
