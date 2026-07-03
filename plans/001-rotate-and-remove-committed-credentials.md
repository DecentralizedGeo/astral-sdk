# Plan 001: Remove the committed credentials file and close the .gitignore gap

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 9fdf311..HEAD -- .env.local.backup .gitignore .env.example`
> If any in-scope file changed since this plan was written, compare the
> "Current state" facts against the live repo before proceeding; on a
> mismatch, treat it as a STOP condition.
>
> **SECRET-HANDLING RULE**: Never copy, print, echo, or paste any value from
> `.env.local.backup` into a commit message, test, log, report, or any other
> file. Refer to credentials only by variable name and type.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW (for the repo change; NOT rotating the credentials is the high risk)
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `9fdf311`, 2026-07-02

## Why this matters

The file `.env.local.backup` is tracked in git at the repository root of a
**public** repository. It contains real-format credentials: an Infura API key
(32 hex chars), a BIP39 mnemonic, and five Ethereum private keys with their
addresses (variable names: `INFURA_KEY`, `EVM_MNEMONIC`, `ACCT_1_PRIV` …
`ACCT_5_PRIV`, `ACCT_1_ADDR` … `ACCT_5_ADDR`). Anyone can read them today and
from git history forever. Any funds on those accounts can be drained and the
Infura quota abused. Deleting the file does NOT un-burn the secrets — rotation
by a human is mandatory and is called out as a required follow-up below.

## Current state

- `.env.local.backup` — tracked file at repo root (837 bytes), 12 variables as
listed above. Confirm it is tracked: `git ls-files .env.local.backup` prints
the filename.
- `.gitignore:18-23` — ignores `.env`, `.env.local`, `.env.development.local`,
`.env.test.local`, `.env.production.local`. The name `.env.local.backup`
matches none of these patterns, which is how the file got committed.
- `.env.example` — the intended, safe template (tracked on purpose). Note its
line ~100 embeds the well-known public Anvil/Hardhat account-0 private key
as a commented example value; replacing that with an obvious placeholder is
an optional bonus step (Step 4) because it normalizes the bad pattern.

## Commands you will need

| Purpose | Command | Expected on success |
|-----------|--------------------------------------|----------------------------|
| Install | `pnpm install` | exit 0 |
| Typecheck | `pnpm run typecheck` | exit 0 |
| Lint | `pnpm run lint` | exit 0 |
| Tests | `pnpm run test` | exit 0 (all suites pass) |

(Commands from `package.json` scripts; hooks in `.husky/pre-commit` run
lint-staged + typecheck on commit.)

## Scope

**In scope** (the only files you may modify):
- `.env.local.backup` (delete)
- `.gitignore` (broaden env patterns)
- `.env.example` (optional Step 4 only: replace the example private-key value
with a placeholder)

**Out of scope** (do NOT touch):
- Git history rewriting (`git filter-repo`, BFG). History purge requires a
force-push and coordination with all forks/clones — that is a maintainer
decision, listed under Maintenance notes. Never force-push.
- Any file under `src/` or `test/`.
- Actual credential rotation — impossible from this repo; it is an external
human action (Infura dashboard, moving funds to fresh keys). Flag it, don't
attempt it.

## Git workflow

- Branch: `advisor/001-remove-committed-credentials`
- Commit style: conventional commits, e.g. `fix(security): remove tracked env backup and broaden gitignore`
(matches repo history such as `fix(api): retry server errors (5xx) with exponential backoff`).
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Delete the tracked credentials file

```
git rm .env.local.backup
```

**Verify**: `git ls-files .env.local.backup` → prints nothing (exit 0, empty
output). The file must also be gone from the working tree: `test ! -f .env.local.backup && echo GONE` → `GONE`.

### Step 2: Broaden the .gitignore env patterns

In `.gitignore`, replace the current five-line env block (lines 18–23, the
lines starting `.env` under the `# Environment` comment) with:

```
# Environment
.env
.env.*
!.env.example
```

**Verify**: `git check-ignore -v .env.local.backup .env.local .env.production` →
each path reports a matching rule; `git check-ignore .env.example` → exits
non-zero (NOT ignored, it must stay tracked).

### Step 3: Confirm nothing else references the deleted file

```
grep -rn "env.local.backup" --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=plans .
```

**Verify**: no matches (exit code 1 from grep).

### Step 4 (optional, do only if lint/tests are green after Steps 1–3):
Replace the example private-key value in `.env.example` (the commented
`TEST_PRIVATE_KEY` line, around line 100) with:

```
# TEST_PRIVATE_KEY=0x_your_test_private_key_here_never_commit_real_keys
```

**Verify**: `grep -c "your_test_private_key_here" .env.example` → `1`.

## Test plan

No new unit tests — this plan changes no runtime code. The full existing suite
is the regression gate:

- `pnpm run test` → all suites pass (same result as before the change).
- `pnpm run lint && pnpm run typecheck` → exit 0.

## Done criteria

ALL must hold:

- [ ] `git ls-files .env.local.backup` → empty
- [ ] `git check-ignore .env.local.backup` → reports a rule (ignored going forward)
- [ ] `git check-ignore .env.example` → exit non-zero (still trackable)
- [ ] `pnpm run typecheck` exits 0; `pnpm run test` exits 0
- [ ] `git status --porcelain` shows only the in-scope files as changed
- [ ] No secret value appears in the diff of any file OTHER than the deletion
of `.env.local.backup` itself (`git diff --cached --stat`)
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- `.env.local.backup` is already absent at HEAD (someone fixed it — mark the
plan DONE-externally in the index instead of proceeding).
- You find additional tracked files matching `git ls-files | grep -i "\.env"`
beyond `.env.example` — report them; do not delete files this plan doesn't name.
- Any tool or step would require printing a credential value.

## Maintenance notes

- **REQUIRED human follow-up (not executable by this plan)**: rotate the
Infura key; treat the mnemonic and all five private keys as compromised —
move any funds and stop using these accounts everywhere. Deletion without
rotation is cosmetic.
- **Maintainer decision**: whether to purge the file from git history
(`git filter-repo --invert-paths --path .env.local.backup`) — requires a
coordinated force-push, which is out of scope for any executor.
- Consider adding a secret-scanning CI step (e.g. gitleaks) once Plan 002's CI
workflow exists; that's a natural extension of the CI job matrix.
- Reviewers of future PRs: any new `.env*` file in a diff is a red flag; the
broadened ignore pattern makes this much harder to repeat accidentally.
