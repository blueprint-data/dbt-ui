# 🚀 Quick Start Guide

Get dbt-ui running in 5 minutes!

## 📋 Prerequisites

- Node.js 18+ installed
- A dbt project with models

## ⚡️ 5-Minute Setup

### 1️⃣ Install (30 seconds)

```bash
cd dbt-ui
npm install
```

### 2️⃣ Setup WASM (10 seconds)

```bash
npm run setup:wasm
```

Expected output: ✅ WASM file copied to apps/web/dbt-docs-redesign/public/

### 3️⃣ Generate Database (1-2 minutes)

```bash
cd /path/to/your/dbt-project
npx @dbt-ui/cli generate
```

This creates `target/dbt_ui.sqlite`

### 4️⃣ Start Server (10 seconds)

```bash
cd /path/to/dbt-ui
DBT_UI_DB_PATH=/path/to/your/dbt-project/target/dbt_ui.sqlite npm run dev
```

### 5️⃣ Open Browser

Navigate to: **http://localhost:3000**

🎉 You should see your dbt models!

---

## 🐛 Not Working?

Run the verification script:

```bash
npm run verify
```

This will check all requirements and tell you what's missing.

### Common Fixes

**WASM file error?**
```bash
npm run setup:wasm
rm -rf apps/web/dbt-docs-redesign/.next
npm run dev
```

**Database not found?**
```bash
# Make sure path is ABSOLUTE, not relative
echo $DBT_UI_DB_PATH
# Should print: /Users/you/project/target/dbt_ui.sqlite

# Not ~/project/... or ./project/...
```

**Still stuck?** See [SETUP.md](./SETUP.md) for detailed troubleshooting.

---

## 💡 Pro Tips

### Use .env.local

Instead of setting `DBT_UI_DB_PATH` every time:

```bash
cd apps/web/dbt-docs-redesign
echo "DBT_UI_DB_PATH=/absolute/path/to/dbt_ui.sqlite" > .env.local
npm run dev
```

### Test Your Setup

```bash
# Health check
curl http://localhost:3000/api/db

# Should return JSON with database info
```

### Auto-reload on Database Changes

The app automatically detects when the database file changes. Just regenerate:

```bash
cd /path/to/your/dbt-project
npx @dbt-ui/cli generate
# Refresh browser - new data appears!
```

---

## 📚 Next Steps

- Read [README.md](./README.md) for architecture overview
- Check [SETUP.md](./SETUP.md) for advanced configuration
- Explore the API at `http://localhost:3000/api/*`

---

**Need help?** Open an issue with the output of `npm run verify`
