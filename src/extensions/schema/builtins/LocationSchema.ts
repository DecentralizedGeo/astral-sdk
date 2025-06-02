/**
 * LocationSchema Extension
 *
 * This extension provides support for the Astral location schema format in EAS attestations.
 * It handles encoding and decoding of location data according to the schema defined in EAS-config.json.
 */

import { BaseExtension } from '../../types';
import { SchemaExtension } from '../../types';
import { SchemaEncoder, SchemaValue } from '../../../eas/SchemaEncoder';
import {
  getSchemaString,
  getSchemaUID,
  getSchemaConfig,
  getSupportedChainIds,
} from '../../../eas/chains';
import { ValidationError } from '../../../core/errors';

/**
 * LocationSchemaExtension implements the SchemaExtension interface for the Astral location schema.
 *
 * This extension provides methods for encoding and decoding location attestations
 * according to the schema defined in the EAS-config.json.
 */
export class LocationSchemaExtension extends BaseExtension implements SchemaExtension {
  readonly id = 'astral:schema:location';
  readonly name = 'Astral Location Schema';
  readonly description = 'Handles EAS schema for Astral location attestations';
  readonly schemaType = 'location';

  // Cached instances of SchemaEncoder for performance
  private schemaEncoders: Map<string, SchemaEncoder> = new Map();

  /**
   * Validates that the extension is properly configured.
   *
   * @returns True if the extension is valid
   */
  validate(): boolean {
    try {
      // Verify that we can get the schema string
      const schemaString = this.getSchemaString();

      // Verify that the schema is valid
      if (!SchemaEncoder.isSchemaValid(schemaString)) {
        return false;
      }

      // Verify that we can get schema UIDs for supported chains
      const chainIds = getSupportedChainIds();
      for (const chainId of chainIds) {
        const uid = this.getSchemaUID(chainId);
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
    return getSchemaString();
  }

  /**
   * Gets the schema UID for a specific chain
   *
   * @param chainId - The chain ID to get the schema UID for
   * @returns The schema UID for the specified chain
   */
  getSchemaUID(chainId: number): string {
    return getSchemaUID(chainId);
  }

  /**
   * Gets a SchemaEncoder instance for encoding and decoding data
   *
   * @returns A SchemaEncoder instance for the location schema
   */
  private getSchemaEncoder(): SchemaEncoder {
    const schemaString = this.getSchemaString();

    // Use cached encoder if available
    if (this.schemaEncoders.has(schemaString)) {
      return this.schemaEncoders.get(schemaString)!;
    }

    // Create and cache a new encoder
    const encoder = new SchemaEncoder(schemaString);
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
    try {
      // Get the schema interface
      const schemaInterface = getSchemaConfig().interface;

      // Check that all required fields are present
      for (const [field, type] of Object.entries(schemaInterface)) {
        // Skip optional fields
        if (field.endsWith('?')) continue;

        // Handle array types
        if (type.endsWith('[]')) {
          if (field in data) {
            const value = data[field];
            if (!Array.isArray(value)) {
              return false;
            }
          } else {
            // Field is required but missing
            return false;
          }
        } else if (!(field in data)) {
          // Field is required but missing
          return false;
        }
      }

      // Encode the data to verify it's compatible with the schema
      const encoder = this.getSchemaEncoder();
      const encoded = encoder.encodeLocationProof(data);

      // Verify the encoded data
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
    if (!this.validateSchemaData(data)) {
      throw new ValidationError('Invalid data for location schema', undefined, { data });
    }

    try {
      const encoder = this.getSchemaEncoder();
      return encoder.encodeLocationProof(data);
    } catch (error) {
      throw new ValidationError(
        'Failed to encode location schema data',
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
        throw new ValidationError('Invalid encoded data for location schema', undefined, {
          encodedData,
        });
      }

      // Convert the unknown type to SchemaValue type
      const decoded = encoder.decodeLocationProof(encodedData);
      const result: Record<string, SchemaValue> = {};

      for (const [key, value] of Object.entries(decoded)) {
        result[key] = value as SchemaValue;
      }

      return result;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }

      throw new ValidationError(
        'Failed to decode location schema data',
        error instanceof Error ? error : undefined,
        { encodedData }
      );
    }
  }
}

/**
 * Create and export a singleton instance of the LocationSchema extension
 */
export const locationSchemaExtension = new LocationSchemaExtension();
