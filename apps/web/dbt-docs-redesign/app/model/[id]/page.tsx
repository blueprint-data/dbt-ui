"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useParams } from "next/navigation";
import {
  ArrowUpRight,
  ArrowDownRight,
  FileCode,
  GitBranch,
  Code,
  Info,
  Crosshair,
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

  const [isGraphOpen, setIsGraphOpen] = useState(false);

  // Get tab and highlight from URL
  const tabParam = searchParams.get("tab");
  const highlightColumn = searchParams.get("highlight");
  const defaultTab =
    tabParam === "upstream" || tabParam === "downstream"
      ? "lineage"
      : tabParam || "overview";

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

  if (isLoading) {
    return (
      <AppShell
        selectedModelId={decodedId}
        graphOpen={isGraphOpen}
        onGraphOpenChange={setIsGraphOpen}
      >
        <div className="p-4 md:p-6 lg:p-8">
          <ModelDetailSkeleton />
        </div>
      </AppShell>
    );
  }

  if (error || !model) {
    return (
      <AppShell
        selectedModelId={decodedId}
        graphOpen={isGraphOpen}
        onGraphOpenChange={setIsGraphOpen}
      >
        <div className="p-4 md:p-6">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="rounded-full bg-red-500/10 p-4 mb-4">
              <FileCode className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="text-xl font-semibold mb-2 text-foreground">Model Not Found</h1>
            <p className="text-muted-foreground mb-4 max-w-md">
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
      tags: model.tags || [],
      description: model.description,
    },
    ...(lineage.upstream || []),
    ...(lineage.downstream || []),
  ] : [];

  return (
    <AppShell
      selectedModelId={decodedId}
      allModels={allGraphModels}
      graphOpen={isGraphOpen}
      onGraphOpenChange={setIsGraphOpen}
    >
      <div className="p-4 md:p-6 lg:p-8 w-full max-w-[1600px] mx-auto page-transition">
        <div className="min-w-0">
            <div className="mb-5 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="mb-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-foreground tracking-tight break-all leading-none">
                    {model.name}
                  </h1>
                  <Badge
                    variant="secondary"
                    className="shrink-0 rounded-full border border-border bg-muted px-3 py-0.5 font-mono text-xs font-semibold text-muted-foreground"
                  >
                    {model.schema}
                  </Badge>
                </div>
                <p className="line-clamp-3 text-base text-muted-foreground [overflow-wrap:anywhere] [word-break:break-word] sm:text-lg sm:leading-relaxed max-w-3xl font-medium">
                  {getDescriptionPreview(model.description, model.schema)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 shrink-0 text-muted-foreground hover:text-sky-600 dark:hover:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-all rounded-full"
                onClick={() => setIsGraphOpen(true)}
                title="Locate in Graph"
              >
                <Crosshair className="h-5 w-5" />
              </Button>
            </div>

            {/* Tabs */}
            <Tabs defaultValue={defaultTab} className="w-full">
              <TabsList className="w-full justify-start border-b border-border/60 rounded-none h-auto p-0 bg-transparent overflow-x-auto gap-6 md:gap-8 custom-scrollbar pb-px flex-nowrap">
                <TabsTrigger
                  value="overview"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-sky-500 data-[state=active]:bg-transparent data-[state=active]:text-sky-600 dark:data-[state=active]:text-sky-400 text-muted-foreground py-4 px-0 text-xs font-bold uppercase tracking-widest transition-all hover:text-foreground whitespace-nowrap shrink-0"
                >
                  Overview
                </TabsTrigger>
                <TabsTrigger
                  value="columns"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-sky-500 data-[state=active]:bg-transparent data-[state=active]:text-sky-600 dark:data-[state=active]:text-sky-400 text-muted-foreground py-4 px-0 text-xs font-bold uppercase tracking-widest transition-all hover:text-foreground whitespace-nowrap shrink-0"
                >
                  Columns
                  <span className="ml-2 font-mono text-muted-foreground/60 font-normal">{(model.columns || []).length}</span>
                </TabsTrigger>
                <TabsTrigger
                  value="lineage"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-sky-500 data-[state=active]:bg-transparent data-[state=active]:text-sky-600 dark:data-[state=active]:text-sky-400 text-muted-foreground py-4 px-0 text-xs font-bold uppercase tracking-widest transition-all hover:text-foreground whitespace-nowrap shrink-0"
                >
                  Lineage
                  {!lineageLoading && (
                    <span className="ml-2 font-mono text-muted-foreground/60 font-normal tabular-nums">
                      <span className="inline-flex items-center gap-1" title="Upstream count">
                        <ArrowUpRight className="h-3 w-3 opacity-70" />
                        {(lineage.upstream || []).length}
                      </span>
                      <span className="mx-1.5 text-muted-foreground/30">·</span>
                      <span className="inline-flex items-center gap-1" title="Downstream count">
                        <ArrowDownRight className="h-3 w-3 opacity-70" />
                        {(lineage.downstream || []).length}
                      </span>
                    </span>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="code"
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-sky-500 data-[state=active]:bg-transparent data-[state=active]:text-sky-600 dark:data-[state=active]:text-sky-400 text-muted-foreground py-4 px-0 text-xs font-bold uppercase tracking-widest transition-all hover:text-foreground whitespace-nowrap shrink-0"
                >
                  Code
                </TabsTrigger>
              </TabsList>

              <div className="mt-8 w-full min-w-0">
                <TabsContent value="overview" className="mt-0">
                  <OverviewTab model={model} />
                </TabsContent>

                <TabsContent value="columns" className="mt-0">
                  <div className="w-full min-w-0 rounded-2xl border border-sky-100 dark:border-slate-800 bg-card shadow-sm overflow-hidden">
                    <ColumnsTable
                      columns={model.columns || []}
                      highlightColumn={highlightColumn || undefined}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="lineage" className="mt-0">
                  <div className="space-y-8">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="shrink-0 gap-2 border-sky-200/80 bg-card hover:bg-sky-50 dark:border-sky-800 dark:hover:bg-sky-950/40 hover:text-sky-700 dark:hover:text-sky-300 h-9 text-xs font-bold uppercase tracking-wider"
                        onClick={() => setIsGraphOpen(true)}
                        title="Open interactive lineage graph"
                      >
                        <GitBranch className="h-4 w-4" />
                        Open graph
                      </Button>
                    </div>
                    {lineageLoading ? (
                      <LineageList
                        models={[]}
                        direction="upstream"
                        isLoading
                      />
                    ) : (
                      <div className="space-y-12">
                        <LineageList
                          models={lineage.upstream || []}
                          direction="upstream"
                        />
                        <LineageList
                          models={lineage.downstream || []}
                          direction="downstream"
                        />
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="code" className="mt-0 w-full min-w-0">
                  <CodeViewer
                    rawCode={model.raw_code}
                    compiledCode={model.compiled_code}
                  />
                </TabsContent>
              </div>
            </Tabs>
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
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-600 dark:text-sky-400">Project Description</h3>
        </div>
        {model.description ? (
          <DescriptionContent description={model.description} />
        ) : (
          <p className="text-lg text-foreground leading-relaxed font-medium">
            No description provided for this model asset.
          </p>
        )}
      </section>

      {/* Details Grid */}
      <section>
        <div className="flex items-center gap-3 mb-6">
          <GitBranch className="h-4 w-4 text-sky-500" />
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-600 dark:text-sky-400">Deployment Context</h3>
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
      {model.meta && Object.keys(model.meta).length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Code className="h-4 w-4 text-sky-500" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-600 dark:text-sky-400">Metadata Properties</h3>
          </div>
          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            <table className="w-full">
              <tbody className="divide-y divide-border/60">
                {Object.entries(model.meta || {}).map(([key, value]) => (
                  <tr key={key} className="group transition-colors hover:bg-muted/40">
                    <td className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground w-1/3">
                      {key}
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-foreground/80 group-hover:text-foreground">
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
      {(model.tags || []).length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <GitBranch className="h-4 w-4 text-sky-500" />
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-sky-600 dark:text-sky-400">Assigned Tags</h3>
          </div>
          <div className="flex flex-wrap gap-3">
            {(model.tags || []).map((tag) => (
              <Badge key={tag} variant="secondary" className="px-4 py-1.5 rounded-full bg-muted border border-border text-muted-foreground text-[10px] font-bold uppercase tracking-wider hover:bg-sky-50 dark:hover:bg-sky-900/40 hover:text-sky-700 dark:hover:text-sky-400 transition-all cursor-default">
                {tag}
              </Badge>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

type DescriptionBlock =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "code"; language?: string; content: string };

function getDescriptionPreview(description: string | null | undefined, schema: string) {
  if (!description?.trim()) {
    return `A data model in the ${schema} schema.`;
  }

  const plainText = description
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/^\s*[-*]\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[(.*?)\]\((.*?)\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

  if (!plainText) {
    return `A data model in the ${schema} schema.`;
  }

  const sentenceMatch = plainText.match(/.*?[.!?](?:\s|$)/);
  const firstSentence = sentenceMatch ? sentenceMatch[0].trim() : plainText;

  return firstSentence.length > 220 ? `${firstSentence.slice(0, 217)}...` : firstSentence;
}

function parseDescriptionBlocks(description: string): DescriptionBlock[] {
  const normalized = description.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];

  const blocks: DescriptionBlock[] = [];
  const codeFenceRegex = /```([a-zA-Z0-9_-]+)?\n([\s\S]*?)```/g;

  const pushTextBlocks = (rawText: string) => {
    const chunks = rawText
      .split(/\n{2,}/)
      .map((chunk) => chunk.trim())
      .filter(Boolean);

    for (const chunk of chunks) {
      const lines = chunk
        .split("\n")
        .map((line) => line.trimEnd())
        .filter((line) => line.trim().length > 0);

      if (!lines.length) continue;

      const isBulletLine = (line: string) => /^\s*[-*]\s+/.test(line);

      if (lines.every(isBulletLine)) {
        blocks.push({
          type: "list",
          items: lines.map((line) => line.replace(/^\s*[-*]\s+/, "").trim()),
        });
        continue;
      }

      if (lines.length > 1 && !isBulletLine(lines[0]) && lines.slice(1).every(isBulletLine)) {
        blocks.push({ type: "paragraph", text: lines[0] });
        blocks.push({
          type: "list",
          items: lines.slice(1).map((line) => line.replace(/^\s*[-*]\s+/, "").trim()),
        });
        continue;
      }

      blocks.push({ type: "paragraph", text: lines.join("\n") });
    }
  };

  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = codeFenceRegex.exec(normalized)) !== null) {
    const [fullMatch, language, code] = match;

    if (match.index > cursor) {
      pushTextBlocks(normalized.slice(cursor, match.index));
    }

    blocks.push({
      type: "code",
      language: language || undefined,
      content: (code || "").trimEnd(),
    });

    cursor = match.index + fullMatch.length;
  }

  if (cursor < normalized.length) {
    pushTextBlocks(normalized.slice(cursor));
  }

  return blocks;
}

function renderInlineMarkdown(text: string) {
  return text
    .split(/(\*\*[^*]+\*\*|`[^`]+`)/g)
    .filter(Boolean)
    .map((token, index) => {
      if (token.startsWith("**") && token.endsWith("**")) {
        return (
          <strong key={index} className="font-semibold text-foreground">
            {token.slice(2, -2)}
          </strong>
        );
      }

      if (token.startsWith("`") && token.endsWith("`")) {
        return (
          <code
            key={index}
            className="rounded-md border border-sky-200/80 dark:border-sky-900/60 bg-sky-50/70 dark:bg-sky-950/30 px-1.5 py-0.5 font-mono text-[0.9em] text-sky-700 dark:text-sky-300"
          >
            {token.slice(1, -1)}
          </code>
        );
      }

      return <span key={index}>{token}</span>;
    });
}

function DescriptionContent({ description }: { description: string }) {
  const blocks = parseDescriptionBlocks(description);

  if (!blocks.length) {
    return <p className="text-lg text-foreground leading-relaxed font-medium">No description provided for this model asset.</p>;
  }

  return (
    <div className="space-y-5">
      {blocks.map((block, index) => {
        if (block.type === "paragraph") {
          return (
            <p key={`paragraph-${index}`} className="text-base sm:text-lg text-foreground leading-relaxed whitespace-pre-line">
              {renderInlineMarkdown(block.text)}
            </p>
          );
        }

        if (block.type === "list") {
          return (
            <ul key={`list-${index}`} className="space-y-2 pl-6 list-disc marker:text-sky-500">
              {block.items.map((item, itemIndex) => (
                <li key={`item-${index}-${itemIndex}`} className="text-base sm:text-lg text-foreground leading-relaxed">
                  {renderInlineMarkdown(item)}
                </li>
              ))}
            </ul>
          );
        }

        return (
          <div key={`code-${index}`} className="rounded-2xl border border-border bg-slate-950 dark:bg-slate-900 overflow-hidden shadow-sm">
            {block.language && (
              <div className="border-b border-slate-800/80 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-300">
                {block.language}
              </div>
            )}
            <pre className="overflow-x-auto px-4 py-4 text-sm leading-6 text-slate-100">
              <code className="font-mono">{block.content}</code>
            </pre>
          </div>
        );
      })}
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
    <div className="group stat-card rounded-2xl p-5 bg-card border border-border shadow-sm hover:border-sky-200 dark:hover:border-sky-900 hover:shadow-md transition-all">
      <dt className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-3 group-hover:text-sky-500 transition-colors">{label}</dt>
      <dd className={cn("text-sm font-bold text-foreground truncate", mono && "font-mono text-xs text-muted-foreground")}>
        {value}
      </dd>
    </div>
  );
}

function ModelDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-3 flex-1">
          <div className="flex flex-wrap items-baseline gap-3">
            <Skeleton className="h-9 w-56 sm:h-10 sm:w-64" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <Skeleton className="h-5 max-w-2xl" />
        </div>
        <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
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
