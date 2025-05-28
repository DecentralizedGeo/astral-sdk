# Future Integration Opportunities: eas-sandbox and astral-sdk

This document outlines potential integration strategies between the `eas-sandbox` and `astral-sdk` codebases, focusing on enhancing functionality, developer experience, and production readiness.

**Jumplinks**

- [Storage and Persistence Mechanisms](#storage-and-persistence-mechanisms)
- [Gas Estimation and Transaction Monitoring](#gas-estimation-and-transaction-monitoring)
- [Configuration Management Approaches](#configuration-management-approaches)
- [API Client and Network Layer](#api-client-and-network-layer)
- [Key Architectural Differences Summary](#key-architectural-differences-summary)
- [Recommended Integration Roadmap](#recommended-integration-roadmap)
- [Advanced Workflow Implementations and Domain-Specific Use Cases](#advanced-workflow-implementations-and-domain-specific-use-cases)
- [Feature Integration Roadmap: Bringing Advanced Workflows to astral-sdk](#feature-integration-roadmap-bringing-advanced-workflows-to-astral-sdk)
- [Key Integration Benefits](#key-integration-benefits)

## Storage and Persistence Mechanisms

### **eas-sandbox: Simple File-Based Storage**

**Implementation:**

- `offchain-storage.ts` provides JSON file-based persistence
- Direct Node.js `fs/promises` operations
- Storage location: `offchain-attestations.json` in project root

**Key Functions:**

```typescript
// Save attestation to local JSON file
export async function saveOffChainAttestation(
  attestation: SignedOffchainAttestation
): Promise<void>;

// Load with optional filtering
export async function loadOffChainAttestations(
  query?: OffChainAttestationQuery
): Promise<SignedOffchainAttestation[]>;
```

**Features:**

- BigInt serialization (stored as strings with 'n' suffix)
- Duplicate prevention by UID
- Query filtering by: uid, schema, recipient, referenceUid
- Automatic file creation if not exists
- Error handling for file operations

**Storage Format:**

```json
[
  {
    "uid": "0x...",
    "message": {
      "schema": "0x...",
      "recipient": "0x...",
      "time": "1234567890n",
      "expirationTime": "0n",
      "revocable": true,
      "data": "0x..."
    },
    "signature": {
      "r": "0x...",
      "s": "0x...",
      "v": 28
    }
  }
]
```

### **astral-sdk: Abstract Storage Architecture**

**Implementation:**

- Abstract `StorageAdapter` class (placeholder)
- Configuration-driven with type-safe interfaces
- Designed for pluggable backends

**Configuration Types:**

```typescript
interface StorageConfig {
  readonly type: 'ipfs' | 'url' | string;
  readonly endpoint?: string;
  readonly apiKey?: string;
}

interface IPFSStorageConfig extends StorageConfig {
  readonly gateway?: string;
  readonly pinning?: boolean;
}
```

**Architectural Approach:**

- Dependency injection pattern
- Error boundaries with custom error types
- Future support for IPFS, URL endpoints, custom adapters
- Type safety at compile time

### **Integration Opportunities**

1. **Implement Concrete Storage Adapters**

   - Create `JSONStorageAdapter` based on eas-sandbox approach
   - Add `IPFSStorageAdapter` for decentralized storage
   - Maintain type safety and error handling

2. **Enhanced Query Capabilities**
   - Adopt eas-sandbox filtering patterns
   - Add indexing for better performance
   - Support for complex queries

## Gas Estimation and Transaction Monitoring

### **eas-sandbox: Comprehensive Gas Analysis**

**Pre-Transaction Estimation:**

```typescript
export async function estimateGasCost(
  provider: Provider,
  signer: Signer,
  txData: ContractTransaction
): Promise<{ estimatedGas: bigint; estimatedCost: Number }>;
```

**Features:**

- Real-time gas price fetching via `provider.getFeeData()`
- Gas unit estimation via `signer.estimateGas()`
- Cost calculation in ETH with formatting
- Detailed console logging with locale-formatted numbers

**Post-Transaction Reporting:**

```typescript
export function reportActualGasCost(receipt: TransactionReceipt): void;
```

**Features:**

- Actual gas usage from receipt
- Effective gas price (including EIP-1559 priority fees)
- Cost comparison capabilities
- Formatted output for developer experience

**Integration in Workflows:**

```typescript
// Before transaction
const estimate = await estimateGasCost(provider, signer, txData);

// Submit transaction
const tx = await contract.method(params);
const receipt = await tx.wait();

// After transaction
reportActualGasCost(receipt);
```

### **astral-sdk: Production-Ready Error Handling**

**Current State:**

- No explicit gas estimation utilities
- Relies on ethers.js default estimation
- Focus on error boundaries and recovery

**Error Types:**

```typescript
class TransactionError extends NetworkError
class ChainConnectionError extends NetworkError
class RegistrationError extends StorageError
```

### **Integration Opportunities**

1. **Add Gas Utilities Module**

   - Port eas-sandbox gas estimation functions
   - Integrate with OnchainRegistrar workflow
   - Add cost optimization recommendations

2. **Enhanced Transaction Monitoring**
   - Pre-flight gas estimation for all transactions
   - Cost budgeting and alerts
   - Gas price optimization strategies

## Configuration Management Approaches

### **eas-sandbox: YAML-Based Configuration**

**Structure:**

```yaml
# examples.yaml
attest-onchain:
  - schemaUid: '0x...'
    schemaString: 'string message,uint256 value'
    fields:
      message: 'Hello World'
      value: 42
    recipient: '0x...'
    expirationTime: 0
    revocable: true
    referenceUid: '0x0000...'

chained-attestation:
  - attestations:
      - schemaUid: '0x...'
        fields: { ... }
      - schemaUid: '0x...'
        fields: { ... }
```

**Loading Mechanism:**

```typescript
export function loadFullConfig(): FullConfig | null {
  const configPath = path.join(__dirname, '..', 'examples.yaml');
  return yaml.load(fs.readFileSync(configPath, 'utf8')) as FullConfig;
}
```

**Features:**

- Multiple configurations per script
- Default value application
- Type conversion (string to BigInt)
- Hierarchical organization
- Easy modification without code changes

### **astral-sdk: TypeScript Configuration**

**Structure:**

```typescript
interface AstralSDKConfig {
  readonly defaultChain?: string;
  readonly mode?: 'onchain' | 'offchain' | 'ipfs';
  readonly provider?: unknown;
  readonly signer?: unknown;
  readonly apiKey?: string;
  readonly endpoint?: string;
  readonly debug?: boolean;
}
```

**Features:**

- Compile-time type safety
- Configuration validation
- Immutable configuration objects
- IDE autocomplete and validation
- Runtime configuration merging

### **Integration Strategies**

1. **Hybrid Approach**

   - Keep TypeScript interfaces for type safety
   - Add YAML loader for example configurations
   - Configuration validation at runtime

2. **Development vs Production**
   - YAML for development/testing scenarios
   - TypeScript configs for production deployment
   - Environment-based configuration selection

## API Client and Network Layer

### **astral-sdk: Production-Grade API Client**

**Advanced Features:**

```typescript
class AstralApiClient {
  // Exponential backoff retry logic
  private async request<T>(method: string, path: string): Promise<T> {
    let retries = 3;
    let delay = 1000;

    while (retries >= 0) {
      try {
        const response = await fetch(url, options);
        if (response.status === 429 && retries > 0) {
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Exponential backoff
          continue;
        }
        // ...handle response
      } catch (error) {
        // ...retry logic
      }
    }
  }
}
```

**Error Handling:**

- Custom error types for different scenarios
- Rate limiting with exponential backoff
- Timeout handling
- Request/response logging
- Configuration caching

**Network Resilience:**

```typescript
// Specialized error types
class AstralAPIError extends NetworkError
class NotFoundError extends AstralAPIError
class ChainConnectionError extends NetworkError
```

### **eas-sandbox: Direct Blockchain Interaction**

**Approach:**

- Direct EAS SDK usage
- Minimal abstraction layer
- Focus on functional examples
- Immediate error propagation

**Trade-offs:**

- Simpler for educational purposes
- Less resilient to network issues
- No built-in retry mechanisms
- Direct dependency on EAS SDK behavior

### **Integration Benefits**

1. **Production Reliability**

   - Apply astral-sdk network patterns to eas-sandbox examples
   - Add retry logic for blockchain operations
   - Implement circuit breaker patterns

2. **Development Experience**
   - Use eas-sandbox direct approach for rapid prototyping
   - Graduate to astral-sdk patterns for production
   - Maintain both simple and robust interfaces

## Key Architectural Differences Summary

| Aspect                   | eas-sandbox             | astral-sdk                       | Integration Strategy                                       |
| ------------------------ | ----------------------- | -------------------------------- | ---------------------------------------------------------- |
| **Storage**              | JSON files, direct I/O  | Abstract adapters, pluggable     | Implement concrete adapters using eas-sandbox patterns     |
| **Gas Management**       | Comprehensive utilities | Basic error handling             | Port gas utilities into SDK with production error handling |
| **Configuration**        | YAML-based, flexible    | TypeScript interfaces, type-safe | Hybrid approach: YAML for examples, TS for production      |
| **Network Layer**        | Direct EAS interaction  | Production-grade client          | Apply resilience patterns to blockchain operations         |
| **Error Handling**       | Basic console logging   | Comprehensive error hierarchy    | Enhance eas-sandbox with structured error types            |
| **Developer Experience** | Tutorial-focused        | Production-focused               | Maintain both educational and production interfaces        |

## Recommended Integration Roadmap

### Phase 1: Core Storage Implementation

- Implement `JSONStorageAdapter` in astral-sdk using eas-sandbox patterns
- Add gas estimation utilities to OnchainRegistrar
- Enhance error handling in eas-sandbox examples

### Phase 2: Configuration Enhancement

- Add YAML configuration loader to astral-sdk
- Implement configuration validation
- Create example configuration templates

### Phase 3: Network Resilience

- Apply astral-sdk retry patterns to eas-sandbox
- Add gas price optimization
- Implement transaction monitoring

### Phase 4: Developer Experience

- Create migration guides
- Unified documentation
- Example project templates

This analysis reveals that while both codebases serve the same fundamental purpose, they represent different points on the development maturity spectrum - eas-sandbox for education and rapid prototyping, astral-sdk for production deployment. The integration opportunities are substantial and would benefit both codebases significantly.

---

## Advanced Workflow Implementations and Domain-Specific Use Cases

### **eas-sandbox: Comprehensive Real-World Workflows**

The eas-sandbox demonstrates sophisticated, production-ready workflows that showcase advanced EAS capabilities across multiple domains:

#### **1. Event Check-In Workflow (`workflow-event-checkin.ts`)**

**Features:**

- **Automatic IP-based Geolocation**: Uses `public-ip` and `geoip-lite` libraries
- **GeoJSON Point Generation**: Converts IP location to standardized GeoJSON format
- **Real-time Location Capture**: Fetches public IP and resolves to geographical coordinates
- **Complete Attestation Lifecycle**: Schema registration → Data capture → Attestation → Verification

**Implementation Highlights:**

```typescript
// Automatic geolocation from IP
const ipAddress = await publicIpv4();
const locationData = geoip.lookup(ipAddress);

// GeoJSON Point generation
const geoJsonPoint = {
  type: 'Point',
  coordinates: [locationData.ll[1], locationData.ll[0]], // [longitude, latitude]
};

// Event-specific data encoding
const attestationData = {
  dataToEncode: [
    { name: 'eventId', value: 'Acme CONFERENCE 2025', type: 'string' },
    { name: 'ticketId', value: uniqueTicketId, type: 'string' },
    { name: 'timestamp', value: BigInt(Date.now() / 1000), type: 'uint64' },
    { name: 'geoJson', value: JSON.stringify(geoJsonPoint), type: 'string' },
  ],
};
```

#### **2. ProofMode Integration Workflow (`workflow-proofmode.ts`)**

**Advanced Features:**

- **File Integrity Verification**: SHA256 hashing of image content
- **IPFS Simulation**: Mock IPFS CID generation for decentralized storage
- **Complete Verification Chain**: Upload → Hash → Store → Attest → Verify
- **Third-Party Verification**: Simulates external verifier retrieving and validating content

**Workflow Steps:**

```typescript
// 1. Content Processing
const proofModeData = simulateProofModeUpload(imagePath);
// Extracts: latitude, longitude, timestamp, fileHash

// 2. Decentralized Storage Simulation
const mockIpfsCid = 'ipfs://Qm' + proofModeData.fileHash.substring(0, 44);

// 3. On-chain Attestation with Metadata
const attestationData = {
  dataToEncode: [
    { name: 'latitude', value: proofModeData.latitude, type: 'string' },
    { name: 'longitude', value: proofModeData.longitude, type: 'string' },
    { name: 'timestamp', value: BigInt(proofModeData.timestamp), type: 'uint64' },
    { name: 'fileHash', value: proofModeData.fileHash, type: 'string' },
    { name: 'ipfsCid', value: mockIpfsCid, type: 'string' },
  ],
};

// 4. Third-Party Verification
const fetchedAttestation = await getAttestation(newAttestationUID);
const decodedData = schemaEncoder.decodeData(fetchedAttestation.data);
const attestedFileHash = extractFileHash(decodedData);
const verifierCalculatedHash = sha256(retrievedImageData);
const isVerified = attestedFileHash === verifierCalculatedHash;
```

#### **3. Geocaching Discovery Workflow (`workflow-geocaching.ts`)**

**Features:**

- **QR Code Simulation**: Mock QR code scanning and data extraction
- **Unique Cache Identification**: Generates unique cache IDs using ethers.id()
- **Discovery Attestation**: Creates immutable proof of cache discovery
- **Location-based Verification**: Combines cache ID with GPS coordinates

#### **4. Impact Monitoring Workflow (`workflow-impact-monitoring.ts`)**

**Advanced GeoJSON Integration:**

- **Polygon Boundary Definition**: Uses GeoJSON Polygon for area boundaries
- **Conservation Area Tracking**: Attestations for environmental monitoring
- **Spatial Data Encoding**: Complex geographical shape representation

```typescript
// Complex GeoJSON Polygon for area boundaries
const geoJsonBounds = JSON.stringify({
  type: 'Polygon',
  coordinates: [
    [
      [-74.0, 40.7],
      [-74.1, 40.7],
      [-74.1, 40.8],
      [-74.0, 40.8],
      [-74.0, 40.7],
    ],
  ],
});

const attestationData = {
  dataToEncode: [
    { name: 'areaName', value: 'Willow Creek Conservation Area', type: 'string' },
    { name: 'description', value: 'Protected wetland habitat established 2025', type: 'string' },
    { name: 'geoJsonBounds', value: geoJsonBounds, type: 'string' },
  ],
};
```

### **5. Private Data and Zero-Knowledge Proofs**

#### **Private Data Proof Generation (`private-data-proofs.ts`)**

**Advanced Cryptographic Features:**

- **Merkle Tree Construction**: Creates cryptographic trees from private data
- **Selective Disclosure**: Allows revealing only specific fields
- **Proof Verification**: Validates proofs against Merkle roots
- **Privacy-Preserving Attestations**: Enables confidential data sharing

**Implementation:**

```typescript
// Create private data object from schema
const privateData = preparePrivateDataObject(schemaItemPayload);
const merkleRoot = privateData.getFullTree().root;

// Generate selective disclosure proof
const resultantProof = generatePrivateDataProof(privateData, fieldsToDisclose);
const { proofObject, proofJson } = resultantProof;

// Verification process
const isValid = PrivateData.verifyMultiProof(fullTree.root, proofObject);
```

#### **On-chain Private Data Attestations (`private-data-proofs-onchain.ts`)**

**Features:**

- **Hybrid Approach**: On-chain Merkle root with off-chain private data
- **Proof Generation**: Creates verifiable proofs for disclosed fields
- **Schema Integration**: Uses dedicated private data schema
- **Verification UI**: Generates JSON proofs for UI consumption

### **6. Batch and Chained Attestations (`chained-attestation.ts`)**

**Advanced Attestation Patterns:**

- **Batch Processing**: Multiple attestations in sequence
- **Reference Chaining**: Links attestations via `refUID`
- **Transaction Optimization**: Efficient multi-attestation workflows
- **Configuration-Driven**: YAML-based batch definitions

```typescript
// Batch attestation processing
for (const [i, att] of batch.attestations.entries()) {
  const attestationData = {
    // ... standard fields
    refUID: att.referenceUid, // Links to previous attestation
    dataToEncode: preparedData,
  };

  const newUID = await createOnChainAttestation(signer, attestationData);
  console.log(`Attestation #${i} created. UID: ${newUID}`);
}
```

### **astral-sdk: Foundation for Advanced Features**

**Current State:**

- Clean architectural foundation ready for workflow integration
- Type-safe interfaces for configuration and data handling
- Error handling framework suitable for complex workflows
- Modular design allowing easy workflow additions

**Missing Advanced Features:**

- No workflow orchestration patterns
- Limited geospatial data handling
- No private data or cryptographic proof capabilities
- Basic attestation patterns only

---

## Feature Integration Roadmap: Bringing Advanced Workflows to astral-sdk

### **Phase 1: Core Workflow Infrastructure**

**1. Workflow Base Classes**

```typescript
// Add to astral-sdk/core/
abstract class WorkflowBase {
  protected signer: Signer;
  protected schemaUID: string;

  abstract execute(): Promise<WorkflowResult>;
  protected abstract validateConfig(): boolean;
  protected abstract prepareData(): WorkflowData;
}

interface WorkflowResult {
  attestationUID: string;
  transactionHash: string;
  gasUsed: bigint;
  blockNumber: number;
}
```

**2. Advanced Configuration Management**

```typescript
// Add YAML configuration loader
interface WorkflowConfig {
  readonly type: 'event-checkin' | 'proofmode' | 'geocaching' | 'impact-monitoring';
  readonly schema: SchemaConfiguration;
  readonly data: Record<string, unknown>;
  readonly options?: WorkflowOptions;
}
```

### **Phase 2: Geospatial and Location Features**

**1. Enhanced Location Extensions**

```typescript
// Extend astral-sdk/extensions/location/
class GeoIPLocationProvider implements LocationProvider {
  async getCurrentLocation(): Promise<GeoJSONPoint> {
    const ip = await publicIpv4();
    const location = geoip.lookup(ip);
    return {
      type: 'Point',
      coordinates: [location.ll[1], location.ll[0]],
    };
  }
}

class GeoJSONPolygonBuilder {
  static createBounds(coordinates: number[][]): GeoJSONPolygon;
  static validatePolygon(polygon: GeoJSONPolygon): boolean;
}
```

**2. ProofMode Integration**

```typescript
// Add to astral-sdk/extensions/media/
class ProofModeProcessor {
  static processImage(imagePath: string): Promise<ProofModeMetadata>;
  static generateFileHash(data: Buffer): string;
  static simulateIPFSUpload(data: Buffer): Promise<string>;
}

interface ProofModeMetadata {
  latitude: string;
  longitude: string;
  timestamp: number;
  fileHash: string;
  ipfsCid?: string;
}
```

### **Phase 3: Advanced Cryptographic Features**

**1. Private Data Module**

```typescript
// Add astral-sdk/crypto/
class PrivateDataManager {
  static createMerkleTree(data: SchemaItem[]): MerkleTree;
  static generateProof(tree: MerkleTree, fieldsToDisclose: string[]): PrivateDataProof;
  static verifyProof(root: string, proof: PrivateDataProof): boolean;
}

interface PrivateDataProof {
  proofObject: MerkleMultiProof;
  proofJson: string;
  disclosedFields: string[];
}
```

### **Phase 4: Production Workflow Implementations**

**1. Event Check-in Workflow**

```typescript
// Add astral-sdk/workflows/
class EventCheckInWorkflow extends WorkflowBase {
  constructor(
    private eventConfig: EventConfig,
    private locationProvider: LocationProvider
  ) {}

  async execute(): Promise<EventCheckInResult> {
    const location = await this.locationProvider.getCurrentLocation();
    const attestationData = this.prepareEventData(location);
    return await this.createAttestation(attestationData);
  }
}
```

**2. Content Verification Workflow**

```typescript
class ProofModeWorkflow extends WorkflowBase {
  async execute(imagePath: string): Promise<ProofModeResult> {
    const metadata = await ProofModeProcessor.processImage(imagePath);
    const ipfsCid = await this.uploadToIPFS(metadata.imageData);
    const attestationData = this.prepareProofModeData(metadata, ipfsCid);
    return await this.createAttestation(attestationData);
  }

  async verify(attestationUID: string, imagePath: string): Promise<VerificationResult> {
    const attestation = await this.getAttestation(attestationUID);
    const localHash = ProofModeProcessor.generateFileHash(fs.readFileSync(imagePath));
    const attestedHash = this.extractFileHash(attestation);
    return { isValid: localHash === attestedHash };
  }
}
```

### **Phase 5: Developer Experience Enhancements**

**1. Workflow CLI**

```bash
npx astral-sdk workflow run event-checkin --config ./event.yaml
npx astral-sdk workflow run proofmode --image ./photo.jpg
npx astral-sdk workflow verify proofmode --uid 0x123... --image ./photo.jpg
```

**2. Configuration Templates**

```yaml
# astral-sdk/templates/event-checkin.yaml
workflow:
  type: event-checkin
  schema:
    name: 'EventCheckInGeoIPLocation'
    fields: 'string eventId, string ticketId, uint64 timestamp, string geoJson'
  data:
    eventId: '{{EVENT_ID}}'
    ticketId: '{{TICKET_ID}}'
    autoLocation: true
```

**3. Workflow Testing Framework**

```typescript
// astral-sdk/testing/
class WorkflowTestHarness {
  static async testWorkflow(workflow: WorkflowBase, testData: TestData): Promise<TestResult>;
  static mockLocationProvider(coordinates: [number, number]): LocationProvider;
  static mockImageData(metadata: Partial<ProofModeMetadata>): Buffer;
}
```

---

## Key Integration Benefits

### **1. Production-Ready Workflows**

- Move from basic attestation examples to complete real-world use cases
- Built-in error handling, gas optimization, and transaction monitoring
- Comprehensive verification and validation patterns

### **2. Advanced Geospatial Capabilities**

- Support for complex geographical data (Points, Polygons, etc.)
- Integration with IP geolocation services
- GeoJSON standardization for interoperability

### **3. Privacy-Preserving Features**

- Zero-knowledge proof generation and verification
- Selective disclosure of private data
- Merkle tree-based privacy protection

### **4. Enhanced Developer Experience**

- Configuration-driven workflow execution
- Built-in testing and simulation capabilities
- CLI tools for rapid development and deployment

### **5. Enterprise-Grade Features**

- Batch processing capabilities
- Attestation chaining for complex workflows
- Content integrity verification
- Third-party verification patterns

This integration strategy transforms astral-sdk from a basic attestation library into a comprehensive platform for real-world attestation use cases, combining the educational clarity of eas-sandbox with the production-grade architecture of astral-sdk.
