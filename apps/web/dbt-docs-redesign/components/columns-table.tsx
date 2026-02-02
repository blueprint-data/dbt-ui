"use client";

import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Column } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ColumnsTableProps {
  columns: Column[];
  highlightColumn?: string;
}

export function ColumnsTable({ columns, highlightColumn }: ColumnsTableProps) {
  const [search, setSearch] = useState("");
  const highlightRef = useRef<HTMLTableRowElement>(null);

  const filteredColumns = columns.filter(
    (col) =>
      col.name.toLowerCase().includes(search.toLowerCase()) ||
      col.description?.toLowerCase().includes(search.toLowerCase()) ||
      col.type?.toLowerCase().includes(search.toLowerCase())
  );

  // Auto-scroll to highlighted column
  useEffect(() => {
    if (highlightColumn && highlightRef.current) {
      highlightRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [highlightColumn]);

  if (columns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-slate-50 p-4 mb-4">
          <svg
            className="h-8 w-8 text-slate-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"
            />
          </svg>
        </div>
        <h3 className="font-medium text-slate-900 mb-1">No columns defined</h3>
        <p className="text-sm text-slate-500">
          This model doesn&apos;t have any column definitions.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 pt-6">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search columns..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white border-slate-200 focus:bg-white focus:border-sky-300 h-10 text-sm text-slate-900 placeholder:text-slate-400"
          />
        </div>
        <div className="text-[10px] uppercase font-bold tracking-[0.2em] text-slate-400">
          Showing <span className="text-sky-600">{filteredColumns.length}</span> of {columns.length} columns
        </div>
      </div>

      <div className="w-full">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em]">
                Column Name
              </th>
              <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] hidden sm:table-cell">
                Data Type
              </th>
              <th className="text-left px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] hidden md:table-cell">
                Description
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredColumns.map((column) => {
              const isHighlighted =
                highlightColumn?.toLowerCase() === column.name.toLowerCase();
              return (
                <tr
                  key={column.name}
                  ref={isHighlighted ? highlightRef : null}
                  className={cn(
                    "group transition-all",
                    isHighlighted
                      ? "bg-sky-50 border-l-2 border-l-sky-500"
                      : "hover:bg-slate-50"
                  )}
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "h-1.5 w-1.5 rounded-full transition-all",
                        isHighlighted ? "bg-sky-500" : "bg-slate-200 group-hover:bg-sky-400"
                      )} />
                      <code className="text-[13px] font-black font-mono text-slate-900 tracking-tight uppercase">
                        {column.name}
                      </code>
                    </div>
                  </td>
                  <td className="px-6 py-4 hidden sm:table-cell">
                    {column.type ? (
                      <Badge variant="outline" className="text-[10px] font-bold font-mono uppercase tracking-[0.15em] py-0 px-2 rounded-md border-slate-200 bg-slate-50 text-slate-600">
                        {column.type}
                      </Badge>
                    ) : (
                      <span className="text-slate-300 text-[10px] uppercase tracking-widest">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <span className="text-xs text-slate-500 leading-relaxed font-medium group-hover:text-slate-700 transition-colors">
                      {column.description || "No description provided for this column asset."}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredColumns.length === 0 && (
          <div className="py-20 text-center flex flex-col items-center gap-3">
            <div className="bg-slate-50 p-4 rounded-2xl mb-2">
              <Search className="h-6 w-6 text-slate-300" />
            </div>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest opacity-50">
              No columns match &quot;{search}&quot;
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
