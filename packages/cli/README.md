# dbt-ui

[![CI](https://github.com/blueprint-data/dbt-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/blueprint-data/dbt-ui/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@blueprint-data/dbt-ui)](https://www.npmjs.com/package/@blueprint-data/dbt-ui)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A modern documentation viewer for dbt projects. Generates a fast SQLite database from your `manifest.json` and serves a beautiful web UI with lineage graphs, search, and SQL code viewer.

---

## 🚀 Quick Start

**Prerequisites:** Node.js 18+ and a dbt project with a `manifest.json`.

```bash
# 1. Generate the database from your manifest
npx @blueprint-data/dbt-ui generate \
  --manifest /absolute/path/to/target/manifest.json \
  --out ./dbt_ui.sqlite \
  --skip-dbt

# 2. Serve the UI
npx @blueprint-data/dbt-ui serve --db ./dbt_ui.sqlite

# 3. Open http://localhost:3000
```

> **Tip:** Always use an absolute path for `--manifest`.

---

## ✨ Features

- 🔍 **Global search** — command palette across all models and columns
- 📊 **Interactive lineage graph** — canvas-based DAG with zoom and pan
- 🌳 **Tree navigation** — explore by project structure or database/schema
- 💻 **SQL code viewer** — syntax-highlighted raw and compiled SQL
- 📋 **Column documentation** — descriptions and types per model
- 🎨 **Dark / light theme** — system-aware with manual toggle
- 📱 **Responsive** — works on mobile with collapsible sidebar

---

## 📖 Commands

### `generate`

Parses your `manifest.json` and builds a local SQLite database.
Also writes a raw manifest copy to the SQLite output directory as `manifest.json` for `/manifest.json` compatibility.

| Flag | Default | Description |
|------|---------|-------------|
| `--manifest <path>` | `target/manifest.json` | Path to manifest.json (use absolute path) |
| `--out <path>` | `target/dbt_ui.sqlite` | Output SQLite file |
| `--skip-dbt` | — | Skip running `dbt docs generate` |

### `serve`

Starts the web UI pointing at a SQLite database.

| Flag | Default | Description |
|------|---------|-------------|
| `--db <path>` | `target/dbt_ui.sqlite` | Path to SQLite database |
| `--port <port>` | `3000` | Port to listen on |

### Quick Reference

| Task | Command |
|------|---------|
| Generate DB | `npx @blueprint-data/dbt-ui generate --manifest <path> --skip-dbt` |
| Serve UI | `npx @blueprint-data/dbt-ui serve` |
| Custom port | `npx @blueprint-data/dbt-ui serve --port 3001` |
| Custom DB path | `npx @blueprint-data/dbt-ui serve --db /path/to/dbt_ui.sqlite` |
| Switch projects | Re-run `generate` with new manifest, refresh browser |

---

## 🔧 Troubleshooting

### Database not found

```bash
# Make sure you've generated the DB first
npx @blueprint-data/dbt-ui generate --manifest /absolute/path/to/manifest.json --skip-dbt

# Then serve
npx @blueprint-data/dbt-ui serve
```

### Using a custom DB location

```bash
npx @blueprint-data/dbt-ui serve --db /path/to/dbt_ui.sqlite
# or via env var
DBT_UI_DB_PATH=/path/to/dbt_ui.sqlite npx @blueprint-data/dbt-ui serve
```

---

## 🧪 Tech Stack

- **sql.js** — SQLite compiled to WebAssembly (zero native dependencies, cross-platform)
- **Next.js 16 + React 19** — App Router with Server Components
- **TypeScript** — end-to-end type safety
- **Tailwind CSS 4 + Radix UI** — accessible, modern UI

---

## 🛠 Contributing

```bash
git clone https://github.com/blueprint-data/dbt-ui.git
cd dbt-ui
pnpm install
pnpm run setup:wasm

# Generate DB
npx tsx packages/cli/src/index.ts generate --manifest <path> --out target/dbt_ui.sqlite --skip-dbt

# Run dev server
echo "DBT_UI_DB_PATH=$(pwd)/target/dbt_ui.sqlite" > apps/web/dbt-docs-redesign/.env.local
pnpm run dev
```

---

## 🚀 Roadmap

- [ ] Export lineage as image (PNG/SVG)
- [ ] Column-level lineage
- [ ] Test results integration
- [ ] dbt Cloud integration
- [ ] Docker image

---

## 📋 Recent Updates

### 2026-02-03
- ✅ Added micro-animations (hover effects, page transitions, loading shimmer)
- ✅ Verified lineage graph with real dbt projects
- ✅ Full-text search and tree navigation tested
- ✅ Database mode shows schema hierarchy correctly

---

## 📄 License

[MIT](https://opensource.org/licenses/MIT)

---

Built with ❤️ for the dbt community
