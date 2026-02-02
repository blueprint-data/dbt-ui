"use client";

import React from "react"

import { ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { Facets, FiltersState, ResourceType, Materialization } from "@/lib/types";
import { cn } from "@/lib/utils";

interface FiltersSidebarProps {
  facets: Facets;
  filters: FiltersState;
  onFiltersChange: (filters: FiltersState) => void;
  className?: string;
}

export function FiltersSidebar({
  facets,
  filters,
  onFiltersChange,
  className,
}: FiltersSidebarProps) {
  const hasActiveFilters =
    filters.tags.length > 0 ||
    filters.schemas.length > 0 ||
    filters.packages.length > 0 ||
    filters.resourceType ||
    filters.materializations.length > 0;

  const clearAllFilters = () => {
    onFiltersChange({
      tags: [],
      schemas: [],
      packages: [],
      resourceType: undefined,
      materializations: [],
    });
  };

  const toggleMultiSelect = (
    key: "tags" | "schemas" | "packages" | "materializations",
    value: string
  ) => {
    const current = filters[key] as string[];
    const updated = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFiltersChange({ ...filters, [key]: updated });
  };

  const setResourceType = (type: ResourceType | undefined) => {
    onFiltersChange({ ...filters, resourceType: type });
  };

  return (
    <aside className={cn("w-full", className)}>
      <div className="space-y-4 p-4 bg-white/95 text-slate-900 border border-slate-200 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm text-slate-900">Filters</h2>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-7 text-xs text-slate-600 hover:text-slate-900"
            >
              Clear all
            </Button>
          )}
        </div>

        {/* Resource Type - Single Select */}
        <FilterSection title="Resource Type" defaultOpen>
          <div className="space-y-1">
            {(["model", "seed", "snapshot"] as ResourceType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() =>
                  setResourceType(filters.resourceType === type ? undefined : type)
                }
                className={cn(
                   "w-full flex items-center justify-between px-3 py-1.5 rounded text-sm transition-colors border",
                   filters.resourceType === type
                     ? "bg-sky-100 text-sky-900 border-sky-200"
                     : "hover:bg-slate-100 text-slate-800 border-slate-200"
                 )}
               >
                 <span className="capitalize">{type}</span>
              </button>
            ))}
          </div>
        </FilterSection>

        {/* Tags - Multi Select */}
        <FilterSection
          title="Tags"
          count={filters.tags.length}
          defaultOpen={filters.tags.length > 0}
        >
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {facets.tags.map((tag) => (
              <FilterCheckbox
                key={tag}
                label={tag}
                checked={filters.tags.includes(tag)}
                onChange={() => toggleMultiSelect("tags", tag)}
              />
            ))}
          </div>
        </FilterSection>

        {/* Schema - Multi Select */}
        <FilterSection
          title="Schema"
          count={filters.schemas.length}
          defaultOpen={filters.schemas.length > 0}
        >
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {facets.schemas.map((schema) => (
              <FilterCheckbox
                key={schema}
                label={schema}
                checked={filters.schemas.includes(schema)}
                onChange={() => toggleMultiSelect("schemas", schema)}
              />
            ))}
          </div>
        </FilterSection>

        {/* Package - Multi Select */}
        <FilterSection
          title="Package"
          count={filters.packages.length}
          defaultOpen={filters.packages.length > 0}
        >
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {facets.packages.map((pkg) => (
              <FilterCheckbox
                key={pkg}
                label={pkg}
                checked={filters.packages.includes(pkg)}
                onChange={() => toggleMultiSelect("packages", pkg)}
              />
            ))}
          </div>
        </FilterSection>

        {/* Materialization - Multi Select */}
        <FilterSection
          title="Materialization"
          count={filters.materializations.length}
          defaultOpen={filters.materializations.length > 0}
        >
          <div className="space-y-1">
            {facets.materializations.map((mat) => (
              <FilterCheckbox
                key={mat}
                label={mat}
                checked={filters.materializations.includes(mat)}
                onChange={() => toggleMultiSelect("materializations", mat as Materialization)}
              />
            ))}
          </div>
        </FilterSection>

        {/* Active Filters Display */}
        {hasActiveFilters && (
            <div className="pt-4 border-t border-slate-200">
              <div className="text-xs font-medium text-slate-600 mb-2">
                Active Filters
              </div>
              <div className="flex flex-wrap gap-1">
                {filters.resourceType && (
                  <Badge
                    variant="secondary"
                    className="text-xs gap-1 pr-1 bg-sky-100 text-sky-800 border border-sky-200"
                  >
                    {filters.resourceType}
                    <button
                    type="button"
                    onClick={() => setResourceType(undefined)}
                    className="hover:bg-muted-foreground/20 rounded"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs gap-1 pr-1 bg-sky-100 text-sky-800 border border-sky-200">
                  {tag}
                  <button
                    type="button"
                    onClick={() => toggleMultiSelect("tags", tag)}
                    className="hover:bg-muted-foreground/20 rounded"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {filters.schemas.map((schema) => (
                <Badge key={schema} variant="secondary" className="text-xs gap-1 pr-1 bg-sky-100 text-sky-800 border border-sky-200">
                  {schema}
                  <button
                    type="button"
                    onClick={() => toggleMultiSelect("schemas", schema)}
                    className="hover:bg-muted-foreground/20 rounded"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {filters.packages.map((pkg) => (
                <Badge key={pkg} variant="secondary" className="text-xs gap-1 pr-1 bg-sky-100 text-sky-800 border border-sky-200">
                  {pkg}
                  <button
                    type="button"
                    onClick={() => toggleMultiSelect("packages", pkg)}
                    className="hover:bg-muted-foreground/20 rounded"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {filters.materializations.map((mat) => (
                <Badge key={mat} variant="secondary" className="text-xs gap-1 pr-1 bg-sky-100 text-sky-800 border border-sky-200">
                  {mat}
                  <button
                    type="button"
                    onClick={() => toggleMultiSelect("materializations", mat)}
                    className="hover:bg-muted-foreground/20 rounded"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

function FilterSection({
  title,
  count,
  defaultOpen = false,
  children,
}: {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Collapsible defaultOpen={defaultOpen}>
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium text-slate-900 hover:text-sky-700 transition-colors group">
        <span className="flex items-center gap-2">
          {title}
          {count !== undefined && count > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs bg-slate-100 text-slate-700 border border-slate-200">
              {count}
            </Badge>
          )}
        </span>
        <ChevronDown className="h-4 w-4 text-slate-400 group-data-[state=open]:rotate-180 transition-transform" />
      </CollapsibleTrigger>
      <CollapsibleContent className="pb-2">{children}</CollapsibleContent>
    </Collapsible>
  );
}

function FilterCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={cn(
        "w-full flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors text-left border",
        checked ? "bg-sky-100 text-sky-900 border-sky-200" : "hover:bg-slate-100 text-slate-700 border-slate-200"
      )}
    >
      <div
        className={cn(
          "h-4 w-4 rounded border flex items-center justify-center transition-colors",
          checked
            ? "bg-sky-500 border-sky-500 text-white"
            : "border-slate-300"
        )}
      >
        {checked && (
          <svg
            className="h-3 w-3 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={3}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </div>
      <span className="flex-1 truncate">{label}</span>
    </button>
  );
}
