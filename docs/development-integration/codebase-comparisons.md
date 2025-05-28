# Codebase comparison: Understanding how to integrate features from `eas-sandbox` into `astral-sdk`

## Onchain Attestations

Onchain attestations and how they are created using the `astral-sdk` and `eas-sandbox` SDKs.

```mermaid
sequenceDiagram
    participant Client as Client Application
    participant SDK as AstralSDK
    participant OnchainReg as OnchainRegistrar
    participant EAS_A as EAS SDK (astral-sdk)
    participant Blockchain as Blockchain

    participant EAS_S as EAS SDK (eas-sandbox)
    participant Provider as Provider/Signer
    participant GasEst as Gas Estimator

    Note over Client, Blockchain: astral-sdk Flow (Production SDK)
    Client->>SDK: createOnchainLocationProof(input)
    Note right of Client: Currently returns unsigned proof<br/>(registration not implemented)
    SDK->>SDK: buildLocationProof(input)
    SDK->>SDK: Process location & media extensions
    SDK-->>Client: UnsignedLocationProof

    Note over Client, Blockchain: Future astral-sdk Flow (When implemented)
    Client->>SDK: registerOnchainLocationProof(unsignedProof)
    SDK->>OnchainReg: registerOnchainLocationProof()
    OnchainReg->>OnchainReg: ensureEASModulesInitialized()
    OnchainReg->>OnchainReg: formatProofForEAS(proof)
    OnchainReg->>EAS_A: attest(attestationParams)
    EAS_A->>Blockchain: Submit Transaction
    Blockchain-->>EAS_A: Transaction Receipt
    EAS_A-->>OnchainReg: Transaction Response
    OnchainReg->>OnchainReg: Extract UID from logs
    OnchainReg-->>SDK: OnchainLocationProof
    SDK-->>Client: OnchainLocationProof

    Note over Client, Blockchain: eas-sandbox Flow (Direct Function Approach)
    Client->>EAS_S: createOnChainAttestation(signer, data)
    EAS_S->>Provider: Connect to blockchain
    EAS_S->>EAS_S: SchemaEncoder.encodeData()
    EAS_S->>GasEst: estimateGasCost()
    GasEst-->>EAS_S: Gas estimate
    EAS_S->>EAS_S: Prepare attestation parameters
    EAS_S->>Blockchain: attest(params)
    Blockchain-->>EAS_S: Transaction receipt
    EAS_S->>EAS_S: Parse logs for UID
    EAS_S->>GasEst: reportActualGasCost()
    EAS_S-->>Client: Attestation UID
```

### Notes

#### **astral-sdk (Production SDK Approach)**

**Current State:**

- `createOnchainLocationProof()` currently only builds an unsigned proof and returns it
- The actual on-chain registration is not yet implemented (marked as "placeholder")

**Future Implementation:**

- Will use a clean class-based architecture with `OnchainRegistrar`
- Multi-step process: SDK → OnchainRegistrar → EAS SDK → Blockchain
- Includes proper initialization checks and data formatting specific to location proofs
- Returns a complete `OnchainLocationProof` object with transaction details

#### **eas-sandbox (Direct Function Approach)**

**Current Implementation:**

- `createOnChainAttestation()` provides a complete, working on-chain attestation flow
- Direct function-based approach without intermediate classes
- Includes advanced features like gas estimation and reporting
- More comprehensive error handling and transaction validation
- Returns just the attestation UID

### Architectural Comparison

1. **Abstraction Level:**
   - **astral-sdk**: High-level, domain-specific (location proofs)
   - **eas-sandbox**: Low-level, general-purpose EAS operations

2. **Error Handling:**
   - **astral-sdk**: Custom error classes with detailed context
   - **eas-sandbox**: Try-catch with detailed logging and gas reporting

3. **Data Processing:**
   - **astral-sdk**: Extension system for location/media types
   - **eas-sandbox**: Direct schema encoding with validation helpers

4. **Transaction Management:**
   - **astral-sdk**: Abstracted through OnchainRegistrar class
   - **eas-sandbox**: Direct transaction handling with gas optimization

The diagram clearly shows that while both aim to create on-chain attestations, astral-sdk provides a higher-level, production-ready API focused on location proofs, while eas-sandbox offers more granular control over the EAS attestation process with additional features like gas estimation and detailed transaction reporting.

## Off-chain Attestations

Offchain attestations and how they are created using the `astral-sdk` and `eas-sandbox` SDKs.

```mermaid
sequenceDiagram
    participant Client as Client Application
    participant SDK as AstralSDK
    participant OffchainSigner as OffchainSigner
    participant EAS_A as EAS SDK (astral-sdk)
    participant EIP712 as EIP-712 Signature

    participant EAS_S as EAS SDK (eas-sandbox)
    participant OffchainModule as Offchain Module
    participant Storage as Local Storage

    Note over Client, EIP712: astral-sdk Flow (Production SDK)
    Client->>SDK: createOffchainLocationProof(input)
    SDK->>SDK: buildLocationProof(input)
    SDK->>SDK: Process location & media extensions
    SDK->>SDK: ensureOffchainSignerInitialized()
    SDK->>OffchainSigner: signOffchainLocationProof(unsignedProof)
    OffchainSigner->>OffchainSigner: ensureOffchainModuleInitialized()
    OffchainSigner->>OffchainSigner: formatProofForEAS(proof)
    OffchainSigner->>EAS_A: Offchain.signOffchainAttestation(params)
    EAS_A->>EIP712: Create EIP-712 signature
    EIP712-->>EAS_A: Signed attestation
    EAS_A-->>OffchainSigner: SignedOffchainAttestation
    OffchainSigner->>OffchainSigner: Construct OffchainLocationProof
    OffchainSigner-->>SDK: OffchainLocationProof
    SDK-->>Client: OffchainLocationProof

    Note over Client, Storage: eas-sandbox Flow (Direct Function Approach)
    Client->>EAS_S: createOffChainAttestation(signer, data)
    EAS_S->>EAS_S: SchemaEncoder.encodeData()
    EAS_S->>OffchainModule: getOffchain()
    EAS_S->>OffchainModule: signOffchainAttestation(params)
    OffchainModule->>EIP712: Create EIP-712 signature
    EIP712-->>OffchainModule: Signed attestation
    OffchainModule-->>EAS_S: SignedOffchainAttestation
    EAS_S-->>Client: SignedOffchainAttestation

    Note over Client, Storage: Optional: Save to Local Storage
    Client->>Storage: saveOffChainAttestation(attestation)
    Storage-->>Client: Confirmation
```

### Notes

#### **astral-sdk (Production SDK Approach)**

- **Multi-layered architecture**: Client → AstralSDK → OffchainSigner → EAS SDK → EIP-712
- **Domain-specific processing**: Includes location/media extension processing through `buildLocationProof()`
- **Initialization checks**: Ensures proper setup with `ensureOffchainSignerInitialized()`
- **Data transformation**: Converts location proofs to EAS format via `formatProofForEAS()`
- **Rich output**: Returns a complete `OffchainLocationProof` object with SDK metadata

#### **eas-sandbox (Direct Function Approach)**

- **Streamlined flow**: Direct function call to `createOffChainAttestation()`
- **General-purpose**: Works with any schema data, not specific to location proofs
- **Simple encoding**: Direct schema encoding without domain-specific processing
- **Optional storage**: Includes local storage capabilities for persistence
- **Raw output**: Returns the standard EAS `SignedOffchainAttestation` object

#### Architectural Comparison

Both flows ultimately use EIP-712 signatures through the EAS SDK, but they differ significantly in:

1. **Abstraction Level**: astral-sdk provides high-level location-proof abstractions, while eas-sandbox offers direct EAS operations
2. **Data Processing**: astral-sdk includes sophisticated extension systems for location/media types
3. **Error Handling**: astral-sdk has comprehensive initialization checks and custom error types
4. **Storage**: eas-sandbox includes built-in local storage options; astral-sdk focuses on the signing process
5. **Output Format**: astral-sdk returns domain-specific objects; eas-sandbox returns standard EAS objects

The diagram clearly shows that astral-sdk provides a more production-ready, developer-friendly API for location proofs, while eas-sandbox offers more direct control over EAS attestation processes with additional utility features.

## Schema Creation and Registration

Schema creation and registration workflows in both the `astral-sdk` and `eas-sandbox` SDKs.

```mermaid
sequenceDiagram
    participant Client as Client Application
    participant SDK as AstralSDK
    participant ExtRegistry as ExtensionRegistry
    participant LocationExt as LocationSchemaExtension
    participant SchemaEncoder as SchemaEncoder
    participant ChainsConfig as Chains Config

    participant EAS_S as EAS SDK (eas-sandbox)
    participant SchemaRegistry as SchemaRegistry
    participant Provider as Provider/Signer
    participant Blockchain as Blockchain

    Note over Client, ChainsConfig: astral-sdk Flow (Extension-Based Schema Management)
    Client->>SDK: new AstralSDK(config)
    SDK->>ExtRegistry: new ExtensionRegistry(true)
    ExtRegistry->>ExtRegistry: registerBuiltInExtensions()
    ExtRegistry->>LocationExt: import LocationSchemaExtension
    ExtRegistry->>LocationExt: registerSchemaExtension(extension)
    LocationExt->>LocationExt: validate()
    LocationExt->>ChainsConfig: getSchemaString()
    LocationExt->>ChainsConfig: getSchemaUID(chainId)
    LocationExt->>SchemaEncoder: SchemaEncoder.isSchemaValid(schema)
    SchemaEncoder-->>LocationExt: validation result
    LocationExt-->>ExtRegistry: extension registered

    Note over Client, ChainsConfig: Using Built-in Schema
    Client->>SDK: getSchemaString('location')
    SDK->>ExtRegistry: getSchemaExtension('location')
    ExtRegistry-->>SDK: LocationSchemaExtension
    SDK->>LocationExt: getSchemaString()
    LocationExt->>ChainsConfig: getSchemaString()
    ChainsConfig-->>LocationExt: schema string
    LocationExt-->>SDK: schema string
    SDK-->>Client: schema string

    Note over Client, ChainsConfig: Custom Schema Registration
    Client->>SDK: registerCustomSchema(options)
    SDK->>SDK: createCustomSchemaExtension(options)
    SDK->>ExtRegistry: registerSchemaExtension(extension)
    ExtRegistry->>ExtRegistry: validate extension
    ExtRegistry-->>SDK: schema extension registered

    Note over Client, Blockchain: eas-sandbox Flow (Direct Schema Registration)
    Client->>EAS_S: registerSchema(signer, schemaData)
    EAS_S->>EAS_S: checkExistingSchema(schema, resolver, revocable)
    EAS_S->>EAS_S: Calculate potential UID (keccak256)
    EAS_S->>SchemaRegistry: new SchemaRegistry(address)
    EAS_S->>Provider: getProviderSigner()
    Provider-->>EAS_S: provider
    EAS_S->>SchemaRegistry: connect(provider)
    EAS_S->>SchemaRegistry: getSchema({uid})
    
    alt Schema exists
        SchemaRegistry-->>EAS_S: existing schema record
        EAS_S-->>Client: existing UID
    else Schema doesn't exist
        SchemaRegistry-->>EAS_S: null/error
        EAS_S->>SchemaRegistry: connect(signer)
        EAS_S->>SchemaRegistry: register({schema, resolver, revocable})
        SchemaRegistry->>Blockchain: Submit registration transaction
        Blockchain-->>SchemaRegistry: Transaction receipt
        SchemaRegistry-->>EAS_S: new schema UID
        EAS_S-->>Client: new schema UID
    end

    Note over Client, Blockchain: Workflow Schema Validation
    Client->>EAS_S: ensureSchemaRegistered(signer)
    EAS_S->>EAS_S: checkExistingSchema(workflowSchema)
    
    opt Schema validation
        EAS_S->>EAS_S: fetchSchema(providedUID)
        EAS_S->>EAS_S: Validate schema string matches
    end
    
    alt Schema not found
        EAS_S->>EAS_S: registerSchema(signer, schemaData)
        EAS_S-->>Client: new schema UID
    else Schema exists
        EAS_S-->>Client: existing schema UID
    end
```

### Notes

#### **astral-sdk (Extension-Based Schema Management)**

- **Initialization-time registration**: Schemas are registered as extensions during SDK initialization
- **Built-in schema support**: Comes with pre-configured location schema extensions loaded from config
- **Extension system**: Uses a sophisticated extension registry to manage different schema types
- **Configuration-driven**: Schema strings and UIDs are loaded from `EAS-config.json` files
- **Validation during registration**: Schema extensions validate themselves when being registered
- **Runtime schema access**: Provides methods like `getSchemaString()` and `getSchemaUID()` to access schema information

#### **eas-sandbox (Direct Schema Registration)**

- **On-demand registration**: Schemas are registered directly to the blockchain when needed
- **Existence checking**: Always checks if a schema already exists before attempting registration
- **UID calculation**: Pre-calculates schema UIDs using `keccak256` to avoid duplicate registrations
- **Transaction management**: Handles actual blockchain transactions for schema registration
- **Workflow integration**: Includes `ensureSchemaRegistered()` patterns for workflow-specific schemas
- **Error handling**: Comprehensive error handling for transaction failures and gas issues

### Architectural Philosophy Comparison

1. **Schema as Configuration vs. Schema as Data**:
   - **astral-sdk**: Treats schemas as configuration that's part of the SDK setup
   - **eas-sandbox**: Treats schemas as data that needs to be managed on the blockchain

2. **Abstraction Level**:
   - **astral-sdk**: High-level abstraction with extension system
   - **eas-sandbox**: Direct blockchain interaction with utility functions

3. **Flexibility**:
   - **astral-sdk**: Extensible through custom schema extensions
   - **eas-sandbox**: Flexible through direct function parameters and dynamic registration

4. **Validation**:
   - **astral-sdk**: Validation happens at extension registration time
   - **eas-sandbox**: Validation happens during blockchain interaction
