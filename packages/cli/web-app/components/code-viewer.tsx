"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface CodeViewerProps {
  rawCode?: string;
  compiledCode?: string;
}

export function CodeViewer({ rawCode, compiledCode }: CodeViewerProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("source");

  const currentCode = activeTab === "source" ? rawCode : compiledCode;

  const handleCopy = async () => {
    if (!currentCode) return;
    await navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!rawCode && !compiledCode) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="rounded-full bg-muted p-4 mb-4">
          <svg
            className="h-8 w-8 text-muted-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
            />
          </svg>
        </div>
        <h3 className="font-medium text-foreground mb-1">No code available</h3>
        <p className="text-sm text-muted-foreground">
          Source code is not available for this model.
        </p>
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <div className="flex items-center justify-between mb-4">
        <TabsList className="h-9">
          <TabsTrigger value="source" className="text-sm">
            Source
          </TabsTrigger>
          <TabsTrigger value="compiled" className="text-sm">
            Compiled
          </TabsTrigger>
        </TabsList>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopy}
          className="h-8 gap-2 bg-transparent"
          disabled={!currentCode}
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy
            </>
          )}
        </Button>
      </div>

      <TabsContent value="source" className="mt-0">
        <CodeBlock code={rawCode} />
      </TabsContent>
      <TabsContent value="compiled" className="mt-0">
        <CodeBlock code={compiledCode} />
      </TabsContent>
    </Tabs>
  );
}

function CodeBlock({ code }: { code?: string }) {
  if (!code) {
    return (
      <div className="border border-border rounded-lg bg-muted/30 p-8 text-center text-muted-foreground text-sm">
        Code not available
      </div>
    );
  }

  const lines = code.split("\n");

  return (
    <div className="border border-white/5 rounded-2xl bg-[#09090b] overflow-hidden shadow-2xl relative group/code">
      {/* Code Header Decoration */}
      <div className="h-10 px-4 flex items-center gap-1.5 border-b border-white/5 bg-white/[0.02]">
        <div className="h-2 w-2 rounded-full bg-white/10" />
        <div className="h-2 w-2 rounded-full bg-white/10" />
        <div className="h-2 w-2 rounded-full bg-white/10" />
        <div className="ml-auto flex items-center gap-4">
          <span className="text-[9px] font-black font-mono uppercase tracking-[0.2em] text-muted-foreground/30">SQL Engine v1.0</span>
          <div className="h-3 w-[1px] bg-white/5" />
          <span className="text-[9px] font-black font-mono uppercase tracking-[0.2em] text-muted-foreground/30">{lines.length} lines</span>
        </div>
      </div>
      <div className="overflow-x-auto selection:bg-primary/30 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <pre className="p-6 text-[13px] font-mono leading-relaxed overflow-visible">
          <code className="block min-w-full">
            {lines.map((line, i) => (
              <div key={i} className="flex group/line hover:bg-white/[0.02] -mx-6 px-6 transition-colors">
                <span className="w-10 shrink-0 text-muted-foreground/20 text-right pr-6 select-none font-medium border-r border-white/5 mr-6 group-hover/line:text-muted-foreground/40 transition-colors">
                  {i + 1}
                </span>
                <span className={cn(
                  "whitespace-pre",
                  line.trim().startsWith("--") ? "text-muted-foreground/50 italic" :
                    line.includes("{{") || line.includes("}}") ? "text-primary/90 font-bold" :
                      line.match(/\b(SELECT|FROM|WHERE|JOIN|GROUP BY|ORDER BY|LIMIT|AS|WITH|UNION|ALL|OR|AND|NOT|IN|NULL|IS)\b/i) ? "text-blue-400 font-black" :
                        line.match(/'[^']*'/) ? "text-emerald-400" :
                          "text-foreground/90 font-medium"
                )}>
                  {line || " "}
                </span>
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
