// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

/**
 * Video Media Extension
 *
 * Handles video MIME types including:
 * - video/mp4
 * - video/quicktime (MOV)
 *
 * @module extensions/media/builtins/Video
 */

import { BaseExtension, MediaAttachmentExtension } from '../../types';
import { MediaValidationError } from '../../../core/errors';

// Supported video MIME types
const SUPPORTED_VIDEO_TYPES = [
  'video/mp4',
  'video/quicktime', // MOV format
];

/**
 * VideoExtension implements the MediaAttachmentExtension interface for video data.
 *
 * This is a placeholder implementation for the Video extension that will be expanded
 * in future releases. Currently it provides basic MIME type validation.
 */
export class VideoExtension extends BaseExtension implements MediaAttachmentExtension {
  readonly id = 'astral:media:video';
  readonly name = 'Video Media Type';
  readonly description = 'Handles common video formats (MP4, MOV)';
  readonly supportedMediaTypes = SUPPORTED_VIDEO_TYPES;

  /**
   * Validates that the extension is properly configured.
   *
   * @returns True if the extension is valid
   */
  validate(): boolean {
    return true;
  }

  /**
   * Validates media data for supported video types.
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
   * Processes video data before storing it.
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
    return SUPPORTED_VIDEO_TYPES.includes(mediaType);
  }
}

/**
 * Create and export a singleton instance of the Video extension
 */
export const videoExtension = new VideoExtension();
