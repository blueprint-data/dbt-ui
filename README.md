# dbt-ui

A modern, full-stack solution for visualizing and exploring dbt projects. This monorepo contains both the data processing backend and a beautiful web interface for dbt documentation.

## 🏗️ Project Structure

This is a **monorepo** organized with npm workspaces:

```
dbt-ui/
├── apps/
│   └── web/
│       └── dbt-docs-redesign/    # Next.js web application
├── packages/
│   ├── core/                      # Core data processing logic
│   └── cli/                       # Command-line interface
├── package.json                   # Root workspace configuration
└── tsconfig.json                  # Shared TypeScript config
```

## 📦 Packages

### `@dbt-ui/core`
Core library for processing dbt manifest files and building a SQLite database for fast queries.

**Features:**
- Parse dbt manifest.json files
- Build optimized SQLite database
- Full-text search capabilities
- Model relationship mapping

### `@dbt-ui/cli`
Command-line tool to generate the SQLite database from your dbt project.

**Usage:**
```bash
dbt-ui generate [--manifest <path>] [--out <path>] [--skip-dbt]
```

**Options:**
- `--manifest <path>`: Path to manifest.json (default: `target/manifest.json`)
- `--out <path>`: Output SQLite file path (default: `target/dbt_ui.sqlite`)
- `--skip-dbt`: Skip running `dbt docs generate`

### Web Application
A modern Next.js application providing an intuitive interface for exploring dbt models.

**Features:**
- 🔍 Advanced search and filtering
- 📊 Interactive lineage visualization
- 🌳 Tree-based project navigation
- 💻 Syntax-highlighted code viewer
- 📋 Column-level documentation
- 🎨 Beautiful dark/light themes
- 📱 Responsive design

See [`apps/web/dbt-docs-redesign/README.md`](apps/web/dbt-docs-redesign/README.md) for more details.

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18.x or higher
- **npm** or **pnpm**
- **dbt** project with generated manifest.json

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd dbt-ui
```

2. Install dependencies:
```bash
npm install
```

This will install dependencies for all packages in the workspace.

### Generate Database

Navigate to your dbt project and run:

```bash
# Option 1: Run dbt docs generate and build database
npx @dbt-ui/cli generate

# Option 2: Use existing manifest
npx @dbt-ui/cli generate --manifest ./target/manifest.json --out ./target/dbt_ui.sqlite

# Option 3: Skip dbt command (use existing manifest only)
npx @dbt-ui/cli generate --skip-dbt
```

### Run Web Application

1. Navigate to the web app:
```bash
cd apps/web/dbt-docs-redesign
```

2. Install dependencies (if not already installed):
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🛠️ Development

### Workspace Commands

From the root directory:

```bash
# Install all dependencies
npm install

# Build all packages
npm run build -ws

# Run tests (if available)
npm test -ws
```

### Package-specific Development

Work on individual packages:

```bash
# Work on core package
cd packages/core
npm run dev

# Work on CLI
cd packages/cli
npm run dev

# Work on web app
cd apps/web/dbt-docs-redesign
npm run dev
```

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

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

[Add your license information here]

## 🙋 Support

For questions or issues:
- Open an issue on GitHub
- Contact the maintainers

---

Built with ❤️ for the dbt community
