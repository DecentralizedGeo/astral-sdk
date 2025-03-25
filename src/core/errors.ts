/**
 * Error hierarchy for Astral SDK
 *
 * This file defines a comprehensive hierarchy of error classes for the Astral SDK,
 * with clear separation between workflow-specific errors and shared error types.
 */

/**
 * Base error class for all Astral SDK errors.
 *
 * Provides common functionality for error context, error codes, and error chaining.
 *
 * @property code - String code for programmatic error handling
 * @property cause - Original error that caused this error (for error chaining)
 * @property context - Additional context information about the error
 */
export class AstralError extends Error {
  public code: string;
  public cause?: Error;
  public context?: Record<string, unknown>;

  /**
   * Creates a new AstralError instance.
   *
   * @param message - Human-readable error message
   * @param code - Error code
   * @param cause - Original error that caused this error
   * @param context - Additional context information
   */
  constructor(
    message: string,
    code = 'ASTRAL_ERROR',
    cause?: Error,
    context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AstralError';
    this.code = code;
    this.cause = cause;
    this.context = context;
  }

  /**
   * Creates a standardized error message with context.
   *
   * @param baseMessage - The base error message
   * @param context - Additional context information
   * @returns A formatted error message including context
   */
  public static formatMessage(baseMessage: string, context?: Record<string, unknown>): string {
    if (!context || Object.keys(context).length === 0) {
      return baseMessage;
    }

    const contextStr = Object.entries(context)
      .map(([key, value]) => `${key}=${JSON.stringify(value)}`)
      .join(', ');

    return `${baseMessage} (${contextStr})`;
  }
}

/**
 * Base class for validation errors.
 *
 * Used when input to the SDK fails validation checks.
 */
export class ValidationError extends AstralError {
  constructor(message: string, cause?: Error, context?: Record<string, unknown>) {
    super(message, 'VALIDATION_ERROR', cause, context);
    this.name = 'ValidationError';
  }

  /**
   * Creates a ValidationError for a specific field.
   *
   * @param fieldName - The name of the field that failed validation
   * @param message - The validation error message
   * @param cause - Original error that caused this error
   * @returns A new ValidationError instance
   */
  public static forField(fieldName: string, message: string, cause?: Error): ValidationError {
    return new ValidationError(`Validation error for '${fieldName}': ${message}`, cause, {
      fieldName,
    });
  }
}

/**
 * Error for location data validation issues.
 *
 * Used when location data (coordinates, GeoJSON, etc.) is invalid.
 */
export class LocationValidationError extends ValidationError {
  constructor(message: string, cause?: Error, context?: Record<string, unknown>) {
    super(message, cause, context);
    this.code = 'LOCATION_VALIDATION_ERROR';
    this.name = 'LocationValidationError';
  }
}

/**
 * Error for media data validation issues.
 *
 * Used when media attachments (images, videos, etc.) are invalid.
 */
export class MediaValidationError extends ValidationError {
  constructor(message: string, cause?: Error, context?: Record<string, unknown>) {
    super(message, cause, context);
    this.code = 'MEDIA_VALIDATION_ERROR';
    this.name = 'MediaValidationError';
  }
}

/**
 * Error for recipe data validation issues.
 *
 * Used when recipe data (placeholder for v0.1) is invalid.
 */
export class RecipeValidationError extends ValidationError {
  constructor(message: string, cause?: Error, context?: Record<string, unknown>) {
    super(message, cause, context);
    this.code = 'RECIPE_VALIDATION_ERROR';
    this.name = 'RecipeValidationError';
  }
}

/**
 * Base class for signer-related errors.
 *
 * Used for issues with signatures, signers, or cryptographic operations.
 */
export class SignerError extends AstralError {
  constructor(message: string, cause?: Error, context?: Record<string, unknown>) {
    super(message, 'SIGNER_ERROR', cause, context);
    this.name = 'SignerError';
  }
}

/**
 * Error for when no suitable signer is found.
 *
 * Used when attempting to sign a proof without a configured signer.
 */
export class SignerNotFoundError extends SignerError {
  constructor(
    message = 'No suitable signer found',
    cause?: Error,
    context?: Record<string, unknown>
  ) {
    super(message, cause, context);
    this.code = 'SIGNER_NOT_FOUND';
    this.name = 'SignerNotFoundError';
  }
}

/**
 * Error for signature creation or verification failures.
 *
 * Used when creating or verifying EIP-712 signatures fails.
 */
export class SigningError extends SignerError {
  constructor(message: string, cause?: Error, context?: Record<string, unknown>) {
    super(message, cause, context);
    this.code = 'SIGNING_ERROR';
    this.name = 'SigningError';
  }
}

/**
 * Base class for storage-related errors.
 *
 * Used for issues with storing or retrieving location proofs.
 */
export class StorageError extends AstralError {
  constructor(message: string, cause?: Error, context?: Record<string, unknown>) {
    super(message, 'STORAGE_ERROR', cause, context);
    this.name = 'StorageError';
  }
}

/**
 * Error for off-chain publishing failures.
 *
 * Used when publishing to IPFS or other storage fails.
 * This error belongs to the offchain workflow.
 */
export class PublishError extends StorageError {
  constructor(message: string, cause?: Error, context?: Record<string, unknown>) {
    super(message, cause, context);
    this.code = 'PUBLISH_ERROR';
    this.name = 'PublishError';
  }
}

/**
 * Error for on-chain registration failures.
 *
 * Used when registering on a blockchain via EAS contract fails.
 * This error belongs to the onchain workflow.
 */
export class RegistrationError extends StorageError {
  constructor(message: string, cause?: Error, context?: Record<string, unknown>) {
    super(message, cause, context);
    this.code = 'REGISTRATION_ERROR';
    this.name = 'RegistrationError';
  }
}

/**
 * Base class for network-related errors.
 *
 * Used for issues with network connections or API calls.
 */
export class NetworkError extends AstralError {
  constructor(message: string, cause?: Error, context?: Record<string, unknown>) {
    super(message, 'NETWORK_ERROR', cause, context);
    this.name = 'NetworkError';
  }
}

/**
 * Error for blockchain connection failures.
 *
 * Used when connecting to a blockchain provider fails.
 * This error is most commonly encountered in the onchain workflow.
 */
export class ChainConnectionError extends NetworkError {
  constructor(message: string, cause?: Error, context?: Record<string, unknown>) {
    super(message, cause, context);
    this.code = 'CHAIN_CONNECTION_ERROR';
    this.name = 'ChainConnectionError';
  }
}

/**
 * Error for Astral API communication failures.
 *
 * Used when interacting with the Astral API fails.
 *
 * @property status - HTTP status code from the API response
 */
export class AstralAPIError extends NetworkError {
  public status?: number;

  constructor(message: string, status?: number, cause?: Error, context?: Record<string, unknown>) {
    super(message, cause, context);
    this.code = 'API_ERROR';
    this.name = 'AstralAPIError';
    this.status = status;
  }

  /**
   * Creates an AstralAPIError from an HTTP response.
   *
   * @param status - HTTP status code
   * @param statusText - HTTP status text
   * @param body - Optional response body
   * @returns A new AstralAPIError instance
   */
  public static fromResponse(status: number, statusText: string, body?: unknown): AstralAPIError {
    return new AstralAPIError(
      `API request failed: ${status} ${statusText}`,
      status,
      undefined,
      body ? { body } : undefined
    );
  }
}

/**
 * Error for transaction-related failures.
 *
 * Used when blockchain transactions fail.
 * This error belongs to the onchain workflow.
 */
export class TransactionError extends NetworkError {
  constructor(message: string, cause?: Error, context?: Record<string, unknown>) {
    super(message, cause, context);
    this.code = 'TRANSACTION_ERROR';
    this.name = 'TransactionError';
  }
}

/**
 * Error for extension-related failures.
 *
 * Used when extensions (location, media, recipe) encounter issues.
 */
export class ExtensionError extends AstralError {
  constructor(message: string, cause?: Error, context?: Record<string, unknown>) {
    super(message, 'EXTENSION_ERROR', cause, context);
    this.name = 'ExtensionError';
  }

  /**
   * Creates an ExtensionError for a specific extension.
   *
   * @param extensionName - The name of the extension
   * @param message - The error message
   * @param cause - Original error that caused this error
   * @returns A new ExtensionError instance
   */
  public static forExtension(
    extensionName: string,
    message: string,
    cause?: Error
  ): ExtensionError {
    return new ExtensionError(`Extension '${extensionName}' error: ${message}`, cause, {
      extensionName,
    });
  }
}

/**
 * Error for when a resource is not found.
 *
 * Used when a requested location proof or other resource doesn't exist.
 */
export class NotFoundError extends AstralError {
  constructor(message = 'Resource not found', cause?: Error, context?: Record<string, unknown>) {
    super(message, 'NOT_FOUND', cause, context);
    this.name = 'NotFoundError';
  }

  /**
   * Creates a NotFoundError for a specific resource.
   *
   * @param resourceType - The type of resource (e.g., 'LocationProof')
   * @param identifier - The identifier of the resource (e.g., UID)
   * @returns A new NotFoundError instance
   */
  public static forResource(resourceType: string, identifier: string): NotFoundError {
    return new NotFoundError(`${resourceType} not found: ${identifier}`, undefined, {
      resourceType,
      identifier,
    });
  }
}

/**
 * Error for proof verification failures.
 *
 * Used when verifying a location proof fails.
 */
export class VerificationError extends AstralError {
  constructor(message: string, cause?: Error, context?: Record<string, unknown>) {
    super(message, 'VERIFICATION_ERROR', cause, context);
    this.name = 'VerificationError';
  }

  /**
   * Creates a VerificationError with a specific reason.
   *
   * @param reason - The reason verification failed
   * @param proofId - The ID of the proof being verified
   * @returns A new VerificationError instance
   */
  public static withReason(reason: string, proofId?: string): VerificationError {
    return new VerificationError(`Verification failed: ${reason}`, undefined, {
      reason,
      ...(proofId ? { proofId } : {}),
    });
  }
}
