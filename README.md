# dbt-ui

[![CI](https://github.com/blueprint-data/dbt-ui/actions/workflows/ci.yml/badge.svg)](https://github.com/blueprint-data/dbt-ui/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A modern, full-stack solution for visualizing and exploring dbt projects. This monorepo contains both the data processing backend and a beautiful web interface for dbt documentation.

> **Note:** The npm package is not yet published. See [Run Locally](#-run-locally-development) below for setup instructions.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        dbt-ui Monorepo                              │
│                     (pnpm / npm workspaces)                         │
│                                                                     │
│  ┌──────────────┐   ┌──────────────────┐   ┌────────────────────┐  │
│  │ @dbt-ui/core │──▶│   dbt-ui CLI      │   │ dbt-docs-redesign  │  │
│  │              │   │                   │   │   (Next.js 16)     │  │
│  │ • manifest   │   │ • generate cmd    │   │                    │  │
│  │   parser     │   │ • serve cmd ──────│──▶│ • API routes       │  │
│  │ • SQLite     │   │                   │   │ • React 19 UI      │  │
│  │   builder    │   └──────────────────┘   │ • Lineage graph    │  │
│  │ • sql.js     │                           │ • Tree navigation  │  │
│  │   (WASM)     │──────────────────────────▶│ • Search           │  │
│  └──────────────┘                           └────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘

  manifest.json ──▶ SQLite DB ──▶ API Routes ──▶ Browser UI
```

### Project Structure

```
dbt-ui/
├── apps/
│   └── web/
│       └── dbt-docs-redesign/       # Next.js 16 web application
│           ├── app/                  # Pages + API routes
│           │   ├── api/              # 7 REST endpoints
│           │   ├── model/[id]/       # Model detail page
│           │   └── page.tsx          # Explorer dashboard
│           ├── components/           # 17 React components + UI primitives
│           ├── hooks/                # 3 custom hooks
│           └── lib/                  # API client, types, utilities
├── packages/
│   ├── core/                         # Data processing library
│   │   └── src/
│   │       ├── sqlite.ts             # WASM SQLite wrapper
│   │       ├── build.ts              # Manifest → SQLite builder
│   │       └── manifest.ts           # dbt type definitions
│   └── cli/                          # Command-line interface
│       └── src/
│           └── index.ts              # generate + serve commands
├── .github/workflows/                # CI/CD (3 workflows)
├── package.json                      # Root workspace config
└── tsconfig.json                     # Shared TypeScript config
```

### Data Flow

```
1. dbt docs generate          → manifest.json
2. @dbt-ui/core build          → dbt_ui.sqlite (4 tables)
3. Next.js API routes          → Read SQLite via sql.js (WASM)
4. React components            → Render in browser
```

## 📦 Packages

### `@dbt-ui/core`
Core library for processing dbt manifest files and building a SQLite database for fast queries.

**Features:**
- Parse dbt `manifest.json` files
- Build optimized SQLite database via **sql.js** (WebAssembly)
- Full-text search capabilities
- Model relationship mapping (DAG edges)

**Database Schema** (4 tables):

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `model` | All dbt models/seeds/snapshots | `unique_id`, `name`, `resource_type`, `schema_name`, `materialized`, `tags_json` |
| `column_def` | Column definitions per model | `model_unique_id`, `name`, `description` |
| `edge` | DAG dependencies between models | `src_unique_id`, `dst_unique_id`, `edge_type` |
| `search_docs` | Search index for models + columns | `doc_type`, `name`, `description`, `tags` |

### `dbt-ui` (CLI)
Command-line tool to generate the SQLite database and serve the web app.

**Commands:**

| Command | Description |
|---------|-------------|
| `dbt-ui generate` | Run `dbt docs generate` + build SQLite DB from manifest |
| `dbt-ui serve` | Launch the Next.js web app pointing at a SQLite DB |

**Generate options:**
- `--manifest <path>`: Path to manifest.json (default: `target/manifest.json`)
- `--out <path>`: Output SQLite file path (default: `target/dbt_ui.sqlite`)
- `--skip-dbt`: Skip running `dbt docs generate`

**Serve options:**
- `--db <path>`: Path to SQLite database (default: `target/dbt_ui.sqlite`)
- `--port <port>`: Port number (default: `3000`)

### Web Application
A modern Next.js 16 application providing an intuitive interface for exploring dbt models.

**Features:**
- 🔍 Advanced search and filtering (global command palette)
- 📊 Interactive lineage visualization (canvas-based DAG with zoom/pan)
- 🌳 Tree-based project navigation (project + database modes, virtualized)
- 💻 Syntax-highlighted SQL code viewer (raw + compiled)
- 📋 Column-level documentation
- 🎨 Beautiful dark/light themes (system-aware)
- 📱 Responsive design with mobile sidebar

**Key Components:**

| Component | Purpose |
|-----------|--------|
| `lineage-graph.tsx` | Canvas-based DAG visualization with BFS traversal |
| `tree-sidebar.tsx` | Project/database tree navigation |
| `search-bar.tsx` | Global search with command palette (cmdk) |
| `models-table.tsx` | Sortable, paginated data assets table |
| `code-viewer.tsx` | Syntax-highlighted SQL viewer |
| `columns-table.tsx` | Column definitions display |
| `filters-sidebar.tsx` | Tag/schema/package/materialization filters |
| `app-shell.tsx` | Main layout shell (header + sidebar + content + floating graph button) |

**API Routes** (7 endpoints):

| Endpoint | Purpose |
|----------|--------|
| `GET /api/models` | List models with pagination and facets |
| `GET /api/models/[id]` | Model detail with columns and code |
| `GET /api/search` | Text search across models and columns |
| `GET /api/lineage/[id]` | BFS graph traversal for lineage DAG |
| `GET /api/lineage/all` | Full project lineage graph |
| `GET /api/nav/database` | Database/schema tree navigation data |
| `GET /api/db` | Database health check |

## 🚀 Quick Start

Since the npm package is not yet published, you run everything from the **cloned repo** and point it at your local dbt project.

### Prerequisites

- **Node.js** 18.x or higher
- **pnpm** (recommended) or **npm**
- A **dbt project** on your machine (e.g. `~/projects/my-dbt-project`)

### Step 1: Clone and Install dbt-ui

```bash
git clone https://github.com/blueprint-data/dbt-ui.git
cd dbt-ui
pnpm install
```

### Step 2: Setup WASM

Copy the sql.js WebAssembly file to the public directory:

```bash
pnpm run setup:wasm
```

### Step 3: Link to Your dbt Project

dbt-ui needs the `manifest.json` file that dbt generates. Here's how to get it from your local dbt project:

#### Option A: You already have a manifest.json

If you've run `dbt docs generate` or `dbt compile` before, you already have the file at `<your-dbt-project>/target/manifest.json`. Just note the **absolute path**:

```bash
# Example: check it exists
ls ~/projects/my-dbt-project/target/manifest.json
```

#### Option B: Generate the manifest from your dbt project

Go to your dbt project and generate it:

```bash
cd ~/projects/my-dbt-project
dbt docs generate
# This creates target/manifest.json
```

Then note the absolute path:
```bash
# Example
echo $(pwd)/target/manifest.json
# → /Users/you/projects/my-dbt-project/target/manifest.json
```

### Step 4: Build the SQLite Database

Go back to the dbt-ui repo and build the database from your dbt manifest:

```bash
cd ~/path/to/dbt-ui

# Replace the path with YOUR manifest.json location
npx tsx packages/cli/src/index.ts generate \
  --manifest /Users/you/projects/my-dbt-project/target/manifest.json \
  --out target/dbt_ui.sqlite \
  --skip-dbt
```

You should see output like:
```
Building SQLite at target/dbt_ui.sqlite from /Users/you/projects/my-dbt-project/target/manifest.json...
SUCCESS: Database generated.
- Models: 42
- Columns: 318
- Edges: 67
- Search entries: 360
```

### Step 5: Run the Web App

Set the database path and start the dev server:

```bash
# Inline (one-liner)
DBT_UI_DB_PATH=$(pwd)/target/dbt_ui.sqlite pnpm run dev
```

Or create a `.env.local` file in `apps/web/dbt-docs-redesign/` so you don't have to type it every time:

```bash
echo "DBT_UI_DB_PATH=$(pwd)/target/dbt_ui.sqlite" > apps/web/dbt-docs-redesign/.env.local
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser 🎉

### Complete Example (end to end)

```bash
# 1. Clone dbt-ui
git clone https://github.com/blueprint-data/dbt-ui.git
cd dbt-ui
pnpm install
pnpm run setup:wasm

# 2. Generate the manifest in your dbt project
cd ~/projects/my-dbt-project
dbt docs generate

# 3. Build the database
cd ~/path/to/dbt-ui
npx tsx packages/cli/src/index.ts generate \
  --manifest ~/projects/my-dbt-project/target/manifest.json \
  --out target/dbt_ui.sqlite \
  --skip-dbt

# 4. Run the web app
echo "DBT_UI_DB_PATH=$(pwd)/target/dbt_ui.sqlite" > apps/web/dbt-docs-redesign/.env.local
pnpm run dev

# 5. Open http://localhost:3000
```

### Switching Between dbt Projects

To visualize a different dbt project, just rebuild the database with the new manifest:

```bash
# Point to a different project's manifest
npx tsx packages/cli/src/index.ts generate \
  --manifest ~/projects/other-dbt-project/target/manifest.json \
  --out target/dbt_ui.sqlite \
  --skip-dbt

# Restart the dev server (the DB path stays the same)
pnpm run dev
```

> **Tip:** The web app auto-detects when the database file changes, so in most cases you just need to refresh the browser after regenerating.

### Quick Reference

| Task | Command |
|------|---------|
| Install all deps | `pnpm install` |
| Setup WASM file | `pnpm run setup:wasm` |
| Generate DB | `npx tsx packages/cli/src/index.ts generate --manifest <path> --out target/dbt_ui.sqlite --skip-dbt` |
| Run dev server | `pnpm run dev` |
| Build production | `pnpm run build` |
| Build standalone | `pnpm run build:standalone` |
| Clean cache | `rm -rf apps/web/dbt-docs-redesign/.next` |

## 🧪 Tech Stack

### Backend
- **TypeScript** - Type-safe development
- **sql.js** - SQLite compiled to WebAssembly (portable, runs in Node.js and browsers)
- **Node.js** - Runtime environment

#### Why sql.js?
We chose sql.js over native SQLite bindings for several key advantages:

- ✅ **Zero native dependencies** - Pure JavaScript + WebAssembly, no compilation needed
- ✅ **Cross-platform** - Works on any OS (Windows, macOS, Linux) without platform-specific builds
- ✅ **Portable** - Single .wasm file, easy to deploy and distribute
- ✅ **Modern** - Latest SQLite features compiled directly from source
- ✅ **Flexible** - Can run in both Node.js and browser environments
- ✅ **Easy setup** - No build tools or native compilation required

### Frontend
- **Next.js 16** - React framework with App Router
- **React 19** - UI library with Server Components
- **TypeScript** - Type safety across the stack
- **Tailwind CSS 4** - Modern utility-first styling
- **Radix UI** - Accessible component primitives
- **Recharts** - Data visualization and charts

## 📝 Workflow

1. **Generate dbt docs** in your dbt project
2. **Run CLI tool** to create SQLite database
3. **Launch web app** to explore your documentation
4. **Share** the SQLite file with your team

## 🚫 What's Excluded from Git

The following files/directories are excluded via `.gitignore`:

- `node_modules/` - Dependencies (install via npm)
- `*.sqlite` and `target/` - Generated database files
- `*.tsbuildinfo` - TypeScript build cache
- `.next/`, `dist/`, `build/` - Build artifacts
- `.env*` - Environment files
- `.vscode/`, `.idea/` - IDE configurations
- `.agents/`, `.opencode/`, `.gemini/` - AI agent directories
- `*.log` - Log files

## 📂 Key Files

- **`package.json`** (root) - Workspace configuration and shared dev dependencies
- **`tsconfig.json`** - Shared TypeScript configuration for all packages
- **`packages/core/src/index.ts`** - Core data processing logic
- **`packages/cli/src/index.ts`** - CLI entry point
- **`apps/web/dbt-docs-redesign/`** - Web application

## 🔧 Troubleshooting

### WASM file not found error

If you see an error like:
```
ENOENT: no such file or directory, open '/ROOT/node_modules/.pnpm/sql.js@1.13.0/node_modules/sql.js/dist/sql-wasm.wasm'
```

**Solution:**

1. **Stop the dev server** (Ctrl+C)

2. **Delete the `.next` build cache:**
   ```bash
   rm -rf apps/web/dbt-docs-redesign/.next
   ```

3. **Verify WASM file exists in public:**
   ```bash
   ls -lh apps/web/dbt-docs-redesign/public/sql-wasm.wasm
   ```
   
   If missing, run the setup script:
   ```bash
   npm run setup:wasm
   ```

4. **Restart the dev server:**
   ```bash
   cd apps/web/dbt-docs-redesign
   npm run dev
   ```

The `sql-wasm.wasm` file should be automatically copied to the `public` directory on the next build.

### Database file location

The application looks for the SQLite database in the following order:
1. `DBT_UI_DB_PATH` environment variable (absolute path)
2. `target/dbt_ui.sqlite` (relative to working directory)

**Example usage:**
```bash
# Set database path for current session
export DBT_UI_DB_PATH=/path/to/your/dbt-project/target/dbt_ui.sqlite

# Or inline with the command
DBT_UI_DB_PATH=/path/to/project/target/dbt_ui.sqlite npm run dev
```

### Database not found

If you get "database not found" errors:

1. **Generate the database first:**
   ```bash
   cd your-dbt-project
   npx @dbt-ui/cli generate
   ```

2. **Verify the file exists:**
   ```bash
   ls -lh target/dbt_ui.sqlite
   ```

3. **Check the path is correct:**
   ```bash
   echo $DBT_UI_DB_PATH
   ```

## 🚀 CI/CD & Automated Releases

This project uses **GitHub Actions** and **Changesets** for automated testing and publishing.

### 🧪 Workflows
- **CI**: Runs on every PR to ensure the code builds and passes basic checks.
- **Release**: Automatically publishes to NPM and creates a GitHub Release when a version change is merged.

### 🔑 Configuration (Required for Maintainers)

To enable automated publishing to NPM, you must add an `NPM_TOKEN` to your GitHub repository secrets:

1. Generate an **Automation** token on [npmjs.com](https://www.npmjs.com/).
2. In your GitHub repository, go to **Settings > Secrets and variables > Actions**.
3. Create a new repository secret named `NPM_TOKEN`.
4. Paste your NPM token.

### 📦 How to publish a new version

We use **Changesets** to manage versioning:

1. Run `pnpm changeset` locally to describe your change (major, minor, or patch).
2. Commit the generated markdown file in `.changeset/`.
3. Push to `main`.
4. A "Version Packages" PR will be opened automatically.
5. Merging that PR will trigger the automated publication to NPM.

---

## 📄 License

[Add your license information here]

## 🙋 Support

For questions or issues:
- Open an issue on GitHub
- Contact the maintainers

## 🚀 Roadmap

### Phase 1: Standalone Packaging (Priority)
The goal is to make dbt-ui a single npm package that can be installed and run anywhere.

- [x] **Configure Next.js standalone output**
  - `output: 'standalone'` in `next.config.mjs` ✅
  - Build generates self-contained `.next/standalone` folder ✅
  
- [x] **Update CLI for bundled web server**
  - `dbt-ui serve` command starts the embedded web server ✅
  - Supports standalone + dev modes ✅
  
- [ ] **Publish to npm**
  - Package core + cli + standalone web as single `dbt-ui` package
  - Users run: `npx dbt-ui serve --manifest ./target/manifest.json`

### Phase 2: Feature Enhancements
- [x] **Dark mode toggle** - System-aware theme with dark/light switcher ✅
- [ ] **Export lineage as image** - Download DAG as PNG/SVG
- [ ] **Column-level lineage** - Track data flow at column granularity
- [ ] **Test results integration** - Show test pass/fail status per model
- [ ] **dbt Cloud integration** - Pull metadata from dbt Cloud API

### Phase 3: Performance & Scale
- [ ] **Test with large projects** - Validate with 500+ models
- [x] **Virtual scrolling for tree** - react-window virtualized tree ✅
- [ ] **Virtual scrolling for lineage** - Handle massive DAGs smoothly
- [ ] **Search indexing optimization** - Faster full-text search

### Phase 4: Deployment Options
- [ ] **Docker image** - Pre-built container for quick deployment
- [ ] **Static export** - Generate static HTML for GitHub Pages
- [ ] **Embedded mode** - Iframe-friendly version for portals

---

## 📋 Recent Updates

### 2026-02-03
- ✅ Added 12 premium micro-animations (hover effects, page transitions, loading shimmer)
- ✅ Verified lineage graph working with real dbt projects
- ✅ Full-text search and tree navigation tested
- ✅ Database mode shows schema hierarchy correctly

---

Built with ❤️ for the dbt community
