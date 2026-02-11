// Copyright © 2026 Sophia Systems Corporation

import {
  getPluginMetadata,
  isGeoJSONGeometry,
  isMultiStampProof,
  isUnsignedStamp,
} from '../../src/plugins/types';
import type {
  LocationProofPlugin,
  LocationStamp,
  UnsignedLocationStamp,
  LocationProof,
  LPGeometry,
} from '../../src/plugins/types';

describe('Plugin type utilities', () => {
  describe('getPluginMetadata', () => {
    it('extracts metadata from a plugin', () => {
      const plugin: LocationProofPlugin = {
        name: 'mock',
        version: '0.1.0',
        runtimes: ['node', 'browser'],
        requiredCapabilities: [],
        description: 'Mock plugin for testing',
      };
      const meta = getPluginMetadata(plugin);
      expect(meta).toEqual({
        name: 'mock',
        version: '0.1.0',
        runtimes: ['node', 'browser'],
        requiredCapabilities: [],
        description: 'Mock plugin for testing',
      });
    });
  });

  describe('isGeoJSONGeometry', () => {
    it('returns true for a GeoJSON Point', () => {
      const geom: LPGeometry = { type: 'Point', coordinates: [0, 0] };
      expect(isGeoJSONGeometry(geom)).toBe(true);
    });

    it('returns true for a GeoJSON Polygon', () => {
      const geom: LPGeometry = {
        type: 'Polygon',
        coordinates: [
          [
            [0, 0],
            [1, 0],
            [1, 1],
            [0, 0],
          ],
        ],
      };
      expect(isGeoJSONGeometry(geom)).toBe(true);
    });

    it('returns false for a string location', () => {
      expect(isGeoJSONGeometry('h3:8928308280fffff')).toBe(false);
    });
  });

  describe('isMultiStampProof', () => {
    const baseStamp: LocationStamp = {
      lpVersion: '0.2',
      locationType: 'geojson-point',
      location: { type: 'Point', coordinates: [-73.9857, 40.7484] },
      srs: 'EPSG:4326',
      temporalFootprint: { start: 1000, end: 2000 },
      plugin: 'mock',
      pluginVersion: '0.1.0',
      signals: {},
      signatures: [],
    };

    const baseClaim = {
      lpVersion: '0.2',
      locationType: 'geojson-point',
      location: { type: 'Point' as const, coordinates: [-73.9857, 40.7484] },
      srs: 'EPSG:4326',
      subject: { scheme: 'eth-address', value: '0x123' },
      radius: 100,
      time: { start: 1000, end: 2000 },
    };

    it('returns false for single-stamp proof', () => {
      const proof: LocationProof = { claim: baseClaim, stamps: [baseStamp] };
      expect(isMultiStampProof(proof)).toBe(false);
    });

    it('returns true for multi-stamp proof', () => {
      const proof: LocationProof = { claim: baseClaim, stamps: [baseStamp, baseStamp] };
      expect(isMultiStampProof(proof)).toBe(true);
    });
  });

  describe('isUnsignedStamp', () => {
    it('returns true for an unsigned stamp', () => {
      const unsigned: UnsignedLocationStamp = {
        lpVersion: '0.2',
        locationType: 'geojson-point',
        location: { type: 'Point', coordinates: [0, 0] },
        srs: 'EPSG:4326',
        temporalFootprint: { start: 1000, end: 2000 },
        plugin: 'mock',
        pluginVersion: '0.1.0',
        signals: {},
      };
      expect(isUnsignedStamp(unsigned)).toBe(true);
    });

    it('returns false for a signed stamp', () => {
      const signed: LocationStamp = {
        lpVersion: '0.2',
        locationType: 'geojson-point',
        location: { type: 'Point', coordinates: [0, 0] },
        srs: 'EPSG:4326',
        temporalFootprint: { start: 1000, end: 2000 },
        plugin: 'mock',
        pluginVersion: '0.1.0',
        signals: {},
        signatures: [],
      };
      expect(isUnsignedStamp(signed)).toBe(false);
    });
  });
});
