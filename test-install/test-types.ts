// Test file for verifying TypeScript types and package installation
import { AstralSDK, UnsignedLocationAttestation } from '@astral-protocol/sdk';

// Test that types are available and properly typed
const sdk = new AstralSDK({
  defaultChain: 'sepolia',
  debug: true,
});

// Test type definitions exist
const unsignedProof: UnsignedLocationAttestation = {
  eventTimestamp: Math.floor(Date.now() / 1000),
  srs: 'EPSG:4326',
  locationType: 'geojson',
  location: '{"type":"Point","coordinates":[0,0]}',
  recipeType: [],
  recipePayload: [],
  mediaType: [],
  mediaData: [],
};

// Verify types work (satisfies ESLint)
export const testResults = {
  sdkType: typeof sdk,
  proofType: typeof unsignedProof,
  success: true,
};
