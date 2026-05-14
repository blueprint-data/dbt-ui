"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  TooltipContent,
  TooltipProvider,
  TooltipRoot,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import type { ModelSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ModelsTableProps {
  models: ModelSummary[];
  /** First load only: full table skeleton (avoid on filter / page changes). */
  isInitialLoading?: boolean;
  /** Subsequent fetches: keep current rows, soft overlay. */
  isRefreshing?: boolean;
}

const materializationColors: Record<string, string> = {
  table: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_-2px_rgba(16,185,129,0.1)]",
  view: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 shadow-[0_0_10px_-2px_rgba(59,130,246,0.1)]",
  incremental: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 shadow-[0_0_10px_-2px_rgba(99,102,241,0.1)]",
  ephemeral: "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700",
};

function RefreshingScrim() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 flex items-start justify-end p-3 md:p-4">
      <div
        className="inline-flex h-8 items-center gap-2 rounded-lg border border-slate-200/80 bg-white/90 px-3 text-xs font-medium text-muted-foreground shadow-sm backdrop-blur dark:border-slate-700/80 dark:bg-slate-900/90"
        role="status"
        aria-live="polite"
        aria-label="Updating results"
      >
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-sky-600 dark:text-sky-400" />
        <span>Updating</span>
      </div>
    </div>
  );
}

export function ModelsTable({ models, isInitialLoading, isRefreshing }: ModelsTableProps) {
  if (isInitialLoading) {
    return <ModelsTableSkeleton />;
  }

  if (models.length === 0) {
    return (
      <div className="relative">
        {isRefreshing && <RefreshingScrim />}
        <div
          className={cn(
            "flex flex-col items-center justify-center py-20 text-center transition-opacity duration-200",
            isRefreshing && "opacity-60"
          )}
        >
          <div className="rounded-2xl glass-muted p-5 mb-5 shadow-inner">
            <svg
              className="h-10 w-10 text-primary/40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="font-bold text-xl tracking-tight text-foreground mb-2">No models found</h3>
          <p className="text-sm text-muted-foreground max-w-sm text-balance">
            We couldn&apos;t find any assets matching your filters. Try clearing some selections or
            search for something else.
          </p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
    <div className="relative w-full min-w-0">
      {isRefreshing && <RefreshingScrim />}
      <div
        className={cn(
          "w-full min-w-0 overflow-x-auto no-scrollbar transition-opacity duration-200",
          isRefreshing && "pointer-events-none opacity-70"
        )}
      >
        <table className="w-full min-w-full table-fixed border-collapse">
          <thead>
            <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200/60 dark:border-slate-800/60">
              <th className="min-w-0 text-left px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-200 uppercase tracking-[0.2em]">
                Asset Name
              </th>
              <th className="hidden min-w-0 text-left px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-200 uppercase tracking-[0.2em] md:table-cell">
                Schema
              </th>
              <th className="hidden min-w-0 text-left px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-200 uppercase tracking-[0.2em] lg:table-cell">
                Package
              </th>
              <th className="w-28 min-w-0 text-left px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-200 uppercase tracking-[0.2em]">
                Mat.
              </th>
              <th className="hidden min-w-0 max-w-96 w-96 text-left px-6 py-4 text-[10px] font-bold text-slate-500 dark:text-slate-200 uppercase tracking-[0.2em] xl:table-cell">
                Description
              </th>
            </tr>
          </thead>
        <tbody className="divide-y divide-border/40">
          {models.map((model) => (
            <tr
              key={model.unique_id}
              className="group table-row-hover hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
              <td className="min-w-0 max-w-0 px-6 py-4">
                <Link
                  href={`/model/${encodeURIComponent(model.unique_id)}`}
                  className="font-bold text-sm text-foreground hover:text-sky-600 dark:hover:text-sky-400 transition-colors flex min-w-0 items-center gap-2"
                >
                  <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-sky-500/40 group-hover:bg-sky-500 transition-colors" />
                  <span className="min-w-0 truncate">{model.name}</span>
                </Link>
              </td>
              <td className="hidden min-w-0 max-w-0 px-6 py-4 md:table-cell">
                <span className="block truncate text-xs font-mono text-muted-foreground group-hover:text-foreground transition-colors">
                  {model.schema}
                </span>
              </td>
              <td className="hidden min-w-0 max-w-0 px-6 py-4 lg:table-cell">
                <span className="block truncate text-xs font-mono text-muted-foreground group-hover:text-foreground transition-colors">
                  {model.package_name}
                </span>
              </td>
              <td className="min-w-0 px-6 py-4 whitespace-nowrap">
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider px-2 py-0 h-5 rounded-md border",
                    materializationColors[model.materialization]
                  )}
                >
                  {model.materialization}
                </Badge>
              </td>
              <td className="hidden min-w-0 max-w-96 w-96 p-0 align-top xl:table-cell xl:overflow-x-hidden">
                {model.description ? (
                  <div className="box-border w-full min-w-0 max-w-full px-6 py-4">
                    <TooltipRoot>
                      <TooltipTrigger asChild>
                        <p
                          className={cn(
                            "m-0 min-h-0 w-full min-w-0 max-w-full cursor-help text-left text-xs leading-snug text-muted-foreground [overflow-x:hidden] group-hover:text-foreground",
                            "line-clamp-2 [overflow-wrap:anywhere] [word-break:break-word]"
                          )}
                          tabIndex={0}
                        >
                          {model.description}
                        </p>
                      </TooltipTrigger>
                      <TooltipContent
                        side="top"
                        align="start"
                        sideOffset={4}
                        className="max-w-sm text-left break-words [overflow-wrap:anywhere] whitespace-pre-wrap"
                      >
                        {model.description}
                      </TooltipContent>
                    </TooltipRoot>
                  </div>
                ) : (
                  <div className="px-6 py-4 text-xs text-muted-foreground">—</div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
    </TooltipProvider>
  );
}

function ModelsTableSkeleton() {
  return (
    <div className="w-full min-w-0 border border-border rounded-lg overflow-hidden">
      <table className="w-full min-w-full table-fixed">
        <thead>
          <tr className="bg-muted/30 border-b border-border">
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Name
            </th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">
              Schema
            </th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
              Package
            </th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Type
            </th>
            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden xl:table-cell">
              Description
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {Array.from({ length: 10 }).map((_, i) => (
            <tr key={i}>
              <td className="px-4 py-3">
                <Skeleton className="h-4 w-40 shimmer" />
              </td>
              <td className="px-4 py-3 hidden md:table-cell">
                <Skeleton className="h-4 w-20" />
              </td>
              <td className="px-4 py-3 hidden lg:table-cell">
                <Skeleton className="h-4 w-24" />
              </td>
              <td className="px-4 py-3">
                <Skeleton className="h-5 w-16" />
              </td>
              <td className="px-4 py-3 hidden xl:table-cell">
                <Skeleton className="h-4 w-48" />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
