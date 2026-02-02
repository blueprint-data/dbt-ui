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
  table: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  view: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  incremental: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  ephemeral: "bg-slate-500/10 text-slate-600 border-slate-500/20",
};

export function LineageList({ models, direction, isLoading }: LineageListProps) {
  const Icon = direction === "upstream" ? ArrowUpRight : ArrowDownRight;
  const label = direction === "upstream" ? "Upstream" : "Downstream";

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 shadow-sm">
            <Skeleton className="h-10 w-10 rounded-lg bg-slate-100" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40 bg-slate-100" />
              <Skeleton className="h-3 w-24 bg-slate-100" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (models.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center bg-white rounded-2xl border border-slate-200 border-dashed">
        <div className="rounded-2xl bg-slate-50 p-4 mb-4">
          <Icon className="h-8 w-8 text-slate-300" />
        </div>
        <h3 className="font-bold text-slate-900 mb-1 text-sm tracking-tight">No {label.toLowerCase()} dependencies</h3>
        <p className="text-xs text-slate-500 max-w-[200px] text-balance">
          This model doesn&apos;t have any {label.toLowerCase()} relations in the graph.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-slate-400">
          {label} Models
        </div>
        <Badge variant="outline" className="text-[10px] font-mono border-slate-200 text-slate-500 bg-white shadow-sm">
          {models.length}
        </Badge>
      </div>
      <div className="space-y-2">
        {models.map((model) => (
          <Link
            key={model.unique_id}
            href={`/model/${encodeURIComponent(model.unique_id)}`}
            className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-200 hover:border-sky-200 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-slate-50 text-slate-400 group-hover:text-sky-600 group-hover:bg-sky-50 transition-all">
              <FileCode className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-bold text-sm text-slate-900 group-hover:text-sky-700 transition-colors truncate tracking-tight">
                {model.name}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{model.schema}</span>
                <span className="h-1 w-1 rounded-full bg-slate-200" />
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
            <Icon className="h-4 w-4 text-slate-300 group-hover:text-sky-400 transition-colors shrink-0" />
          </Link>
        ))}
      </div>
    </div>
  );
}
