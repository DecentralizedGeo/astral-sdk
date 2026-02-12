# VERIFY-SPEC.md Update Plan

**Purpose**: Align VERIFY-SPEC.md with actual SDK implementation (PR #54)

**Source of Truth**: `astral-sdk` PR #54 implementation

**Status**: Draft - pending review

---

## Executive Summary

VERIFY-SPEC.md was written during the design phase before the final SDK implementation was settled. It contains several architectural decisions that were changed during implementation:

1. **No `assess()` or `evaluate()` on plugins** - Evaluation is SDK-side in ProofsModule
2. **Multidimensional credibility model** - Not a scalar confidence score
3. **SDK namespace change** - `astral.stamps.verify()` / `astral.proofs.verify()` not `astral.verify.*`
4. **Applications define trust models** - No built-in weighting, caps, or bonuses

This plan details every line that needs updating and why.

---

## Section 1: Plugin System (Lines 408-489)

### Change 1.1: Plugin Interface (Lines 416-453)

**Current (WRONG):**
```typescript
interface LocationProofPlugin {
  // Plugin metadata
  readonly name: string;        // "proofmode" | "witnesschain"
  readonly version: string;     // Semantic version

  // === Collection Phase (client-side) ===

  /**
   * Collect raw signals from the environment.
   * Implementation varies by device/platform.
   */
  collect(options?: CollectOptions): Promise<RawSignals>;

  /**
   * Process raw signals into an unsigned stamp.
   * Determines spatial/temporal footprint from signals.
   */
  create(signals: RawSignals): Promise<UnsignedStamp>;

  /**
   * Sign the stamp with device/node key.
   */
  sign(stamp: UnsignedStamp, signer: Signer): Promise<LocationStamp>;

  // === Verification Phase (server-side) ===

  /**
   * Verify a stamp's internal validity.
   * Checks signatures, structure, signal consistency.
   */
  verify(stamp: LocationStamp): Promise<StampVerificationResult>;

  /**
   * Assess how well a stamp supports a claim.
   * Probabilistic evaluation, not geometric intersection.
   */
  assess(stamp: LocationStamp, claim: LocationClaim): Promise<ClaimAssessment>;
}
```

**Should be (CORRECT):**
```typescript
interface LocationProofPlugin {
  // Plugin metadata
  readonly name: string;        // "proofmode" | "witnesschain"
  readonly version: string;     // Semantic version
  readonly runtimes: Runtime[]; // Where this plugin can operate
  readonly requiredCapabilities: string[]; // What the plugin needs
  readonly description: string; // Human-readable description

  // === Collection Phase (client-side) ===

  /**
   * Collect raw signals from the environment.
   * Implementation varies by device/platform.
   * Optional - not all plugins collect evidence.
   */
  collect?(options?: CollectOptions): Promise<RawSignals>;

  /**
   * Process raw signals into an unsigned stamp.
   * Determines spatial/temporal footprint from signals.
   * Optional - verification-only plugins may skip this.
   */
  create?(signals: RawSignals): Promise<UnsignedLocationStamp>;

  /**
   * Sign the stamp with device/node key.
   * Optional - some stamps may be pre-signed.
   */
  sign?(stamp: UnsignedLocationStamp, signer: StampSigner): Promise<LocationStamp>;

  // === Verification Phase (server-side) ===

  /**
   * Verify a stamp's internal validity.
   * Checks signatures, structure, signal consistency.
   * Optional - not all plugins implement verification.
   */
  verify?(stamp: LocationStamp): Promise<StampVerificationResult>;
}
```

**Rationale**:
- Remove `assess()` method - evaluation is SDK-side
- Add metadata fields (runtimes, requiredCapabilities, description)
- Make all methods optional with `?`
- Fix type names (UnsignedStamp → UnsignedLocationStamp, Signer → StampSigner)

### Change 1.2: Environment Considerations Table (Lines 456-467)

**Current (WRONG):**
```
| Method | iOS/Android (ProofMode) | Node.js Server (WitnessChain) |
|--------|------------------------|------------------------------|
| `collect()` | Hardware attestation via Secure Enclave/Keystore, sensor fusion | UDP ping to challenger network endpoints |
| `create()` | Fuse attestation data → spatial region | Aggregate latency measurements → spatial region |
| `sign()` | Device key (hardware-backed) | Node key, challenger signatures |
| `verify()` | Runs on Astral TEE | Runs on Astral TEE |
| `assess()` | Runs on Astral TEE | Runs on Astral TEE |
```

**Should be (CORRECT):**
```
| Method | iOS/Android (ProofMode) | Node.js Server (WitnessChain) |
|--------|------------------------|------------------------------|
| `collect()` | Hardware attestation via Secure Enclave/Keystore, sensor fusion | UDP ping to challenger network endpoints |
| `create()` | Fuse attestation data → spatial region | Aggregate latency measurements → spatial region |
| `sign()` | Device key (hardware-backed) | Node key, challenger signatures |
| `verify()` | Plugin-specific validation logic | Plugin-specific validation logic |

**Note**: Evaluation (assessing how well stamps support claims) is performed by the SDK's `ProofsModule`, not by individual plugins. Plugins only verify internal stamp validity.
```

**Rationale**:
- Remove `assess()` row
- Clarify verify() runs in plugin code (can be local or TEE)
- Add note explaining SDK-side evaluation

---

## Section 2: Data Models (Lines 207-406)

### Change 2.1: Rename and Restructure CredibilityAssessment (Lines 325-386)

**Current (WRONG):**
```typescript
interface CredibilityAssessment {
  // Overall confidence (0-1) — NOT a calibrated probability
  confidence: number;

  // Per-stamp verification results
  stampResults: StampResult[];

  // Cross-correlation assessment (for multi-stamp proofs)
  correlation?: CorrelationAssessment;

  // Extensible dimensions (specific fields TBD)
  dimensions?: Record<string, number>;
}

interface StampResult {
  stampIndex: number;
  plugin: string;

  // Stamp-level checks
  signaturesValid: boolean;
  structureValid: boolean;
  signalsConsistent: boolean;

  // Assessment against claim
  supportsClaim: boolean;
  claimSupportScore: number;  // 0-1

  // Plugin-specific output
  pluginResult: Record<string, unknown>;
}

interface CorrelationAssessment {
  // Are stamps from independent systems?
  independence: number;         // 0-1, higher = more independent

  // Do stamps corroborate each other?
  agreement: number;            // 0-1, higher = better agreement

  // Notes
  notes: string[];
}
```

**Should be (CORRECT):**
```typescript
interface CredibilityVector {
  /**
   * Multidimensional proof assessment.
   *
   * Each dimension is independently quantifiable. Applications apply their own
   * weighting schemes to collapse dimensions into trust decisions.
   */
  dimensions: {
    /**
     * Spatial relevance: How close are stamps to the claimed location?
     *
     * Applications decide thresholds (e.g., "require mean < 50m" or
     * "require 80%+ within radius").
     */
    spatial: {
      /** Mean haversine distance from stamps to claim center (meters) */
      meanDistanceMeters: number;
      /** Maximum distance of any stamp from claim center (meters) */
      maxDistanceMeters: number;
      /** Fraction of stamps within claim radius + stamp accuracy (0-1) */
      withinRadiusFraction: number;
    };

    /**
     * Temporal relevance: How well do stamp timeframes align with claim?
     *
     * Higher overlap = stronger temporal evidence.
     */
    temporal: {
      /** Mean overlap between stamp and claim time windows (0-1) */
      meanOverlap: number;
      /** Minimum overlap across all stamps (0-1) */
      minOverlap: number;
      /** Fraction of stamps with 100% temporal overlap (0-1) */
      fullyOverlappingFraction: number;
    };

    /**
     * Internal validity: Did stamps pass cryptographic and structural checks?
     *
     * From plugin.verify() - checks signatures, format, signal consistency.
     */
    validity: {
      /** Fraction of stamps with valid signatures (0-1) */
      signaturesValidFraction: number;
      /** Fraction of stamps with valid structure (0-1) */
      structureValidFraction: number;
      /** Fraction of stamps with consistent internal signals (0-1) */
      signalsConsistentFraction: number;
    };

    /**
     * Independence: Are stamps from diverse, uncorrelated sources?
     *
     * Higher independence = harder to forge all stamps with single compromise.
     *
     * v0: Plugin-level diversity (assumes plugins are independent systems).
     * Future: Deeper correlation analysis (network latency correlation,
     * shared infrastructure detection, etc.)
     */
    independence: {
      /** Ratio of unique plugins to total stamps (0-1, 1.0 = all different) */
      uniquePluginRatio: number;
      /** Fraction of stamps agreeing on spatial relevance (0-1) */
      spatialAgreement: number;
      /** List of unique plugin names contributing evidence */
      pluginNames: string[];
    };
  };

  /**
   * Per-stamp detailed results.
   *
   * PRIVACY NOTE: Future versions may omit this in privacy-preserving modes,
   * returning only aggregated dimensions. For v0, full stamp data is included
   * to enable custom evaluation functions.
   */
  stampResults: StampResult[];

  /**
   * Evaluation metadata.
   */
  meta: {
    /** Total number of stamps evaluated */
    stampCount: number;
    /** Timestamp of evaluation (Unix seconds) */
    evaluatedAt: number;
    /** Where evaluation occurred */
    evaluationMode: 'local' | 'tee' | 'zk';
  };
}

interface StampResult {
  stampIndex: number;
  plugin: string;

  // Stamp-level validity checks (from plugin.verify())
  signaturesValid: boolean;
  structureValid: boolean;
  signalsConsistent: boolean;

  // Measurements against claim (from SDK evaluation)
  supportsClaim: boolean;
  distanceMeters: number;      // Spatial distance from claim
  temporalOverlap: number;     // Temporal overlap with claim (0-1)

  // Plugin-specific output
  pluginResult: Record<string, unknown>;
}
```

**Rationale**:
- Rename `CredibilityAssessment` → `CredibilityVector` (matches SDK)
- Replace scalar `confidence` with multidimensional `dimensions` object
- Remove `CorrelationAssessment` interface (merged into independence dimension)
- Update `StampResult`: remove `claimSupportScore`, add measurements
- Add `meta` object for evaluation metadata
- Add comprehensive documentation explaining the multidimensional model

### Change 2.2: Update VerifiedLocationProof (Lines 387-406)

**Current:**
```typescript
interface VerifiedLocationProof {
  // The original proof
  proof: LocationProof;

  // Verification result
  credibility: CredibilityAssessment;

  // Attestation metadata
  uid: string;
  attester: string;             // Astral service address
  timestamp: number;
  chainId?: number;             // If submitted onchain
}
```

**Should be:**
```typescript
interface VerifiedLocationProof {
  // The original proof
  proof: LocationProof;

  // Verification result
  credibility: CredibilityVector;  // Changed from CredibilityAssessment

  // Attestation metadata
  uid: string;
  attester: string;             // Astral service address
  timestamp: number;
  chainId?: number;             // If submitted onchain
}
```

**Rationale**: Update type reference

---

## Section 3: Verification Flow (Lines 492-554)

### Change 3.1: Single-Stamp Verification Flow (Lines 496-511)

**Current (WRONG):**
```
1. Receive: LocationProof (claim + single stamp)
2. Load plugin for stamp.plugin
3. Verify stamp internally:
   a. plugin.verify(stamp)
   b. Check signatures valid
   c. Check structure valid
   d. Check signals internally consistent
4. Assess stamp against claim:
   a. plugin.assess(stamp, claim)
   b. Probabilistic evaluation of support
5. Generate CredibilityAssessment
6. Create VerifiedLocationProof attestation
7. Return VerifiedLocationProof
```

**Should be (CORRECT):**
```
1. Receive: LocationProof (claim + single stamp)
2. Load plugin for stamp.plugin
3. Verify stamp internally:
   a. plugin.verify(stamp)
   b. Check signatures valid
   c. Check structure valid
   d. Check signals internally consistent
4. Evaluate stamp against claim (SDK-side):
   a. Calculate spatial distance (haversine to claim center)
   b. Calculate temporal overlap (intersection of time windows)
   c. Determine if stamp supports claim (within radius, overlaps temporally)
5. Generate CredibilityVector with dimensions:
   a. Spatial: meanDistanceMeters, maxDistanceMeters, withinRadiusFraction
   b. Temporal: meanOverlap, minOverlap, fullyOverlappingFraction
   c. Validity: fractions from step 3
   d. Independence: trivial for single stamp (uniquePluginRatio = 1.0)
6. Create VerifiedLocationProof attestation
7. Return VerifiedLocationProof
```

**Rationale**:
- Remove `plugin.assess()` - doesn't exist
- Show SDK-side evaluation logic
- Update to generate CredibilityVector not CredibilityAssessment

### Change 3.2: Multi-Stamp Verification Flow (Lines 513-531)

**Current (WRONG):**
```
1. Receive: LocationProof (claim + multiple stamps)
2. For each stamp (in parallel):
   a. Verify stamp internally
   b. Assess stamp against claim
   c. Collect StampResult
3. Cross-correlation analysis:
   a. Assess independence: Are stamps from different systems?
   b. Assess agreement: Do spatial/temporal footprints align?
   c. Note: Redundant stamps (same system) don't add confidence, but don't subtract either
4. Aggregate into CredibilityAssessment:
   a. Combine per-stamp results
   b. Weight by independence and agreement
   c. Compute overall confidence
5. Create VerifiedLocationProof attestation
6. Return VerifiedLocationProof
```

**Should be (CORRECT):**
```
1. Receive: LocationProof (claim + multiple stamps)
2. For each stamp (in parallel):
   a. Load plugin for stamp.plugin
   b. Verify stamp internally via plugin.verify()
   c. Evaluate stamp against claim (SDK-side):
      - Calculate spatial distance
      - Calculate temporal overlap
      - Determine supportsClaim boolean
   d. Collect StampResult with measurements
3. Calculate aggregated dimensions:
   a. Spatial:
      - meanDistanceMeters across all stamps
      - maxDistanceMeters (worst case)
      - withinRadiusFraction (how many stamps are within claim radius)
   b. Temporal:
      - meanOverlap across all stamps
      - minOverlap (worst case)
      - fullyOverlappingFraction (how many stamps fully overlap)
   c. Validity:
      - signaturesValidFraction (from plugin.verify())
      - structureValidFraction
      - signalsConsistentFraction
   d. Independence:
      - uniquePluginRatio (unique plugins / total stamps)
      - spatialAgreement (how closely stamps agree on location)
      - pluginNames array
4. Generate CredibilityVector with all dimensions + stampResults + meta
5. Create VerifiedLocationProof attestation
6. Return VerifiedLocationProof
```

**Rationale**:
- Remove plugin.assess() references
- Show explicit dimension calculations
- Remove "weight by independence" - applications do weighting
- Remove "compute overall confidence" - no scalar confidence

### Change 3.3: Confidence Calculation Section (Lines 533-554)

**Current (WRONG):**
```
### Confidence Calculation

The confidence calculation follows the evidence evaluation framework from [Towards Stronger Location Proofs](https://raw.githubusercontent.com/AstralProtocol/research/refs/heads/main/docs/towards-harder-location-proofs.md):

```
confidence = f(
  stampValidity[],        // Did each stamp pass internal verification?
  claimSupportScores[],   // How well does each stamp support the claim?
  independence,           // Are evidence sources uncorrelated?
  agreement               // Do sources agree with each other?
)
```

From the research document, the evidence function $\mathcal{E}$ combines stamps through:
- **Correlation/Independence**: Distinct vs redundant information sources
- **Strength/Robustness**: Intrinsic reliability including forgery resistance
- **Relevance**: How directly evidence pertains to the spatiotemporal claim

Key principle: **Independent, corroborating evidence increases confidence. Redundant evidence from the same system neither adds nor subtracts.**

Formalizing this function with calibrated weights is future work. See the research document for the mathematical framework.
```

**Should be (CORRECT):**
```
### Multidimensional Credibility Model

The SDK evaluates proofs across four independent dimensions:

**1. Spatial Relevance**
```
meanDistanceMeters = Σ(haversine(stamp.location, claim.location)) / n
maxDistanceMeters = max(haversine(stamp.location, claim.location))
withinRadiusFraction = count(distance ≤ claim.radius) / n
```

**2. Temporal Relevance**
```
overlap(stamp, claim) = intersection(stamp.timeWindow, claim.timeWindow) / min(durations)
meanOverlap = Σ(overlap) / n
minOverlap = min(overlap)
fullyOverlappingFraction = count(overlap == 1.0) / n
```

**3. Validity** (from plugin.verify())
```
signaturesValidFraction = count(signaturesValid) / n
structureValidFraction = count(structureValid) / n
signalsConsistentFraction = count(signalsConsistent) / n
```

**4. Independence**
```
uniquePluginRatio = uniquePlugins / totalStamps
spatialAgreement = 1 - (stddev(distances) / mean(distances))
pluginNames = [unique plugin names]
```

**Applications Define Trust Models**

The SDK provides raw measurements. Applications weight dimensions according to their requirements:

```typescript
// Example: Require all validity checks + reasonable spatial/temporal match
function myTrustModel(vector: CredibilityVector): boolean {
  const { dimensions } = vector;

  // All stamps must be valid
  if (dimensions.validity.signaturesValidFraction < 1.0) return false;
  if (dimensions.validity.structureValidFraction < 1.0) return false;
  if (dimensions.validity.signalsConsistentFraction < 1.0) return false;

  // Spatial: mean distance < 100m
  if (dimensions.spatial.meanDistanceMeters > 100) return false;

  // Temporal: at least 50% overlap
  if (dimensions.temporal.meanOverlap < 0.5) return false;

  return true;
}
```

**No Built-in Weighting**: The SDK does NOT collapse dimensions into a single confidence score. This prevents false precision and lets applications encode their own trust assumptions.

See [Towards Stronger Location Proofs](https://raw.githubusercontent.com/AstralProtocol/research/refs/heads/main/docs/towards-harder-location-proofs.md) for the theoretical framework.
```

**Rationale**:
- Remove scalar confidence calculation
- Show explicit formulas for each dimension
- Add example trust model showing application-side weighting
- Emphasize no built-in weighting or caps

---

## Section 4: SDK Design (Lines 556-651)

### Change 4.1: SDK Namespace (Lines 559-573)

**Current (WRONG):**
```typescript
// Stamp collection (client SDK)
astral.stamps.collect(pluginOptions)      // Collect signals
astral.stamps.create(pluginOptions, signals)  // Create unsigned stamp
astral.stamps.sign(stamp, signer)         // Sign stamp

// Proof construction
astral.proofs.create(claim, stamps)       // Bundle claim + stamps

// Verification operations
astral.verify.stamp(stamp)                // Verify stamp internally (no claim)
astral.verify.proof(proof)                // Full verification against claim
```

**Should be (CORRECT):**
```typescript
// Plugin registration
astral.plugins.register(plugin)           // Register a proof-of-location plugin
astral.plugins.get(name)                  // Get plugin by name
astral.plugins.list()                     // List all registered plugins

// Stamp collection (client SDK)
astral.stamps.collect(options)            // Collect signals from plugins
astral.stamps.create(options, signals)    // Create unsigned stamp
astral.stamps.sign(options, unsigned, signer)  // Sign stamp
astral.stamps.verify(stamp)               // Verify stamp internally (no claim)

// Proof construction and evaluation
astral.proofs.create(claim, stamps)       // Bundle claim + stamps
astral.proofs.verify(proof, options)      // Full evaluation against claim
```

**Rationale**:
- Add `astral.plugins.*` namespace
- Move `verify(stamp)` to `astral.stamps.verify()`
- Move `verify(proof)` to `astral.proofs.verify()`
- Remove `astral.verify.*` namespace

### Change 4.2: Plugin Options Update (Lines 575-585)

**Current:**
```typescript
interface PluginOptions {
  name: string;       // "proofmode" | "witnesschain" | ...
  version: string;    // Plugin version to use
  config?: Record<string, unknown>;  // Plugin-specific config
}
```

**Should be:**
```typescript
interface StampsCollectOptions {
  /** Which plugins to collect from. If omitted, uses all plugins that implement collect(). */
  plugins?: string[];
  /** Timeout in milliseconds */
  timeout?: number;
  /** Accuracy mode hint */
  accuracy?: 'high' | 'medium' | 'low';
}

interface StampsCreateOptions {
  /** Which plugin to use for creating the stamp. */
  plugin: string;
}

interface StampsSignOptions {
  /** Which plugin to use for signing. */
  plugin: string;
}

interface ProofsVerifyOptions {
  /** Verification mode */
  mode?: 'local' | 'tee' | 'zk';
  /** API endpoint for hosted verification */
  endpoint?: string;
}
```

**Rationale**: Show actual SDK option types

### Change 4.3: Example Usage (Lines 587-632)

**Current (WRONG):**
```typescript
import { astral } from '@decentralized-geo/astral-sdk';

// === Client Side: Collect Evidence ===

// Collect signals using ProofMode plugin
const pluginOptions = {
  name: 'proofmode',
  version: '0.1.0',
  config: { timeout: 5000 }
};

const signals = await astral.stamps.collect(pluginOptions);

// Create and sign stamp
const unsigned = await astral.stamps.create(pluginOptions, signals);
const stamp = await astral.stamps.sign(unsigned, deviceSigner);

// === Create Location Proof ===

// Define the claim (extends Location Protocol)
const claim = {
  // Location Protocol fields
  lpVersion: '0.2',
  locationType: 'geojson-point',
  location: { type: 'Point', coordinates: [-122.4194, 37.7749] },
  srs: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84',
  // Verification-specific fields
  subject: { scheme: 'eth-address', value: '0x...' },
  radius: 100,  // meters — required
  time: { start: Date.now() / 1000 - 60, end: Date.now() / 1000 },
  eventType: 'presence'
};

// Bundle into proof
const proof = astral.proofs.create(claim, [stamp]);

// === Submit for Verification ===

const result = await astral.verify.proof(proof);

console.log(result.credibility.confidence);  // 0.85
console.log(result.uid);                     // 0xabc123...
```

**Should be (CORRECT):**
```typescript
import { AstralSDK } from '@decentralized-geo/astral-sdk';
import { MockPlugin } from '@decentralized-geo/plugin-mock';
import { ethers } from 'ethers';

// === Setup ===

const astral = new AstralSDK({ chainId: 84532 });

// Register plugin
astral.plugins.register(new MockPlugin({
  defaultLocation: { lat: 37.7749, lon: -122.4194 },
  jitterMeters: 50
}));

// === Client Side: Collect Evidence ===

const signals = await astral.stamps.collect({ plugins: ['mock'] });

// Create and sign stamp
const unsigned = await astral.stamps.create({ plugin: 'mock' }, signals[0]);

const wallet = new ethers.Wallet(process.env.PRIVATE_KEY);
const signer = {
  algorithm: 'secp256k1',
  signer: { scheme: 'eth-address', value: wallet.address },
  sign: async (data: string) => wallet.signMessage(data),
};

const stamp = await astral.stamps.sign({ plugin: 'mock' }, unsigned, signer);

// === Create Location Proof ===

const claim = {
  lpVersion: '0.2',
  locationType: 'geojson-point',
  location: { type: 'Point', coordinates: [-122.4194, 37.7749] },
  srs: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84',
  subject: { scheme: 'eth-address', value: wallet.address },
  radius: 100,  // meters
  time: {
    start: Math.floor(Date.now() / 1000) - 300,
    end: Math.floor(Date.now() / 1000)
  },
};

const proof = astral.proofs.create(claim, [stamp]);

// === Verify Proof ===

const assessment = await astral.proofs.verify(proof);

console.log(assessment.dimensions.spatial);
// {
//   meanDistanceMeters: 45.2,
//   maxDistanceMeters: 45.2,
//   withinRadiusFraction: 1.0
// }

console.log(assessment.dimensions.temporal.meanOverlap);  // 1.0
console.log(assessment.dimensions.validity.signaturesValidFraction);  // 1.0
console.log(assessment.uid);  // undefined - only set if hosted verification
```

**Rationale**:
- Show actual SDK initialization
- Use correct imports
- Fix API calls: `astral.verify.proof()` → `astral.proofs.verify()`
- Show multidimensional output instead of scalar confidence
- Remove `.uid` from local verification result

### Change 4.4: Multi-Stamp Example (Lines 634-651)

**Current (WRONG):**
```typescript
// Collect from multiple plugins
const proofmodeStamp = await collectAndSign({ name: 'proofmode', version: '0.1.0' });
const witnessStamp = await collectAndSign({ name: 'witnesschain', version: '0.1.0' });

// Bundle into proof with multiple stamps
const proof = astral.proofs.create(claim, [proofmodeStamp, witnessStamp]);

// Verify multi-stamp proof
const result = await astral.verify.proof(proof);

// Access cross-correlation analysis
console.log(result.credibility.correlation.independence);  // 0.95 (different systems)
console.log(result.credibility.correlation.agreement);     // 0.88 (they agree)
console.log(result.credibility.confidence);                // Higher than single-stamp
```

**Should be (CORRECT):**
```typescript
// Register multiple plugins
astral.plugins.register(new MockPlugin({ /* config */ }));
astral.plugins.register(new WitnessChainPlugin({ proverId: '0x...' }));

// Collect from multiple plugins
const signals = await astral.stamps.collect({ plugins: ['mock', 'witnesschain'] });

// Create and sign stamps
const stamps = [];
for (const s of signals) {
  const unsigned = await astral.stamps.create({ plugin: s.plugin }, s);
  const signed = await astral.stamps.sign({ plugin: s.plugin }, unsigned, signer);
  stamps.push(signed);
}

// Bundle into proof with multiple stamps
const proof = astral.proofs.create(claim, stamps);

// Verify multi-stamp proof
const assessment = await astral.proofs.verify(proof);

// Access independence dimension
console.log(assessment.dimensions.independence);
// {
//   uniquePluginRatio: 1.0,         // All stamps from different plugins
//   spatialAgreement: 0.95,         // Stamps agree on location
//   pluginNames: ['mock', 'witnesschain']
// }

// Access spatial dimension
console.log(assessment.dimensions.spatial);
// {
//   meanDistanceMeters: 35.8,       // Average across both stamps
//   maxDistanceMeters: 52.1,        // Worst case
//   withinRadiusFraction: 1.0       // Both within radius
// }

console.log(assessment.meta.stampCount);  // 2
```

**Rationale**:
- Show actual multi-plugin workflow
- Fix API: `astral.verify.proof()` → `astral.proofs.verify()`
- Remove `correlation` object (merged into independence dimension)
- Show dimensions output instead of scalar confidence

---

## Section 5: API Design (Lines 655-725)

### Change 5.1: POST /verify/proof Response (Lines 679-701)

**Current (WRONG):**
```typescript
// Response
{
  uid: string,
  credibility: CredibilityAssessment,
  proof: LocationProof,
  attester: string,
  timestamp: number
}
```

**Should be (CORRECT):**
```typescript
// Response
{
  uid: string,
  credibility: CredibilityVector,  // Changed type
  proof: LocationProof,
  attestation: { /* EAS attestation */ },
  delegatedAttestation: { /* For onchain submission */ },
  attester: string,
  timestamp: number
}
```

**Rationale**: Update type and add attestation fields

---

## Section 6: EAS Schemas (Lines 729-764)

### Change 6.1: VerifiedLocationProof Schema (Lines 731-748)

**Current:**
```solidity
// Schema fields (snake_case per LP v0.2)
bytes32 claim_hash             // Hash of the LocationClaim
bytes32 proof_hash             // Hash of the full LocationProof
uint8 confidence               // 0-100 (scaled from 0-1)
string credibility_uri         // URI to full CredibilityAssessment (IPFS, etc.)
```

**Design notes:**
- Offchain attestations are valid — no requirement to submit onchain
- `claim_hash` and `proof_hash` enable verification without storing full data onchain
- `confidence` is the headline number for simple checks (NOT a calibrated probability)
- Full credibility assessment stored offchain, referenced by URI

**Should be:**
```solidity
// Schema fields (snake_case per LP v0.2)
bytes32 claim_hash             // Hash of the LocationClaim
bytes32 proof_hash             // Hash of the full LocationProof
string credibility_uri         // URI to full CredibilityVector (IPFS, etc.)
```

**Design notes:**
- Offchain attestations are valid — no requirement to submit onchain
- `claim_hash` and `proof_hash` enable verification without storing full data onchain
- Full credibility vector (multidimensional assessment) stored offchain, referenced by URI
- No single confidence score - applications define their own trust models from the dimensions

**Rationale**:
- Remove `uint8 confidence` field - no scalar confidence
- Update URI description: CredibilityAssessment → CredibilityVector
- Update notes to explain multidimensional model

---

## Section 7: Conceptual Framework Updates

### Change 7.1: Verification Definition (Line 78)

**Current:**
```
**Verification (Evidence Evaluation)** — The process of evaluating whether stamps support a claim. This is a **probabilistic assessment**, not a simple geometric intersection. The output is a **credibility assessment** quantifying confidence.
```

**Should be:**
```
**Verification (Evidence Evaluation)** — The process of evaluating whether stamps support a claim across multiple dimensions. This produces a **credibility vector** with spatial, temporal, validity, and independence measurements. Applications weight these dimensions according to their own trust models.
```

**Rationale**: Update to describe multidimensional output

### Change 7.2: Architecture Diagram Note (Lines 132-144)

Add note after the Verify Module diagram:

```
**Note**: The "Assess vs Claim" and "Assess Cross-Correlation" steps are performed by the SDK's ProofsModule, not by individual plugins. Plugins only verify internal stamp validity.
```

---

## Section 8: Conceptual Framework - Confidence Section (Lines 325-337)

### Change 8.1: Confidence vs Probability Paragraph

**Current:**
```
**Confidence vs Probability:** The `confidence` score is NOT a calibrated probability. It's a heuristic assessment that incorporates:
- Evidence validity (signatures, structure)
- Claim support (does evidence footprint cover the claim?)
- Source independence and agreement

A confidence of 0.8 does NOT mean "80% probability the claim is true." It means "the evidence is reasonably strong." Calibrating confidence to true probability is future work.

See [Towards Stronger Location Proofs](https://raw.githubusercontent.com/AstralProtocol/research/refs/heads/main/docs/towards-harder-location-proofs.md) for formal treatment of evidence evaluation functions.
```

**Should be:**
```
**Multidimensional Assessment:** The SDK produces a CredibilityVector with four independent dimensions rather than a single confidence score:

1. **Spatial**: How close are stamps to the claimed location? (mean/max distance, within-radius fraction)
2. **Temporal**: How well do stamps overlap the claimed time window? (mean/min overlap, fully-overlapping fraction)
3. **Validity**: Did stamps pass cryptographic checks? (signatures/structure/signals fractions)
4. **Independence**: Are stamps from different sources? (unique plugin ratio, spatial agreement)

Applications define their own trust models to weight these dimensions. There is NO built-in scalar confidence score because:
- Different applications have different requirements (a check-in app vs. a land registry)
- Spatial/temporal precision requirements vary by use case
- Collapsing to a single number creates false precision

See [Towards Stronger Location Proofs](https://raw.githubusercontent.com/AstralProtocol/research/refs/heads/main/docs/towards-harder-location-proofs.md) for the theoretical framework.
```

**Rationale**: Rewrite to explain why multidimensional > scalar

---

## Implementation Checklist

- [ ] Section 1: Plugin System (Lines 408-489)
  - [ ] 1.1: Remove assess() from plugin interface
  - [ ] 1.2: Update environment table
- [ ] Section 2: Data Models (Lines 207-406)
  - [ ] 2.1: Replace CredibilityAssessment with CredibilityVector
  - [ ] 2.2: Update VerifiedLocationProof type
- [ ] Section 3: Verification Flow (Lines 492-554)
  - [ ] 3.1: Update single-stamp flow
  - [ ] 3.2: Update multi-stamp flow
  - [ ] 3.3: Rewrite confidence calculation section
- [ ] Section 4: SDK Design (Lines 556-651)
  - [ ] 4.1: Fix SDK namespace
  - [ ] 4.2: Update plugin options
  - [ ] 4.3: Rewrite single-stamp example
  - [ ] 4.4: Rewrite multi-stamp example
- [ ] Section 5: API Design (Lines 655-725)
  - [ ] 5.1: Update /verify/proof response type
- [ ] Section 6: EAS Schemas (Lines 729-764)
  - [ ] 6.1: Remove confidence field from schema
- [ ] Section 7: Conceptual Framework (Lines 60-95)
  - [ ] 7.1: Update verification definition
  - [ ] 7.2: Add note to architecture diagram
- [ ] Section 8: Confidence Section (Lines 325-337)
  - [ ] 8.1: Rewrite confidence vs probability paragraph

---

## Validation Steps

After implementing all changes:

1. **Cross-reference with SDK**: Read `astral-sdk/src/plugins/types.ts`, `astral-sdk/src/proofs/ProofsModule.ts`, `astral-sdk/src/stamps/StampsModule.ts` to verify all types and flows match
2. **Test code examples**: Copy example code into a test file and verify it type-checks against the SDK
3. **Check consistency**: Search for any remaining references to:
   - `assess()` or `evaluate()` as plugin methods
   - `astral.verify.*` namespace
   - `CredibilityAssessment` type
   - Scalar `confidence` scores
   - `correlation` as separate object
4. **Review with team**: Have someone unfamiliar with the changes read through to catch conceptual errors

---

## Notes

- This spec was written during design phase (2025-02-04) before final SDK implementation
- SDK implementation (PR #54) is the source of truth
- Some future work sections (TEE attestation, ZK verification) are still speculative and don't need updating
- The research document link (Towards Stronger Location Proofs) should remain - it's still the theoretical foundation
