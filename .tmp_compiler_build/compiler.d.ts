import type { NexusScene } from "@nexusweb/core";
export interface CompileResult {
    html: string;
    css: string;
    js: string;
    assets: Map<string, Uint8Array>;
}
export declare function compileScene(scene: NexusScene): CompileResult;
export declare function compileToBlob(scene: NexusScene): Promise<Blob>;
export declare function downloadCompiledScene(scene: NexusScene, filename: string): void;
//# sourceMappingURL=compiler.d.ts.map