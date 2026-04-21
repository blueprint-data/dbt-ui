# Docker Deployment Guide

Use the official `dbt-ui` container image to run the web UI in production-like environments with minimal setup.

## Runtime Contract

### Supported Architectures

- Published tags on `ghcr.io/blueprint-data/dbt-ui` are multi-arch (`linux/amd64` and `linux/arm64`).
- Docker automatically pulls the matching platform for your host.
- To force a specific platform, use `--platform` with `docker run`/`docker pull` (for example `--platform linux/arm64`).

### Network

- Container port: `3000`
- Default URL: `http://localhost:3000`

### Storage

- `dbt-ui` reads SQLite from `DBT_UI_DB_PATH`.
- Recommended in-container path: `/data/dbt_ui.sqlite`.
- Mount a writable volume at `/data` if you plan to use manifest refresh API updates.

### Environment Variables

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `DBT_UI_DB_PATH` | No | `/data/dbt_ui.sqlite` | SQLite file used by the UI. |
| `PORT` | No | `3000` | HTTP port exposed by Next.js server. |
| `NODE_ENV` | No | `production` | Runtime mode for the server process. |
| `DBT_UI_MANIFEST_REFRESH_API_KEY` | No | unset | Enables `POST /api/admin/manifest/refresh` when set. |
| `DBT_UI_MANIFEST_SERVE_API_KEY` | No | unset | If set, requires `x-api-key` for `GET /manifest.json`. |
| `DBT_UI_EDGE_DIRECTION` | No | unset | Optional lineage edge direction override. |
| `DBT_UI_ENABLE_CODE_FALLBACK` | No | unset | Optional model SQL fallback behavior. |

### Secure Defaults

- Leave `DBT_UI_MANIFEST_REFRESH_API_KEY` **unset** to disable refresh endpoint access.
- Leave `DBT_UI_MANIFEST_SERVE_API_KEY` **unset** to keep `/manifest.json` public (compatibility default).
- If enabling refresh:
  - use a strong secret value,
  - keep the endpoint behind trusted network boundaries,
  - add request size/rate limits at your reverse proxy.
- If enabling manifest serve auth:
  - use a strong secret value,
  - send `x-api-key` on `GET /manifest.json` requests.

### Manifest Compatibility Endpoint

- Route: `GET /manifest.json`
- Source file: sibling of `DBT_UI_DB_PATH` (`<db-dir>/manifest.json`)
- Refresh behavior: successful `POST /api/admin/manifest/refresh` updates both SQLite and this manifest file.

## Quick Start

```bash
docker run --rm \
  -p 3000:3000 \
  -e DBT_UI_DB_PATH=/data/dbt_ui.sqlite \
  -v $(pwd)/target:/data \
  ghcr.io/blueprint-data/dbt-ui:latest
```

Open `http://localhost:3000`.

## Docker Compose

Use the repository `compose.yaml`:

```bash
docker compose up --build
```

To enable the manifest refresh API, apply the example override:

```bash
DBT_UI_MANIFEST_REFRESH_API_KEY=replace-with-strong-secret \
docker compose -f compose.yaml -f compose.refresh.example.yaml up --build
```

## Upgrading

1. Pull the new image tag.
2. Restart the container.
3. Keep the same mounted `/data` volume to preserve SQLite state.

## Backup and Restore

- Backup: copy `dbt_ui.sqlite` from your mounted `/data` volume.
- Restore: replace the file, then restart the container.
