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

Start the development server:
```bash
pnpm dev
# or
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

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
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page (models list)
│   ├── model/[id]/        # Individual model pages
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
├── hooks/                 # Custom React hooks
├── lib/                   # Utility functions and helpers
├── public/               # Static assets
├── styles/               # Additional stylesheets
└── package.json          # Project dependencies
```

## 🎨 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (React 19)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **UI Components**: [Radix UI](https://www.radix-ui.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Charts**: [Recharts](https://recharts.org/)
- **Form Handling**: [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Theming**: [next-themes](https://github.com/pacocoursey/next-themes)

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
