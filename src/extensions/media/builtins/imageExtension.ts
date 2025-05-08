/**
 * Image Media Extension
 *
 * Provides support for image types in location proofs.
 * This extension handles common image formats:
 * - image/jpeg
 * - image/png
 * 
 * Image validation includes checking the MIME type and, when possible,
 * validating the data structure.
 */

import { BaseExtension, MediaAttachmentExtension } from '../../types';
import { MediaValidationError } from '../../../core/errors';

// Supported image MIME types
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png'];

/**
 * Checks if the provided data is a valid base64 string
 * 
 * @param data - The string to check
 * @returns True if the string is valid base64
 */
export function isValidBase64(data: string): boolean {
  if (typeof data !== 'string') return false;
  if (data.length === 0) return false;
  
  // Remove data URL prefix if present
  let base64Data = data;
  if (data.startsWith('data:')) {
    const commaIndex = data.indexOf(',');
    if (commaIndex === -1 || commaIndex === data.length - 1) return false;
    base64Data = data.substring(commaIndex + 1);
  }
  
  // Check if it's a valid base64 pattern and has at least some content
  try {
    return base64Data.length > 0 && /^[A-Za-z0-9+/]*={0,2}$/.test(base64Data);
  } catch (error) {
    return false;
  }
}

/**
 * Checks the beginning of image data for expected file signatures
 * This is a basic validation approach without using external libraries
 * 
 * @param mimeType - The image MIME type
 * @param data - The base64-encoded image data
 * @returns True if the data appears to have the correct format
 */
export function hasValidImageSignature(mimeType: string, data: string): boolean {
  try {
    // Extract the actual base64 data if it's a data URL
    let base64Data = data;
    if (data.startsWith('data:')) {
      const commaIndex = data.indexOf(',');
      if (commaIndex === -1) return false;
      base64Data = data.substring(commaIndex + 1);
    }
    
    // Decode the first few bytes of the base64 data
    const binaryData = atob(base64Data).slice(0, 12);
    const bytes = new Uint8Array(binaryData.length);
    for (let i = 0; i < binaryData.length; i++) {
      bytes[i] = binaryData.charCodeAt(i);
    }
    
    // Check for JPEG signature (starts with 0xFF 0xD8 0xFF)
    if (mimeType === 'image/jpeg' && 
        bytes[0] === 0xFF && 
        bytes[1] === 0xD8 && 
        bytes[2] === 0xFF) {
      return true;
    }
    
    // Check for PNG signature (starts with 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A)
    if (mimeType === 'image/png' && 
        bytes[0] === 0x89 && 
        bytes[1] === 0x50 && 
        bytes[2] === 0x4E && 
        bytes[3] === 0x47 && 
        bytes[4] === 0x0D && 
        bytes[5] === 0x0A && 
        bytes[6] === 0x1A && 
        bytes[7] === 0x0A) {
      return true;
    }
    
    return false;
  } catch (error) {
    return false;
  }
}

/**
 * Adds data URL prefix if it's not already present
 * 
 * @param mimeType - The MIME type for the data
 * @param data - The base64-encoded data
 * @returns Base64 data with appropriate data URL prefix
 */
export function ensureDataUrl(mimeType: string, data: string): string {
  if (data.startsWith('data:')) {
    return data;
  }
  
  return `data:${mimeType};base64,${data}`;
}

/**
 * Strips the data URL prefix if present
 * 
 * @param data - The data string, potentially with a data URL prefix
 * @returns The data string without prefix
 */
export function stripDataUrlPrefix(data: string): string {
  if (data.startsWith('data:')) {
    const commaIndex = data.indexOf(',');
    if (commaIndex !== -1) {
      return data.substring(commaIndex + 1);
    }
  }
  
  return data;
}

/**
 * ImageExtension implements the MediaAttachmentExtension interface for image data.
 * 
 * This extension handles common image formats including JPEG and PNG.
 * It includes validation for MIME types and basic data structure checking.
 */
export class ImageExtension extends BaseExtension implements MediaAttachmentExtension {
  readonly id = 'astral:media:image';
  readonly name = 'Image Media Type';
  readonly description = 'Handles common image formats (JPEG, PNG)';
  readonly supportedMediaTypes = SUPPORTED_IMAGE_TYPES;
  
  /**
   * Validates that the extension is properly configured.
   * 
   * @returns True if the extension is valid
   */
  validate(): boolean {
    return true;
  }
  
  /**
   * Validates media data for supported image types.
   * 
   * Validation includes:
   * - Checking if the MIME type is supported
   * - Validating base64 encoding
   * - Checking image file signatures
   * 
   * @param mediaType - MIME type of the media
   * @param data - Media data to validate (base64-encoded)
   * @returns True if the media data is valid
   */
  validateMedia(mediaType: string, data: string): boolean {
    // Check if the MIME type is supported
    if (!this.supportsMediaType(mediaType)) {
      return false;
    }
    
    // Check if the data is valid base64
    if (!isValidBase64(data)) {
      return false;
    }
    
    // Check image file signature
    return hasValidImageSignature(mediaType, data);
  }
  
  /**
   * Processes image data before storing it.
   * 
   * For images, we ensure proper data URL formatting but preserve the original data.
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
    
    // Ensure data has the appropriate data URL prefix
    return ensureDataUrl(mediaType, data);
  }
  
  /**
   * Checks if this extension supports a given media type.
   * 
   * @param mediaType - MIME type to check
   * @returns True if the media type is supported
   */
  supportsMediaType(mediaType: string): boolean {
    return SUPPORTED_IMAGE_TYPES.includes(mediaType);
  }
}

/**
 * Create and export a singleton instance of the Image extension
 */
export const imageExtension = new ImageExtension();