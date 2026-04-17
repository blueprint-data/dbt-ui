# 🚀 dbt-ui: Modern dbt Documentation

**dbt-ui** is a high-performance, modern alternative to the standard `dbt docs`. It uses WebAssembly and SQLite to provide a smooth, instant-search experience for your dbt projects.

## 🏁 Quick Start (After Installing from npm)

### Step 1: Install dbt-ui globally

```bash
npm install -g dbt-ui
```

### Step 2: In your dbt project, generate the docs

Navigate to your dbt project root (where `dbt_project.yml` lives):

```bash
cd /path/to/your/dbt/project

# First, make sure you have a manifest.json
dbt docs generate

# Then generate the dbt-ui database
dbt-ui generate
```

This creates `target/dbt_ui.sqlite` from your `target/manifest.json`.

### Step 3: Start the documentation server

```bash
dbt-ui serve
```

Open [http://localhost:3000](http://localhost:3000) in your browser 🎉

---

## 📋 Complete Command Reference

### `dbt-ui generate`

Generates the SQLite database from your dbt manifest.

```bash
# Default: reads target/manifest.json, outputs target/dbt_ui.sqlite
dbt-ui generate

# Custom manifest location
dbt-ui generate --manifest ./custom/path/manifest.json

# Custom output location
dbt-ui generate --out ./docs/project_data.sqlite

# Both custom paths
dbt-ui generate --manifest ./artifacts/manifest.json --out ./docs/data.sqlite
```

### `dbt-ui serve`

Starts the documentation web server.

```bash
# Default: uses target/dbt_ui.sqlite on port 3000
dbt-ui serve

# Custom database path
dbt-ui serve --db ./docs/project_data.sqlite

# Custom port
dbt-ui serve --port 8080

# Both options
dbt-ui serve --db ./my_project.sqlite --port 9000
```

---

## 🔄 Typical Workflow

```bash
# 1. Navigate to your dbt project
cd ~/projects/my-dbt-project

# 2. Run dbt to generate the manifest
dbt docs generate

# 3. Generate the dbt-ui database
dbt-ui generate

# 4. Start the server
dbt-ui serve

# 5. Open http://localhost:3000 in your browser
```

---

## ✨ Why use dbt-ui?

| Feature | dbt-ui | Standard dbt Docs |
| :--- | :--- | :--- |
| **Search Speed** | Instant (SQLite FTS5) | Slow on large projects |
| **Load Time** | Milliseconds | Seconds (loads huge JSONs) |
| **UI Aesthetics** | Modern, Dark Mode, Minimalist | Classic dbt look |
| **Lineage** | High-performance graph | Can be laggy in big DAGs |
| **Portability** | Single `.sqlite` file | Multiple JSON files |

---

## 🛠️ Advanced Usage

### Use with npx (no global install)

If you don't want to install globally, you can use `npx`:

```bash
npx dbt-ui generate
npx dbt-ui serve
```

### CI/CD Integration

You can run dbt-ui in your CI/CD pipeline:

```yaml
# Example GitHub Actions step
- name: Generate dbt-ui docs
  run: |
    npm install -g dbt-ui
    dbt-ui generate --manifest ./target/manifest.json
    # Upload target/dbt_ui.sqlite as artifact or deploy
```

### Using with Docker

If you're deploying with Docker, you can include dbt-ui in your Dockerfile:

```dockerfile
# Install Node.js and dbt-ui
RUN npm install -g dbt-ui

# Generate and serve
COPY ./target/manifest.json /app/target/
RUN dbt-ui generate
CMD ["dbt-ui", "serve", "--port", "8080"]
```

---

## ❓ FAQ

**Does it work with my warehouse (BigQuery/Snowflake/Redshift)?**
Yes! `dbt-ui` works by parsing the dbt `manifest.json`, so it is warehouse-agnostic.

**Do I need Node.js installed?**
Yes, you need Node.js (v18+) and npm.

**What version of dbt is supported?**
dbt-ui works with any dbt version that produces a v6+ manifest.json (dbt 1.0+).

**Can I deploy it as a static site?**
The server is required for API endpoints. For static hosting, a future version may support static export.

**How big is the package?**
The npm package is approximately 330MB (includes Next.js runtime, React, and the pre-built web application).

---

## 🐛 Troubleshooting

### "Manifest not found" error
Make sure you're in your dbt project root and have run `dbt docs generate` first.

```bash
# Check that manifest exists
ls target/manifest.json

# If not, generate it
dbt docs generate
```

### "SQLite not found" error
Run `dbt-ui generate` before `dbt-ui serve`:

```bash
dbt-ui generate
dbt-ui serve
```

### Port already in use
Use a different port:

```bash
dbt-ui serve --port 3001
```

---

## 📦 What's in the Package

When you install dbt-ui, you get:
- **CLI tool** (`dbt-ui`) with `generate` and `serve` commands
- **Pre-built web application** with modern UI
- **sql.js** for generating SQLite databases from manifest.json
- **Next.js runtime** for serving the web application

---

## 🚀 Getting Help

- **GitHub Issues**: Report bugs or request features
- **Documentation**: This guide and the README.md
- **Examples**: Check the examples/ directory in the repository

Happy documenting! 📚
