// Copyright © 2026 Sophia Systems Corporation

/**
 * StampsModule — evidence collection orchestration
 *
 * Coordinates plugin collect/create/sign operations across registered plugins.
 * Developers call `astral.stamps.collect()` and get back signed LocationStamps
 * without managing individual plugin lifecycles.
 */

import { PluginRegistry } from '../plugins/registry';
import type {
  LocationStamp,
  UnsignedLocationStamp,
  RawSignals,
  CollectOptions,
  StampSigner,
} from '../plugins/types';

export interface StampsCollectOptions extends CollectOptions {
  /** Which plugins to collect from. If omitted, uses all plugins that implement collect(). */
  plugins?: string[];
}

export interface StampsCreateOptions {
  /** Which plugin to use for creating the stamp. */
  plugin: string;
}

export interface StampsSignOptions {
  /** Which plugin to use for signing. */
  plugin: string;
}

/**
 * StampsModule provides stamp collection, creation, and signing.
 *
 * Usage:
 * ```typescript
 * const signals = await astral.stamps.collect({ plugins: ['mock'] });
 * const unsigned = await astral.stamps.create({ plugin: 'mock' }, signals[0]);
 * const stamp = await astral.stamps.sign({ plugin: 'mock' }, unsigned, signer);
 * ```
 */
export class StampsModule {
  constructor(private readonly registry: PluginRegistry) {}

  /**
   * Collect raw signals from one or more plugins.
   *
   * Calls `collect()` on each specified plugin (or all plugins that support it)
   * and returns the array of raw signal results.
   */
  async collect(options?: StampsCollectOptions): Promise<RawSignals[]> {
    const plugins = options?.plugins
      ? options.plugins.map(name => this.registry.get(name))
      : this.registry.withMethod('collect');

    if (plugins.length === 0) {
      throw new Error('No plugins available that implement collect()');
    }

    const collectPromises = plugins.map(plugin => {
      if (!plugin.collect) {
        throw new Error(`Plugin '${plugin.name}' does not implement collect()`);
      }
      return plugin.collect(options);
    });

    return Promise.all(collectPromises);
  }

  /**
   * Create an unsigned stamp from raw signals using a specific plugin.
   */
  async create(options: StampsCreateOptions, signals: RawSignals): Promise<UnsignedLocationStamp> {
    const plugin = this.registry.get(options.plugin);
    if (!plugin.create) {
      throw new Error(`Plugin '${plugin.name}' does not implement create()`);
    }
    return plugin.create(signals);
  }

  /**
   * Sign an unsigned stamp using a specific plugin and signer.
   */
  async sign(
    options: StampsSignOptions,
    stamp: UnsignedLocationStamp,
    signer: StampSigner
  ): Promise<LocationStamp> {
    const plugin = this.registry.get(options.plugin);
    if (!plugin.sign) {
      throw new Error(`Plugin '${plugin.name}' does not implement sign()`);
    }
    return plugin.sign(stamp, signer);
  }
}
