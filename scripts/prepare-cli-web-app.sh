#!/bin/bash
# Prepare a standalone web app for the CLI package

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
WEB_DIR="$ROOT_DIR/apps/web/dbt-docs-redesign"
CLI_WEB_DIR="$ROOT_DIR/packages/cli/web-app"
STANDALONE_DIR="$WEB_DIR/.next/standalone"
STANDALONE_APP_DIR="$STANDALONE_DIR/apps/web/dbt-docs-redesign"

echo "🔨 Building web app (standalone)..."
cd "$WEB_DIR"
pnpm run build:standalone

echo "📦 Syncing web app into CLI package..."
rm -rf "$CLI_WEB_DIR"
mkdir -p "$CLI_WEB_DIR"

# Copy standalone output
cp -r "$STANDALONE_APP_DIR/"* "$CLI_WEB_DIR/"
cp -r "$STANDALONE_APP_DIR/.next" "$CLI_WEB_DIR/"

echo "📥 Installing web app runtime dependencies..."
cat > "$CLI_WEB_DIR/package.json" << 'EOF'
{
  "name": "dbt-ui-webapp",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "next": "16.0.10",
    "react": "19.2.0",
    "react-dom": "19.2.0",
    "sql.js": "^1.13.0"
  }
}
EOF

cd "$CLI_WEB_DIR"
npm install --omit=dev --legacy-peer-deps

echo "✅ Web app prepared for CLI."
