# Plan 003: Make offchain attestation verification actually verify the EIP-712 signature

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 9fdf311..HEAD -- src/eas/OffchainSigner.ts src/location/OffchainWorkflow.ts test/eas/`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: M
- **Risk**: MED — genuine signatures produced by `signOffchainLocationAttestation` must keep verifying; requires a signature-payload format change (see Step 2)
- **Depends on**: plans/002-add-ci-verification-baseline.md (CI must exist to catch regressions in the other suites this touches)
- **Category**: security
- **Planned at**: commit `9fdf311`, 2026-07-02

## Why this matters

`verifyOffchainLocationAttestation` — the public verification API for the
offchain workflow, reachable via both `astral.location.offchain.verify(...)`
and `AstralSDKLegacy.verifyOffchainLocationAttestation(...)` — performs **no
cryptographic check at all**. It only validates that the signature JSON has
`r`/`s` strings of the right length and that `proof.signer` looks like a
non-zero address, then reports `isValid: true` with the attacker-supplied
`signer` echoed back as `signerAddress`. Anyone can fabricate an attestation
naming any victim address as signer, with random bytes as the signature, and
the SDK will call it valid. For an SDK whose product is trustworthy location
attestations, this nullifies the offchain trust model. The fix: recover the
signer from the EIP-712 typed data and require it to match `proof.signer`,
binding the signature to the attestation's actual content.

## Current state

- `src/eas/OffchainSigner.ts` — owns signing and verification.
  - Lines 328–420: `verifyOffchainLocationAttestation`. The core of the
    current (broken) check, verbatim:

    ```typescript
    // src/eas/OffchainSigner.ts:340-361
    const signature = JSON.parse(proof.signature);
    const hasValidSignature =
      signature &&
      typeof signature.r === 'string' &&
      typeof signature.s === 'string' &&
      typeof signature.v === 'number' &&
      signature.r.startsWith('0x') &&
      signature.s.startsWith('0x') &&
      signature.r.length === 66 && // 0x + 64 hex chars
      signature.s.length === 66;
    const hasValidSigner =
      proof.signer &&
      proof.signer.startsWith('0x') &&
      proof.signer.length === 42 &&
      proof.signer !== '0x0000000000000000000000000000000000000000';
    isValid = hasValidSignature && hasValidSigner;
    ```

    No recovery, no typed-data reconstruction, no use of the EAS SDK's
    verification, and `signerAddress: proof.signer` is trusted verbatim.
    The expiry check below it (lines 367–370) is fine — keep it.
  - Lines 248–320: `signOffchainLocationAttestation`. Builds
    `attestationParams` (schema UID, recipient, `time: BigInt(eventTimestamp)`,
    `expirationTime` or `BigInt(0)`, `revocable ?? true`, zero `refUID`,
    encoded `data`), calls
    `this.offchainModule!.signOffchainAttestation(attestationParams, this.signer!)`,
    then stores **only** `uid`, `JSON.stringify(signedAttestation.signature)`
    (just `{r,s,v}`), and `signer`.
  - Lines 86–94: the `Offchain` module is already constructed with
    `OffchainAttestationVersion.Version2` — it exists but verification never
    uses it.
  - **Critical subtlety**: EAS offchain attestations (Version 2) include
    fields in the signed message that the SDK currently throws away after
    signing — notably the random `salt` (and the message `version`). Because
    the stored proof keeps only `{r,s,v}`, the typed data **cannot be
    reconstructed** from a stored proof today. That is why Step 2 changes what
    `sign` persists in the `signature` field, and why old-format proofs get an
    explicit "unverifiable legacy format" result rather than a fake `true`.
- `src/location/OffchainWorkflow.ts:111-125` — `verify()` delegates to
  `verifyOffchainLocationAttestation`; no changes needed there (behavior
  improves transparently).
- `src/core/types.ts` — `OffchainLocationAttestation.signature` is a `string`
  (JSON). The type does not constrain the JSON's shape, so Step 2's payload
  change needs no type change.
- Error/result conventions: return a `VerificationResult`
  (`{ isValid, signerAddress?, attestation, reason? }`), with reasons from the
  `VerificationError` enum in `src/core/types.ts` (e.g. `INVALID_SIGNATURE`,
  `ATTESTATION_EXPIRED`). Match the existing style — verification failures
  RETURN `isValid: false`; they do not throw.
- Repo conventions: strict TS, JSDoc on public APIs, typed errors from
  `src/core/errors.ts`; tests use jest with ts-jest. Exemplar test file:
  `test/eas/OffchainSigner.test.ts` (note it `jest.mock`s the whole EAS SDK —
  your new verification tests must NOT mock it; see Test plan).

## Commands you will need

| Purpose | Command | Expected on success |
|-----------|------------------------------------------|---------------------|
| Install | `pnpm install` | exit 0 |
| Typecheck | `pnpm run typecheck` | exit 0 |
| Lint | `pnpm run lint` | exit 0 |
| One suite | `pnpm test -- test/eas/OffchainSigner` | all pass |
| All tests | `pnpm run test` | all pass |

## Suggested executor toolkit

- Read `node_modules/@ethereum-attestation-service/eas-sdk/dist/offchain/offchain.d.ts`
  (after `pnpm install`) before writing code — Step 1 depends on it.
- ethers v6 docs for `verifyTypedData(domain, types, value, signature)` if the
  fallback path is needed.

## Scope

**In scope** (the only files you may modify/create):
- `src/eas/OffchainSigner.ts`
- `test/eas/OffchainSigner.verification.test.ts` (create)
- `test/eas/OffchainSigner.test.ts` (only if existing assertions conflict with
  the new behavior — see Step 4)

**Out of scope** (do NOT touch):
- `src/location/OffchainWorkflow.ts`, `src/core/AstralSDK.ts` — both call
  through to the signer; no changes needed.
- `src/core/types.ts` — `signature` stays a `string`.
- Onchain verification (`OnchainRegistrar`) — different mechanism, different plan.
- Any change to UID computation or the signing flow's cryptography itself.

## Git workflow

- Branch: `advisor/003-real-offchain-verification`
- Commit style: conventional commits, e.g. `fix(eas): cryptographically verify offchain attestation signatures`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Confirm the installed EAS SDK's verification API

After `pnpm install`, inspect
`node_modules/@ethereum-attestation-service/eas-sdk/dist/offchain/offchain.d.ts`
and confirm:

1. `Offchain` exposes an instance method named
   `verifyOffchainAttestationSignature(attester: string, attestation: SignedOffchainAttestation): boolean`
   (name may vary slightly — record the exact signature).
2. The `SignedOffchainAttestation` type: its `message` contains
   `version`, `schema`, `recipient`, `time` (bigint), `expirationTime`
   (bigint), `revocable`, `refUID`, `data`, and (Version 2) `salt`; plus
   top-level `uid`, `domain`, `types`/`primaryType`, and `signature {r,s,v}`.

**Verify**: you can quote both declarations from the `.d.ts`. If the method
or a salt-bearing message type does not exist → STOP condition.

### Step 2: Persist the full signed payload at signing time

In `signOffchainLocationAttestation` (currently line ~292), replace

```typescript
signature: JSON.stringify(signedAttestation.signature),
```

with serialization of the **entire** `signedAttestation` (message including
salt, domain, types, uid, signature). BigInt fields make plain
`JSON.stringify` throw, so add two small private helpers in the same class:

```typescript
/** JSON.stringify replacer/reviver pair for bigint-safe (de)serialization */
private static serializeSignedAttestation(att: unknown): string {
  return JSON.stringify(att, (_k, v) => (typeof v === 'bigint' ? `${v.toString()}n` : v));
}
private static deserializeSignedAttestation(json: string): unknown {
  return JSON.parse(json, (_k, v) =>
    typeof v === 'string' && /^\d+n$/.test(v) ? BigInt(v.slice(0, -1)) : v
  );
}
```

(If the installed eas-sdk exports its own offchain (de)serialization helpers —
some versions ship `zipAndEncodeToBase64`/`decodeBase64ZippedBase64` — you MAY
use those instead; prefer the SDK's own helpers if present. Record which you
chose.)

**Verify**: `pnpm run typecheck` → exit 0.

### Step 3: Rewrite the verification body

Replace the structural check block (lines ~335–365) in
`verifyOffchainLocationAttestation` with logic that:

1. Parses `proof.signature` with the deserializer from Step 2.
2. **Legacy-format guard**: if the parsed object has `r`/`s`/`v` at top level
   and no `message` — it's the old format that cannot be reconstructed.
   Return `{ isValid: false, signerAddress: proof.signer, attestation: proof,
   reason: VerificationError.INVALID_SIGNATURE }` (optionally a more specific
   reason string noting the legacy unverifiable format — keep the enum value
   if the enum has no better member).
3. Otherwise call the EAS SDK:
   `const ok = this.offchainModule!.verifyOffchainAttestationSignature(proof.signer, parsed)`.
   This both recovers the signer over the exact typed data (binding content)
   and compares it to `proof.signer`.
4. Belt-and-braces content binding: additionally require that the parsed
   `message.data` equals `this.formatProofForEAS(proof)` re-encoded from the
   proof's own fields, and that `parsed.uid === proof.uid`. If either
   mismatches, return `isValid: false` with `INVALID_SIGNATURE` — this stops a
   valid signature over *different* content being attached to mutated fields.
   (Note: `formatProofForEAS` currently drops `memo` when undefined — if
   Plan 005 has not landed yet, re-encode with the same conditional behavior
   the sign path used, i.e. just call the method as-is.)
5. Keep the existing expiry check and result construction below (lines
   367–393) unchanged.
6. Keep the catch-all behavior: parsing/verification exceptions → return
   `isValid: false`, never throw.

**Verify**: `pnpm run typecheck && pnpm run lint` → exit 0.

### Step 4: Run the existing signer suite and reconcile

```
pnpm test -- test/eas/OffchainSigner
```

The existing `test/eas/OffchainSigner.test.ts` mocks the entire EAS SDK, so
its mocked `Offchain` will lack `verifyOffchainAttestationSignature`. If tests
fail for that reason, extend the mock in that file minimally (add a
`verifyOffchainAttestationSignature: jest.fn().mockReturnValue(true)` to the
mocked `Offchain` implementation) — do not weaken any assertion. If an
existing test asserts that a structurally-well-formed-but-forged signature
verifies as `true`, that test is asserting the bug: rewrite its expectation to
`isValid: false` and note it in your report.

**Verify**: `pnpm test -- test/eas/OffchainSigner` → all pass.

### Step 5: Write the real-crypto round-trip tests (new file)

Create `test/eas/OffchainSigner.verification.test.ts` — **no `jest.mock` of
the EAS SDK** (EIP-712 signing is pure local computation; no network needed).
Model file structure and imports after `test/eas/OffchainSigner.test.ts`, but
use the real `OffchainSigner` with `new Wallet(<random>)` via
`Wallet.createRandom()`. Cases (see Test plan for the full list): sign → verify
happy path, tampered memo, tampered location, signer substitution, legacy
`{r,s,v}`-only signature, malformed JSON.

**Verify**: `pnpm test -- test/eas/OffchainSigner.verification` → all new
tests pass.

### Step 6: Full suite

**Verify**: `pnpm run test` → exit 0, all suites pass.

## Test plan

New file `test/eas/OffchainSigner.verification.test.ts`, real EAS SDK, random
local wallets, at minimum:

1. **Round trip**: build a minimal `UnsignedLocationAttestation` (use the
   shape from `test/eas/OffchainSigner.test.ts`'s fixtures, include a `memo`),
   sign with wallet A, verify → `isValid: true`, `signerAddress` equals
   wallet A's address.
2. **Content tamper**: sign, then mutate `memo` (and in a second case
   `location`) on the returned proof → verify → `isValid: false`.
3. **Signer substitution**: sign with wallet A, set `proof.signer` to wallet
   B's address → verify → `isValid: false`.
4. **Forged signature**: well-formed random `r`/`s`/`v` in the legacy format
   with a real address as signer → `isValid: false` (this is the exact attack
   the old code accepted).
5. **Malformed signature JSON** → `isValid: false`, no throw.
6. **Expired attestation**: sign with `expirationTime` in the past → verify →
   `isValid: false`, `reason: ATTESTATION_EXPIRED` (works because expiry is
   checked after signature validity — signature must be freshly valid, so
   sign a real one).

Verification: `pnpm test -- test/eas/OffchainSigner.verification` → 6+ tests
pass; `pnpm run test` → whole suite green.

## Done criteria

Machine-checkable. ALL must hold:

- [ ] `pnpm run typecheck` and `pnpm run lint` exit 0
- [ ] `pnpm run test` exits 0; `test/eas/OffchainSigner.verification.test.ts`
      exists with the 6 cases above passing
- [ ] `grep -n "signature.r.length === 66" src/eas/OffchainSigner.ts` → no matches
      (the structural-only check is gone)
- [ ] `grep -n "verifyOffchainAttestationSignature" src/eas/OffchainSigner.ts`
      → at least one match in the verify path
- [ ] No files outside the in-scope list modified (`git status --porcelain`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Step 1 finds no `verifyOffchainAttestationSignature` (or equivalent) on
  `Offchain`, or `SignedOffchainAttestation.message` has no `salt` — the
  installed eas-sdk's API differs from this plan's assumption; report the
  actual `.d.ts` declarations.
- The round-trip test (sign → verify) fails after two reasonable fix
  attempts — the reconstruction/serialization is subtly wrong; report the
  diff between signed and re-parsed payloads.
- Fixing a failing existing test would require weakening an assertion about
  a *legitimately signed* attestation (not a forged one).
- You find yourself editing `src/core/types.ts` or the sign-side typed-data
  parameters.

## Maintenance notes

- **Compatibility**: proofs signed by earlier SDK versions store only
  `{r,s,v}` and will now report `isValid: false` (legacy-unverifiable) instead
  of the previous unconditional `true`. This is the correct direction (the old
  `true` was meaningless) but MUST be called out in the changeset/release
  notes as a behavior change. Suggest a minor-version bump via changesets.
- The `signature` field now carries the full signed payload — noticeably
  larger. Anything that stores or transmits proofs (future publish/API work,
  see the publish no-op in `src/core/AstralSDK.ts:943-952`) inherits that size.
- If Plan 005 lands (unconditional `memo` encoding), the re-encode comparison
  in Step 3.4 keeps working because both sign and verify go through
  `formatProofForEAS` — but a proof signed *before* 005 and verified *after*
  might re-encode differently if `memo` was undefined. The uid + EAS SDK
  signature check still protects correctness; only the belt-and-braces data
  comparison could produce a false negative for that narrow case. A reviewer
  should decide whether to relax check 3.4 to uid+signature only.
- Reviewers: scrutinize that verification failures return results (never
  throw), and that no path can reach `isValid: true` without the EAS SDK
  signature check passing.
