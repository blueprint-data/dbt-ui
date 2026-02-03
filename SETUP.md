# dbt-ui Setup Guide

This guide will help you set up and run the dbt-ui project successfully.

## ✅ Prerequisites

Before you begin, ensure you have:

- **Node.js** 18.x or higher
- **npm** or **pnpm** (pnpm recommended)
- A **dbt project** with a generated `target/dbt_ui.sqlite` database file

## 🚀 Quick Start

### 1. Install Dependencies

From the root of the repository:

```bash
# Using npm
npm install

# Using pnpm
pnpm install
```

### 2. Setup WASM File

The sql.js WebAssembly file needs to be available in the public directory:

```bash
# From the root directory
npm run setup:wasm

# Or manually
cp node_modules/.pnpm/sql.js@*/node_modules/sql.js/dist/sql-wasm.wasm apps/web/dbt-docs-redesign/public/
```

You should see:
```
✅ WASM file copied to apps/web/dbt-docs-redesign/public/
```

### 3. Generate the Database

Navigate to your dbt project and generate the database:

```bash
cd /path/to/your/dbt-project
npx @dbt-ui/cli generate
```

This will create `target/dbt_ui.sqlite` in your dbt project.

### 4. Set Database Path

Set the `DBT_UI_DB_PATH` environment variable:

```bash
export DBT_UI_DB_PATH=/absolute/path/to/your/dbt-project/target/dbt_ui.sqlite
```

Or create a `.env.local` file in `apps/web/dbt-docs-redesign/`:

```bash
# apps/web/dbt-docs-redesign/.env.local
DBT_UI_DB_PATH=/absolute/path/to/your/dbt-project/target/dbt_ui.sqlite
```

### 5. Start the Development Server

```bash
# From the root directory
npm run dev

# Or from the web app directory
cd apps/web/dbt-docs-redesign
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔍 Verification Checklist

After setup, verify everything is working:

### ✅ WASM File Check

```bash
ls -lh apps/web/dbt-docs-redesign/public/sql-wasm.wasm
```

Expected: File should be ~644KB

### ✅ Database File Check

```bash
ls -lh $DBT_UI_DB_PATH
```

Expected: File exists and is readable

### ✅ Database Connection Test

Visit: [http://localhost:3000/api/db](http://localhost:3000/api/db)

Expected response:
```json
{
  "ok": true,
  "dbPath": "/path/to/your/dbt_ui.sqlite",
  "tables": {
    "model": 42,
    "column_def": 315,
    "edge": 89,
    "search_docs": 42
  }
}
```

### ✅ Models Endpoint Test

Visit: [http://localhost:3000/api/models?limit=5](http://localhost:3000/api/models?limit=5)

Expected: JSON response with model data

## 🐛 Common Issues

### Issue: "Turbopack with webpack config" error

**Error:**
```
ERROR: This build is using Turbopack, with a `webpack` config and no `turbopack` config.
```

**Cause:** Next.js 16 uses Turbopack by default and conflicts with webpack configuration.

**Solution:**
This has been fixed! The project now uses Turbopack configuration. If you still see this:
1. Make sure you have the latest code: `git pull`
2. Delete build cache: `rm -rf apps/web/dbt-docs-redesign/.next`
3. Restart dev server

### Issue: "WASM file not found"

**Error:**
```
ENOENT: no such file or directory, open '/ROOT/node_modules/.pnpm/sql.js@1.13.0/node_modules/sql.js/dist/sql-wasm.wasm'
```

**Solution:**
1. Stop the dev server
2. Delete build cache: `rm -rf apps/web/dbt-docs-redesign/.next`
3. Run setup script: `npm run setup:wasm`
4. Restart dev server

### Issue: "Database not found"

**Error:**
```
Failed to open database at /path/to/dbt_ui.sqlite
```

**Solution:**
1. Verify database file exists: `ls -lh $DBT_UI_DB_PATH`
2. Generate if missing: `cd your-dbt-project && npx @dbt-ui/cli generate`
3. Check path is absolute, not relative
4. Verify file permissions are readable

### Issue: API returns 500 errors

**Solution:**
1. Check terminal logs for detailed error messages
2. Visit `/api/db` endpoint to test database connection
3. Verify WASM file exists in `public/`
4. Regenerate database if corrupted

## 📝 Development Workflow

### Running the Application

```bash
# Development mode with hot reload
DBT_UI_DB_PATH=/path/to/db.sqlite npm run dev

# Production build
npm run build
cd apps/web/dbt-docs-redesign
DBT_UI_DB_PATH=/path/to/db.sqlite npm start
```

### Updating After Git Pull

After pulling new changes:

```bash
# Reinstall dependencies
npm install

# Re-setup WASM file
npm run setup:wasm

# Clear Next.js cache
rm -rf apps/web/dbt-docs-redesign/.next

# Restart dev server
npm run dev
```

### Working with Multiple dbt Projects

Use different terminal sessions with different environment variables:

```bash
# Terminal 1 - Project A
export DBT_UI_DB_PATH=/path/to/projectA/target/dbt_ui.sqlite
PORT=3000 npm run dev

# Terminal 2 - Project B
export DBT_UI_DB_PATH=/path/to/projectB/target/dbt_ui.sqlite
PORT=3001 npm run dev
```

## 🏗️ Architecture Notes

### Why sql.js?

This project uses **sql.js** (SQLite compiled to WebAssembly) instead of native bindings because:

- ✅ **Zero native dependencies** - No compilation required on installation
- ✅ **Cross-platform** - Works identically on Windows, macOS, and Linux
- ✅ **Portable** - Easy to deploy without platform-specific builds
- ✅ **Modern** - Latest SQLite features, regularly updated
- ✅ **Fast** - WebAssembly performance is near-native

### How WASM Loading Works

1. **Setup time**: WASM file is copied to `public/` via `npm run setup:wasm` (one-time)
2. **Build/Dev time**: Turbopack (Next.js 16) serves WASM from `public/` automatically
3. **Runtime**: `@dbt-ui/core` initializes sql.js with `locateFile` config
4. **Node.js**: Points to `node_modules` for server-side API routes
5. **Browser**: Points to `/sql-wasm.wasm` (served from `public/`)

### Turbopack (Next.js 16)

This project uses **Turbopack** as the default bundler (Next.js 16+):

- ✅ **Native WASM support** - No additional configuration needed
- ✅ **Faster builds** - Significantly faster than webpack in development
- ✅ **Better DX** - Faster hot reload and instant updates
- ✅ **Simpler config** - Less code in `next.config.mjs`
- ✅ **Future-proof** - Default bundler for Next.js going forward

### Database Caching

- Database connection is cached in memory
- File modification time (`mtime`) is tracked
- On file change, connection is refreshed automatically
- No need to restart server when database is regenerated

## 📚 Additional Resources

- [sql.js Documentation](https://sql.js.org/documentation/)
- [Next.js Documentation](https://nextjs.org/docs)
- [dbt Documentation](https://docs.getdbt.com/)

## 🆘 Getting Help

If you encounter issues:

1. Check this setup guide
2. Review [README.md](./README.md) for architecture details
3. Check [apps/web/dbt-docs-redesign/README.md](./apps/web/dbt-docs-redesign/README.md) for app-specific docs
4. Open an issue on GitHub with:
   - Error messages from terminal
   - Output of `/api/db` endpoint
   - Node.js version: `node --version`
   - Package manager: `npm --version` or `pnpm --version`

---

Happy exploring your dbt documentation! 🎉
