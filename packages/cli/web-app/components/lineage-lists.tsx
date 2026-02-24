"use client";

import Link from "next/link";
import { ArrowUpRight, ArrowDownRight, FileCode } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { ModelSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

interface LineageListProps {
  models: ModelSummary[];
  direction: "upstream" | "downstream";
  isLoading?: boolean;
}

const materializationColors: Record<string, string> = {
  table: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  view: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  incremental: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
  ephemeral: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
};

export function LineageList({ models, direction, isLoading }: LineageListProps) {
  const Icon = direction === "upstream" ? ArrowUpRight : ArrowDownRight;
  const label = direction === "upstream" ? "Upstream" : "Downstream";

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border shadow-sm">
            <Skeleton className="h-10 w-10 rounded-lg bg-slate-100 dark:bg-slate-900" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40 bg-slate-100 dark:bg-slate-900" />
              <Skeleton className="h-3 w-24 bg-slate-100 dark:bg-slate-900" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (models.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/20 dark:bg-slate-950/20 rounded-2xl border border-border border-dashed">
        <div className="rounded-2xl bg-slate-50 dark:bg-slate-900/50 p-4 mb-4">
          <Icon className="h-8 w-8 text-slate-300 dark:text-slate-700" />
        </div>
        <h3 className="font-bold text-foreground mb-1 text-sm tracking-tight opacity-80">No {label.toLowerCase()} dependencies</h3>
        <p className="text-xs text-muted-foreground max-w-[200px] text-balance">
          This model doesn&apos;t have any {label.toLowerCase()} relations in the graph.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">
          {label} Models
        </div>
        <Badge variant="outline" className="text-[10px] font-mono border-border text-muted-foreground bg-card shadow-sm">
          {models.length}
        </Badge>
      </div>
      <div className="space-y-2">
        {models.map((model) => (
          <Link
            key={model.unique_id}
            href={`/model/${encodeURIComponent(model.unique_id)}`}
            className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-sky-200 dark:hover:border-sky-800 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-400 dark:text-slate-500 group-hover:text-sky-600 dark:group-hover:text-sky-400 group-hover:bg-sky-50 dark:group-hover:bg-sky-900/30 transition-all">
              <FileCode className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-foreground group-hover:text-sky-700 dark:group-hover:text-sky-400 transition-colors truncate tracking-tight">
                {model.name}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">{model.schema}</span>
                <span className="h-1 w-1 rounded-full bg-slate-200 dark:bg-slate-800" />
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[9px] font-bold uppercase tracking-wider h-4 h-4 px-1 rounded border shadow-sm",
                    materializationColors[model.materialization]
                  )}
                >
                  {model.materialization}
                </Badge>
              </div>
            </div>
            <Icon className="h-4 w-4 text-slate-300 dark:text-slate-700 group-hover:text-sky-400 transition-colors shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
