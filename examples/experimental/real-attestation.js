// Real attestation signing example - no mocks!
const { ethers } = require('ethers');
const { SchemaEncoder, Offchain } = require('@ethereum-attestation-service/eas-sdk');

// This is what we're implementing in the OffchainSigner
async function createRealOffchainAttestation() {
  console.log('Creating a real offchain attestation using EAS SDK directly');
  
  // 1. Create wallet
  const wallet = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
  console.log(`Wallet address: ${wallet.address}`);
  
  // 2. Define the actual schema - this is what was missing!
  // This is the Astral location schema with proper types
  const schemaString = 'uint256 eventTimestamp,string srs,string locationType,string location,string[] recipeTypes,string[] recipePayloads,string[] mediaTypes,string[] mediaData,string memo';
  
  // 3. Create the schema encoder with the SCHEMA STRING (not the UID)
  const schemaEncoder = new SchemaEncoder(schemaString);
  
  // 4. Prepare the location data
  const locationData = {
    eventTimestamp: Math.floor(Date.now() / 1000),
    srs: 'EPSG:4326',
    locationType: 'geojson',
    location: JSON.stringify({
      type: 'Point',
      coordinates: [-122.4194, 37.7749] // San Francisco
    }),
    recipeTypes: [],
    recipePayloads: [],
    mediaTypes: [],
    mediaData: [],
    memo: 'Real attestation from direct EAS SDK'
  };
  
  console.log('\nLocation data:', locationData);
  
  // 5. Encode the data for EAS - this creates the bytes for the attestation
  const encodedData = schemaEncoder.encodeData([
    { name: 'eventTimestamp', type: 'uint256', value: locationData.eventTimestamp },
    { name: 'srs', type: 'string', value: locationData.srs },
    { name: 'locationType', type: 'string', value: locationData.locationType },
    { name: 'location', type: 'string', value: locationData.location },
    { name: 'recipeTypes', type: 'string[]', value: locationData.recipeTypes },
    { name: 'recipePayloads', type: 'string[]', value: locationData.recipePayloads },
    { name: 'mediaTypes', type: 'string[]', value: locationData.mediaTypes },
    { name: 'mediaData', type: 'string[]', value: locationData.mediaData },
    { name: 'memo', type: 'string', value: locationData.memo }
  ]);
  
  console.log('\nEncoded data:', encodedData.substring(0, 30) + '...');
  
  // 6. Initialize the Offchain module (for EIP-712 signing)
  const offchain = new Offchain();
  
  // 7. Define the schema UID (this is what we were trying to use before)
  const schemaUID = '0xba4171c92572b1e4f241d044c32cdf083be9fd946b8766977558ca6378c824e2';
  
  // 8. Prepare the attestation for signing
  const attestationData = {
    schema: schemaUID,
    recipient: wallet.address, // Self-attestation in this case
    data: encodedData,
    refUID: '0x0000000000000000000000000000000000000000000000000000000000000000',
    revocable: true,
    expirationTime: 0 // No expiration  
  };
  
  // 9. Actually sign the attestation
  console.log('\nSigning the attestation...');
  const { signature, uid } = await offchain.signOffchainAttestation(attestationData, wallet);
  
  // 10. Create the full attestation object that Astral SDK would return
  const offchainProof = {
    ...locationData,
    uid: uid,
    signature: JSON.stringify(signature),
    signer: wallet.address,
    version: 'astral-sdk-v0.1.0'
  };
  
  console.log('\nAttestation signed successfully!');
  console.log('UID:', uid);
  console.log('Signature:', JSON.stringify(signature).substring(0, 50) + '...');
  
  return offchainProof;
}

// Run the example
createRealOffchainAttestation()
  .then(proof => {
    console.log('\nFull attestation created:');
    console.log(JSON.stringify(proof, null, 2));
    console.log('\nThis attestation is a REAL EAS-compliant signed attestation that could be verified or published!');
  })
  .catch(error => {
    console.error('Error creating attestation:', error);
  });