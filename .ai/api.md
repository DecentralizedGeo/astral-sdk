## API Design & Specifications  

The SDK's API is designed to be **intuitive and fluent** for developers, following the principle of being *idiomatic* to TypeScript/JavaScript usage  
([Reference: Azure SDK - Idiomatic TypeScript](https://azure.github.io/azure-sdk/typescript_introduction.html#:~:text=Idiomatic)).

Below is an outline of the **AstralSDK class** and its methods, with a particular focus on:

1. **Creating Location Proofs** (Build + Sign)
2. **Writing Location Proofs** (Publish Offchain + Register Onchain)
3. **Fetching Location Proofs** (Placeholder)
4. **Verifying Location Proofs** (Placeholder)

---

## AstralSDK Class

This is the primary class developers will instantiate and use. It may be constructed with an optional configuration object specifying default networks, signers, etc.

### Constructor: `new AstralSDK(options?: AstralSDKOptions)`

- **`AstralSDKOptions`** may include:
  - **`defaultChain: string`** – e.g., `"sepolia"` or `"celo"`; default network for on-chain operations.
  - **`mode: "onchain" | "offchain" | "ipfs"`** – default storage mode for new attestations. (May not be used directly in v0.1.)
  - **`provider?: ethers.Provider` or `signer?: ethers.Signer`**  
    1. **Prefer a Provided Signer:** If a signer is passed in, use it for on-chain or off-chain signing.  
    2. **Fallback to Environment Configuration:** If no signer is provided, attempt to load a private key from environment (e.g., `process.env.PRIVATE_KEY`) and create an internal signer.  
    3. **Mandatory Check:** If neither is available, throw an error when an attestation is created or signed.
  - **`apiKey?: string`** – Astral API key (if required for queries).
  - **`endpoint?: string`** – Override Astral API base URL (default: `https://api.astral.global`).

- **Properties**:
  - **`.extensions`** – An instance of `ExtensionManager` that holds registered location, media, (and future recipe) extensions. Built-in ones (like coordinate vs. GeoJSON vs. WKT) come pre-registered.
  - **`.eas`** – An internal `EASClient` configured to the selected chain(s).
  - **`.api`** – An `AstralApiClient` for Astral API calls (querying proofs, etc.).

---

## Creating Location Proofs

The AstralSDK provides methods for creating both **offchain proofs** (signed using EIP-712) and **onchain proofs** (registered on a blockchain). These are two distinct attestation paths that result in different UIDs, but the core proof data remains the same.

### 1. `buildLocationProof(input: ProofInput): UnsignedLocationProof`

**Purpose:**  
Assemble and normalize all relevant location proof data into an **unsigned** object. This object has no cryptographic signature and cannot be verified on or off chain until signed.

**Input (`ProofInput`):**

- **`recipient?: string`**  
  - The Ethereum address for whom the proof is created. Defaults to signer's address if omitted.  
  - Example: `'0x1234abcd...'`
- **`timestamp?: Date`**  
  - Defaults to the current time if omitted.
- **`location`:**  
  - Accepts various formats: a simple `{ lat, lon }`, a GeoJSON object, a WKT string, or an H3 index.  
  - The SDK's location extensions convert these to the canonical form required by EAS.
- **`locationType?: string`**  
  - An optional identifier specifying how to interpret `location`. For instance, `'geojson-point'`, `'wkt-polygon'`, or `'h3'`.
- **`targetLocationFormat?: string`**
  - An optional identifier specifying the format the location data should be converted to. 
- **`media?: MediaInput[]`**  
  - Optional media attachments (images, videos, etc.). Each must specify a `mediaType` (MIME) and `data`.
- **`memo?: string`**  
  - An optional textual note.
- **`expiration?: Date`** and **`revocable?: boolean`**  
  - EAS fields that determine if/when the proof expires or can be revoked. 
  - If omitted, defaults are set based on EAS's schema.

**Behavior:**

1. **Validation & Normalization:**  
   - If `location` is a coordinate pair, convert it to a standard GeoJSON string.  
   - Ensure `media` types are recognized or fallback to a default extension.  
   - Convert `Date` fields to Unix timestamps if needed.

2. **Assembly:**  
   - Uses the EAS `SchemaEncoder` (through an internal utility) to produce an object with all relevant fields in the correct format.  
   - Stores these fields in an **`UnsignedLocationProof`** object.

**Output (`UnsignedLocationProof`):**  
- Contains all normalized fields needed for an attestation: `location`, `timestamp`, `media`, `recipient`, etc.  
- **No** signature or UID yet.

---

### 2. `signOffchainLocationProof(unsignedProof: UnsignedLocationProof, options?: SigningOptions): OffchainLocationProof`

**Purpose:**  
Attach an EIP-712 cryptographic signature to the previously built proof, creating a **fully signed** offchain location proof that can be verified and optionally published to IPFS or other storage.

**Input:**  
- **`unsignedProof: UnsignedLocationProof`**  
  - The output from `buildLocationProof`.  
- **`SigningOptions`** (optional):
  - **`signer?: ethers.Signer`** – overrides the signer from the SDK constructor.  
  - **`privateKey?: string`** – can be used to create an in-memory signer.  
  - If neither is provided, the SDK will attempt to use the fallback from the constructor or throw an error if none exists.

**Behavior:**  
1. **Signer Resolution:**  
   - Confirms that a signer is available (either from `signer`, `privateKey`, or the fallback in constructor).  
   - Throws if none is found.
2. **Signature Computation:**  
   - Uses EIP-712 (as defined by EAS) to sign the attestation data.  
   - Derives a `uid` from the hashed content + signature.
3. **Object Finalization:**  
   - Returns an **`OffchainLocationProof`** object containing all fields from the unsigned proof plus `signature` and `uid`.

**Output (`OffchainLocationProof`):**  
- All the proof's data.  
- The cryptographic signature.  
- A unique `uid` derived from that signature and data.

At this stage, the proof is fully signed and can be verified offchain. Developers can also **publish** it to IPFS or other storage at their discretion.

---

## Working with Location Proofs

After building an unsigned proof with `buildLocationProof`, there are two distinct paths:

### Offchain Path
1. **Sign** the proof with `signOffchainLocationProof` to create an offchain proof
2. Optionally **publish** it to storage (e.g., IPFS) with `publishOffchainLocationProof`

### Onchain Path
- **Register** the unsigned proof directly on a blockchain with `registerOnchainLocationProof`

These are separate workflows, each resulting in proofs with different UIDs.

### 3. `publishOffchainLocationProof(offchainProof: OffchainLocationProof, options?: PublishOptions): OffchainLocationProof`

**Purpose:**  
Offchain publication—most commonly uploading the proof (in JSON) to IPFS. This does **not** change the proof's core data (signature, uid) but augments it with metadata (e.g., CID).

**Input:**

- **`offchainProof: OffchainLocationProof`**  
  - A fully signed offchain proof with valid signature and UID.  
- **`PublishOptions?`** may include:  
  - **`storageMode: 'ipfs'`** – currently only IPFS is supported in v0.1.  
  - **`ipfsConfig?: { endpoint: string; apiKey?: string }`** – IPFS gateway or similar.  

**Behavior:**  
1. **Upload (if `storageMode` = `'ipfs'`):**  
   - Serializes `offchainProof` to JSON.  
   - Sends it to the configured IPFS endpoint or gateway.  
   - Receives a CID upon success.  
2. **Augmentation:**  
   - Appends a record or field (e.g., `offchainProof.publications[]`) containing `{ storageType: 'ipfs', cid }`.  
   - Alternatively, it can directly set `offchainProof.cid` if you prefer a single IPFS reference.  

**Output (`OffchainLocationProof`):**  
- **Same** `OffchainLocationProof` object, now with additional publication metadata (like `cid`).  
- Not a separate type—no new "published type" is required.  

*(Note: If you want an immutable approach, you could clone the object, but typically returning the same object with updated fields suffices.)*

---

### 4. `registerOnchainLocationProof(unsignedProof: UnsignedLocationProof, options?: RegistrationOptions): Promise<OnchainLocationProof>`

**Purpose:**  
Registers an unsigned location proof directly on the blockchain by submitting an attestation transaction to EAS. This creates a new onchain attestation with a blockchain-generated UID.

**Input:**  
- **`unsignedProof: UnsignedLocationProof`**  
  - An unsigned proof containing the location data to be attested onchain.  
- **`RegistrationOptions?`**:
  - **`chain?: string`** – which chain to register on (defaults to `defaultChain` in `AstralSDKOptions`).  
  - **`txOverrides?: TransactionOverrides`** – e.g., gas limit, gas price.  
  - **`allowDifferentSigner?: boolean`** – logs a warning if the current signer differs from the original proof signer; can override.

**Behavior:**  
1. **Signer Check:**  
   - Verifies that a valid signer is available for the blockchain transaction.
   - If no signer is available, throws a SignerNotFoundError.
2. **On-Chain Submission:**  
   - Uses `this.eas.attest(...)` or similar to submit the attestation data to EAS.  
   - Waits for the transaction to confirm, capturing the transaction hash and blockchain-generated UID.  
3. **Object Creation:**  
   - Creates a new `OnchainLocationProof` object with all original data plus chain-specific details.
   - Includes blockchain data such as `chain`, `txHash`, `blockNumber`.

**Output (Promise resolving an `OnchainLocationProof`):**  
- A new `OnchainLocationProof` object containing the attestation data and blockchain details.
- Includes a blockchain-generated `uid` that is unique to this onchain attestation.

*Note: This is a distinct type from `OffchainLocationProof`, as onchain and offchain proofs have different UIDs and cannot be directly converted between types.*

---

### Summary: Creating & Writing

1. **`buildLocationProof(...) => UnsignedLocationProof`**  
   - Gathers location, timestamp, media into a normalized structure for EAS.

2. **`signOffchainLocationProof(...) => OffchainLocationProof`**  
   - Cryptographically signs the data, yielding a final `OffchainLocationProof` with `signature` + `uid`.

3. **`publishOffchainLocationProof(...) => OffchainLocationProof`** (optional)  
   - Offchain publishing to IPFS (or future endpoints). Adds publication metadata but remains the same typed object.

4. **`registerOnchainLocationProof(...) => Promise<OnchainLocationProof>`** (optional)  
   - Registers the proof directly on a blockchain, creating a new `OnchainLocationProof` with a blockchain-generated UID.

This modular flow provides **maximum flexibility**. Developers can:

- Only build a proof if they want to prepare the data without signing or registering.
- Sign it offchain if they want cryptographic verification without blockchain costs.
- Publish an offchain proof to IPFS for discoverability without onchain costs.
- Register an unsigned proof directly onchain for fully trustless verification under EAS.

Below is an **expanded section** covering **Fetching** and **Verifying** location proofs, building on the **two-type approach** and **modular design** used elsewhere in the AstralSDK. The design assumes we can retrieve proofs from the Astral API (which indexes on-chain and off-chain proofs by UID) and optionally cross-check with EAS to confirm on-chain status or detect revocation.

---

## 5. Fetching Location Proofs

Astral provides a REST/OGC API that indexes location proofs by UID, location, time, chain, etc. The SDK's **fetch** methods leverage this API (and potentially EAS on-chain data) to return a typed `LocationProof` when possible.

### 5.1 `getLocationProof(uid: string, options?: FetchOptions): Promise<LocationProof>`

**Purpose:**  
Retrieve a single proof by its unique identifier (UID). The Astral API indexes proofs from on-chain and off-chain sources, so this lookup is the most straightforward way to fetch a known proof.

**Signature:**

```ts
async getLocationProof(
  uid: string,
  options?: FetchOptions
): Promise<LocationProof>
```

- **Input:**
  - **`uid: string`** – The unique 32-byte hex string or hashed identifier representing the proof, as stored on-chain or off-chain.
  - **`FetchOptions?`** – For future or advanced usage, could include:
    - **`includeMedia?: boolean`** – Attempt to fetch associated media links or data if the API supports it.
    - **`chain?: string`** – If you know the chain on which the attestation was created and want to confirm it, or skip chain detection.

- **Behavior:**
  1. **API Lookup:**  
     - Calls Astral's API endpoint for a single proof. For instance, `GET /location-proofs?uid={uid}` or the OGC variant (`/collections/location-proofs/items/{uid}`) if available.
     - Parses the returned JSON into a canonical representation. If the proof is found, we get fields like location data, signature, chain reference, etc.
  2. **Data Assembly:**  
     - Converts fields to match our `LocationProof` interface.  
       - If the JSON includes `signature` and `uid`, we treat it as a fully signed proof.  
       - If it only has partial data, we may attempt to interpret it or throw if incomplete.  
     - If `includeMedia` is true and Astral's API returns media references, we integrate them into the proof's `media` array.
  3. **Optional On-Chain Augmentation:**  
     - If `chain` is provided (or indicated in the proof data), we could optionally do an on-chain `getAttestation(uid)` call to see if there's additional info (revocation, block timestamp, etc.).  
     - If found, we can store it in the proof's internal `registrations` array or at least note the chain for further verification.

- **Output:**  
A `LocationProof` object. If the proof doesn't exist, the method either returns an error (e.g., 404 Not Found from the API) or throws a custom `ProofNotFoundError`.

**Example Usage:**

```ts
const proof = await astral.getLocationProof("0xabc123...");
console.log("Location:", proof.location);
console.log("Signature:", proof.signature);
```

---

### 5.2 `queryLocationProofs(query: ProofQuery, options?: FetchOptions): Promise<LocationProofCollection>`

**Purpose:**  
Fetch multiple proofs matching certain **geospatial** or **metadata** criteria, leveraging the OGC Features–style endpoints or Astral's custom filters.

**Signature:**

```ts
async queryLocationProofs(
  query: ProofQuery,
  options?: FetchOptions
): Promise<LocationProofCollection>
```

- **Inputs:**  
  - **`query: ProofQuery`**:  
    - **`bbox?: [number, number, number, number]`** – a bounding box ([minLon, minLat, maxLon, maxLat])  
    - **`timeRange?: [Date, Date]` or `datetime?: string`** – filter by creation/attestation time.  
    - **`chain?: string`** – filter by chain name (e.g., `'celo'`, `'base'`).  
    - **`attester?: Array<string>`** or `prover?: Arraystring` – filter by the address that created the proof.  
    - **`limit?: number`, `offset?: number`** – pagination parameters.  
    - And other potential fields if supported by Astral.  
  - **`FetchOptions?`** – same potential expansions as above (e.g., `includeMedia`).

- **Behavior:**  
  1. **Build Query Parameters:**  
     - Construct the query string for `GET /collections/location-proofs/items` (OGC approach) or `/location-proofs`.  
     - Include bounding box, time filters, chain, etc.
  2. **Send Request & Parse Results:**  
     - The Astral API returns a FeatureCollection or a custom JSON array.  
     - For each returned item, convert it into a `LocationProof` (with the `signature`, `uid`, `chain`, etc.).  
     - If items are incomplete or missing a signature, we note them or skip them. (Typically, Astral indexes fully signed proofs.)
  3. **Pagination Handling:**  
     - If the results are paginated (`limit`, `offset`), either return the first batch plus pagination info or automatically fetch subsequent pages (configurable). This can yield a `LocationProofCollection` with `proofs` and metadata about `hasNextPage`, etc.

- **Output (`LocationProofCollection`):**  
  - Often a simple structure like:
    ```ts
    interface LocationProofCollection {
      proofs: LocationProof[];
      total?: number;      // total matched
      hasNextPage?: boolean;
      // or a bounding box that encloses all results, etc.
    }
    ```
  - Each proof is a typed `LocationProof`. If geospatial queries returned partial data, it might be excluded or forcibly typed.

**Example Usage:**

```ts
const results = await astral.queryLocationProofs({
  bbox: [-122.5, 37.7, -122.3, 37.9],
  chain: "celo",
  limit: 25
});

for (const proof of results.proofs) {
  console.log("UID:", proof.uid, "Loc:", proof.location);
}
```

---

## 6. Verifying Location Proofs

Verification ensures that a proof is valid and trustworthy. It generally involves:

1. **Checking the cryptographic signature** (i.e., EIP-712 off-chain signature correctness).  
2. **Confirming on-chain presence & revocation status** (if registered on EAS).  
3. **(Optional) Additional logic**—such as verifying media authenticity or location reasonableness.

### 6.1 `verifyLocationProof(target: string | LocationProof, options?: VerifyOptions): Promise<VerificationResult>`

**Purpose:**  
Verify the integrity and authenticity of a location proof. This can be done purely off-chain (signature check) or combined with an on-chain check (revocation status, attestation existence).

**Signature:**

```ts
async verifyLocationProof(
  target: string | LocationProof,
  options?: VerifyOptions
): Promise<VerificationResult>
```

- **Input:**
  - **`target`**:  
    - A **UID** (as a hex string) – The method will first fetch the proof via `getLocationProof(uid)` and then verify it.  
    - A **`LocationProof`** object – The method verifies it directly without re-fetching.
  - **`VerifyOptions?`** might include:
    - **`checkOnChain?: boolean`** – if `true`, ensures the proof is registered on-chain and not revoked.  
    - **`expectedChain?: string`** – if you want to confirm it's on a specific chain.  
    - **`skipSignatureCheck?: boolean`** – if, for some reason, you only want to check chain revocation.

- **Behavior:**  
  1. **Fetch if Needed:**  
     - If `target` is a UID string, call `getLocationProof(uid)` to load the proof from the Astral API. If not found, return or throw an error.
  2. **Signature Check (Off-chain):**  
     - Recompute the EIP-712 typed data hash from the proof's fields (location, timestamp, memo, etc.).  
     - Recover the signer address from the proof's `signature`.  
     - Compare it to the `recipient` or `attester` in the proof (depending on how EAS is configured for location proofs). Usually, the "attester" is the address that signed. If mismatch, `isValid = false`.
  3. **Optional On-Chain Check:**  
     - If `checkOnChain` is `true`, determine the chain from the proof (or `options.expectedChain`).  
     - Call `this.eas.getAttestation(uid, chain)`. If no attestation is found or it's marked revoked, set `isValid = false` or `revoked = true`.
     - Possibly compare the on-chain data with the proof to ensure they match (e.g., location, memo) if you want full consistency verification. This requires decoding the on-chain data via EAS schema.
  4. **Construct `VerificationResult`:**  
     - Indicate `isValid: boolean`, `reason?: string` if invalid, `revoked?: boolean` for on-chain checks, etc.

- **Output (`VerificationResult`):**

```ts
interface VerificationResult {
  isValid: boolean;
  revoked?: boolean;         // if on-chain status says it's revoked
  signerAddress?: string;    // the recovered address
  proof?: LocationProof;      // the resolved proof object
  reason?: string;           // if invalid, an explanation
}
```

**Example Usage:**

```ts
// Case 1: direct proof object
const result1 = await astral.verifyLocationProof(someProof, {
  checkOnChain: true
});

// Case 2: just a UID
const result2 = await astral.verifyLocationProof("0xabc123...", {
  checkOnChain: false  // only do signature check
});

if (!result2.isValid) {
  console.error("Proof is invalid:", result2.reason);
} else if (result2.revoked) {
  console.warn("Proof is revoked on chain!");
} else {
  console.log("Proof verified successfully.");
}
```

---

### Additional Verification Considerations

- **Revocation & Expiration:**  
  If the original `UnsignedLocationProof` specified `revocable: true` and an `expiration` time, an on-chain check might reveal if the attestation has been revoked or is past its expiration. The EAS client typically provides `revocationTime` or `isRevoked()` info.
- **Advanced Recipe or Media Verification:**  
  For future expansions, the SDK could integrate extension-based verifications (e.g., verifying that a media file is unaltered, or that a location recipe is consistent with device sensor data).
- **Partial or Missing Data:**  
  If the Astral API or the on-chain attestation lacks certain fields, the verification might be partial (signature is correct, but no chain info found). The `VerificationResult` can reflect that.

---

## Convenience Methods

While the modular approach provides flexibility, we also offer streamlined methods for common workflows:

### 7.1 `createOffchainLocationProof(input: ProofInput, options?: CreateOptions): Promise<OffchainLocationProof>`

**Purpose:**  
Combine building and signing into a single operation for simpler usage.

**Signature:**
```ts
async createOffchainLocationProof(
  input: ProofInput, 
  options?: CreateOptions
): Promise<OffchainLocationProof>
```

- **Input:**
  - **`input: ProofInput`** - Same as `buildLocationProof`
  - **`CreateOptions?`**:
    - **`signer?: ethers.Signer`** - Override the default signer
    - **`skipValidation?: boolean`** - Skip extended validation (default: false)

- **Behavior:**
  1. Internally calls `buildLocationProof` to create an `UnsignedLocationProof`
  2. Immediately calls `signOffchainLocationProof` to produce a signed `OffchainLocationProof`
  3. Returns the fully signed proof

- **Error Handling:**
  - Throws `InvalidProofError` if the input is malformed
  - Throws `SignerNotFoundError` if no signer is available
  - Throws `SigningError` if the signing process fails

### 7.2 `createAndPublishOffchainProof(input: ProofInput, options?: CreateAndPublishOptions): Promise<OffchainLocationProof>`

**Purpose:**  
Streamlined method to build, sign, and publish a proof in one operation.

**Signature:**
```ts
async createAndPublishOffchainProof(
  input: ProofInput,
  options?: CreateAndPublishOptions
): Promise<OffchainLocationProof>
```

- **Input:**
  - **`input: ProofInput`** - Same as `buildLocationProof`
  - **`CreateAndPublishOptions?`**:
    - **`...CreateOptions`** - All options from `createOffchainLocationProof`
    - **`...PublishOptions`** - All options from `publishOffchainLocationProof`

- **Behavior:**
  1. Calls `createOffchainLocationProof` to build and sign the proof
  2. Calls `publishOffchainLocationProof` to publish it off-chain
  3. Returns the published proof with storage metadata

- **Error Handling:**
  - Passes through errors from `createOffchainLocationProof`
  - Throws `PublishError` if publishing fails
  - If publishing fails but signing succeeds, returns the signed proof with a warning

### 7.3 `createOnchainLocationProof(input: ProofInput, options?: CreateOnchainOptions): Promise<OnchainLocationProof>`

**Purpose:**  
One-step method to build and register a proof on-chain.

**Signature:**
```ts
async createOnchainLocationProof(
  input: ProofInput,
  options?: CreateOnchainOptions
): Promise<OnchainLocationProof>
```

- **Input:**
  - **`input: ProofInput`** - Same as `buildLocationProof`
  - **`CreateOnchainOptions?`**:
    - **`chain?: string`** - The blockchain to register on
    - **`txOverrides?: TransactionOverrides`** - Transaction parameters
    - **`skipValidation?: boolean`** - Skip extended validation

- **Behavior:**
  1. Calls `buildLocationProof` to create an `UnsignedLocationProof`
  2. Calls `registerOnchainLocationProof` to register it on-chain
  3. Returns the registered proof with transaction details

- **Error Handling:**
  - Throws `InvalidProofError` if the input is malformed
  - Throws `ChainConnectionError` if blockchain connection fails
  - Throws `RegistrationError` if on-chain registration fails

## Error Handling

The SDK implements a hierarchical error system aligned with its modular extension-based architecture.

### Error Hierarchy

| Error Type | Description | Common Causes |
|------------|-------------|---------------|
| **Base Classes** | | |
| `AstralError` | Base error class | Parent class for all SDK errors |
| **Validation Errors** | | |
| `ValidationError` | Base validation error | Parent for all validation errors |
| `LocationValidationError` | Location data validation failed | Invalid coordinates, unsupported format |
| `MediaValidationError` | Media validation failed | Unsupported media type, corrupt data, size too large |
| `RecipeValidationError` | Recipe validation failed | Invalid recipe format (for future versions) |
| **Signer Errors** | | |
| `SignerError` | Base signer error | Parent for all signature-related errors |
| `SignerNotFoundError` | No suitable signer available | SDK initialized without signer or provider |
| `SigningError` | Proof signing failed | Invalid private key, network issues |
| **Storage Errors** | | |
| `StorageError` | Base storage error | Parent for all storage-related errors |
| `PublishError` | Off-chain publishing failed | IPFS gateway down, network timeout |
| `RegistrationError` | On-chain registration failed | Gas issues, EAS contract errors |
| **Network Errors** | | |
| `NetworkError` | Base network error | Parent for all network-related errors |
| `ChainConnectionError` | Blockchain connection failed | RPC endpoint down, network issues |
| `AstralAPIError` | API request failed | Invalid API key, server error, rate limiting |
| **Resource Errors** | | |
| `NotFoundError` | Requested resource not found | Invalid UID, proof doesn't exist |
| `VerificationError` | Proof verification failed | Invalid signature, revoked attestation |

### Error Properties

Each error includes:
- `message`: Descriptive error message
- `name`: Error class name (e.g., 'LocationValidationError')
- `code`: String code for programmatic handling (e.g., 'LOCATION_VALIDATION_ERROR')
- `cause`: Original error that caused this one (if applicable)
- `context`: Object with additional context data (e.g., proof UID, method name)
- `status`: HTTP status code (for API errors)

### Example Usage

```typescript
try {
  const proof = await astral.createOffchainLocationProof(input);
} catch (error) {
  if (error instanceof LocationValidationError) {
    // Handle location validation issues
    console.error(`Location issue: ${error.message}`);
  } else if (error instanceof MediaValidationError) {
    // Handle media validation issues
    console.error(`Media issue: ${error.message}`);
  } else if (error instanceof SignerError) {
    // Handle all signer-related errors
    console.error(`Signing issue: ${error.message}`);
  } else if (error instanceof AstralError) {
    // Handle any SDK error
    console.error(`SDK error: ${error.code} - ${error.message}`);
  }
}

### Error Handling Examples

For specific SDK methods, errors might include:

- `buildLocationProof`: 
  - `LocationValidationError` for invalid location inputs
  - `MediaValidationError` for invalid media inputs

- `signOffchainLocationProof`: 
  - `SignerNotFoundError` when no signer is configured
  - `SigningError` when the signing operation fails

- `publishOffchainLocationProof`: 
  - `PublishError` when IPFS or other storage fails
  - `NetworkError` for general connectivity issues

- `registerOnchainLocationProof`: 
  - `ChainConnectionError` for blockchain RPC issues
  - `RegistrationError` when the transaction fails

## Pagination Improvements

### Enhanced Query Results

The `queryLocationProofs` method returns a `LocationProofCollection` with improved pagination support:

```ts
interface LocationProofCollection {
  proofs: LocationProof[];
  total: number;          // Total matching records
  pageSize: number;       // Current page size
  currentPage: number;    // Current page number (1-based)
  totalPages: number;     // Total number of pages
  hasNextPage: boolean;   // Whether more results exist
  hasPrevPage: boolean;   // Whether previous results exist
}
```

### Pagination Helper Methods

```ts
// Get the next page of results using the same query parameters
async getNextPage(collection: LocationProofCollection): Promise<LocationProofCollection> {
  if (!collection.hasNextPage) {
    throw new Error('No more pages available');
  }
  
  return this.queryLocationProofs({
    ...collection.query, // Original query parameters
    page: collection.currentPage + 1
  });
}

// Get the previous page of results
async getPrevPage(collection: LocationProofCollection): Promise<LocationProofCollection> {
  if (!collection.hasPrevPage) {
    throw new Error('No previous page available');
  }
  
  return this.queryLocationProofs({
    ...collection.query,
    page: collection.currentPage - 1
  });
}

// Get a specific page of results
async getPage(collection: LocationProofCollection, pageNumber: number): Promise<LocationProofCollection> {
  if (pageNumber < 1 || pageNumber > collection.totalPages) {
    throw new Error(`Page number out of range (1-${collection.totalPages})`);
  }
  
  return this.queryLocationProofs({
    ...collection.query,
    page: pageNumber
  });
}
```

## Summary of API Design

With these enhancements, developers can:

1. Use the **modular approach** for maximum flexibility:
   - **Create**: `buildLocationProof` → `signOffchainLocationProof` or `registerOnchainLocationProof`
   - **Publish**: `publishOffchainLocationProof` (for offchain proofs)
   - **Read**: `getLocationProof`, `queryLocationProofs`
   - **Verify**: `verifyLocationProof`

2. Or use **convenience methods** for common workflows:
   - `createOffchainLocationProof` (build + sign offchain)
   - `createAndPublishOffchainProof` (build + sign + publish offchain)
   - `createOnchainLocationProof` (build + register onchain)

3. Handle **pagination** effectively:
   - Rich metadata in query results
   - Helper methods for navigating between pages

4. **Handle errors** consistently with typed error classes

This design balances flexibility with developer convenience while maintaining a clean, modular architecture.