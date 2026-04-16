# 🚀 Publishing Guide

Este documento describe cómo se distribuye `dbt-ui` como un paquete compilado (Standalone) a la registry global de NPM.

## Arquitectura de Publicación (CI/CD)

A diferencia de la ejecución tradicional en Node o el modo de desarrollo de Next.js, nuestro pipeline de publicación utiliza el enfoque de **Next.js Standalone**. 
El código del CLI de Node, junto al motor `@dbt-ui/core`, y los pre-compilados de la UI, se empacan juntos para garantizar la máxima portabilidad. El usuario final **no necesita tener React, PNPM, ni Next.js instalados**; el ejecutable es autocontenido.

> [!CAUTION]
> NUNCA ejecutes `npm publish` manualmente desde la consola local a menos que sea una urgencia crítica o un paquete de prueba (canary version). El pipeline de GitHub Actions se encarga de aislar el entorno, evitar conflictos con *symlinks locales* y firmar las subidas correctamente.

---

## 🔥 Configuración del Token (Por única vez)

Para que GitHub Actions tenga permisos para subir el paquete oficial (`@blueprint-data/dbt-ui`) al registry de NPM, debes inyectar una llave secreta.

1. Ingresá a [npmjs.com](https://www.npmjs.com) logueado con la cuenta propietaria del scope de la organización (`@blueprint-data`).
2. Dirigite a tu Avatar 👉 **Access Tokens**.
3. Seleccioná generar un nuevo **Automation Token**. *(Nota: Automation tokens sortean el requisito de 2FA interactivo indispensable para CI/CD).*
4. Copiá el Token gigante generado.
5. Andá al repositorio de GitHub, navegá por **Settings 👉 Secrets and variables 👉 Actions**.
6. Creá un **Repository Secret** llamado de forma exacta: `NPM_TOKEN`.
7. Pegá tu token y guardalo.

> [!TIP]
> Si el token algún día expira o fue revocado, los flujos de "Release" en Github Actions tirarán error de "401 Unauthorized" al intentar empaquetar y subir código, recordándote renovar el secret de GitHub.

---

## 📦 Flujo de Desarrollo y Publicación

Al utilizar [Changesets](https://github.com/changesets/changesets), el proceso del día a día para publicar un nuevo "feature" o parche es transparente.

### Paso 1: Declarar el Cambio
Cuando terminaste de codear un feature en una nueva rama:
```bash
pnpm run changeset
```
Seleccioná qué nivel semántico aplica al paquete (major, minor, o patch) y dejá un resumen de la nueva funcionalidad que se sumará al `CHANGELOG.md`.

### Paso 2: Pull Request normal
Hacele commit al archivo `.md` de changeset generado, subí tu rama, y mergeala a `main` normalmente luego de tus code-reviews.

### Paso 3: El Gran "Release PR"
Una vez que el commit del changeset llega a `main`, GitHub Actions detecta ese archivo y **abre (o actualiza) automáticamente un Release Pull Request** en tu repo (usualmente llamado *"Version Packages"*).

### Paso 4: Aprobación y Deploy 🚀
Cuando veas que el "Version Packages Pull Request" está listo y vos querés largar la versión oficial al público:
1. Das "Approve" y "Merge" al PR desde la UI de Github.
2. Automáticamente, el Action borra los `.md`, sube la versión del `package.json`, crea el tag de Git, **compila los 350 MB en modo Standalone**, y usa tu `NPM_TOKEN` para empujar la compilación al registro global.
3. Segundos después, cualquier Data Engineer del mundo podrá correr:
   ```bash
   npm install -g @blueprint-data/dbt-ui
   ```

## Resolución de Bugs Locales

Si se requiere testear el paquete empaquetado antes de publicarlo:
```bash
npm run build:all        # Ejecutará bash ./scripts/build-npm.sh en local
cd packages/cli
npm pack                 # Genera un archivo `.tgz` simulando a NPM
npm install -g ./paquete-generado-0.0.1.tgz
dbt-ui serve --manifest ./manifest.json
```
