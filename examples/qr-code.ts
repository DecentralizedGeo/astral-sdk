/**
 * This workflow is a proof of concept that scans a QR code image and
 * generates/signs an ethereum attestation
 */

import { EAS, NO_EXPIRATION, SchemaEncoder } from '@ethereum-attestation-service/eas-sdk';
import { ethers } from 'ethers';
import { Jimp } from 'jimp';
import jsQR from 'jsqr';
import * as dotenv from 'dotenv';

dotenv.config();

/**
 * Read an image from disk and decodes QR code
 *
 * @param {string} imagePath - The path to the image file
 * @returns {Promise<string>} - The decoded QR code data
 * @throws {Error} - If the image cannot be read or the QR code cannot be decoded
 */
async function decodeQR(imagePath: string): Promise<string> {
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
    throw new Error(`Failed to decode QR code: ${error.message}`);
  }
}

// Generate a random UUID v4
function uuidv4() {
  return '10000000-1000-4000-8000-100000000000'.replace(/[018]/g, c =>
    (+c ^ (crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (+c / 4)))).toString(16)
  );
}

async function createAttestation(qrData: string): Promise<void> {
  const eas = new EAS('0xC2679fBD37d54388Ce493F1DB75320D236e1815e');
  const provider = ethers.getDefaultProvider('sepolia');

  // Create a signer
  const privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) throw new Error('set PRIVATE_KEY in .env');
  const signer = new ethers.Wallet(privateKey, provider);

  eas.connect(signer);

  const time = new Date();

  const schemaEncoder = new SchemaEncoder('string lat, string long, string id, string timestamp');
  const encodedData = schemaEncoder.encodeData([
    { name: 'lat', value: JSON.parse(qrData)[0].toString(), type: 'string' },
    { name: 'long', value: JSON.parse(qrData)[1].toString(), type: 'string' },
    { name: 'id', value: uuidv4(), type: 'string' },
    { name: 'timestamp', value: time.toLocaleDateString(), type: 'string' },
  ]);

  const schemaUID = '0x1893a6a17c2621355f1912a37fc3918057e41e8534b3fa56963ceafffdce49bf';

  console.log(`Creating attestation with schema UID: ${schemaUID}, data: ${encodedData}`);
  const transaction = await eas.attest({
    schema: schemaUID,
    data: {
      recipient: signer.address,
      expirationTime: NO_EXPIRATION,
      revocable: true,
      data: encodedData,
    },
  });

  const newAttestationUID = await transaction.wait();

  console.log('Attestation created with UID:', newAttestationUID);
  console.log('Transaction hash:', transaction.receipt?.hash);

  console.log('Transaction URL:', `https://sepolia.etherscan.io/tx/${transaction.receipt?.hash}`);
  console.log(
    'Attestation URL:',
    `https://sepolia.easscan.org/attestation/view/${newAttestationUID}`
  );
}

async function main() {
  const imagePath = 'src/assets/qrcode.png';

  try {
    const qrData = await decodeQR(imagePath);
    console.log('Decoded QR code data:', qrData);

    await createAttestation(qrData);
    console.log('Attestation created successfully!');
  } catch (error) {
    console.error(error);
  }
}

main();
