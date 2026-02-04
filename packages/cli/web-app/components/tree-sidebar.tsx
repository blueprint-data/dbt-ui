"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Search,
  X,
  ChevronRight,
  Locate,
  FolderTree,
  Database,
  Package,
  Table2,
  FileCode,
  GitBranch,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { VirtualTree } from "@/components/virtual-tree";
import { useTreeNavigation } from "@/hooks/use-tree-navigation";
import { cn } from "@/lib/utils";
import { DatabaseTree } from "@/components/database-tree";
import type { TreeMode, ModelSummary } from "@/lib/types";

interface TreeSidebarProps {
  selectedModelId: string | null;
  className?: string;
}

export function TreeSidebar({ selectedModelId, className }: TreeSidebarProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(400);
  const [scrollToIndex, setScrollToIndex] = useState<number | undefined>(undefined);

  const {
    mode,
    setMode,
    flatNodes,
    filterQuery,
    setFilterQuery,
    isLoading,
    breadcrumbs,
    miniMapPosition,
    toggleNode,
    expandNode,
    collapseNode,
    revealSelected,
    matchingIds,
  } = useTreeNavigation(selectedModelId);

  // Calculate container height using ResizeObserver for precision
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Handle model selection
  const handleSelect = (modelId: string) => {
    router.push(`/model/${encodeURIComponent(modelId)}`);
  };

  // Handle reveal in tree
  const handleReveal = () => {
    const index = revealSelected();
    if (index >= 0) {
      setScrollToIndex(index);
      // Reset after animation
      setTimeout(() => setScrollToIndex(undefined), 100);
    }
  };

  const getBreadcrumbIcon = (type: string) => {
    switch (type) {
      case "package":
        return <Package className="h-3 w-3" />;
      case "database":
        return <Database className="h-3 w-3" />;
      case "schema":
        return <Table2 className="h-3 w-3" />;
      case "folder":
        return <FolderTree className="h-3 w-3" />;
      case "model":
        return <FileCode className="h-3 w-3" />;
      default:
        return <ChevronRight className="h-3 w-3" />;
    }
  };

  return (
    <aside
      className={cn(
        "w-[340px] z-20 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full bg-gradient-to-b from-white via-white to-slate-50 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900 overflow-hidden",
        className
      )}
    >
      {/* Search/Filter - Top Priority */}
      <div className="p-4 space-y-4 shrink-0">
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
          <Input
            type="text"
            placeholder="Filter models..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="pl-10 pr-10 h-10 bg-slate-50 dark:bg-slate-900 border-transparent dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-sky-500/10 focus-visible:bg-white dark:focus-visible:bg-slate-800 rounded-xl transition-all shadow-sm group-hover:bg-white dark:group-hover:bg-slate-800 group-hover:shadow-[0_2px_8px_rgba(0,0,0,0.02)]"
          />
          {filterQuery && (
            <button
              type="button"
              onClick={() => setFilterQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Mode Toggle */}
        <div className="flex p-1 bg-slate-100/80 dark:bg-slate-900/80 rounded-xl border border-slate-200/50 dark:border-slate-800/50 relative isolate">
          <button
            type="button"
            onClick={() => setMode("project")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all duration-300 z-10",
              mode === "project"
                ? "bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm ring-1 ring-black/5 dark:ring-white/5"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50"
            )}
          >
            <FolderTree className={cn("h-3.5 w-3.5", mode === "project" ? "text-sky-500" : "text-slate-400")} />
            Project
          </button>
          <button
            type="button"
            onClick={() => setMode("database")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all duration-300 z-10",
              mode === "database"
                ? "bg-white dark:bg-slate-800 text-sky-600 dark:text-sky-400 shadow-sm ring-1 ring-black/5 dark:ring-white/5"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50"
            )}
          >
            <Database className={cn("h-3.5 w-3.5", mode === "database" ? "text-sky-500" : "text-slate-400")} />
            Database
          </button>
        </div>
      </div>

      {/* Breadcrumbs - Industrial style */}
      {selectedModelId && breadcrumbs.length > 0 && (
        <div className="px-4 py-3 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 overflow-hidden whitespace-nowrap mask-linear-fade">
            {breadcrumbs.map((crumb, i) => (
              <div key={crumb.id} className="flex items-center gap-1.5 shrink-0">
                {i > 0 && <span className="text-slate-300">/</span>}
                <span
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-md transition-all",
                    i === breadcrumbs.length - 1
                      ? "bg-sky-50 dark:bg-sky-900/20 text-sky-700 dark:text-sky-400 border border-sky-100 dark:border-sky-900/50 shadow-sm"
                      : "hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-900/50"
                  )}
                >
                  {getBreadcrumbIcon(crumb.type)}
                  <span className="truncate max-w-[150px]">{crumb.label}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tree container */}
      <div className="flex-1 relative overflow-hidden group" ref={containerRef}>
        {mode === "database" ? (
          <DatabaseTree selectedModelId={selectedModelId} className="h-full" />
        ) : isLoading ? (
          <div className="p-4 space-y-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-3 w-3 rounded-sm opacity-20" />
                <Skeleton className="h-3 flex-1 rounded-sm opacity-20" style={{ width: `${60 + (i * 7) % 35}%` }} />
              </div>
            ))}
          </div>
        ) : (
          <>
            <VirtualTree
              nodes={flatNodes}
              onToggle={toggleNode}
              onSelect={handleSelect}
              onExpand={expandNode}
              onCollapse={collapseNode}
              height={containerHeight}
              scrollToIndex={scrollToIndex}
              highlightIds={matchingIds}
            />

            {/* Premium Mini-map indicator */}
            {miniMapPosition !== null && flatNodes.length > 20 && (
              <div className="absolute right-1 top-2 bottom-2 w-1 transition-opacity">
                <div className="relative h-full bg-slate-200/50 rounded-full overflow-hidden">
                  <div
                    className="absolute w-full bg-sky-500/40 rounded-full shadow-[0_0_10px_rgba(14,165,233,0.3)] transition-all duration-300 ease-out"
                    style={{
                      top: `${miniMapPosition}%`,
                      height: `${Math.max(4, 100 / (flatNodes.length / 10))}%`,
                      transform: "translateY(-50%)"
                    }}
                  />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer - Asset Count */}
      <div className="p-4 border-t border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm flex items-center justify-between shrink-0">
        <div className="flex flex-col">
          <span className="text-[9px] font-mono text-slate-400 dark:text-slate-500 uppercase font-bold tracking-widest">
            Total Assets
          </span>
          <span className="text-xs font-black text-slate-700 dark:text-slate-300">
            {flatNodes.length}
          </span>
        </div>
        <div className="px-2 py-1 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded text-[9px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {mode}
        </div>
      </div>
    </aside>
  );
}
