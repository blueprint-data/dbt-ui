# dbt Docs Redesign

A modern, redesigned documentation interface for dbt (data build tool) projects. This application provides an intuitive and visually stunning way to explore your dbt models, their lineage, and metadata.

## 🚀 Features

- **Interactive Lineage Graph**: Visualize model dependencies with a beautiful, interactive graph
- **Model Explorer**: Browse and search through all your dbt models
- **Tree Sidebar**: Navigate your project structure with an intuitive tree view
- **Code Viewer**: Syntax-highlighted code display for SQL and YAML files
- **Column Details**: Explore column-level information and metadata
- **Advanced Filtering**: Filter models by type, tags, packages, and more
- **Dark/Light Mode**: Full theme support with smooth transitions
- **Responsive Design**: Optimized for desktop and mobile devices

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** 18.x or higher
- **pnpm** (recommended) or npm

## 🛠️ Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd dbt-docs-redesign
```

2. Install dependencies:
```bash
pnpm install
# or
npm install
```

## 🏃 Running the Application

### Development Mode

1. **Set the database path** (required):
   ```bash
   export DBT_UI_DB_PATH=/path/to/your/dbt-project/target/dbt_ui.sqlite
   ```

2. **Start the development server:**
   ```bash
   pnpm dev
   # or
   npm run dev
   ```

   The application will be available at [http://localhost:3000](http://localhost:3000)

**Quick example with inline environment variable:**
```bash
DBT_UI_DB_PATH=/Users/yourname/dbt-project/target/dbt_ui.sqlite pnpm dev
```

### Production Build

Build the application for production:
```bash
pnpm build
# or
npm run build
```

Start the production server:
```bash
pnpm start
# or
npm start
```

### Linting

Run the linter:
```bash
pnpm lint
# or
npm run lint
```

## 📁 Project Structure

```
dbt-docs-redesign/
├── app/                    # Next.js App Router
│   ├── api/               # API routes (server-side)
│   │   ├── models/        # Models endpoints
│   │   ├── lineage/       # Lineage graph data
│   │   ├── search/        # Search endpoint
│   │   ├── nav/           # Navigation tree
│   │   └── db/            # Database info
│   ├── model/[id]/        # Model detail pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page (models list)
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── app-shell.tsx     # Main application shell
│   ├── code-viewer.tsx   # Code display component
│   ├── columns-table.tsx # Column details table
│   ├── filters-sidebar.tsx # Filtering UI
│   ├── header.tsx        # Application header
│   ├── lineage-graph.tsx # Lineage visualization
│   ├── models-table.tsx  # Models table
│   ├── search-bar.tsx    # Search functionality
│   └── tree-sidebar.tsx  # Project tree navigation
├── lib/                   # Utility functions and helpers
│   ├── server/           # Server-side only code
│   │   └── db.ts         # Database connection (uses @dbt-ui/core)
│   └── types.ts          # TypeScript type definitions
├── hooks/                 # Custom React hooks
├── public/               # Static assets
│   └── sql-wasm.wasm     # SQLite WebAssembly file
├── styles/               # Additional stylesheets
├── next.config.mjs       # Next.js configuration
└── package.json          # Project dependencies
```

## 🏗️ Architecture

### API Routes (Server-Side)

All API routes run on the Node.js server and use sql.js to query the SQLite database:

| Route | Description |
|-------|-------------|
| `GET /api/models` | List models with pagination, filtering, and facets |
| `GET /api/models/[id]` | Get detailed model information including columns |
| `GET /api/lineage/[id]` | Get lineage graph data for a specific model |
| `GET /api/search` | Full-text search across models and columns |
| `GET /api/nav/database` | Get navigation tree structure |
| `GET /api/db` | Database health check and metadata |

### Database Layer

The application uses **sql.js** (SQLite compiled to WebAssembly) via the `@dbt-ui/core` package:

- **Connection caching**: Database connection is cached and reused across requests
- **Hot-reload detection**: Automatically detects database file changes via `mtime`
- **In-memory operation**: Database is loaded into memory for fast queries
- **WASM execution**: SQL queries execute in WebAssembly for near-native performance

### Data Flow

```
User Request → Next.js Page/API Route → lib/server/db.ts → @dbt-ui/core → sql.js → SQLite Database
```

1. User navigates to a page or the UI makes an API request
2. Next.js Server Component or API route handler processes the request
3. `lib/server/db.ts` provides cached database connection
4. `@dbt-ui/core` wraps sql.js with a convenient API
5. sql.js executes SQLite queries via WebAssembly
6. Results are returned as JSON to the client

## 🎨 Tech Stack

### Frontend
- **Framework**: [Next.js 16](https://nextjs.org/) with App Router
- **UI Library**: [React 19](https://react.dev/) with Server Components
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **Form Handling**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Theming**: [next-themes](https://github.com/pacocoursey/next-themes)

### Backend (API Routes)
- **Database**: [sql.js](https://sql.js.org/) - SQLite compiled to WebAssembly
- **Runtime**: Node.js (via Next.js API routes)
- **Package**: [@dbt-ui/core](../../packages/core) - Shared database logic

#### Why sql.js?
- ✅ **Zero native dependencies** - Pure JavaScript + WebAssembly
- ✅ **Cross-platform** - Works on any OS without compilation
- ✅ **Fast** - WASM performance close to native
- ✅ **Portable** - Easy deployment with no build steps
- ✅ **Modern** - Latest SQLite features

## 🔧 Configuration

### Tailwind CSS

The project uses Tailwind CSS 4 with PostCSS. Configuration can be found in:
- `postcss.config.mjs`
- `app/globals.css` (for CSS variables and custom utilities)

### TypeScript

TypeScript configuration is in `tsconfig.json`. The project uses strict type checking for better code quality.

### Components

UI components are built with Radix UI primitives and styled with Tailwind CSS. Component configuration is in `components.json`.

## 🎯 Key Components

### Lineage Graph
The lineage graph (`components/lineage-graph.tsx`) provides an interactive visualization of model dependencies with features like:
- Pan and zoom
- Node filtering
- Hover interactions
- Responsive layout

### Tree Sidebar
The tree sidebar (`components/tree-sidebar.tsx`) offers hierarchical navigation with:
- Collapsible folders
- Search integration
- Type indicators
- Virtualized rendering for performance

### Models Table
The models table (`components/models-table.tsx`) displays all models with:
- Sortable columns
- Quick search
- Pagination
- Resource type indicators

## 🚫 What's Not Included

This repository excludes the following files and directories (see `.gitignore`):
- Build artifacts (`.next/`, `out/`, `build/`)
- Dependencies (`node_modules/`, `.pnpm-store/`)
- Environment files (`.env*`)
- IDE configurations (`.vscode/`, `.idea/`)
- Agent directories (`.agents/`, `.opencode/`)
- Temporary files (`*.log`, `*.tsbuildinfo`)

## 📝 Development Guidelines

1. **Component Structure**: Keep components focused and reusable
2. **Styling**: Use Tailwind classes; avoid inline styles
3. **Type Safety**: Leverage TypeScript for all components and utilities
4. **Accessibility**: Use Radix UI primitives for built-in accessibility
5. **Performance**: Consider code splitting and lazy loading for large components

## 🔧 Troubleshooting

### WASM file not found error

If you see an error like:
```
ENOENT: no such file or directory, open '/ROOT/node_modules/.pnpm/sql.js@1.13.0/node_modules/sql.js/dist/sql-wasm.wasm'
```

**This means the WebAssembly file for sql.js is not being found.**

**Solution:**

1. **Stop the dev server** (Ctrl+C)

2. **Delete the Next.js build cache:**
   ```bash
   rm -rf .next
   ```

3. **Verify the WASM file exists:**
   ```bash
   ls -lh public/sql-wasm.wasm
   ```
   
   If the file is missing, copy it manually:
   ```bash
   cp node_modules/.pnpm/sql.js@*/node_modules/sql.js/dist/sql-wasm.wasm public/
   ```
   
   Or from the root of the monorepo:
   ```bash
   cp ../../../node_modules/.pnpm/sql.js@*/node_modules/sql.js/dist/sql-wasm.wasm public/
   ```

4. **Restart the dev server:**
   ```bash
   pnpm dev
   ```

The `next.config.mjs` should automatically copy the WASM file on subsequent builds.

### Database not found

If you get errors about the database file not being found:

**Cause:** The `DBT_UI_DB_PATH` environment variable is not set or points to a non-existent file.

**Solution:**

1. **Generate the database first** (from your dbt project):
   ```bash
   cd /path/to/your/dbt-project
   npx @dbt-ui/cli generate
   ```

2. **Verify the database file exists:**
   ```bash
   ls -lh target/dbt_ui.sqlite
   ```

3. **Set the environment variable:**
   ```bash
   export DBT_UI_DB_PATH=/absolute/path/to/your/dbt-project/target/dbt_ui.sqlite
   ```

4. **Or use an `.env.local` file:**
   ```bash
   # Create .env.local in the app directory
   echo "DBT_UI_DB_PATH=/absolute/path/to/your/dbt-project/target/dbt_ui.sqlite" > .env.local
   ```

### API returns 500 errors

Check the terminal where the dev server is running for detailed error messages. Common issues:

- **Database locked**: Another process is using the database file
- **Corrupted database**: Regenerate with `npx @dbt-ui/cli generate`
- **Missing tables**: Database schema mismatch - regenerate database
- **WASM not loaded**: See "WASM file not found" above

### Health check endpoint

Visit `http://localhost:3000/api/db` to verify:
- Database connection status
- Database file path
- Table row counts
- Schema version

Example response:
```json
{
  "ok": true,
  "dbPath": "/path/to/dbt_ui.sqlite",
  "tables": {
    "model": 42,
    "column_def": 315,
    "edge": 89,
    "search_docs": 42
  }
}
```

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a new branch for your feature
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

[Add your license information here]

## 🙋 Support

For questions or issues, please [open an issue](link-to-issues) or contact the maintainers.

---

Built with ❤️ for the dbt community
