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
import type { TreeMode, ModelSummary } from "@/lib/types";

interface TreeSidebarProps {
  selectedModelId: string | null;
  className?: string;
}

export function TreeSidebar({ selectedModelId, className }: TreeSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
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
    allModels,
  } = useTreeNavigation(selectedModelId);

  // Calculate container height
  useEffect(() => {
    function updateHeight() {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        // Leave some padding at bottom
        const available = window.innerHeight - rect.top - 24;
        setContainerHeight(Math.max(200, available));
      }
    }

    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
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
        "w-[320px] bg-white flex flex-col h-full z-20 border-r border-slate-200",
        className
      )}
    >
      {/* Search/Filter - Top Priority */}
      <div className="p-4 space-y-4">
        <div className="relative group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
          <Input
            type="text"
            placeholder="Filter models..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="pl-10 pr-10 h-10 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus-visible:ring-0 focus-visible:border-sky-400 rounded-xl transition-all shadow-sm hover:border-sky-200"
          />
          {filterQuery && (
            <button
              type="button"
              onClick={() => setFilterQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Mode Toggle */}
        <div className="flex p-1 bg-slate-100/5 rounded-xl border border-slate-200/50">
          <button
            type="button"
            onClick={() => setMode("project")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg transition-all",
              mode === "project"
                ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
            )}
          >
            <FolderTree className="h-3.5 w-3.5" />
            Project
          </button>
          <button
            type="button"
            onClick={() => setMode("database")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-black uppercase tracking-[0.2em] rounded-lg transition-all",
              mode === "database"
                ? "bg-sky-500 text-white shadow-md shadow-sky-500/20"
                : "text-slate-500 hover:text-slate-900 hover:bg-white/50"
            )}
          >
            <Database className="h-3.5 w-3.5" />
            Database
          </button>
        </div>
      </div>

      {/* Breadcrumbs - Industrial style */}
      {selectedModelId && breadcrumbs.length > 0 && (
        <div className="px-4 py-3 bg-white/[0.02] border-y border-white/5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 min-w-0 overflow-x-auto no-scrollbar scroll-smooth">
              {breadcrumbs.map((crumb, i) => (
                <span key={crumb.id} className="flex items-center gap-1.5 shrink-0">
                  {i > 0 && <span className="text-white/10 text-[10px]">/</span>}
                  <span
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-1 rounded-md transition-all text-[9px] font-bold uppercase tracking-widest",
                      i === breadcrumbs.length - 1
                        ? "bg-primary/10 text-primary border border-primary/20"
                        : "text-muted-foreground/60 hover:text-foreground"
                    )}
                  >
                    {getBreadcrumbIcon(crumb.type)}
                    <span className="truncate max-w-[70px]">{crumb.label}</span>
                  </span>
                </span>
              ))}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleReveal}
              className="shrink-0 h-7 w-7 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-primary transition-all"
              title="Reveal in tree"
            >
              <Locate className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Tree container */}
      <div className="flex-1 relative overflow-hidden group" ref={containerRef}>
        {isLoading ? (
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
            <div className="py-2">
              <VirtualTree
                nodes={flatNodes}
                onToggle={toggleNode}
                onSelect={handleSelect}
                onExpand={expandNode}
                onCollapse={collapseNode}
                height={containerHeight - 16}
                scrollToIndex={scrollToIndex}
                highlightIds={matchingIds}
              />
            </div>

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
      <div className="p-4 border-t border-slate-200/60 bg-slate-50/80 backdrop-blur-sm">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">
            {flatNodes.length} Assets
          </span>
          <span className="text-[9px] font-mono text-slate-500 uppercase mt-0.5 font-bold">
            {mode} layout
          </span>
        </div>
      </div>
    </aside>
  );
}
