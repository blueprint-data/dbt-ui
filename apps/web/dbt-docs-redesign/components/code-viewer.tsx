import { useState, useRef } from "react";
import { Copy, Check, Maximize2, Minimize2, FileCode, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface CodeViewerProps {
  rawCode?: string;
  compiledCode?: string;
}

export function CodeViewer({ rawCode, compiledCode }: CodeViewerProps) {
  const [activeTab, setActiveTab] = useState<string>("source");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const currentCode = activeTab === "source" ? rawCode : compiledCode;

  if (!rawCode && !compiledCode) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-xl bg-muted/20">
        <div className="rounded-full bg-muted p-5 mb-5 ring-1 ring-white/10 shadow-inner">
          <Terminal className="h-10 w-10 text-muted-foreground/50" />
        </div>
        <h3 className="font-bold text-foreground mb-2 text-lg">No code available</h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">
          Source code is not available for this model context.
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={cn(
      "flex flex-col gap-0 transition-all duration-500 ease-in-out bg-background",
      isFullscreen ? "p-8 overflow-hidden" : ""
    )}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full h-full flex flex-col">
        <div className="flex items-center justify-between mb-4 shrink-0 bg-transparent">
          <TabsList className="h-10 p-1 bg-muted/40 border border-border/40 rounded-lg">
            <TabsTrigger value="source" className="text-xs font-bold uppercase tracking-wider px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
              Source
            </TabsTrigger>
            <TabsTrigger value="compiled" className="text-xs font-bold uppercase tracking-wider px-4 data-[state=active]:bg-background data-[state=active]:shadow-sm">
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
          <CodeBlock code={rawCode} language="sql" isFullscreen={isFullscreen} />
        </TabsContent>
        <TabsContent value="compiled" className="mt-0 flex-1 min-h-0 relative group/codecontainer data-[state=active]:animate-in data-[state=active]:fade-in duration-300">
          <CodeBlock code={compiledCode} language="sql" isFullscreen={isFullscreen} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function CodeBlock({ code, language, isFullscreen }: { code?: string, language: string, isFullscreen: boolean }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!code) return null;

  const lines = code.split("\n");

  return (
    <div className={cn(
      "w-full rounded-2xl bg-[#0e1116] border border-white/5 shadow-2xl overflow-hidden relative group/block flex flex-col font-mono text-sm leading-6",
      isFullscreen ? "h-[calc(100vh-140px)]" : "h-[600px]"
    )}>
      {/* Premium Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-sky-500/5 pointer-events-none z-0" />
      
      {/* Header Bar */}
      <div className="h-11 px-5 flex items-center justify-between border-b border-white/5 bg-white/[0.02] shrink-0 z-10 relative">
        <div className="flex items-center gap-2">
            <div className="flex gap-2 mr-4">
                <div className="h-2.5 w-2.5 rounded-full bg-[#ef4444]/80" />
                <div className="h-2.5 w-2.5 rounded-full bg-[#eab308]/80" />
                <div className="h-2.5 w-2.5 rounded-full bg-[#22c55e]/80" />
            </div>
            <FileCode className="h-3.5 w-3.5 text-muted-foreground/60" />
            <span className="text-xs font-bold text-muted-foreground/60">{language.toUpperCase()}</span>
        </div>
        
        <div className="flex items-center gap-3">
             <span className="text-[10px] font-bold text-muted-foreground/40 hidden sm:block">
                {lines.length} LINES
             </span>
             <div className="w-[1px] h-4 bg-white/10 hidden sm:block" />
             <Button
                size="sm"
                variant="ghost" 
                onClick={handleCopy}
                className={cn(
                  "h-7 gap-2 text-xs font-bold uppercase tracking-wider bg-white/5 hover:bg-white/10 hover:text-white border border-white/5 transition-all",
                  copied && "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                )}
             >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copied" : "Copy"}
             </Button>
        </div>
      </div>

      {/* Code Area */}
      <div className="flex-1 overflow-auto custom-scrollbar relative z-10 p-1">
        <pre className="p-4 pt-6 min-w-full inline-block">
          <code className="block min-w-full">
            {lines.map((line, i) => (
              <div key={i} className="flex group/line hover:bg-white/[0.03] -mx-4 px-4 transition-colors duration-75 relative">
                {/* Line Number */}
                <span className="w-12 shrink-0 text-right pr-6 select-none text-muted-foreground/20 text-[11px] leading-6 font-bold group-hover/line:text-muted-foreground/50 transition-colors border-r border-white/5 mr-4">
                  {i + 1}
                </span>
                
                {/* Code Content with Basic Syntax Highlighting Logic */}
                <span className={cn(
                  "whitespace-pre text-[13px] leading-6 transition-colors font-medium break-words max-w-[calc(100%-4rem)] md:max-w-none",
                  line.trim().startsWith("--") ? "text-slate-500 italic" : // Comments
                  line.includes("{{") || line.includes("}}") ? "text-[#f472b6]" : // Jinja tags (Pink)
                  line.match(/\b(SELECT|FROM|WHERE|JOIN|GROUP BY|ORDER BY|LIMIT|AS|WITH|UNION|ALL|OR|AND|NOT|IN|NULL|IS|LEFT|RIGHT|INNER|OUTER|ON|HAVING|CASE|WHEN|THEN|ELSE|END|DISTINCT|CAST|Create|View|Table)\b/i) ? "text-[#60a5fa] font-bold" : // SQL Keywords (Blue)
                  line.match(/['"`][^'"`]*['"`]/) ? "text-[#a3e635]" : // Strings (Green)
                  line.match(/\b\d+\b/) ? "text-[#fb923c]" : // Numbers (Orange)
                  "text-slate-300" // Default
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
