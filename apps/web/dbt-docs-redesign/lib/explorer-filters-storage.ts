import type {
  FiltersState,
  Materialization,
  ResourceType,
} from "@/lib/types";

const STORAGE_KEY = "dbt-ui:explorer:filters";

const RESOURCE_TYPES: ReadonlySet<ResourceType> = new Set([
  "model",
  "seed",
  "snapshot",
  "source",
]);

const MATERIALIZATIONS: ReadonlySet<Materialization> = new Set([
  "table",
  "view",
  "incremental",
  "ephemeral",
  "source",
]);

function isStringArray(x: unknown): x is string[] {
  return Array.isArray(x) && x.every((i) => typeof i === "string");
}

function isResourceType(x: unknown): x is ResourceType {
  return typeof x === "string" && RESOURCE_TYPES.has(x as ResourceType);
}

function isMaterializationArray(x: unknown): x is Materialization[] {
  if (!isStringArray(x)) return false;
  return (x as string[]).every((s) => MATERIALIZATIONS.has(s as Materialization));
}

/**
 * Returns parsed filters, or `null` if missing, invalid, or not in the browser.
 */
export function readPersistedExplorerFilters(): FiltersState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null) return null;
    const data = JSON.parse(raw) as unknown;
    if (data == null || typeof data !== "object" || Array.isArray(data)) {
      return null;
    }
    const o = data as Record<string, unknown>;
    if (
      !isStringArray(o.tags) ||
      !isStringArray(o.schemas) ||
      !isStringArray(o.packages)
    ) {
      return null;
    }
    if (o.resourceType != null && !isResourceType(o.resourceType)) {
      return null;
    }
    if (o.materializations != null && !isMaterializationArray(o.materializations)) {
      return null;
    }

    const resourceType: ResourceType | undefined =
      o.resourceType == null ? undefined : (o.resourceType as ResourceType);

    return {
      tags: o.tags,
      schemas: o.schemas,
      packages: o.packages,
      resourceType,
      materializations: o.materializations ?? [],
    };
  } catch {
    return null;
  }
}

export function writePersistedExplorerFilters(filters: FiltersState): void {
  if (typeof window === "undefined") return;
  try {
    const payload: FiltersState = {
      tags: filters.tags,
      schemas: filters.schemas,
      packages: filters.packages,
      resourceType: filters.resourceType,
      materializations: filters.materializations,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Quota, private mode, etc.
  }
}
