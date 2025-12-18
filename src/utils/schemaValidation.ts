// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

/**
 * Schema validation utilities for Location Protocol conformance.
 *
 * This module provides tools to validate EAS schemas against Location Protocol
 * requirements, supporting both v0.1 (legacy) and v0.2 (current) specifications.
 *
 * @module utils/schemaValidation
 */

import { ValidationError } from '../core/errors';

/**
 * Result of schema validation containing detailed conformance information.
 *
 * @property valid - Whether the schema is a valid EAS schema format
 * @property version - Detected Location Protocol version (1 for v0.1, 2 for v0.2)
 * @property conformant - Whether the schema conforms to Location Protocol requirements
 * @property missing - Array of missing required fields
 * @property errors - Array of schema format errors
 * @property warnings - Array of non-critical issues
 * @property fields - Parsed schema fields (if valid)
 *
 * @example
 * ```ts
 * const result = validateLocationProtocolSchema(schemaString);
 * if (result.conformant) {
 *   console.log(`Schema conforms to Location Protocol v0.${result.version}`);
 * } else {
 *   console.log('Missing fields:', result.missing);
 * }
 * ```
 */
export interface SchemaValidationResult {
  readonly valid: boolean;
  readonly version: 1 | 2;
  readonly conformant: boolean;
  readonly missing: readonly string[];
  readonly errors: readonly string[];
  readonly warnings: readonly string[];
  readonly fields: readonly SchemaField[];
}

/**
 * A parsed field from an EAS schema string.
 *
 * @property type - The Solidity type (e.g., 'uint256', 'string', 'bytes[]')
 * @property name - The field name
 */
export interface SchemaField {
  readonly type: string;
  readonly name: string;
}

/**
 * Options for schema validation behavior.
 *
 * @property strict - If true, throws ValidationError for non-conformant schemas (default: false)
 */
export interface SchemaValidationOptions {
  readonly strict?: boolean;
}

/**
 * Required fields for Location Protocol v0.2 conformance.
 * v0.2 schemas MUST include specVersion to self-identify.
 */
const LP_V2_REQUIRED_FIELDS = ['specVersion', 'srs', 'locationType', 'location'] as const;

/**
 * Required fields for Location Protocol v0.1 (legacy).
 * v0.1 schemas do not include specVersion.
 */
const LP_V1_REQUIRED_FIELDS = ['srs', 'locationType', 'location'] as const;

/**
 * Valid Solidity types for EAS schema fields.
 * Includes base types, sized variants, and array versions.
 */
const VALID_SOLIDITY_TYPES = new Set([
  // Unsigned integers
  'uint8',
  'uint16',
  'uint32',
  'uint64',
  'uint128',
  'uint256',
  // Signed integers
  'int8',
  'int16',
  'int32',
  'int64',
  'int128',
  'int256',
  // Other base types
  'address',
  'bool',
  'string',
  'bytes',
  // Fixed-size bytes
  'bytes1',
  'bytes2',
  'bytes4',
  'bytes8',
  'bytes16',
  'bytes32',
  // Array versions (we check for [] suffix separately)
]);

/**
 * Regex pattern for valid Solidity identifier names.
 * Must start with letter or underscore, followed by alphanumeric or underscore.
 */
const SOLIDITY_IDENTIFIER_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/;

/**
 * Parses an EAS schema string into individual fields.
 *
 * EAS schema format: "type1 name1,type2 name2,type3 name3"
 *
 * @param rawSchema - The raw EAS schema string
 * @returns Array of parsed fields, or null if parsing fails
 *
 * @example
 * ```ts
 * const fields = parseSchemaString('uint256 eventTimestamp,string srs');
 * // Returns: [{ type: 'uint256', name: 'eventTimestamp' }, { type: 'string', name: 'srs' }]
 * ```
 */
export function parseSchemaString(rawSchema: string): SchemaField[] | null {
  if (!rawSchema || typeof rawSchema !== 'string') {
    return null;
  }

  const trimmed = rawSchema.trim();
  if (trimmed.length === 0) {
    return null;
  }

  const fields: SchemaField[] = [];
  const fieldStrings = trimmed.split(',');

  for (const fieldStr of fieldStrings) {
    const parts = fieldStr.trim().split(/\s+/);
    if (parts.length !== 2) {
      return null; // Invalid field format
    }

    const [type, name] = parts;
    fields.push({ type, name });
  }

  return fields;
}

/**
 * Validates that a type string is a valid Solidity type for EAS schemas.
 *
 * @param type - The type string to validate
 * @returns True if the type is valid
 */
function isValidSolidityType(type: string): boolean {
  // Check for array suffix
  const isArray = type.endsWith('[]');
  const baseType = isArray ? type.slice(0, -2) : type;

  return VALID_SOLIDITY_TYPES.has(baseType);
}

/**
 * Validates that a name string is a valid Solidity identifier.
 *
 * @param name - The identifier to validate
 * @returns True if the name is a valid identifier
 */
function isValidIdentifier(name: string): boolean {
  return SOLIDITY_IDENTIFIER_PATTERN.test(name);
}

/**
 * Validates an EAS schema string for Location Protocol conformance.
 *
 * This function checks:
 * 1. Valid EAS schema format (comma-separated "type name" pairs)
 * 2. Valid Solidity types for each field
 * 3. Valid field names (Solidity identifiers)
 * 4. Presence of required Location Protocol fields
 * 5. Correct types for required fields
 *
 * Version detection:
 * - If `specVersion` field is present → v0.2
 * - If `specVersion` field is absent → v0.1 (legacy)
 *
 * @param rawSchema - The raw EAS schema string to validate
 * @param options - Validation options
 * @returns Detailed validation result
 *
 * @throws {ValidationError} If strict mode is enabled and schema is non-conformant
 *
 * @example
 * ```ts
 * // Validate a v0.2 conformant schema
 * const result = validateLocationProtocolSchema(
 *   'uint8 specVersion,string srs,string locationType,string location'
 * );
 * console.log(result.conformant); // true
 * console.log(result.version);    // 2
 *
 * // Validate with strict mode
 * try {
 *   validateLocationProtocolSchema(invalidSchema, { strict: true });
 * } catch (e) {
 *   console.error('Schema validation failed:', e.message);
 * }
 * ```
 */
export function validateLocationProtocolSchema(
  rawSchema: string,
  options: SchemaValidationOptions = {}
): SchemaValidationResult {
  const { strict = false } = options;

  const errors: string[] = [];
  const warnings: string[] = [];
  let fields: SchemaField[] = [];

  // Parse the schema string
  const parsedFields = parseSchemaString(rawSchema);

  if (parsedFields === null) {
    errors.push('Invalid schema format: expected comma-separated "type name" pairs');

    const result: SchemaValidationResult = {
      valid: false,
      version: 1,
      conformant: false,
      missing: [...LP_V1_REQUIRED_FIELDS],
      errors,
      warnings,
      fields: [],
    };

    if (strict) {
      throw new ValidationError(`Schema validation failed: ${errors.join('; ')}`, undefined, {
        rawSchema,
        errors,
      });
    }

    return result;
  }

  fields = parsedFields;

  // Validate each field
  for (const field of fields) {
    if (!isValidSolidityType(field.type)) {
      errors.push(`Invalid Solidity type '${field.type}' for field '${field.name}'`);
    }

    if (!isValidIdentifier(field.name)) {
      errors.push(`Invalid field name '${field.name}': must be a valid Solidity identifier`);
    }
  }

  // Check for duplicate field names
  const fieldNames = fields.map(f => f.name);
  const duplicates = fieldNames.filter((name, index) => fieldNames.indexOf(name) !== index);
  if (duplicates.length > 0) {
    errors.push(`Duplicate field names: ${[...new Set(duplicates)].join(', ')}`);
  }

  // Determine if this is a valid EAS schema (no format errors)
  const valid = errors.length === 0;

  // Detect version based on presence of specVersion field
  const hasSpecVersion = fields.some(f => f.name === 'specVersion');
  const version: 1 | 2 = hasSpecVersion ? 2 : 1;

  // Check for required fields based on detected version
  const requiredFields = version === 2 ? LP_V2_REQUIRED_FIELDS : LP_V1_REQUIRED_FIELDS;
  const missing: string[] = [];

  for (const required of requiredFields) {
    const field = fields.find(f => f.name === required);
    if (!field) {
      missing.push(required);
    } else {
      // Validate expected types for required fields
      if (required === 'specVersion' && field.type !== 'uint8') {
        warnings.push(`Field 'specVersion' should be uint8, found '${field.type}'`);
      }
      if (['srs', 'locationType', 'location'].includes(required) && field.type !== 'string') {
        warnings.push(`Field '${required}' should be string, found '${field.type}'`);
      }
    }
  }

  // Schema is conformant if valid AND has all required fields
  const conformant = valid && missing.length === 0;

  // Add version-specific warnings
  if (version === 1 && valid) {
    warnings.push(
      'Schema is v0.1 (legacy): missing specVersion field. Consider upgrading to v0.2 for self-identifying schemas.'
    );
  }

  const result: SchemaValidationResult = {
    valid,
    version,
    conformant,
    missing,
    errors,
    warnings,
    fields,
  };

  if (strict && !conformant) {
    const message =
      errors.length > 0
        ? `Schema validation failed: ${errors.join('; ')}`
        : `Schema is not Location Protocol conformant: missing fields [${missing.join(', ')}]`;

    throw new ValidationError(message, undefined, {
      rawSchema,
      version,
      missing,
      errors,
    });
  }

  return result;
}

/**
 * Checks if a schema string represents a v0.2 Location Protocol schema.
 *
 * This is a convenience function that checks for the presence of specVersion.
 *
 * @param rawSchema - The raw EAS schema string
 * @returns True if the schema includes specVersion (v0.2)
 *
 * @example
 * ```ts
 * if (isLocationProtocolV2(schemaString)) {
 *   console.log('This is a v0.2 schema');
 * }
 * ```
 */
export function isLocationProtocolV2(rawSchema: string): boolean {
  const fields = parseSchemaString(rawSchema);
  if (!fields) return false;
  return fields.some(f => f.name === 'specVersion');
}

/**
 * Extracts field names from an EAS schema string.
 *
 * @param rawSchema - The raw EAS schema string
 * @returns Array of field names, or empty array if parsing fails
 *
 * @example
 * ```ts
 * const names = getSchemaFieldNames('uint256 a,string b');
 * // Returns: ['a', 'b']
 * ```
 */
export function getSchemaFieldNames(rawSchema: string): string[] {
  const fields = parseSchemaString(rawSchema);
  if (!fields) return [];
  return fields.map(f => f.name);
}
