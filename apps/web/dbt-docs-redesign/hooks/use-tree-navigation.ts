"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import type { TreeNode, TreeMode, FlatTreeNode, ModelSummary } from "@/lib/types";
import { getNavTree, getFocusPath, filterTree, getBreadcrumbPath, getAllModels } from "@/lib/tree-nav";

const STORAGE_KEY = "dbt-docs-tree-prefs";

interface TreePreferences {
  mode: TreeMode;
  expandedIds: string[];
}

function loadPreferences(): TreePreferences {
  if (typeof window === "undefined") {
    return { mode: "project", expandedIds: [] };
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore errors
  }
  return { mode: "project", expandedIds: [] };
}

function savePreferences(prefs: TreePreferences) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore errors
  }
}

// Flatten tree for virtualized rendering
function flattenTree(
  nodes: TreeNode[],
  expandedIds: Set<string>,
  selectedId: string | null,
  ancestorIds: Set<string>,
  depth: number = 0
): FlatTreeNode[] {
  const result: FlatTreeNode[] = [];

  for (const node of nodes) {
    const isExpanded = expandedIds.has(node.id);
    const isSelected = node.id === selectedId;
    const isAncestorOfSelected = ancestorIds.has(node.id);

    result.push({
      ...node,
      depth,
      isExpanded,
      isSelected,
      isAncestorOfSelected,
      isVisible: true,
    });

    if (isExpanded && node.children.length > 0) {
      result.push(
        ...flattenTree(node.children, expandedIds, selectedId, ancestorIds, depth + 1)
      );
    }
  }

  return result;
}

// Find all ancestor IDs for a given node
function findAncestorIds(nodes: TreeNode[], targetId: string): Set<string> {
  const ancestors = new Set<string>();

  function search(nodes: TreeNode[], path: string[]): boolean {
    for (const node of nodes) {
      if (node.id === targetId) {
        for (const id of path) ancestors.add(id);
        return true;
      }
      if (node.children.length > 0) {
        if (search(node.children, [...path, node.id])) {
          return true;
        }
      }
    }
    return false;
  }

  search(nodes, []);
  return ancestors;
}

export function useTreeNavigation(selectedModelId: string | null) {
  const [mode, setMode] = useState<TreeMode>("project");
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [allModels, setAllModels] = useState<ModelSummary[]>([]);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [filterQuery, setFilterQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    const prefs = loadPreferences();
    setMode(prefs.mode);
    setExpandedIds(new Set(prefs.expandedIds));
    setInitialized(true);
  }, []);

  // Save preferences when they change
  useEffect(() => {
    if (!initialized) return;
    savePreferences({
      mode,
      expandedIds: Array.from(expandedIds),
    });
  }, [mode, expandedIds, initialized]);

  // Load tree when mode changes
  useEffect(() => {
    let cancelled = false;

    async function loadTree() {
      setIsLoading(true);
      try {
        const [data, models] = await Promise.all([
          getNavTree(mode),
          getAllModels(),
        ]);
        if (!cancelled) {
          setTree(data);
          setAllModels(models);
        }
      } catch (err) {
        console.error("Failed to load tree:", err);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadTree();
    return () => {
      cancelled = true;
    };
  }, [mode]);

  // Auto-expand and select when model changes
  useEffect(() => {
    if (!selectedModelId || tree.length === 0) {
      setSelectedNodeId(null);
      return;
    }

    let cancelled = false;

    async function focusModel() {
      const focusPath = await getFocusPath(mode, selectedModelId);
      if (cancelled || !focusPath) return;

      setSelectedNodeId(focusPath.selectedId);
      setExpandedIds((prev) => {
        const next = new Set(prev);
        for (const id of focusPath.expandedIds) {
          next.add(id);
        }
        return next;
      });
    }

    focusModel();
    return () => {
      cancelled = true;
    };
  }, [selectedModelId, mode, tree]);

  // Filter tree
  const { filteredTree, matchingIds } = useMemo(() => {
    if (!filterQuery.trim()) {
      return { filteredTree: tree, matchingIds: new Set<string>() };
    }
    return filterTree(tree, filterQuery);
  }, [tree, filterQuery]);

  // Compute ancestor IDs for highlighting
  const ancestorIds = useMemo(() => {
    if (!selectedNodeId) return new Set<string>();
    return findAncestorIds(filteredTree, selectedNodeId);
  }, [filteredTree, selectedNodeId]);

  // Flatten tree for virtualization
  const flatNodes = useMemo(() => {
    // When filtering, expand all nodes to show matches
    const effectiveExpanded = filterQuery.trim()
      ? new Set([...expandedIds, ...matchingIds, ...ancestorIds])
      : expandedIds;

    return flattenTree(filteredTree, effectiveExpanded, selectedNodeId, ancestorIds);
  }, [filteredTree, expandedIds, selectedNodeId, ancestorIds, filterQuery, matchingIds]);

  // Breadcrumb path
  const breadcrumbs = useMemo(() => {
    if (!selectedModelId || tree.length === 0) return [];
    return getBreadcrumbPath(tree, selectedModelId, mode);
  }, [tree, selectedModelId, mode]);

  // Mini-map position (percentage through tree)
  const miniMapPosition = useMemo(() => {
    if (!selectedNodeId || flatNodes.length === 0) return null;
    const index = flatNodes.findIndex((n) => n.id === selectedNodeId);
    if (index === -1) return null;
    return Math.round((index / flatNodes.length) * 100);
  }, [flatNodes, selectedNodeId]);

  // Toggle node expansion
  const toggleNode = useCallback((nodeId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  // Expand node
  const expandNode = useCallback((nodeId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.add(nodeId);
      return next;
    });
  }, []);

  // Collapse node
  const collapseNode = useCallback((nodeId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.delete(nodeId);
      return next;
    });
  }, []);

  // Reveal selected in tree (scroll to it)
  const revealSelected = useCallback(() => {
    if (!selectedNodeId) return -1;
    return flatNodes.findIndex((n) => n.id === selectedNodeId);
  }, [flatNodes, selectedNodeId]);

  return {
    mode,
    setMode,
    tree: filteredTree,
    flatNodes,
    expandedIds,
    selectedNodeId,
    setSelectedNodeId,
    filterQuery,
    setFilterQuery,
    isLoading,
    breadcrumbs,
    miniMapPosition,
    toggleNode,
    expandNode,
    collapseNode,
    revealSelected,
    matchingIds,
    allModels,
  };
}
