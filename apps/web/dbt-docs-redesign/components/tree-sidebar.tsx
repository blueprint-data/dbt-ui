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
        "w-[340px] z-20 border-r flex flex-col h-full overflow-hidden",
        "bg-[var(--semantic-surface-muted)] border-[var(--semantic-border-subtle)]",
        className
      )}
    >
      {/* Search/Filter - Top Priority */}
      <div className="p-5 space-y-5 shrink-0 border-b border-[var(--semantic-border-subtle)] bg-[var(--semantic-surface-default)] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--semantic-text-body)] opacity-70 group-focus-within:opacity-100 transition-opacity" />
          <Input
            type="text"
            placeholder="Filter models..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="pl-10 pr-10 shadow-sm font-medium"
          />
          {filterQuery && (
            <button
              type="button"
              onClick={() => setFilterQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-[var(--semantic-text-body)] hover:bg-[var(--semantic-surface-muted)] transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Mode Toggle */}
        <div 
          className="flex p-1 rounded-xl shadow-[inset_0_1px_2px_rgba(0,0,0,0.04)]"
          style={{ background: 'var(--semantic-surface-muted)' }}
        >
          <button
            type="button"
            onClick={() => setMode("project")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all duration-300 z-10",
              mode === "project"
                ? "bg-[var(--semantic-surface-default)] text-[var(--brand-primary-500)] shadow-sm ring-1 ring-black/5 dark:ring-white/5"
                : "text-[var(--semantic-text-body)] hover:text-[var(--semantic-text-strong)] opacity-70 hover:opacity-100"
            )}
          >
            <FolderTree className={cn("h-4 w-4", mode === "project" ? "text-[var(--brand-primary-500)]" : "")} />
            Project
          </button>
          <button
            type="button"
            onClick={() => setMode("database")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 text-[11px] font-bold uppercase tracking-widest rounded-lg transition-all duration-300 z-10",
              mode === "database"
                ? "bg-[var(--semantic-surface-default)] text-[var(--brand-primary-500)] shadow-sm ring-1 ring-black/5 dark:ring-white/5"
                : "text-[var(--semantic-text-body)] hover:text-[var(--semantic-text-strong)] opacity-70 hover:opacity-100"
            )}
          >
            <Database className={cn("h-4 w-4", mode === "database" ? "text-[var(--brand-primary-500)]" : "")} />
            Database
          </button>
        </div>
      </div>

      {/* Breadcrumbs - Industrial style */}
      {selectedModelId && breadcrumbs.length > 0 && (
        <div className="px-4 py-3 border-b shrink-0" style={{ background: 'var(--semantic-surface-default)', borderColor: 'var(--semantic-border-subtle)' }}>
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[var(--semantic-text-body)] overflow-hidden whitespace-nowrap mask-linear-fade">
            {breadcrumbs.map((crumb, i) => (
              <div key={crumb.id} className="flex items-center gap-1.5 shrink-0">
                {i > 0 && <span className="opacity-40">/</span>}
                <span
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-md transition-all",
                    i === breadcrumbs.length - 1
                      ? "text-[var(--brand-primary-500)] shadow-sm bg-[var(--semantic-surface-muted)] border border-[var(--semantic-border-subtle)]"
                      : "hover:text-[var(--semantic-text-strong)] hover:bg-[var(--semantic-surface-muted)]"
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
      <div 
        className="p-4 border-t flex items-center justify-between shrink-0"
        style={{ background: 'var(--semantic-surface-default)', borderColor: 'var(--semantic-border-subtle)' }}
      >
        <div className="flex flex-col">
          <span className="text-[10px] font-bold text-[var(--semantic-text-body)] uppercase tracking-widest opacity-80">
            Total Assets
          </span>
          <span className="text-sm font-black text-[var(--semantic-text-strong)] leading-tight">
            {flatNodes.length}
          </span>
        </div>
        <div className="px-3 py-1.5 rounded bg-[var(--semantic-surface-muted)] border border-[var(--semantic-border-subtle)] text-[10px] font-bold uppercase tracking-wider text-[var(--semantic-text-body)] shadow-sm">
          {mode}
        </div>
      </div>
    </aside>
  );
}
