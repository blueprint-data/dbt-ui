import type {
  ModelsResponse,
  ModelDetail,
  SearchResponse,
  LineageResponse,
  FiltersState,
} from "./types";
import {
  getMockModels,
  getMockFacets,
  getMockModelById,
  getMockLineage,
  searchMockModels,
} from "./mock-data";

// Toggle this to switch between mock and real API
const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

// Simulate network delay for realistic UX
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchModels(
  limit: number = 20,
  offset: number = 0,
  filters: FiltersState = {
    tags: [],
    schemas: [],
    packages: [],
    materializations: [],
  }
): Promise<ModelsResponse> {
  if (USE_MOCK_API) {
    await delay(300);

    let models = getMockModels();

    // Apply filters
    if (filters.tags.length > 0) {
      models = models.filter((m) =>
        filters.tags.some((tag) => m.tags.includes(tag))
      );
    }
    if (filters.schemas.length > 0) {
      models = models.filter((m) => filters.schemas.includes(m.schema));
    }
    if (filters.packages.length > 0) {
      models = models.filter((m) => filters.packages.includes(m.package_name));
    }
    if (filters.resourceType) {
      models = models.filter((m) => m.resource_type === filters.resourceType);
    }
    if (filters.materializations.length > 0) {
      models = models.filter((m) =>
        filters.materializations.includes(m.materialization)
      );
    }

    const total = models.length;
    const items = models.slice(offset, offset + limit);
    const facets = getMockFacets();

    return { total, items, facets };
  }

  // Real API call
  const params = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
    filters: JSON.stringify(filters),
  });

  const response = await fetch(`/api/models?${params}`);
  if (!response.ok) throw new Error("Failed to fetch models");
  return response.json();
}

export async function fetchModelById(id: string): Promise<ModelDetail | null> {
  if (USE_MOCK_API) {
    await delay(200);
    return getMockModelById(id);
  }

  const response = await fetch(`/api/models/${encodeURIComponent(id)}`);
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error("Failed to fetch model");
  }
  return response.json();
}

export async function searchModels(
  query: string,
  limit: number = 10,
  filters?: FiltersState
): Promise<SearchResponse> {
  if (USE_MOCK_API) {
    await delay(150);
    return searchMockModels(query, limit);
  }

  const params = new URLSearchParams({
    q: query,
    limit: limit.toString(),
  });
  if (filters) {
    params.set("filters", JSON.stringify(filters));
  }

  const response = await fetch(`/api/search?${params}`);
  if (!response.ok) throw new Error("Failed to search");
  return response.json();
}

export async function fetchLineage(
  id: string,
  depth: number = 1
): Promise<LineageResponse> {
  if (USE_MOCK_API) {
    await delay(200);
    return getMockLineage(id, depth);
  }

  const params = new URLSearchParams({ depth: depth.toString() });
  const response = await fetch(
    `/api/lineage/${encodeURIComponent(id)}?${params}`
  );
  if (!response.ok) throw new Error("Failed to fetch lineage");
  return response.json();
}
