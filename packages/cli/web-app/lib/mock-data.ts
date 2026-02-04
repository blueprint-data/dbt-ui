import type {
  ModelSummary,
  ModelDetail,
  Facets,
  Column,
  Materialization,
  ResourceType,
} from "./types";

// Generate realistic mock data for a large dbt project
const tags = [
  "core",
  "staging",
  "marts",
  "finance",
  "marketing",
  "sales",
  "analytics",
  "pii",
  "deprecated",
  "wip",
];

const schemas = [
  "raw",
  "staging",
  "intermediate",
  "marts",
  "analytics",
  "reports",
  "snapshots",
];

const packages = [
  "my_project",
  "dbt_utils",
  "dbt_expectations",
  "fivetran_utils",
  "segment",
];

const materializations: Materialization[] = [
  "table",
  "view",
  "incremental",
  "ephemeral",
];

const resourceTypes: ResourceType[] = ["model", "seed", "snapshot"];

const modelPrefixes = [
  "stg",
  "int",
  "fct",
  "dim",
  "rpt",
  "agg",
  "src",
  "snap",
  "seed",
];

const modelDomains = [
  "orders",
  "customers",
  "products",
  "payments",
  "users",
  "events",
  "sessions",
  "transactions",
  "invoices",
  "subscriptions",
  "campaigns",
  "leads",
  "accounts",
  "inventory",
  "shipments",
];

const columnTypes = [
  "VARCHAR(256)",
  "INTEGER",
  "BIGINT",
  "TIMESTAMP",
  "DATE",
  "BOOLEAN",
  "DECIMAL(18,2)",
  "TEXT",
  "UUID",
  "ARRAY",
  "JSON",
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomItems<T>(arr: T[], min: number, max: number): T[] {
  const count = Math.floor(Math.random() * (max - min + 1)) + min;
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function generateColumns(modelName: string): Column[] {
  const baseColumns: Column[] = [
    {
      name: `${modelName}_id`,
      type: "UUID",
      description: `Primary key for ${modelName}`,
    },
    {
      name: "created_at",
      type: "TIMESTAMP",
      description: "When the record was created",
    },
    {
      name: "updated_at",
      type: "TIMESTAMP",
      description: "When the record was last updated",
    },
  ];

  const additionalColumns: Column[] = [
    { name: "name", type: "VARCHAR(256)", description: "Name field" },
    { name: "email", type: "VARCHAR(256)", description: "Email address" },
    { name: "status", type: "VARCHAR(50)", description: "Current status" },
    { name: "amount", type: "DECIMAL(18,2)", description: "Monetary amount" },
    { name: "quantity", type: "INTEGER", description: "Quantity count" },
    { name: "is_active", type: "BOOLEAN", description: "Active flag" },
    { name: "metadata", type: "JSON", description: "Additional metadata" },
    { name: "external_id", type: "VARCHAR(256)", description: "External system ID" },
    { name: "source_system", type: "VARCHAR(100)", description: "Source system name" },
    { name: "loaded_at", type: "TIMESTAMP", description: "When data was loaded" },
  ];

  return [...baseColumns, ...randomItems(additionalColumns, 3, 7)];
}

// Generate 500+ models
export function generateMockModels(): ModelSummary[] {
  const models: ModelSummary[] = [];

  for (let i = 0; i < 520; i++) {
    const prefix = randomItem(modelPrefixes);
    const domain = randomItem(modelDomains);
    const suffix = i > 100 ? `_v${Math.floor(i / 100)}` : "";
    const name = `${prefix}_${domain}${suffix}${i % 10 === 0 ? "_daily" : ""}`;

    const resourceType = i < 480 ? "model" : i < 500 ? "seed" : "snapshot";
    const mat =
      resourceType === "seed"
        ? "table"
        : resourceType === "snapshot"
        ? "incremental"
        : randomItem(materializations);

    models.push({
      unique_id: `${resourceType}.my_project.${name}_${i}`,
      name: `${name}_${i}`,
      schema: randomItem(schemas),
      package_name: randomItem(packages),
      materialization: mat,
      description:
        i % 3 === 0
          ? `This ${resourceType} contains ${domain} data for analytics and reporting purposes. Updated regularly.`
          : i % 3 === 1
          ? `Staging layer for ${domain} from source systems.`
          : undefined,
      tags: randomItems(tags, 0, 3),
      resource_type: resourceType,
    });
  }

  return models;
}

export function generateModelDetail(model: ModelSummary): ModelDetail {
  const columns = generateColumns(model.name);

  return {
    ...model,
    path: `models/${model.schema}/${model.name}.sql`,
    database: "analytics_db",
    columns,
    meta: {
      owner: "data-team@company.com",
      sla: "daily",
      tier: randomItem(["critical", "important", "standard"]),
    },
    raw_code: `-- ${model.name}
{{ config(
    materialized='${model.materialization}',
    schema='${model.schema}'
) }}

WITH source AS (
    SELECT *
    FROM {{ ref('stg_${model.name.split("_")[1] || "source"}') }}
),

transformed AS (
    SELECT
        ${columns.map((c) => c.name).join(",\n        ")}
    FROM source
    WHERE is_active = true
)

SELECT * FROM transformed`,
    compiled_code: `-- Compiled: ${model.name}
WITH source AS (
    SELECT *
    FROM analytics_db.staging.stg_${model.name.split("_")[1] || "source"}
),

transformed AS (
    SELECT
        ${columns.map((c) => c.name).join(",\n        ")}
    FROM source
    WHERE is_active = true
)

SELECT * FROM transformed`,
  };
}

// Pre-generate all models for consistent data
const allModels = generateMockModels();

export function getMockModels(): ModelSummary[] {
  return allModels;
}

export function getMockFacets(): Facets {
  return {
    tags,
    schemas,
    packages,
    materializations,
  };
}

export function getMockModelById(id: string): ModelDetail | null {
  const model = allModels.find((m) => m.unique_id === id);
  if (!model) return null;
  return generateModelDetail(model);
}

export function getMockLineage(
  id: string,
  depth: number = 1
): { upstream: ModelSummary[]; downstream: ModelSummary[] } {
  const modelIndex = allModels.findIndex((m) => m.unique_id === id);
  if (modelIndex === -1) return { upstream: [], downstream: [] };

  // Generate realistic lineage based on model position
  const upstreamCount = Math.min(depth * 3, 8);
  const downstreamCount = Math.min(depth * 2, 5);

  const upstream = allModels
    .filter((_, i) => i < modelIndex && i >= modelIndex - upstreamCount * 2)
    .slice(0, upstreamCount);

  const downstream = allModels
    .filter((_, i) => i > modelIndex && i <= modelIndex + downstreamCount * 2)
    .slice(0, downstreamCount);

  return { upstream, downstream };
}

export function searchMockModels(
  query: string,
  limit: number = 10
): { results: import("./types").SearchResult[] } {
  const q = query.toLowerCase();
  const results: import("./types").SearchResult[] = [];

  // Search models
  for (const model of allModels) {
    if (results.length >= limit) break;

    if (
      model.name.toLowerCase().includes(q) ||
      model.description?.toLowerCase().includes(q)
    ) {
      results.push({
        doc_type: "model",
        doc_id: model.unique_id,
        model_unique_id: model.unique_id,
        name: model.name,
        description: model.description,
      });
    }
  }

  // Search columns if we have room
  if (results.length < limit) {
    for (const model of allModels.slice(0, 100)) {
      if (results.length >= limit) break;

      const detail = generateModelDetail(model);
      for (const col of detail.columns) {
        if (results.length >= limit) break;

        if (
          col.name.toLowerCase().includes(q) ||
          col.description?.toLowerCase().includes(q)
        ) {
          results.push({
            doc_type: "column",
            doc_id: `${model.unique_id}.${col.name}`,
            model_unique_id: model.unique_id,
            name: col.name,
            description: col.description,
            model_name: model.name,
          });
        }
      }
    }
  }

  return { results };
}
