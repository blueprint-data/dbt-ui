#!/bin/bash
# Build script for dbt-ui npm package

set -e

echo "🔨 Building dbt-ui for npm publication..."

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
CLI_DIR="$ROOT_DIR/packages/cli"
WEB_DIR="$ROOT_DIR/apps/web/dbt-docs-redesign"
STANDALONE_DIR="$WEB_DIR/.next/standalone"
STANDALONE_APP_DIR="$STANDALONE_DIR/apps/web/dbt-docs-redesign"

echo "📦 Building web application (standalone)..."
cd "$WEB_DIR"
npm run build:standalone

echo "📁 Preparing CLI package..."
rm -rf "$CLI_DIR/web-app"
rm -rf "$CLI_DIR/node_modules"
mkdir -p "$CLI_DIR/web-app"

# Copy all app files including .next folder
echo "  → Copying app files and .next build..."
cp -r "$STANDALONE_APP_DIR/"* "$CLI_DIR/web-app/"
cp -r "$STANDALONE_APP_DIR/.next" "$CLI_DIR/web-app/"

# Remove pnpm symlinks in node_modules (they won't work outside the monorepo)
rm -rf "$CLI_DIR/web-app/node_modules"

# Install fresh dependencies using npm (creates a flat, portable structure)
echo "  → Installing web-app runtime dependencies..."
cd "$CLI_DIR/web-app"

# Create a minimal package.json for runtime dependencies
cat > package.json << 'EOF'
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

npm install --omit=dev --legacy-peer-deps

# Install CLI dependencies in a temp directory (to avoid monorepo lockfile conflicts)
echo "  → Installing CLI dependencies..."
TMP_CLI="/tmp/dbt-ui-cli-deps-$$"
mkdir -p "$TMP_CLI"

cat > "$TMP_CLI/package.json" << 'EOF'
{
  "name": "temp-deps",
  "version": "0.1.0",
  "dependencies": {
    "sql.js": "^1.13.0"
  }
}
EOF

cd "$TMP_CLI"
npm install --omit=dev

# Copy node_modules to CLI
cp -r "$TMP_CLI/node_modules" "$CLI_DIR/"
rm -rf "$TMP_CLI"

# Update CLI package.json for npm publish
cat > "$CLI_DIR/package.json" << 'EOF'
{
  "name": "dbt-ui",
  "version": "0.1.0",
  "description": "Modern documentation viewer for dbt projects",
  "type": "module",
  "bin": {
    "dbt-ui": "./bin/dbt-ui.js"
  },
  "files": [
    "bin",
    "web-app",
    "node_modules"
  ],
  "keywords": [
    "dbt",
    "documentation",
    "data",
    "analytics",
    "lineage",
    "sql"
  ],
  "author": "Juan Pablo Rivero",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/blueprintdata/dbt-ui.git"
  },
  "homepage": "https://github.com/blueprintdata/dbt-ui",
  "bugs": {
    "url": "https://github.com/blueprintdata/dbt-ui/issues"
  },
  "engines": {
    "node": ">=18.0.0"
  },
  "dependencies": {
    "sql.js": "^1.13.0"
  }
}
EOF

echo "🔧 Making bin script executable..."
chmod +x "$CLI_DIR/bin/dbt-ui.js"

echo ""
echo "✅ Build complete!"
echo ""
echo "Package sizes:"
du -sh "$CLI_DIR/web-app"
du -sh "$CLI_DIR/node_modules"
echo ""
echo "To test locally:"
echo "  cd $CLI_DIR"
echo "  node bin/dbt-ui.js generate --manifest /path/to/manifest.json"
echo "  node bin/dbt-ui.js serve --db target/dbt_ui.sqlite"
echo ""
echo "To publish to npm:"
echo "  cd $CLI_DIR"  
echo "  npm publish"
