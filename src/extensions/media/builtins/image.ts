/**
 * Image Media Extension
 *
 * Handles image MIME types including:
 * - image/jpeg
 * - image/png
 * - image/gif
 * - image/tiff
 *
 * @module extensions/media/builtins/image
 */

/**
 * Validates an image based on its MIME type and data
 * @param mimeType The specific image MIME type
 * @param data The image data (typically base64-encoded)
 * @returns Whether the image is valid
 */
export function validateImage(_mimeType: string, _data: string): boolean {
  // Placeholder for actual validation logic
  return true;
}

/**
 * Formats image data for storage and transmission
 * @param mimeType The specific image MIME type
 * @param data The image data
 * @returns Formatted image data
 * @note WE WANT TO STORE THE IMAGE DATA EXACTLY AS PROVIDED BY THE USER
 * @note SO I'M NOT SURE THIS FUNCTION IS APPROPRIATE
 * @note HOWEVER, we also want to visualize the image in the UI, so
 * @note reformatting may be necessary for internal use
 */
export function formatImage(mimeType: string, data: string): string {
  // Placeholder for formatting logic
  return data;
}

/**
 * Checks if the provided MIME type is a supported image type
 * @param mimeType MIME type to check
 * @returns Whether the MIME type is supported
 */
export function isSupportedImageType(mimeType: string): boolean {
  const supportedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/tiff'];

  return supportedTypes.includes(mimeType);
}
