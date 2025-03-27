/**
 * Extension system interfaces for Astral SDK
 *
 * This file defines the interfaces for the extension system, which allows the SDK
 * to be extended with new location formats, media types, and proof recipes.
 */

/**
 * BaseExtension provides common functionality for all extensions.
 *
 * This abstract class serves as the foundation for all extension types
 * and ensures they implement required metadata and validation methods.
 *
 * @property id - Unique identifier for the extension
 * @property name - Human-readable name for the extension
 * @property description - Description of what the extension does
 */
export abstract class BaseExtension {
  /**
   * Unique identifier for the extension
   */
  abstract readonly id: string;

  /**
   * Human-readable name for the extension
   */
  abstract readonly name: string;

  /**
   * Description of what the extension does
   */
  abstract readonly description: string;

  /**
   * Validates that the extension is properly configured
   *
   * @returns True if the extension is valid
   */
  abstract validate(): boolean;

  /**
   * Returns the extension metadata
   *
   * @returns Object containing extension metadata
   */
  getMetadata(): ExtensionMetadata {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      type: this.constructor.name,
    };
  }
}

/**
 * ExtensionMetadata provides information about an extension.
 *
 * @property id - Unique identifier for the extension
 * @property name - Human-readable name for the extension
 * @property description - Description of what the extension does
 * @property type - Type of the extension (class name)
 */
export interface ExtensionMetadata {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly type: string;
}

/**
 * LocationTypeExtension interface for processing location data formats.
 *
 * This interface defines the methods required to handle different location
 * formats like GeoJSON, WKT, Coordinates, and H3.
 */
export interface LocationTypeExtension extends BaseExtension {
  /**
   * Supported location type (e.g., "geojson-point", "wkt-polygon", "h3")
   */
  readonly locationType: string;

  /**
   * Validates location data for this format
   *
   * @param location - Location data to validate
   * @returns True if the location data is valid for this format
   */
  validateLocation(location: unknown): boolean;

  /**
   * Converts location data to canonical string representation
   *
   * @param location - Location data to convert
   * @returns Canonical string representation of the location
   */
  locationToString(location: unknown): string;

  /**
   * Converts location data to canonical GeoJSON representation
   *
   * @param location - Location data to convert
   * @returns Canonical GeoJSON representation of the location
   */
  locationToGeoJSON(location: unknown): object; // CLAUDE: Is this correctly implemented?
  // CONTEXT: We will want to work with GeoJSON internally often, regardless of locationType
  // TODO: Add a type guard for GeoJSON objects

  /**
   * Parses a location string back to its original format
   *
   * @param locationString - Location string to parse // CLAUDE: From what format?? Let's specify. Is it ALWAYS GeoJSON?
   * @returns Parsed location data
   */
  parseLocationString(locationString: string): unknown;
}

/**
 * MediaAttachmentExtension interface for processing media types.
 *
 * This interface defines the methods required to handle different media
 * types like images, videos, documents, etc.
 */
export interface MediaAttachmentExtension extends BaseExtension {
  /**
   * MIME types supported by this extension (e.g., ["image/jpeg", "image/png"])
   */
  readonly supportedMediaTypes: string[];

  /**
   * Validates media data for this extension
   *
   * @param mediaType - MIME type of the media
   * @param data - Media data to validate
   * @returns True if the media data is valid for this extension
   */
  validateMedia(mediaType: string, data: string): boolean;

  /**
   * Processes media data before storing it
   *
   * This might include validation, optimization, or conversion.
   *
   * @param mediaType - MIME type of the media
   * @param data - Media data to process
   * @returns Processed media data
   */
  processMedia(mediaType: string, data: string): string;

  /**
   * Checks if this extension supports a given media type
   *
   * @param mediaType - MIME type to check
   * @returns True if the media type is supported
   */
  supportsMediaType(mediaType: string): boolean;
}

/**
 * ProofRecipeExtension interface for recipe data (reserved for future use).
 *
 * This interface is a placeholder for v0.1 and will be expanded in future versions
 * to support different proof recipe types.
 */
export interface ProofRecipeExtension extends BaseExtension {
  /**
   * Recipe type identifier
   */
  readonly recipeType: string;

  /**
   * Validates recipe data
   *
   * @param recipeData - Recipe data to validate
   * @returns True if the recipe data is valid
   */
  validateRecipe(recipeData: unknown): boolean;

  /**
   * Converts recipe data to <tbd> format for storage
   *
   * @param recipeData - Recipe data to convert
   * @returns bytes representation of the recipe data
   */
  recipeToString(recipeData: unknown): Uint8Array; // CLAUDE: We need to check if Uint8Array is compatible with Solidity `bytes` type.

  /**
   * Parses a recipe data back to its original format
   *
   * @param recipeBytes - Recipe bytes to parse
   * @returns Parsed recipe data
   */
  parseRecipeBytes(recipeBytes: Uint8Array): unknown; // CLAUDE: We need to check if Uint8Array is compatible with Solidity `bytes` type.
}

/**
 * ExtensionRegistry manages all extensions in the SDK.
 *
 * This interface defines methods for registering and retrieving extensions.
 */
export interface ExtensionRegistry {
  /**
   * Registers a location format extension
   *
   * @param extension - The location format extension to register
   */
  registerLocationExtension(extension: LocationTypeExtension): void;

  /**
   * Registers a media type extension
   *
   * @param extension - The media type extension to register
   */
  registerMediaExtension(extension: MediaAttachmentExtension): void;

  /**
   * Registers a proof recipe extension
   *
   * @param extension - The proof recipe extension to register
   */
  registerRecipeExtension(extension: ProofRecipeExtension): void;

  /**
   * Gets a location extension by type
   *
   * @param locationType - The location type to retrieve
   * @returns The location extension or undefined if not found
   */
  getLocationExtension(locationType: string): LocationTypeExtension | undefined;

  /**
   * Gets a media extension by media type
   *
   * @param mediaType - The media MIME type to retrieve
   * @returns The media extension or undefined if not found
   */
  getMediaExtension(mediaType: string): MediaAttachmentExtension | undefined;

  /**
   * Gets a recipe extension by recipe type
   *
   * @param recipeType - The recipe type to retrieve
   * @returns The recipe extension or undefined if not found
   */
  getRecipeExtension(recipeType: string): ProofRecipeExtension | undefined;
}
