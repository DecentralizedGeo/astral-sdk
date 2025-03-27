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
  ProofRecipeExtension 
} from './types';

/**
 * ExtensionRegistry manages all extensions in the SDK.
 * 
 * This class allows registration and retrieval of location format, media type,
 * and proof recipe extensions. Each AstralSDK instance has its own registry,
 * allowing for customization without global state issues.
 */
export class ExtensionRegistry implements IExtensionRegistry {
  private locationExtensions: Map<string, LocationTypeExtension>;
  private mediaExtensions: Map<string, MediaAttachmentExtension>;
  private mediaTypeMapping: Map<string, MediaAttachmentExtension>;
  private recipeExtensions: Map<string, ProofRecipeExtension>;

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
    
    // Register built-in extensions if requested
    if (registerBuiltIns) {
      this.registerBuiltInExtensions();
    }
  }

  /**
   * Registers a location format extension.
   * 
   * If an extension with the same locationType already exists, it will be replaced.
   * 
   * @param extension - The location format extension to register
   * @throws Error if the extension doesn't pass its own validation
   */
  registerLocationExtension(extension: LocationTypeExtension): void {
    // Validate the extension before registering
    if (!extension.validate()) {
      throw new Error(`Extension validation failed for ${extension.id}`);
    }
    
    // Register the extension using its locationType as the key
    this.locationExtensions.set(extension.locationType, extension);
  }

  /**
   * Registers a media type extension.
   * 
   * The extension is registered for each of its supported media types.
   * If an extension for a specific media type already exists, it will be replaced.
   * 
   * @param extension - The media type extension to register
   * @throws Error if the extension doesn't pass its own validation
   */
  registerMediaExtension(extension: MediaAttachmentExtension): void {
    // Validate the extension before registering
    if (!extension.validate()) {
      throw new Error(`Extension validation failed for ${extension.id}`);
    }
    
    // Register the extension by its ID
    this.mediaExtensions.set(extension.id, extension);
    
    // Also register it for each of its supported media types for easy lookup
    for (const mediaType of extension.supportedMediaTypes) {
      this.mediaTypeMapping.set(mediaType, extension);
    }
  }

  /**
   * Registers a proof recipe extension.
   * 
   * If an extension with the same recipeType already exists, it will be replaced.
   * 
   * @param extension - The proof recipe extension to register
   * @throws Error if the extension doesn't pass its own validation
   */
  registerRecipeExtension(extension: ProofRecipeExtension): void {
    // Validate the extension before registering
    if (!extension.validate()) {
      throw new Error(`Extension validation failed for ${extension.id}`);
    }
    
    // Register the extension using its recipeType as the key
    this.recipeExtensions.set(extension.recipeType, extension);
  }

  /**
   * Gets a location extension by type.
   * 
   * @param locationType - The location type to retrieve
   * @returns The location extension or undefined if not found
   */
  getLocationExtension(locationType: string): LocationTypeExtension | undefined {
    return this.locationExtensions.get(locationType);
  }

  /**
   * Gets a media extension by media type.
   * 
   * @param mediaType - The media MIME type to retrieve
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
    for (const extension of this.locationExtensions.values()) {
      if (extension.validateLocation(location)) {
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
   * 
   * Note: Actual implementations will be added after creating the extension classes.
   */
  private registerBuiltInExtensions(): void {
    // This will be implemented once the extension classes are created
    // For now, this is a placeholder
    
    // TODO: Register built-in location extensions
    // e.g., this.registerLocationExtension(new GeoJSONExtension());
    
    // TODO: Register built-in media extensions
    // e.g., this.registerMediaExtension(new ImageExtension());
  }
}

// Export all extension-related types
export * from './types';