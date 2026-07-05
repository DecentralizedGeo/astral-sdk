# Plan 002: Add a CI workflow so tests, lint, and typecheck gate every PR and push

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md` — unless a reviewer dispatched you and told you they
> maintain the index.
>
> **Drift check (run first)**: `git diff --stat 9fdf311..HEAD -- .github/workflows/`
> If any workflow file changed since this plan was written, compare the
> "Current state" facts against the live repo before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none (unblocks 003, 004, 005 — they rely on CI catching regressions)
- **Category**: tests / dx
- **Planned at**: commit `9fdf311`, 2026-07-02

## Why this matters

The repository has ~25 test files and configured coverage thresholds, but
nothing ever runs them automatically. The only workflow,
`.github/workflows/release.yml`, triggers on push to `main` and goes straight
to install → build → `changeset publish` — a broken `main` can auto-publish a
broken package to npm. The pre-commit hook (`.husky/pre-commit`) runs
lint-staged and typecheck but deliberately not tests, and `package.json`
even ships a `commit-wip` script that bypasses hooks with `--no-verify`.
This plan is the verification baseline every riskier plan (003, 004, 005)
depends on: after it lands, a failing test blocks merges instead of shipping.

## Current state

- `.github/workflows/release.yml` — the ONLY workflow. Relevant shape:
  triggers `on: push: branches: [main]`; steps: checkout → setup-node 20 →
  `pnpm/action-setup@v4` with `version: 9` → pnpm store cache keyed on
  `pnpm-lock.yaml` → `pnpm install --frozen-lockfile` → `pnpm run build` →
  `changesets/action@v1` publish. No test/lint/typecheck step anywhere.
- `package.json` scripts (use these exact names): `test` = `jest`,
  `test:coverage` = `jest --coverage`, `lint` = `eslint "src/**/*.ts"`,
  `typecheck` = `tsc --noEmit`, `build` = `tsup`.
- `jest.config.js` sets 80% global coverage thresholds — currently never
  enforced because nothing runs `test:coverage`. Do NOT wire `test:coverage`
  into CI in this plan (the thresholds may fail today and that would block
  the baseline; see Maintenance notes).
- Node engine: `>=18` (`package.json engines`); release workflow uses Node 20
  and pnpm 9 — match those in the new workflow.

## Commands you will need

| Purpose | Command | Expected on success |
|-----------|----------------------------------|---------------------|
| Install | `pnpm install` | exit 0 |
| Typecheck | `pnpm run typecheck` | exit 0 |
| Lint | `pnpm run lint` | exit 0 |
| Tests | `pnpm run test` | exit 0, all pass |
| Build | `pnpm run build` | exit 0, dist/ files |

## Scope

**In scope** (the only files you may modify/create):
- `.github/workflows/ci.yml` (create)

**Out of scope** (do NOT touch):
- `.github/workflows/release.yml` — leave publishing behavior exactly as is.
  Gating the release job on CI is a maintainer decision (Maintenance notes).
- `jest.config.js`, `package.json`, husky hooks — no threshold or script
  changes in this plan.
- Branch-protection settings (repo admin action, not a code change).

## Git workflow

- Branch: `advisor/002-ci-baseline`
- Commit style: conventional commits, e.g. `ci: add test, lint, and typecheck workflow for PRs and main`
- Do NOT push or open a PR unless the operator instructed it.

## Steps

### Step 1: Run the full verification suite locally to establish it passes at HEAD

```
pnpm install && pnpm run typecheck && pnpm run lint && pnpm run test
```

**Verify**: every command exits 0. If any fails at HEAD, that is a STOP
condition (the baseline must start green; report the failing output).

### Step 2: Create `.github/workflows/ci.yml`

Create the file with exactly this content (mirrors release.yml's setup steps
so the two workflows can't drift on pnpm/node versions):

```yaml
name: CI

on:
  push:
    branches:
      - main
  pull_request:

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  verify:
    name: Typecheck, lint, test, build
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repo
        uses: actions/checkout@v4

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 9
          run_install: false

      - name: Get pnpm store directory
        shell: bash
        run: echo "STORE_PATH=$(pnpm store path --silent)" >> $GITHUB_ENV

      - name: Cache pnpm store
        uses: actions/cache@v4
        with:
          path: ${{ env.STORE_PATH }}
          key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-pnpm-store-

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Typecheck
        run: pnpm run typecheck

      - name: Lint
        run: pnpm run lint

      - name: Test
        run: pnpm run test

      - name: Build
        run: pnpm run build
```

**Verify**: the file parses as YAML. If `npx` is available:
`npx --yes yaml-lint .github/workflows/ci.yml` → exit 0; otherwise
`node -e "require('js-yaml')"` may be unavailable — fall back to
`python3 -c "import yaml,sys; yaml.safe_load(open('.github/workflows/ci.yml'))"` → exit 0.

### Step 3: Re-run the exact CI command sequence locally

```
pnpm run typecheck && pnpm run lint && pnpm run test && pnpm run build
```

**Verify**: exit 0 for the whole chain — what CI will run is what you ran.

## Test plan

No new jest tests — the deliverable IS the test-running infrastructure.
Verification is Step 1/Step 3 passing locally plus YAML validity. After the
branch is pushed by the operator, the workflow appearing (and passing) on the
PR is the end-to-end confirmation.

## Done criteria

ALL must hold:

- [ ] `.github/workflows/ci.yml` exists with jobs running typecheck, lint,
      test, and build on `pull_request` and `push` to `main`
- [ ] YAML parses (Step 2 verification)
- [ ] `pnpm run typecheck && pnpm run lint && pnpm run test && pnpm run build`
      exits 0 locally
- [ ] `git status --porcelain` shows only `.github/workflows/ci.yml` added
- [ ] `plans/README.md` status row updated

## STOP conditions

Stop and report back (do not improvise) if:

- Step 1 fails at HEAD — the suite is broken before your change; the baseline
  cannot land green. Report the failing command output verbatim.
- A CI workflow already exists beyond `release.yml` (someone added one since
  this plan was written) — reconcile instead of duplicating.
- You are tempted to modify `release.yml` or `jest.config.js` — that's
  out of scope; note the idea and stop the step.

## Maintenance notes

- **Follow-ups for maintainers** (each deliberately out of this plan's scope):
  1. Require the `verify` job via branch protection on `main`.
  2. Gate `release.yml`'s publish job on CI success (e.g. make release depend
     on the same verification steps) so npm can't receive an untested build.
  3. Switch CI's test step to `pnpm run test:coverage` once the thresholds
     are known to pass, making the 80% gate real.
  4. Add a secret-scanning step (see Plan 001's maintenance notes).
- If a future plan renames package scripts, this workflow must be updated in
  the same PR — CI referencing dead scripts fails closed, which is correct.
