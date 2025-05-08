/**
 * Location Extensions Module
 *
 * This module exports location format handlers that convert between various
 * geographic data formats and the standardized format used by Astral SDK.
 *
 * @module extensions/location
 */

import { LocationTypeExtension } from '../types';
import { ExtensionError, LocationValidationError } from '../../core/errors';
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
 * This function uses GeoJSON as the intermediate "hub" format for all conversions.
 * It also checks for coordinate preservation to ensure data integrity.
 *
 * @param location - The location data to convert
 * @param sourceType - The current format of the location data
 * @param targetType - The desired format to convert to
 * @param extensions - List of extensions to use (defaults to built-in extensions)
 * @returns The location data in the target format
 * @throws ExtensionError if source or target extension not found
 * @throws LocationValidationError if validation fails during conversion
 */
export function convertLocationFormat(
  location: unknown,
  sourceType: string,
  targetType: string,
  extensions: LocationTypeExtension[] = builtInLocationExtensions
): unknown {
  // Find source and target extensions by base type (e.g., "geojson" from "geojson-point")
  const sourceExtension = extensions.find(ext => ext.locationType === sourceType.split('-')[0]);
  const targetExtension = extensions.find(ext => ext.locationType === targetType.split('-')[0]);

  if (!sourceExtension) {
    throw new ExtensionError(`No extension found for source format: ${sourceType}`, undefined, {
      sourceType,
      availableExtensions: extensions.map(ext => ext.locationType)
    });
  }

  if (!targetExtension) {
    throw new ExtensionError(`No extension found for target format: ${targetType}`, undefined, {
      targetType,
      availableExtensions: extensions.map(ext => ext.locationType)
    });
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

    // Convert from GeoJSON to target format
    const stringified = JSON.stringify(geoJSON);
    const converted = targetExtension.parseLocationString(stringified);

    // If the source is not already GeoJSON, check for coordinate preservation
    if (sourceExtension.locationType !== 'geojson' && targetExtension.locationType !== 'geojson') {
      // Get the GeoJSON extension for comparison
      const geoJSONExt = extensions.find(ext => ext.locationType === 'geojson');
      if (geoJSONExt && 'checkCoordinatePreservation' in geoJSONExt) {
        // Safe to assume geoJSONExtension is GeoJSONExtension implementation with checkCoordinatePreservation
        const reconverted = targetExtension.locationToGeoJSON(converted);
        
        // Check if coordinates were preserved during conversion using dynamic method access
        const checkFn = (geoJSONExt as any).checkCoordinatePreservation;
        if (typeof checkFn === 'function' && !checkFn.call(geoJSONExt, geoJSON, reconverted)) {
          console.warn(
            `Warning: Coordinate values changed during conversion from ${sourceType} to ${targetType}. ` +
            `This may indicate precision loss or data transformation.`
          );
        }
      }
    }

    return converted;
  } catch (error) {
    if (error instanceof ExtensionError || error instanceof LocationValidationError) {
      throw error;
    }
    
    throw new ExtensionError(
      `Failed to convert from ${sourceType} to ${targetType}`,
      error instanceof Error ? error : undefined,
      {
        sourceType,
        targetType,
        errorDetails: error instanceof Error ? error.message : String(error)
      }
    );
  }
}

// Register the location extensions in the ExtensionRegistry
// This will be handled by the main SDK initialization
