import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Copy, Check, Maximize2, Minimize2, FileCode, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getDbtHighlighter,
  pickDbtShikiLang,
  shikiThemeName,
  tokenTextStyle,
  type ThemedToken,
} from "@/lib/dbt-shiki";
import { cn } from "@/lib/utils";

interface CodeViewerProps {
  rawCode?: string;
  compiledCode?: string;
}

export function CodeViewer({ rawCode, compiledCode }: CodeViewerProps) {
  const hasRawCode = Boolean(rawCode?.trim());
  const hasCompiledCode = Boolean(compiledCode?.trim());

  const [activeTab, setActiveTab] = useState<string>(
    hasCompiledCode ? "compiled" : hasRawCode ? "source" : "compiled"
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === "source" && !hasRawCode && hasCompiledCode) {
      setActiveTab("compiled");
    } else if (activeTab === "compiled" && !hasCompiledCode && hasRawCode) {
      setActiveTab("source");
    }
  }, [activeTab, hasRawCode, hasCompiledCode]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  if (!hasRawCode && !hasCompiledCode) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-xl bg-muted/20">
        <div className="rounded-full bg-muted p-5 mb-5 ring-1 ring-white/10 shadow-inner">
          <Terminal className="h-10 w-10 text-muted-foreground/50" />
        </div>
        <h3 className="font-bold text-foreground mb-2 text-lg">No code available</h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          This SQLite file has no stored SQL for this model. Re-run <code className="font-mono">dbt-ui generate</code> with the latest version.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn(
      "flex w-full min-w-0 flex-col gap-0 transition-all duration-500 ease-in-out",
      isFullscreen ? "bg-background p-8 overflow-hidden" : ""
    )}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full min-w-0 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4 shrink-0 bg-transparent">
          <TabsList className="h-10 p-1 bg-muted/40 border border-border/40 rounded-lg">
            <TabsTrigger
              value="source"
              disabled={!hasRawCode}
              className="text-xs font-bold uppercase tracking-wider px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Source
            </TabsTrigger>
            <TabsTrigger
              value="compiled"
              disabled={!hasCompiledCode}
              className="text-xs font-bold uppercase tracking-wider px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Compiled
            </TabsTrigger>
          </TabsList>

          <div className="flex items-center gap-2">
             <Button
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
                className="h-9 w-9 p-0 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors rounded-lg"
                title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
              >
                {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
          </div>
        </div>

        <TabsContent value="source" className="mt-0 flex-1 min-h-0 relative group/codecontainer data-[state=active]:animate-in data-[state=active]:fade-in duration-300">
          <CodeBlock
            code={rawCode}
            variant="source"
            isFullscreen={isFullscreen}
            emptyMessage="Source SQL is not available for this model."
          />
        </TabsContent>
        <TabsContent value="compiled" className="mt-0 flex-1 min-h-0 relative group/codecontainer data-[state=active]:animate-in data-[state=active]:fade-in duration-300">
          <CodeBlock
            code={compiledCode}
            variant="compiled"
            isFullscreen={isFullscreen}
            emptyMessage="Compiled SQL is not available in the current SQLite database."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CodeBlock({
  code,
  variant,
  isFullscreen,
  emptyMessage,
}: {
  code?: string;
  variant: "source" | "compiled";
  isFullscreen: boolean;
  emptyMessage: string;
}) {
  const [copied, setCopied] = useState(false);
  const { resolvedTheme } = useTheme();
  const [tokenLines, setTokenLines] = useState<ThemedToken[][] | null>(null);

  const handleCopy = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shikiLang = code ? pickDbtShikiLang(code, variant) : "sql";
  const headerLabel =
    variant === "compiled" ? "SQL" : shikiLang === "jinja" ? "DBT" : "SQL";

  useEffect(() => {
    if (!code?.trim()) {
      setTokenLines(null);
      return;
    }
    let alive = true;
    (async () => {
      try {
        const h = await getDbtHighlighter();
        if (!alive) return;
        const theme = shikiThemeName(resolvedTheme);
        const { tokens } = h.codeToTokens(code, { lang: shikiLang, theme });
        if (alive) setTokenLines(tokens);
      } catch {
        if (alive) setTokenLines(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [code, shikiLang, resolvedTheme]);

  if (!code?.trim()) {
    return (
      <div
        className={cn(
          "w-full rounded-2xl border border-border bg-muted/20 dark:border-white/5 flex items-center justify-center px-6 text-center text-sm text-muted-foreground",
          isFullscreen ? "h-[calc(100vh-140px)]" : "h-[600px]"
        )}
      >
        {emptyMessage}
      </div>
    );
  }

  const fallbackLines = code.split("\n");
  const lineCount = tokenLines !== null ? tokenLines.length : fallbackLines.length;

  return (
    <div
      className={cn(
        "w-full overflow-hidden relative group/block flex flex-col rounded-2xl border border-border font-mono text-sm leading-6 bg-card text-card-foreground",
        "dark:border-white/5 dark:bg-[#0e1116] dark:text-slate-100",
        isFullscreen ? "h-[calc(100vh-140px)]" : "h-[600px]"
      )}
    >
      <div className="h-11 px-5 flex items-center justify-between border-b border-border bg-muted/40 dark:border-white/5 dark:bg-white/[0.02] shrink-0 z-10 relative">
        <div className="flex items-center gap-2">
          <div className="flex gap-2 mr-4">
            <div className="h-2.5 w-2.5 rounded-full bg-[#ef4444]/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#eab308]/80" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#22c55e]/80" />
          </div>
          <FileCode className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-bold text-muted-foreground" title="Syntax: Shiki (TextMate)">
            {headerLabel}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-muted-foreground/70 hidden sm:block">
            {lineCount} LINES
          </span>
          <div className="w-px h-4 bg-border dark:bg-white/10 hidden sm:block" />
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCopy}
            className={cn(
              "h-7 gap-2 text-xs font-bold uppercase tracking-wider",
              "bg-muted/80 hover:bg-muted border border-border hover:text-foreground",
              "dark:bg-white/5 dark:hover:bg-white/10 dark:border-white/5 dark:hover:text-white",
              copied && "text-emerald-600 bg-emerald-500/10 border-emerald-500/25 dark:text-emerald-400 dark:border-emerald-500/20"
            )}
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto custom-scrollbar relative z-10 p-1 [color-scheme:light] dark:[color-scheme:dark]">
        <pre className="p-4 pt-6 min-w-full inline-block">
          <code className="block min-w-full">
            {tokenLines !== null
              ? tokenLines.map((line, i) => (
                  <div
                    key={i}
                    className="flex group/line hover:bg-black/[0.04] dark:hover:bg-white/[0.03] -mx-4 px-4 transition-colors duration-75 relative"
                  >
                    <span className="w-12 shrink-0 text-right pr-6 select-none text-[11px] leading-6 font-bold text-muted-foreground/50 group-hover/line:text-muted-foreground/80 transition-colors border-r border-border dark:border-white/5 mr-4">
                      {i + 1}
                    </span>
                    <span className="whitespace-pre text-[13px] leading-6 break-words max-w-[calc(100%-4rem)] md:max-w-none">
                      {line.length === 0
                        ? " "
                        : line.map((t, j) => (
                            <span
                              key={j}
                              style={{
                                color: t.color,
                                ...tokenTextStyle(t.fontStyle),
                              }}
                            >
                              {t.content}
                            </span>
                          ))}
                    </span>
                  </div>
                ))
              : fallbackLines.map((line, i) => (
                  <div
                    key={i}
                    className="flex group/line hover:bg-black/[0.04] dark:hover:bg-white/[0.03] -mx-4 px-4 transition-colors duration-75 relative"
                  >
                    <span className="w-12 shrink-0 text-right pr-6 select-none text-[11px] leading-6 font-bold text-muted-foreground/50 group-hover/line:text-muted-foreground/80 transition-colors border-r border-border dark:border-white/5 mr-4">
                      {i + 1}
                    </span>
                    <span className="whitespace-pre text-[13px] leading-6 text-foreground/90 dark:text-slate-300 break-words max-w-[calc(100%-4rem)] md:max-w-none">
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
