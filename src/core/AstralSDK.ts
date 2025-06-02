/**
 * Main SDK entry point
 *
 * This file implements the AstralSDK class, which serves as the primary interface
 * for developers using the Astral SDK. It provides methods for creating and managing
 * location proofs with both onchain and offchain workflows.
 */

import { ExtensionRegistry } from '../extensions';
import { AstralError, ExtensionError, ValidationError, VerificationError } from './errors';
import {
  AstralSDKConfig,
  LocationProofInput,
  UnsignedLocationProof,
  OffchainLocationProof,
  OnchainLocationProof,
  VerificationResult,
  OffchainProofOptions,
  OnchainProofOptions,
} from './types';
import { SchemaValue } from '../eas/SchemaEncoder';
import { CustomSchemaExtensionOptions } from '../extensions/schema/helpers';
import { OffchainSigner } from '../eas/OffchainSigner';
import { OnchainRegistrar } from '../eas/OnchainRegistrar';
import { getChainId } from '../eas/chains';

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
    // Get chain ID from the chain name or use default
    const chainId = getChainId(this.config.defaultChain || 'sepolia');

    try {
      this.offchainSigner = new OffchainSigner({
        signer: this.config.signer,
        chainId,
      });

      if (this.debug) {
        // Debug: OffchainSigner initialized for chain ${chainId} (${this.config.defaultChain})
      }
    } catch (error) {
      // Warning: Failed to initialize OffchainSigner
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
  private ensureOffchainSignerInitialized(options?: OffchainProofOptions): void {
    // Check if we have an OffchainSigner
    if (!this.offchainSigner) {
      // If we don't have an OffchainSigner, try to initialize one with options
      if (options && (options.signer || options.privateKey)) {
        const chainId = getChainId(this.config.defaultChain || 'sepolia');
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
  private ensureOnchainRegistrarInitialized(options?: OnchainProofOptions): void {
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
   * Signs an unsigned location proof to create an offchain location proof
   *
   * This method uses the OffchainSigner component to create an EIP-712 signature
   * for the location proof, resulting in a complete OffchainLocationProof.
   *
   * @param unsignedProof - The unsigned location proof to sign
   * @param options - Optional configuration for the signing process
   * @returns A complete OffchainLocationProof with signature
   * @throws {ValidationError} If no signer is available
   * @throws {SigningError} If the signing process fails
   */
  public async signOffchainLocationProof(
    unsignedProof: UnsignedLocationProof,
    options?: OffchainProofOptions
  ): Promise<OffchainLocationProof> {
    // Ensure we have an OffchainSigner
    this.ensureOffchainSignerInitialized(options);

    if (this.debug) {
      // console.log('Signing location proof:', unsignedProof);
    }

    // Sign the proof using OffchainSigner
    return await this.offchainSigner!.signOffchainLocationProof(unsignedProof);
  }

  /**
   * Verifies an offchain location proof's signature
   *
   * This method checks that the EIP-712 signature in the proof is valid
   * and was created by the expected signer.
   *
   * @param proof - The offchain location proof to verify
   * @param options - Optional configuration for the verification process
   * @returns The verification result including validity status
   */
  public async verifyOffchainLocationProof(
    proof: OffchainLocationProof,
    options?: OffchainProofOptions
  ): Promise<VerificationResult> {
    try {
      // Initialize OffchainSigner if we don't have one yet
      this.ensureOffchainSignerInitialized(options);

      if (this.debug) {
        // Debug: Verifying offchain location proof
      }

      // Verify using OffchainSigner
      return await this.offchainSigner!.verifyOffchainLocationProof(proof);
    } catch (error) {
      // Return a verification result with failure details
      return {
        isValid: false,
        proof,
        reason: error instanceof Error ? error.message : 'Unknown verification error',
      };
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

      // Validate against the schema if one is available
      const schemaExtension = this.extensions.getSchemaExtension('location');
      if (schemaExtension) {
        const isValid = schemaExtension.validateSchemaData(
          unsignedProof as unknown as Record<string, SchemaValue>
        );
        if (!isValid) {
          throw new ValidationError('Generated proof does not match the schema', undefined, {
            proof: unsignedProof,
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
        `Failed to build location proof: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Create an offchain location proof by signing the input data.
   *
   * This method:
   * 1. Builds an unsigned location proof from the input data
   * 2. Signs it using EIP-712 signatures to create an offchain location proof
   *
   * @param input - Location proof input data
   * @param options - Optional configuration for the signing process
   * @returns Promise resolving to a signed offchain location proof
   * @throws {ValidationError} If no signer is available
   * @throws {SigningError} If the signing process fails
   */
  async createOffchainLocationProof(
    input: LocationProofInput,
    options?: OffchainProofOptions
  ): Promise<OffchainLocationProof> {
    // First build the unsigned proof
    const unsignedProof = await this.buildLocationProof(input);

    if (this.debug) {
      // console.log('Created unsigned location proof, proceeding to sign:', unsignedProof);
    }

    // Sign the proof using our signOffchainLocationProof method
    return await this.signOffchainLocationProof(unsignedProof, options);
  }

  /**
   * Create an onchain location proof by registering the input data.
   *
   * This method:
   * 1. Builds an unsigned location proof from the input data
   * 2. Registers it on the blockchain using the OnchainRegistrar
   *
   * @param input - Location proof input data
   * @param options - Optional configuration for the registration process
   * @returns Promise resolving to an onchain location proof with transaction details
   * @throws {ValidationError} If no provider or signer is available
   * @throws {RegistrationError} If the onchain registration fails
   */
  async createOnchainLocationProof(
    input: LocationProofInput,
    options?: OnchainProofOptions
  ): Promise<OnchainLocationProof> {
    try {
      // First build the unsigned proof
      const unsignedProof = await this.buildLocationProof(input);

      if (this.debug) {
        // console.log('Created unsigned location proof, proceeding to register:', unsignedProof);
      }

      // Ensure OnchainRegistrar is initialized
      this.ensureOnchainRegistrarInitialized(options);

      // Register the proof using OnchainRegistrar
      const onchainProof = await this.onchainRegistrar!.registerOnchainLocationProof(
        unsignedProof,
        options
      );

      if (this.debug) {
        // Debug: Successfully registered onchain location proof
      }

      return onchainProof;
    } catch (error) {
      // Propagate AstralError instances
      if (error instanceof AstralError) {
        throw error;
      }

      // Otherwise wrap in a validation error
      throw new ValidationError(
        `Failed to create onchain location proof: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined,
        { input, options }
      );
    }
  }

  /**
   * Encodes location proof data according to the schema
   *
   * This method uses the appropriate schema extension to encode the proof data.
   *
   * @param proof - The location proof to encode
   * @param schemaType - Optional schema type to use (defaults to 'location')
   * @returns Encoded data as a hex string
   * @throws ExtensionError if no schema extension is found
   * @throws ValidationError if the data is invalid for the schema
   */
  /**
   * Verifies an onchain location proof to ensure its validity
   *
   * This method checks that the proof exists on the blockchain and has not been revoked.
   *
   * @param proof - The onchain location proof to verify
   * @param options - Optional configuration for the verification process
   * @returns A verification result including validity status and details
   * @throws {ValidationError} If no provider is available for blockchain interaction
   */
  async verifyOnchainLocationProof(
    proof: OnchainLocationProof,
    options?: OnchainProofOptions
  ): Promise<VerificationResult> {
    try {
      // Ensure OnchainRegistrar is initialized
      this.ensureOnchainRegistrarInitialized(options);

      if (this.debug) {
        // Debug: Verifying onchain location proof
      }

      // Call the OnchainRegistrar to verify the proof
      const verificationResult = await this.onchainRegistrar!.verifyOnchainLocationProof(proof);

      if (this.debug) {
        // console.log('Verification result:', verificationResult);
      }

      return verificationResult;
    } catch (error) {
      // Return a failed verification result with the error details
      return {
        isValid: false,
        proof,
        reason: error instanceof Error ? error.message : 'Unknown verification error',
      };
    }
  }

  /**
   * Revokes an onchain location proof
   *
   * This method sends a transaction to revoke an existing attestation on the blockchain.
   * Only the original attester can revoke their attestations, and only if they were created
   * with the revocable flag set to true.
   *
   * @param proof - The onchain location proof to revoke
   * @param options - Optional configuration for the revocation process
   * @returns The transaction response from the revocation
   * @throws {ValidationError} If no signer is available or the proof is not revocable
   * @throws {RegistrationError} If the revocation transaction fails
   */
  async revokeOnchainLocationProof(
    proof: OnchainLocationProof,
    options?: OnchainProofOptions
  ): Promise<unknown> {
    try {
      // Ensure OnchainRegistrar is initialized
      this.ensureOnchainRegistrarInitialized(options);

      // Verify the proof is revocable
      if (!proof.revocable) {
        throw new ValidationError('This location proof is not revocable', undefined, { proof });
      }

      // Verify the proof is not already revoked
      if (proof.revoked) {
        throw new ValidationError('This location proof is already revoked', undefined, { proof });
      }

      if (this.debug) {
        // Debug: Revoking onchain location proof
      }

      // Call the OnchainRegistrar to revoke the proof
      const response = await this.onchainRegistrar!.revokeOnchainLocationProof(proof);

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
        `Failed to revoke onchain location proof: ${
          error instanceof Error ? error.message : String(error)
        }`,
        error instanceof Error ? error : undefined,
        { proof }
      );
    }
  }

  /**
   * Encodes location proof data according to the schema
   *
   * This method uses the appropriate schema extension to encode the proof data.
   *
   * @param proof - The location proof to encode
   * @param schemaType - Optional schema type to use (defaults to 'location')
   * @returns Encoded data as a hex string
   * @throws ExtensionError if no schema extension is found
   * @throws ValidationError if the data is invalid for the schema
   */
  encodeLocationProof(proof: UnsignedLocationProof, schemaType: string = 'location'): string {
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
   * Decodes encoded location proof data according to the schema
   *
   * This method uses the appropriate schema extension to decode the proof data.
   *
   * @param encodedData - The encoded proof data as a hex string
   * @param schemaType - Optional schema type to use (defaults to 'location')
   * @returns Decoded location proof data
   * @throws ExtensionError if no schema extension is found
   * @throws ValidationError if the encoded data is invalid
   */
  decodeLocationProof(
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
