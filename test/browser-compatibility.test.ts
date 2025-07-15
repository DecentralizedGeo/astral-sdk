/**
 * Browser compatibility tests
 *
 * These tests verify that the SDK can be imported and used in browser environments
 * without fs-related errors
 */

describe('Browser Compatibility', () => {
  it('should not throw errors when importing the SDK in a browser-like environment', () => {
    // Mock browser environment
    const originalWindow = global.window;
    global.window = {} as Window & typeof globalThis;

    try {
      // This should not throw any errors
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const sdk = require('../src/index');
      expect(sdk).toBeDefined();
      expect(sdk.AstralSDK).toBeDefined();
    } finally {
      // Restore original window object
      global.window = originalWindow;
    }
  });

  it('should handle loadEASConfig without custom path in browser environment', () => {
    // Mock browser environment
    const originalWindow = global.window;
    global.window = {} as Window & typeof globalThis;

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { loadEASConfig } = require('../src/eas/chains');

      // Should work without a custom path (uses default EAS_CONFIG)
      const config = loadEASConfig();
      expect(config).toBeDefined();
      expect(config['v0.1']).toBeDefined();
    } finally {
      // Restore original window object
      global.window = originalWindow;
    }
  });
});
