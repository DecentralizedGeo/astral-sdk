/**
 * Debug script to identify OnchainRegistrar initialization issue
 */

import { ethers } from 'ethers';
import { OnchainRegistrar } from './src/eas/OnchainRegistrar';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function debugOnchainRegistrar() {
  console.log('🔍 Debugging OnchainRegistrar initialization...\n');
  
  try {
    const privateKey = process.env.ACCT_1_PRIV;
    if (!privateKey) {
      throw new Error('ACCT_1_PRIV not found in .env.local');
    }
    
    const infuraKey = process.env.INFURA_KEY;
    if (!infuraKey) {
      throw new Error('INFURA_KEY not found in .env.local');
    }
    
    const provider = new ethers.JsonRpcProvider(
      process.env.SEPOLIA_RPC_URL || `https://sepolia.infura.io/v3/${infuraKey}`
    );
    const signer = new ethers.Wallet(privateKey, provider);
    
    console.log('✅ Signer created:', await signer.getAddress());
    console.log('✅ Provider connected:', await provider.getNetwork());
    
    console.log('\n🔧 Attempting to create OnchainRegistrar...');
    
    const registrar = new OnchainRegistrar({
      provider,
      signer,
      chain: 'sepolia',
    });
    
    console.log('✅ OnchainRegistrar created successfully!');
    
    // Test initialization
    console.log('\n🔧 Testing ensureEASModulesInitialized...');
    await (registrar as any).ensureEASModulesInitialized();
    console.log('✅ EAS modules initialized!');
    
  } catch (error) {
    console.error('❌ OnchainRegistrar initialization failed:', error);
    console.error('\nError details:', {
      message: error.message,
      code: error.code,
      cause: error.cause
    });
  }
}

debugOnchainRegistrar();