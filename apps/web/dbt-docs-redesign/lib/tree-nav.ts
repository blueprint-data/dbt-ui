import type { TreeNode, TreeMode, FocusPath, ModelSummary } from "./types";
import { getMockModels } from "./mock-data";

// Toggle this to switch between mock and real API
const USE_MOCK_API = process.env.NEXT_PUBLIC_USE_MOCKS === "true";

// Simulate network delay
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Build project tree: package -> folders (from path) -> models
function buildProjectTree(models: ModelSummary[]): TreeNode[] {
  const packageMap = new Map<string, TreeNode>();

  for (const model of models) {
    const packageName = model.package_name;

    // Get or create package node
    if (!packageMap.has(packageName)) {
      packageMap.set(packageName, {
        id: `pkg:${packageName}`,
        type: "package",
        label: packageName,
        children: [],
        meta: { count: 0 },
      });
    }
    const packageNode = packageMap.get(packageName)!;

    // Create folder path based on schema (simplified - in real dbt it would be file path)
    const folderPath = model.schema;
    let folderNode = packageNode.children.find(
      (c) => c.type === "folder" && c.label === folderPath
    );

    if (!folderNode) {
      folderNode = {
        id: `folder:${packageName}:${folderPath}`,
        parentId: packageNode.id,
        type: "folder",
        label: folderPath,
        children: [],
        meta: { count: 0 },
      };
      packageNode.children.push(folderNode);
    }

    // Add model node
    folderNode.children.push({
      id: `model:${model.unique_id}`,
      parentId: folderNode.id,
      type: "model",
      label: model.name,
      modelId: model.unique_id,
      children: [],
      meta: {
        materialization: model.materialization,
        schema: model.schema,
        package: model.package_name,
      },
    });

    // Update counts
    folderNode.meta!.count = folderNode.children.length;
    packageNode.meta!.count =
      (packageNode.meta!.count || 0) + 1;
  }

  // Sort children alphabetically
  for (const pkg of packageMap.values()) {
    pkg.children.sort((a, b) => a.label.localeCompare(b.label));
    for (const folder of pkg.children) {
      folder.children.sort((a, b) => a.label.localeCompare(b.label));
    }
  }

  return Array.from(packageMap.values()).sort((a, b) =>
    a.label.localeCompare(b.label)
  );
}

// Build database tree: database -> schema -> models
function buildDatabaseTree(models: ModelSummary[]): TreeNode[] {
  const dbName = "analytics_db"; // All models share same db in mock
  const schemaMap = new Map<string, TreeNode>();

  for (const model of models) {
    const schemaName = model.schema;

    // Get or create schema node
    if (!schemaMap.has(schemaName)) {
      schemaMap.set(schemaName, {
        id: `schema:${schemaName}`,
        parentId: `db:${dbName}`,
        type: "schema",
        label: schemaName,
        children: [],
        meta: { count: 0 },
      });
    }
    const schemaNode = schemaMap.get(schemaName)!;

    // Add model node
    schemaNode.children.push({
      id: `model:${model.unique_id}`,
      parentId: schemaNode.id,
      type: "model",
      label: model.name,
      modelId: model.unique_id,
      children: [],
      meta: {
        materialization: model.materialization,
        schema: model.schema,
        package: model.package_name,
      },
    });

    schemaNode.meta!.count = schemaNode.children.length;
  }

  // Sort schemas and their children
  const schemas = Array.from(schemaMap.values()).sort((a, b) =>
    a.label.localeCompare(b.label)
  );
  for (const schema of schemas) {
    schema.children.sort((a, b) => a.label.localeCompare(b.label));
  }

  // Create database root
  const dbNode: TreeNode = {
    id: `db:${dbName}`,
    type: "database",
    label: dbName,
    children: schemas,
    meta: { count: models.length },
  };

  return [dbNode];
}

// Get navigation tree
export async function getNavTree(mode: TreeMode): Promise<TreeNode[]> {
  if (USE_MOCK_API) {
    await delay(100);
    const models = getMockModels();
    return mode === "project"
      ? buildProjectTree(models)
      : buildDatabaseTree(models);
  }

  if (mode === "project") {
    const response = await fetch(`/api/models?limit=1000&offset=0`);
    if (!response.ok) throw new Error("Failed to fetch models for project tree");
    const data = await response.json();
    return buildProjectTree(data.items || []);
  }

  const dbResponse = await fetch(`/api/nav/database`);
  if (!dbResponse.ok) throw new Error("Failed to fetch database tree");
  const dbData = await dbResponse.json();

  const tree: TreeNode[] = (dbData?.databases || []).map((db: any) => ({
    id: `db:${db.name}`,
    type: "database",
    label: db.name,
    children: (db.schemas || []).map((schema: any) => ({
      id: `schema:${db.name}:${schema.name}`,
      parentId: `db:${db.name}`,
      type: "schema",
      label: schema.name,
      children: (schema.models || []).map((m: any) => ({
        id: `model:${m.unique_id}`,
        parentId: `schema:${db.name}:${schema.name}`,
        type: "model",
        label: m.name,
        modelId: m.unique_id,
        children: [],
        meta: {},
      })),
      meta: { count: (schema.models || []).length },
    })),
    meta: { count: (db.schemas || []).reduce((acc: number, s: any) => acc + (s.models?.length || 0), 0) },
  }));

  return tree;
}

// Find path to a model in the tree
function findPathToModel(
  nodes: TreeNode[],
  modelId: string,
  path: string[] = []
): string[] | null {
  for (const node of nodes) {
    if (node.modelId === modelId) {
      return [...path, node.id];
    }
    if (node.children.length > 0) {
      const result = findPathToModel(node.children, modelId, [...path, node.id]);
      if (result) return result;
    }
  }
  return null;
}

// Get focus path for a model (what to expand and select)
export async function getFocusPath(
  mode: TreeMode,
  modelId: string
): Promise<FocusPath | null> {
  if (USE_MOCK_API) {
    await delay(50);
    const models = getMockModels();
    const tree =
      mode === "project" ? buildProjectTree(models) : buildDatabaseTree(models);

    const path = findPathToModel(tree, modelId);
    if (!path || path.length === 0) return null;

    return {
      selectedId: path[path.length - 1],
      expandedIds: path.slice(0, -1), // All ancestors should be expanded
    };
  }

  const response = await fetch(
    `/api/nav-focus?mode=${mode}&modelId=${encodeURIComponent(modelId)}`
  );
  if (!response.ok) return null;
  return response.json();
}

// Filter tree keeping matching nodes and ancestors
export function filterTree(
  nodes: TreeNode[],
  query: string
): { filtered: TreeNode[]; matchingIds: Set<string> } {
  const q = query.toLowerCase().trim();
  const matchingIds = new Set<string>();

  if (!q) {
    return { filtered: nodes, matchingIds };
  }

  function filterNode(node: TreeNode): TreeNode | null {
    // Check if this node matches
    const nodeMatches = node.label.toLowerCase().includes(q);

    // Recursively filter children
    const filteredChildren: TreeNode[] = [];
    for (const child of node.children) {
      const filteredChild = filterNode(child);
      if (filteredChild) {
        filteredChildren.push(filteredChild);
      }
    }

    // Include this node if it matches or has matching descendants
    if (nodeMatches || filteredChildren.length > 0) {
      if (nodeMatches) {
        matchingIds.add(node.id);
      }
      return {
        ...node,
        children: filteredChildren,
      };
    }

    return null;
  }

  const filtered: TreeNode[] = [];
  for (const node of nodes) {
    const filteredNode = filterNode(node);
    if (filteredNode) {
      filtered.push(filteredNode);
    }
  }

  return { filtered, matchingIds };
}

// Get all models for graph visualization
export async function getAllModels(): Promise<ModelSummary[]> {
  if (USE_MOCK_API) {
    await delay(50);
    return getMockModels();
  }

  const response = await fetch("/api/models?limit=1000&offset=0");
  if (!response.ok) throw new Error("Failed to fetch models");
  const data = await response.json();
  return data.items;
}

// Get breadcrumb path for a model
export function getBreadcrumbPath(
  tree: TreeNode[],
  modelId: string,
  mode: TreeMode
): { label: string; id: string; type: string }[] {
  const path: { label: string; id: string; type: string }[] = [];

  function findPath(nodes: TreeNode[], target: string): boolean {
    for (const node of nodes) {
      if (node.modelId === target) {
        path.push({ label: node.label, id: node.id, type: node.type });
        return true;
      }
      if (node.children.length > 0 && findPath(node.children, target)) {
        path.unshift({ label: node.label, id: node.id, type: node.type });
        return true;
      }
    }
    return false;
  }

  findPath(tree, modelId);
  return path;
}
