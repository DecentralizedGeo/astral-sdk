// This is a simple JavaScript script to test importing from the main package entry point

// Import from the main entry point
const sdk = require('./dist/index.js');
const { ethers } = require('ethers');

console.log('Checking available exports from the built package:');
console.log(Object.keys(sdk));

// Try to find the OffchainSigner export
if (sdk.OffchainSigner) {
  console.log('\nFound OffchainSigner in exports!');
  
  try {
    // Create a wallet
    const wallet = new ethers.Wallet('0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80');
    
    // Create the signer
    const signer = new sdk.OffchainSigner({
      signer: wallet,
      chainId: 11155111 // Sepolia
    });
    
    console.log('OffchainSigner created successfully:');
    console.log('  chainId:', signer.chainId);
    console.log('  chainName:', signer.chainName);
    console.log('Test passed!');
  } catch (error) {
    console.error('Error creating OffchainSigner:', error);
    console.error('Test failed!');
  }
} else {
  console.log('\nOffchainSigner not found in exports. Looking for other EAS-related exports...');
  
  // Check for nested exports
  Object.keys(sdk).forEach(key => {
    const value = sdk[key];
    if (typeof value === 'object' && value !== null) {
      if (value.OffchainSigner) {
        console.log(`Found OffchainSigner in sdk.${key}`);
      }
      console.log(`${key} contains:`, Object.keys(value));
    }
  });
}