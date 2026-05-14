# dbt-ui Standalone Build

## Current Status

Standalone Next.js builds are the base artifact for both:

1. npm package distribution (`@blueprint-data/dbt-ui`)
2. first-party Docker image distribution (`ghcr.io/blueprint-data/dbt-ui`)

## Supported Deployment Paths

### Option 1: Docker (recommended for deployment)

```bash
docker compose up --build
```

See [`docs/DOCKER.md`](./DOCKER.md) for runtime contract, security defaults, and refresh API guidance.

### Option 2: npm CLI package

```bash
npx @blueprint-data/dbt-ui generate --manifest /absolute/path/to/target/manifest.json --skip-dbt
npx @blueprint-data/dbt-ui serve --db ./target/dbt_ui.sqlite
```

### Option 3: Run standalone app from monorepo

```bash
cd apps/web/dbt-docs-redesign
npm run build:standalone
DBT_UI_DB_PATH=/path/to/dbt_ui.sqlite npm run start:standalone
```

## Build Notes

- `build:standalone` copies `.next/static` and `public/` into standalone output.
- `setup:wasm` must run before build to ensure `public/sql-wasm.wasm` is present.
- Container runtime defaults to `DBT_UI_DB_PATH=/data/dbt_ui.sqlite` and `PORT=3000`.

## Troubleshooting

- If the server cannot open SQLite, confirm the mounted path matches `DBT_UI_DB_PATH`.
- If refresh returns `503`, this is expected unless `DBT_UI_MANIFEST_REFRESH_API_KEY` is set.
