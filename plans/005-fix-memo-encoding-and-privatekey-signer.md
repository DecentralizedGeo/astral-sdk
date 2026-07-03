# Plan 005: Fix the two broken happy paths — memo-less attestations fail to encode, privateKey config never creates a signer

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 9fdf311..HEAD -- src/eas/OffchainSigner.ts src/eas/OnchainRegistrar.ts test/eas/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition. In particular, if Plan 003 landed
> first, `OffchainSigner.ts` line numbers will have shifted — locate the code
> by symbol name, and re-check excerpts before editing.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW — both fixes make a currently-failing path work; encoding an
  empty-string memo is standard EAS practice
- **Depends on**: plans/002-add-ci-verification-baseline.md
- **Category**: bug
- **Planned at**: commit `9fdf311`, 2026-07-02

## Why this matters

Two documented, typed, supported inputs fail at runtime:

1. **Omitting `memo`** (typed optional everywhere) produces 8 schema items
   against the 9-field EAS schema whose raw string always ends in
   `string memo`. The EAS `SchemaEncoder.encodeData` requires a value per
   schema field, so encoding throws — meaning `memo` is effectively mandatory
   and the simplest quick-start call without a memo dies with an opaque
   `EASError`.
2. **Passing `privateKey` instead of `signer`** to the offchain signer (an
   explicitly documented config option) passes constructor validation but the
   key is never used to construct a wallet — signing later fails with
   "No valid signer provided", which is both wrong (a key WAS provided) and
   misleading to debug.

Both are small, isolated fixes in the EAS layer with clean verification.

## Current state

- Schema raw string (9 fields, memo last) — defined identically at
  `src/core/config.ts:50` and `src/schemas/location-v1.ts:145`:

  ```
  'uint256 eventTimestamp,string srs,string locationType,string location,string[] recipeType,bytes[] recipePayload,string[] mediaType,string[] mediaData,string memo'
  ```

- Conditional memo append — two near-identical `formatProofForEAS`
  implementations:

  ```typescript
  // src/eas/OffchainSigner.ts:205-208
  // Add optional fields if present
  if (proof.memo !== undefined) {
    schemaItems.push({ name: 'memo', value: proof.memo, type: 'string' });
  }
  ```

  ```typescript
  // src/eas/OnchainRegistrar.ts:359-361
  if (proof.memo !== undefined) {
    schemaItems.push({ name: 'memo', value: proof.memo, type: 'string' });
  }
  ```

  In both, the eight other items are always pushed unconditionally just above.

- privateKey accepted but dropped:

  ```typescript
  // src/eas/OffchainSigner.ts:53-63
  constructor(config: OffchainSignerConfig) {
    if (!config.signer && !config.privateKey) {
      throw new ValidationError('Either signer or privateKey must be provided', undefined, {
        config,
      });
    }
    this.signer = config.signer as Signer; // privateKey never used
    ...
  ```

  `OffchainSignerConfig` (`src/core/types.ts:412-417`) declares
  `readonly privateKey?: string`. The failure surfaces later at
  `ensureOffchainModuleInitialized` (`OffchainSigner.ts:170-177`):
  "No valid signer provided".

  Note also: the `ValidationError` above puts the whole `config` — which may
  contain a private key — into the error context. While a broad
  context-redaction pass is out of scope (recorded as a separate finding in
  `plans/README.md`), Step 3 removes `config` from THIS error's context since
  you are touching the line anyway.

- Callers that forward `privateKey` into this constructor:
  `src/location/OffchainWorkflow.ts:56-72` (from `options.privateKey`).
  No changes needed there — fixing the constructor fixes them.
- Conventions: strict TS; `Wallet` is available from `ethers` (v6) — the repo
  already imports `{ Signer }` from 'ethers' in this file; tests
  (`test/eas/OffchainSigner.test.ts`) build wallets with `new Wallet(<hex>)`.

## Commands you will need

| Purpose | Command | Expected on success |
|-----------|------------------------------------------|---------------------|
| Install | `pnpm install` | exit 0 |
| Typecheck | `pnpm run typecheck` | exit 0 |
| Lint | `pnpm run lint` | exit 0 |
| Suites | `pnpm test -- test/eas` | all pass |
| All tests | `pnpm run test` | all pass |

## Scope

**In scope** (the only files you may modify/create):
- `src/eas/OffchainSigner.ts` (memo append + constructor)
- `src/eas/OnchainRegistrar.ts` (memo append only)
- `test/eas/OffchainSigner.test.ts`, `test/eas/OnchainRegistrar.test.ts`
  (new cases)

**Out of scope** (do NOT touch):
- The schema raw strings in `src/core/config.ts` / `src/schemas/location-v1.ts`
  — making memo truly optional in the SCHEMA would change the on-chain data
  contract; the fix is to always encode a value, not to alter the schema.
- `OnchainRegistrarConfig` / provider-side key handling — the registrar takes
  `provider`+`signer`; it has no privateKey option, don't add one.
- `src/location/OffchainWorkflow.ts` and both `AstralSDK` classes.
- Plan 003's verification logic (if already landed).

## Git workflow

- Branch: `advisor/005-memo-and-privatekey-fixes`
- Commit style: conventional commits; two commits preferred:
  `fix(eas): always encode memo field so memo-less attestations encode` and
  `fix(eas): construct wallet signer from privateKey config`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Make the memo item unconditional (both files)

In `src/eas/OffchainSigner.ts` (~line 205) and `src/eas/OnchainRegistrar.ts`
(~line 359), replace the conditional block with an unconditional item using
an empty-string default, e.g. move `memo` into the always-pushed
`schemaItems` array literal:

```typescript
{ name: 'memo', value: proof.memo ?? '', type: 'string' },
```

and delete the `if (proof.memo !== undefined)` block.

**Verify**: `grep -n "proof.memo !== undefined" src/eas/` → no matches;
`pnpm run typecheck` → exit 0.

### Step 2: Construct a Wallet from privateKey in OffchainSigner

In the constructor, extend the `ethers` import to include `Wallet`, and
replace `this.signer = config.signer as Signer;` with:

```typescript
if (config.signer) {
  this.signer = config.signer as Signer;
} else if (config.privateKey) {
  this.signer = new Wallet(config.privateKey);
}
```

(A `Wallet` without a provider signs EIP-712 payloads fine — offchain signing
needs no network.)

**Verify**: `pnpm run typecheck` → exit 0.

### Step 3: Drop the config object from the constructor's ValidationError context

In the same constructor, change the `ValidationError` construction so the
third argument no longer includes the raw `config` object (pass `undefined`
or a minimal `{ hasSigner: !!config.signer, hasPrivateKey: !!config.privateKey }`).
Rationale: `config.privateKey` must never ride along inside error objects
that applications routinely log.

**Verify**: `grep -n "config,\s*$" src/eas/OffchainSigner.ts` inside the
constructor region → no match placing `config` in the error context;
`pnpm run lint` → exit 0.

### Step 4: Add regression tests

See Test plan.

**Verify**: `pnpm test -- test/eas` → all pass including new cases.

### Step 5: Full suite

**Verify**: `pnpm run test` → exit 0.

## Test plan

Extend the existing suites (they already mock the EAS SDK and build fixture
attestations — follow the local fixture style):

In `test/eas/OffchainSigner.test.ts`:
1. **memo-less sign**: build an `UnsignedLocationAttestation` fixture with NO
   `memo` property; `signOffchainLocationAttestation` resolves without
   throwing (with the mocked EAS SDK, assert the mocked
   `SchemaEncoder.encodeData` was called with 9 items and that the memo item
   equals `{ name: 'memo', value: '', type: 'string' }`).
2. **privateKey-only construction**: `new OffchainSigner({ privateKey: <the
   well-known public Hardhat/Anvil account-0 test key already used in this
   repo's test files — copy it from an existing test, never a real key> })`
   → constructor succeeds AND `signOffchainLocationAttestation` on a fixture
   does not throw "No valid signer provided".

In `test/eas/OnchainRegistrar.test.ts`:
3. **memo-less register**: fixture without `memo` → the registrar's
   `formatProofForEAS` path (via the public register method with mocked EAS)
   encodes 9 items, memo `''`.

Verification: `pnpm test -- test/eas` → all pass, 3+ new tests.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm run typecheck`, `pnpm run lint`, `pnpm run test` all exit 0
- [ ] `grep -rn "proof.memo !== undefined" src/` → no matches
- [ ] `grep -n "new Wallet(config.privateKey)" src/eas/OffchainSigner.ts` → 1 match
- [ ] New tests (memo-less sign, memo-less register, privateKey-only signer)
      exist and pass
- [ ] No files outside the in-scope list modified (`git status --porcelain`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- An existing test asserts that memo-less input THROWS (someone may have
  codified the bug as intended behavior) — report it; do not delete the test
  without noting it.
- Plan 003 landed and its content-binding comparison (re-encoding
  `formatProofForEAS`) fails for proofs signed before this change — see Plan
  003's maintenance note; report rather than patching verification here.
- `Wallet` import creates a typecheck conflict with the existing `Signer`
  import pattern that you cannot resolve in one attempt.
- You find additional conditional schema-item omissions beyond memo (e.g.
  another optional field skipped) — fix ONLY memo; report the others.

## Maintenance notes

- After this lands, a memo-less attestation encodes `memo: ''`. Decoders
  (e.g. the legacy `decodeLocationAttestation` in `src/core/AstralSDK.ts`)
  will surface an empty string rather than `undefined` — semantically fine,
  but anyone round-tripping attestations should treat `''` and absent memo as
  equivalent.
- If a future schema version wants truly-optional fields, that is a schema
  design change (new rawString + new UID), not an encoder tweak.
- Reviewers: check that the 9-item order exactly matches the rawString field
  order — EAS encodes positionally per the schema string.
