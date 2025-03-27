/**
 * Video Media Extension
 *
 * Handles video MIME types including:
 * - video/mp4
 * - video/quicktime (MOV)
 *
 * @module extensions/media/builtins/video
 */

/**
 * Validates a video based on its MIME type and data
 * @param mimeType The specific video MIME type
 * @param data The video data (typically base64-encoded)
 * @returns Whether the video is valid
 */
export function validateVideo(_mimeType: string, _data: string): boolean {
  // Placeholder for actual validation logic
  return true;
}

/**
 * Formats video data for storage and transmission
 * @param mimeType The specific video MIME type
 * @param data The video data
 * @returns Formatted video data
 * @note WE WANT TO STORE THE VIDEO DATA EXACTLY AS PROVIDED BY THE USER
 * @note SO I'M NOT SURE THIS FUNCTION IS APPROPRIATE
 * @note HOWEVER, we also want to visualize the video in the UI, so
 * @note reformatting may be necessary for internal use
 */
export function formatVideo(mimeType: string, data: string): string {
  // Placeholder for formatting logic
  return data;
}

/**
 * Checks if the provided MIME type is a supported video type
 * @param mimeType MIME type to check
 * @returns Whether the MIME type is supported
 */
export function isSupportedVideoType(mimeType: string): boolean {
  const supportedTypes = [
    'video/mp4',
    'video/quicktime', // MOV format
  ];

  return supportedTypes.includes(mimeType);
}
