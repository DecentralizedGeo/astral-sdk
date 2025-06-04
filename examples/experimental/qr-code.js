/**
 * This workflow is a proof of concept that scans a QR code image and
 * generates/signs an ethereum attestation
 */

import { ethers } from 'ethers';
import { Jimp } from 'jimp';
import jsQR from 'jsqr';
import * as dotenv from 'dotenv';

import { AstralSDK } from '../../dist/index.mjs';

dotenv.config();

/**
 * Read an image from disk and decodes QR code
 *
 * @param {string} imagePath - The path to the image file
 * @returns {Promise<string>} - The decoded QR code data
 * @throws {Error} - If the image cannot be read or the QR code cannot be decoded
 */
async function decodeQR(imagePath) {
  try {
    // Read image
    const image = await Jimp.read(imagePath);

    // Convert image Buffer to Uint8ClampedArray
    const clamped = new Uint8ClampedArray(image.bitmap.data.buffer);

    // Convert the image to a pixel array
    const { width, height } = image.bitmap;

    // Decode the QR code
    const code = jsQR(clamped, width, height);
    if (!code) {
      throw new Error('QR code not found');
    }

    return code.data;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to decode QR code: ${error.message}`);
    } else {
      throw new Error('Failed to decode QR code: Unknown error');
    }
  }
}

async function main() {
  try {
    console.log('Demonstrating QR Code onchain workflow with Astral SDK');

    const privateKey = process.env.PRIVATE_KEY;
    const sepoliaRpcUrl = process.env.SEPOLIA_RPC_URL;

    if (!privateKey || !sepoliaRpcUrl) {
      throw new Error('Please set PRIVATE_KEY and SEPOLIA_RPC_URL in .env');
    }

    const wallet = new ethers.Wallet(privateKey);
    console.log(`Using wallet address: ${wallet.address}`);

    const provider = new ethers.JsonRpcProvider(sepoliaRpcUrl);
    const connectedWallet = wallet.connect(provider);

    // Initialize the AstralSDK
    const sdk = new AstralSDK({
      signer: connectedWallet,
      provider: provider,
      defaultChain: 'sepolia',
      debug: true,
    });

    const imagePath = './examples/qrcode.png';
    console.log(`\nDecoding QR code from: ${imagePath}...`);
    const qrDataString = await decodeQR(imagePath);
    console.log('Decoded QR code data string:', qrDataString);

    let latitude, longitude;
    try {
      const parsedQrData = JSON.parse(qrDataString);
      if (
        !Array.isArray(parsedQrData) ||
        parsedQrData.length !== 2 ||
        typeof parsedQrData[0] !== 'number' ||
        typeof parsedQrData[1] !== 'number'
      ) {
        throw new Error('QR code data must be a JSON array of two numbers: [latitude, longitude]');
      }
      [latitude, longitude] = parsedQrData;
      console.log(`Parsed latitude: ${latitude}, longitude: ${longitude}`);
    } catch (parseError) {
      console.error('Failed to parse QR code data:', parseError);
      throw new Error(
        `Invalid QR code data format. Expected "[latitude, longitude]". Received: ${qrDataString}`
      );
    }

    const locationInput = {
      location: {
        type: 'Point',
        coordinates: [longitude, latitude],
      },
      locationType: 'geojson',
      memo: `Location proof from QR code via AstralSDK: ${new Date().toISOString()}`,
      timestamp: new Date(),
    };

    console.log('\nLocation input for AstralSDK:', locationInput);

    console.log('\nBuilding unsigned location proof...');
    const unsignedProof = await sdk.buildLocationProof(locationInput);
    console.log('Unsigned proof created:', unsignedProof);

    console.log('\nRegistering the location proof on-chain...');
    const onchainProof = await sdk.createOnchainLocationProof(locationInput);

    console.log('\nOnchain location proof created successfully!');
    console.log('UID:', onchainProof.uid);
    console.log('Chain:', onchainProof.chain);
    console.log('Transaction Hash:', onchainProof.txHash);
    console.log('Block Number:', onchainProof.blockNumber);
    console.log(
      'Attestation URL:',
      `https://sepolia.easscan.org/attestation/view/${onchainProof.uid}`
    );

    return unsignedProof;
  } catch (error) {
    console.error('Error in main function:', error);
    return Promise.reject(error);
  }
}

main()
  .then(proof => {
    console.log('\n--- Example Execution Complete ---');
    console.log('Final proof object (unsigned by default):');
    console.log(JSON.stringify(proof, null, 2));
    console.log('\nThis example showed how to use the QR code workflow with AstralSDK.');
    console.log(
      'To register proofs on-chain, ensure your .env file is configured, a valid QR code image is present,'
    );
    console.log('and uncomment the on-chain registration section in the script.');
  })
  .catch(error => {
    console.error('\n--- Example Failed ---');
    console.error('Error during script execution:', error.message);
    process.exit(1);
  });
