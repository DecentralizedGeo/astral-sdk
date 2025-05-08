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

// Legacy media utility functions
import * as imageExt from './builtins/image';
import * as videoExt from './builtins/video';
import * as audioExt from './builtins/audio';
import * as applicationExt from './builtins/application';

// Media extensions
import { imageExtension } from './builtins/imageExtension';

/**
 * Validates media data based on its MIME type
 * @param mimeType The MIME type of the media
 * @param data The media data (typically base64-encoded)
 * @returns Whether the media is valid
 */
export function validateMedia(mimeType: string, data: string): boolean {
  // Route to the appropriate handler based on MIME type category
  const category = mimeType.split('/')[0];

  switch (category) {
    case 'image':
      return imageExt.validateImage(mimeType, data);
    case 'video':
      return videoExt.validateVideo(mimeType, data);
    case 'audio':
      return audioExt.validateAudio(mimeType, data);
    case 'application':
      return applicationExt.validateApplication(mimeType, data);
    default:
      return false;
  }
}

/**
 * Checks if the provided MIME type is supported
 * @param mimeType MIME type to check
 * @returns Whether the MIME type is supported
 */
export function isSupportedMimeType(mimeType: string): boolean {
  const category = mimeType.split('/')[0];

  switch (category) {
    case 'image':
      return imageExt.isSupportedImageType(mimeType);
    case 'video':
      return videoExt.isSupportedVideoType(mimeType);
    case 'audio':
      return audioExt.isSupportedAudioType(mimeType);
    case 'application':
      return applicationExt.isSupportedApplicationType(mimeType);
    default:
      return false;
  }
}

/**
 * All built-in media extensions
 */
export const builtInMediaExtensions: MediaAttachmentExtension[] = [
  imageExtension,
  // Additional built-in extensions will be added here as they are implemented
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
      availableExtensions: extensions.map(ext => ext.supportedMediaTypes).flat()
    });
  }
  
  return extension.validateMedia(mimeType, data);
}

// Export all extensions and extension instances
export { 
  imageExt, videoExt, audioExt, applicationExt,  // Legacy utilities
  imageExtension  // Extension instances
};
