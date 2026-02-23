"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import {
  X,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Search,
  ChevronDown,
  RefreshCw,
  GitBranch,
  Crosshair,
  Plus,
  Minus,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

// Constants - Optimized for readability with larger nodes and better spacing
const NODE_WIDTH = 220;
const NODE_HEIGHT = 48;
const ARROW_SIZE = 8;
const LEVEL_GAP_X = 320;
const NODE_GAP_Y = 80;
const GRID_SIZE = 0;

// Theme Colors
const getThemeColors = (theme: string | undefined) => {
  const isDark = theme === "dark";
  return {
    BG_COLOR: isDark ? "#0f172a" : "#f8fafc",
    NODE_COLOR: isDark ? "#1e293b" : "#ffffff",
    TEXT_COLOR: isDark ? "#f1f5f9" : "#0f172a",
    EDGE_COLOR: isDark ? "#334155" : "#cbd5e1",
    NODE_HOVER_COLOR: isDark ? "#0c4a6e" : "#e0f2fe",
    EDGE_HIGHLIGHT_COLOR: "#0ea5e9"
  };
};

const NODE_SELECTED_COLOR = "#22c55e"; // Emerald 500 for selected

const MATERIALIZATION_COLORS: Record<string, string> = {
  table: "#10b981", // Emerald 500
  view: "#0ea5e9", // Sky 500
  incremental: "#6366f1", // Indigo 500
  snapshot: "#ec4899", // Pink 500
  seed: "#f59e0b", // Amber 500
  default: "#94a3b8", // Slate 400
};

// Polyfill for roundRect to support older browsers
if (typeof window !== 'undefined' && typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x: number, y: number, w: number, h: number, r: any) {
    if (typeof r === 'number') r = [r, r, r, r];
    this.beginPath();
    this.moveTo(x + r[0], y);
    this.lineTo(x + w - r[1], y);
    this.quadraticCurveTo(x + w, y, x + w, y + r[1]);
    this.lineTo(x + w, y + h - r[2]);
    this.quadraticCurveTo(x + w, y + h, x + w - r[2], y + h);
    this.lineTo(x + r[3], y + h);
    this.quadraticCurveTo(x, y + h, x, y + h - r[3]);
    this.lineTo(x, y + r[0]);
    this.quadraticCurveTo(x, y, x + r[0], y);
    this.closePath();
    return this;
  };
}

interface GraphNode {
  id: string;
  label: string;
  materialization: Materialization;
  resourceType: ResourceType;
  schema: string;
  package: string;
  tags: string[];
  x: number;
  y: number;
  level: number;
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
}

interface LineageGraphProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  models: ModelSummary[];
  selectedModelId?: string | null;
}

// Build a DAG with hierarchical layout
function buildDAGLayout(
  models: ModelSummary[],
  edges: GraphEdge[],
  canvasWidth: number,
  canvasHeight: number
): GraphNode[] {
  if (models.length === 0) return [];

  const nodeMap = new Map<string, GraphNode>();
  const inDegree = new Map<string, number>();
  const outEdges = new Map<string, string[]>();

  models.forEach((m) => {
    nodeMap.set(m.unique_id, {
      id: m.unique_id,
      label: m.name,
      materialization: m.materialization,
      resourceType: m.resource_type,
      schema: m.schema,
      package: m.package_name,
      tags: m.tags,
      x: 0,
      y: 0,
      level: 0,
    });
    inDegree.set(m.unique_id, 0);
    outEdges.set(m.unique_id, []);
  });

  edges.forEach((e) => {
    if (nodeMap.has(e.source) && nodeMap.has(e.target)) {
      outEdges.get(e.source)?.push(e.target);
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    }
  });

  const queue: string[] = [];
  nodeMap.forEach((_, id) => {
    if (inDegree.get(id) === 0) queue.push(id);
  });

  const levels: string[][] = [];
  while (queue.length > 0) {
    const levelNodes: string[] = [];
    const levelSize = queue.length;
    for (let i = 0; i < levelSize; i++) {
      const nodeId = queue.shift()!;
      levelNodes.push(nodeId);
      nodeMap.get(nodeId)!.level = levels.length;
      outEdges.get(nodeId)?.forEach((targetId) => {
        const newDegree = (inDegree.get(targetId) || 1) - 1;
        inDegree.set(targetId, newDegree);
        if (newDegree === 0) queue.push(targetId);
      });
    }
    if (levelNodes.length > 0) levels.push(levelNodes);
  }

  nodeMap.forEach((node, id) => {
    if (!levels.flat().includes(id)) {
      if (levels.length === 0) levels.push([]);
      levels[levels.length - 1].push(id);
      node.level = levels.length - 1;
    }
  });

  const totalWidth = levels.length * LEVEL_GAP_X;
  const startX = Math.max(100, (canvasWidth - totalWidth) / 2);

  levels.forEach((levelNodes, levelIdx) => {
    const totalHeight = levelNodes.length * NODE_GAP_Y;
    const startY = Math.max(80, (canvasHeight - totalHeight) / 2);
    levelNodes.forEach((nodeId, nodeIdx) => {
      const node = nodeMap.get(nodeId)!;
      node.x = startX + levelIdx * LEVEL_GAP_X;
      node.y = startY + nodeIdx * NODE_GAP_Y;
    });
  });

  return Array.from(nodeMap.values());
}

export function LineageGraph({
  open,
  onOpenChange,
  models,
  selectedModelId,
}: LineageGraphProps) {
  const { theme } = useTheme();
  const colors = useMemo(() => getThemeColors(theme), [theme]);

  const router = useRouter();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const layoutRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [graphModels, setGraphModels] = useState<ModelSummary[]>(models);
  const [graphEdges, setGraphEdges] = useState<GraphEdge[]>([]);
  const [graphDepth, setGraphDepth] = useState(2);
  const [graphLoading, setGraphLoading] = useState(false);
  const [graphError, setGraphError] = useState<string | null>(null);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(selectedModelId ?? null);

  const [dimensions, setDimensions] = useState({ width: 1200, height: 700 });
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 0.8 });
  const [dragging, setDragging] = useState<{ startX: number; startY: number } | null>(null);
  const [draggingNode, setDraggingNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchPanelOpen, setSearchPanelOpen] = useState(false);
  const [animationFrame, setAnimationFrame] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isAutoLayout, setIsAutoLayout] = useState(true);
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [showFilters, setShowFilters] = useState(true);

  // Filters
  const [selectedResources, setSelectedResources] = useState<Set<ResourceType>>(new Set(["model", "seed", "snapshot"]));
  const [selectedPackages, setSelectedPackages] = useState<Set<string>>(new Set());
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [selectInput, setSelectInput] = useState("");
  const [excludeInput, setExcludeInput] = useState("");

  useEffect(() => {
    setActiveNodeId(selectedModelId ?? null);
  }, [selectedModelId]);

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setGraphLoading(true);
    setGraphError(null);

    // If no model is selected, fetch complete project architecture
    if (!selectedModelId) {
      fetch('/api/lineage/all')
        .then(res => res.json())
        .then((data) => {
          if (cancelled) return;

          // Set all models and edges for global view
          setGraphModels(data.models || []);
          setGraphEdges(data.edges || []);
        })
        .catch((err) => {
          if (!cancelled) {
            console.error("Failed to load full project graph:", err);
            setGraphError("Failed to load project architecture");
          }
        })
        .finally(() => {
          if (!cancelled) setGraphLoading(false);
        });

      return () => { cancelled = true; };
    }

    // If a specific model is selected, fetch its lineage
    fetchLineage(selectedModelId, graphDepth)
      .then((data) => {
        if (cancelled) return;

        const nodes = (data.nodes ?? []).map((n: LineageGraphNode): ModelSummary => ({
          unique_id: n.id,
          name: n.label,
          schema: n.schema,
          package_name: n.package_name,
          materialization: n.materialization,
          resource_type: n.resource_type,
          tags: n.tags,
          description: "",
        }));

        const edges = (data.edges ?? []).map((e: LineageGraphEdge) => ({
          id: `${e.source}->${e.target}`,
          source: e.source,
          target: e.target,
        }));

        setGraphModels(nodes);
        setGraphEdges(edges);
        setActiveNodeId(selectedModelId);
      })
      .catch((err) => {
        if (cancelled) return;
        setGraphError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setGraphLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, selectedModelId, graphDepth]);

  const allPackages = useMemo(() => [...new Set(graphModels.map((m) => m.package_name))], [graphModels]);
  const allTags = useMemo(() => [...new Set(graphModels.flatMap((m) => m.tags || []))], [graphModels]);

  const filteredModels = useMemo(() => {
    let result = graphModels;
    result = result.filter((m) => selectedResources.has(m.resource_type));
    if (selectedPackages.size > 0) result = result.filter((m) => selectedPackages.has(m.package_name));
    if (selectedTags.size > 0) result = result.filter((m) => (m.tags || []).some((t) => selectedTags.has(t)));
    if (selectInput.trim()) result = result.filter((m) => m.name.toLowerCase().includes(selectInput.toLowerCase()));
    if (excludeInput.trim()) result = result.filter((m) => !m.name.toLowerCase().includes(excludeInput.toLowerCase()));
    return result.slice(0, 150);
  }, [graphModels, selectedResources, selectedPackages, selectedTags, selectInput, excludeInput]);

  const edges = useMemo(() => {
    const allowed = new Set(filteredModels.map((m) => m.unique_id));
    return graphEdges.filter((e) => allowed.has(e.source) && allowed.has(e.target));
  }, [graphEdges, filteredModels]);

  // Initialize and update nodes layout
  useEffect(() => {
    if (isAutoLayout) {
      const layoutNodes = buildDAGLayout(filteredModels, edges, dimensions.width * 2, dimensions.height * 2);
      setNodes(layoutNodes);
    }
  }, [filteredModels, edges, dimensions, isAutoLayout]);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return nodes.filter((n) => n.label.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 10);
  }, [searchQuery, nodes]);

  const highlightedLineage = useMemo(() => {
    const activeId = activeNodeId || hoveredNode?.id;
    if (!activeId) return new Set<string>();

    const connectedNodes = new Set<string>([activeId]);
    const adj = new Map<string, string[]>();
    const revAdj = new Map<string, string[]>();

    edges.forEach(e => {
      if (!adj.has(e.source)) adj.set(e.source, []);
      if (!revAdj.has(e.target)) revAdj.set(e.target, []);
      adj.get(e.source)?.push(e.target);
      revAdj.get(e.target)?.push(e.source);
    });

    const stack = [activeId];
    while (stack.length > 0) {
      const curr = stack.pop()!;
      revAdj.get(curr)?.forEach(parent => {
        if (!connectedNodes.has(parent)) { connectedNodes.add(parent); stack.push(parent); }
      });
    }
    stack.push(activeId);
    while (stack.length > 0) {
      const curr = stack.pop()!;
      adj.get(curr)?.forEach(child => {
        if (!connectedNodes.has(child)) { connectedNodes.add(child); stack.push(child); }
      });
    }
    return connectedNodes;
  }, [activeNodeId, hoveredNode, edges]);

  // Center logic
  const centerNode = useCallback((nodeId: string) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      setTransform({
        x: dimensions.width / 2 - node.x * transform.scale,
        y: dimensions.height / 2 - node.y * transform.scale,
        scale: transform.scale,
      });
    }
  }, [nodes, dimensions, transform.scale]);

  const adjustDepth = useCallback((delta: number) => {
    setGraphDepth((d) => Math.max(1, Math.min(4, d + delta)));
  }, []);

  useEffect(() => {
    if (!searchQuery.trim()) return;
    const match = nodes.find((n) => n.label.toLowerCase().includes(searchQuery.toLowerCase()));
    if (match) {
      setActiveNodeId(match.id);
      centerNode(match.id);
    }
  }, [searchQuery, nodes, centerNode]);

  const handleFit = useCallback(() => {
    if (nodes.length === 0) return;
    const minX = Math.min(...nodes.map(n => n.x - NODE_WIDTH / 2));
    const maxX = Math.max(...nodes.map(n => n.x + NODE_WIDTH / 2));
    const minY = Math.min(...nodes.map(n => n.y - NODE_HEIGHT / 2));
    const maxY = Math.max(...nodes.map(n => n.y + NODE_HEIGHT / 2));
    const graphW = maxX - minX;
    const graphH = maxY - minY;
    const padding = 100;
    const scale = Math.min(0.8, (dimensions.width - padding) / graphW, (dimensions.height - padding) / graphH);
    setTransform({
      x: dimensions.width / 2 - (minX + graphW / 2) * scale,
      y: dimensions.height / 2 - (minY + graphH / 2) * scale,
      scale
    });
  }, [nodes, dimensions]);

  // Animation Loop
  useEffect(() => {
    let frame: number;
    const animate = () => {
      setAnimationFrame(prev => prev + 1);
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  // Dimensions (no callbacks here to avoid circular updates)
  useEffect(() => {
    if (!open) return;
    const update = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      } else if (layoutRef.current) {
        setDimensions({
          width: layoutRef.current.clientWidth,
          height: layoutRef.current.clientHeight,
        });
      }
    };
    update();
    window.addEventListener("resize", update);
    const timer = setTimeout(update, 100);
    return () => { window.removeEventListener("resize", update); clearTimeout(timer); };
  }, [open]);

  // Recalculate dimensions on fullscreen toggle to keep coordinates aligned
  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      } else if (layoutRef.current) {
        setDimensions({
          width: layoutRef.current.clientWidth,
          height: layoutRef.current.clientHeight,
        });
      }
    };
    const timer = setTimeout(update, 50);
    return () => clearTimeout(timer);
  }, [isFullscreen]);

  // Initial fit/center when opening or when selected model changes
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      if (activeNodeId) centerNode(activeNodeId);
      else handleFit();
    }, 150);
    return () => clearTimeout(timer);
  }, [open, activeNodeId, centerNode, handleFit, nodes]);

  // Ensure filters are visible when opening the graph
  useEffect(() => {
    if (open) setShowFilters(true);
  }, [open]);

  // Canvas Drawing
  const drawEdge = useCallback((ctx: CanvasRenderingContext2D, s: GraphNode, t: GraphNode, highlight: boolean, dimmed: boolean) => {
    const { x: sx, y: sy } = s;
    const { x: tx, y: ty } = t;
    const startX = sx + NODE_WIDTH / 2;
    const startY = sy + NODE_HEIGHT / 2;
    const endX = tx - NODE_WIDTH / 2;
    const endY = ty + NODE_HEIGHT / 2;
    const midX = (startX + endX) / 2;

    // Draw Bezier Path - Improved visibility with better contrast
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(midX, startY, midX, endY, endX, endY);
    ctx.strokeStyle = highlight ? colors.EDGE_HIGHLIGHT_COLOR : colors.EDGE_COLOR;
    ctx.lineWidth = highlight ? 3 : 2;
    ctx.stroke();

    if (highlight) {
      // Animated dash for highlighted edges
      ctx.setLineDash([6, 8]);
      ctx.lineDashOffset = -animationFrame * 0.5;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 3.5;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineWidth = 3;
    }

    if (!dimmed) {
      const angle = Math.atan2(endY - startY, endX - midX);
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX - ARROW_SIZE * Math.cos(angle - Math.PI / 6), endY - ARROW_SIZE * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(endX - ARROW_SIZE * Math.cos(angle + Math.PI / 6), endY - ARROW_SIZE * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fillStyle = highlight ? colors.EDGE_HIGHLIGHT_COLOR : "rgba(255,255,255,0.2)";
      ctx.fill();
    }
  }, [animationFrame, colors]);

  const drawNode = useCallback((ctx: CanvasRenderingContext2D, node: GraphNode, isSel: boolean, isHov: boolean, isHigh: boolean, isDim: boolean, scale: number) => {
    const x = node.x - NODE_WIDTH / 2;
    const y = node.y - NODE_HEIGHT / 2;
    const opacity = isDim ? (theme === 'dark' ? 0.15 : 0.2) : 1;
    ctx.globalAlpha = opacity;

    // LOD Level 1: Skip shadows if not selected/hovered or if too zoomed out
    if ((isSel || isHov) && scale > 0.3) {
      ctx.shadowColor = isSel ? NODE_SELECTED_COLOR : "rgba(34, 211, 238, 0.4)";
      ctx.shadowBlur = isSel ? 30 : 20;
    } else {
      ctx.shadowBlur = 0;
    }

    ctx.beginPath();
    ctx.roundRect(x, y, NODE_WIDTH, NODE_HEIGHT, 8);
    ctx.fillStyle = isSel ? NODE_SELECTED_COLOR : (isHov || isHigh) ? colors.NODE_HOVER_COLOR : (theme === 'dark' ? "rgba(30, 41, 59, 0.9)" : "rgba(91, 165, 189, 0.85)");
    ctx.fill();

    // LOD Level 2: Skip border and text at very small scales
    if (scale > 0.15) {
      ctx.strokeStyle = isSel ? "#16a34a" : "rgba(255, 255, 255, 0.1)";
      ctx.lineWidth = isSel ? 2.5 : 1;
      ctx.stroke();

      // Accent Bar for Materialization Type
      const matColor = MATERIALIZATION_COLORS[node.materialization] || MATERIALIZATION_COLORS.default;
      ctx.fillStyle = matColor;
      // Draw a thin colored bar on the left side
      ctx.beginPath();
      // Using roundRect for the left side accent
      // We clip this region or just draw it over the left part
      const accentWidth = 4;
      // Manually drawing a rounded left rect
      ctx.roundRect(x, y, accentWidth, NODE_HEIGHT, [8, 0, 0, 8]);
      ctx.fill();

      // LOD Level 3: Render text only if identifiable
      if (scale > 0.25 || isSel) {
        ctx.fillStyle = isSel ? "#0a1f2a" : colors.TEXT_COLOR;
        ctx.font = "bold 13px 'Geist', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        const maxWidth = NODE_WIDTH - 20;
        let displayText = node.label.toLowerCase();

        // Truncate logic
        if (ctx.measureText(displayText).width > maxWidth) {
          while (ctx.measureText(displayText).width > maxWidth - 10 && displayText.length > 0) {
            displayText = displayText.slice(0, -1);
          }
          displayText += '...';
        }
        // Offset text slightly to right due to accent bar
        ctx.fillText(displayText, x + NODE_WIDTH / 2 + 2, y + NODE_HEIGHT / 2);
      }
    }

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = dimensions.width * dpr;
    canvas.height = dimensions.height * dpr;
    ctx.scale(dpr, dpr);

    // Fondo sólido y limpio como en la imagen
    ctx.fillStyle = colors.BG_COLOR;
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    ctx.save();
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.scale, transform.scale);

    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const activeContext = highlightedLineage.size > 0 || searchResults.length > 0;
    const searchMatchIds = new Set(searchResults.map(r => r.id));

    // Calculate viewport bounds in world coordinates for culling
    const viewportMinX = -transform.x / transform.scale;
    const viewportMinY = -transform.y / transform.scale;
    const viewportMaxX = (dimensions.width - transform.x) / transform.scale;
    const viewportMaxY = (dimensions.height - transform.y) / transform.scale;
    const padding = 100; // Buffer for smooth culling

    edges.forEach(e => {
      const s = nodeMap.get(e.source);
      const t = nodeMap.get(e.target);
      if (s && t) {
        // Culling Check: Is any part of the edge in the viewport?
        const isVisible = !(
          Math.max(s.x, t.x) < viewportMinX - padding ||
          Math.min(s.x, t.x) > viewportMaxX + padding ||
          Math.max(s.y, t.y) < viewportMinY - padding ||
          Math.min(s.y, t.y) > viewportMaxY + padding
        );

        if (isVisible) {
          const high = highlightedLineage.has(s.id) && highlightedLineage.has(t.id);
          const dim = activeContext && !high;
          drawEdge(ctx, s, t, high, dim);
        }
      }
    });

    nodes.forEach(n => {
      // Culling Check: Is node in viewport?
      const isVisible = (
        n.x + NODE_WIDTH / 2 > viewportMinX - padding &&
        n.x - NODE_WIDTH / 2 < viewportMaxX + padding &&
        n.y + NODE_HEIGHT / 2 > viewportMinY - padding &&
        n.y - NODE_HEIGHT / 2 < viewportMaxY + padding
      );

      if (isVisible) {
        const isSel = n.id === activeNodeId;
        const isHov = hoveredNode?.id === n.id;
        const isHigh = highlightedLineage.has(n.id);
        const isMatch = searchMatchIds.has(n.id);
        const dim = activeContext && !isHigh && !isMatch;
        drawNode(ctx, n, isSel, isHov, isHigh || isMatch, dim, transform.scale);
      }
    });

    ctx.restore();

    // Minimap Render
    if (nodes.length > 0) {
      const miniMapW = 180;
      const miniMapH = 120;
      const miniMapX = 20; // Moved to left side
      const miniMapY = 20;

      ctx.save();
      // Minimap Background Glass
      ctx.fillStyle = "rgba(10, 10, 15, 0.8)";
      ctx.beginPath();
      ctx.roundRect(miniMapX, miniMapY, miniMapW, miniMapH, 4);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.stroke();

      // Mini HUD borders (top-left and bottom-right corners)
      ctx.strokeStyle = "rgba(255,255,255,0.2)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      // TL corner (top-left)
      ctx.moveTo(miniMapX, miniMapY + 8);
      ctx.lineTo(miniMapX, miniMapY);
      ctx.lineTo(miniMapX + 8, miniMapY);
      // BR corner (bottom-right)
      ctx.moveTo(miniMapX + miniMapW - 8, miniMapY + miniMapH);
      ctx.lineTo(miniMapX + miniMapW, miniMapY + miniMapH);
      ctx.lineTo(miniMapX + miniMapW, miniMapY + miniMapH - 8);
      ctx.stroke();

      // Find viewport in world coordinates
      const worldMinX = Math.min(...nodes.map(n => n.x)) - 300;
      const worldMaxX = Math.max(...nodes.map(n => n.x)) + 300;
      const worldMinY = Math.min(...nodes.map(n => n.y)) - 300;
      const worldMaxY = Math.max(...nodes.map(n => n.y)) + 300;
      const worldW = worldMaxX - worldMinX;
      const worldH = worldMaxY - worldMinY;
      const miniScale = Math.min(miniMapW / worldW, miniMapH / worldH) * 0.9;

      // Draw Nodes in Minimap
      nodes.forEach(n => {
        const mx = miniMapX + (n.x - worldMinX) * miniScale + (miniMapW - worldW * miniScale) / 2;
        const my = miniMapY + (n.y - worldMinY) * miniScale + (miniMapH - worldH * miniScale) / 2;
        ctx.fillStyle = n.id === activeNodeId ? NODE_SELECTED_COLOR : "rgba(91, 165, 189, 0.5)";
        ctx.beginPath();
        ctx.arc(mx, my, 2, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw Viewport Rect
      const vpX = miniMapX + ((-transform.x / transform.scale) - worldMinX) * miniScale + (miniMapW - worldW * miniScale) / 2;
      const vpY = miniMapY + ((-transform.y / transform.scale) - worldMinY) * miniScale + (miniMapH - worldH * miniScale) / 2;
      const vpW = (dimensions.width / transform.scale) * miniScale;
      const vpH = (dimensions.height / transform.scale) * miniScale;
      ctx.strokeStyle = NODE_SELECTED_COLOR;
      ctx.lineWidth = 2;
      ctx.strokeRect(vpX, vpY, vpW, vpH);
      ctx.restore();
    }
  }, [nodes, edges, transform, dimensions, animationFrame, highlightedLineage, searchResults, drawEdge, drawNode, selectedModelId, hoveredNode]);

  // Interactivity
  const screenToWorld = useCallback((sx: number, sy: number) => {
    // Use canvas bounds directly; getBoundingClientRect aligns with pointer events
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: (sx - rect.left - transform.x) / transform.scale, y: (sy - rect.top - transform.y) / transform.scale };
  }, [transform]);

  const findNode = useCallback((wx: number, wy: number) => {
    return nodes.find(n => Math.abs(n.x - wx) < NODE_WIDTH / 2 && Math.abs(n.y - wy) < NODE_HEIGHT / 2);
  }, [nodes]);

  const onMouseDown = (e: React.MouseEvent) => {
    const world = screenToWorld(e.clientX, e.clientY);
    const node = findNode(world.x, world.y);
    if (node) {
      setDraggingNode(node.id);
      setIsAutoLayout(false); // Switch to manual when dragging starts
      // No auto-zoom - user controls zoom manually
    } else {
      setDragging({ startX: e.clientX, startY: e.clientY });
    }
  };

  const onMouseMove = (e: React.MouseEvent) => {
    const world = screenToWorld(e.clientX, e.clientY);
    setHoveredNode(findNode(world.x, world.y) || null);

    if (draggingNode) {
      setNodes(prev => prev.map(n =>
        n.id === draggingNode ? { ...n, x: world.x, y: world.y } : n
      ));
    } else if (dragging) {
      const deltaX = e.clientX - dragging.startX;
      const deltaY = e.clientY - dragging.startY;
      setTransform(t => ({ ...t, x: t.x + deltaX, y: t.y + deltaY }));
      setDragging({ startX: e.clientX, startY: e.clientY });
    }
  };

  const onMouseUp = () => {
    setDragging(null);
    setDraggingNode(null);
  };
  const onWheel = (e: React.WheelEvent) => {
    const delta = e.deltaY > 0 ? 0.95 : 1.05;
    setTransform(t => ({ ...t, scale: Math.max(0.15, Math.min(3, t.scale * delta)) }));
  };
  const onDblClick = (e: React.MouseEvent) => {
    const world = screenToWorld(e.clientX, e.clientY);
    const node = findNode(world.x, world.y);
    if (node) { router.push(`/model/${encodeURIComponent(node.id)}`); onOpenChange(false); }
  };

  const toggleFullscreen = () => {
    if (!layoutRef.current) return;
    if (!document.fullscreenElement) {
      layoutRef.current.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
      });
      setIsFullscreen(true);
      setTimeout(handleFit, 200); // Re-center once in fullscreen
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
      setTimeout(handleFit, 200);
    }
  };

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const dialogClasses = cn(
    "p-0 gap-0 overflow-hidden bg-background dark:bg-slate-950 border-sky-200 dark:border-slate-900 shadow-2xl flex flex-col",
    isFullscreen
      ? "!top-0 !left-0 !translate-x-0 !translate-y-0 !max-w-none !w-screen !h-screen !rounded-none"
      : "max-w-[98vw] w-[1920px] h-[95vh]"
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={dialogClasses}>
        <DialogTitle className="sr-only">Lineage Graph</DialogTitle>
        <DialogDescription className="sr-only">
          Interactive visualization of model dependencies and lineage.
        </DialogDescription>
        <div
          ref={layoutRef}
          className={cn(
            "flex flex-col flex-1 dark-section relative transition-all duration-500",
            isFullscreen && "h-full w-full rounded-none"
          )}
        >
          {/* Compact Header */}
          <div className="flex items-center justify-between px-3 md:px-4 py-2 bg-slate-900/95 border-b dark-section-border z-10 backdrop-blur-sm">
            <div className="flex items-center gap-1">
              <div className="flex flex-col">
                <h2 className="text-[11px] font-black uppercase tracking-[0.12em] flex items-center gap-1 text-white">
                  <GitBranch className="h-3.5 w-3.5 text-sky-400" />
                  <span className="hidden sm:inline">Lineage</span>
                </h2>
                <span className="hidden sm:block text-[9px] font-mono text-slate-500 uppercase tracking-wide leading-tight">
                  {nodes.length} nodes
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {/* Zoom Controls - Ultra Compact */}
              <div className="hidden md:flex items-center gap-0.5 bg-slate-800/60 rounded px-1 py-0.5 border border-slate-700">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-slate-400 hover:bg-sky-500/20 hover:text-sky-400"
                  onClick={() => setTransform(t => ({ ...t, scale: Math.max(0.1, t.scale - 0.2) }))}
                  title="Zoom Out (-)"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="text-[10px] font-mono text-slate-300 min-w-[38px] text-center px-1">
                  {Math.round(transform.scale * 100)}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-slate-400 hover:bg-sky-500/20 hover:text-sky-400"
                  onClick={() => setTransform(t => ({ ...t, scale: Math.min(3, t.scale + 0.2) }))}
                  title="Zoom In (+)"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              {/* Divider */}
              <div className="hidden md:block h-4 w-px bg-slate-700/50" />

              {/* Action Buttons - Compact */}
              <div className="hidden md:flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-6 w-6 text-slate-400 hover:bg-sky-500/20 hover:text-sky-400",
                    isFullscreen && "bg-sky-500/20 text-sky-400"
                  )}
                  onClick={toggleFullscreen}
                  title="Fullscreen (F)"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-6 w-6 text-slate-400 hover:bg-sky-500/20 hover:text-sky-400",
                    !isAutoLayout && "bg-sky-500/20 text-sky-400"
                  )}
                  onClick={() => setIsAutoLayout(!isAutoLayout)}
                  title="Auto Layout (A)"
                >
                  <RefreshCw className={cn("h-3.5 w-3.5", !isAutoLayout && "animate-[spin_3s_linear_infinite]")} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-slate-400 hover:bg-sky-500/20 hover:text-sky-400"
                  onClick={() => activeNodeId && centerNode(activeNodeId)}
                  title="Re-center (C)"
                >
                  <Crosshair className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Divider */}
              <div className="hidden md:block h-4 w-px bg-slate-700/50" />

              {/* Depth Controls - Ultra Compact */}
              <div className="hidden md:flex items-center gap-0.5 bg-slate-800/60 rounded px-1 py-0.5 border border-slate-700">
                <span className="text-[9px] text-slate-400">D</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-slate-400 hover:bg-sky-500/20 hover:text-sky-400"
                  onClick={() => adjustDepth(-1)}
                  disabled={graphDepth <= 1}
                  title="Decrease Depth"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="text-[10px] font-mono font-bold text-slate-200 min-w-[14px] text-center">
                  {graphDepth}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-slate-400 hover:bg-sky-500/20 hover:text-sky-400"
                  onClick={() => adjustDepth(1)}
                  disabled={graphDepth >= 4}
                  title="Increase Depth"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>

              {/* Divider */}
              <div className="hidden md:block h-4 w-px bg-slate-700/50" />

              {/* Close Button - Compact */}
              <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-400 hover:text-white hover:bg-white/10" onClick={() => onOpenChange(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div
            ref={containerRef}
            className="flex-1 relative overflow-hidden group/canvas bg-[#0b1221]"
          >

            {/* Floating Filters Toggle - Bottom Left */}
            <div className="absolute bottom-3 left-3 md:bottom-4 md:left-4 z-30">
              <Button
                variant="outline"
                size="sm"
                className={cn(
                  "bg-slate-900/90 border-slate-700/50 text-slate-300 hover:bg-sky-500/20 hover:text-sky-400 hover:border-sky-500/30 transition-all h-8 px-3 gap-1.5 backdrop-blur-xl shadow-xl",
                  showFilters && "bg-sky-500/10 border-sky-500/30 text-sky-400"
                )}
                onClick={() => setShowFilters(!showFilters)}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider">
                  {showFilters ? "Hide" : "Filters"}
                </span>
                <ChevronDown className={cn("h-3 w-3 transition-transform", showFilters && "rotate-180")} />
              </Button>
            </div>

            {/* Floating Search Trigger - Top Right */}
            <button
              type="button"
              onClick={() => setSearchPanelOpen((open) => !open)}
              className="absolute top-3 right-3 md:top-4 md:right-4 z-30 h-9 w-9 bg-slate-900/90 border border-slate-700 rounded-lg flex items-center justify-center hover:bg-sky-500/20 hover:border-sky-500/40 transition-all"
              title="Search nodes (/)">
              <Search className="h-4 w-4 text-slate-300" />
            </button>

            {/* Floating Search Panel - Bottom Right */}
            {searchPanelOpen && (
              <div className="absolute bottom-4 right-4 z-30 w-64 max-h-[400px] bg-slate-900/95 border border-slate-700 rounded-xl shadow-2xl backdrop-blur-xl flex flex-col">
                <div className="p-3 border-b border-slate-800">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
                    <Input
                      placeholder="Buscar nodo..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-9 h-8 bg-slate-800/60 border-slate-700 rounded-md text-xs font-mono text-white placeholder:text-slate-500"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                  {searchResults.length > 0 ? (
                    searchResults.map(n => (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => {
                          setActiveNodeId(n.id);
                          centerNode(n.id);
                          setSearchPanelOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded text-xs text-white hover:bg-sky-500/20 transition-colors"
                      >
                        {n.label}
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-slate-500">No results</div>
                  )}
                </div>
                <div className="p-2 border-t border-slate-800 text-[9px] text-slate-500 text-center uppercase tracking-wider">
                  {searchResults.length} nodes
                </div>
              </div>
            )}

            <canvas
              ref={canvasRef}
              className="w-full h-full cursor-grab active:cursor-grabbing"
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
              onWheel={onWheel}
              onDoubleClick={onDblClick}
            />
            {graphLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 text-slate-100 text-sm font-mono z-40">
                Loading lineage graph...
              </div>
            )}
            {graphError && (
              <div className="absolute inset-x-4 top-4 z-40 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-red-700 text-sm shadow">
                {graphError}
              </div>
            )}
            {hoveredNode && (
              <div className="absolute bottom-6 left-6 bg-slate-900/90 border border-slate-700/60 rounded-2xl p-6 shadow-2xl max-w-md animate-in slide-in-from-bottom-4 backdrop-blur-xl text-white">
                <div className="flex items-center gap-2 mb-4">
                  <div className="h-2.5 w-2.5 rounded-full bg-sky-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-sky-400">Node Details</span>
                </div>
                <p className="font-black text-lg text-white tracking-tight mb-3">{hoveredNode.label}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between py-2 border-b border-white/5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Schema</span>
                    <span className="font-mono text-xs text-white">{hoveredNode.schema}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-white/5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Package</span>
                    <span className="font-mono text-xs text-white">{hoveredNode.package}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-white/5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Type</span>
                    <span className="font-mono text-xs text-white capitalize">{hoveredNode.materialization}</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Resource</span>
                    <span className="font-mono text-xs text-white capitalize">{hoveredNode.resourceType}</span>
                  </div>
                  {hoveredNode.tags.length > 0 && (
                    <div className="pt-3 mt-2 border-t border-white/10">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-2 block">Tags</span>
                      <div className="flex flex-wrap gap-1.5">
                        {hoveredNode.tags.map((tag) => (
                          <span key={tag} className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 text-[9px] font-bold uppercase tracking-wide">
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

          {/* Collapsible Filters Footer */}
          <div className={cn(
            "flex items-center gap-4 px-4 py-3 bg-[#0f172a] border-t border-slate-800 transition-all duration-300 overflow-x-auto flex-shrink-0",
            !showFilters && "max-h-0 py-0 border-t-0 opacity-0 pointer-events-none"
          )}>
            {/* Resources Dropdown */}
            <div className="flex flex-col gap-1.5 min-w-[120px]">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">resources</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center justify-between bg-slate-800/50 px-3 py-2 rounded border border-slate-700/50 cursor-pointer hover:bg-slate-700/50 transition-colors">
                    <span className="text-[11px] font-medium text-slate-200">
                      {selectedResources.size === 3 ? "All selected" : `${selectedResources.size} selected`}
                    </span>
                    <ChevronDown className="h-3 w-3 text-slate-500" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48 bg-slate-900 border-slate-800 text-slate-200">
                  {(["model", "seed", "snapshot"] as const).map((type) => (
                    <DropdownMenuCheckboxItem
                      key={type}
                      checked={selectedResources.has(type as ResourceType)}
                      onCheckedChange={() => setSelectedResources(prev => {
                        const next = new Set(prev);
                        if (next.has(type as ResourceType)) next.delete(type as ResourceType);
                        else next.add(type as ResourceType);
                        return next;
                      })}
                    >
                      {type}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Packages Dropdown */}
            <div className="flex flex-col gap-1.5 min-w-[140px]">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">packages</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center justify-between bg-slate-800/50 px-3 py-2 rounded border border-slate-700/50 cursor-pointer hover:bg-slate-700/50 transition-colors">
                    <span className="text-[11px] font-medium text-slate-200 truncate max-w-[100px]">
                      {selectedPackages.size === 0 ? "All packages" : `${selectedPackages.size} selected`}
                    </span>
                    <ChevronDown className="h-3 w-3 text-slate-500" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-slate-900 border-slate-800 text-slate-200 max-h-64 overflow-y-auto">
                  {allPackages.map((pkg) => (
                    <DropdownMenuCheckboxItem
                      key={pkg}
                      checked={selectedPackages.has(pkg)}
                      onCheckedChange={() => setSelectedPackages(prev => {
                        const next = new Set(prev);
                        if (next.has(pkg)) next.delete(pkg);
                        else next.add(pkg);
                        return next;
                      })}
                    >
                      {pkg}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Tags Dropdown */}
            <div className="flex flex-col gap-1.5 min-w-[120px]">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">tags</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center justify-between bg-slate-800/50 px-3 py-2 rounded border border-slate-700/50 cursor-pointer hover:bg-slate-700/50 transition-colors">
                    <span className="text-[11px] font-medium text-slate-200">
                      {selectedTags.size === 0 ? "All tags" : `${selectedTags.size} selected`}
                    </span>
                    <ChevronDown className="h-3 w-3 text-slate-500" />
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-slate-900 border-slate-800 text-slate-200 max-h-64 overflow-y-auto">
                  {allTags.map((tag) => (
                    <DropdownMenuCheckboxItem
                      key={tag}
                      checked={selectedTags.has(tag)}
                      onCheckedChange={() => setSelectedTags(prev => {
                        const next = new Set(prev);
                        if (next.has(tag)) next.delete(tag);
                        else next.add(tag);
                        return next;
                      })}
                    >
                      {tag}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* --select input */}
            <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">--select</span>
              <Input
                placeholder="..."
                value={selectInput}
                onChange={e => setSelectInput(e.target.value)}
                className="h-9 bg-slate-800/50 border-slate-700/50 rounded text-[11px] font-mono px-3 focus:border-sky-500/50 transition-all text-slate-200 placeholder:text-slate-600"
              />
            </div>

            {/* --exclude input */}
            <div className="flex flex-col gap-1.5 flex-1 min-w-[180px]">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">--exclude</span>
              <Input
                placeholder="..."
                value={excludeInput}
                onChange={e => setExcludeInput(e.target.value)}
                className="h-9 bg-slate-800/50 border-slate-700/50 rounded text-[11px] font-mono px-3 text-slate-200 placeholder:text-slate-600 focus:border-sky-500/50"
              />
            </div>

            <div className="flex items-end h-full pt-4">
              <Button onClick={() => handleFit()} className="h-9 bg-transparent hover:bg-slate-800 text-slate-400 hover:text-white rounded border border-slate-700 px-4 text-[11px] font-bold uppercase tracking-wider transition-all">
                Update Graph
              </Button>
            </div>

            <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-600 hover:text-white" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
