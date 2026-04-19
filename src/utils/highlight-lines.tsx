import { createElement, ReactNode } from "react";

/**
 * Splits highlighted code (from rehype-highlight) into per-line arrays
 * while preserving syntax highlighting spans.
 *
 * rehype-highlight wraps tokens in <span className="hljs-*"> elements.
 * This function walks the React element tree, splits at newlines,
 * and re-wraps each line segment with its ancestor spans.
 */
export function splitHighlightedCode(codeElement: ReactNode): ReactNode[][] {
  const lines: ReactNode[][] = [[]];
  let keyIdx = 0;

  function walk(
    node: ReactNode,
    wrappers: Array<{ type: any; props: Record<string, any> }>
  ): void {
    if (node == null) return;

    if (typeof node === "number") {
      lines[lines.length - 1].push(String(node));
      return;
    }

    if (typeof node === "string") {
      const segments = node.split("\n");
      for (let i = 0; i < segments.length; i++) {
        if (i > 0) lines.push([]);
        if (segments[i]) {
          // Wrap text in all ancestor element wrappers (innermost first)
          let wrapped: ReactNode = segments[i];
          for (let w = wrappers.length - 1; w >= 0; w--) {
            const { type, props } = wrappers[w];
            // Strip key/children from cloned props
            const { key: _k, children: _c, ...cleanProps } = props as any;
            wrapped = createElement(type, { ...cleanProps, key: `hl-${keyIdx++}` }, wrapped);
          }
          lines[lines.length - 1].push(wrapped);
        }
      }
      return;
    }

    if (Array.isArray(node)) {
      node.forEach((n) => walk(n, wrappers));
      return;
    }

    if (typeof node === "object" && node !== null && "props" in node) {
      const el = node as any;
      const { children, ...props } = el.props;
      const type = el.type || "span";
      walk(children, [...wrappers, { type, props }]);
    }
  }

  // The `codeElement` is the children of <pre>, which is a <code> element.
  // We need the <code>'s children (the highlighted tokens).
  const codeChild = Array.isArray(codeElement) ? codeElement[0] : codeElement;
  if (codeChild && typeof codeChild === "object" && "props" in codeChild) {
    walk((codeChild as any).props.children, []);
  } else {
    walk(codeElement, []);
  }

  return lines;
}
