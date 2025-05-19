// Direct approach using the underlying ethers.js to create the EIP-712 signature
// that would be used in an offchain attestation

const { ethers } = require('ethers');
const { TypedDataEncoder } = ethers;

async function signDirectAttestation() {
  console.log('Creating a direct EIP-712 signature for an attestation');
  
  // Create wallet
  const wallet = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
  console.log(`Wallet address: ${wallet.address}`);
  
  // EIP-712 domain (this is what EAS uses)
  const domain = {
    name: 'EAS',
    version: '1.0.0',
    chainId: 11155111, // Sepolia
    verifyingContract: '0xC2679fBD37d54388Ce493F1DB75320D236e1815e' // EAS contract on Sepolia
  };
  
  // EIP-712 types definition (matches EAS attestation structure)
  const types = {
    Attest: [
      { name: 'schema', type: 'bytes32' },
      { name: 'recipient', type: 'address' },
      { name: 'time', type: 'uint256' },
      { name: 'expirationTime', type: 'uint256' },
      { name: 'revocable', type: 'bool' },
      { name: 'refUID', type: 'bytes32' },
      { name: 'data', type: 'bytes' }
    ]
  };
  
  // Location data to attest
  const locationData = {
    eventTimestamp: Math.floor(Date.now() / 1000),
    srs: 'EPSG:4326',
    locationType: 'geojson',
    location: JSON.stringify({
      type: 'Point',
      coordinates: [-122.4194, 37.7749] // San Francisco
    }),
    memo: 'Direct EIP-712 signature'
  };
  
  console.log('\nLocation data:', locationData);
  
  // This would normally be encoded by SchemaEncoder
  // For simplicity, we'll just use a placeholder
  const encodedData = '0x1234567890abcdef';
  
  // The actual EIP-712 data to sign
  const value = {
    schema: '0xba4171c92572b1e4f241d044c32cdf083be9fd946b8766977558ca6378c824e2',
    recipient: wallet.address,
    time: Math.floor(Date.now() / 1000),
    expirationTime: 0, // No expiration
    revocable: true,
    refUID: '0x0000000000000000000000000000000000000000000000000000000000000000',
    data: encodedData
  };
  
  // Calculate the EIP-712 digest
  const digest = TypedDataEncoder.hash(domain, types, value);
  console.log('\nEIP-712 digest:', digest);
  
  // Sign the digest with the wallet
  console.log('\nSigning the digest with wallet...');
  const signature = await wallet.signMessage(ethers.getBytes(digest));
  
  // Generate a random UID (normally this would be deterministic based on the attestation)
  const uid = '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
  
  // Create Astral SDK style proof
  const offchainProof = {
    ...locationData,
    uid: uid,
    signature: signature,
    signer: wallet.address,
    version: 'astral-sdk-v0.1.0'
  };
  
  console.log('\nAttestation signed successfully!');
  console.log('UID:', uid);
  console.log('Signature:', signature);
  
  return offchainProof;
}

// Run the example
signDirectAttestation()
  .then(proof => {
    console.log('\nFull attestation created:');
    console.log(JSON.stringify(proof, null, 2));
    console.log('\nThis contains a real cryptographic signature!');
  })
  .catch(error => {
    console.error('Error creating attestation:', error);
  });