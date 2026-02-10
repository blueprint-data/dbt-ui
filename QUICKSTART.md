# 🚀 Quick Start Guide

Get dbt-ui running in 5 minutes with your local dbt project!

## 📋 Prerequisites

- Node.js 18+ installed
- pnpm (`npm install -g pnpm`)
- A dbt project with models on your machine

## ⚡️ 5-Minute Setup

### 1️⃣ Clone & Install (30 seconds)

```bash
git clone https://github.com/blueprint-data/dbt-ui.git
cd dbt-ui
pnpm install
```

### 2️⃣ Setup WASM (10 seconds)

```bash
pnpm run setup:wasm
```

Expected output: `✅ WASM file copied to apps/web/dbt-docs-redesign/public/`

### 3️⃣ Get Your dbt Manifest

You need the `manifest.json` from your dbt project.

**Already have one?** Skip to Step 4. Just note the absolute path:

```bash
ls ~/projects/my-dbt-project/target/manifest.json
```

**Don't have one?** Generate it:

```bash
cd ~/projects/my-dbt-project
dbt docs generate
# → Creates target/manifest.json
```

### 4️⃣ Build the Database (10 seconds)

```bash
cd ~/path/to/dbt-ui

npx tsx packages/cli/src/index.ts generate \
  --manifest ~/projects/my-dbt-project/target/manifest.json \
  --out target/dbt_ui.sqlite \
  --skip-dbt
```

You should see:
```
SUCCESS: Database generated.
- Models: 42
- Columns: 318
- Edges: 67
- Search entries: 360
```

### 5️⃣ Start the Server (10 seconds)

```bash
# Save the DB path so you don't have to type it every time
echo "DBT_UI_DB_PATH=$(pwd)/target/dbt_ui.sqlite" > apps/web/dbt-docs-redesign/.env.local

pnpm run dev
```

### 6️⃣ Open Browser

Navigate to: **http://localhost:3000**

🎉 You should see your dbt models!

---

## 🔄 Switching dbt Projects

To visualize a different project, just rebuild the database:

```bash
npx tsx packages/cli/src/index.ts generate \
  --manifest ~/projects/other-project/target/manifest.json \
  --out target/dbt_ui.sqlite \
  --skip-dbt

# Refresh your browser — new data appears!
```

---

## 🐛 Not Working?

Run the verification script:

```bash
npm run verify
```

### Common Fixes

**WASM file error?**
```bash
pnpm run setup:wasm
rm -rf apps/web/dbt-docs-redesign/.next
pnpm run dev
```

**Database not found?**
```bash
# Make sure path is ABSOLUTE, not relative
cat apps/web/dbt-docs-redesign/.env.local
# Should show: DBT_UI_DB_PATH=/Users/you/dbt-ui/target/dbt_ui.sqlite
```

**Port already in use?**
```bash
# Use a different port
PORT=3001 pnpm run dev
```

---

## 💡 Pro Tips

### Health Check

```bash
curl http://localhost:3000/api/db
# Should return JSON with database info
```

### Regenerate Without Restarting

The app auto-detects database changes. Just regenerate and refresh:

```bash
npx tsx packages/cli/src/index.ts generate \
  --manifest ~/projects/my-dbt-project/target/manifest.json \
  --out target/dbt_ui.sqlite \
  --skip-dbt
# Refresh browser → updated data!
```

---

## 📚 Next Steps

- Read [README.md](./README.md) for full architecture and documentation
- Check [USER_GUIDE.md](./USER_GUIDE.md) for feature walkthrough
- Explore the API at `http://localhost:3000/api/*`

---

**Need help?** Open an [issue](https://github.com/blueprint-data/dbt-ui/issues) with the output of `npm run verify`
