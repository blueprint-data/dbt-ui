"use client";

import React from "react"

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, X, FileCode, Columns3, ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchModels } from "@/lib/api";
import type { SearchResult } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SearchBarProps {
  className?: string;
}

export function SearchBar({ className }: SearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const response = await searchModels(query, 15);
        setResults(response.results);
        setIsOpen(true);
        setSelectedIndex(-1);
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = useCallback(
    (result: SearchResult) => {
      const url =
        result.doc_type === "column"
          ? `/model/${encodeURIComponent(result.model_unique_id)}?tab=columns&highlight=${encodeURIComponent(result.name)}`
          : `/model/${encodeURIComponent(result.model_unique_id)}`;

      router.push(url);
      setIsOpen(false);
      setQuery("");
    },
    [router]
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || results.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < results.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Group results by type
  const modelResults = results.filter((r) => r.doc_type === "model");
  const columnResults = results.filter((r) => r.doc_type === "column");

  // Group column results by model
  const columnsByModel = columnResults.reduce(
    (acc, col) => {
      // Extract model name from unique_id: "model.package.name" → "name"
      const parts = col.model_unique_id.split('.');
      const modelName = parts[parts.length - 1] || col.model_unique_id;
      if (!acc[modelName]) acc[modelName] = [];
      acc[modelName].push(col);
      return acc;
    },
    {} as Record<string, SearchResult[]>
  );

  let flatIndex = -1;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-sky-500 transition-colors" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search models, columns..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query && results.length > 0 && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="pl-9 pr-8 h-10 bg-card border-border text-foreground placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-sky-400 focus:border-sky-400 transition-all rounded-xl shadow-sm hover:border-sky-200 dark:hover:border-sky-900/50"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setResults([]);
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 hover:bg-muted rounded-full transition-all"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-50 max-h-[400px] overflow-y-auto ring-1 ring-slate-900/5 dark:ring-white/10">
          {isLoading ? (
            <div className="p-4 text-center text-slate-500 text-sm">
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-sm">
              No results found for &quot;{query}&quot;
            </div>
          ) : (
            <div>
              {modelResults.length > 0 && (
                <div>
                  <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/30 border-b border-border">
                    Models
                  </div>
                  {modelResults.map((result) => {
                    flatIndex++;
                    const idx = flatIndex;
                    return (
                      <button
                        key={result.doc_id}
                        type="button"
                        onClick={() => handleSelect(result)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors border-b border-border/40 last:border-0",
                          selectedIndex === idx ? "bg-sky-50 dark:bg-sky-900/20" : "hover:bg-muted/30"
                        )}
                      >
                        <div className={cn(
                          "flex items-center justify-center h-8 w-8 rounded-lg transition-colors",
                          selectedIndex === idx ? "bg-sky-100 dark:bg-sky-900/40 text-sky-600 dark:text-sky-400" : "bg-muted text-muted-foreground"
                        )}>
                          <FileCode className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={cn("font-bold text-sm truncate", selectedIndex === idx ? "text-sky-900 dark:text-sky-400" : "text-foreground")}>
                            {result.name}
                          </div>
                          {result.description && (
                            <div className="text-xs text-muted-foreground dark:text-slate-400 truncate mt-0.5">
                              {result.description}
                            </div>
                          )}
                        </div>
                        <ArrowRight className={cn("h-4 w-4 shrink-0 transition-colors", selectedIndex === idx ? "text-sky-500" : "text-slate-300")} />
                      </button>
                    );
                  })}
                </div>
              )}

              {Object.keys(columnsByModel).length > 0 && (
                <div>
                  <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground bg-muted/30 border-b border-border border-t">
                    Columns
                  </div>
                  {Object.entries(columnsByModel).map(([modelName, cols]) => (
                    <div key={modelName}>
                      <div className="px-3 py-1.5 text-[10px] text-muted-foreground/60 font-mono bg-muted/10">
                        {modelName}
                      </div>
                      {cols.map((result) => {
                        flatIndex++;
                        const idx = flatIndex;
                        return (
                          <button
                            key={result.doc_id}
                            type="button"
                            onClick={() => handleSelect(result)}
                            className={cn(
                              "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors border-b border-border/40 last:border-0 pl-6",
                              selectedIndex === idx ? "bg-sky-50 dark:bg-sky-900/20" : "hover:bg-muted/30"
                            )}
                          >
                            <Columns3 className={cn("h-4 w-4 shrink-0", selectedIndex === idx ? "text-sky-500" : "text-muted-foreground/40")} />
                            <div className="flex-1 min-w-0">
                              <div className={cn("font-medium text-sm truncate", selectedIndex === idx ? "text-sky-900 dark:text-sky-400" : "text-foreground")}>
                                {result.name}
                              </div>
                              {result.description && (
                                <div className="text-xs text-muted-foreground truncate">
                                  {result.description}
                                </div>
                              )}
                            </div>
                            <ArrowRight className={cn("h-4 w-4 shrink-0 transition-colors", selectedIndex === idx ? "text-sky-500" : "text-slate-300")} />
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
