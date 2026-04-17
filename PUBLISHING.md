# Publishing Guide

How `@blueprint-data/dbt-ui` is built, versioned, and published to npm.

---

## How it works

Publishing is fully automated via GitHub Actions. The release pipeline:

1. Builds the Next.js app in **standalone mode** (self-contained, no Node/React/pnpm required on the user's machine)
2. Bundles the CLI + web app into a single npm package
3. Publishes to npm using the `NPM_TOKEN` secret

> **Never run `npm publish` manually** unless it's a critical hotfix. The CI pipeline handles environment isolation, symlink conflicts, and proper signing.

---

## One-time setup: NPM Token

To allow GitHub Actions to publish to npm:

1. Log in to [npmjs.com](https://www.npmjs.com) with the account that owns the `@blueprint-data` scope.
2. Go to your avatar → **Access Tokens** → **Generate New Token**.
3. Select **Automation Token** (bypasses 2FA for CI/CD).
4. In your GitHub repo, go to **Settings → Secrets and variables → Actions**.
5. Create a secret named exactly `NPM_TOKEN` and paste the token.

> If the token expires, the Release workflow will fail with `401 Unauthorized` — that's your reminder to rotate it.

### Recommended: Granular Access Token

For tighter security, use a Granular Access Token instead:

- Scope it to `@blueprint-data/dbt-ui` (Read and Publish only)
- Set an expiration date (90 days recommended)
- Add a descriptive name like `ci-publish-dbt-ui`

This limits blast radius if the token is ever compromised.

---

## Release flow

Versioning is managed by [Changesets](https://github.com/changesets/changesets) and is **fully automated** — no manual `pnpm changeset` needed.

### How a release happens

1. Open a PR with a title following [Conventional Commits](https://www.conventionalcommits.org/):
   - `fix: ...` → patch release (0.1.0 → 0.1.1)
   - `feat: ...` → minor release (0.1.0 → 0.2.0)
   - `feat!: ...` or `BREAKING CHANGE` → major release (0.1.0 → 1.0.0)

2. The **Auto Changeset** workflow detects the prefix and commits a changeset file to your branch automatically.

3. Merge to `main`. GitHub Actions detects the changeset and opens a **"Version Packages" PR** that bumps the version and updates `CHANGELOG.md`.

4. Review and merge the "Version Packages" PR. This triggers the **Release** workflow which:
   - Runs `./scripts/build-npm.sh` (builds standalone web app + copies README)
   - Publishes `@blueprint-data/dbt-ui` to npm
   - Creates a GitHub Release with the changelog

### Summary

```
PR (feat: ...) → auto changeset committed
      ↓
  merge to main
      ↓
  "Version Packages" PR opened automatically
      ↓
  merge "Version Packages" PR
      ↓
  npm publish + GitHub Release created
```

---

## Testing locally before publishing

```bash
# Build the full package
npm run build:npm

# Pack it (simulates what npm publish would include)
cd packages/cli
npm pack --dry-run

# Install locally to test the CLI
npm pack
npm install -g ./blueprint-data-dbt-ui-*.tgz
dbt-ui serve --db /path/to/dbt_ui.sqlite
```
