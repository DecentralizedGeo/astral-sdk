## Data Model & Type Definitions

In **v0.1**, we focus on core location proofs (locations + media). **Recipe** fields are kept empty or unused. However, our data model still contains placeholders for them in alignment with Astral's EAS schema design. This way, we can pass them to the `SchemaEncoder` or return them if the user chooses to fill them for future expansions.

### EAS-Required Fields Overview

The **Astral** schema, as typically registered on EAS for location proofs, includes (in some order):

1. **`eventTimestamp (uint256)`**  
   - A numeric timestamp of the event (usually the "claimed time" the location proof refers to).  
2. **`srs (string)`**  
   - Spatial reference system (e.g. `"EPSG:4326"`), hard-coded in v0.1. (`EPSG:<SRID>` is the preferred format.)
3. **`location (string)`**  
   - The location data in a canonical string form (e.g. GeoJSON, WKT).  
4. **`locationType (string)`**  
   - Identifier for how `location` is formatted (e.g., `"geojson-point"`, `"wkt-polygon"`, `"h3"`).  
5. **`recipeTypes (string[])`**  
   - Not used in v0.1; set to `[]` or empty.  
6. **`recipePayloads (string[])`**  
   - Not used in v0.1; set to `[]` or empty.  
7. **`mediaTypes (string[])`**  
   - MIME types for each media attachment.  
8. **`mediaData (string[])`**  
   - Data for each corresponding media attachment (base64 strings, IPFS CIDs, etc.).  
9. **`memo (string)`**  
   - Optional textual note from the user.  
10. **`expirationTime (uint256)`**  
    - An optional future timestamp after which the proof is invalid.  
11. **`revocable (bool)`**  
    - Whether the proof can be revoked by the attester at any time.

### 1. `UnsignedLocationProof`

Represents a location proof **before** cryptographic signing. Produced by `buildLocationProof()`.

```ts
export interface UnsignedLocationProof {
  // EAS-required fields directly or indirectly:

  eventTimestamp: number;           // numeric, derived from user-supplied date (default: now)
  srs: string;                      // likely "WGS84" in v0.1
  location: string;                 // final canonical string form (e.g. GeoJSON)
  locationType: string;             // e.g. "geojson-point", "wkt", "h3"

  recipeTypes: string[];            // always empty in v0.1
  recipePayloads: string[];         // always empty in v0.1

  mediaTypes: string[];             // from user's media attachments
  mediaData: string[];              // from user's base64 / IPFS references

  memo?: string;                    // optional textual note
  expirationTime?: number;          // default: 0 if omitted
  revocable?: boolean;              // default: true or false if omitted

  // Additional convenience fields (NOT directly in EAS schema, but used to fill them):
  
  // For example, user can pass location as { lat, lon }, we store that in a helper until we transform it to 'location' string.
  // If desired, you can keep them if you want easy debugging or re-building.
  
  // e.g. the address for whom this proof is created
  recipient?: string;   // The EAS 'attestation recipient'
  
  // Possibly store raw media inputs if we want to regenerate mediaData
  // ...
}
```

**Notes:**

- **`eventTimestamp`** correlates to user's claimed time (from `timestamp?: Date` in user input), not necessarily the block time.  
- **`srs`** `"EPSG:4326"` for v0.1. (Location processing logic should check — if the user passes a different SRID, we should reproject the coordinates to 4326 and raise a warning.)  
- **`location`** is a string after we parse user input (GeoJSON, WKT, or an H3 index). Note that in the future we intend to support CIDs / pointers to offchain location data, i.e. a large polygon unsuitable to store onchain.  
- **`recipeTypes` & `recipePayloads`** are placeholders but remain empty in v0.1 so that the EAS schema can still be satisfied.  
- **`mediaTypes` & `mediaData`** store parallel arrays for MIME types and the actual media content or references. This is how EAS expects them.  
- **`memo`, `expirationTime`, `revocable`** are optional but must be set to some default for EAS if omitted.  
- **`recipient`** is for the EAS "attestation recipient" field. If omitted, the SDK sets it to the signer's address at signing time.  

This structure is how we feed EAS during encoding. The SDK ensures each item is in the correct order and format for `SchemaEncoder.encodeData()`.

---

### 2. `LocationProof` Types

The Astral SDK works with two distinct types of location proofs: **offchain proofs** (signed using EIP-712) and **onchain proofs** (registered on a blockchain). These are separate entities with different UIDs and properties.

#### 2.1 `OffchainLocationProof`

An offchain proof created by `signOffchainLocationProof()`. This aligns with the EAS SDK's `SignedOffchainAttestation` structure.

```ts
export interface OffchainLocationProof {
  // EAS schema fields (same as in UnsignedLocationProof)
  eventTimestamp: number;           // numeric timestamp of the event
  srs: string;                      // spatial reference system (e.g., "EPSG:4326")
  location: string;                 // location data in canonical string form
  locationType: string;             // format identifier (e.g., "geojson-point")
  
  recipeTypes: string[];            // always empty in v0.1
  recipePayloads: string[];         // always empty in v0.1
  
  mediaTypes: string[];             // MIME types for media attachments
  mediaData: string[];              // media content or references
  
  memo?: string;                    // optional textual note
  expirationTime?: number;          // expiration timestamp
  revocable: boolean;               // whether proof can be revoked
  recipient: string;                // the attestation recipient (required in signed proof)

  // EAS signature fields (from SignedOffchainAttestation)
  uid: string;                      // unique identifier derived from hashing the data and signature
  signature: string;                // EIP-712 signature
  signer: string;                   // address of the signer
  version?: number;                 // attestation version (if applicable)
  
  // Storage-related fields (our additions)
  publications?: PublicationRecord[]; // off-chain storage references
  
  // Extension metadata (our additions)
  _extensions?: {
    location?: string;              // ID of location extension used
    media?: string[];               // IDs of media extensions used
  };
  
  // Original inputs (for reference/debugging)
  _originalInputs?: {
    location?: any;                 // Original location input
    media?: any[];                  // Original media inputs
  };
}

// For off-chain storage references
export interface PublicationRecord {
  storageType: 'ipfs' | 'url' | string; // Storage mechanism
  reference: string;                // CID, URL, or other reference
  publishedAt: number;              // When it was published
  metadata?: Record<string, any>;   // Any additional storage metadata
}
```

#### 2.2 `OnchainLocationProof`

An onchain proof created by `registerOnchainLocationProof()`. This represents an attestation registered on a blockchain via the EAS contract.

```ts
export interface OnchainLocationProof {
  // EAS schema fields (same as in UnsignedLocationProof)
  eventTimestamp: number;           // numeric timestamp of the event
  srs: string;                      // spatial reference system (e.g., "EPSG:4326")
  location: string;                 // location data in canonical string form
  locationType: string;             // format identifier (e.g., "geojson-point")
  
  recipeTypes: string[];            // always empty in v0.1
  recipePayloads: string[];         // always empty in v0.1
  
  mediaTypes: string[];             // MIME types for media attachments
  mediaData: string[];              // media content or references
  
  memo?: string;                    // optional textual note
  expirationTime?: number;          // expiration timestamp
  revocable: boolean;               // whether proof can be revoked
  recipient: string;                // the attestation recipient

  // EAS onchain fields
  uid: string;                      // unique identifier from blockchain transaction
  attester: string;                 // address that created the attestation
  
  // Blockchain details
  chain: string;                    // blockchain where the attestation is stored
  txHash: string;                   // transaction hash of the attestation
  blockNumber: number;             // block the transaction was included in
  
  // Extension metadata (our additions)
  _extensions?: {
    location?: string;              // ID of location extension used
    media?: string[];               // IDs of media extensions used
  };
  
  // Original inputs (for reference/debugging)
  _originalInputs?: {
    location?: any;                 // Original location input
    media?: any[];                  // Original media inputs
  };
}
```

#### 2.3 `LocationProof` (Common Type)

For convenience, we define a union type that can represent either kind of proof:

```ts
export type LocationProof = OffchainLocationProof | OnchainLocationProof;

// Type guard to check if a proof is offchain
export function isOffchainLocationProof(proof: LocationProof): proof is OffchainLocationProof {
  return 'signature' in proof;
}

// Type guard to check if a proof is onchain
export function isOnchainLocationProof(proof: LocationProof): proof is OnchainLocationProof {
  return 'txHash' in proof;
}
```

**Key Points:**  
- Offchain and onchain proofs are distinct entities with different UIDs
- Offchain proofs have an EIP-712 **`signature`** and UID derived from hashing the data and signature
- Onchain proofs have a blockchain **`txHash`** and UID generated by the blockchain transaction
- They cannot be directly converted between types while preserving identity
- Each type has properties specific to its storage mechanism
- The union type allows for handling either kind of proof in common code

---

### 3. **Location & Media Extensions in v0.1**

While the **EAS** schema expects `location`, `mediaTypes`, and `mediaData` to be strings, the user might supply them in more developer-friendly formats. Hence, we have built-in location & media extensions (or simply built-in logic) that transform user input into the final strings.

1. **Location**  
   - The user might pass `GeoJSON.Geometry`, WKT, or `{ lat, lon }`. The SDK must produce a single string in `UnsignedLocationProof.location`.  
   - `locationType` is set accordingly (e.g., `"geojson-point"`, `"wkt-polygon"`, `"h3"`).  
   - `srs` is always `"EPSG:4326"` in v0.1.  

2. **Media**  
   - The user passes an array of `MediaInput` objects:
     ```ts
     interface MediaInput {
       mediaType: string;   // e.g., 'image/jpeg'
       data: string;        // base64 or IPFS link
       // additional fields if needed
     }
     ```
   - The SDK splits these into `mediaTypes` (one for each item) and `mediaData` (the raw or reference data). Large media may be automatically offloaded to IPFS if desired.

**Recipes** (like `recipeTypes` & `recipePayloads`) are omitted or empty in v0.1. In future versions, the user might fill them or rely on recipe extensions.

---

### 4. **RegistrationRecord**

When a proof is **registered** on-chain, the result is stored in the `LocationProof.registrations` array:

```ts
export interface RegistrationRecord {
  chain: string;           // e.g. "celo", "base", "arbitrum"
  txHash: string;          // transaction hash from EAS attest
  blockNumber: number;
}
```

A single `LocationProof` can be anchored on multiple chains at different times if desired.

---

### 5. **EAS Attestation Data Flow**

When creating or registering a proof, we eventually feed these fields into the EAS SDK's `SchemaEncoder`. The required order in Astral's schema might look like:

1. `eventTimestamp (uint256)`  
2. `srs (string)`  
3. `location (string)`  
4. `locationType (string)`  
5. `recipeTypes (string[])`  
6. `recipePayloads (string[])`  
7. `mediaTypes (string[])`  
8. `mediaData (string[])`  
9. `memo (string)`  
10. `expirationTime (uint256)`  
11. `revocable (bool)`

The SDK ensures each property from `UnsignedLocationProof` or `LocationProof` is placed in that order when calling `encodeData`. That way, the final on-chain or off-chain attestation matches the official Astral schema.

---

### 6. **Error Handling**

The SDK implements a comprehensive hierarchical error system to support its modular architecture:

```ts
// Base error class
export class AstralError extends Error {
  public code?: string;
  public cause?: Error;
  public context?: Record<string, any>;
  
  constructor(
    message: string,
    options?: {
      code?: string;
      cause?: Error;
      context?: Record<string, any>;
    }
  ) {
    super(message);
    this.name = 'AstralError';
    this.code = options?.code;
    this.cause = options?.cause;
    this.context = options?.context;
  }
}

// Extension-specific validation errors
export class ValidationError extends AstralError {
  constructor(message: string, options?: any) {
    super(message, { ...options, code: 'VALIDATION_ERROR' });
    this.name = 'ValidationError';
  }
}

export class LocationValidationError extends ValidationError {
  constructor(message: string, options?: any) {
    super(message, { ...options, code: 'LOCATION_VALIDATION_ERROR' });
    this.name = 'LocationValidationError';
  }
}

export class MediaValidationError extends ValidationError {
  constructor(message: string, options?: any) {
    super(message, { ...options, code: 'MEDIA_VALIDATION_ERROR' });
    this.name = 'MediaValidationError';
  }
}

export class RecipeValidationError extends ValidationError {
  constructor(message: string, options?: any) {
    super(message, { ...options, code: 'RECIPE_VALIDATION_ERROR' });
    this.name = 'RecipeValidationError';
  }
}

// Signature/blockchain errors
export class SignerError extends AstralError {
  constructor(message: string, options?: any) {
    super(message, { ...options, code: 'SIGNER_ERROR' });
    this.name = 'SignerError';
  }
}

export class SignerNotFoundError extends SignerError {
  constructor(message = 'No suitable signer found', options?: any) {
    super(message, { ...options, code: 'SIGNER_NOT_FOUND' });
    this.name = 'SignerNotFoundError';
  }
}

export class SigningError extends SignerError {
  constructor(message: string, options?: any) {
    super(message, { ...options, code: 'SIGNING_ERROR' });
    this.name = 'SigningError';
  }
}

// Storage errors
export class StorageError extends AstralError {
  constructor(message: string, options?: any) {
    super(message, { ...options, code: 'STORAGE_ERROR' });
    this.name = 'StorageError';
  }
}

export class PublishError extends StorageError {
  constructor(message: string, options?: any) {
    super(message, { ...options, code: 'PUBLISH_ERROR' });
    this.name = 'PublishError';
  }
}

export class RegistrationError extends StorageError {
  constructor(message: string, options?: any) {
    super(message, { ...options, code: 'REGISTRATION_ERROR' });
    this.name = 'RegistrationError';
  }
}

// Network errors
export class NetworkError extends AstralError {
  constructor(message: string, options?: any) {
    super(message, { ...options, code: 'NETWORK_ERROR' });
    this.name = 'NetworkError';
  }
}

export class ChainConnectionError extends NetworkError {
  constructor(message: string, options?: any) {
    super(message, { ...options, code: 'CHAIN_CONNECTION_ERROR' });
    this.name = 'ChainConnectionError';
  }
}

export class AstralAPIError extends NetworkError {
  public status?: number;
  
  constructor(message: string, options?: any) {
    super(message, { ...options, code: 'API_ERROR' });
    this.name = 'AstralAPIError';
    this.status = options?.status;
  }
}

// Resource errors
export class NotFoundError extends AstralError {
  constructor(message = 'Resource not found', options?: any) {
    super(message, { ...options, code: 'NOT_FOUND' });
    this.name = 'NotFoundError';
  }
}

export class VerificationError extends AstralError {
  constructor(message: string, options?: any) {
    super(message, { ...options, code: 'VERIFICATION_ERROR' });
    this.name = 'VerificationError';
  }
}
```

**Examples:**

- **`LocationValidationError`**: When coordinates are invalid (e.g., latitude outside [-90, 90])
- **`MediaValidationError`**: When media type is unsupported or data is corrupt
- **`SignerNotFoundError`**: When attempting to sign without a configured signer
- **`AstralAPIError`**: When the Astral API returns an error (e.g., 404, 429 rate limit)
- **`ChainConnectionError`**: When unable to connect to the blockchain provider
- **`RegistrationError`**: When on-chain registration fails due to transaction issues

---

## Summary

1. **UnsignedLocationProof** – Contains the **EAS-required** fields (eventTimestamp, srs, location, etc.) along with optional convenience fields (`recipient?`). This is what we build from user input, ensuring all mandatory EAS attributes are set for encoding.  
2. **OffchainLocationProof** – Represents a proof signed using EIP-712 for offchain use. Contains a **`signature`**, offchain-generated **`uid`**, and **`signer`** along with optional publishing records.  
3. **OnchainLocationProof** – Represents a proof registered on a blockchain via EAS. Contains blockchain-specific fields like **`txHash`**, onchain-generated **`uid`**, and **`attester`**.  
4. **LocationProof** – A union type that can represent either an offchain or onchain proof, with utility functions to determine which type a proof is.  
5. **Location & Media** – The user can supply these in varied formats, but the SDK transforms them into the EAS schema's string arrays (`location`, `mediaTypes`, `mediaData`).  
6. **No Recipe Support in v0.1** – We set `recipeTypes` and `recipePayloads` to empty, but they exist in the data model for schema compatibility.  
7. **Extensions** – In v0.1, only location/media transformations are relevant; further expansions (recipes) come later.  
8. **Error Classes** – Provide clear, typed errors for validation, API interaction, or on-chain issues.

This structure ensures the SDK can produce valid EAS attestations (on-chain or off-chain) while remaining **developer-friendly** and extensible for future expansions in Astral's location-proof protocol.