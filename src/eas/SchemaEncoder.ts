/**
 * SchemaEncoder for Astral SDK
 *
 * This module provides functionality for encoding and decoding EAS schema data.
 * It's a wrapper around the EAS SDK's SchemaEncoder with Astral-specific extensions.
 */

import { SchemaEncoder as EASSchemaEncoder } from '@ethereum-attestation-service/eas-sdk';
import { getSchemaConfig } from './chains';
import { ValidationError } from '../core/errors';

/**
 * Schema value type (matching EAS SDK)
 */
export type SchemaValue =
  | string
  | boolean
  | number
  | bigint
  | Record<string, unknown>
  | Record<string, unknown>[]
  | unknown[];

/**
 * Schema field item for encoding
 */
export interface SchemaItem {
  name: string;
  value: SchemaValue;
  type: string;
}

/**
 * Decoded schema item
 */
export interface SchemaDecodedItem {
  name: string;
  value: SchemaValue;
  type: string;
}

/**
 * SchemaEncoder encodes and decodes attestation data according to EAS schemas.
 *
 * This class wraps the EAS SDK's SchemaEncoder to provide a consistent interface
 * and add Astral-specific extensions.
 */
export class SchemaEncoder {
  private easSchemaEncoder: EASSchemaEncoder;
  private rawSchema: string;
  private schemaInterface: Record<string, string>;

  /**
   * Creates a new SchemaEncoder instance.
   *
   * @param schema - The schema string or version to use for encoding/decoding
   * @throws {ValidationError} If the schema is invalid or cannot be loaded
   */
  constructor(schema: string) {
    // If provided schema looks like a version string (e.g., 'v0.1'), load from config
    if (schema.startsWith('v') && /v\d+\.\d+/.test(schema)) {
      try {
        const schemaConfig = getSchemaConfig(schema);
        this.rawSchema = schemaConfig.rawString;
        this.schemaInterface = schemaConfig.interface;
      } catch (error) {
        throw new ValidationError(
          `Failed to load schema for version ${schema}`,
          error instanceof Error ? error : undefined,
          { version: schema }
        );
      }
    } else {
      // Use provided schema string directly
      this.rawSchema = schema;
      this.schemaInterface = this.parseSchemaInterface(schema);
    }

    try {
      this.easSchemaEncoder = new EASSchemaEncoder(this.rawSchema);
    } catch (error) {
      throw new ValidationError(
        'Invalid schema format',
        error instanceof Error ? error : undefined,
        { schema: this.rawSchema }
      );
    }
  }

  /**
   * Parse a schema string into an interface object
   *
   * @param schema - The schema string to parse
   * @returns A record mapping field names to their types
   */
  private parseSchemaInterface(schema: string): Record<string, string> {
    const schemaInterface: Record<string, string> = {};

    const fields = schema.split(',').map(field => field.trim());

    fields.forEach(field => {
      const [type, name] = field.split(' ').map(part => part.trim());

      if (!type || !name) {
        throw new ValidationError(`Invalid schema field format: ${field}`, undefined, { schema });
      }

      schemaInterface[name] = type;
    });

    return schemaInterface;
  }

  /**
   * Gets the raw schema string
   *
   * @returns The raw schema string
   */
  public getSchema(): string {
    return this.rawSchema;
  }

  /**
   * Gets the schema interface (field names and types)
   *
   * @returns The schema interface as a Record
   */
  public getSchemaInterface(): Record<string, string> {
    return { ...this.schemaInterface };
  }

  /**
   * Validates if a schema string is properly formatted
   *
   * @param schema - The schema string to validate
   * @returns True if the schema is valid
   */
  public static isSchemaValid(schema: string): boolean {
    try {
      // Use the EAS SDK's validation
      return EASSchemaEncoder.isSchemaValid(schema);
    } catch (error) {
      return false;
    }
  }

  /**
   * Encodes data according to the schema
   *
   * @param data - Array of schema items with name, type, and value
   * @returns The encoded data as a hex string
   * @throws {ValidationError} If the data doesn't match the schema
   */
  public encodeData(data: SchemaItem[]): string {
    try {
      // Since our types now match the EAS SDK's expected types,
      // we can pass the data directly
      return this.easSchemaEncoder.encodeData(data);
    } catch (error) {
      throw new ValidationError(
        'Failed to encode schema data',
        error instanceof Error ? error : undefined,
        { data }
      );
    }
  }

  /**
   * Decodes data according to the schema
   *
   * @param encodedData - The encoded data as a hex string
   * @returns Array of decoded schema items with name, type, and value
   * @throws {ValidationError} If the data doesn't match the schema
   */
  public decodeData(encodedData: string): SchemaDecodedItem[] {
    try {
      // Convert to our local type via unknown to avoid type errors
      const decoded = this.easSchemaEncoder.decodeData(encodedData);
      return decoded as unknown as SchemaDecodedItem[];
    } catch (error) {
      throw new ValidationError(
        'Failed to decode schema data',
        error instanceof Error ? error : undefined,
        { encodedData }
      );
    }
  }

  /**
   * Checks if encoded data conforms to the schema
   *
   * @param encodedData - The encoded data to validate
   * @returns True if the data is valid for this schema
   */
  public isEncodedDataValid(encodedData: string): boolean {
    try {
      return this.easSchemaEncoder.isEncodedDataValid(encodedData);
    } catch (error) {
      return false;
    }
  }

  /**
   * Encode an unsigned location proof according to the EAS schema
   *
   * @param proof - The unsigned location proof object
   * @returns The encoded data as a hex string
   */
  public encodeLocationProof(proof: Record<string, SchemaValue>): string {
    const schemaItems: SchemaItem[] = [];

    // Map proof fields to schema fields
    for (const [name, type] of Object.entries(this.schemaInterface)) {
      // Skip fields that don't exist in the proof
      if (!(name in proof) && !name.endsWith('[]')) {
        continue;
      }

      // Handle array types
      if (type.endsWith('[]')) {
        // Get the array value from the proof
        const arrayValue = (proof[name] || []) as unknown[];

        // Add the array field
        schemaItems.push({
          name,
          type,
          value: arrayValue as SchemaValue,
        });
      } else {
        // Handle regular types
        schemaItems.push({
          name,
          type,
          value: proof[name] as SchemaValue,
        });
      }
    }

    return this.encodeData(schemaItems);
  }

  /**
   * Decode encoded data to a location proof object
   *
   * @param encodedData - The encoded data as a hex string
   * @returns An object with the decoded fields
   */
  public decodeLocationProof(encodedData: string): Record<string, unknown> {
    const decodedItems = this.decodeData(encodedData);

    // Convert the array of items to an object
    const proof: Record<string, unknown> = {};

    decodedItems.forEach(item => {
      proof[item.name] = item.value;
    });

    return proof;
  }
}

export default SchemaEncoder;
