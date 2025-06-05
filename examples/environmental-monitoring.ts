// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

/* eslint-disable no-console */
/**
 * Environmental Monitoring Example - Astral SDK
 *
 * Real-world use case: Environmental sensor network with location attestations.
 * Demonstrates hybrid workflow, structured data, and practical patterns.
 *
 * Scenario: Air quality monitoring network across multiple cities
 * - Offchain attestations for high-frequency sensor readings
 * - Onchain attestations for official regulatory reporting
 * - Structured metadata for sensor data and station information
 *
 * Prerequisites:
 * - Build the SDK: `pnpm run build`
 * - For onchain: Set TEST_PRIVATE_KEY and INFURA_API_KEY in .env.local
 *
 * Usage:
 * npx tsx examples/environmental-monitoring.ts
 */

import { AstralSDK } from '@decentralized-geo/astral-sdk';
import { ethers } from 'ethers';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Simulated sensor data from monitoring stations around the world
const monitoringStations = [
  {
    id: 'AQ_DEL_001',
    name: 'New Delhi Central',
    location: { type: 'Point', coordinates: [77.209, 28.6139] },
    readings: { pm25: 85.2, pm10: 120.5, no2: 42.1, temperature: 32.5 },
  },
  {
    id: 'AQ_LAG_001',
    name: 'Lagos Island',
    location: { type: 'Point', coordinates: [3.3792, 6.5244] },
    readings: { pm25: 45.7, pm10: 62.3, no2: 28.9, temperature: 28.1 },
  },
  {
    id: 'AQ_MEX_001',
    name: 'Mexico City Centro',
    location: { type: 'Point', coordinates: [-99.1332, 19.4326] },
    readings: { pm25: 52.8, pm10: 74.2, no2: 35.7, temperature: 22.3 },
  },
];

async function createOffchainSensorReadings(sdk: AstralSDK) {
  console.log('📊 Creating offchain sensor readings (high-frequency data)');
  console.log('========================================================\n');

  const attestations = [];

  for (const station of monitoringStations) {
    try {
      console.log(`📍 Processing station: ${station.name}`);

      // Create structured sensor data for media attachment
      const sensorData = {
        station_id: station.id,
        station_name: station.name,
        reading_type: 'air_quality',
        timestamp: new Date().toISOString(),
        measurements: station.readings,
        units: {
          pm25: 'μg/m³',
          pm10: 'μg/m³',
          no2: 'ppb',
          temperature: '°C',
        },
        data_quality: 'validated',
        compliance_level: station.readings.pm25 > 50 ? 'exceeded' : 'within_limits',
        // In production, include references to underlying measurement attestations
        raw_measurement_attestations: [
          'bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi', // IPFS CID (example)
          'bafybeie5gq4jxvzmsym6hjlwxej4rwdoxt7wadqvmmwbqi7r6yhzxqlhvm', // Another CID (example)
        ],
        measurement_count: 144, // 24 hours × 6 measurements/hour
      };

      // Note: In this demo we only build the attestation (unsigned)
      // In production, IoT devices would sign using secure enclave or HSM:
      // const signedAttestation = await deviceSDK.createOffchainLocationAttestation(...)
      const attestation = await sdk.buildLocationAttestation({
        location: station.location,
        memo: `Air quality reading from ${station.name}`,
        timestamp: new Date(),
        media: [
          {
            mediaType: 'application/json',
            data: JSON.stringify(sensorData),
          },
        ],
      });

      attestations.push(attestation);

      console.log(`   ✅ Created attestation for ${station.name}`);
      console.log(`      PM2.5: ${station.readings.pm25} μg/m³`);
      console.log(`      Compliance: ${sensorData.compliance_level}`);
    } catch (error) {
      console.error(`   ❌ Failed to create attestation for ${station.name}:`, error.message);
    }
  }

  console.log(`\n📈 Summary: Created ${attestations.length} unsigned sensor attestations`);
  console.log('💡 In production:');
  console.log('   - IoT devices sign attestations using secure enclave/HSM');
  console.log('   - Attestations stored in distributed network (IPFS, Arweave, etc.)');
  console.log('   - High-frequency raw measurements referenced by CID/UID\n');

  return attestations;
}

async function createOnchainRegulatoryReport(_sdk: AstralSDK) {
  console.log('📋 Creating onchain regulatory report (official compliance record)');
  console.log('================================================================\n');

  // Check environment setup
  if (!process.env.TEST_PRIVATE_KEY || !process.env.INFURA_API_KEY) {
    console.log('⚠️  Onchain reporting requires environment setup:');
    console.log('   Add TEST_PRIVATE_KEY and INFURA_API_KEY to .env.local');
    console.log('   Fund test wallet with sepolia ETH');
    console.log('💡 This creates permanent compliance records on blockchain\n');
    return null;
  }

  try {
    // Setup blockchain connection
    const provider = new ethers.JsonRpcProvider(
      `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY}`
    );
    const signer = new ethers.Wallet(process.env.TEST_PRIVATE_KEY, provider);

    const onchainSDK = new AstralSDK({
      provider,
      signer,
      defaultChain: 'sepolia',
      debug: true,
    });

    await onchainSDK.extensions.ensureInitialized();

    // Create regulatory compliance report with references to offchain data
    const reportData = {
      report_type: 'daily_compliance_summary',
      report_date: new Date().toISOString().split('T')[0],
      monitoring_network: 'Global Air Quality Initiative',
      stations_count: monitoringStations.length,
      compliance_summary: {
        total_stations: monitoringStations.length,
        compliant: monitoringStations.filter(s => s.readings.pm25 <= 50).length,
        exceeded: monitoringStations.filter(s => s.readings.pm25 > 50).length,
      },
      regulatory_framework: 'WHO Air Quality Guidelines 2021',
      submitted_by: 'Environmental Monitoring Authority',
      // Reference to offchain attestation collection (in production)
      offchain_data_references: {
        collection_cid: 'bafybeibc5sgo2plmjkq2tzmhrn54bk3crhnqyxvtq72n2xhwamgwj3cw5i', // IPFS collection
        attestation_count: 432, // 3 stations × 144 readings each
        verification_method: 'secure_enclave_signed',
      },
      stations: monitoringStations.map(s => ({
        id: s.id,
        name: s.name,
        coordinates: s.location.coordinates,
        pm25_reading: s.readings.pm25,
        status: s.readings.pm25 > 50 ? 'exceeded' : 'compliant',
      })),
    };

    console.log('📍 Creating compliance report for network center (New Delhi)...');

    const regulatoryAttestation = await onchainSDK.createOnchainLocationAttestation({
      location: {
        type: 'Feature',
        properties: {
          name: 'Global Air Quality Network - Central India Region',
          network_type: 'environmental_monitoring',
          regulatory_authority: 'Environmental Protection Agency',
        },
        geometry: {
          type: 'Point',
          coordinates: [77.209, 28.6139], // New Delhi as network center
        },
      },
      memo: 'Daily compliance report - Global Air Quality Initiative',
      media: [
        {
          mediaType: 'application/json',
          data: JSON.stringify(reportData),
        },
      ],
    });

    console.log('✅ Regulatory report created on blockchain!');
    console.log(`   UID: ${regulatoryAttestation.uid}`);
    console.log(`   Transaction: ${regulatoryAttestation.txHash}`);
    console.log(`   Block: ${regulatoryAttestation.blockNumber}`);
    console.log(
      `   Compliant stations: ${reportData.compliance_summary.compliant}/${reportData.compliance_summary.total_stations}`
    );
    console.log(
      `   View on Etherscan: https://sepolia.etherscan.io/tx/${regulatoryAttestation.txHash}`
    );

    return regulatoryAttestation;
  } catch (error) {
    console.error('❌ Regulatory report creation failed:', error.message);
    return null;
  }
}

async function main() {
  console.log('🌍 Environmental Monitoring with Location Attestations');
  console.log('=====================================================\n');

  console.log('This example demonstrates a real-world environmental monitoring use case:');
  console.log('- Air quality sensor network across multiple global cities');
  console.log('- Offchain attestations for high-frequency sensor readings');
  console.log('- Onchain attestations for regulatory compliance reporting');
  console.log('- Structured metadata for environmental data\n');

  try {
    // Create SDK for offchain operations
    const sdk = new AstralSDK({
      mode: 'offchain',
      debug: true,
    });

    await sdk.extensions.ensureInitialized();

    // Step 1: Create high-frequency offchain sensor readings
    const sensorAttestations = await createOffchainSensorReadings(sdk);

    // Step 2: Create official onchain regulatory report
    const regulatoryAttestation = await createOnchainRegulatoryReport(sdk);

    // Summary
    console.log('🎉 Environmental monitoring example complete!\n');
    console.log('📊 Results:');
    console.log(`   - ${sensorAttestations.length} sensor reading attestations (offchain)`);
    console.log(`   - ${regulatoryAttestation ? '1' : '0'} regulatory report (onchain)`);

    console.log('\n💡 Key patterns demonstrated:');
    console.log('   ✅ Hybrid workflow (offchain + onchain for different purposes)');
    console.log('   ✅ Structured metadata in mediaData array (application/json)');
    console.log('   ✅ Global coordinate diversity');
    console.log('   ✅ Real-world environmental data structure');
    console.log('   ✅ Compliance and regulatory reporting');
    console.log('   ✅ References to offchain attestation collections via CID/UID');

    console.log('\n📚 Next steps:');
    console.log('   - Explore the workflow guides for deeper patterns');
    console.log('   - Check ROADMAP.md for more use case examples');
    console.log('   - Adapt this pattern for your specific monitoring needs');
  } catch (error) {
    console.error('❌ Example failed:', error.message);
  }
}

// Run the example
main().catch(console.error);
