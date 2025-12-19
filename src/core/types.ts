// SPDX-License-Identifier: Apache-2.0
// Copyright © 2025 Sophia Systems Corporation

/**
 * Core type definitions for Astral SDK
 *
 * This file defines the main interfaces and types for the Astral SDK, with a clear
 * separation between offchain and onchain attestation types to support the dual-workflow
 * architecture.
 */

/**
 * UnsignedLocationAttestation serves as the base type for all location attestations before
 * cryptographic signing or on-chain registration.
 *
 * It contains the essential fields required by the EAS schema for location attestations,
 * with additional convenience fields for SDK operations.
 *
 * @property eventTimestamp - Timestamp of when the location event occurred (Unix timestamp in seconds)
 * @property srs - Spatial Reference System identifier, default is "EPSG:4326" (WGS84)
 * @property locationType - Format of the location data (e.g., "geojson-point", "wkt-polygon", "h3")
 * @property location - Location data in a string format as specified by locationType
 * @property recipeTypes - Array of recipe type identifiers (empty in v0.1)
 * @property recipePayloads - Array of recipe payloads (empty in v0.1)
 * @property mediaTypes - Array of MIME types and subtypes for attached media (e.g., "image/jpeg", "video/mp4")
 * @property mediaData - Array of data for each corresponding media attachment (base64, IPFS CIDs, etc.)
 * @property memo - Optional textual note attached to the attestation
 * @property expirationTime - Optional timestamp after which the attestation is considered invalid
 * @property revocable - Whether the attestation can be revoked by the attester
 * @property recipient - Ethereum address for whom the attestation is created (optional, defaults to signer's address)
 *
 * @example
 * ```ts
 * const unsignedAttestation: UnsignedLocationAttestation = {
 *   eventTimestamp: Math.floor(Date.now() / 1000),
 *   srs: "EPSG:4326",
 *   locationType: "geojson-point",
 *   location: '{"type":"Point","coordinates":[12.34,56.78]}',
 *   recipeTypes: [],
 *   recipePayloads: [],
 *   mediaTypes: ["image/jpeg"],
 *   mediaData: ["ipfs://QmXyz..."],
 *   memo: "Testing location attestation at Central Park",
 *   revocable: true,
 *   recipient: "0x1234..."
 * };
 * ```
 */
export interface UnsignedLocationAttestation {
  // EAS-required fields
  readonly eventTimestamp: number;
  readonly srs: string;
  readonly locationType: string;
  readonly location: string;
  readonly recipeType: string[];
  readonly recipePayload: string[];
  readonly mediaType: string[];
  readonly mediaData: string[];
  readonly memo?: string;
  readonly expirationTime?: number;
  readonly revocable?: boolean;

  // Additional convenience fields
  readonly recipient?: string;

  // Optional extension metadata for internal use
  readonly _extensions?: {
    location?: string;
    media?: string[];
  };

  // Optional original inputs for reference/debugging
  readonly _originalInputs?: {
    location?: unknown;
    media?: unknown[];
  };
}

/**
 * OffchainLocationAttestation represents a location attestation that has been signed using EIP-712
 * but not registered on a blockchain.
 *
 * It extends UnsignedLocationAttestation with signature-related fields for cryptographic verification.
 * This type belongs to the offchain workflow.
 *
 * @property uid - Unique identifier derived from hashing the signed data
 * @property signature - EIP-712 signature created by the attester
 * @property signer - Ethereum address of the signer (the account that created the signature)
 * @property publications - Optional records of where the attestation has been published (e.g., IPFS)
 *
 * @example
 * ```ts
 * const offchainAttestation: OffchainLocationAttestation = {
 *   // All UnsignedLocationAttestation fields...
 *   eventTimestamp: Math.floor(Date.now() / 1000),
 *   srs: "EPSG:4326",
 *   // Plus signature-related fields
 *   uid: "0xabcd1234...",
 *   signature: "0x1234abcd...",
 *   signer: "0x5678...",
 *   version: "astral-core-v0.1.0",
 *   publications: [{
 *     storageType: "ipfs",
 *     reference: "QmXyz...",
 *     publishedAt: Math.floor(Date.now() / 1000)
 *   }]
 * };
 * ```
 */
export interface OffchainLocationAttestation extends UnsignedLocationAttestation {
  // EAS signature fields
  readonly uid: string;
  readonly signature: string; // CLAUDE: Is this correct?
  // signature may be an object with { v: signature.v, r: signature.r, s: signature.s } ???
  // I think this is from th EAS SDK — https://github.com/ethereum-attestation-service/eas-sdk/blob/ef99ad85754fa482610b20170e72b41a8333bf04/src/offchain/typed-data-handler.ts#L147C35-L147C86
  readonly signer: string;
  readonly version: string; // For now, this is astral-core-v0.1.0. We are planning out a versioning system for the Location Attestation Protocol.
  // https://github.com/DecentralizedGeo/location-proofs/issues/4
  // Storage-related fields
  readonly publications?: PublicationRecord[];
}

/**
 * OnchainLocationAttestation represents a location attestation that has been registered on a blockchain
 * via an instance of an EAS contract.
 *
 * It extends UnsignedLocationAttestation with blockchain-related fields for on-chain verification.
 * This type belongs to the onchain workflow.
 *
 * @property uid - Unique identifier generated by the EAS contract
 * @property chain - Name of the blockchain where the attestation is stored (e.g., "sepolia", "celo")
 * @property chainId - Numeric ID of the blockchain (see config/EAS-config.json for supported chains)
 * @property txHash - Transaction hash of the attestation transaction
 * @property blockNumber - Block number in which the transaction was included
 * @property attester - Ethereum address that submitted the attestation
 * @property revocable - Whether the attestation can be revoked
 * @property revoked - Whether the attestation has been revoked
 *
 * @example
 * ```ts
 * const onchainAttestation: OnchainLocationAttestation = {
 *   // All UnsignedLocationAttestation fields...
 *   eventTimestamp: Math.floor(Date.now() / 1000),
 *   srs: "EPSG:4326",
 *   // Plus blockchain-related fields
 *   uid: "0xabcd1234...",
 *   chain: "sepolia",
 *   chainId: 11155111,
 *   txHash: "0x5678...",
 *   blockNumber: 12345678,
 *   attester: "0x9abc...",
 *   revocable: true,
 *   revoked: false
 * };
 * ```
 */
export interface OnchainLocationAttestation extends UnsignedLocationAttestation {
  // EAS onchain fields
  readonly uid: string;
  readonly attester: string;

  // Blockchain details
  readonly chain: string;
  readonly chainId: number;
  readonly txHash: string;
  readonly blockNumber: number;
  readonly revocable: boolean;
  readonly revoked: boolean;
}

/**
 * LocationAttestation represents either an OffchainLocationAttestation or an OnchainLocationAttestation.
 *
 * This union type allows for handling both kinds of attestations with the same interface
 * where appropriate, with type guards to safely narrow to the specific type.
 *
 * Use the type guards `isOffchainLocationAttestation` and `isOnchainLocationAttestation`
 * to determine which specific type a LocationAttestation instance is.
 */
export type LocationAttestation = OffchainLocationAttestation | OnchainLocationAttestation;

/**
 * PublicationRecord represents a reference to where an offchain attestation has been published.
 *
 * @property storageType - The type of storage (e.g., "ipfs", "url")
 * @property reference - The storage reference (e.g., CID, URL)
 * @property publishedAt - When the attestation was published
 * @property metadata - Optional additional metadata about the storage
 */
export interface PublicationRecord {
  readonly storageType: 'ipfs' | 'url' | string;
  readonly reference: string;
  readonly publishedAt: number;
  readonly metadata?: Record<string, unknown>; // CLAUDE: What is this for???
}

/**
 * LocationAttestationInput defines the parameters for creating a new location attestation.
 *
 * This interface provides a developer-friendly way to specify location data
 * and other attestation attributes, which will be converted to the appropriate format
 * for the EAS schema.
 *
 * @property location - Location data in various formats (GeoJSON, WKT, coordinate pair, H3)
 * @property locationType - Recommended hint about the format of the location data
 * @property targetLocationFormat - Optional identifier specifying the format the location data should be converted to.
 * @property timestamp - When the location event occurred (defaults to current time)
 * @property media - Optional media attachments
 * @property memo - Optional textual note
 * @property recipient - Optional Ethereum address for whom the attestation is created
 */
export interface LocationAttestationInput {
  // Location data (flexible format)
  readonly location: unknown;
  readonly locationType?: string;
  readonly targetLocationFormat?: string;
  // Timing
  readonly timestamp?: Date;

  // Media attachments
  readonly media?: MediaInput[];

  // Additional fields
  readonly memo?: string;
  readonly recipient?: string;
}

/**
 * MediaInput represents a media attachment for a location attestation.
 *
 * @property mediaType - MIME type of the media (e.g., "image/jpeg", "video/mp4")
 * @property data - The media data as a base64 string or storage reference
 * @property metadata - Optional additional metadata about the media
 */
export interface MediaInput {
  readonly mediaType: string;
  readonly data: string;
  readonly metadata?: Record<string, unknown>; // CLAUDE: What is this for???
}

/**
 * AttestationOptions defines common options for creating location attestations.
 *
 * @property revocable - Whether the attestation can be revoked (default depends on the workflow)
 * @property expirationTime - When the attestation expires (default is no expiration)
 * @property subject - Optional recipient address (if different from the transaction sender)
 */
export interface AttestationOptions {
  readonly revocable?: boolean;
  readonly expirationTime?: Date;
  readonly subject?: string;
}

/**
 * OffchainAttestationOptions extends AttestationOptions with offchain-specific settings.
 *
 * This interface belongs to the offchain workflow.
 *
 * @property signer - Optional custom signer to use instead of the default
 * @property privateKey - Optional private key to create an in-memory signer - not recommended!
 * @property schema - Optional schema override for this specific attestation
 */
export interface OffchainAttestationOptions extends AttestationOptions, SchemaOverrideOptions {
  readonly signer?: unknown; // Will be refined to ethers.Signer once we have the dependency
  readonly privateKey?: string;
}

/**
 * OnchainAttestationOptions extends AttestationOptions with onchain-specific settings.
 *
 * This interface belongs to the onchain workflow.
 *
 * @property chain - Which blockchain to register the attestation on
 * @property provider - Optional custom provider to use instead of the default
 * @property signer - Optional custom signer to use instead of the default
 * @property txOverrides - Optional transaction parameter overrides
 * @property allowDifferentSigner - Whether to allow the transaction sender to differ from the attestation signer
 * @property schema - Optional schema override for this specific attestation
 */
export interface OnchainAttestationOptions extends AttestationOptions, SchemaOverrideOptions {
  readonly chain?: string;
  readonly provider?: unknown; // Will be refined to ethers.Provider once we have the dependency
  readonly signer?: unknown; // Will be refined to ethers.Signer once we have the dependency
  readonly txOverrides?: Record<string, unknown>;
  readonly allowDifferentSigner?: boolean;
}

/**
 * AttestationQuery defines filters for retrieving location attestations.
 *
 * @property uid - Filter by specific attestation UID
 * @property bbox - Bounding box [minLon, minLat, maxLon, maxLat]
 * @property timeRange - Filter by creation time range
 * @property chain - Filter by blockchain
 * @property attester - Filter by attester addresses
 * @property limit - Maximum number of results to return
 * @property offset - Pagination offset
 */
export interface AttestationQuery {
  readonly uid?: string;
  readonly bbox?: [number, number, number, number];
  readonly timeRange?: [Date, Date];
  readonly chain?: string;
  readonly attester?: Array<string>;
  readonly limit?: number;
  readonly offset?: number;
}

/**
 * LocationAttestationCollection represents a collection of location attestations
 * returned from a query operation.
 *
 * @property attestations - The array of location attestations
 * @property total - Total number of matching attestations
 * @property pageSize - Current page size
 * @property currentPage - Current page number (1-based)
 * @property totalPages - Total number of pages
 * @property hasNextPage - Whether more results exist
 * @property hasPrevPage - Whether previous results exist
 * @property query - The original query parameters
 */
export interface LocationAttestationCollection {
  readonly attestations: LocationAttestation[];
  readonly total: number;
  readonly pageSize: number;
  readonly currentPage: number;
  readonly totalPages: number;
  readonly hasNextPage: boolean;
  readonly hasPrevPage: boolean;
  readonly query: AttestationQuery;
}

/**
 * VerificationResult represents the result of verifying a location attestation.
 *
 * @property isValid - Whether the attestation is valid
 * @property revoked - Whether the attestation has been revoked (for onchain attestations)
 * @property signerAddress - The recovered address of the signer
 * @property attestation - The verified attestation
 * @property reason - The reason the attestation is invalid (if applicable)
 */
export interface VerificationResult {
  readonly isValid: boolean;
  readonly revoked?: boolean;
  readonly signerAddress?: string;
  readonly attestation?: LocationAttestation;
  readonly reason?: string;
}

/**
 * VerificationError enumeration for specific verification failure reasons.
 */
export enum VerificationError {
  INVALID_SIGNATURE = 'INVALID_SIGNATURE',
  ATTESTATION_REVOKED = 'ATTESTATION_REVOKED',
  ATTESTATION_EXPIRED = 'ATTESTATION_EXPIRED',
  ATTESTATION_NOT_FOUND = 'ATTESTATION_NOT_FOUND',
  SCHEMA_MISMATCH = 'SCHEMA_MISMATCH',
  SIGNER_MISMATCH = 'SIGNER_MISMATCH',
  CHAIN_CONNECTION_ERROR = 'CHAIN_CONNECTION_ERROR',
}

/**
 * AstralSDKConfig defines the configuration options for AstralSDK.
 *
 * @property defaultChain - Default blockchain for onchain operations (e.g., 'sepolia', 'celo')
 * @property chainId - Default chain ID for operations (e.g., 11155111 for Sepolia, 42220 for Celo)
 * @property mode - Default storage mode for new attestations
 * @property provider - Ethereum provider for blockchain operations
 * @property signer - Ethereum signer for creating signatures
 * @property apiKey - Astral API key for queries
 * @property endpoint - Override Astral API base URL
 * @property debug - Enable debug mode
 * @property schemas - Pre-registered schemas for validation caching at SDK initialization
 * @property defaultSchema - Default schema to use when no schema is specified per-method
 * @property strictSchemaValidation - If true, throws ValidationError for non-conformant schemas (default: false)
 *
 * @example
 * ```typescript
 * // Multi-schema configuration
 * const sdk = new AstralSDK({
 *   signer: wallet,
 *   chainId: 11155111,
 *   schemas: [LOCATION_V1_SCHEMA, customParcelSchema],
 *   defaultSchema: LOCATION_V1_SCHEMA,
 *   strictSchemaValidation: true
 * });
 * ```
 */
export interface AstralSDKConfig {
  readonly defaultChain?: string;
  readonly chainId?: number;
  readonly mode?: 'onchain' | 'offchain' | 'ipfs';
  readonly provider?: unknown; // Will be refined to ethers.Provider
  readonly signer?: unknown; // Will be refined to ethers.Signer
  readonly apiKey?: string;
  readonly endpoint?: string;
  readonly debug?: boolean;
  readonly schemas?: readonly RuntimeSchemaConfig[];
  readonly defaultSchema?: RuntimeSchemaConfig;
  readonly strictSchemaValidation?: boolean;
}

/**
 * OffchainSignerConfig defines configuration options for the OffchainSigner.
 *
 * This configuration belongs to the offchain workflow.
 *
 * @property signer - Ethereum signer for creating signatures
 * @property privateKey - Private key to create an in-memory signer
 * @property chainId - ID of the blockchain to sign for
 * @property schemaUID - EAS schema UID for location attestations
 */
export interface OffchainSignerConfig {
  readonly signer?: unknown; // ethers.Signer
  readonly privateKey?: string;
  readonly chainId?: number;
  readonly schemaUID?: string;
}

/**
 * OnchainRegistrarConfig defines configuration options for the OnchainRegistrar.
 *
 * This configuration belongs to the onchain workflow.
 *
 * @property provider - Ethereum provider for blockchain operations
 * @property signer - Ethereum signer for creating transactions
 * @property chain - Default blockchain for registration
 * @property contractAddress - EAS contract address
 * @property schemaUID - EAS schema UID for location attestations
 */
export interface OnchainRegistrarConfig {
  readonly provider?: unknown; // Will be refined to ethers.Provider
  readonly signer?: unknown; // Will be refined to ethers.Signer
  readonly chain?: string;
  readonly contractAddress?: string;
  readonly schemaUID?: string;
}

/**
 * StorageConfig defines configuration options for storage adapters.
 *
 * @property type - Type of storage adapter
 * @property endpoint - Storage service endpoint
 * @property apiKey - API key for the storage service
 */
export interface StorageConfig {
  readonly type: 'ipfs' | 'url' | string;
  readonly endpoint?: string;
  readonly apiKey?: string;
}

/**
 * IPFSStorageConfig extends StorageConfig with IPFS-specific options.
 *
 * @property gateway - IPFS gateway URL
 * @property pinning - Whether to pin content to the IPFS node
 */
export interface IPFSStorageConfig extends StorageConfig {
  readonly type: 'ipfs';
  readonly gateway?: string;
  readonly pinning?: boolean;
}

/**
 * RuntimeSchemaConfig defines the essential configuration for an EAS schema
 * at runtime. This is the minimal configuration needed for multi-schema support.
 *
 * For comprehensive schema metadata (version, networks, field types), use the
 * static SchemaConfig from `@astral-protocol/sdk/schemas`.
 *
 * @property uid - The unique identifier of the schema as registered with EAS
 * @property rawString - The raw schema definition string for use with EAS SchemaEncoder
 *
 * @example
 * ```typescript
 * const customSchema: RuntimeSchemaConfig = {
 *   uid: "0x1234...",
 *   rawString: "uint256 eventTimestamp,string srs,string locationType,string location"
 * };
 *
 * await sdk.signOffchainLocationAttestation(unsigned, { schema: customSchema });
 * ```
 */
export interface RuntimeSchemaConfig {
  readonly uid: string;
  readonly rawString: string;
}

/**
 * SchemaOverrideOptions allows specifying a custom schema for attestation operations.
 *
 * @property schema - The schema configuration to use instead of the default
 */
export interface SchemaOverrideOptions {
  readonly schema?: RuntimeSchemaConfig;
}
