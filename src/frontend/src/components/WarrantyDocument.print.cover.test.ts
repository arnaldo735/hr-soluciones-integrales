import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Cover for the accepted change: the warranty document's block separation
 * survives printing. The on-screen preview and the printed sheet share the
 * same geometry, so the print rules must keep the identity and the clauses in
 * normal flow with their own top margin, and must collapse the 80 mm identity
 * grid to a single column.
 *
 * jsdom does not apply the stylesheet, so this file reads the real `index.css`
 * the Vite build ships and asserts the print rules are present. Vitest runs
 * with the frontend package as its working directory, so `src/index.css`
 * resolves from there. This is a stylesheet contract, not a pixel-layout test:
 * it proves the rules exist and target the right selectors, not that a browser
 * renders them.
 */

const css = readFileSync(resolve(process.cwd(), "src/index.css"), "utf8");

/** The body of the first `@media print { ... }` block, brace-balanced. */
function printBlock(): string {
  const start = css.indexOf("@media print");
  if (start === -1) {
    throw new Error("@media print block not found in index.css");
  }
  const open = css.indexOf("{", start);
  let depth = 0;
  for (let index = open; index < css.length; index += 1) {
    const char = css[index];
    if (char === "{") depth += 1;
    else if (char === "}") {
      depth -= 1;
      if (depth === 0) return css.slice(open + 1, index);
    }
  }
  throw new Error("unterminated @media print block");
}

/** True when `selector` appears as a rule selector inside `block`. */
function hasRule(block: string, selector: string): boolean {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // A rule selector starts a line (after indentation) and is followed by `{`
  // or a comma when it is part of a selector list.
  return new RegExp(`(^|\\n)\\s*${escaped}\\s*(,|\\{)`).test(block);
}

describe("warranty document print rules (cover)", () => {
  it("keeps the identity and clauses in normal flow with their own top margin", () => {
    const print = printBlock();

    // The print rules re-assert the top margin of each block, so the header
    // never sits on top of the identity or the clauses on paper.
    expect(hasRule(print, ".doc-preview .doc-warranty-identity")).toBe(true);
    expect(hasRule(print, ".doc-preview .doc-warranty-clauses")).toBe(true);
    expect(print).toMatch(
      /\.doc-preview \.doc-warranty-identity\s*\{[^}]*margin-top:\s*4mm\s*!important/,
    );
    expect(print).toMatch(
      /\.doc-preview \.doc-warranty-clauses\s*\{[^}]*margin-top:\s*4mm\s*!important/,
    );
  });

  it("collapses the 80 mm identity grid to a single column in print", () => {
    const print = printBlock();

    expect(hasRule(print, ".doc-preview-80mm .doc-warranty-identity dl")).toBe(
      true,
    );
    expect(print).toMatch(
      /\.doc-preview-80mm \.doc-warranty-identity dl\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*!important/,
    );
  });

  it("keeps the IMPORTANTE notice card intact on paper", () => {
    const print = printBlock();

    // The amber notice keeps its surface and border literals in print, so the
    // body block stays visually separated from the clauses above it.
    expect(hasRule(print, ".doc-preview .doc-warranty-important")).toBe(true);
    expect(print).toMatch(
      /\.doc-preview \.doc-warranty-important\s*\{[^}]*background-color:\s*#fef3c7\s*!important/,
    );
  });

  it("keeps the 80 mm header stacked and centered on paper", () => {
    const print = printBlock();

    // The printed roll keeps the stacked header, so the company identity and
    // the title/number block each take their own row.
    expect(hasRule(print, ".doc-preview-80mm .doc-header")).toBe(true);
    expect(print).toMatch(
      /\.doc-preview-80mm \.doc-header\s*\{[^}]*flex-direction:\s*column\s*!important/,
    );
    expect(hasRule(print, ".doc-preview-80mm .doc-header-identity")).toBe(true);
  });
});
