/**
 * Schema extension helpers for Astral SDK
 *
 * This module provides helper functions for creating and registering
 * custom schema extensions for the Astral SDK.
 */

import { SchemaEncoder, SchemaValue } from '../../eas/SchemaEncoder';
import { BaseExtension, SchemaExtension } from '../types';
import { ValidationError } from '../../core/errors';

/**
 * Options for creating a custom schema extension
 */
export interface CustomSchemaExtensionOptions {
  /** Unique identifier for the extension */
  id: string;

  /** Human-readable name for the extension */
  name: string;

  /** Description of what the extension does */
  description: string;

  /** Schema type identifier (e.g., "location", "identity", "social") */
  schemaType: string;

  /** Raw schema string for EAS attestations */
  schemaString: string;

  /** Schema UIDs for different chains, keyed by chain ID */
  schemaUIDs: Record<number, string>;

  /** Optional custom schema validation function */
  validateSchema?: (data: Record<string, SchemaValue>) => boolean;

  /** Optional custom encoder initialization function */
  createEncoder?: (schemaString: string) => SchemaEncoder;
}

/**
 * Creates a custom schema extension from the given options
 *
 * @param options - Configuration options for the custom schema extension
 * @returns A new SchemaExtension instance
 */
export function createCustomSchemaExtension(
  options: CustomSchemaExtensionOptions
): SchemaExtension {
  class CustomSchemaExtension extends BaseExtension implements SchemaExtension {
    readonly id = options.id;
    readonly name = options.name;
    readonly description = options.description;
    readonly schemaType = options.schemaType;

    // Cached instances of SchemaEncoder for performance
    private schemaEncoders: Map<string, SchemaEncoder> = new Map();

    /**
     * Validates that the extension is properly configured
     *
     * @returns True if the extension is valid
     */
    validate(): boolean {
      try {
        // Verify that the schema string is provided
        if (!options.schemaString) {
          return false;
        }

        // Verify that the schema is valid
        if (!SchemaEncoder.isSchemaValid(options.schemaString)) {
          return false;
        }

        // Verify that schema UIDs are provided for at least one chain
        if (!options.schemaUIDs || Object.keys(options.schemaUIDs).length === 0) {
          return false;
        }

        // Verify schema UIDs are valid
        for (const uid of Object.values(options.schemaUIDs)) {
          if (!uid || uid.length !== 66 || !uid.startsWith('0x')) {
            return false;
          }
        }

        return true;
      } catch (error) {
        return false;
      }
    }

    /**
     * Gets the raw schema string for this extension
     *
     * @returns The raw schema string used for EAS attestations
     */
    getSchemaString(): string {
      return options.schemaString;
    }

    /**
     * Gets the schema UID for a specific chain
     *
     * @param chainId - The chain ID to get the schema UID for
     * @returns The schema UID for the specified chain
     * @throws ValidationError if the schema UID is not found for the chain
     */
    getSchemaUID(chainId: number): string {
      const uid = options.schemaUIDs[chainId];
      if (!uid) {
        throw new ValidationError(`Schema UID not found for chain ID ${chainId}`, undefined, {
          chainId,
          availableChains: Object.keys(options.schemaUIDs).map(Number),
        });
      }

      return uid;
    }

    /**
     * Gets a SchemaEncoder instance for encoding and decoding data
     *
     * @returns A SchemaEncoder instance for this schema
     */
    private getSchemaEncoder(): SchemaEncoder {
      const schemaString = this.getSchemaString();

      // Use cached encoder if available
      if (this.schemaEncoders.has(schemaString)) {
        return this.schemaEncoders.get(schemaString)!;
      }

      // Create and cache a new encoder using custom function if provided
      const encoder = options.createEncoder
        ? options.createEncoder(schemaString)
        : new SchemaEncoder(schemaString);

      this.schemaEncoders.set(schemaString, encoder);
      return encoder;
    }

    /**
     * Validates data against the schema
     *
     * @param data - Data to validate against the schema
     * @returns True if the data is valid for this schema
     */
    validateSchemaData(data: Record<string, SchemaValue>): boolean {
      // Use custom validation function if provided
      if (options.validateSchema) {
        return options.validateSchema(data);
      }

      try {
        // Default validation: try to encode the data and verify it's valid
        const encoder = this.getSchemaEncoder();
        const encoded = this.encodeData(data);
        return encoder.isEncodedDataValid(encoded);
      } catch (error) {
        return false;
      }
    }

    /**
     * Encodes data according to the schema
     *
     * @param data - Data to encode
     * @returns Encoded data as a hex string
     * @throws ValidationError if the data is invalid
     */
    encodeData(data: Record<string, SchemaValue>): string {
      try {
        const encoder = this.getSchemaEncoder();
        return encoder.encodeData(
          Object.entries(data).map(([name, value]) => ({
            name,
            value,
            type: this.getFieldType(name),
          }))
        );
      } catch (error) {
        throw new ValidationError(
          'Failed to encode schema data',
          error instanceof Error ? error : undefined,
          { data }
        );
      }
    }

    /**
     * Decodes hex data according to the schema
     *
     * @param encodedData - Hex data to decode
     * @returns Decoded data as a Record
     * @throws ValidationError if the encoded data is invalid
     */
    decodeData(encodedData: string): Record<string, SchemaValue> {
      try {
        const encoder = this.getSchemaEncoder();

        if (!encoder.isEncodedDataValid(encodedData)) {
          throw new ValidationError('Invalid encoded data for schema', undefined, {
            encodedData,
          });
        }

        const decoded = encoder.decodeData(encodedData);
        const result: Record<string, SchemaValue> = {};

        for (const item of decoded) {
          result[item.name] = item.value;
        }

        return result;
      } catch (error) {
        if (error instanceof ValidationError) {
          throw error;
        }

        throw new ValidationError(
          'Failed to decode schema data',
          error instanceof Error ? error : undefined,
          { encodedData }
        );
      }
    }

    /**
     * Gets the type of a schema field
     *
     * @param fieldName - The name of the field
     * @returns The type of the field
     * @private
     */
    private getFieldType(fieldName: string): string {
      // Parse the schema string to extract field types
      const schemaString = this.getSchemaString();
      const fields = schemaString.split(',').map(field => field.trim());

      for (const field of fields) {
        const [type, name] = field.split(' ').map(part => part.trim());
        if (name === fieldName) {
          return type;
        }
      }

      // Default to string if the field type cannot be determined
      return 'string';
    }
  }

  return new CustomSchemaExtension();
}

/**
 * Registers a custom schema extension with the given extension registry
 *
 * @param registry - The extension registry to register with
 * @param options - Configuration options for the custom schema extension
 * @returns The registered schema extension
 */
export function registerCustomSchemaExtension(
  registry: import('../types').ExtensionRegistry,
  options: CustomSchemaExtensionOptions
): SchemaExtension {
  const extension = createCustomSchemaExtension(options);
  registry.registerSchemaExtension(extension);
  return extension;
}

export default {
  createCustomSchemaExtension,
  registerCustomSchemaExtension,
};
