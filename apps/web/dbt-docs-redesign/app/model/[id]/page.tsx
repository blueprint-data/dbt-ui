"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useParams } from "next/navigation";
import {
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  ArrowUpRight,
  ArrowDownRight,
  FileCode,
  Columns3,
  GitBranch,
  Code,
  Info,
  Crosshair,
  Waypoints,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { AppShell } from "@/components/app-shell";
import { ColumnsTable } from "@/components/columns-table";
import { LineageList } from "@/components/lineage-lists";
import { CodeViewer } from "@/components/code-viewer";
import { fetchModelById, fetchLineage } from "@/lib/api";
import type { ModelDetail, ModelSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

const materializationColors: Record<string, string> = {
  table: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  view: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  incremental: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
  ephemeral: "bg-violet-500/10 text-violet-600 border-violet-500/20",
};

export default function ModelDetailPage() {
  const routeParams = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const [model, setModel] = useState<ModelDetail | null>(null);
  const [lineage, setLineage] = useState<{
    upstream: ModelSummary[];
    downstream: ModelSummary[];
  }>({ upstream: [], downstream: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [lineageLoading, setLineageLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [isGraphOpen, setIsGraphOpen] = useState(false);

  // Get tab and highlight from URL
  const tabParam = searchParams.get("tab");
  const highlightColumn = searchParams.get("highlight");
  const defaultTab = tabParam || "overview";

  const decodedId = decodeURIComponent(routeParams.id || "");

  useEffect(() => {
    async function loadModel() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await fetchModelById(decodedId);
        if (!data) {
          setError("Model not found");
        } else {
          setModel(data);
        }
      } catch (err) {
        console.error("Failed to load model:", err);
        setError("Failed to load model details");
      } finally {
        setIsLoading(false);
      }
    }

    loadModel();
  }, [decodedId]);

  useEffect(() => {
    async function loadLineage() {
      setLineageLoading(true);
      try {
        const data = await fetchLineage(decodedId, 1);
        setLineage(data);
      } catch (err) {
        console.error("Failed to load lineage:", err);
      } finally {
        setLineageLoading(false);
      }
    }

    loadLineage();
  }, [decodedId]);

  const handleCopyId = async () => {
    if (!model) return;
    await navigator.clipboard.writeText(model.unique_id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenNewTab = () => {
    window.open(window.location.href, "_blank");
  };

  if (isLoading) {
    return (
      <AppShell selectedModelId={decodedId}>
        <div className="p-4 md:p-6">
          <ModelDetailSkeleton />
        </div>
      </AppShell>
    );
  }

  if (error || !model) {
    return (
      <AppShell selectedModelId={decodedId}>
        <div className="p-4 md:p-6">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-full bg-red-50 p-4 mb-4">
              <FileCode className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="text-xl font-semibold mb-2 text-slate-900">Model Not Found</h1>
            <p className="text-slate-600 mb-4 max-w-md">
              {error || "The model you're looking for doesn't exist or has been removed."}
            </p>
            <Button asChild className="bg-sky-500 hover:bg-sky-600 text-white">
              <Link href="/">Back to Explorer</Link>
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  // Combine model with lineage for graph view
  const allGraphModels = model ? [
    // Current model as ModelSummary
    {
      unique_id: model.unique_id,
      name: model.name,
      schema: model.schema,
      database: model.database,
      package_name: model.package_name,
      materialization: model.materialization,
      resource_type: model.resource_type,
      tags: model.tags,
      description: model.description,
    },
    ...lineage.upstream,
    ...lineage.downstream,
  ] : [];

  return (
    <AppShell
      selectedModelId={decodedId}
      allModels={allGraphModels}
      graphOpen={isGraphOpen}
      onGraphOpenChange={setIsGraphOpen}
    >
      <div className="p-6 md:p-8 max-w-[1400px] mx-auto animate-in-up">
        {/* Navigation / Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-slate-100 pb-6 relative">
          {/* Progress / Decoration Bar to match image */}
          <div className="absolute -bottom-[1px] left-0 w-32 h-[3px] bg-slate-200 rounded-full hidden md:block" />

          <div className="flex items-center gap-4 overflow-hidden">
            <div className="flex items-center gap-3 text-[10px] md:text-xs font-bold uppercase tracking-[0.2em] text-slate-400 shrink-0">
              <span className="text-slate-300 font-mono text-sm leading-none pt-1">..</span>

              <div className="flex items-center gap-2 hover:text-slate-600 transition-colors cursor-default">
                <Waypoints className="h-4 w-4 text-slate-300" />
                <span>{model.schema}</span>
              </div>
            </div>

            <div className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-3xl border shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-all animate-in zoom-in-95 duration-300",
              materializationColors[model.materialization] || "bg-slate-50 border-slate-200 text-slate-700"
            )}>
              <FileCode className="h-3.5 w-3.5" />
              <span className="text-xs font-black tracking-widest leading-none truncate max-w-[200px]">{model.name}</span>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-all rounded-full"
            onClick={() => setIsGraphOpen(true)}
            title="Locate in Graph"
          >
            <Crosshair className="h-5 w-5" />
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Title Section (Simplified) */}
            <div className="mb-8">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 mb-4 tracking-tight break-all leading-none">
                {model.name}
              </h1>
              <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-3xl">
                {model.description ? model.description.split('.')[0] + '.' : "A data model in the " + model.schema + " schema."}
              </p>
            </div>

            {/* Tabs */}
            <Tabs defaultValue={defaultTab} className="w-full">
              <TabsList className="w-full justify-start border-b border-slate-200 rounded-none h-auto p-0 bg-transparent overflow-x-auto gap-8">
                <TabsTrigger
                  value="overview"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-sky-500 data-[state=active]:bg-transparent data-[state=active]:text-sky-600 text-slate-500 py-4 px-0 text-xs font-bold uppercase tracking-widest transition-all hover:text-slate-800"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="columns"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-sky-500 data-[state=active]:bg-transparent data-[state=active]:text-sky-600 text-slate-500 py-4 px-0 text-xs font-bold uppercase tracking-widest transition-all hover:text-slate-800"
                >
                  Columns
                  <span className="ml-2 font-mono text-slate-400 font-normal">{model.columns.length}</span>
                </TabsTrigger>
                <TabsTrigger
                  value="upstream"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-sky-500 data-[state=active]:bg-transparent data-[state=active]:text-sky-600 text-slate-500 py-4 px-0 text-xs font-bold uppercase tracking-widest transition-all hover:text-slate-800"
                >
                  Upstream
                  {!lineageLoading && (
                    <span className="ml-2 font-mono text-slate-400 font-normal">{lineage.upstream.length}</span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="downstream"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-sky-500 data-[state=active]:bg-transparent data-[state=active]:text-sky-600 text-slate-500 py-4 px-0 text-xs font-bold uppercase tracking-widest transition-all hover:text-slate-800"
                >
                  Downstream
                  {!lineageLoading && (
                    <span className="ml-2 font-mono text-slate-400 font-normal">{lineage.downstream.length}</span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="code"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-sky-500 data-[state=active]:bg-transparent data-[state=active]:text-sky-600 text-slate-500 py-4 px-0 text-xs font-bold uppercase tracking-widest transition-all hover:text-slate-800"
                >
                  Code
                </TabsTrigger>
              </TabsList>

              <div className="mt-10">
                <TabsContent value="overview" className="mt-0">
                  <OverviewTab model={model} />
                </TabsContent>

                <TabsContent value="columns" className="mt-0">
                  <div className="rounded-2xl border border-sky-100 bg-white shadow-sm overflow-hidden">
                    <ColumnsTable
                      columns={model.columns}
                      highlightColumn={highlightColumn || undefined}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="upstream" className="mt-0">
                  <LineageList
                    models={lineage.upstream}
                    direction="upstream"
                    isLoading={lineageLoading}
                  />
                </TabsContent>

                <TabsContent value="downstream" className="mt-0">
                  <LineageList
                    models={lineage.downstream}
                    direction="downstream"
                    isLoading={lineageLoading}
                  />
                </TabsContent>

                <TabsContent value="code" className="mt-0">
                  <div className="rounded-2xl border border-sky-100 bg-white shadow-sm overflow-hidden">
                    <CodeViewer
                      rawCode={model.raw_code}
                      compiledCode={model.compiled_code}
                    />
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Right Sidebar */}
          <aside className="lg:w-72 shrink-0">
            <div className="sticky top-24 space-y-6">
              {/* Quick Actions */}
              <div className="bg-white border border-sky-100 rounded-2xl p-6 space-y-4 shadow-sm">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-600">Quick Actions</h3>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-3 bg-slate-50 border-slate-200 hover:bg-white hover:border-sky-200 hover:text-sky-600 transition-all h-10 text-xs font-bold uppercase tracking-wider text-slate-600"
                    onClick={handleOpenNewTab}
                  >
                    <ExternalLink className="h-4 w-4" />
                    Open in new tab
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start gap-3 bg-slate-50 border-slate-200 hover:bg-white hover:border-sky-200 hover:text-sky-600 transition-all h-10 text-xs font-bold uppercase tracking-wider text-slate-600"
                    onClick={handleCopyId}
                  >
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-500" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4" />
                        Copy unique_id
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Lineage Summary */}
              <div className="bg-white border border-sky-100 rounded-2xl p-6 shadow-sm">
                <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-600 mb-5">Graph Summary</h3>
                {lineageLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full bg-slate-100" />
                    <Skeleton className="h-4 w-full bg-slate-100" />
                  </div>
                ) : (
                  <div className="space-y-4 text-sm">
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-500 flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                        <ArrowUpRight className="h-4 w-4 text-sky-500" />
                        Upstream
                      </span>
                      <span className="font-mono font-bold text-lg text-slate-900">{lineage.upstream.length}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-slate-500 flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                        <ArrowDownRight className="h-4 w-4 text-sky-500" />
                        Downstream
                      </span>
                      <span className="font-mono font-bold text-lg text-slate-900">{lineage.downstream.length}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </AppShell>
  );
}

function OverviewTab({ model }: { model: ModelDetail }) {
  return (
    <div className="space-y-12">
      {/* Description */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <Info className="h-4 w-4 text-sky-500" />
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-600">Project Description</h3>
        </div>
        <p className="text-lg text-slate-700 leading-relaxed font-medium">
          {model.description || "No description provided for this model asset."}
        </p>
      </section>

      {/* Details Grid */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <GitBranch className="h-4 w-4 text-sky-500" />
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-600">Deployment Context</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <DetailItem label="Path" value={model.path} mono />
          <DetailItem label="Database" value={model.database} />
          <DetailItem label="Schema" value={model.schema} />
          <DetailItem label="Materialization" value={model.materialization} />
          <DetailItem label="Package" value={model.package_name} />
          <DetailItem label="Resource Type" value={model.resource_type} />
        </div>
      </section>

      {/* Meta */}
      {Object.keys(model.meta).length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Code className="h-4 w-4 text-sky-500" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-600">Metadata Properties</h3>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <table className="w-full">
              <tbody className="divide-y divide-slate-100">
                {Object.entries(model.meta).map(([key, value]) => (
                  <tr key={key} className="group transition-colors hover:bg-slate-50">
                    <td className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-500 w-1/3">
                      {key}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-slate-700 group-hover:text-slate-900">
                      {String(value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Tags */}
      {model.tags.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <GitBranch className="h-4 w-4 text-sky-500" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-600">Assigned Tags</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {model.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="px-4 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider hover:bg-sky-50 hover:text-sky-700 transition-all cursor-default">
                {tag}
              </Badge>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function DetailItem({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="group rounded-2xl p-5 bg-white border border-slate-200 shadow-sm hover:border-sky-200 hover:shadow-md transition-all">
      <dt className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-3 group-hover:text-sky-500 transition-colors">{label}</dt>
      <dd className={cn("text-sm font-bold text-slate-900 truncate", mono && "font-mono text-xs text-slate-600")}>
        {value}
      </dd>
    </div>
  );
}

function ModelDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-32" />
      </div>
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-24" />
        </div>
      </div>
      <Skeleton className="h-12 w-full" />
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
          <Skeleton className="h-20" />
        </div>
      </div>
    </div>
  );
}
