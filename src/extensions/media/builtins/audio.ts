/**
 * Audio Media Extension
 * 
 * Handles audio MIME types including:
 * - audio/mpeg (MP3)
 * - audio/wav
 * - audio/ogg
 * - audio/aac
 * 
 * @module extensions/media/builtins/audio
 */

/**
 * Validates an audio file based on its MIME type and data
 * @param mimeType The specific audio MIME type
 * @param data The audio data (typically base64-encoded)
 * @returns Whether the audio is valid
 */
export function validateAudio(mimeType: string, data: string): boolean {
  // Placeholder for actual validation logic
  return true;
}

/**
 * Formats audio data for storage and transmission
 * @param mimeType The specific audio MIME type
 * @param data The audio data
 * @returns Formatted audio data
 * @note WE WANT TO STORE THE AUDIO DATA EXACTLY AS PROVIDED BY THE USER
 * @note SO I'M NOT SURE THIS FUNCTION IS APPROPRIATE
 * @note HOWEVER, we also want to use the audio in the UI, so 
 * @note reformatting may be necessary for internal use
 */
export function formatAudio(mimeType: string, data: string): string {
  // Placeholder for formatting logic
  return data;
}

/**
 * Checks if the provided MIME type is a supported audio type
 * @param mimeType MIME type to check
 * @returns Whether the MIME type is supported
 */
export function isSupportedAudioType(mimeType: string): boolean {
  const supportedTypes = [ // NOTE: This may be too much, 
              // if it is difficult to handle all of these types
              // we can remove some less common ones
    'audio/mpeg', // MP3 format
    'audio/wav',
    'audio/ogg',
    'audio/aac'
  ];
  
  return supportedTypes.includes(mimeType);
}