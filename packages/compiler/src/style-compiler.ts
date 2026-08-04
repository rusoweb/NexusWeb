import type {
  NexusScene,
  NexusStyle,
  NexusTransform,
  NexusResponsiveStyles,
  SpacingValue,
} from "@nexusweb/core";
import { flattenTree } from "@nexusweb/core";

/**
 * Convert camelCase string to kebab-case.
 * e.g. "backgroundColor" -> "background-color"
 */
function camelToKebab(str: string): string {
  return str.replace(/([A-Z])/g, "-$1").toLowerCase();
}

/**
 * Render a SpacingValue into CSS shorthand string.
 * e.g. "10px" -> "10px"
 * { top: "5px", right: "10px", bottom: "5px", left: "10px" } -> "5px 10px 5px 10px"
 */
function renderSpacingValue(value: SpacingValue): string {
  if (typeof value === "string") return value;
  return `${value.top} ${value.right} ${value.bottom} ${value.left}`;
}

/**
 * Compile a NexusStyle object into an inline CSS string.
 * Returns something like "color: red; font-size: 16px;"
 * Skips undefined/null values.
 */
export function compileInlineStyle(style: NexusStyle): string {
  const parts: string[] = [];

  for (const [key, value] of Object.entries(style)) {
    if (value === undefined || value === null) continue;

    const cssKey = camelToKebab(key);

    // Handle SpacingValue for padding and margin
    if ((key === "padding" || key === "margin") && typeof value === "object") {
      parts.push(`${cssKey}: ${renderSpacingValue(value as SpacingValue)}`);
    } else {
      parts.push(`${cssKey}: ${value}`);
    }
  }

  const styleString = parts.join("; ");
  return styleString ? `${styleString};` : "";
}

/**
 * Compile NexusTransform into a CSS transform string.
 */
export function compileTransform(transform: NexusTransform): string {
  const transforms: string[] = [];

  // translate(x, y)
  transforms.push(`translate(${transform.x}, ${transform.y})`);

  // rotate(deg)
  if (transform.rotation !== undefined && transform.rotation !== 0) {
    transforms.push(`rotate(${transform.rotation}deg)`);
  }

  // scale(x, y)
  const sx = transform.scaleX ?? 1;
  const sy = transform.scaleY ?? 1;
  if (sx !== 1 || sy !== 1) {
    transforms.push(`scale(${sx}, ${sy})`);
  }

  return transforms.join(" ");
}

/**
 * Generate @media query string for a breakpoint key.
 */
function breakpointMediaQuery(bp: string): string {
  switch (bp) {
    case "sm":
      return "(min-width: 640px)";
    case "md":
      return "(min-width: 768px)";
    case "lg":
      return "(min-width: 1024px)";
    case "xl":
      return "(min-width: 1280px)";
    case "2xl":
      return "(min-width: 1536px)";
    default:
      return "";
  }
}

/**
 * Compile responsive styles for a specific node into @media blocks.
 */
export function compileResponsiveStyles(
  nodeId: string,
  responsive: NexusResponsiveStyles,
): string {
  if (!responsive) return "";

  const blocks: string[] = [];
  const breakpoints = ["sm", "md", "lg", "xl", "2xl"] as const;

  for (const bp of breakpoints) {
    const styles = responsive[bp];
    if (!styles || Object.keys(styles).length === 0) continue;

    const mediaQuery = breakpointMediaQuery(bp);
    if (!mediaQuery) continue;

    const inlineStyle = compileInlineStyle(styles as NexusStyle);
    if (!inlineStyle) continue;

    blocks.push(`  @media ${mediaQuery} {
    #${nodeId} { ${inlineStyle} }
  }`);
  }

  return blocks.join("\n");
}

/**
 * Compile global CSS for the scene.
 * Includes:
 * - CSS reset
 * - All responsive styles scoped by node ID
 * - Global style tokens
 */
export function compileGlobalCSS(scene: NexusScene): string {
  const parts: string[] = [];

  parts.push("<style>");

  // CSS reset
  parts.push(`*,
*::before,
*::after {
  box-sizing: border-box;
}
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  min-height: 100%;
}
body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
}`);

  // Global style tokens as CSS custom properties
  if (scene.globalStyle?.tokens) {
    const tokenEntries = Object.entries(scene.globalStyle.tokens)
      .map(([key, value]) => `  --${key}: ${value};`)
      .join("\n");
    parts.push(`:root {
${tokenEntries}
}`);
  }

  // Global raw CSS
  if (scene.globalStyle?.css) {
    parts.push(scene.globalStyle.css);
  }

  // Responsive styles for each node
  const allNodes = flattenTree(scene.rootId, scene.nodes);
  for (const node of allNodes) {
    if (node.responsive) {
      const css = compileResponsiveStyles(node.id, node.responsive);
      if (css) parts.push(css);
    }
  }

  parts.push("</style>");

  return parts.join("\n");
}
