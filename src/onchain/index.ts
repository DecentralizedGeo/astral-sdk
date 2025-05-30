/**
 * Onchain module for Astral SDK
 *
 * This will be implemented in a future phase.
 * This is just a placeholder for now.
 */

import OnchainRegistrar from '@/eas/OnchainRegistrar';

// This module will be implemented in phase 5
export const onchainModulePlaceholder = true;

/**
 * Get an onchain attestation by its ID.
 *
 * @param registar OnchainRegistrar instance
 * @param attestationId attestation ID to fetch
 * @returns attestation details or null if not found
 */
export async function getAttestation(registar: OnchainRegistrar, attestationId: string) {
  try {
    if (!registar.eas) {
      throw new Error('EAS instance is not initialized in the registrar.');
    }

    // Fetch the attestation using the EAS instance from the registrar
    const attestation = await registar.eas?.getAttestation(attestationId);

    if (attestation) {
      // Create a dictionary object that maps property names to their values
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const attestationDetails: { [key: string]: any } = {};

      for (const key in attestation) {
        if (Object.prototype.hasOwnProperty.call(attestation, key)) {
          attestationDetails[key] = (attestation as unknown as Record<string, unknown>)[key];
        }
      }
      console.log('Attestation details:', attestationDetails);
    } else {
      console.log('Attestation not found.');
    }
    return attestation;
  } catch (error) {
    console.error('Error fetching attestation:', error);
    throw error;
  }
}

/**
 * Revoke an onchain attestation by its ID.
 *
 * @param registar OnchainRegistrar instance
 * @param attestationId attestation ID to revoke
 * @param reason Optional reason for revocation
 */
export async function revokeAttestation(
  registar: OnchainRegistrar,
  attestationId: string,
  reason?: string
): Promise<void> {
  try {
    if (!registar.eas) {
      throw new Error('EAS instance is not initialized in the registrar.');
    }

    // Revoke the attestation using the EAS instance from the registrar
    await registar.eas?.revoke({
      schema: registar.schemaUID,
      data: {
        uid: attestationId,
      },
    });
    console.log(`Attestation ${attestationId} ${reason && `revoked for reason: ${reason}`}`);
  } catch (error) {
    console.error('Error revoking attestation:', error);
    throw error;
  }
}
