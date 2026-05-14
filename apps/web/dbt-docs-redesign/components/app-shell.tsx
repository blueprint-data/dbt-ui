"use client";

import React from "react"

import { useCallback, useEffect, useState } from "react";
import { GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sidebar,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Header } from "@/components/header";
import { TreeSidebar } from "@/components/tree-sidebar";
import { LineageGraph } from "@/components/lineage-graph";
import {
  SidebarResizeHandle,
  SIDEBAR_DEFAULT_WIDTH,
} from "@/components/sidebar-resize-handle";
import { cn } from "@/lib/utils";
import type { ModelSummary } from "@/lib/types";

const SIDEBAR_WIDTH_STORAGE_KEY = "dbt-docs-sidebar-width";
const SIDEBAR_OPEN_STORAGE_KEY = "dbt-docs-sidebar-open";
/** Set by lineage graph when navigating to a model so the graph stays open after route change (e.g. explorer → model). */
const LINEAGE_REFOCUS_REOPEN_KEY = "dbt-lineage-refocus-reopen";

interface AppShellProps {
  children: React.ReactNode;
  selectedModelId?: string | null;
  totalModels?: number;
  allModels?: ModelSummary[];
  graphOpen?: boolean;
  onGraphOpenChange?: (open: boolean) => void;
}



export function AppShell({
  children,
  selectedModelId = null,
  totalModels,
  allModels = [],
  graphOpen: controlledGraphOpen,
  onGraphOpenChange
}: AppShellProps) {
  const [internalGraphOpen, setInternalGraphOpen] = useState(false);
  const [sidebarWidthPx, setSidebarWidthPx] = useState(SIDEBAR_DEFAULT_WIDTH);
  const [sidebarResizeDragging, setSidebarResizeDragging] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isGraphOpen = controlledGraphOpen ?? internalGraphOpen;
  const setGraphOpen = onGraphOpenChange ?? setInternalGraphOpen;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SIDEBAR_WIDTH_STORAGE_KEY);
      if (raw) {
        const n = Number.parseInt(raw, 10);
        if (!Number.isNaN(n) && n >= 200 && n <= 1200) {
          setSidebarWidthPx(n);
        }
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SIDEBAR_OPEN_STORAGE_KEY);
      if (raw === "false") {
        setSidebarOpen(false);
      } else if (raw === "true") {
        setSidebarOpen(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    try {
      if (sessionStorage.getItem(LINEAGE_REFOCUS_REOPEN_KEY) === "1") {
        sessionStorage.removeItem(LINEAGE_REFOCUS_REOPEN_KEY);
        setGraphOpen(true);
      }
    } catch {
      /* ignore */
    }
  }, [setGraphOpen]);

  const handleSidebarOpenChange = useCallback((open: boolean) => {
    setSidebarOpen(open);
    try {
      localStorage.setItem(SIDEBAR_OPEN_STORAGE_KEY, String(open));
    } catch {
      /* ignore */
    }
  }, []);

  const setSidebarWidthLive = useCallback((next: number) => {
    setSidebarWidthPx(next);
  }, []);

  const commitSidebarWidth = useCallback((next: number) => {
    try {
      localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(next));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const onResize = () => {
      setSidebarWidthPx((w) => {
        const max = Math.max(
          320,
          Math.floor(window.innerWidth * 0.6)
        );
        if (w <= max) return w;
        const clamped = Math.min(w, max);
        try {
          localStorage.setItem(SIDEBAR_WIDTH_STORAGE_KEY, String(clamped));
        } catch {
          /* ignore */
        }
        return clamped;
      });
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <SidebarProvider
      open={sidebarOpen}
      onOpenChange={handleSidebarOpenChange}
      className="min-h-screen flex flex-col"
      data-sidebar-resizing={sidebarResizeDragging ? "true" : undefined}
      style={
        {
          "--sidebar-width": `${sidebarWidthPx}px`,
          "--sidebar-width-mobile": `${sidebarWidthPx}px`,
        } as React.CSSProperties
      }
    >
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
        {/* Header */}
        <Header totalModels={totalModels}>
          <SidebarTrigger
            className="mr-2 hover:bg-sky-100 dark:hover:bg-slate-800 [&_svg]:size-5"
            aria-label="Toggle navigation"
          />
        </Header>

        {/* Body: shadcn sidebar (sheet on small screens, off-canvas on lg+) */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          <Sidebar
            collapsible="offcanvas"
            className="top-16 h-[calc(100svh-4rem)] border-0 bg-transparent"
          >
            <SidebarRail />
            <TreeSidebar
              selectedModelId={selectedModelId}
              className="min-h-0 flex-1 border-r-0"
            />
            <SidebarResizeHandle
              width={sidebarWidthPx}
              onWidthChange={setSidebarWidthLive}
              onResizeCommit={commitSidebarWidth}
              onDragActiveChange={setSidebarResizeDragging}
            />
          </Sidebar>

          <SidebarInset className="min-h-0 flex-1 overflow-y-auto custom-scrollbar bg-transparent">
            {children}
          </SidebarInset>
        </div>

      {/* Floating Graph Button - Global Access */}
      <Button
        onClick={() => setGraphOpen(true)}
        className={cn(
          "fixed bottom-6 right-4 md:bottom-8 md:right-6 z-50",
          "h-11 md:h-12 px-3 md:px-4 gap-2",
          "bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700",
          "text-white border-0",
          "shadow-2xl shadow-sky-500/30",
          "transition-all duration-300",
          "hover:scale-105 hover:shadow-sky-500/40",
          "text-[10px] md:text-xs font-black uppercase tracking-[0.15em] md:tracking-[0.2em]",
          "rounded-xl",
          "animate-in fade-in slide-in-from-bottom-4 duration-500"
        )}
        title="Open Lineage Graph"
      >
        <GitBranch className="h-3.5 w-3.5 md:h-4 md:w-4" />
        <span className="hidden sm:inline">Graph</span>
        <span className="sm:hidden">DAG</span>
      </Button>

      {/* Lineage Graph Modal - Global Level */}
      <LineageGraph
        open={isGraphOpen}
        onOpenChange={setGraphOpen}
        models={allModels}
        selectedModelId={selectedModelId}
      />
      </div>
    </SidebarProvider>
  );
}
