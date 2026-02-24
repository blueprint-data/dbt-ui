"use client";

import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/app-shell";
import { MobileFilters } from "@/components/mobile-filters";
import { ModelsTable } from "@/components/models-table";
import { Pagination } from "@/components/pagination";
import { fetchModels } from "@/lib/api";
import { Database, GitBranch, RefreshCw } from "lucide-react";
import { StatCard } from "@/components/stat-card";
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const loadModels = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const offset = (currentPage - 1) * ITEMS_PER_PAGE;
      const response = await fetchModels(ITEMS_PER_PAGE, offset, filters);
      setModels(response.items);
      setFacets(response.facets);
      setTotal(response.total);
    } catch (err) {
      console.error("Failed to load models:", err);
      setError("Failed to load models. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filters]);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

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
      <div className="p-6 md:p-8 max-w-[1600px] mx-auto bg-gradient-to-b from-[#f8fbff] via-[#eef5ff] to-[#e2ecff] dark:from-slate-900 dark:via-slate-950 dark:to-slate-900 rounded-3xl shadow-[0_32px_64px_-16px_rgba(14,165,233,0.1)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border border-white dark:border-white/5">
        <div className="flex flex-col gap-6 md:gap-8">
          {/* Dashboard Stats Header */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              title="data assets"
              value={total.toLocaleString()}
              statusText="Active Manifest"
              statusColor="bg-emerald-500"
              icon={<Database className="h-12 w-12" />}
              className="reveal-init animate-in-up stagger-1"
            />

            <StatCard
              title="test coverage"
              value="94.2"
              unit="%"
              statusText="Industrial Standard"
              statusColor="bg-blue-500"
              icon={<GitBranch className="h-12 w-12" />}
              className="reveal-init animate-in-up stagger-2"
            />

            <StatCard
              title="last analytics"
              value="2"
              unit="m ago"
              statusText="Live Syncing"
              statusColor="bg-violet-500"
              icon={<RefreshCw className="h-12 w-12" />}
              className="reveal-init animate-in-up stagger-3"
              pulse
            />
          </div>

          {/* Filters + Results Count (Popup global) */}
          <div className="flex items-center justify-between flex-wrap gap-3 reveal-init animate-in-up stagger-4">
            <div className="flex items-center gap-3">
              <MobileFilters
                facets={facets}
                filters={filters}
                onFiltersChange={handleFiltersChange}
              />
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground">Asset Discovery</span>
                <div className="text-xs text-muted-foreground font-mono">
                  {isLoading ? (
                    "UPDATING ASSETS..."
                  ) : (
                    <>
                      MATCHING:{" "}
                      <span className="font-bold text-sky-600 dark:text-sky-400">
                        {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, total)}-
                        {Math.min(currentPage * ITEMS_PER_PAGE, total)}
                      </span>{" "}
                      OF{" "}
                      <span className="font-bold text-foreground">
                        {total.toLocaleString()}
                      </span>
                    </>
                  )}
                </div>
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
          <div className="rounded-2xl glass overflow-hidden reveal-init animate-in-up stagger-5">
            <ModelsTable models={models} isLoading={isLoading} />
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
      </div>
    </AppShell>
  );
}
