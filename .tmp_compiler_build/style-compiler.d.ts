import type { NexusScene, NexusStyle, NexusTransform, NexusResponsiveStyles } from "@nexusweb/core";
/**
 * Compile a NexusStyle object into an inline CSS string.
 * Returns something like "color: red; font-size: 16px;"
 * Skips undefined/null values.
 */
export declare function compileInlineStyle(style: NexusStyle): string;
/**
 * Compile NexusTransform into a CSS transform string.
 */
export declare function compileTransform(transform: NexusTransform): string;
/**
 * Compile responsive styles for a specific node into @media blocks.
 */
export declare function compileResponsiveStyles(nodeId: string, responsive: NexusResponsiveStyles): string;
/**
 * Compile global CSS for the scene.
 * Includes:
 * - CSS reset
 * - All responsive styles scoped by node ID
 * - Global style tokens
 */
export declare function compileGlobalCSS(scene: NexusScene): string;
//# sourceMappingURL=style-compiler.d.ts.map