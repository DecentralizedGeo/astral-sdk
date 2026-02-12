// Copyright © 2026 Sophia Systems Corporation

import { PluginRegistry } from '../../src/plugins/registry';
import type { LocationProofPlugin } from '../../src/plugins/types';

/** Minimal mock plugin for testing registry behavior. */
function createMockPlugin(overrides: Partial<LocationProofPlugin> = {}): LocationProofPlugin {
  return {
    name: 'test-plugin',
    version: '1.0.0',
    runtimes: ['node'],
    requiredCapabilities: [],
    description: 'A test plugin',
    ...overrides,
  };
}

describe('PluginRegistry', () => {
  let registry: PluginRegistry;

  beforeEach(() => {
    // Force 'node' runtime for deterministic tests
    registry = new PluginRegistry('node');
  });

  describe('register', () => {
    it('registers a plugin that supports the current runtime', () => {
      const plugin = createMockPlugin();
      registry.register(plugin);
      expect(registry.has('test-plugin')).toBe(true);
      expect(registry.size).toBe(1);
    });

    it('throws when plugin does not support current runtime', () => {
      const plugin = createMockPlugin({ runtimes: ['react-native'] });
      expect(() => registry.register(plugin)).toThrow("does not support runtime 'node'");
    });

    it('replaces existing plugin with same name', () => {
      const v1 = createMockPlugin({ version: '1.0.0' });
      const v2 = createMockPlugin({ version: '2.0.0' });
      registry.register(v1);
      registry.register(v2);
      expect(registry.get('test-plugin').version).toBe('2.0.0');
      expect(registry.size).toBe(1);
    });

    it('registers multiple plugins', () => {
      registry.register(createMockPlugin({ name: 'alpha' }));
      registry.register(createMockPlugin({ name: 'beta' }));
      expect(registry.size).toBe(2);
    });
  });

  describe('get', () => {
    it('returns the registered plugin', () => {
      const plugin = createMockPlugin();
      registry.register(plugin);
      expect(registry.get('test-plugin')).toBe(plugin);
    });

    it('throws when plugin not found', () => {
      expect(() => registry.get('nonexistent')).toThrow("Plugin 'nonexistent' not found");
    });

    it('includes available plugins in error message', () => {
      registry.register(createMockPlugin({ name: 'alpha' }));
      registry.register(createMockPlugin({ name: 'beta' }));
      expect(() => registry.get('gamma')).toThrow('alpha, beta');
    });
  });

  describe('has', () => {
    it('returns true for registered plugin', () => {
      registry.register(createMockPlugin());
      expect(registry.has('test-plugin')).toBe(true);
    });

    it('returns false for unregistered plugin', () => {
      expect(registry.has('test-plugin')).toBe(false);
    });
  });

  describe('list', () => {
    it('returns empty array when no plugins registered', () => {
      expect(registry.list()).toEqual([]);
    });

    it('returns metadata for all registered plugins', () => {
      registry.register(createMockPlugin({ name: 'alpha' }));
      registry.register(createMockPlugin({ name: 'beta', requiredCapabilities: ['gps'] }));
      const list = registry.list();
      expect(list).toHaveLength(2);
      expect(list[0].name).toBe('alpha');
      expect(list[1].name).toBe('beta');
      expect(list[1].requiredCapabilities).toEqual(['gps']);
    });
  });

  describe('all', () => {
    it('returns all plugin instances', () => {
      const a = createMockPlugin({ name: 'alpha' });
      const b = createMockPlugin({ name: 'beta' });
      registry.register(a);
      registry.register(b);
      expect(registry.all()).toEqual([a, b]);
    });
  });

  describe('withMethod', () => {
    it('filters plugins by method presence', () => {
      const withCollect = createMockPlugin({
        name: 'collector',
        collect: async () => ({ plugin: 'collector', timestamp: 0, data: {} }),
      });
      const withoutCollect = createMockPlugin({ name: 'verifier-only' });

      registry.register(withCollect);
      registry.register(withoutCollect);

      const collectors = registry.withMethod('collect');
      expect(collectors).toHaveLength(1);
      expect(collectors[0].name).toBe('collector');
    });
  });

  describe('currentRuntime', () => {
    it('returns the configured runtime', () => {
      expect(registry.currentRuntime).toBe('node');
    });

    it('accepts browser runtime', () => {
      const browserRegistry = new PluginRegistry('browser');
      expect(browserRegistry.currentRuntime).toBe('browser');
    });
  });

  describe('clear', () => {
    it('removes all plugins', () => {
      registry.register(createMockPlugin());
      expect(registry.size).toBe(1);
      registry.clear();
      expect(registry.size).toBe(0);
      expect(registry.has('test-plugin')).toBe(false);
    });
  });
});
