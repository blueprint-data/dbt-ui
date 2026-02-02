"use client";

import { useState, useEffect, useCallback } from "react";
import { AppShell } from "@/components/app-shell";
import { MobileFilters } from "@/components/mobile-filters";
import { ModelsTable } from "@/components/models-table";
import { Pagination } from "@/components/pagination";
import { fetchModels } from "@/lib/api";
import { Database, GitBranch, RefreshCw } from "lucide-react";
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
      <div className="p-6 md:p-8 max-w-[1600px] mx-auto animate-in-up bg-gradient-to-b from-[#f8fbff] via-[#eef5ff] to-[#e2ecff] rounded-3xl shadow-lg">
        <div className="flex flex-col gap-6 md:gap-8">
          {/* Dashboard Stats Header */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl flex flex-col gap-2 relative overflow-hidden group bg-white/80 border border-sky-100 shadow-sm">
              <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity text-sky-300">
                <Database className="h-12 w-12" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-600/80">data assets</span>
              <span className="text-3xl font-black tracking-tight text-slate-900">{total.toLocaleString()}</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_oklch(var(--emerald-500))]" />
                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Active Manifest</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl flex flex-col gap-2 relative overflow-hidden group bg-white/80 border border-sky-100 shadow-sm">
              <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity text-sky-300">
                <GitBranch className="h-12 w-12" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-600/80">test coverage</span>
              <span className="text-3xl font-black tracking-tight text-slate-900">94.2<span className="text-lg text-slate-500">%</span></span>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Industrial Standard</span>
              </div>
            </div>

            <div className="p-5 rounded-2xl flex flex-col gap-2 relative overflow-hidden group bg-white/80 border border-sky-100 shadow-sm">
              <div className="absolute top-0 right-0 p-3 opacity-20 group-hover:opacity-40 transition-opacity text-sky-300">
                <RefreshCw className="h-12 w-12" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-600/80">last analytics</span>
              <span className="text-3xl font-black tracking-tight text-slate-900">2<span className="text-lg text-slate-500">m ago</span></span>
              <div className="flex items-center gap-2 mt-1">
                <div className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-pulse" />
                <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Live Syncing</span>
              </div>
            </div>
          </div>

          {/* Filters + Results Count (Popup global) */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <MobileFilters
                facets={facets}
                filters={filters}
                onFiltersChange={handleFiltersChange}
              />
              <div className="flex flex-col">
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">Asset Discovery</span>
                <div className="text-xs text-slate-600 font-mono">
                  {isLoading ? (
                    "UPDATING ASSETS..."
                  ) : (
                    <>
                      MATCHING:{" "}
                      <span className="font-bold text-sky-700">
                        {Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, total)}-
                        {Math.min(currentPage * ITEMS_PER_PAGE, total)}
                      </span>{" "}
                      OF{" "}
                      <span className="font-bold text-slate-800">
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
            <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              {error}
            </div>
          )}

          {/* Models Table */}
          <div className="rounded-2xl border border-sky-100 bg-white/90 backdrop-blur-sm overflow-hidden shadow-md">
            <ModelsTable models={models} isLoading={isLoading} />
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="py-4 border-t border-slate-200">
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
