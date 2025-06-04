// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

/**
 * Extensions module for Astral SDK
 *
 * This module implements the extension system for the Astral SDK, allowing
 * developers to add support for custom location formats, media types, and
 * proof recipes.
 */

import {
  ExtensionRegistry as IExtensionRegistry,
  LocationTypeExtension,
  MediaAttachmentExtension,
  ProofRecipeExtension,
  SchemaExtension,
} from './types';

/**
 * ExtensionRegistry manages all extensions in the SDK.
 *
 * This class allows registration and retrieval of location format, media type,
 * schema, and proof recipe extensions. Each AstralSDK instance has its own registry,
 * allowing for customization without global state issues.
 */
export class ExtensionRegistry implements IExtensionRegistry {
  private locationExtensions: Map<string, LocationTypeExtension>;
  private mediaExtensions: Map<string, MediaAttachmentExtension>;
  private mediaTypeMapping: Map<string, MediaAttachmentExtension>;
  private recipeExtensions: Map<string, ProofRecipeExtension>;
  private schemaExtensions: Map<string, SchemaExtension>;
  private initializationPromise?: Promise<void>;

  /**
   * Creates a new ExtensionRegistry.
   *
   * By default, all built-in extensions are registered automatically.
   *
   * @param registerBuiltIns - Whether to register built-in extensions (default: true)
   */
  constructor(registerBuiltIns = true) {
    // Initialize maps to store extensions
    this.locationExtensions = new Map();
    this.mediaExtensions = new Map();
    this.mediaTypeMapping = new Map();
    this.recipeExtensions = new Map();
    this.schemaExtensions = new Map();

    // Register built-in extensions if requested
    if (registerBuiltIns) {
      // Track the initialization promise so we can wait for it
      this.initializationPromise = this.registerBuiltInExtensions().catch(error => {
        console.warn(
          `Failed to initialize extensions: ${
            error instanceof Error ? error.message : String(error)
          }`
        );
        // Re-throw the error so the promise can properly fail
        throw error;
      });
    }
  }

  /**
   * Ensures that all built-in extensions are initialized.
   *
   * This method waits for the async extension registration to complete
   * if it's still in progress. If extensions are already loaded or if
   * built-in extensions were disabled, this method returns immediately.
   *
   * @returns Promise that resolves when extensions are initialized
   * @throws Error if extension initialization failed
   */
  async ensureInitialized(): Promise<void> {
    if (this.initializationPromise) {
      await this.initializationPromise;
      // Clear the promise once resolved to avoid waiting again
      this.initializationPromise = undefined;
    }
  }

  /**
   * Registers a location format extension.
   *
   * If an extension with the same locationType already exists, it will be replaced and a warning will be issued.
   *
   * @param extension - The location format extension to register
   * @throws Error if the extension doesn't pass its own validation
   */
  registerLocationExtension(extension: LocationTypeExtension): void {
    // Validate the extension before registering
    if (!extension.validate()) {
      throw new Error(`Extension validation failed for ${extension.id}`);
    }

    // Check if an extension with this locationType already exists
    const existingExtension = this.locationExtensions.get(extension.locationType);
    if (existingExtension && existingExtension.id !== extension.id) {
      console.warn(
        `Warning: Replacing existing location extension (${existingExtension.id}) ` +
          `for locationType '${extension.locationType}' with new extension (${extension.id})`
      );
    }

    // Register the extension using its locationType as the key
    this.locationExtensions.set(extension.locationType, extension);
  }

  /**
   * Registers a media type extension.
   *
   * The extension is registered for each of its supported media types.
   * If an extension for a specific media type already exists, it will be replaced and a warning will be issued.
   *
   * @param extension - The media type extension to register
   * @throws Error if the extension doesn't pass its own validation
   */
  registerMediaExtension(extension: MediaAttachmentExtension): void {
    // Validate the extension before registering
    if (!extension.validate()) {
      throw new Error(`Extension validation failed for ${extension.id}`);
    }

    // Check if an extension with this ID already exists
    const existingExtension = this.mediaExtensions.get(extension.id);
    if (existingExtension && existingExtension.id !== extension.id) {
      console.warn(
        `Warning: Replacing existing media extension (${existingExtension.id}) ` +
          `with new extension (${extension.id})`
      );
    }

    // Register the extension by its ID
    this.mediaExtensions.set(extension.id, extension);

    // Also register it for each of its supported media types for easy lookup
    for (const mediaType of extension.supportedMediaTypes) {
      const existingMediaTypeHandler = this.mediaTypeMapping.get(mediaType);
      if (existingMediaTypeHandler && existingMediaTypeHandler.id !== extension.id) {
        console.warn(
          `Warning: Replacing existing handler (${existingMediaTypeHandler.id}) ` +
            `for mediaType '${mediaType}' with new extension (${extension.id})`
        );
      }
      this.mediaTypeMapping.set(mediaType, extension);
    }
  }

  /**
   * Registers a proof recipe extension.
   *
   * If an extension with the same recipeType already exists, it will be replaced and a warning will be issued.
   *
   * @param extension - The proof recipe extension to register
   * @throws Error if the extension doesn't pass its own validation
   */
  registerRecipeExtension(extension: ProofRecipeExtension): void {
    // Validate the extension before registering
    if (!extension.validate()) {
      throw new Error(`Extension validation failed for ${extension.id}`);
    }

    // Check if an extension with this recipeType already exists
    const existingExtension = this.recipeExtensions.get(extension.recipeType);
    if (existingExtension && existingExtension.id !== extension.id) {
      console.warn(
        `Warning: Replacing existing recipe extension (${existingExtension.id}) ` +
          `for recipeType '${extension.recipeType}' with new extension (${extension.id})`
      );
    }

    // Register the extension using its recipeType as the key
    this.recipeExtensions.set(extension.recipeType, extension);
  }

  /**
   * Registers a schema extension.
   *
   * If an extension with the same schemaType already exists, it will be replaced and a warning will be issued.
   *
   * @param extension - The schema extension to register
   * @throws Error if the extension doesn't pass its own validation
   */
  registerSchemaExtension(extension: SchemaExtension): void {
    // Validate the extension before registering
    if (!extension.validate()) {
      throw new Error(`Extension validation failed for ${extension.id}`);
    }

    // Check if an extension with this schemaType already exists
    const existingExtension = this.schemaExtensions.get(extension.schemaType);
    if (existingExtension && existingExtension.id !== extension.id) {
      console.warn(
        `Warning: Replacing existing schema extension (${existingExtension.id}) ` +
          `for schemaType '${extension.schemaType}' with new extension (${extension.id})`
      );
    }

    // Register the extension using its schemaType as the key
    this.schemaExtensions.set(extension.schemaType, extension);
  }

  /**
   * Gets a location extension by type.
   *
   * This method only attempts to match the first component of the Location Format Identifier
   * (e.g., 'geojson', 'coordinate', 'wkt'). Subtypes and additional details are handled by
   * the extension itself.
   *
   * @param locationType - The location type to retrieve (e.g., 'geojson', 'coordinate')
   * @returns The location extension or undefined if not found
   */
  getLocationExtension(locationType: string): LocationTypeExtension | undefined {
    // Extract the base location type (first component of the format identifier)
    const baseType = locationType.split('-')[0];
    return this.locationExtensions.get(baseType);
  }

  /**
   * Gets a media extension by media type.
   *
   * This method looks up the appropriate handler based on the full MIME type
   * (e.g., 'image/jpeg', 'video/mp4'). Typically, extensions are registered
   * to handle all subtypes for a primary MIME type.
   *
   * @param mediaType - The complete MIME type to retrieve handler for (e.g., 'image/jpeg')
   * @returns The media extension or undefined if not found
   */
  getMediaExtension(mediaType: string): MediaAttachmentExtension | undefined {
    return this.mediaTypeMapping.get(mediaType);
  }

  /**
   * Gets a recipe extension by recipe type.
   *
   * @param recipeType - The recipe type to retrieve
   * @returns The recipe extension or undefined if not found
   */
  getRecipeExtension(recipeType: string): ProofRecipeExtension | undefined {
    return this.recipeExtensions.get(recipeType);
  }

  /**
   * Gets a schema extension by schema type.
   *
   * @param schemaType - The schema type to retrieve
   * @returns The schema extension or undefined if not found
   */
  getSchemaExtension(schemaType: string): SchemaExtension | undefined {
    return this.schemaExtensions.get(schemaType);
  }

  /**
   * Gets all registered location extensions.
   *
   * @returns Array of all registered location extensions
   */
  getAllLocationExtensions(): LocationTypeExtension[] {
    return Array.from(this.locationExtensions.values());
  }

  /**
   * Gets all registered media extensions.
   *
   * @returns Array of all registered media extensions
   */
  getAllMediaExtensions(): MediaAttachmentExtension[] {
    return Array.from(this.mediaExtensions.values());
  }

  /**
   * Gets all registered recipe extensions.
   *
   * @returns Array of all registered recipe extensions
   */
  getAllRecipeExtensions(): ProofRecipeExtension[] {
    return Array.from(this.recipeExtensions.values());
  }

  /**
   * Gets all registered schema extensions.
   *
   * @returns Array of all registered schema extensions
   */
  getAllSchemaExtensions(): SchemaExtension[] {
    return Array.from(this.schemaExtensions.values());
  }

  /**
   * Detect the format of a location object.
   *
   * This method tries all registered location extensions to find one that can
   * validate the given location data, returning the locationType of the first
   * matching extension.
   *
   * @param location - The location data to detect the format of
   * @returns The detected locationType, or undefined if no match is found
   */
  detectLocationFormat(location: unknown): string | undefined {
    for (const extension of Array.from(this.locationExtensions.values())) {
      if (extension.validateLocation(location)) {
        // CLAUDE: This is good, but I can imagine a case where a location might be valid for multiple extensions. So we should register location extensions in our preferred order — and return the first match. (I'm not sure if this is a problem, but it's something to be aware of.)
        return extension.locationType;
      }
    }
    return undefined;
  }

  /**
   * Registers all built-in extensions.
   *
   * This method is called automatically during construction unless disabled.
   * It registers all built-in location format and media type extensions.
   */
  private async registerBuiltInExtensions(): Promise<void> {
    try {
      // Import and register location extensions
      const geoJSONModule = await import('./location/builtins/GeoJSON');
      this.registerLocationExtension(geoJSONModule.geoJSONExtension);

      // In the future, we'll import additional location extensions
    } catch (error) {
      console.warn(
        `Failed to register built-in location extensions: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }

    try {
      // Import and register media extensions
      const imageModule = await import('./media/builtins/image');
      this.registerMediaExtension(imageModule.imageExtension);

      // In the future, we'll import additional media extensions
    } catch (error) {
      console.warn(
        `Failed to register built-in media extensions: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }

    try {
      // Import and register schema extensions
      const locationSchemaModule = await import('./schema/builtins/LocationSchema');
      this.registerSchemaExtension(locationSchemaModule.locationSchemaExtension);

      // In the future, we'll import additional schema extensions
    } catch (error) {
      console.warn(
        `Failed to register built-in schema extensions: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }
}

// Export all extension-related types and extensions
export * from './types';
export * from './location';
export * from './media';
export * from './schema';
