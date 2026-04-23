"use client";

import { useState, useEffect, useLayoutEffect, useCallback, useRef } from "react";
import { AppShell } from "@/components/app-shell";
import { ExplorerFilters } from "@/components/explorer-filters";
import { ModelsTable } from "@/components/models-table";
import { Pagination } from "@/components/pagination";
import { fetchModels } from "@/lib/api";
import {
  readPersistedExplorerFilters,
  writePersistedExplorerFilters,
} from "@/lib/explorer-filters-storage";
import type { ModelSummary, Facets, FiltersState } from "@/lib/types";

const ITEMS_PER_PAGE = 20;

const defaultFilters: FiltersState = {
  tags: [],
  schemas: [],
  packages: [],
  resourceType: undefined,
  materializations: [],
};

const defaultFacets: Facets = {
  tags: [],
  schemas: [],
  packages: [],
  materializations: [],
};

export default function ExplorerPage() {
  const [models, setModels] = useState<ModelSummary[]>([]);
  const [facets, setFacets] = useState<Facets>(defaultFacets);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<FiltersState>(defaultFilters);
  /** False until we read `localStorage` in the client (avoids a fetch with defaults before rehydration). */
  const [filtersReady, setFiltersReady] = useState(false);
  /** True only while the first successful fetch is in progress (drives the full-table skeleton). */
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hasLoadedOnce = useRef(false);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  useLayoutEffect(() => {
    const stored = readPersistedExplorerFilters();
    if (stored) {
      setFilters(stored);
    }
    setFiltersReady(true);
  }, []);

  const loadModels = useCallback(async () => {
    if (!filtersReady) return;
    if (hasLoadedOnce.current) {
      setIsRefreshing(true);
    } else {
      setIsInitialLoading(true);
    }
    setError(null);

    try {
      const offset = (currentPage - 1) * ITEMS_PER_PAGE;
      const response = await fetchModels(ITEMS_PER_PAGE, offset, filters);
      setModels(response.items);
      setFacets(response.facets);
      setTotal(response.total);
      hasLoadedOnce.current = true;
    } catch (err) {
      console.error("Failed to load models:", err);
      setError("Failed to load models. Please try again.");
    } finally {
      setIsInitialLoading(false);
      setIsRefreshing(false);
    }
  }, [currentPage, filters, filtersReady]);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  useEffect(() => {
    if (!filtersReady) return;
    writePersistedExplorerFilters(filters);
  }, [filters, filtersReady]);

  // Reset to page 1 when filters change
  const handleFiltersChange = (newFilters: FiltersState) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  return (
    <AppShell
      totalModels={total}
      allModels={models}
      selectedModelId={null}
    >
      <div className="flex w-full min-w-0 max-w-[1600px] mx-auto flex-col gap-6 md:gap-8 p-6 md:p-8">
        {/* Inline filters + results count */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between reveal-init animate-in-up stagger-4">
          <ExplorerFilters
            facets={facets}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            className="flex-1"
          />
          <div className="shrink-0 self-start sm:self-auto">
            <div
              className={`text-xs font-bold text-muted-foreground font-mono bg-white/50 dark:bg-slate-800/50 px-3 py-1.5 rounded-md border border-slate-200 dark:border-slate-700${isRefreshing ? " opacity-70" : ""}`}
            >
              {isInitialLoading
                ? "Loading…"
                : `${total.toLocaleString()} assets`}
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm flex items-center gap-3 reveal-init animate-in-up">
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            {error}
          </div>
        )}

        {/* Models Table */}
        <div className="w-full min-w-0 rounded-2xl glass overflow-hidden reveal-init animate-in-up stagger-5">
          <ModelsTable
            models={models}
            isInitialLoading={isInitialLoading}
            isRefreshing={isRefreshing}
          />
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="py-4 border-t border-slate-200 dark:border-slate-800">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </div>
        )}
      </div>
    </AppShell>
  );
}
