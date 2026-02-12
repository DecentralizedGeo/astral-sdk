// Copyright © 2025 Sophia Systems Corporation

/**
 * Plugin Registry
 *
 * Manages registration, lookup, and runtime validation of location proof plugins.
 * Used by the SDK to orchestrate plugin operations across stamps/proofs/verify.
 */

import type { LocationProofPlugin, PluginMetadata, Runtime } from './types';
import { getPluginMetadata } from './types';

/**
 * Detects the current runtime environment.
 */
function detectRuntime(): Runtime {
  // React Native sets navigator.product to 'ReactNative'
  if (
    typeof navigator !== 'undefined' &&
    (navigator as unknown as Record<string, unknown>).product === 'ReactNative'
  ) {
    return 'react-native';
  }
  // Node.js has process.versions.node
  if (typeof process !== 'undefined' && process.versions?.node) {
    return 'node';
  }
  // Everything else is browser
  return 'browser';
}

/**
 * PluginRegistry manages location proof plugins.
 *
 * Validates that registered plugins support the current runtime and provides
 * lookup by name. Plugins are registered by the application at startup —
 * the SDK doesn't auto-discover plugins.
 */
export class PluginRegistry {
  private readonly plugins = new Map<string, LocationProofPlugin>();
  private readonly runtime: Runtime;

  constructor(runtime?: Runtime) {
    this.runtime = runtime ?? detectRuntime();
  }

  /**
   * Register a plugin. Validates that it supports the current runtime.
   *
   * @throws Error if the plugin doesn't support the current runtime
   */
  register(plugin: LocationProofPlugin): void {
    if (!plugin.runtimes.includes(this.runtime)) {
      throw new Error(
        `Plugin '${plugin.name}' does not support runtime '${this.runtime}'. ` +
          `Supported runtimes: ${plugin.runtimes.join(', ')}`
      );
    }

    if (this.plugins.has(plugin.name)) {
      console.warn(`Plugin '${plugin.name}' already registered, replacing`);
    }

    this.plugins.set(plugin.name, plugin);
  }

  /**
   * Get a plugin by name.
   *
   * @throws Error if the plugin is not registered
   */
  get(name: string): LocationProofPlugin {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      const available = Array.from(this.plugins.keys()).join(', ') || 'none';
      throw new Error(`Plugin '${name}' not found. Registered plugins: ${available}`);
    }
    return plugin;
  }

  /**
   * Check if a plugin is registered.
   */
  has(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * List metadata for all registered plugins.
   */
  list(): PluginMetadata[] {
    return Array.from(this.plugins.values()).map(getPluginMetadata);
  }

  /**
   * Get all registered plugin instances.
   */
  all(): LocationProofPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugins that implement a specific method.
   */
  withMethod(method: keyof LocationProofPlugin): LocationProofPlugin[] {
    return this.all().filter(p => typeof p[method] === 'function');
  }

  /**
   * The detected or configured runtime.
   */
  get currentRuntime(): Runtime {
    return this.runtime;
  }

  /**
   * Number of registered plugins.
   */
  get size(): number {
    return this.plugins.size;
  }

  /**
   * Remove all registered plugins. Primarily for testing.
   */
  clear(): void {
    this.plugins.clear();
  }
}
