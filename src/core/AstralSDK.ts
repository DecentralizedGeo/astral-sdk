// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

/* eslint-disable no-console */
/**
 * Main SDK entry point
 *
 * This file implements the AstralSDK class, which serves as the primary interface
 * for developers using the Astral SDK. It provides methods for creating and managing
 * location attestations with both onchain and offchain workflows.
 */

import { ExtensionRegistry } from '../extensions';
import { AstralError, ExtensionError, ValidationError, VerificationError } from './errors';
import {
  AstralSDKConfig,
  LocationAttestationInput,
  UnsignedLocationAttestation,
  OffchainLocationAttestation,
  OnchainLocationAttestation,
  VerificationResult,
  OffchainAttestationOptions,
  OnchainAttestationOptions,
} from './types';
import { SchemaValue } from '../eas/SchemaEncoder';
import { CustomSchemaExtensionOptions } from '../extensions/schema/helpers';
import { OffchainSigner } from '../eas/OffchainSigner';
import { OnchainRegistrar } from '../eas/OnchainRegistrar';
import { getChainId, getChainName } from '../eas/chains';

/**
 * AstralSDK is the main entry point for the Astral SDK.
 *
 * This class provides methods for creating and managing location attestations
 * using both onchain and offchain workflows.
 */
export class AstralSDK {
  /** Extension registry for format handlers */
  public readonly extensions: ExtensionRegistry;

  /** Configuration options */
  private readonly config: AstralSDKConfig;

  /** Debug mode flag */
  private readonly debug: boolean;

  /** OffchainSigner instance for offchain workflow */
  private offchainSigner?: OffchainSigner;

  /** OnchainRegistrar instance for onchain workflow */
  private onchainRegistrar?: OnchainRegistrar;

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

    // Initialize OffchainSigner if we have a signer
    if (this.config.signer) {
      this.initializeOffchainSigner();
    }

    // Initialize OnchainRegistrar if we have a provider or signer
    if (this.config.provider || this.config.signer) {
      this.initializeOnchainRegistrar();
    }

    if (this.debug) {
      // Debug: AstralSDK initialized with config
    }
  }

  /**
   * Initialize OffchainSigner with current configuration
   *
   * @private
   */
  private initializeOffchainSigner(): void {
    // Get chain ID from config, defaulting to chainId if provided, otherwise derive from defaultChain
    let chainId: number;
    if (this.config.chainId) {
      chainId = this.config.chainId;
      // Log warning if both chainId and defaultChain are provided
      if (this.config.defaultChain && this.debug) {
        console.log(
          `Both chainId (${this.config.chainId}) and defaultChain (${this.config.defaultChain}) provided. Using chainId.`
        );
      }
    } else {
      chainId = getChainId(this.config.defaultChain || 'sepolia');
    }

    try {
      this.offchainSigner = new OffchainSigner({
        signer: this.config.signer,
        chainId,
      });

      if (this.debug) {
        const chainName = this.config.defaultChain || getChainName(chainId);
        console.log(`OffchainSigner initialized for chain ${chainId} (${chainName})`);
      }
    } catch (error) {
      if (this.debug) {
        console.warn('Failed to initialize OffchainSigner:', error);
      }
    }
  }

  /**
   * Initialize OnchainRegistrar with current configuration
   *
   * @private
   */
  private initializeOnchainRegistrar(): void {
    try {
      this.onchainRegistrar = new OnchainRegistrar({
        provider: this.config.provider,
        signer: this.config.signer,
        chain: this.config.defaultChain || 'sepolia',
      });

      if (this.debug) {
        // console.log(`OnchainRegistrar initialized for chain ${this.config.defaultChain}`);
      }
    } catch (error) {
      // Warning: Failed to initialize OnchainRegistrar
    }
  }

  /**
   * Ensures the OffchainSigner is initialized
   *
   * @param options - Optional offchain proof options
   * @throws {ValidationError} If the OffchainSigner is not initialized
   * @private
   */
  private ensureOffchainSignerInitialized(options?: OffchainAttestationOptions): void {
    // Check if we have an OffchainSigner
    if (!this.offchainSigner) {
      // If we don't have an OffchainSigner, try to initialize one with options
      if (options && (options.signer || options.privateKey)) {
        // Get chain ID from config, defaulting to chainId if provided, otherwise derive from defaultChain
        let chainId: number;
        if (this.config.chainId) {
          chainId = this.config.chainId;
          // Log warning if both chainId and defaultChain are provided
          if (this.config.defaultChain && this.debug) {
            console.log(
              `Both chainId (${this.config.chainId}) and defaultChain (${this.config.defaultChain}) provided. Using chainId.`
            );
          }
        } else {
          chainId = getChainId(this.config.defaultChain || 'sepolia');
        }
        this.offchainSigner = new OffchainSigner({
          signer: options.signer,
          privateKey: options.privateKey,
          chainId,
        });
      } else {
        // If we still don't have a signer, throw an error
        throw new ValidationError(
          'No signer available for offchain operations. Provide a signer in SDK constructor or options.',
          undefined,
          { config: this.config, options }
        );
      }
    }
  }

  /**
   * Ensures the OnchainRegistrar is initialized
   *
   * @param options - Optional onchain proof options
   * @throws {ValidationError} If the OnchainRegistrar is not initialized and can't be initialized with the provided options
   * @private
   */
  private ensureOnchainRegistrarInitialized(options?: OnchainAttestationOptions): void {
    // Check if we have an OnchainRegistrar
    if (!this.onchainRegistrar) {
      // If we don't have an OnchainRegistrar, try to initialize one with options
      if (options && (options.provider || options.signer)) {
        this.onchainRegistrar = new OnchainRegistrar({
          provider: options.provider || this.config.provider,
          signer: options.signer || this.config.signer,
          chain: options.chain || this.config.defaultChain || 'sepolia',
        });

        if (this.debug) {
          // console.log('OnchainRegistrar initialized from options');
        }
      } else {
        // If we still don't have a provider or signer, throw an error
        throw new ValidationError(
          'No provider or signer available for onchain operations. Provide a provider or signer in SDK constructor or options.',
          undefined,
          { config: this.config, options }
        );
      }
    }
  }

  /**
   * Signs an unsigned location attestation to create an offchain location attestation
   *
   * This method uses the OffchainSigner component to create an EIP-712 signature
   * for the location attestation, resulting in a complete OffchainLocationAttestation.
   *
   * @param unsignedProof - The unsigned location attestation to sign
   * @param options - Optional configuration for the signing process
   * @returns A complete OffchainLocationAttestation with signature
   * @throws {ValidationError} If no signer is available
   * @throws {SigningError} If the signing process fails
   */
  public async signOffchainLocationAttestation(
    unsignedProof: UnsignedLocationAttestation,
    options?: OffchainAttestationOptions
  ): Promise<OffchainLocationAttestation> {
    // Ensure we have an OffchainSigner
    this.ensureOffchainSignerInitialized(options);

    if (this.debug) {
      // console.log('Signing location attestation:', unsignedProof);
    }

    // Sign the proof using OffchainSigner
    return await this.offchainSigner!.signOffchainLocationAttestation(unsignedProof);
  }

  /**
   * Verifies an offchain location attestation's signature
   *
   * This method checks that the EIP-712 signature in the proof is valid
   * and was created by the expected signer.
   *
   * @param proof - The offchain location attestation to verify
   * @param options - Optional configuration for the verification process
   * @returns The verification result including validity status
   */
  public async verifyOffchainLocationAttestation(
    proof: OffchainLocationAttestation,
    options?: OffchainAttestationOptions
  ): Promise<VerificationResult> {
    try {
      // Initialize OffchainSigner if we don't have one yet
      this.ensureOffchainSignerInitialized(options);

      if (this.debug) {
        // Debug: Verifying offchain location attestation
      }

      // Verify using OffchainSigner
      return await this.offchainSigner!.verifyOffchainLocationAttestation(proof);
    } catch (error) {
      // Return a verification result with failure details
      return {
        isValid: false,
        attestation: proof,
        reason: error instanceof Error ? error.message : 'Unknown verification error',
      };
    }
  }

  /**
   * Builds an unsigned location attestation from input data.
   *
   * This method converts the input location data to the standardized format
   * required by the location attestation schema, using the appropriate extensions
   * for the specified location and media types.
   *
   * @param input - Location proof input data
   * @returns An unsigned location attestation ready for signing or registration
   * @throws ValidationError if the input data is invalid
   * @throws ExtensionError if no suitable extension is found for the location format
   */
  async buildLocationAttestation(
    input: LocationAttestationInput
  ): Promise<UnsignedLocationAttestation> {
    if (!input.location) {
      throw new ValidationError('Location data is required');
    }

    // Ensure extensions are initialized before using them
    await this.extensions.ensureInitialized();

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
        // console.log(`Auto-detected location format: ${locationType}`);
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
            // console.log(`Converted location format from ${locationType} to ${finalLocationType}`);
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

      // Build the unsigned location attestation
      const unsignedProof: UnsignedLocationAttestation = {
        eventTimestamp: input.timestamp
          ? Math.floor(input.timestamp.getTime() / 1000)
          : Math.floor(Date.now() / 1000),
        srs: 'EPSG:4326', // WGS84 is the default SRS
        locationType: finalLocationType,
        location: locationString,
        recipeType: [], // Empty in v0.1
        recipePayload: [], // Empty in v0.1
        mediaType: mediaTypes,
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

      // Validate against the schema if one is available
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

        if (this.debug) {
          // console.log('Validated proof against schema:', schemaExtension.schemaType);
        }
      }

      return unsignedProof;
    } catch (error) {
      if (error instanceof AstralError) {
        throw error;
      }

      throw new ValidationError(
        `Failed to build location attestation: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Create an offchain location attestation by signing the input data.
   *
   * This method:
   * 1. Builds an unsigned location attestation from the input data
   * 2. Signs it using EIP-712 signatures to create an offchain location attestation
   *
   * @param input - Location proof input data
   * @param options - Optional configuration for the signing process
   * @returns Promise resolving to a signed offchain location attestation
   * @throws {ValidationError} If no signer is available
   * @throws {SigningError} If the signing process fails
   */
  async createOffchainLocationAttestation(
    input: LocationAttestationInput,
    options?: OffchainAttestationOptions
  ): Promise<OffchainLocationAttestation> {
    // First build the unsigned proof
    const unsignedProof = await this.buildLocationAttestation(input);

    if (this.debug) {
      // console.log('Created unsigned location attestation, proceeding to sign:', unsignedProof);
    }

    // Sign the proof using our signOffchainLocationAttestation method
    return await this.signOffchainLocationAttestation(unsignedProof, options);
  }

  /**
   * Create an onchain location attestation by registering the input data.
   *
   * This method:
   * 1. Builds an unsigned location attestation from the input data
   * 2. Registers it on the blockchain using the OnchainRegistrar
   *
   * @param input - Location proof input data
   * @param options - Optional configuration for the registration process
   * @returns Promise resolving to an onchain location attestation with transaction details
   * @throws {ValidationError} If no provider or signer is available
   * @throws {RegistrationError} If the onchain registration fails
   */
  async createOnchainLocationAttestation(
    input: LocationAttestationInput,
    options?: OnchainAttestationOptions
  ): Promise<OnchainLocationAttestation> {
    try {
      // First build the unsigned proof
      const unsignedProof = await this.buildLocationAttestation(input);

      if (this.debug) {
        // console.log('Created unsigned location attestation, proceeding to register:', unsignedProof);
      }

      // Ensure OnchainRegistrar is initialized
      this.ensureOnchainRegistrarInitialized(options);

      // Register the proof using OnchainRegistrar
      const onchainProof = await this.onchainRegistrar!.registerOnchainLocationAttestation(
        unsignedProof,
        options
      );

      if (this.debug) {
        // Debug: Successfully registered onchain location attestation
      }

      return onchainProof;
    } catch (error) {
      // Propagate AstralError instances
      if (error instanceof AstralError) {
        throw error;
      }

      // Otherwise wrap in a validation error
      throw new ValidationError(
        `Failed to create onchain location attestation: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined,
        { input, options }
      );
    }
  }

  /**
   * Registers an onchain location attestation
   *
   * This method takes an unsigned attestation and registers it on the blockchain,
   * returning the registered attestation with transaction details.
   *
   * @param unsignedAttestation - The unsigned location attestation to register
   * @param options - Optional configuration for the registration process
   * @returns The registered onchain location attestation
   * @throws ValidationError if parameters are invalid
   * @throws Error if the registration fails
   */
  async registerOnchainLocationAttestation(
    unsignedAttestation: UnsignedLocationAttestation,
    options?: OnchainAttestationOptions
  ): Promise<OnchainLocationAttestation> {
    try {
      // Ensure OnchainRegistrar is initialized
      this.ensureOnchainRegistrarInitialized(options);

      if (this.debug) {
        console.log('Registering location attestation onchain');
      }

      // Register using OnchainRegistrar
      return await this.onchainRegistrar!.registerOnchainLocationAttestation(
        unsignedAttestation,
        options
      );
    } catch (error) {
      if (error instanceof AstralError) {
        throw error;
      }

      throw new ValidationError(
        `Failed to register onchain location attestation: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Verifies an onchain location attestation to ensure its validity
   *
   * This method checks that the proof exists on the blockchain and has not been revoked.
   *
   * @param proof - The onchain location attestation to verify
   * @param options - Optional configuration for the verification process
   * @returns A verification result including validity status and details
   * @throws {ValidationError} If no provider is available for blockchain interaction
   */
  async verifyOnchainLocationAttestation(
    proof: OnchainLocationAttestation,
    options?: OnchainAttestationOptions
  ): Promise<VerificationResult> {
    try {
      // Ensure OnchainRegistrar is initialized
      this.ensureOnchainRegistrarInitialized(options);

      if (this.debug) {
        // Debug: Verifying onchain location attestation
      }

      // Call the OnchainRegistrar to verify the proof
      const verificationResult =
        await this.onchainRegistrar!.verifyOnchainLocationAttestation(proof);

      if (this.debug) {
        // console.log('Verification result:', verificationResult);
      }

      return verificationResult;
    } catch (error) {
      // Return a failed verification result with the error details
      return {
        isValid: false,
        attestation: proof,
        reason: error instanceof Error ? error.message : 'Unknown verification error',
      };
    }
  }

  /**
   * Revokes an onchain location attestation
   *
   * This method sends a transaction to revoke an existing attestation on the blockchain.
   * Only the original attester can revoke their attestations, and only if they were created
   * with the revocable flag set to true.
   *
   * @param proof - The onchain location attestation to revoke
   * @param options - Optional configuration for the revocation process
   * @returns The transaction response from the revocation
   * @throws {ValidationError} If no signer is available or the proof is not revocable
   * @throws {RegistrationError} If the revocation transaction fails
   */
  async revokeOnchainLocationAttestation(
    proof: OnchainLocationAttestation,
    options?: OnchainAttestationOptions
  ): Promise<unknown> {
    try {
      // Ensure OnchainRegistrar is initialized
      this.ensureOnchainRegistrarInitialized(options);

      // Verify the proof is revocable
      if (!proof.revocable) {
        throw new ValidationError('This location attestation is not revocable', undefined, {
          proof,
        });
      }

      // Verify the proof is not already revoked
      if (proof.revoked) {
        throw new ValidationError('This location attestation is already revoked', undefined, {
          proof,
        });
      }

      if (this.debug) {
        // Debug: Revoking onchain location attestation
      }

      // Call the OnchainRegistrar to revoke the proof
      const response = await this.onchainRegistrar!.revokeOnchainLocationAttestation(proof);

      if (this.debug) {
        // console.log('Revocation successful, transaction response:', response);
      }

      return response;
    } catch (error) {
      // Propagate AstralError instances
      if (error instanceof AstralError) {
        throw error;
      }

      // Otherwise wrap in a verification error
      throw new VerificationError(
        `Failed to revoke onchain location attestation: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined,
        { proof }
      );
    }
  }

  /**
   * Encodes location attestation data according to the schema
   *
   * This method uses the appropriate schema extension to encode the proof data.
   *
   * @param proof - The location attestation to encode
   * @param schemaType - Optional schema type to use (defaults to 'location')
   * @returns Encoded data as a hex string
   * @throws ExtensionError if no schema extension is found
   * @throws ValidationError if the data is invalid for the schema
   */
  encodeLocationAttestation(
    proof: UnsignedLocationAttestation,
    schemaType: string = 'location'
  ): string {
    const schemaExtension = this.extensions.getSchemaExtension(schemaType);

    if (!schemaExtension) {
      throw new ExtensionError(`No schema extension found for type: ${schemaType}`, undefined, {
        schemaType,
        availableExtensions: this.extensions.getAllSchemaExtensions().map(ext => ext.schemaType),
      });
    }

    return schemaExtension.encodeData(proof as unknown as Record<string, SchemaValue>);
  }

  /**
   * Decodes encoded location attestation data according to the schema
   *
   * This method uses the appropriate schema extension to decode the proof data.
   *
   * @param encodedData - The encoded proof data as a hex string
   * @param schemaType - Optional schema type to use (defaults to 'location')
   * @returns Decoded location attestation data
   * @throws ExtensionError if no schema extension is found
   * @throws ValidationError if the encoded data is invalid
   */
  decodeLocationAttestation(
    encodedData: string,
    schemaType: string = 'location'
  ): Record<string, SchemaValue> {
    const schemaExtension = this.extensions.getSchemaExtension(schemaType);

    if (!schemaExtension) {
      throw new ExtensionError(`No schema extension found for type: ${schemaType}`, undefined, {
        schemaType,
        availableExtensions: this.extensions.getAllSchemaExtensions().map(ext => ext.schemaType),
      });
    }

    return schemaExtension.decodeData(encodedData);
  }

  /**
   * Gets the schema UID for a specific chain and schema type
   *
   * @param chainId - The chain ID to get the schema UID for
   * @param schemaType - Optional schema type to use (defaults to 'location')
   * @returns The schema UID for the specified chain
   * @throws ExtensionError if no schema extension is found
   */
  getSchemaUID(chainId: number, schemaType: string = 'location'): string {
    const schemaExtension = this.extensions.getSchemaExtension(schemaType);

    if (!schemaExtension) {
      throw new ExtensionError(`No schema extension found for type: ${schemaType}`, undefined, {
        schemaType,
        availableExtensions: this.extensions.getAllSchemaExtensions().map(ext => ext.schemaType),
      });
    }

    return schemaExtension.getSchemaUID(chainId);
  }

  /**
   * Gets the raw schema string for a specific schema type
   *
   * @param schemaType - Optional schema type to use (defaults to 'location')
   * @returns The raw schema string
   * @throws ExtensionError if no schema extension is found
   */
  getSchemaString(schemaType: string = 'location'): string {
    const schemaExtension = this.extensions.getSchemaExtension(schemaType);

    if (!schemaExtension) {
      throw new ExtensionError(`No schema extension found for type: ${schemaType}`, undefined, {
        schemaType,
        availableExtensions: this.extensions.getAllSchemaExtensions().map(ext => ext.schemaType),
      });
    }

    return schemaExtension.getSchemaString();
  }

  /**
   * Publishes an offchain location attestation to storage
   *
   * This method publishes a signed offchain attestation to a storage backend
   * (like IPFS or Astral's API) for later retrieval.
   *
   * @param attestation - The signed offchain attestation to publish
   * @returns The attestation with publication metadata added
   */
  async publishOffchainLocationAttestation(
    attestation: OffchainLocationAttestation
  ): Promise<OffchainLocationAttestation> {
    if (this.debug) {
      console.log('Publishing offchain location attestation');
    }

    // For now, just return the attestation as-is
    // In the future, this will integrate with storage adapters
    return attestation;
  }

  /**
   * Registers a custom schema extension with the SDK
   *
   * @param options - Configuration options for the custom schema extension
   * @returns The registered schema extension
   */
  registerCustomSchema(options: CustomSchemaExtensionOptions): void {
    // Import helper function dynamically to avoid circular dependencies
    import('../extensions/schema/helpers')
      .then(({ createCustomSchemaExtension }) => {
        const extension = createCustomSchemaExtension(options);
        this.extensions.registerSchemaExtension(extension);

        if (this.debug) {
          // console.log(`Registered custom schema extension: ${options.schemaType}`);
        }
      })
      .catch(error => {
        throw new ExtensionError(
          'Failed to register custom schema extension',
          error instanceof Error ? error : undefined,
          { options }
        );
      });
  }
}
