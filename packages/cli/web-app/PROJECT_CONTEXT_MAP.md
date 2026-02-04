# 🗺️ dbt-docs-redesign Project Context Map

## Resumen Ejecutivo

**dbt-ui** es un monorepo full-stack para visualizar y explorar proyectos dbt. Consiste en una aplicación web Next.js 16 con React 19, respaldada por una biblioteca core que procesa manifests dbt en una base de datos SQLite in-memory usando WebAssembly.

---

## 🏗️ Arquitectura del Monorepo

```
dbt-ui/
├── apps/web/dbt-docs-redesign/   # 📱 Next.js Web Application
├── packages/
│   ├── core/                      # ⚙️ Core Data Processing (SQLite + manifest)
│   └── cli/                       # 🖥️ CLI para generar base de datos
├── package.json                   # Workspace root
└── pnpm-workspace.yaml            # pnpm monorepo config
```

---

## 📦 Stack Tecnológico

| Categoría | Tecnología | Versión |
|-----------|------------|---------|
| **Framework** | Next.js | 16.0.10 |
| **UI Library** | React | 19.2.0 |
| **Styling** | Tailwind CSS | 4.1.9 |
| **Components** | Radix UI | Múltiples |
| **Charts** | Recharts | 2.15.4 |
| **Database** | sql.js (WebAssembly) | - |
| **Icons** | Lucide React | 0.454.0 |
| **Forms** | React Hook Form + Zod | - |

---

## 📁 Estructura de la Aplicación Web

### `/app` - App Router (Next.js)

| Ruta | Descripción |
|------|-------------|
| `page.tsx` | Página principal - Dashboard con tabla de modelos, estadísticas, filtros |
| `layout.tsx` | Layout root con providers |
| `globals.css` | Estilos globales y tokens CSS |
| `model/[id]/page.tsx` | Detalle de un modelo dbt |
| `api/` | API Routes para datos |

### `/app/api` - API Routes

| Endpoint | Propósito |
|----------|-----------|
| `/api/db/` | Conexión a base de datos SQLite |
| `/api/lineage/` | Obtener grafo de lineage (upstream/downstream) |
| `/api/models/` | CRUD de modelos con filtros y paginación |
| `/api/nav/` | Navegación de árbol (project/database) |
| `/api/search/` | Búsqueda full-text |

---

## 🧩 Componentes Principales

### Core Components (15 archivos)

| Componente | Tamaño | Descripción |
|------------|--------|-------------|
| `lineage-graph.tsx` | 46KB | Visualización interactiva del grafo de lineage |
| `filters-sidebar.tsx` | 10KB | Sidebar con filtros por tags, schemas, packages |
| `tree-sidebar.tsx` | 9KB | Navegación en árbol del proyecto |
| `virtual-tree.tsx` | 9KB | Árbol virtualizado para performance |
| `search-bar.tsx` | 10KB | Barra de búsqueda con autocompletado |
| `database-tree.tsx` | 8KB | Vista de árbol por base de datos |
| `models-table.tsx` | 7KB | Tabla de modelos con sorting |
| `columns-table.tsx` | 6KB | Tabla de columnas de un modelo |
| `code-viewer.tsx` | 5KB | Visor de código SQL con syntax highlighting |
| `lineage-lists.tsx` | 4KB | Listas de upstream/downstream |
| `app-shell.tsx` | 4KB | Layout principal con sidebar |
| `pagination.tsx` | 3KB | Control de paginación |
| `header.tsx` | 2KB | Header con logo y search |
| `mobile-filters.tsx` | 2KB | Filtros para mobile (drawer) |

### UI Components (`/components/ui/` - 57 archivos)

Librería shadcn/ui con Radix UI:
Accordion, Alert, Avatar, Badge, Button, Card, Checkbox, Command, Dialog, Dropdown, Form, Input, Label, Popover, Progress, Radio, ScrollArea, Select, Separator, Sheet, Skeleton, Slider, Switch, Tabs, Toast, Toggle, Tooltip

---

## 📚 Librería `/lib`

| Archivo | Propósito |
|---------|-----------|
| `types.ts` | Tipos TypeScript core |
| `api.ts` | Cliente fetch para API routes |
| `tree-nav.ts` | Lógica de navegación en árbol |
| `mock-data.ts` | Datos mock para desarrollo |
| `utils.ts` | Utilidades (cn para tailwind-merge) |

---

## ⚙️ Package `@dbt-ui/core`

| Archivo | Propósito |
|---------|-----------|
| `sqlite.ts` | Wrapper sql.js: `createDb`, `openDb`, `saveDb`, `initSchema` |
| `build.ts` | Construye SQLite desde manifest.json |
| `manifest.ts` | Parser de manifest dbt |

### Schema SQLite

```sql
model (unique_id, name, resource_type, package_name, schema_name, materialized, description, tags_json, meta_json)
column_def (model_unique_id, name, description, meta_json)
edge (src_unique_id, dst_unique_id, edge_type)
search_docs (doc_type, doc_id, model_unique_id, name, description, tags, schema_name, package_name)
```

---

## 🎨 Tipos de Datos Principales

```typescript
type ResourceType = "model" | "seed" | "snapshot";
type Materialization = "table" | "view" | "incremental" | "ephemeral";

interface ModelSummary {
  unique_id: string;
  name: string;
  schema: string;
  package_name: string;
  materialization: Materialization;
  description?: string;
  tags: string[];
  resource_type: ResourceType;
}

interface FiltersState {
  tags: string[];
  schemas: string[];
  packages: string[];
  resourceType?: ResourceType;
  materializations: Materialization[];
}

interface TreeNode {
  id: string;
  parentId?: string;
  type: "folder" | "database" | "schema" | "package" | "model";
  label: string;
  modelId?: string;
  children: TreeNode[];
}
```

---

## 🛠️ Skills Disponibles (`.agents/skills/`)

| Skill | Propósito |
|-------|-----------|
| `frontend-design` | Diseño de interfaces distintivas y de alta calidad |
| `vercel-react-best-practices` | 57 reglas de optimización React/Next.js |
| `web-design-guidelines` | Revisión de UI contra Web Interface Guidelines |

---

## 🚀 Comandos de Desarrollo

```bash
# Desarrollo
cd apps/web/dbt-docs-redesign
npm run dev

# Build
npm run build

# Generar base de datos desde manifest dbt
npx @dbt-ui/cli generate --manifest ./target/manifest.json

# Setup WASM
npm run setup:wasm
```

---

## 📊 Flujo de Datos

```
User Request → Next.js Page/API Route → lib/server/db.ts → @dbt-ui/core → sql.js → SQLite Database
```

---

Built with ❤️ for the dbt community
