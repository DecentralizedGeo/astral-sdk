/**
 * Tests for the Image Media Extension.
 *
 * These tests verify that the ImageExtension properly handles
 * image media types and validation as specified in the requirements.
 */

import {
  ImageExtension,
  isValidBase64,
  hasValidImageSignature,
  ensureDataUrl,
  stripDataUrlPrefix
} from '../../../src/extensions/media/builtins/imageExtension';
import { getMediaExtension, validateMediaData } from '../../../src/extensions/media';
import { MediaValidationError } from '../../../src/core/errors';

// Sample base64 encoded image data (tiny 1x1 pixel images)
const validJpegBase64 = '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q==';
const validPngBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const invalidBase64 = 'this-is-not-base64!';
const validJpegDataUrl = `data:image/jpeg;base64,${validJpegBase64}`;
const validPngDataUrl = `data:image/png;base64,${validPngBase64}`;

describe('Image Extension Utilities', () => {
  test('isValidBase64 should validate base64 strings', () => {
    // Valid base64 strings
    expect(isValidBase64(validJpegBase64)).toBe(true);
    expect(isValidBase64(validPngBase64)).toBe(true);
    expect(isValidBase64(validJpegDataUrl)).toBe(true);
    expect(isValidBase64(validPngDataUrl)).toBe(true);
    
    // Invalid base64 strings
    expect(isValidBase64(invalidBase64)).toBe(false);
    expect(isValidBase64('data:image/jpeg;base64,')).toBe(false);
    expect(isValidBase64('')).toBe(false);
    expect(isValidBase64(null as unknown as string)).toBe(false);
  });
  
  test('hasValidImageSignature should detect image signatures', () => {
    // Valid signatures
    expect(hasValidImageSignature('image/jpeg', validJpegBase64)).toBe(true);
    expect(hasValidImageSignature('image/jpeg', validJpegDataUrl)).toBe(true);
    expect(hasValidImageSignature('image/png', validPngBase64)).toBe(true);
    expect(hasValidImageSignature('image/png', validPngDataUrl)).toBe(true);
    
    // Invalid signatures
    expect(hasValidImageSignature('image/jpeg', validPngBase64)).toBe(false);
    expect(hasValidImageSignature('image/png', validJpegBase64)).toBe(false);
    expect(hasValidImageSignature('image/jpeg', invalidBase64)).toBe(false);
    expect(hasValidImageSignature('image/gif', validJpegBase64)).toBe(false);
  });
  
  test('ensureDataUrl should add data URL prefixes if needed', () => {
    // Should add prefix if not present
    expect(ensureDataUrl('image/jpeg', validJpegBase64)).toBe(validJpegDataUrl);
    expect(ensureDataUrl('image/png', validPngBase64)).toBe(validPngDataUrl);
    
    // Should not modify if prefix already present
    expect(ensureDataUrl('image/jpeg', validJpegDataUrl)).toBe(validJpegDataUrl);
    expect(ensureDataUrl('image/png', validPngDataUrl)).toBe(validPngDataUrl);
  });
  
  test('stripDataUrlPrefix should remove data URL prefixes', () => {
    // Should remove prefix if present
    expect(stripDataUrlPrefix(validJpegDataUrl)).toBe(validJpegBase64);
    expect(stripDataUrlPrefix(validPngDataUrl)).toBe(validPngBase64);
    
    // Should not modify if no prefix present
    expect(stripDataUrlPrefix(validJpegBase64)).toBe(validJpegBase64);
    expect(stripDataUrlPrefix(invalidBase64)).toBe(invalidBase64);
  });
});

describe('ImageExtension', () => {
  let extension: ImageExtension;
  
  beforeEach(() => {
    extension = new ImageExtension();
  });
  
  test('should have correct metadata', () => {
    expect(extension.id).toBe('astral:media:image');
    expect(extension.name).toBe('Image Media Type');
    expect(extension.supportedMediaTypes).toContain('image/jpeg');
    expect(extension.supportedMediaTypes).toContain('image/png');
    expect(extension.validate()).toBe(true);
  });
  
  test('supportsMediaType should identify supported types', () => {
    expect(extension.supportsMediaType('image/jpeg')).toBe(true);
    expect(extension.supportsMediaType('image/png')).toBe(true);
    
    expect(extension.supportsMediaType('image/gif')).toBe(false);
    expect(extension.supportsMediaType('image/tiff')).toBe(false);
    expect(extension.supportsMediaType('video/mp4')).toBe(false);
    expect(extension.supportsMediaType('application/pdf')).toBe(false);
  });
  
  test('validateMedia should correctly validate image data', () => {
    // Valid images
    expect(extension.validateMedia('image/jpeg', validJpegBase64)).toBe(true);
    expect(extension.validateMedia('image/jpeg', validJpegDataUrl)).toBe(true);
    expect(extension.validateMedia('image/png', validPngBase64)).toBe(true);
    expect(extension.validateMedia('image/png', validPngDataUrl)).toBe(true);
    
    // Invalid images
    expect(extension.validateMedia('image/jpeg', validPngBase64)).toBe(false);
    expect(extension.validateMedia('image/png', validJpegBase64)).toBe(false);
    expect(extension.validateMedia('image/jpeg', invalidBase64)).toBe(false);
    expect(extension.validateMedia('image/gif', validJpegBase64)).toBe(false);
    expect(extension.validateMedia('video/mp4', validJpegBase64)).toBe(false);
  });
  
  test('processMedia should process valid images', () => {
    // Should process valid images and return with data URL prefix
    expect(extension.processMedia('image/jpeg', validJpegBase64)).toBe(validJpegDataUrl);
    expect(extension.processMedia('image/png', validPngBase64)).toBe(validPngDataUrl);
    
    // Should not modify images that already have data URL prefix
    expect(extension.processMedia('image/jpeg', validJpegDataUrl)).toBe(validJpegDataUrl);
    expect(extension.processMedia('image/png', validPngDataUrl)).toBe(validPngDataUrl);
    
    // Should throw for invalid images
    expect(() => extension.processMedia('image/jpeg', invalidBase64)).toThrow(MediaValidationError);
    expect(() => extension.processMedia('image/png', validJpegBase64)).toThrow(MediaValidationError);
    expect(() => extension.processMedia('image/gif', validJpegBase64)).toThrow(MediaValidationError);
  });
});

describe('Media Extensions Integration', () => {
  test('getMediaExtension should find the correct extension', () => {
    // Should find the image extension for image types
    const jpegExt = getMediaExtension('image/jpeg');
    expect(jpegExt).toBeDefined();
    expect(jpegExt?.id).toBe('astral:media:image');
    
    const pngExt = getMediaExtension('image/png');
    expect(pngExt).toBeDefined();
    expect(pngExt?.id).toBe('astral:media:image');
    
    // Should return undefined for unsupported types
    expect(getMediaExtension('image/gif')).toBeUndefined();
    expect(getMediaExtension('video/mp4')).toBeUndefined();
    expect(getMediaExtension('application/pdf')).toBeUndefined();
  });
  
  test('validateMediaData should use the correct extension', () => {
    // Should validate supported media types
    expect(validateMediaData('image/jpeg', validJpegBase64)).toBe(true);
    expect(validateMediaData('image/png', validPngBase64)).toBe(true);
    
    // Should return false for invalid data
    expect(validateMediaData('image/jpeg', invalidBase64)).toBe(false);
    
    // Should throw for unsupported media types
    expect(() => validateMediaData('image/gif', validJpegBase64)).toThrow(MediaValidationError);
    expect(() => validateMediaData('video/mp4', validJpegBase64)).toThrow(MediaValidationError);
  });
});