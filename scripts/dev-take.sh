#!/usr/bin/env bash
# Local dev against takenos dwh manifest: start Next, POST manifest, keep server running.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEFAULT_DWH_TARGET="${REPO_ROOT}/../takenos-data-stack/dwh/target"
DWH_TARGET="${DBT_UI_TAKENOS_DWH_TARGET:-$DEFAULT_DWH_TARGET}"
if [ -d "$DWH_TARGET" ]; then
  DWH_TARGET="$(cd "$DWH_TARGET" && pwd)"
fi
MANIFEST="${DWH_TARGET}/manifest.json"
export DBT_UI_MANIFEST_REFRESH_API_KEY="${DBT_UI_MANIFEST_REFRESH_API_KEY:-local-dev-take}"
export DBT_UI_DB_PATH="${DBT_UI_DB_PATH:-$DWH_TARGET/dbt_ui.sqlite}"

if [ ! -f "$MANIFEST" ]; then
  echo "dev:take: manifest not found: $MANIFEST" >&2
  echo "Set DBT_UI_TAKENOS_DWH_TARGET to your dwh target/ directory, or clone takenos-data-stack next to dbt-ui." >&2
  exit 1
fi

echo "dev:take: DBT_UI_DB_PATH=$DBT_UI_DB_PATH" >&2
echo "dev:take: manifest: $MANIFEST" >&2

( cd "$REPO_ROOT" && cd apps/web/dbt-docs-redesign && exec npm run dev ) &
DEV_PID=$!
cleanup() {
  kill "$DEV_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

for _ in $(seq 1 120); do
  if curl -sf -o /dev/null "http://127.0.0.1:3000/"; then
    break
  fi
  if ! kill -0 "$DEV_PID" 2>/dev/null; then
    echo "dev:take: dev server exited before becoming ready" >&2
    exit 1
  fi
  sleep 0.5
done

if ! curl -sf -o /dev/null "http://127.0.0.1:3000/"; then
  echo "dev:take: server did not respond on http://127.0.0.1:3000 (timeout after ~60s)" >&2
  exit 1
fi

echo "dev:take: posting manifest…" >&2
curl -sS -X POST "http://127.0.0.1:3000/api/admin/manifest/refresh" \
  -H "content-type: application/json" \
  -H "x-api-key: ${DBT_UI_MANIFEST_REFRESH_API_KEY}" \
  --data-binary "@${MANIFEST}"
echo "" >&2
echo "dev:take: open http://localhost:3000 (Ctrl+C to stop)" >&2
wait "$DEV_PID"
