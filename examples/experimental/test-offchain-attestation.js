// Test script to create a signed offchain location attestation
// Using manual mocking instead of Jest

const { OffchainSigner } = require('./dist/index.js');
const { ethers } = require('ethers');

// Create manual mocks to replace actual EAS modules
const createMockEASModules = () => {
  // Mock SchemaEncoder
  const mockSchemaEncoder = {
    encodeData: () => '0x1234567890abcdef'
  };
  
  // Mock Offchain module
  const mockOffchainModule = {
    signOffchainAttestation: async () => ({
      signature: {
        r: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        s: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        v: 28
      },
      uid: '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      version: 2
    }),
    getDomainTypedData: () => ({
      chainId: 11155111,
      verifyingContract: '0xC2679fBD37d54388Ce493F1DB75320D236e1815e',
      name: 'EAS',
      version: '1.0.0'
    }),
    verifyOffchainAttestationSignature: () => true
  };
  
  return { mockSchemaEncoder, mockOffchainModule };
};

async function main() {
  try {
    console.log('Testing OffchainSigner for creating a signed location attestation...');
    
    // Create a wallet for testing
    const wallet = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
    console.log(`Using wallet address: ${wallet.address}`);
    
    // Create an OffchainSigner instance
    const signer = new OffchainSigner({
      signer: wallet,
      chainId: 11155111, // Sepolia testnet
    });
    
    // Create an unsigned location proof
    const unsignedProof = {
      eventTimestamp: Math.floor(Date.now() / 1000),
      srs: 'EPSG:4326',
      locationType: 'geojson',
      location: JSON.stringify({
        type: 'Point',
        coordinates: [-122.4194, 37.7749] // San Francisco coordinates
      }),
      recipeTypes: [],
      recipePayloads: [],
      mediaTypes: [],
      mediaData: [],
      memo: 'Test location proof from test script'
    };
    
    console.log('\nUnsigned proof created:', unsignedProof);
    
    // Manually override the EAS modules with our mocks
    const { mockSchemaEncoder, mockOffchainModule } = createMockEASModules();
    
    // Monkey-patch the signer instance to use our mocks
    signer.schemaUID = '0xba4171c92572b1e4f241d044c32cdf083be9fd946b8766977558ca6378c824e2';
    signer.schemaEncoder = mockSchemaEncoder;
    signer.offchainModule = mockOffchainModule;
    
    // Override the initialize method to prevent it from trying to connect to blockchain
    signer.initializeEASModules = () => true;
    signer.ensureOffchainModuleInitialized = () => true;
    
    // Now sign the proof
    console.log('\nSigning the location proof...');
    const offchainProof = await signer.signOffchainLocationProof(unsignedProof);
    
    console.log('\nOffchain proof created successfully!');
    console.log('UID:', offchainProof.uid);
    console.log('Signer:', offchainProof.signer);
    console.log('Version:', offchainProof.version);
    console.log('Signature (shortened):', typeof offchainProof.signature === 'string' 
      ? offchainProof.signature.substring(0, 30) + '...' 
      : JSON.stringify(offchainProof.signature));
    
    // Display proof data fields
    console.log('\nProof data:');
    console.log('eventTimestamp:', offchainProof.eventTimestamp);
    console.log('locationType:', offchainProof.locationType);
    console.log('location (shortened):', offchainProof.location?.substring(0, 30) + '...');
    console.log('memo:', offchainProof.memo);
    
    // Verify the proof
    console.log('\nVerifying the offchain proof...');
    const verificationResult = await signer.verifyOffchainLocationProof(offchainProof);
    
    console.log('Verification result:', verificationResult.isValid 
      ? '✅ Valid' 
      : `❌ Invalid: ${verificationResult.reason}`);
    
    return offchainProof;
  } catch (error) {
    console.error('Error in test script:', error);
    throw error;
  }
}

// Run the test
main()
  .then(proof => {
    console.log('\nTest completed successfully!');
    console.log('\nFull proof object (for reference):');
    console.log(JSON.stringify(proof, null, 2));
  })
  .catch(error => {
    console.error('Test failed with error:', error);
  });