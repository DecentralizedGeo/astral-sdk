/**
 * Audio Media Extension
 *
 * Handles audio MIME types including:
 * - audio/mpeg (MP3)
 * - audio/wav
 * - audio/ogg
 * - audio/aac
 *
 * @module extensions/media/builtins/Audio
 */

import { BaseExtension, MediaAttachmentExtension } from '../../types';
import { MediaValidationError } from '../../../core/errors';

// Supported audio MIME types
const SUPPORTED_AUDIO_TYPES = [
  'audio/mpeg', // MP3 format
  'audio/wav',
  'audio/ogg',
  'audio/aac',
];

/**
 * AudioExtension implements the MediaAttachmentExtension interface for audio data.
 *
 * This is a placeholder implementation for the Audio extension that will be expanded
 * in future releases. Currently it provides basic MIME type validation.
 */
export class AudioExtension extends BaseExtension implements MediaAttachmentExtension {
  readonly id = 'astral:media:audio';
  readonly name = 'Audio Media Type';
  readonly description = 'Handles common audio formats (MP3, WAV, OGG, AAC)';
  readonly supportedMediaTypes = SUPPORTED_AUDIO_TYPES;

  /**
   * Validates that the extension is properly configured.
   *
   * @returns True if the extension is valid
   */
  validate(): boolean {
    return true;
  }

  /**
   * Validates media data for supported audio types.
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
   * Processes audio data before storing it.
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
    return SUPPORTED_AUDIO_TYPES.includes(mediaType);
  }
}

/**
 * Create and export a singleton instance of the Audio extension
 */
export const audioExtension = new AudioExtension();
