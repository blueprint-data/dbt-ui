"use client";

import { useState } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { FiltersSidebar } from "./filters-sidebar";
import type { Facets, FiltersState } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

interface MobileFiltersProps {
  facets: Facets;
  filters: FiltersState;
  onFiltersChange: (filters: FiltersState) => void;
}

export function MobileFilters({
  facets,
  filters,
  onFiltersChange,
}: MobileFiltersProps) {
  const [open, setOpen] = useState(false);

  const activeFilterCount =
    filters.tags.length +
    filters.schemas.length +
    filters.packages.length +
    filters.materializations.length +
    (filters.resourceType ? 1 : 0);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 bg-transparent">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-xs">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[320px] max-w-full p-0 bg-white text-slate-900 border-slate-200">
        <SheetHeader className="px-6 py-4 border-b border-slate-200">
          <SheetTitle className="flex items-center justify-between">
            Filters
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setOpen(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </SheetTitle>
        </SheetHeader>
        <div className="px-6 py-4 overflow-y-auto h-[calc(100vh-80px)]">
          <FiltersSidebar
            facets={facets}
            filters={filters}
            onFiltersChange={onFiltersChange}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
