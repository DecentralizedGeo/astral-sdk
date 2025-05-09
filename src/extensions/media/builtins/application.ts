/**
 * Application Media Extension
 *
 * Handles application MIME types including:
 * - application/pdf
 *
 * @module extensions/media/builtins/Application
 */

import { BaseExtension, MediaAttachmentExtension } from '../../types';
import { MediaValidationError } from '../../../core/errors';

// Supported application MIME types
const SUPPORTED_APPLICATION_TYPES = [
  'application/pdf',
  // More types can be added in future versions
];

/**
 * ApplicationExtension implements the MediaAttachmentExtension interface for application data.
 *
 * This is a placeholder implementation for the Application extension that will be expanded
 * in future releases. Currently it provides basic MIME type validation.
 */
export class ApplicationExtension extends BaseExtension implements MediaAttachmentExtension {
  readonly id = 'astral:media:application';
  readonly name = 'Application Media Type';
  readonly description = 'Handles common application formats (PDF)';
  readonly supportedMediaTypes = SUPPORTED_APPLICATION_TYPES;

  /**
   * Validates that the extension is properly configured.
   *
   * @returns True if the extension is valid
   */
  validate(): boolean {
    return true;
  }

  /**
   * Validates media data for supported application types.
   *
   * @param mediaType - MIME type of the media
   * @param data - Media data to validate (base64-encoded)
   * @returns True if the media data is valid
   */
  validateMedia(mediaType: string, data: string): boolean {
    // Currently only validates the MIME type
    // Future implementations will include file signature checks
    return this.supportsMediaType(mediaType) && typeof data === 'string' && data.length > 0;
  }

  /**
   * Processes application data before storing it.
   *
   * @param mediaType - MIME type of the media
   * @param data - Media data to process
   * @returns Processed media data
   * @throws MediaValidationError if the data is invalid
   */
  processMedia(mediaType: string, data: string): string {
    if (!this.validateMedia(mediaType, data)) {
      throw new MediaValidationError(`Invalid ${mediaType} data`, undefined, {
        mediaType,
      });
    }

    // Currently returns the data as-is
    // Future implementations may include more robust processing
    return data;
  }

  /**
   * Checks if this extension supports a given media type.
   *
   * @param mediaType - MIME type to check
   * @returns True if the media type is supported
   */
  supportsMediaType(mediaType: string): boolean {
    return SUPPORTED_APPLICATION_TYPES.includes(mediaType);
  }
}

/**
 * Create and export a singleton instance of the Application extension
 */
export const applicationExtension = new ApplicationExtension();
