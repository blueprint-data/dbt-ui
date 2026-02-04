"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { ModelSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ModelsTableProps {
  models: ModelSummary[];
  isLoading?: boolean;
}

const materializationColors: Record<string, string> = {
  table: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_10px_-2px_rgba(16,185,129,0.1)]",
  view: "bg-blue-500/10 text-blue-500 border-blue-500/20 shadow-[0_0_10px_-2px_rgba(59,130,246,0.1)]",
  incremental: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20 shadow-[0_0_10px_-2px_rgba(99,102,241,0.1)]",
  ephemeral: "bg-slate-500/10 text-slate-500 border-slate-500/20",
};

export function ModelsTable({ models, isLoading }: ModelsTableProps) {
  if (isLoading) {
    return <ModelsTableSkeleton />;
  }

  if (models.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="rounded-2xl glass p-5 mb-5 shadow-inner">
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
          We couldn&apos;t find any assets matching your filters. Try clearing some selections or search for something else.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto no-scrollbar">
      <table className="w-full border-collapse min-w-[600px] md:min-w-0">
        <thead>
          <tr className="bg-muted/50 border-b border-border/60">
            <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
              Asset Name
            </th>
            <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] hidden md:table-cell">
              Schema
            </th>
            <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] hidden lg:table-cell">
              Package
            </th>
            <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
              Mat.
            </th>
            <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] hidden xl:table-cell">
              Description
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/40">
          {models.map((model) => (
            <tr
              key={model.unique_id}
              className="group table-row-hover hover:bg-sky-50 transition-colors"
            >
              <td className="px-6 py-4">
                <Link
                  href={`/model/${encodeURIComponent(model.unique_id)}`}
                  className="font-bold text-sm text-slate-900 hover:text-sky-600 transition-colors flex items-center gap-2"
                >
                  <div className="h-1.5 w-1.5 rounded-full bg-sky-500/40 group-hover:bg-sky-500 transition-colors shrink-0" />
                  {model.name}
                </Link>
              </td>
              <td className="px-6 py-4 hidden md:table-cell">
                <span className="text-xs font-mono text-slate-600 group-hover:text-slate-900 transition-colors">
                  {model.schema}
                </span>
              </td>
              <td className="px-6 py-4 hidden lg:table-cell">
                <span className="text-xs font-mono text-slate-600 group-hover:text-slate-900 transition-colors">
                  {model.package_name}
                </span>
              </td>
              <td className="px-6 py-4">
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
              <td className="px-6 py-4 hidden xl:table-cell max-w-xs">
                <span className="text-xs text-slate-500 line-clamp-1 group-hover:text-slate-700 transition-colors">
                  {model.description || "—"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ModelsTableSkeleton() {
  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <table className="w-full">
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
