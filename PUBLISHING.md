# Publishing Guide

How `@blueprint-data/dbt-ui` is built, versioned, and published to npm.

---

## How it works

Publishing is fully automated via GitHub Actions. The release pipeline:

1. Builds the Next.js app in **standalone mode** (self-contained, no Node/React/pnpm required on the user's machine)
2. Bundles the CLI + web app into a single npm package
3. Publishes to npm using the `NPM_TOKEN` secret
4. Publishes Docker images to GHCR (`ghcr.io/blueprint-data/dbt-ui`) with tags:
   - `latest`
   - `<semver>` (for example `0.1.3`)
   - `v<semver>` (for example `v0.1.3`)
   - each tag is a multi-arch manifest that includes:
     - `linux/amd64`
     - `linux/arm64`

> **Never run `npm publish` manually** unless it's a critical hotfix. The CI pipeline handles environment isolation, symlink conflicts, and proper signing.

> Docker image publishing is tied to the same Changesets-driven release event to keep npm and container versions aligned.

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

---

## Release flow

Versioning is managed by [Changesets](https://github.com/changesets/changesets).

### Case 1 — Normal PR (fully automated)

The happy path. Just follow conventional commits and everything is automatic.

1. Open a PR with a title following [Conventional Commits](https://www.conventionalcommits.org/):
   - `fix: ...` → patch (0.1.0 → 0.1.1)
   - `feat: ...` → minor (0.1.0 → 0.2.0)
   - `feat!: ...` → major (0.1.0 → 1.0.0)

2. The **Auto Changeset** workflow detects the prefix and commits a `.changeset/*.md` file to your branch automatically.

3. Merge to `main`. Changesets detects the file and opens a **"Version Packages" PR**.

4. Merge the "Version Packages" PR → npm publish + GitHub Release created.

```
PR (feat: ...) → auto changeset committed
      ↓
  merge to main
      ↓
  "Version Packages" PR opened automatically
      ↓
  merge "Version Packages" PR
      ↓
  npm publish + GitHub Release
```

---

### Case 2 — Branch predates the Auto Changeset workflow

The auto-changeset workflow only runs on PRs opened after it was added. If your branch existed before, no changeset file was created automatically.

**Fix: create the changeset manually once.**

```bash
pnpm changeset
```

- Select `@blueprint-data/dbt-ui`
- Choose bump type: `patch` for fixes, `minor` for new features, `major` for breaking changes
- Write a short summary (goes into `CHANGELOG.md`)

```bash
git add .changeset/
git commit -m "chore: add changeset"
git push
```

From here the flow is identical to Case 1 — merge to main, wait for "Version Packages" PR, merge it.

---

### Case 3 — Hotfix or emergency publish

If CI is broken and you need to ship immediately:

```bash
# 1. Build the package locally
npm run build:npm

# 2. Bump version manually
cd packages/cli
npm version patch   # or minor / major

# 3. Publish
npm publish --access public
```

> Only do this for genuine emergencies. Manual publishes skip the full build pipeline validation.

---

## Testing locally before publishing

```bash
# Build the full package
npm run build:npm

# Simulate what npm publish would include
cd packages/cli
npm pack --dry-run

# Install locally and test the CLI
npm pack
npm install -g ./blueprint-data-dbt-ui-*.tgz
dbt-ui serve --db /path/to/dbt_ui.sqlite
```
