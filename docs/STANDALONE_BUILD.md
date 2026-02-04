# dbt-ui Standalone Build

## Current Status

The standalone build works correctly when run from within the monorepo. However, creating a fully portable npm package requires additional work due to pnpm's symlink-based node_modules structure.

## What Works

### Option 1: Run from monorepo (Recommended for development)

```bash
# From the monorepo root:
cd apps/web/dbt-docs-redesign
npm run build:standalone

# Run standalone:
DBT_UI_DB_PATH=/path/to/dbt_ui.sqlite npm run start:standalone
```

### Option 2: Use the main dev/production server

```bash
# Development:
npm run dev

# Production:
npm run build
npm run start
```

## Known Issues for NPM Packaging

1. **pnpm symlink structure**: Next.js standalone with pnpm creates a complex symlink structure in node_modules that doesn't translate well to a portable package.

2. **Missing dependencies**: When copying the standalone output, packages like `styled-jsx` and `@swc/helpers` need to be symlinked manually or installed separately.

## Proposed Solution

To create a truly portable npm package, we need to either:

1. **Use npm instead of pnpm for the web app build** - This creates a flat node_modules structure that's easier to package.

2. **Create a Docker image** - Package everything in a container for consistent deployment.

3. **Use bundler** - Use a tool like pkg or vercel/ncc to bundle everything into a single executable.

## Quick Start (Current Working Approach)

```bash
# 1. Clone the repo
git clone https://github.com/your-repo/dbt-ui.git
cd dbt-ui

# 2. Install dependencies
pnpm install

# 3. Build standalone
npm run build:standalone

# 4. Run with your database
cd apps/web/dbt-docs-redesign
DBT_UI_DB_PATH=/path/to/your/target/dbt_ui.sqlite npm run start:standalone
```

## Next Steps

1. Consider using npm for the web app to simplify packaging
2. Alternatively, create a Docker image for easy distribution
3. Document the current working approach in the main README
