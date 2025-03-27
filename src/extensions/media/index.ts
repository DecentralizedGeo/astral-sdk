/**
 * Media Extensions Module
 *
 * This module exports media type handlers that manage validation, conversion,
 * and formatting of various media types for use with Astral SDK.
 *
 * @module extensions/media
 */

import * as imageExt from './builtins/image';
import * as videoExt from './builtins/video';
import * as audioExt from './builtins/audio';
import * as applicationExt from './builtins/application';

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

// Re-export all extensions
export { imageExt, videoExt, audioExt, applicationExt };
