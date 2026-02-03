"use client";

import React, { useRef, useEffect, useCallback, memo, useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Folder,
  Database,
  Table2,
  FolderOpen,
  Package,
  FileCode,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { FlatTreeNode, Materialization } from "@/lib/types";

const ROW_HEIGHT = 32;
const OVERSCAN = 5;

const materializationColors: Record<Materialization, string> = {
  table: "text-emerald-500",
  view: "text-blue-500",
  incremental: "text-indigo-500",
  ephemeral: "text-violet-500",
};

interface VirtualTreeProps {
  nodes: FlatTreeNode[];
  onToggle: (nodeId: string) => void;
  onSelect: (modelId: string) => void;
  onExpand: (nodeId: string) => void;
  onCollapse: (nodeId: string) => void;
  height: number;
  scrollToIndex?: number;
  highlightIds?: Set<string>;
}

interface TreeRowProps {
  node: FlatTreeNode;
  onToggle: (nodeId: string) => void;
  onSelect: (modelId: string) => void;
  onExpand: (nodeId: string) => void;
  onCollapse: (nodeId: string) => void;
  isHighlighted: boolean;
}

const TreeRow = memo(function TreeRow({
  node,
  onToggle,
  onSelect,
  onExpand,
  onCollapse,
  isHighlighted,
}: TreeRowProps) {
  const hasChildren = node.children.length > 0;
  const isModel = node.type === "model";

  const handleClick = () => {
    if (isModel && node.modelId) {
      onSelect(node.modelId);
    } else {
      onToggle(node.id);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "Enter":
      case " ":
        e.preventDefault();
        handleClick();
        break;
      case "ArrowRight":
        if (hasChildren && !node.isExpanded) {
          e.preventDefault();
          onExpand(node.id);
        }
        break;
      case "ArrowLeft":
        if (hasChildren && node.isExpanded) {
          e.preventDefault();
          onCollapse(node.id);
        }
        break;
    }
  };

  const getIcon = () => {
    const iconClass = "h-[14px] w-[14px] transition-colors";
    switch (node.type) {
      case "package":
        return <Package className={cn(iconClass, "text-sky-600")} />;
      case "database":
        return <Database className={cn(iconClass, "text-blue-500")} />;
      case "schema":
        return <Table2 className={cn(iconClass, "text-violet-500")} />;
      case "folder":
        return node.isExpanded ? (
          <FolderOpen className={cn(iconClass, "text-slate-500")} />
        ) : (
          <Folder className={cn(iconClass, "text-slate-400")} />
        );
      case "model":
        return <FileCode className={cn(iconClass, "text-sky-500")} />;
      default:
        return <Folder className={iconClass} />;
    }
  };

  return (
    <div
      role="treeitem"
      tabIndex={0}
      aria-expanded={hasChildren ? node.isExpanded : undefined}
      aria-selected={node.isSelected}
      className={cn(
        "flex items-center h-8 px-3 cursor-pointer select-none rounded-lg transition-all group mx-1 relative overflow-hidden",
        "hover:bg-sky-50 focus:outline-none focus:ring-1 focus:ring-sky-500/20",
        node.isSelected
          ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white font-black shadow-md shadow-sky-500/20 ring-1 ring-sky-400"
          : "text-slate-600 hover:text-slate-900 font-medium",
        node.isAncestorOfSelected && !node.isSelected && "bg-slate-50/50",
        isHighlighted && "ring-1 ring-sky-500 shadow-lg"
      )}
      style={{ paddingLeft: `${node.depth * 14 + 12}px` }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {/* Depth lines decoration */}
      {Array.from({ length: node.depth }).map((_, i) => (
        <div
          key={i}
          className="absolute h-full w-[1px] bg-slate-200/30"
          style={{ left: `${i * 14 + 18}px` }}
        />
      ))}

      {/* Expand/Collapse Toggle */}
      <span className="w-4 h-4 flex items-center justify-center shrink-0 mr-1.5 transition-transform z-10">
        {hasChildren ? (
          node.isExpanded ? (
            <ChevronDown className="h-3 w-3 text-slate-400 group-hover:text-slate-600 transition-colors" />
          ) : (
            <ChevronRight className="h-3 w-3 text-slate-400 group-hover:text-slate-600 transition-colors" />
          )
        ) : null}
      </span>

      {/* Icon */}
      <span className={cn(
        "shrink-0 mr-2.5 transition-all z-10",
        node.isSelected ? "opacity-100 scale-110" : "opacity-40 group-hover:opacity-100"
      )}>
        {getIcon()}
      </span>

      {/* Label */}
      <span className={cn(
        "whitespace-nowrap flex-1 text-[11px] transition-colors z-10 mr-4",
        isModel ? "font-mono font-bold" : "font-black uppercase tracking-[0.2em] text-[10px]"
      )}>
        {node.label}
      </span>

      {/* Count badge for folders */}
      {node.meta?.count && node.type !== "model" && (
        <span className={cn(
          "ml-2 text-[9px] font-black font-mono tracking-widest transition-colors z-10",
          node.isSelected ? "text-primary-foreground/40" : "text-muted-foreground/20 group-hover:text-muted-foreground/40"
        )}>
          {node.meta.count}
        </span>
      )}

      {/* Materialization badge for models */}
      {isModel && node.meta?.materialization && (
        <span
          className={cn(
            "ml-2 text-[8px] font-black uppercase tracking-[0.2em] transition-opacity z-10",
            node.isSelected ? "text-primary-foreground/60" : cn("opacity-40 group-hover:opacity-100", materializationColors[node.meta.materialization])
          )}
        >
          {node.meta.materialization.slice(0, 3)}
        </span>
      )}
    </div>
  );
});

export function VirtualTree({
  nodes,
  onToggle,
  onSelect,
  onExpand,
  onCollapse,
  height,
  scrollToIndex,
  highlightIds = new Set(),
}: VirtualTreeProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  // Calculate visible range
  const totalHeight = nodes.length * ROW_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const endIndex = Math.min(
    nodes.length,
    Math.ceil((scrollTop + height) / ROW_HEIGHT) + OVERSCAN
  );
  const visibleNodes = nodes.slice(startIndex, endIndex);

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  // Scroll to index when it changes
  useEffect(() => {
    if (scrollToIndex !== undefined && scrollToIndex >= 0 && containerRef.current) {
      const targetScrollTop = scrollToIndex * ROW_HEIGHT - height / 2 + ROW_HEIGHT / 2;
      containerRef.current.scrollTop = Math.max(0, Math.min(targetScrollTop, totalHeight - height));
    }
  }, [scrollToIndex, height, totalHeight]);

  // Keyboard navigation across the list
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const currentIndex = nodes.findIndex((n) => n.isSelected);
      if (currentIndex === -1) return;

      let nextIndex = currentIndex;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          nextIndex = Math.min(currentIndex + 1, nodes.length - 1);
          break;
        case "ArrowUp":
          e.preventDefault();
          nextIndex = Math.max(currentIndex - 1, 0);
          break;
        default:
          return;
      }

      if (nextIndex !== currentIndex) {
        const nextNode = nodes[nextIndex];
        if (nextNode.type === "model" && nextNode.modelId) {
          onSelect(nextNode.modelId);
        } else {
          onToggle(nextNode.id);
        }
        // Scroll into view
        if (containerRef.current) {
          const targetScrollTop = nextIndex * ROW_HEIGHT - height / 2 + ROW_HEIGHT / 2;
          containerRef.current.scrollTop = Math.max(0, Math.min(targetScrollTop, totalHeight - height));
        }
      }
    },
    [nodes, onSelect, onToggle, height, totalHeight]
  );

  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
        No items found
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      role="tree"
      onKeyDown={handleKeyDown}
      onScroll={handleScroll}
      tabIndex={-1}
      className="outline-none overflow-auto custom-scrollbar"
      style={{ height }}
    >
      <div style={{ height: totalHeight, position: "relative", minWidth: "100%" }}>
        <div
          style={{
            position: "absolute",
            top: startIndex * ROW_HEIGHT,
            left: 0,
            right: 0,
          }}
        >
          {visibleNodes.map((node, i) => (
            <TreeRow
              key={node.id}
              node={node}
              onToggle={onToggle}
              onSelect={onSelect}
              onExpand={onExpand}
              onCollapse={onCollapse}
              isHighlighted={highlightIds.has(node.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
