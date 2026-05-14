import type { CSSProperties } from "react";
import type { BundledLanguage, Highlighter, ThemedToken } from "shiki";

let highlighterPromise: Promise<Highlighter> | null = null;

/** Lazy-loads Shiki with only SQL + Jinja grammars and GitHub themes (matches most UIs). */
export function getDbtHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = import("shiki").then(({ createHighlighter }) =>
      createHighlighter({
        themes: ["github-light", "github-dark"],
        langs: ["sql", "jinja"],
      })
    );
  }
  return highlighterPromise;
}

const JINJA_RE = /\{\%|\{\{/;

/**
 * dbt "source" can be Jinja+SQL; compiled is plain SQL. Shiki has no dedicated
 * "jinja+sql" grammar: we use the `jinja` grammar for mixed templates (Jinja
 * directives + ref/source/etc) and `sql` for pure SQL and compiled output.
 */
export function pickDbtShikiLang(
  code: string,
  variant: "source" | "compiled"
): BundledLanguage {
  if (variant === "compiled") return "sql";
  return JINJA_RE.test(code) ? "jinja" : "sql";
}

export function shikiThemeName(resolved: string | undefined): "github-light" | "github-dark" {
  return resolved === "dark" ? "github-dark" : "github-light";
}

// VS Code / TextMate font style bits: Italic = 1, Bold = 2, Underline = 4
const ITALIC = 1;
const BOLD = 2;

export function tokenTextStyle(
  fontStyle: number | undefined
): CSSProperties {
  if (fontStyle == null || fontStyle === 0) return {};
  return {
    fontWeight: fontStyle & BOLD ? 600 : undefined,
    fontStyle: fontStyle & ITALIC ? "italic" : undefined,
  };
}

export type { ThemedToken };
