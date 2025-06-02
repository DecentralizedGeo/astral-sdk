// test-manual.ts
import { AstralSDK } from '../src/core/AstralSDK';

async function testSDK() {
  console.log('Creating SDK instance...');
  const sdk = new AstralSDK({ debug: true });

  console.log('Extensions immediately:',
    sdk.extensions.getAllLocationExtensions().length);

  setTimeout(() => {
    console.log('Extensions after 100ms:', 
    sdk.extensions.getAllLocationExtensions().length);
    }, 100);
}

testSDK();
