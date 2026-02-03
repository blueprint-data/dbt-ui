"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, ChevronRight, Database, Table2, FileCode } from "lucide-react";
import { cn } from "@/lib/utils";

type DbModel = { unique_id: string; name: string };
type DbSchema = { name: string; models: DbModel[] };
type DbEntry = { name: string; schemas: DbSchema[] };

interface DatabaseTreeProps {
  selectedModelId?: string | null;
  className?: string;
}

export function DatabaseTree({ selectedModelId = null, className }: DatabaseTreeProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [data, setData] = useState<DbEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDbs, setOpenDbs] = useState<Set<string>>(new Set());
  const [openSchemas, setOpenSchemas] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch("/api/nav/database")
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load database nav: ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (cancelled) return;
        setData((json?.databases ?? []) as DbEntry[]);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-open db/schema when on /model/<id>
  useEffect(() => {
    if (!pathname.startsWith("/model/")) return;
    const id = decodeURIComponent(pathname.replace("/model/", "").split("?")[0]);
    for (const dbEntry of data) {
      for (const schema of dbEntry.schemas) {
        if (schema.models.some((m) => m.unique_id === id)) {
          setOpenDbs((prev) => new Set(prev).add(dbEntry.name));
          setOpenSchemas((prev) => new Set(prev).add(`${dbEntry.name}:${schema.name}`));
          return;
        }
      }
    }
  }, [pathname, data]);

  const totalModels = useMemo(() => data.reduce((acc, db) => acc + db.schemas.reduce((s, sch) => s + sch.models.length, 0), 0), [data]);

  const toggleDb = (name: string) => {
    setOpenDbs((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const toggleSchema = (dbName: string, schemaName: string) => {
    const key = `${dbName}:${schemaName}`;
    setOpenSchemas((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleSelect = (id: string) => {
    router.push(`/model/${encodeURIComponent(id)}`);
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      <div className="flex items-center justify-between px-4 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-sky-500" />
          <span>Database</span>
        </div>
        <span className="font-mono text-xs text-slate-400">{totalModels}</span>
      </div>

      <div className="flex-1 overflow-auto">
        {loading && (
          <div className="p-4 text-xs text-slate-500">Loading database tree...</div>
        )}
        {error && (
          <div className="p-4 text-xs text-red-600">{error}</div>
        )}
        {!loading && !error && data.length === 0 && (
          <div className="p-4 text-xs text-slate-500">No models found.</div>
        )}

        <div className="p-2 space-y-1">
          {data.map((db) => {
            const dbOpen = openDbs.has(db.name);
            const dbCount = db.schemas.reduce((acc, s) => acc + s.models.length, 0);
            return (
              <div key={db.name} className="border border-slate-200 rounded-lg bg-white shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <button
                  type="button"
                  onClick={() => toggleDb(db.name)}
                  className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50"
                >
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                    {dbOpen ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                    <span className="truncate">{db.name}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">{dbCount}</span>
                </button>

                {dbOpen && (
                  <div className="pl-4 pr-2 pb-2 space-y-1">
                    {db.schemas.map((schema) => {
                      const key = `${db.name}:${schema.name}`;
                      const schemaOpen = openSchemas.has(key);
                      return (
                        <div key={key} className="rounded-md border border-slate-100 bg-slate-50">
                          <button
                            type="button"
                            onClick={() => toggleSchema(db.name, schema.name)}
                            className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-white"
                          >
                            <div className="flex items-center gap-2 text-[12px] font-semibold text-slate-700">
                              {schemaOpen ? <ChevronDown className="h-3.5 w-3.5 text-slate-400" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-400" />}
                              <Table2 className="h-3.5 w-3.5 text-slate-400" />
                              <span className="truncate">{schema.name}</span>
                            </div>
                            <span className="text-[10px] font-mono text-slate-500">{schema.models.length}</span>
                          </button>

                          {schemaOpen && (
                            <div className="pl-6 pr-3 pb-2 space-y-1">
                              {schema.models.map((m) => {
                                const isSel = selectedModelId === m.unique_id;
                                return (
                                  <button
                                    key={m.unique_id}
                                    type="button"
                                    onClick={() => handleSelect(m.unique_id)}
                                    className={cn(
                                      "w-full flex items-center gap-2 px-2 py-1.5 rounded text-left text-sm",
                                      isSel
                                        ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
                                        : "hover:bg-white border border-transparent text-slate-700"
                                    )}
                                  >
                                    <FileCode className={cn("h-3.5 w-3.5", isSel ? "text-emerald-500" : "text-slate-400")} />
                                    <span className="truncate">{m.name}</span>
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
