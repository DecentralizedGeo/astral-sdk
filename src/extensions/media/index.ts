/**
 * Media Extensions Module
 *
 * This module exports media type handlers that manage validation, conversion,
 * and formatting of various media types for use with Astral SDK.
 *
 * @module extensions/media
 */

import { MediaAttachmentExtension } from '../types';
import { MediaValidationError } from '../../core/errors';

// Import media extensions
import { imageExtension } from './builtins/image';
import { videoExtension } from './builtins/video';
import { audioExtension } from './builtins/audio';
import { applicationExtension } from './builtins/application';

/**
 * All built-in media extensions
 */
export const builtInMediaExtensions: MediaAttachmentExtension[] = [
  imageExtension,
  videoExtension,
  audioExtension,
  applicationExtension,
];

/**
 * Gets a media extension for a specific MIME type
 *
 * @param mimeType - The MIME type to get an extension for
 * @param extensions - List of extensions to check (defaults to built-in extensions)
 * @returns The media extension or undefined if not found
 */
export function getMediaExtension(
  mimeType: string,
  extensions: MediaAttachmentExtension[] = builtInMediaExtensions
): MediaAttachmentExtension | undefined {
  return extensions.find(ext => ext.supportsMediaType(mimeType));
}

/**
 * Validates media data using the appropriate extension
 *
 * @param mimeType - The MIME type of the media
 * @param data - The media data to validate
 * @param extensions - List of extensions to use (defaults to built-in extensions)
 * @returns True if the media data is valid
 * @throws MediaValidationError if no extension is found for the MIME type
 */
export function validateMediaData(
  mimeType: string,
  data: string,
  extensions: MediaAttachmentExtension[] = builtInMediaExtensions
): boolean {
  const extension = getMediaExtension(mimeType, extensions);

  if (!extension) {
    throw new MediaValidationError(`No extension found for media type: ${mimeType}`, undefined, {
      mimeType,
      availableExtensions: extensions.map(ext => ext.supportedMediaTypes).flat(),
    });
  }

  return extension.validateMedia(mimeType, data);
}

/**
 * Checks if the provided MIME type is supported by any registered extension
 *
 * @param mimeType - MIME type to check
 * @param extensions - List of extensions to check (defaults to built-in extensions)
 * @returns Whether the MIME type is supported
 */
export function isSupportedMimeType(
  mimeType: string,
  extensions: MediaAttachmentExtension[] = builtInMediaExtensions
): boolean {
  return extensions.some(ext => ext.supportsMediaType(mimeType));
}

// Export extension instances
export { imageExtension, videoExtension, audioExtension, applicationExtension };
