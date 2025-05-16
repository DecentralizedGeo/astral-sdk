/**
 * Main SDK entry point
 *
 * This file implements the AstralSDK class, which serves as the primary interface
 * for developers using the Astral SDK. It provides methods for creating and managing
 * location proofs with both onchain and offchain workflows.
 */

import { ExtensionRegistry } from '../extensions';
import { AstralError, ExtensionError, ValidationError } from './errors';
import { AstralSDKConfig, LocationProofInput, UnsignedLocationProof } from './types';

/**
 * AstralSDK is the main entry point for the Astral SDK.
 *
 * This class provides methods for creating and managing location proofs
 * using both onchain and offchain workflows.
 */
export class AstralSDK {
  /** Extension registry for format handlers */
  public readonly extensions: ExtensionRegistry;

  /** Configuration options */
  private readonly config: AstralSDKConfig;

  /** Debug mode flag */
  private readonly debug: boolean;

  /**
   * Creates a new AstralSDK instance.
   *
   * @param config - Configuration options for the SDK
   */
  constructor(config?: AstralSDKConfig) {
    // Initialize with default configuration
    this.config = {
      defaultChain: 'sepolia',
      mode: 'offchain',
      debug: false,
      ...config,
    };

    this.debug = !!this.config.debug;

    // Initialize extension registry with built-in extensions
    this.extensions = new ExtensionRegistry(true);

    if (this.debug) {
      console.log('AstralSDK initialized with config:', this.config);
    }
  }

  /**
   * Builds an unsigned location proof from input data.
   *
   * This method converts the input location data to the standardized format
   * required by the location proof schema, using the appropriate extensions
   * for the specified location and media types.
   *
   * @param input - Location proof input data
   * @returns An unsigned location proof ready for signing or registration
   * @throws ValidationError if the input data is invalid
   * @throws ExtensionError if no suitable extension is found for the location format
   */
  async buildLocationProof(input: LocationProofInput): Promise<UnsignedLocationProof> {
    if (!input.location) {
      throw new ValidationError('Location data is required');
    }

    // Determine the location format if not specified
    let locationType = input.locationType;
    if (!locationType) {
      locationType = this.extensions.detectLocationFormat(input.location);
      if (!locationType) {
        throw new ExtensionError('Could not determine location format', undefined, {
          location: input.location,
        });
      }

      if (this.debug) {
        console.log(`Auto-detected location format: ${locationType}`);
      }
    }

    try {
      // Get the extension for the location format
      const extension = this.extensions.getLocationExtension(locationType);
      if (!extension) {
        throw new ExtensionError(
          `No extension found for location format: ${locationType}`,
          undefined,
          {
            locationType,
            availableExtensions: this.extensions
              .getAllLocationExtensions()
              .map(ext => ext.locationType),
          }
        );
      }

      // Convert the location data to the target format if specified
      let processedLocation = input.location;
      let finalLocationType = locationType;

      if (input.targetLocationFormat && input.targetLocationFormat !== locationType) {
        try {
          // Use the location extension module to handle the conversion
          const { convertLocationFormat } = await import('../extensions/location');
          processedLocation = convertLocationFormat(
            input.location,
            locationType,
            input.targetLocationFormat,
            this.extensions.getAllLocationExtensions()
          ) as Record<string, unknown>;
          finalLocationType = input.targetLocationFormat;

          if (this.debug) {
            console.log(`Converted location format from ${locationType} to ${finalLocationType}`);
          }
        } catch (error) {
          throw new ExtensionError(
            `Failed to convert location format from ${locationType} to ${input.targetLocationFormat}`,
            error instanceof Error ? error : undefined,
            { originalFormat: locationType, targetFormat: input.targetLocationFormat }
          );
        }
      }

      // Convert location to string representation
      const locationExtension = this.extensions.getLocationExtension(finalLocationType);
      if (!locationExtension) {
        throw new ExtensionError(
          `No extension found for processed location format: ${finalLocationType}`
        );
      }

      const locationString = locationExtension.locationToString(processedLocation);

      // Process media attachments if present
      const mediaTypes: string[] = [];
      const mediaData: string[] = [];

      if (input.media && input.media.length > 0) {
        for (const mediaItem of input.media) {
          const mediaType = mediaItem.mediaType;
          const mediaExtension = this.extensions.getMediaExtension(mediaType);

          if (!mediaExtension) {
            throw new ExtensionError(`No extension found for media type: ${mediaType}`, undefined, {
              mediaType,
              availableExtensions: this.extensions
                .getAllMediaExtensions()
                .flatMap(ext => ext.supportedMediaTypes),
            });
          }

          // Validate and process media data
          if (!mediaExtension.validateMedia(mediaType, mediaItem.data)) {
            throw new ValidationError(`Invalid media data for type: ${mediaType}`);
          }

          const processedMediaData = mediaExtension.processMedia(mediaType, mediaItem.data);

          mediaTypes.push(mediaType);
          mediaData.push(processedMediaData);
        }
      }

      // Build the unsigned location proof
      const unsignedProof: UnsignedLocationProof = {
        eventTimestamp: input.timestamp
          ? Math.floor(input.timestamp.getTime() / 1000)
          : Math.floor(Date.now() / 1000),
        srs: 'EPSG:4326', // WGS84 is the default SRS
        locationType: finalLocationType,
        location: locationString,
        recipeTypes: [], // Empty in v0.1
        recipePayloads: [], // Empty in v0.1
        mediaTypes,
        mediaData,
        memo: input.memo,
        recipient: input.recipient,
        // Store original inputs for reference if in debug mode
        ...(this.debug
          ? {
              _originalInputs: {
                location: input.location,
                media: input.media,
              },
            }
          : {}),
      };

      return unsignedProof;
    } catch (error) {
      if (error instanceof AstralError) {
        throw error;
      }

      throw new ValidationError(
        `Failed to build location proof: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Create an offchain location proof by signing the input data.
   *
   * This is a placeholder implementation that will be expanded in future phases.
   * In the current MVP, it builds the unsigned proof but doesn't actually sign it.
   *
   * @param input - Location proof input data
   * @returns Promise resolving to the unsigned location proof (placeholder)
   */
  async createOffchainLocationProof(input: LocationProofInput): Promise<UnsignedLocationProof> {
    const unsignedProof = await this.buildLocationProof(input);

    // The actual signing functionality will be implemented in a future phase
    if (this.debug) {
      console.log('Created unsigned location proof (signing not yet implemented):', unsignedProof);
    }

    return unsignedProof;
  }

  /**
   * Create an onchain location proof by registering the input data.
   *
   * This is a placeholder implementation that will be expanded in future phases.
   * In the current MVP, it builds the unsigned proof but doesn't actually register it.
   *
   * @param input - Location proof input data
   * @returns Promise resolving to the unsigned location proof (placeholder)
   */
  async createOnchainLocationProof(input: LocationProofInput): Promise<UnsignedLocationProof> {
    const unsignedProof = await this.buildLocationProof(input);

    // The actual registration functionality will be implemented in a future phase
    if (this.debug) {
      console.log(
        'Created unsigned location proof (registration not yet implemented):',
        unsignedProof
      );
    }

    return unsignedProof;
  }
}
