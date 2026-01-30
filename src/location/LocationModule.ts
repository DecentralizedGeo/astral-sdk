// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

/**
 * LocationModule - Main module for location attestation operations
 *
 * Provides a namespaced interface for offchain and onchain workflows.
 */

import { ExtensionRegistry } from '../extensions';
import {
  LocationConfig,
  LocationAttestationInput,
  UnsignedLocationAttestation,
  RuntimeSchemaConfig,
} from '../core/types';
import { SchemaValue } from '../eas/SchemaEncoder';
import { ExtensionError, ValidationError } from '../core/errors';
import { SchemaValidationCache } from '../utils/schemaValidation';
import { getChainId, getSchemaUID, getSchemaString } from '../eas/chains';
import { OffchainWorkflow } from './OffchainWorkflow';
import { OnchainWorkflow } from './OnchainWorkflow';

/**
 * LocationModule provides location attestation operations with offchain and onchain sub-namespaces.
 */
export class LocationModule {
  /** Offchain workflow operations */
  public readonly offchain: OffchainWorkflow;
  /** Onchain workflow operations */
  public readonly onchain: OnchainWorkflow;
  /** Extension registry for format handlers */
  public readonly extensions: ExtensionRegistry;

  private readonly schemaCache: SchemaValidationCache;
  private readonly defaultSchema: RuntimeSchemaConfig;
  private readonly strictSchemaValidation: boolean;

  constructor(config: LocationConfig) {
    this.strictSchemaValidation = !!config.strictSchemaValidation;

    // Initialize schema validation cache
    this.schemaCache = new SchemaValidationCache(this.strictSchemaValidation);

    // Determine default schema
    if (config.defaultSchema) {
      this.defaultSchema = config.defaultSchema;
    } else {
      const chainId = config.chainId || getChainId(config.defaultChain || 'sepolia');
      this.defaultSchema = {
        uid: getSchemaUID(chainId),
        rawString: getSchemaString(),
      };
    }

    // Validate pre-registered schemas
    if (config.schemas && config.schemas.length > 0) {
      for (const schema of config.schemas) {
        this.schemaCache.validate(schema);
      }
    }
    this.schemaCache.validate(this.defaultSchema);

    // Initialize extension registry
    this.extensions = new ExtensionRegistry(true);

    // Initialize workflows
    this.offchain = new OffchainWorkflow(config);
    this.onchain = new OnchainWorkflow(config);

    // Bind build function to workflows for create() methods
    const boundBuild = this.build.bind(this);

    // Patch create methods to inject build function
    const originalOffchainCreate = this.offchain.create.bind(this.offchain);
    this.offchain.create = (input, options) => originalOffchainCreate(input, options, boundBuild);

    const originalOnchainCreate = this.onchain.create.bind(this.onchain);
    this.onchain.create = (input, options) => originalOnchainCreate(input, options, boundBuild);
  }

  /**
   * Builds an unsigned location attestation from input data
   */
  async build(input: LocationAttestationInput): Promise<UnsignedLocationAttestation> {
    if (!input.location) {
      throw new ValidationError('Location data is required');
    }

    // Ensure extensions are initialized
    await this.extensions.ensureInitialized();

    // Detect location format
    let locationType = input.locationType;
    if (!locationType) {
      locationType = this.extensions.detectLocationFormat(input.location);
      if (!locationType) {
        throw new ExtensionError('Could not determine location format', undefined, {
          location: input.location,
        });
      }
    }

    // Get location extension
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

    // Process location
    let processedLocation = input.location;
    let finalLocationType = locationType;

    if (input.targetLocationFormat && input.targetLocationFormat !== locationType) {
      try {
        const { convertLocationFormat } = await import('../extensions/location');
        processedLocation = convertLocationFormat(
          input.location,
          locationType,
          input.targetLocationFormat,
          this.extensions.getAllLocationExtensions()
        ) as Record<string, unknown>;
        finalLocationType = input.targetLocationFormat;
      } catch (error) {
        throw new ExtensionError(
          `Failed to convert location format from ${locationType} to ${input.targetLocationFormat}`,
          error instanceof Error ? error : undefined,
          { originalFormat: locationType, targetFormat: input.targetLocationFormat }
        );
      }
    }

    // Convert location to string
    const locationExtension = this.extensions.getLocationExtension(finalLocationType);
    if (!locationExtension) {
      throw new ExtensionError(
        `No extension found for processed location format: ${finalLocationType}`
      );
    }
    const locationString = locationExtension.locationToString(processedLocation);

    // Process media attachments
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

        if (!mediaExtension.validateMedia(mediaType, mediaItem.data)) {
          throw new ValidationError(`Invalid media data for type: ${mediaType}`);
        }

        const processedMediaData = mediaExtension.processMedia(mediaType, mediaItem.data);
        mediaTypes.push(mediaType);
        mediaData.push(processedMediaData);
      }
    }

    // Build unsigned attestation
    const unsignedProof: UnsignedLocationAttestation = {
      eventTimestamp: input.timestamp
        ? Math.floor(input.timestamp.getTime() / 1000)
        : Math.floor(Date.now() / 1000),
      srs: 'EPSG:4326',
      locationType: finalLocationType,
      location: locationString,
      recipeType: [],
      recipePayload: [],
      mediaType: mediaTypes,
      mediaData,
      memo: input.memo,
      recipient: input.recipient,
    };

    // Validate against schema
    const schemaExtension = this.extensions.getSchemaExtension('location');
    if (schemaExtension) {
      const isValid = schemaExtension.validateSchemaData(
        unsignedProof as unknown as Record<string, SchemaValue>
      );
      if (!isValid) {
        throw new ValidationError('Generated proof does not match the schema', undefined, {
          attestation: unsignedProof,
        });
      }
    }

    return unsignedProof;
  }

  /**
   * Encodes location attestation data according to the schema
   */
  encode(attestation: UnsignedLocationAttestation, schemaType: string = 'location'): string {
    const schemaExtension = this.extensions.getSchemaExtension(schemaType);
    if (!schemaExtension) {
      throw new ExtensionError(`No schema extension found for type: ${schemaType}`, undefined, {
        schemaType,
        availableExtensions: this.extensions.getAllSchemaExtensions().map(ext => ext.schemaType),
      });
    }
    return schemaExtension.encodeData(attestation as unknown as Record<string, SchemaValue>);
  }

  /**
   * Decodes encoded location attestation data
   */
  decode(encodedData: string, schemaType: string = 'location'): Record<string, SchemaValue> {
    const schemaExtension = this.extensions.getSchemaExtension(schemaType);
    if (!schemaExtension) {
      throw new ExtensionError(`No schema extension found for type: ${schemaType}`, undefined, {
        schemaType,
        availableExtensions: this.extensions.getAllSchemaExtensions().map(ext => ext.schemaType),
      });
    }
    return schemaExtension.decodeData(encodedData);
  }
}
