// Core Types for dbt Docs Explorer

export type ResourceType = "model" | "seed" | "snapshot";
export type Materialization = "table" | "view" | "incremental" | "ephemeral";

export interface Column {
  name: string;
  type?: string;
  description?: string;
}

export interface ModelSummary {
  unique_id: string;
  name: string;
  schema: string;
  package_name: string;
  materialization: Materialization;
  description?: string;
  tags: string[];
  resource_type: ResourceType;
}

export interface ModelDetail extends ModelSummary {
  path: string;
  database: string;
  columns: Column[];
  meta: Record<string, unknown>;
  raw_code?: string;
  compiled_code?: string;
}

export interface Facets {
  tags: string[];
  schemas: string[];
  packages: string[];
  materializations: Materialization[];
}

export interface SearchResult {
  doc_type: "model" | "column";
  doc_id: string;
  model_unique_id: string;
  name: string;
  description?: string;
  model_name?: string; // For column results
}

export interface ModelsResponse {
  total: number;
  items: ModelSummary[];
  facets: Facets;
}

export interface SearchResponse {
  results: SearchResult[];
}

export interface LineageResponse {
  upstream: ModelSummary[];
  downstream: ModelSummary[];
  nodes?: LineageGraphNode[];
  edges?: LineageGraphEdge[];
}

export interface LineageGraphNode {
  id: string;
  label: string;
  schema: string;
  package_name: string;
  materialization: Materialization;
  resource_type: ResourceType;
  tags: string[];
}

export interface LineageGraphEdge {
  source: string;
  target: string;
}

export interface DatabaseNavModel {
  unique_id: string;
  name: string;
}

export interface DatabaseNavSchema {
  name: string;
  models: DatabaseNavModel[];
}

export interface DatabaseNavEntry {
  name: string;
  schemas: DatabaseNavSchema[];
}

export interface DatabaseNavResponse {
  databases: DatabaseNavEntry[];
}

// Filter state
export interface FiltersState {
  tags: string[];
  schemas: string[];
  packages: string[];
  resourceType?: ResourceType;
  materializations: Materialization[];
}

// Tree navigation types
export type TreeNodeType = "folder" | "database" | "schema" | "package" | "model";
export type TreeMode = "project" | "database";

export interface TreeNode {
  id: string;
  parentId?: string;
  type: TreeNodeType;
  label: string;
  modelId?: string; // Only for model nodes
  children: TreeNode[];
  meta?: {
    count?: number;
    materialization?: Materialization;
    schema?: string;
    package?: string;
  };
}

export interface FocusPath {
  selectedId: string;
  expandedIds: string[];
}

export interface FlatTreeNode extends TreeNode {
  depth: number;
  isExpanded: boolean;
  isSelected: boolean;
  isAncestorOfSelected: boolean;
  isVisible: boolean;
}
