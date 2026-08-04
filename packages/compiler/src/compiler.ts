import type { NexusScene } from "@nexusweb/core";
import JSZip from "jszip";
import { generateHTML } from "./html-generator.js";
import { compileGlobalCSS } from "./style-compiler.js";
import { compileBehaviors } from "./behavior-compiler.js";

export interface CompileResult {
  html: string;
  css: string;
  js: string;
  assets: Map<string, Uint8Array>;
}

function extractBodyContent(fullHtml: string): string {
  const bodyMatch = fullHtml.match(/<body>([\s\S]*)<\/body>/i);
  if (bodyMatch && bodyMatch[1]) {
    return bodyMatch[1].trim();
  }
  return fullHtml;
}

export function compileScene(scene: NexusScene): CompileResult {
  const htmlBody = generateHTML(scene);
  const css = compileGlobalCSS(scene);
  const js = compileBehaviors(scene);

  const QUOT = String.fromCharCode(38) + "quot;";
  const escapedLang = (scene.meta.language || "en").replace(/\x22/g, QUOT);

  const html =
    "<!DOCTYPE html>\n" +
    '<html lang="' +
    escapedLang +
    '">\n' +
    "<head>\n" +
    css +
    "\n" +
    "</head>\n" +
    "<body>\n" +
    extractBodyContent(htmlBody) +
    (js ? "\n" + js : "") +
    "\n" +
    "</body>\n" +
    "</html>";

  const assets = new Map<string, Uint8Array>();

  return { html, css, js, assets };
}

export async function compileToBlob(scene: NexusScene): Promise<Blob> {
  const result = compileScene(scene);
  const zip = new JSZip();

  zip.file("index.html", result.html);

  if (result.assets.size > 0) {
    const assetFolder = zip.folder("assets");
    if (assetFolder) {
      result.assets.forEach((data, path) => {
        assetFolder.file(path, data);
      });
    }
  }

  return zip.generateAsync({ type: "blob" });
}

export function downloadCompiledScene(
  scene: NexusScene,
  filename: string,
): void {
  compileToBlob(scene).then((blob) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    const dlName = filename.endsWith(".zip") ? filename : filename + ".zip";
    anchor.download = dlName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  });
}
