# Plan 004: Stop the silent Sepolia fallback and make chains.ts the single source of chain/contract truth

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 9fdf311..HEAD -- src/eas/OnchainRegistrar.ts src/compute/ComputeModule.ts src/core/config.ts src/eas/chains.ts`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: M
- **Risk**: MED — touches on-chain contract-address resolution; wrong
  consolidation silently changes which contract receives transactions
- **Depends on**: plans/002-add-ci-verification-baseline.md
- **Category**: bug / tech-debt
- **Planned at**: commit `9fdf311`, 2026-07-02

## Why this matters

Two related defects share one root cause (chain metadata duplicated instead of
looked up):

1. **Silent wrong-chain registration.** `OnchainRegistrar`'s constructor
  resolves chain names through a hardcoded if/else ladder. Any name outside
  the six known strings falls into a broken lookup that always throws
  internally and is then caught by a catch block that silently defaults to
  **Sepolia**. A user who passes `chain: 'polygon'` (unsupported) or
  `chain: 'Basse'` (typo) gets their attestation registered on Sepolia with
  no error — an attestation on the wrong network.
2. **Divergent contract-address maps.** `ComputeModule` keeps its own
  `EAS_CONTRACT_ADDRESSES` literal, independent of the canonical `EAS_CONFIG`
  in `src/core/config.ts`. The two already disagree on coverage
  (ComputeModule has Ethereum mainnet `1`; `EAS_CONFIG` does not.
  `EAS_CONFIG` has `base-sepolia` metadata ComputeModule lacks). An address
  correction in one place won't propagate. Worse, an unlisted `chainId`
  leaves `ComputeModule.eas` silently `undefined`, and `submit()` later fails
  with the misleading message "Signer is required".

After this plan: unknown chain names/ids throw a clear `ChainConnectionError`
at construction, and every module resolves contract addresses through
`src/eas/chains.ts`.

## Current state

- `src/eas/chains.ts` — the canonical resolver. Already exports everything
  needed:
  - `getChainConfig(chainId, version?)` — throws `ChainConnectionError` for
    unknown ids (`chains.ts:113-135`).
  - `getChainConfigByName(chainName, version?)` — case-insensitive name
    lookup, throws `ChainConnectionError` with the supported-chain list for
    unknown names (`chains.ts:145-170`).
  - `getChainId(chainName)` (`chains.ts:180+`), `getSchemaUID(chainId)`.
- `src/core/config.ts:52-95` — `EAS_CONFIG` (`v1.0.0`) with chains keyed by id
  string: `42220` celo, `42161` arbitrum, `11155111` sepolia, `8453` base,
  `10` optimism, `84532` base-sepolia. Each entry: `{ chain, deploymentBlock,
  rpcUrl, easContractAddress, schemaUID }`. **No entry for Ethereum mainnet
  (id 1).**
- `src/eas/OnchainRegistrar.ts:60-121` — the ladder. Shape (abridged, real
  code repeats the same 5 lines per chain):

  ```typescript
  // src/eas/OnchainRegistrar.ts:62-67
  if (config.chain === 'sepolia') {
    this.chainId = 11155111;
    this.chainName = 'sepolia';
    const chainConfig = getChainConfig(this.chainId);
    this.contractAddress = chainConfig.easContractAddress;
    this.schemaUID = config.schemaUID || getSchemaUID(this.chainId);
  } else if (config.chain === 'celo') { /* …same for celo, arbitrum, base,
    optimism, base-sepolia… */ }
  else {
    // src/eas/OnchainRegistrar.ts:98-120
    try {
      const chainConfig = getChainConfig(0, undefined); // ALWAYS throws
      const filteredChains = Object.entries(chainConfig).filter(/* dead code */);
      // ...
    } catch (error) {
      // Fallback to Sepolia for tests
      this.chainId = 11155111;
      this.chainName = 'sepolia';
    }
  }
  ```

  Note the comment "Fallback to Sepolia for tests" — check what the tests
  actually rely on (Step 1). Also `OnchainRegistrar.ts:234-248` contains a
  second inline chainId→name map (used elsewhere in the class) — replace its
  body with `getChainConfig(chainId).chain` lookup if trivially possible,
  otherwise leave and note it.
- `src/compute/ComputeModule.ts:27-35` — the divergent map, verbatim:

  ```typescript
  const EAS_CONTRACT_ADDRESSES: Record<number, string> = {
    84532: '0x4200000000000000000000000000000000000021', // Base Sepolia
    8453: '0x4200000000000000000000000000000000000021', // Base Mainnet
    1: '0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587', // Ethereum Mainnet
    11155111: '0xC2679fBD37d54388Ce493F1DB75320D236e1815e', // Sepolia
    42220: '0x72E1d8ccf5299fb36fEfD8CC4394B8ef7e98Af92', // Celo
    42161: '0xbD75f629A22Dc1ceD33dDA0b68c546A1c035c458', // Arbitrum
    10: '0x4200000000000000000000000000000000000021', // Optimism
  };
  ```

  and `ComputeModule.ts:60-66`:

  ```typescript
  private initializeEAS(): void {
    const address = EAS_CONTRACT_ADDRESSES[this.chainId];
    if (address && this.signer) { // silently skips when address undefined
      this.eas = new EAS(address);
      this.eas.connect(this.signer);
    }
  }
  ```

- Error convention: throw typed errors from `src/core/errors.ts`
  (`ChainConnectionError`, `ValidationError`) with a message and context
  object — see `chains.ts:123-131` for the exemplar.

## Commands you will need

| Purpose | Command | Expected on success |
|-----------|-------------------------------------------|---------------------|
| Install | `pnpm install` | exit 0 |
| Typecheck | `pnpm run typecheck` | exit 0 |
| Lint | `pnpm run lint` | exit 0 |
| Suites | `pnpm test -- test/eas/OnchainRegistrar test/compute test/eas/chains` | all pass |
| All tests | `pnpm run test` | all pass |

## Scope

**In scope** (the only files you may modify/create):
- `src/eas/OnchainRegistrar.ts`
- `src/compute/ComputeModule.ts`
- `src/core/config.ts` (ONLY to add the Ethereum mainnet entry, Step 3)
- `test/eas/OnchainRegistrar.test.ts`, `test/compute/*` (assertion updates +
  new cases)

**Out of scope** (do NOT touch):
- `src/eas/chains.ts` — it is already correct; it is the target, not the patient.
- `config/EAS-config.json` — runtime uses the in-code `EAS_CONFIG` default
  (see `loadEASConfig`, `chains.ts:30-31`); keep the JSON file as is.
- Legacy `src/core/AstralSDK.ts` — its chain handling flows through
  `OnchainRegistrar`, which is enough.
- Any schemaUID value change.

## Git workflow

- Branch: `advisor/004-chain-config-single-source`
- Commit style: conventional commits, e.g. `fix(eas): reject unknown chains instead of falling back to Sepolia`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Characterize current test expectations

Run `pnpm test -- test/eas/OnchainRegistrar test/compute` and read
`test/eas/OnchainRegistrar.test.ts` for any test that (a) constructs a
registrar with an unknown chain name, or (b) relies on the Sepolia fallback.
Record what you find; you will update those tests in Step 5, not silently
inherit them.

**Verify**: suites pass at HEAD (record baseline count of tests).

### Step 2: Replace the OnchainRegistrar ladder

In the constructor (`OnchainRegistrar.ts:60-121`), replace the entire
`if (config.chain) { ...ladder... }` block with a single resolution through
the canonical config:

```typescript
if (config.chain) {
  const chainConfig = getChainConfigByName(config.chain); // throws ChainConnectionError for unknown names
  this.chainId = getChainId(config.chain);
  this.chainName = chainConfig.chain;
  this.contractAddress = chainConfig.easContractAddress;
  this.schemaUID = config.schemaUID || getSchemaUID(this.chainId);
}
```

Add `getChainConfigByName` and `getChainId` to the existing import from
`./chains`. Delete the dead `getChainConfig(0, ...)` lookup and the
catch-with-Sepolia-fallback entirely. The `else if (config.contractAddress
&& config.schemaUID)` and final `else` (explicit Sepolia default when NO
chain was requested) branches at lines 122-135 stay unchanged — defaulting
when nothing was asked for is fine; substituting Sepolia for a *requested*
chain is the bug.

**Verify**: `pnpm run typecheck` → exit 0. Then a quick behavioral probe with
`npx tsx -e "..."` or a scratch jest test: constructing
`new OnchainRegistrar({ chain: 'not-a-chain', provider: <any mock>, signer: <any mock> } as never)`
must now throw `ChainConnectionError` (previously: silently Sepolia).

### Step 3: Add Ethereum mainnet to EAS_CONFIG

`ComputeModule` currently supports chainId `1`; the canonical config does not.
To consolidate without dropping support, add to `EAS_CONFIG['v1.0.0'].chains`
in `src/core/config.ts` (alongside the existing entries, same shape):

```typescript
'1': {
  chain: 'mainnet',
  deploymentBlock: 16756720,
  rpcUrl: 'https://mainnet.infura.io/v3/',
  easContractAddress: '0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587',
  schemaUID: '0xba4171c92572b1e4f241d044c32cdf083be9fd946b8766977558ca6378c824e2',
},
```

The address matches ComputeModule's existing mainnet entry (also the publicly
documented EAS deployment at easscan.org). `deploymentBlock` 16756720 is the
EAS mainnet deployment block; if you cannot confirm it, use `1` — nothing in
`src/` reads `deploymentBlock` today (grep to confirm). **Copy the schemaUID
exactly from the sibling entries in the same file** — do not invent one; note
in your report that the location schema may not actually be registered on
mainnet (see STOP conditions if a reviewer flags mainnet as unwanted).

**Verify**: `pnpm run typecheck` → exit 0, and
`pnpm test -- test/eas/chains` → pass.

### Step 4: Make ComputeModule resolve through chains.ts

In `src/compute/ComputeModule.ts`:

1. Delete the `EAS_CONTRACT_ADDRESSES` constant (lines 27-35).
2. Import `getChainConfig` from `../eas/chains` and `ChainConnectionError`
  from `../core/errors`.
3. Rewrite `initializeEAS`:

```typescript
private initializeEAS(): void {
  if (!this.signer) return;
  const { easContractAddress } = getChainConfig(this.chainId); // throws ChainConnectionError for unsupported ids
  this.eas = new EAS(easContractAddress);
  this.eas.connect(this.signer);
}
```

The constructor already only calls `initializeEAS()` when a signer exists, so
signer-less (read-only compute) construction keeps working for ANY chainId.
With a signer + unsupported chainId, construction now throws a clear
`ChainConnectionError` instead of deferring to a misleading "Signer is
required" at `submit()` time.

**Verify**: `pnpm run typecheck && pnpm run lint` → exit 0;
`grep -n "EAS_CONTRACT_ADDRESSES" src/` → no matches.

### Step 5: Update and extend tests

- Fix any test recorded in Step 1 that asserted the Sepolia fallback: it must
  now expect a thrown `ChainConnectionError`.
- Add to `test/eas/OnchainRegistrar.test.ts`: constructing with
  `chain: 'unsupported-chain'` throws `ChainConnectionError` whose message
  names the chain; constructing with each supported name
  (`sepolia`, `celo`, `arbitrum`, `base`, `optimism`, `base-sepolia`) yields
  the same `chainId`/`contractAddress` as before this change (pin the six
  id/address pairs from "Current state" as literals in the test — that is the
  no-regression contract of this plan).
- Add to the compute tests: with a mock signer and `chainId: 999999`,
  construction throws `ChainConnectionError`; with `chainId: 1` and a mock
  signer, construction succeeds.

**Verify**: `pnpm test -- test/eas/OnchainRegistrar test/compute test/eas/chains` → all pass, including the new cases.

### Step 6: Full suite

**Verify**: `pnpm run test` → exit 0.

## Test plan

Covered in Step 5. Pattern exemplar: existing `test/eas/OnchainRegistrar.test.ts`
(jest, mocked provider/signer — follow its mock style) and
`test/eas/chains.test.ts` for config-lookup assertions. New cases, minimum:
1 unknown-name throw, 6 known-name pin checks, 1 compute unknown-id throw,
1 compute mainnet success. Verification:
`pnpm test -- test/eas/OnchainRegistrar test/compute` → all pass.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm run typecheck`, `pnpm run lint`, `pnpm run test` all exit 0
- [ ] `grep -n "Fallback to Sepolia" src/eas/OnchainRegistrar.ts` → no matches
- [ ] `grep -rn "EAS_CONTRACT_ADDRESSES" src/` → no matches
- [ ] `grep -c "else if (config.chain === " src/eas/OnchainRegistrar.ts` → 0
      (ladder gone)
- [ ] New tests from Step 5 exist and pass
- [ ] No files outside the in-scope list modified (`git status --porcelain`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Step 1 reveals tests that depend on the Sepolia fallback for something
  other than "unknown chain tolerated" (e.g. a documented public behavior in
  README/docs) — the fallback might be load-bearing for a consumer; report
  before changing behavior.
- The six known-chain pin checks in Step 5 produce a different
  chainId/address than the "Current state" literals — the consolidation
  changed resolution for a supported chain; that is exactly the regression
  this plan must not cause.
- Adding mainnet to `EAS_CONFIG` breaks an existing test that enumerates
  supported chains — report; the enumeration may be a public contract.
- You need to modify `src/eas/chains.ts` after all.

## Maintenance notes

- This is a **behavior change**: previously-silent misconfigurations now
  throw. Release notes must say "unknown chain names/ids now throw
  `ChainConnectionError` instead of silently using Sepolia." Recommend a
  minor version bump via changesets.
- The mainnet `schemaUID` was copied from testnet entries; before anyone
  registers location attestations on mainnet through `OnchainRegistrar`,
  a maintainer must confirm the schema is actually registered on mainnet EAS
  (the entry currently only unblocks `ComputeModule` address lookup).
- Future chain additions now happen in exactly one place
  (`src/core/config.ts` `EAS_CONFIG`); reviewers should reject any new
  hardcoded chain/address literal outside it.
- Related follow-up not in this plan: `OnchainRegistrar.ts:234-248`'s inline
  chainId→name map, and the legacy `verifyOnchainLocationAttestation` chain
  handling — same disease, lower stakes.
