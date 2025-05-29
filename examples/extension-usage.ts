/**
 * Example showing how to use Astral SDK with the extension system
 *
 * This example demonstrates:
 * 1. Creating location proofs with GeoJSON data
 * 2. Including image attachments
 * 3. Using location format conversion
 */
// override the eslint no-console rule for this example
/* eslint-disable no-console */

import { AstralSDK } from '../src/core/AstralSDK';
import { LocationProofInput } from '../src/core/types';

// Create a new SDK instance with debug mode enabled
const sdk = new AstralSDK({
  debug: true,
  mode: 'offchain',
});

// Example 1: Create a simple location proof with GeoJSON Point
async function createSimpleLocationProof() {
  console.log('Example 1: Creating a simple location proof with GeoJSON Point');

  const input: LocationProofInput = {
    location: {
      type: 'Point',
      coordinates: [12.34, 56.78],
    },
    // locationType is optional - SDK will auto-detect GeoJSON
    memo: 'My first location proof',
  };

  try {
    // Build an unsigned location proof
    const unsignedProof = await sdk.buildLocationProof(input);
    console.log('Created unsigned location proof:');
    console.log(JSON.stringify(unsignedProof, null, 2));

    return unsignedProof;
  } catch (error) {
    console.error('Error creating location proof:', error);
    throw error;
  }
}

// Example 2: Create a location proof with image attachment
async function createLocationProofWithImage() {
  console.log('\nExample 2: Creating a location proof with image attachment');

  // Sample tiny 1x1 JPEG image (base64 encoded)
  const jpegBase64 =
    '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwD3+iiigD//2Q==';

  const input: LocationProofInput = {
    location: {
      type: 'Feature',
      properties: {
        name: 'My location with photo',
      },
      geometry: {
        type: 'Point',
        coordinates: [12.34, 56.78],
      },
    },
    memo: 'Location proof with JPEG image',
    // Add an image attachment
    media: [
      {
        mediaType: 'image/jpeg',
        data: jpegBase64,
      },
    ],
  };

  try {
    // Build an unsigned location proof
    const unsignedProof = await sdk.buildLocationProof(input);
    console.log('Created location proof with image:');
    console.log('Media types:', unsignedProof.mediaTypes);
    console.log('Media data length:', unsignedProof.mediaData[0].substring(0, 50) + '...');

    return unsignedProof;
  } catch (error) {
    console.error('Error creating location proof with image:', error);
    throw error;
  }
}

// Example 3: Create a location proof with a specified target format
// (In this MVP, we only have GeoJSON, but this shows the API for future formats)
async function createLocationProofWithFormatConversion() {
  console.log('\nExample 3: Creating a location proof with format conversion');

  const input: LocationProofInput = {
    location: {
      type: 'Point',
      coordinates: [12.34, 56.78],
    },
    // For the MVP, we only have GeoJSON, but this shows how the API will work
    targetLocationFormat: 'geojson',
    memo: 'Location proof with format conversion',
  };

  try {
    // Build an unsigned location proof
    const unsignedProof = await sdk.buildLocationProof(input);
    console.log('Created location proof with format conversion:');
    console.log('Location type:', unsignedProof.locationType);
    console.log('Location data:', unsignedProof.location);

    return unsignedProof;
  } catch (error) {
    console.error('Error creating location proof with format conversion:', error);
    throw error;
  }
}

// Run all examples
async function runExamples() {
  await createSimpleLocationProof();
  await createLocationProofWithImage();
  await createLocationProofWithFormatConversion();
}

// For Node.js environment
if (typeof require !== 'undefined' && require.main === module) {
  runExamples().catch(console.error);
}

export {
  createSimpleLocationProof,
  createLocationProofWithImage,
  createLocationProofWithFormatConversion,
};
