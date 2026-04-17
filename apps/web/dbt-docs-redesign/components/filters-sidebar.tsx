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
      <div className="space-y-4 p-5 bp-card shadow-xl ring-1 ring-black/5 dark:ring-white/5">
        <div className="flex items-center justify-between border-b border-[var(--semantic-border-subtle)] pb-3">
          <h2 className="font-bold text-[11px] text-[var(--semantic-text-strong)] uppercase tracking-widest opacity-80">Filters</h2>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="text-[10px] font-bold uppercase tracking-wider text-[var(--semantic-text-body)] hover:text-[var(--brand-primary-500)] transition-colors"
            >
              Clear all
            </button>
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
                  "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all shadow-none outline-none mb-1 border border-transparent",
                  filters.resourceType === type
                    ? "bg-[rgba(81,81,243,0.1)] text-[var(--brand-primary-500)] font-bold ring-1 ring-[var(--brand-primary-500)]/30 shadow-sm"
                    : "hover:bg-[var(--semantic-surface-muted)] text-[var(--semantic-text-body)] hover:text-[var(--semantic-text-strong)]"
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
            {(facets.tags || []).map((tag) => (
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
            {(facets.schemas || []).map((schema) => (
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
            {(facets.packages || []).map((pkg) => (
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
            {(facets.materializations || []).map((mat) => (
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
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="text-xs font-medium text-muted-foreground mb-2">
              Active Filters
            </div>
            <div className="flex flex-wrap gap-1">
              {filters.resourceType && (
                <Badge
                  variant="secondary"
                  className="text-xs gap-1 pr-1 bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-400 border border-sky-200 dark:border-sky-800"
                >
                  {filters.resourceType}
                  <button
                    type="button"
                    onClick={() => setResourceType(undefined)}
                    className="hover:bg-sky-200 dark:hover:bg-sky-800 rounded transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              )}
              {filters.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs gap-1 pr-1 bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
                  {tag}
                  <button
                    type="button"
                    onClick={() => toggleMultiSelect("tags", tag)}
                    className="hover:bg-sky-200 dark:hover:bg-sky-800 rounded transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {filters.schemas.map((schema) => (
                <Badge key={schema} variant="secondary" className="text-xs gap-1 pr-1 bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
                  {schema}
                  <button
                    type="button"
                    onClick={() => toggleMultiSelect("schemas", schema)}
                    className="hover:bg-sky-200 dark:hover:bg-sky-800 rounded transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {filters.packages.map((pkg) => (
                <Badge key={pkg} variant="secondary" className="text-xs gap-1 pr-1 bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
                  {pkg}
                  <button
                    type="button"
                    onClick={() => toggleMultiSelect("packages", pkg)}
                    className="hover:bg-sky-200 dark:hover:bg-sky-800 rounded transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {filters.materializations.map((mat) => (
                <Badge key={mat} variant="secondary" className="text-xs gap-1 pr-1 bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-400 border border-sky-200 dark:border-sky-800">
                  {mat}
                  <button
                    type="button"
                    onClick={() => toggleMultiSelect("materializations", mat)}
                    className="hover:bg-sky-200 dark:hover:bg-sky-800 rounded transition-colors"
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
      <CollapsibleTrigger className="flex items-center justify-between w-full py-2 text-sm font-medium text-foreground hover:text-sky-700 dark:hover:text-sky-400 transition-colors group">
        <span className="flex items-center gap-2">
          {title}
          {count !== undefined && count > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {count}
            </Badge>
          )}
        </span>
        <ChevronDown className="h-4 w-4 text-muted-foreground group-data-[state=open]:rotate-180 transition-transform" />
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
        "w-full flex items-center gap-3 px-3 py-1.5 rounded-lg text-[13px] transition-all text-left outline-none mb-0.5 border border-transparent shadow-none",
        checked 
          ? "bg-[rgba(81,81,243,0.05)] text-[var(--brand-primary-500)] font-medium" 
          : "hover:bg-[var(--semantic-surface-muted)] text-[var(--semantic-text-body)] hover:text-[var(--semantic-text-strong)]"
      )}
    >
      <div
        className={cn(
          "h-3.5 w-3.5 rounded-[4px] border flex items-center justify-center transition-all shrink-0 shadow-sm",
          checked
            ? "bg-[var(--brand-primary-500)] border-[var(--brand-primary-500)] text-white shadow-md shadow-[var(--brand-primary-500)]/20"
            : "border-[var(--semantic-border-subtle)] bg-[var(--semantic-surface-default)]"
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
