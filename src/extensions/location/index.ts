/**
 * Location Extensions Module
 *
 * This module exports location format handlers that convert between various
 * geographic data formats and the standardized format used by Astral SDK.
 *
 * @module extensions/location
 */

import { LocationTypeExtension } from '../types';
import { geoJSONExtension } from './builtins/GeoJSON';

// Export the built-in location extensions
export { geoJSONExtension };
export { isGeoJSON, isPosition } from './builtins/GeoJSON';

/**
 * All built-in location extensions
 */
export const builtInLocationExtensions: LocationTypeExtension[] = [
  geoJSONExtension,
  // Additional built-in extensions will be added here as they are implemented
];

/**
 * Helper function to detect the format of a location object
 *
 * @param location - The location data to detect
 * @param extensions - List of extensions to check (defaults to built-in extensions)
 * @returns The detected format type or undefined if no match found
 */
export function detectLocationFormat(
  location: unknown,
  extensions: LocationTypeExtension[] = builtInLocationExtensions
): string | undefined {
  for (const extension of extensions) {
    if (extension.validateLocation(location)) {
      return extension.locationType;
    }
  }
  return undefined;
}

/**
 * Helper function to convert a location from one format to another
 *
 * @param location - The location data to convert
 * @param sourceType - The current format of the location data
 * @param targetType - The desired format to convert to
 * @param extensions - List of extensions to use (defaults to built-in extensions)
 * @returns The location data in the target format
 * @throws Error if source or target extension not found or conversion fails
 */
export function convertLocationFormat(
  location: unknown,
  sourceType: string,
  targetType: string,
  extensions: LocationTypeExtension[] = builtInLocationExtensions
): unknown {
  // Find source and target extensions
  const sourceExtension = extensions.find(ext => ext.locationType === sourceType.split('-')[0]);
  const targetExtension = extensions.find(ext => ext.locationType === targetType.split('-')[0]);

  if (!sourceExtension) {
    throw new Error(`No extension found for source format: ${sourceType}`);
  }

  if (!targetExtension) {
    throw new Error(`No extension found for target format: ${targetType}`);
  }

  if (sourceType === targetType) {
    return location; // No conversion needed
  }

  try {
    // Convert to GeoJSON as the intermediate format
    const geoJSON = sourceExtension.locationToGeoJSON(location);

    // If target is GeoJSON, we're done
    if (targetExtension.locationType === 'geojson') {
      return geoJSON;
    }

    // Otherwise, convert from GeoJSON to target format
    // This requires that all extensions know how to convert from GeoJSON
    return targetExtension.parseLocationString(JSON.stringify(geoJSON));
  } catch (error) {
    throw new Error(
      `Failed to convert from ${sourceType} to ${targetType}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// Register the location extensions in the ExtensionRegistry
// This will be handled by the main SDK initialization
