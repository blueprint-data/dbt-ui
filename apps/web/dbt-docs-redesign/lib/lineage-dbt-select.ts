import type { ModelSummary } from "@/lib/types";

/** `package_name.model` form for dbt-style selectors. */
export function modelToSelectorString(m: ModelSummary): string {
  return `${m.package_name}.${m.name}`;
}

function normalizeToken(s: string): string {
  return s.trim();
}

/** FQN match, or all models whose unqualified `name` equals `token` (if unique, behaves like dbt). */
export function findModelsBySelectorName(
  models: ModelSummary[],
  token: string
): ModelSummary[] {
  const t = normalizeToken(token);
  if (!t) return [];
  if (t.includes(".")) {
    return models.filter((m) => modelToSelectorString(m) === t);
  }
  return models.filter((m) => m.name === t);
}

const TAG_PREFIX = "tag:";

/** 0 = no expansion; `all` = unlimited hops; positive integer = max hops. */
export type DbtHop = 0 | "all" | number;

/**
 * dbt graph operators: e.g. `+model+`, `2+pkg.model+2`, `+model+2`, `2+name`.
 * - Trailing: `+N` = N hops downstream; bare `+` = all downstream
 * - Leading: `N+` = N hops upstream; bare `+` = all upstream
 * Strip from the ends so `2+takenos.int_revenue_unified+2` → core FQN, up=2, down=2
 */
export function parseDbtGraphSelector(input: string): {
  up: DbtHop;
  down: DbtHop;
  core: string;
} {
  let s = input.trim();
  if (!s) return { up: 0, down: 0, core: "" };

  let up: DbtHop = 0;
  let down: DbtHop = 0;

  // Trailing `+N` (must run before a lone trailing `+`)
  const tNum = s.match(/\+(\d+)$/u);
  if (tNum) {
    const n = parseInt(tNum[1] ?? "", 10);
    if (n > 0) {
      down = n;
      s = s.slice(0, -tNum[0]!.length);
    }
  } else if (s.endsWith("+") && s.length > 0) {
    s = s.slice(0, -1);
    down = "all";
  }

  s = s.trim();
  if (!s) return { up: 0, down: 0, core: "" };

  // Leading `N+` (must require digit so `+tag:` is a bare +, not `0+…`)
  const lNum = s.match(/^(\d+)\+/u);
  if (lNum) {
    const n = parseInt(lNum[1] ?? "", 10);
    up = n > 0 ? n : 0;
    s = s.slice(lNum[0]!.length);
  } else if (s.startsWith("+")) {
    s = s.slice(1);
    up = "all";
  }

  return { up, down, core: s.trim() };
}

/**
 * `tag:` (trimmed) — returns models that have the tag. Tag string is the rest after `tag:`.
 */
function selectByTag(models: ModelSummary[], tag: string): Set<string> {
  const t = tag.trim();
  if (!t) return new Set();
  const out = new Set<string>();
  for (const m of models) {
    if ((m.tags || []).includes(t)) out.add(m.unique_id);
  }
  return out;
}

function buildAdj(
  edges: { source: string; target: string }[]
): {
  adj: Map<string, string[]>;
  rev: Map<string, string[]>;
} {
  const adj = new Map<string, string[]>();
  const rev = new Map<string, string[]>();
  for (const e of edges) {
    if (!adj.has(e.source)) adj.set(e.source, []);
    adj.get(e.source)!.push(e.target);
    if (!rev.has(e.target)) rev.set(e.target, []);
    rev.get(e.target)!.push(e.source);
  }
  return { adj, rev };
}

/**
 * BFS upstream (parents). `maxD === null` = unlimited; N = at most N steps from r (a parent is 1 step).
 */
function bfsUpFrom(
  r: string,
  rev: Map<string, string[]>,
  maxD: number | null
): Set<string> {
  const out = new Set<string>([r]);
  if (maxD === 0) return out;
  const cap = maxD == null ? Number.POSITIVE_INFINITY : maxD;
  const q: [string, number][] = [[r, 0]];
  let qi = 0;
  while (qi < q.length) {
    const [c, depth] = q[qi++]!;
    if (depth >= cap) continue;
    for (const p of rev.get(c) || []) {
      if (!out.has(p)) out.add(p);
      if (depth + 1 < cap) {
        q.push([p, depth + 1]);
      }
    }
  }
  return out;
}

/**
 * BFS downstream (children). `maxD === null` = unlimited.
 */
function bfsDownFrom(
  r: string,
  adj: Map<string, string[]>,
  maxD: number | null
): Set<string> {
  const out = new Set<string>([r]);
  if (maxD === 0) return out;
  const cap = maxD == null ? Number.POSITIVE_INFINITY : maxD;
  const q: [string, number][] = [[r, 0]];
  let qi = 0;
  while (qi < q.length) {
    const [c, depth] = q[qi++]!;
    if (depth >= cap) continue;
    for (const n of adj.get(c) || []) {
      if (!out.has(n)) out.add(n);
      if (depth + 1 < cap) {
        q.push([n, depth + 1]);
      }
    }
  }
  return out;
}

/**
 * Edges: source → target (parent → child). `up` / `down` are hop limits from `parseDbtGraphSelector`;
 * `0` = no expansion in that direction, `"all"` = unlimited, number = max hop depth.
 */
export function collectLineageFromEdges(
  rootIds: string[],
  edges: { source: string; target: string }[],
  up: DbtHop,
  down: DbtHop
): Set<string> {
  if (rootIds.length === 0) return new Set();
  if (up === 0 && down === 0) {
    return new Set(rootIds);
  }

  const { adj, rev } = buildAdj(edges);
  const out = new Set<string>();
  for (const r of rootIds) {
    if (up !== 0) {
      const maxU = up === "all" ? null : (up as number);
      for (const id of bfsUpFrom(r, rev, maxU)) {
        out.add(id);
      }
    }
    if (down !== 0) {
      const maxD = down === "all" ? null : (down as number);
      for (const id of bfsDownFrom(r, adj, maxD)) {
        out.add(id);
      }
    }
  }
  return out;
}

/**
 * Resolves a single `--select` string to allowed `unique_id`s, or `null` = no restriction
 * (only when `expression` is empty). Empty set = no models match.
 */
export function resolveSelectToIds(
  expression: string,
  models: ModelSummary[],
  edges: { source: string; target: string }[]
): Set<string> | null {
  const raw = expression.trim();
  if (!raw) return null;

  const { up, down, core } = parseDbtGraphSelector(raw);
  if (!core) return new Set();

  if (core.toLowerCase().startsWith(TAG_PREFIX)) {
    return selectByTag(models, core.slice(TAG_PREFIX.length));
  }

  const matches = findModelsBySelectorName(models, core);
  if (matches.length === 0) return new Set();

  const rootIds = matches.map((m) => m.unique_id);
  if (up === 0 && down === 0) {
    return new Set(rootIds);
  }
  return collectLineageFromEdges(rootIds, edges, up, down);
}

/**
 * Node to treat as the focus anchor for `expression` (highlight / center), or `null` if unknown.
 * For `tag:` uses the first matching model (stable sort by package, name).
 * For model selectors (with or without `+`) uses the first resolved model name match.
 */
export function resolveSelectFocusModelId(
  expression: string,
  models: ModelSummary[]
): string | null {
  const raw = expression.trim();
  if (!raw) return null;

  const { core } = parseDbtGraphSelector(raw);
  if (!core) return null;

  if (core.toLowerCase().startsWith(TAG_PREFIX)) {
    const tag = core.slice(TAG_PREFIX.length).trim();
    if (!tag) return null;
    const tagged = models
      .filter((m) => (m.tags || []).includes(tag))
      .sort(
        (a, b) =>
          a.package_name.localeCompare(b.package_name) ||
          a.name.localeCompare(b.name)
      );
    return tagged[0]?.unique_id ?? null;
  }

  const matches = findModelsBySelectorName(models, core);
  const sorted = [...matches].sort(
    (a, b) =>
      a.package_name.localeCompare(b.package_name) || a.name.localeCompare(b.name)
  );
  return sorted[0]?.unique_id ?? null;
}

/**
 * `exclude` uses plain substring on unqualified `name` or `tag:tag` to drop models.
 */
export function resolveExcludeToDroppedIds(
  expression: string,
  models: ModelSummary[]
): Set<string> {
  const raw = expression.trim();
  if (!raw) return new Set();
  const lower = raw.toLowerCase();
  if (lower.startsWith(TAG_PREFIX)) {
    const tag = raw.slice(TAG_PREFIX.length).trim();
    if (!tag) return new Set();
    const out = new Set<string>();
    for (const m of models) {
      if ((m.tags || []).includes(tag)) out.add(m.unique_id);
    }
    return out;
  }
  const sub = lower;
  const out = new Set<string>();
  for (const m of models) {
    if (m.name.toLowerCase().includes(sub)) out.add(m.unique_id);
  }
  return out;
}
