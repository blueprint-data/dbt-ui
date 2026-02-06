"use client";

import React from "react"

import { useState } from "react";
import { Menu, X, GitBranch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Header } from "@/components/header";
import { TreeSidebar } from "@/components/tree-sidebar";
import { LineageGraph } from "@/components/lineage-graph";
import { cn } from "@/lib/utils";
import type { ModelSummary } from "@/lib/types";

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
  const [mobileOpen, setMobileOpen] = useState(false);
  const [internalGraphOpen, setInternalGraphOpen] = useState(false);

  const isGraphOpen = controlledGraphOpen ?? internalGraphOpen;
  const setGraphOpen = onGraphOpenChange ?? setInternalGraphOpen;

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Header */}
      <Header totalModels={totalModels}>
        {/* Mobile menu trigger */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden mr-2 hover:bg-sky-100"
              aria-label="Open navigation"
            >
              <Menu className="h-5 w-5 text-slate-700" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-[320px] bg-white">
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
            <SheetDescription className="sr-only">
              Browse your dbt project models and databases
            </SheetDescription>
            <TreeSidebar selectedModelId={selectedModelId} className="h-full border-r-0" />
          </SheetContent>
        </Sheet>
      </Header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <TreeSidebar
          selectedModelId={selectedModelId}
          className="hidden lg:flex shrink-0"
        />

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
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
  );
}
