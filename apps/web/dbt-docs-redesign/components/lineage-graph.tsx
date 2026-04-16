"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  memo,
} from "react";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  Handle,
  Position,
  MarkerType,
  type Node,
  type Edge,
  type NodeProps,
  type NodeMouseHandler,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import Dagre from "@dagrejs/dagre";
import { useTheme } from "next-themes";
import {
  X,
  Maximize2,
  Search,
  ChevronDown,
  GitBranch,
  Plus,
  Minus,
  Crosshair,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { fetchLineage } from "@/lib/api";
import type {
  ModelSummary,
  Materialization,
  ResourceType,
  LineageGraphEdge,
  LineageGraphNode,
} from "@/lib/types";

// ─── Constants ───────────────────────────────────────────

const NODE_WIDTH = 220;
const NODE_HEIGHT = 48;

const MATERIALIZATION_COLORS: Record<string, string> = {
  table: "#10b981",
  view: "#0ea5e9",
  incremental: "#6366f1",
  snapshot: "#ec4899",
  seed: "#f59e0b",
  default: "#94a3b8",
};

// ─── Types ───────────────────────────────────────────────

interface DbtNodeData {
  label: string;
  materialization: Materialization;
  resourceType: ResourceType;
  schema: string;
  packageName: string;
  tags: string[];
  accentColor: string;
  isHighlighted: boolean;
  isDimmed: boolean;
  isActive: boolean;
  isDark: boolean;
  [key: string]: unknown;
}

type DbtNode = Node<DbtNodeData, "dbtModel">;

interface LineageGraphProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  models: ModelSummary[];
  selectedModelId?: string | null;
}

// ─── Dagre Layout ────────────────────────────────────────

function getLayoutedElements<T extends Node>(
  nodes: T[],
  edges: Edge[],
  direction: "LR" | "TB" = "LR"
): { nodes: T[]; edges: Edge[] } {
  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 80, ranksep: 320 });

  nodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  Dagre.layout(g);

  return {
    nodes: nodes.map((node) => {
      const pos = g.node(node.id);
      return {
        ...node,
        position: {
          x: pos.x - NODE_WIDTH / 2,
          y: pos.y - NODE_HEIGHT / 2,
        },
      };
    }) as T[],
    edges,
  };
}

// ─── Lineage Computation ─────────────────────────────────

function computeLineage(
  activeId: string,
  edges: { source: string; target: string }[]
): Set<string> {
  const connected = new Set<string>([activeId]);
  const adj = new Map<string, string[]>();
  const revAdj = new Map<string, string[]>();

  edges.forEach((e) => {
    if (!adj.has(e.source)) adj.set(e.source, []);
    if (!revAdj.has(e.target)) revAdj.set(e.target, []);
    adj.get(e.source)!.push(e.target);
    revAdj.get(e.target)!.push(e.source);
  });

  // Upstream traversal
  const upStack = [activeId];
  while (upStack.length > 0) {
    const curr = upStack.pop()!;
    revAdj.get(curr)?.forEach((parent) => {
      if (!connected.has(parent)) {
        connected.add(parent);
        upStack.push(parent);
      }
    });
  }

  // Downstream traversal
  const downStack = [activeId];
  while (downStack.length > 0) {
    const curr = downStack.pop()!;
    adj.get(curr)?.forEach((child) => {
      if (!connected.has(child)) {
        connected.add(child);
        downStack.push(child);
      }
    });
  }

  return connected;
}

// ─── Custom Node ─────────────────────────────────────────

const DbtModelNode = memo(({ data }: NodeProps<DbtNode>) => {
  const d = data as DbtNodeData;

  const bgColor = d.isActive
    ? "#22c55e"
    : d.isHighlighted
      ? d.isDark
        ? "#0c4a6e"
        : "#e0f2fe"
      : d.isDark
        ? "rgba(30, 41, 59, 0.9)"
        : "rgba(255, 255, 255, 0.95)";

  const textColor = d.isActive
    ? "#0a1f2a"
    : d.isDark
      ? "#f1f5f9"
      : "#0f172a";

  const borderColor = d.isActive
    ? "#16a34a"
    : d.isHighlighted
      ? "#0ea5e9"
      : d.isDark
        ? "rgba(255,255,255,0.08)"
        : "rgba(0,0,0,0.08)";

  return (
    <div
      className={cn(
        "relative flex items-center rounded-lg border transition-all duration-200",
        d.isDimmed && "opacity-[0.15]"
      )}
      style={{
        width: NODE_WIDTH,
        height: NODE_HEIGHT,
        backgroundColor: bgColor,
        borderColor,
        borderWidth: d.isActive ? 2.5 : 1,
        boxShadow: d.isActive
          ? `0 0 24px ${d.accentColor}40, 0 0 8px ${d.accentColor}20`
          : d.isHighlighted
            ? "0 0 16px rgba(14, 165, 233, 0.25)"
            : "0 1px 3px rgba(0,0,0,0.1)",
      }}
    >
      {/* Materialization accent bar */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
        style={{ backgroundColor: d.accentColor }}
      />

      {/* Label */}
      <span
        className="flex-1 text-center text-[13px] font-bold truncate px-4"
        style={{ color: textColor, fontFamily: "'Geist', sans-serif" }}
      >
        {d.label.toLowerCase()}
      </span>

      <Handle
        type="target"
        position={Position.Left}
        className="!w-1.5 !h-1.5 !bg-slate-500/50 !border-none !min-w-0 !min-h-0"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-1.5 !h-1.5 !bg-slate-500/50 !border-none !min-w-0 !min-h-0"
      />
    </div>
  );
});

DbtModelNode.displayName = "DbtModelNode";

const nodeTypes = { dbtModel: DbtModelNode };

// ─── Inner Component (needs ReactFlowProvider) ───────────

function LineageGraphInner({
  open,
  onOpenChange,
  models,
  selectedModelId,
}: LineageGraphProps) {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const router = useRouter();
  const { fitView, setCenter } = useReactFlow();
  const layoutRef = useRef<HTMLDivElement>(null);

  // Data state
  const [graphModels, setGraphModels] = useState<ModelSummary[]>(models);
  const [graphEdges, setGraphEdges] = useState<
    { id: string; source: string; target: string }[]
  >([]);
  const [graphDepth, setGraphDepth] = useState(2);
  const [graphLoading, setGraphLoading] = useState(false);
  const [graphError, setGraphError] = useState<string | null>(null);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(
    selectedModelId ?? null
  );

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState<DbtNode>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchPanelOpen, setSearchPanelOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showFilters, setShowFilters] = useState(true);

  // Filters
  const [selectedResources, setSelectedResources] = useState<Set<ResourceType>>(
    new Set(["model", "seed", "snapshot"])
  );
  const [selectedPackages, setSelectedPackages] = useState<Set<string>>(
    new Set()
  );
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [selectInput, setSelectInput] = useState("");
  const [excludeInput, setExcludeInput] = useState("");

  // Hover tooltip
  const [hoveredNode, setHoveredNode] = useState<DbtNodeData | null>(null);

  // Layout tracking — only re-run Dagre when models/edges change, not on highlight
  const prevFilterKey = useRef("");

  // Sync selectedModelId
  useEffect(() => {
    setActiveNodeId(selectedModelId ?? null);
  }, [selectedModelId]);

  // ─── Data Fetching ───────────────────────────────────

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setGraphLoading(true);
    setGraphError(null);

    if (!selectedModelId) {
      fetch("/api/lineage/all")
        .then((res) => res.json())
        .then((data) => {
          if (cancelled) return;
          setGraphModels(data.models || []);
          setGraphEdges(
            (data.edges || []).map((e: LineageGraphEdge) => ({
              id: `${e.source}->${e.target}`,
              source: e.source,
              target: e.target,
            }))
          );
        })
        .catch(() => {
          if (!cancelled)
            setGraphError("Failed to load project architecture");
        })
        .finally(() => {
          if (!cancelled) setGraphLoading(false);
        });
      return () => {
        cancelled = true;
      };
    }

    fetchLineage(selectedModelId, graphDepth)
      .then((data) => {
        if (cancelled) return;
        setGraphModels(
          (data.nodes ?? []).map(
            (n: LineageGraphNode): ModelSummary => ({
              unique_id: n.id,
              name: n.label,
              schema: n.schema,
              package_name: n.package_name,
              materialization: n.materialization,
              resource_type: n.resource_type,
              tags: n.tags,
              description: "",
            })
          )
        );
        setGraphEdges(
          (data.edges ?? []).map((e: LineageGraphEdge) => ({
            id: `${e.source}->${e.target}`,
            source: e.source,
            target: e.target,
          }))
        );
        setActiveNodeId(selectedModelId);
      })
      .catch((err) => {
        if (!cancelled)
          setGraphError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setGraphLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, selectedModelId, graphDepth]);

  // ─── Computed Values ─────────────────────────────────

  const allPackages = useMemo(
    () => [...new Set(graphModels.map((m) => m.package_name))],
    [graphModels]
  );
  const allTags = useMemo(
    () => [...new Set(graphModels.flatMap((m) => m.tags || []))],
    [graphModels]
  );

  const filteredModels = useMemo(() => {
    let result = graphModels;
    result = result.filter((m) => selectedResources.has(m.resource_type));
    if (selectedPackages.size > 0)
      result = result.filter((m) => selectedPackages.has(m.package_name));
    if (selectedTags.size > 0)
      result = result.filter((m) =>
        (m.tags || []).some((t) => selectedTags.has(t))
      );
    if (selectInput.trim())
      result = result.filter((m) =>
        m.name.toLowerCase().includes(selectInput.toLowerCase())
      );
    if (excludeInput.trim())
      result = result.filter(
        (m) => !m.name.toLowerCase().includes(excludeInput.toLowerCase())
      );
    return result.slice(0, 150);
  }, [
    graphModels,
    selectedResources,
    selectedPackages,
    selectedTags,
    selectInput,
    excludeInput,
  ]);

  const filteredEdgeData = useMemo(() => {
    const allowed = new Set(filteredModels.map((m) => m.unique_id));
    return graphEdges.filter(
      (e) => allowed.has(e.source) && allowed.has(e.target)
    );
  }, [graphEdges, filteredModels]);

  const highlightedLineage = useMemo(() => {
    if (!activeNodeId) return new Set<string>();
    return computeLineage(activeNodeId, filteredEdgeData);
  }, [activeNodeId, filteredEdgeData]);

  // ─── Build React Flow Nodes & Edges ──────────────────

  useEffect(() => {
    const filterKey =
      filteredModels.map((m) => m.unique_id).join(",") +
      "|" +
      filteredEdgeData.map((e) => e.id).join(",");
    const needsLayout = filterKey !== prevFilterKey.current;

    const hasHighlight = highlightedLineage.size > 0;

    const buildEdgeStyle = (e: { id: string; source: string; target: string }) => {
      const isHigh =
        highlightedLineage.has(e.source) && highlightedLineage.has(e.target);
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        animated: isHigh,
        style: {
          stroke: isHigh ? "#0ea5e9" : isDark ? "#334155" : "#cbd5e1",
          strokeWidth: isHigh ? 2.5 : 1.5,
          opacity: hasHighlight && !isHigh ? 0.12 : 1,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isHigh ? "#0ea5e9" : isDark ? "#475569" : "#94a3b8",
          width: 14,
          height: 10,
        },
      };
    };

    if (needsLayout) {
      prevFilterKey.current = filterKey;

      if (filteredModels.length === 0) {
        setNodes([]);
        setEdges([]);
        return;
      }

      const rfNodes: DbtNode[] = filteredModels.map((m) => ({
        id: m.unique_id,
        type: "dbtModel",
        position: { x: 0, y: 0 },
        data: {
          label: m.name,
          materialization: m.materialization,
          resourceType: m.resource_type,
          schema: m.schema,
          packageName: m.package_name,
          tags: m.tags || [],
          accentColor:
            MATERIALIZATION_COLORS[m.materialization] ||
            MATERIALIZATION_COLORS.default,
          isHighlighted: highlightedLineage.has(m.unique_id),
          isDimmed: hasHighlight && !highlightedLineage.has(m.unique_id),
          isActive: m.unique_id === activeNodeId,
          isDark,
        } satisfies DbtNodeData,
      }));

      const rfEdges: Edge[] = filteredEdgeData.map(buildEdgeStyle);

      const { nodes: layouted, edges: styledEdges } = getLayoutedElements(
        rfNodes,
        rfEdges
      );
      setNodes(layouted);
      setEdges(styledEdges);

      // Fit view after layout settles
      setTimeout(() => fitView({ padding: 0.12, duration: 400 }), 100);
    } else {
      // Only update highlighting — preserve node positions
      setNodes((nds) =>
        nds.map((n) => ({
          ...n,
          data: {
            ...n.data,
            isHighlighted: highlightedLineage.has(n.id),
            isDimmed: hasHighlight && !highlightedLineage.has(n.id),
            isActive: n.id === activeNodeId,
            isDark,
          },
        }))
      );
      setEdges((eds) =>
        eds.map((e) => buildEdgeStyle({ id: e.id, source: e.source, target: e.target }))
      );
    }
  }, [
    filteredModels,
    filteredEdgeData,
    highlightedLineage,
    activeNodeId,
    isDark,
    fitView,
    setNodes,
    setEdges,
  ]);

  // ─── Search ──────────────────────────────────────────

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return filteredModels
      .filter((m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .slice(0, 10);
  }, [searchQuery, filteredModels]);

  // ─── Handlers ────────────────────────────────────────

  const onNodeClick: NodeMouseHandler = useCallback((_event, node) => {
    setActiveNodeId((prev) => (prev === node.id ? null : node.id));
  }, []);

  const onNodeDoubleClick: NodeMouseHandler = useCallback(
    (_event, node) => {
      router.push(`/model/${encodeURIComponent(node.id)}`);
      onOpenChange(false);
    },
    [router, onOpenChange]
  );

  const onPaneClick = useCallback(() => {
    setActiveNodeId(null);
  }, []);

  const onNodeMouseEnter: NodeMouseHandler = useCallback((_event, node) => {
    setHoveredNode(node.data as DbtNodeData);
  }, []);

  const onNodeMouseLeave = useCallback(() => {
    setHoveredNode(null);
  }, []);

  const handleFocusNode = useCallback(
    (nodeId: string) => {
      setActiveNodeId(nodeId);
      const node = nodes.find((n) => n.id === nodeId);
      if (node) {
        setCenter(
          node.position.x + NODE_WIDTH / 2,
          node.position.y + NODE_HEIGHT / 2,
          { zoom: 1, duration: 500 }
        );
      }
    },
    [nodes, setCenter]
  );

  const adjustDepth = useCallback((delta: number) => {
    setGraphDepth((d) => Math.max(1, Math.min(4, d + delta)));
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!layoutRef.current) return;
    if (!document.fullscreenElement) {
      layoutRef.current.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
      setTimeout(() => fitView({ padding: 0.12, duration: 300 }), 200);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
      setTimeout(() => fitView({ padding: 0.12, duration: 300 }), 200);
    }
  }, [fitView]);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  useEffect(() => {
    if (open) setShowFilters(true);
  }, [open]);

  // ─── MiniMap ─────────────────────────────────────────

  const minimapNodeColor = useCallback((node: Node) => {
    const data = node.data as DbtNodeData;
    if (data?.isActive) return "#22c55e";
    return (
      MATERIALIZATION_COLORS[data?.materialization] ||
      MATERIALIZATION_COLORS.default
    );
  }, []);

  // ─── Render ──────────────────────────────────────────

  return (
    <div
      ref={layoutRef}
      className={cn(
        "flex flex-col flex-1 relative transition-all duration-500",
        isFullscreen && "h-full w-full rounded-none"
      )}
    >
      {/* ── Header ────────────────────────────────────── */}
      <div 
        className="flex items-center justify-between px-3 md:px-4 py-2 border-b z-10 backdrop-blur-sm shadow-sm"
        style={{ background: 'var(--semantic-surface-default)', borderColor: 'var(--semantic-border-subtle)' }}
      >
        <div className="flex items-center gap-1">
          <div className="flex flex-col">
            <h2 className="text-[11px] font-black uppercase tracking-[0.12em] flex items-center gap-1 text-[var(--semantic-text-strong)]">
              <GitBranch className="h-3.5 w-3.5 text-sky-500 dark:text-sky-400" />
              <span className="hidden sm:inline">Lineage</span>
            </h2>
            <span className="hidden sm:block text-[9px] font-mono text-muted-foreground uppercase tracking-wide leading-tight">
              {nodes.length} nodes
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon"
              className={cn(
                "h-6 w-6 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 hover:text-foreground",
                isFullscreen && "bg-sky-500/10 dark:bg-sky-500/20 text-sky-600 dark:text-sky-400"
              )}
              onClick={toggleFullscreen}
              title="Fullscreen"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 hover:text-foreground"
              onClick={() => fitView({ padding: 0.12, duration: 300 })}
              title="Fit View"
            >
              <Crosshair className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="hidden md:block h-4 w-px bg-border" />

          {/* Depth Controls — only when viewing single-model lineage */}
          {selectedModelId && (
            <>
              <div className="hidden md:flex items-center gap-0.5 bg-muted/50 rounded px-1 py-0.5 border border-border">
                <span className="text-[9px] text-muted-foreground">D</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 hover:text-foreground"
                  onClick={() => adjustDepth(-1)}
                  disabled={graphDepth <= 1}
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="text-[10px] font-mono font-bold text-foreground min-w-[14px] text-center">
                  {graphDepth}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 hover:text-foreground"
                  onClick={() => adjustDepth(1)}
                  disabled={graphDepth >= 4}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <div className="hidden md:block h-4 w-px bg-border" />
            </>
          )}

          {/* Close */}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10 hover:text-foreground"
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* ── Graph Area ────────────────────────────────── */}
      <div className="flex-1 relative overflow-hidden">
        {/* Search Trigger */}
        <button
          type="button"
          onClick={() => setSearchPanelOpen((o) => !o)}
          className="absolute top-3 right-3 md:top-4 md:right-4 z-30 h-9 w-9 bg-card/90 border border-border rounded-lg flex items-center justify-center hover:bg-sky-50 dark:hover:bg-sky-500/20 hover:border-sky-200 dark:hover:border-sky-500/40 hover:text-sky-600 dark:hover:text-sky-400 transition-all shadow-sm backdrop-blur-md"
          title="Search nodes (/)"
        >
          <Search className="h-4 w-4 text-foreground" />
        </button>

        {/* Search Panel */}
        {searchPanelOpen && (
          <div className="absolute bottom-4 right-4 z-30 w-64 max-h-[400px] bp-card shadow-2xl backdrop-blur-xl flex flex-col border-[var(--semantic-border-subtle)]">
            <div className="p-3 border-b border-[var(--semantic-border-subtle)]">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--semantic-text-body)]" />
                <Input
                  placeholder="Search node..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bp-input pl-9 h-8 w-full text-xs font-mono"
                  autoFocus
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
              {searchResults.length > 0 ? (
                searchResults.map((m) => (
                  <button
                    key={m.unique_id}
                    type="button"
                    onClick={() => {
                      handleFocusNode(m.unique_id);
                      setSearchPanelOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded text-xs text-foreground hover:bg-sky-50 dark:hover:bg-sky-500/20 hover:text-sky-600 transition-colors"
                  >
                    {m.name}
                  </button>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-muted-foreground">
                  No results
                </div>
              )}
            </div>
            <div className="p-2 border-t border-border text-[9px] text-muted-foreground text-center uppercase tracking-wider">
              {searchResults.length} nodes
            </div>
          </div>
        )}

        {/* Filters Toggle */}
        <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4 z-30">
          <Button
            variant="outline"
            size="sm"
            className={cn(
              "bg-card/90 border-border text-foreground hover:bg-sky-50 dark:hover:bg-sky-500/20 hover:text-sky-600 dark:hover:text-sky-400 hover:border-sky-200 dark:hover:border-sky-500/30 transition-all h-8 px-3 gap-1.5 backdrop-blur-xl shadow-xl",
              showFilters && "bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/30 text-sky-600 dark:text-sky-400"
            )}
            onClick={() => setShowFilters(!showFilters)}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {showFilters ? "Hide" : "Filters"}
            </span>
            <ChevronDown
              className={cn(
                "h-3 w-3 transition-transform",
                showFilters && "rotate-180"
              )}
            />
          </Button>
        </div>

        {/* React Flow Canvas */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          onNodeDoubleClick={onNodeDoubleClick}
          onNodeMouseEnter={onNodeMouseEnter}
          onNodeMouseLeave={onNodeMouseLeave}
          onPaneClick={onPaneClick}
          fitView
          fitViewOptions={{ padding: 0.12 }}
          proOptions={{ hideAttribution: true }}
          nodesConnectable={false}
          connectOnClick={false}
          deleteKeyCode={null}
          minZoom={0.05}
          maxZoom={3}
          style={{
            backgroundColor: isDark ? "#0b1221" : "#f8fafc",
          }}
          className="!outline-none"
        >
          <Background
            variant={BackgroundVariant.Dots}
            color={isDark ? "#1e293b" : "#cbd5e1"}
            gap={24}
            size={1}
          />
          <MiniMap
            nodeColor={minimapNodeColor}
            nodeStrokeWidth={0}
            nodeBorderRadius={2}
            maskColor={
              isDark ? "rgba(0,0,0,0.7)" : "rgba(255,255,255,0.7)"
            }
            style={{
              backgroundColor: isDark
                ? "rgba(10, 10, 15, 0.85)"
                : "rgba(255, 255, 255, 0.9)",
              border: isDark
                ? "1px solid rgba(255,255,255,0.05)"
                : "1px solid rgba(0,0,0,0.1)",
              borderRadius: 8,
            }}
            pannable
            zoomable
          />
        </ReactFlow>

        {/* Loading Overlay */}
        {graphLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 text-foreground text-sm font-mono z-40 backdrop-blur-sm">
            Loading lineage graph...
          </div>
        )}

        {/* Error Banner */}
        {graphError && (
          <div className="absolute inset-x-4 top-4 z-40 rounded-xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-destructive text-sm shadow">
            {graphError}
          </div>
        )}

        {/* Hover Tooltip */}
        {hoveredNode && (
          <div className="absolute bottom-6 left-6 bg-card/95 border border-border rounded-2xl p-6 shadow-2xl max-w-md animate-in slide-in-from-bottom-4 backdrop-blur-xl text-foreground z-30 pointer-events-none">
            <div className="flex items-center gap-2 mb-4">
              <div className="h-2.5 w-2.5 rounded-full bg-sky-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-500 dark:text-sky-400">
                Node Details
              </span>
            </div>
            <p className="font-black text-lg text-foreground tracking-tight mb-3">
              {hoveredNode.label}
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between py-2 border-b border-border gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">
                  Schema
                </span>
                <span className="font-mono text-xs text-foreground truncate text-right">
                  {hoveredNode.schema}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">
                  Package
                </span>
                <span className="font-mono text-xs text-foreground truncate text-right" title={hoveredNode.packageName}>
                  {hoveredNode.packageName}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-border gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">
                  Type
                </span>
                <span className="font-mono text-xs text-foreground capitalize truncate text-right">
                  {hoveredNode.materialization}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground shrink-0">
                  Resource
                </span>
                <span className="font-mono text-xs text-foreground capitalize truncate text-right">
                  {hoveredNode.resourceType}
                </span>
              </div>
              {hoveredNode.tags.length > 0 && (
                <div className="pt-3 mt-2 border-t border-border">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                    Tags
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {hoveredNode.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 text-[9px] font-bold uppercase tracking-wide"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Filters Bar ───────────────────────────────── */}
      <div
        className={cn(
          "flex items-center gap-4 px-4 py-3 bg-card border-t border-border transition-all duration-300 overflow-x-auto flex-shrink-0",
          !showFilters &&
            "max-h-0 py-0 border-t-0 opacity-0 pointer-events-none"
        )}
      >
        {/* Resources */}
        <div className="flex flex-col gap-1.5 min-w-[120px]">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
            resources
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center justify-between bg-muted/50 px-3 py-2 rounded border border-border cursor-pointer hover:bg-muted transition-colors">
                <span className="text-[11px] font-medium text-foreground">
                  {selectedResources.size === 3
                    ? "All selected"
                    : `${selectedResources.size} selected`}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-48 bg-popover border-border text-popover-foreground">
              {(["model", "seed", "snapshot"] as const).map((type) => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={selectedResources.has(type as ResourceType)}
                  onCheckedChange={() =>
                    setSelectedResources((prev) => {
                      const next = new Set(prev);
                      if (next.has(type as ResourceType))
                        next.delete(type as ResourceType);
                      else next.add(type as ResourceType);
                      return next;
                    })
                  }
                >
                  {type}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Packages */}
        <div className="flex flex-col gap-1.5 min-w-[140px]">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
            packages
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center justify-between bg-muted/50 px-3 py-2 rounded border border-border cursor-pointer hover:bg-muted transition-colors">
                <span className="text-[11px] font-medium text-foreground truncate max-w-[100px]">
                  {selectedPackages.size === 0
                    ? "All packages"
                    : `${selectedPackages.size} selected`}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-popover border-border text-popover-foreground max-h-64 overflow-y-auto custom-scrollbar">
              {allPackages.map((pkg) => (
                <DropdownMenuCheckboxItem
                  key={pkg}
                  checked={selectedPackages.has(pkg)}
                  onCheckedChange={() =>
                    setSelectedPackages((prev) => {
                      const next = new Set(prev);
                      if (next.has(pkg)) next.delete(pkg);
                      else next.add(pkg);
                      return next;
                    })
                  }
                >
                  {pkg}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tags */}
        <div className="flex flex-col gap-1.5 min-w-[120px]">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
            tags
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center justify-between bg-muted/50 px-3 py-2 rounded border border-border cursor-pointer hover:bg-muted transition-colors">
                <span className="text-[11px] font-medium text-foreground">
                  {selectedTags.size === 0
                    ? "All tags"
                    : `${selectedTags.size} selected`}
                </span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-popover border-border text-popover-foreground max-h-64 overflow-y-auto custom-scrollbar">
              {allTags.map((tag) => (
                <DropdownMenuCheckboxItem
                  key={tag}
                  checked={selectedTags.has(tag)}
                  onCheckedChange={() =>
                    setSelectedTags((prev) => {
                      const next = new Set(prev);
                      if (next.has(tag)) next.delete(tag);
                      else next.add(tag);
                      return next;
                    })
                  }
                >
                  {tag}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* --select */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
            --select
          </span>
          <Input
            placeholder="..."
            value={selectInput}
            onChange={(e) => setSelectInput(e.target.value)}
            className="h-9 bg-muted/50 border-border rounded text-[11px] font-mono px-3 focus:border-sky-500/50 transition-all text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* --exclude */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
          <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
            --exclude
          </span>
          <Input
            placeholder="..."
            value={excludeInput}
            onChange={(e) => setExcludeInput(e.target.value)}
            className="h-9 bg-muted/50 border-border rounded text-[11px] font-mono px-3 text-foreground placeholder:text-muted-foreground focus:border-sky-500/50"
          />
        </div>

        <div className="flex items-end h-full pt-4">
          <Button
            onClick={() => fitView({ padding: 0.12, duration: 300 })}
            className="h-9 bg-transparent hover:bg-muted text-muted-foreground hover:text-foreground rounded border border-border px-4 text-[11px] font-bold uppercase tracking-wider transition-all"
          >
            Re-center
          </Button>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 text-muted-foreground hover:bg-muted hover:text-foreground ml-auto"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ─── Exported Component ──────────────────────────────────

export function LineageGraph(props: LineageGraphProps) {
  const dialogClasses = cn(
    "p-0 gap-0 overflow-hidden bg-background dark:bg-slate-950 border-sky-200 dark:border-slate-900 shadow-2xl flex flex-col",
    "w-[98vw] max-w-[98vw] sm:max-w-[95vw] md:max-w-[92vw] lg:max-w-[90vw] h-[95vh] md:h-[90vh]",
    "!rounded-xl"
  );

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className={dialogClasses}>
        <DialogTitle className="sr-only">Lineage Graph</DialogTitle>
        <DialogDescription className="sr-only">
          Interactive visualization of model dependencies and lineage.
        </DialogDescription>
        <ReactFlowProvider>
          <LineageGraphInner {...props} />
        </ReactFlowProvider>
      </DialogContent>
    </Dialog>
  );
}
