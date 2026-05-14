"use client";

import { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Facets, FiltersState, ResourceType } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ExplorerFiltersProps {
  facets: Facets;
  filters: FiltersState;
  onFiltersChange: (filters: FiltersState) => void;
  className?: string;
}

const RESOURCE_TYPES: ResourceType[] = ["model", "seed", "snapshot"];
const ALL_VALUE = "__all__";

export function ExplorerFilters({
  facets,
  filters,
  onFiltersChange,
  className,
}: ExplorerFiltersProps) {
  const hasActiveFilters =
    filters.tags.length > 0 ||
    filters.schemas.length > 0 ||
    filters.packages.length > 0 ||
    Boolean(filters.resourceType) ||
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

  const toggleMulti = (
    key: "tags" | "schemas" | "packages" | "materializations",
    value: string
  ) => {
    const current = filters[key] as string[];
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    onFiltersChange({ ...filters, [key]: next });
  };

  return (
    <div
      className={cn(
        "flex flex-wrap items-end gap-2 gap-y-3",
        className,
      )}
    >
      <div className="flex flex-col gap-1.5 min-w-0">
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Type
        </span>
        <Select
          value={filters.resourceType ?? ALL_VALUE}
          onValueChange={(v) =>
            onFiltersChange({
              ...filters,
              resourceType: v === ALL_VALUE ? undefined : (v as ResourceType),
            })
          }
        >
          <SelectTrigger
            size="sm"
            className="h-9 w-[min(100%,9.5rem)] min-w-[7.5rem] bg-white/60 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700"
          >
            <SelectValue placeholder="All types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>All types</SelectItem>
            {RESOURCE_TYPES.map((t) => (
              <SelectItem key={t} value={t} className="capitalize">
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <MultiSelectPopover
        label="Tags"
        options={facets.tags ?? []}
        selected={filters.tags}
        onToggle={(v) => toggleMulti("tags", v)}
      />
      <MultiSelectPopover
        label="Schema"
        options={facets.schemas ?? []}
        selected={filters.schemas}
        onToggle={(v) => toggleMulti("schemas", v)}
      />
      <MultiSelectPopover
        label="Package"
        options={facets.packages ?? []}
        selected={filters.packages}
        onToggle={(v) => toggleMulti("packages", v)}
      />
      <MultiSelectPopover
        label="Materialization"
        options={(facets.materializations ?? []) as string[]}
        selected={filters.materializations as string[]}
        onToggle={(v) => toggleMulti("materializations", v)}
      />

      {hasActiveFilters && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-9 text-xs text-muted-foreground hover:text-foreground"
          onClick={clearAllFilters}
        >
          <X className="size-3.5" />
          Clear all
        </Button>
      )}
    </div>
  );
}

function MultiSelectPopover({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const n = selected.length;

  return (
    <div className="flex flex-col gap-1.5 min-w-0">
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-9 min-w-[7rem] max-w-[11rem] justify-between gap-1.5 font-normal bg-white/60 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700 px-2.5"
            aria-label={`${label} filter${n ? `, ${n} selected` : ""}`}
          >
            <span className="truncate text-left">
              {n === 0
                ? `All ${label.toLowerCase()}`
                : `${n} selected`}
            </span>
            <div className="flex items-center gap-0.5 shrink-0">
              {n > 0 && (
                <Badge
                  variant="secondary"
                  className="h-5 min-w-5 px-1 text-[10px] font-mono"
                >
                  {n}
                </Badge>
              )}
              <ChevronDown className="size-3.5 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="w-72 p-0"
          align="start"
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div className="border-b border-border px-2 py-1.5 text-xs font-medium text-muted-foreground">
            {label}
          </div>
          <div className="max-h-60 overflow-y-auto p-2 custom-scrollbar">
            {options.length === 0 ? (
              <p className="px-1 py-2 text-sm text-muted-foreground">
                No options in current results
              </p>
            ) : (
              <ul className="space-y-0.5">
                {options.map((opt) => {
                  const isOn = selected.includes(opt);
                  return (
                    <li key={opt}>
                      <label
                        className={cn(
                          "flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm hover:bg-muted/80",
                        )}
                      >
                        <Checkbox
                          checked={isOn}
                          onCheckedChange={() => onToggle(opt)}
                        />
                        <span className="min-w-0 flex-1 truncate">
                          {opt}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
