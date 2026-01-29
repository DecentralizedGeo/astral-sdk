// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

/**
 * ComputeModule - Provides verifiable geospatial computations
 *
 * Each method returns a signed delegated attestation that can be submitted to EAS.
 */

import { EAS } from '@ethereum-attestation-service/eas-sdk';
import { Signer } from 'ethers';
import { ComputeConfig } from '../core/types';
import { NetworkError, ValidationError } from '../core/errors';
import {
  Input,
  ComputeOptions,
  NumericComputeResult,
  BooleanComputeResult,
  DelegatedAttestation,
  AttestationResult,
  HealthStatus,
} from './types';

// EAS contract addresses by chain
const EAS_CONTRACT_ADDRESSES: Record<number, string> = {
  84532: '0x4200000000000000000000000000000000000021', // Base Sepolia
  8453: '0x4200000000000000000000000000000000000021', // Base Mainnet
  1: '0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587', // Ethereum Mainnet
  11155111: '0xC2679fBD37d54388Ce493F1DB75320D236e1815e', // Sepolia
  42220: '0x72E1d8ccf5299fb36fEfD8CC4394B8ef7e98Af92', // Celo
  42161: '0xbD75f629A22Dc1ceD33dDA0b68c546A1c035c458', // Arbitrum
  10: '0x4200000000000000000000000000000000000021', // Optimism
};

/**
 * ComputeModule provides spatial operations with verifiable attestations
 */
export class ComputeModule {
  private readonly apiUrl: string;
  private readonly chainId: number;
  private readonly signer?: Signer;
  private eas?: EAS;

  constructor(config: ComputeConfig) {
    this.apiUrl = config.apiUrl.replace(/\/$/, '');
    this.chainId = config.chainId;
    this.signer = config.signer as Signer | undefined;

    // Initialize EAS if signer is provided
    if (this.signer) {
      this.initializeEAS();
    }
  }

  /**
   * Initialize EAS SDK for attestation submission
   */
  private initializeEAS(): void {
    const address = EAS_CONTRACT_ADDRESSES[this.chainId];
    if (address && this.signer) {
      this.eas = new EAS(address);
      this.eas.connect(this.signer);
    }
  }

  /**
   * Normalize input to API-compatible format
   */
  private normalizeInput(input: Input): object {
    // Direct UID string
    if (typeof input === 'string') {
      return { uid: input };
    }
    // GeoJSON Feature - extract geometry
    if (
      typeof input === 'object' &&
      'type' in input &&
      (input as { type: string }).type === 'Feature' &&
      'geometry' in input
    ) {
      return (input as { geometry: object }).geometry;
    }
    // Pass through as-is
    return input as object;
  }

  /**
   * Make a request to the compute service
   */
  private async request(endpoint: string, body: object): Promise<unknown> {
    const response = await fetch(`${this.apiUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chainId: this.chainId, ...body }),
    });

    if (!response.ok) {
      const errorBody = (await response.json().catch(() => ({ detail: response.statusText }))) as {
        detail?: string;
      };
      throw new NetworkError(`Astral API error: ${errorBody.detail || response.statusText}`);
    }

    return response.json();
  }

  /**
   * Compute the distance between two geometries (meters)
   */
  async distance(from: Input, to: Input, options: ComputeOptions): Promise<NumericComputeResult> {
    return this.request('/compute/v0/distance', {
      from: this.normalizeInput(from),
      to: this.normalizeInput(to),
      schema: options.schema,
      recipient: options.recipient,
    }) as Promise<NumericComputeResult>;
  }

  /**
   * Compute the area of a polygon (square meters)
   */
  async area(geometry: Input, options: ComputeOptions): Promise<NumericComputeResult> {
    return this.request('/compute/v0/area', {
      geometry: this.normalizeInput(geometry),
      schema: options.schema,
      recipient: options.recipient,
    }) as Promise<NumericComputeResult>;
  }

  /**
   * Compute the length of a line (meters)
   */
  async length(geometry: Input, options: ComputeOptions): Promise<NumericComputeResult> {
    return this.request('/compute/v0/length', {
      geometry: this.normalizeInput(geometry),
      schema: options.schema,
      recipient: options.recipient,
    }) as Promise<NumericComputeResult>;
  }

  /**
   * Check if container geometry contains the containee
   */
  async contains(
    container: Input,
    containee: Input,
    options: ComputeOptions
  ): Promise<BooleanComputeResult> {
    return this.request('/compute/v0/contains', {
      container: this.normalizeInput(container),
      containee: this.normalizeInput(containee),
      schema: options.schema,
      recipient: options.recipient,
    }) as Promise<BooleanComputeResult>;
  }

  /**
   * Check if geometry is within radius (meters) of target
   */
  async within(
    geometry: Input,
    target: Input,
    radius: number,
    options: ComputeOptions
  ): Promise<BooleanComputeResult> {
    return this.request('/compute/v0/within', {
      geometry: this.normalizeInput(geometry),
      target: this.normalizeInput(target),
      radius,
      schema: options.schema,
      recipient: options.recipient,
    }) as Promise<BooleanComputeResult>;
  }

  /**
   * Check if two geometries intersect
   */
  async intersects(a: Input, b: Input, options: ComputeOptions): Promise<BooleanComputeResult> {
    return this.request('/compute/v0/intersects', {
      geometry1: this.normalizeInput(a),
      geometry2: this.normalizeInput(b),
      schema: options.schema,
      recipient: options.recipient,
    }) as Promise<BooleanComputeResult>;
  }

  /**
   * Check service health
   */
  async health(): Promise<HealthStatus> {
    const response = await fetch(`${this.apiUrl}/health`);
    if (!response.ok) {
      throw new NetworkError(`Health check failed: ${response.statusText}`);
    }
    return response.json() as Promise<HealthStatus>;
  }

  /**
   * Submit a delegated attestation to EAS
   * The caller pays gas; Astral remains the attester.
   */
  async submit(attestation: DelegatedAttestation): Promise<AttestationResult> {
    if (!this.eas || !this.signer) {
      throw new ValidationError('Signer is required for attestation submission');
    }

    const { message, signature, attester } = attestation;

    const tx = await this.eas.attestByDelegation({
      schema: message.schema,
      data: {
        recipient: message.recipient,
        expirationTime: message.expirationTime,
        revocable: message.revocable,
        refUID: message.refUID,
        data: message.data,
        value: message.value,
      },
      signature: {
        v: signature.v,
        r: signature.r,
        s: signature.s,
      },
      attester,
      deadline: message.deadline,
    });

    const uid = await tx.wait();
    return { uid };
  }

  /**
   * Estimate gas for attestation submission
   */
  async estimate(attestation: DelegatedAttestation): Promise<bigint> {
    if (!this.eas || !this.signer) {
      throw new ValidationError('Signer is required for gas estimation');
    }

    const { message, signature, attester } = attestation;
    const contract = this.eas.contract;

    const request = {
      schema: message.schema,
      data: {
        recipient: message.recipient,
        expirationTime: message.expirationTime,
        revocable: message.revocable,
        refUID: message.refUID,
        data: message.data,
        value: message.value,
      },
      signature: {
        v: signature.v,
        r: signature.r,
        s: signature.s,
      },
      attester,
      deadline: message.deadline,
    };

    return await contract.attestByDelegation.estimateGas(request);
  }
}
