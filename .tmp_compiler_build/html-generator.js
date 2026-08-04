import { NODE_TYPE_DEFAULT_TAG } from "@nexusweb/core";
import { compileInlineStyle } from "./style-compiler.js";
const SELF_CLOSING_TAGS = new Set(["img", "input", "br", "hr", "meta", "link"]);
// Build HTML entity strings using char codes to avoid entity decoding issues
const AMP = String.fromCharCode(38) + "amp;";
const LT = String.fromCharCode(38) + "lt;";
const GT = String.fromCharCode(38) + "gt;";
const QUOT = String.fromCharCode(38) + "quot;";
const APOS = String.fromCharCode(38) + "#39;";
function escapeHtml(str) {
    return str
        .replace(/&/g, AMP)
        .replace(/</g, LT)
        .replace(/>/g, GT)
        .replace(/\x22/g, QUOT)
        .replace(/\x27/g, APOS);
}
function getNodeTag(node) {
    if (node.tag)
        return node.tag;
    const defaultTag = NODE_TYPE_DEFAULT_TAG[node.type];
    return defaultTag || "div";
}
function buildAttributes(node, nodes) {
    const attrs = [];
    attrs.push('id="' + escapeHtml(node.id) + '"');
    attrs.push('data-node-type="' + escapeHtml(node.type) + '"');
    const layoutParts = [];
    const nodeX = node.transform.x ?? "0";
    const nodeY = node.transform.y ?? "0";
    layoutParts.push("position: absolute;");
    layoutParts.push(`left: ${nodeX};`);
    layoutParts.push(`top: ${nodeY};`);
    if (node.transform.width && node.transform.width !== "auto") {
        layoutParts.push(`width: ${node.transform.width};`);
    }
    if (node.transform.height && node.transform.height !== "auto") {
        layoutParts.push(`height: ${node.transform.height};`);
    }
    const inlineStyle = compileInlineStyle(node.style);
    const normalizedInlineStyle = inlineStyle && !inlineStyle.trim().endsWith(";")
        ? inlineStyle.trim() + ";"
        : inlineStyle;
    let styleValue = [normalizedInlineStyle, ...layoutParts]
        .filter(Boolean)
        .join(" ");
    const tag = getNodeTag(node);
    if (tag === "img") {
        if (node.data.objectFit) {
            styleValue = `object-fit: ${node.data.objectFit}; ` + styleValue;
        }
        if (node.data.assetRef)
            attrs.push('src="' + escapeHtml(node.data.assetRef) + '"');
        if (node.data.alt)
            attrs.push('alt="' + escapeHtml(node.data.alt) + '"');
        else
            attrs.push('alt=""');
    }
    if (styleValue) {
        attrs.push('style="' + escapeHtml(styleValue) + '"');
    }
    if (tag === "a") {
        if (node.data.href)
            attrs.push('href="' + escapeHtml(node.data.href) + '"');
        if (node.data.openInNewTab)
            attrs.push('target="_blank" rel="noopener noreferrer"');
    }
    if (tag === "input") {
        if (node.data.inputType)
            attrs.push('type="' + escapeHtml(node.data.inputType) + '"');
        else
            attrs.push('type="text"');
        if (node.data.name)
            attrs.push('name="' + escapeHtml(node.data.name) + '"');
        if (node.data.value)
            attrs.push('value="' + escapeHtml(node.data.value) + '"');
        if (node.data.placeholder)
            attrs.push('placeholder="' + escapeHtml(node.data.placeholder) + '"');
        if (node.data.required)
            attrs.push("required");
        if (node.data.disabled)
            attrs.push("disabled");
    }
    if (tag === "video") {
        if (node.data.autoplay)
            attrs.push("autoplay");
        if (node.data.muted)
            attrs.push("muted");
        if (node.data.loop)
            attrs.push("loop");
        if (node.data.assetRef)
            attrs.push('src="' + escapeHtml(node.data.assetRef) + '"');
    }
    return attrs.join(" ");
}
function renderNode(node, nodes) {
    const tag = getNodeTag(node);
    const attrs = buildAttributes(node, nodes);
    const isSelfClosing = SELF_CLOSING_TAGS.has(tag);
    if (isSelfClosing) {
        return "<" + tag + " " + attrs + " />";
    }
    let innerContent = "";
    if (node.type === "text" && node.data.content) {
        innerContent += escapeHtml(node.data.content);
    }
    if (node.type === "button" && node.data.text) {
        innerContent += escapeHtml(node.data.text);
    }
    if (node.type === "link" && node.data.text) {
        innerContent += escapeHtml(node.data.text);
    }
    if ((node.type === "textarea" || node.type === "select") && node.data.value) {
        innerContent += escapeHtml(node.data.value);
    }
    for (const childId of node.childrenIds) {
        const child = nodes[childId];
        if (child) {
            innerContent += renderNode(child, nodes);
        }
    }
    return "<" + tag + " " + attrs + ">" + innerContent + "</" + tag + ">";
}
export function generateHTML(scene) {
    const allNodes = scene.nodes;
    const root = allNodes[scene.rootId];
    if (!root) {
        return "<!DOCTYPE html><html><head></head><body></body></html>";
    }
    const headParts = [];
    headParts.push('<meta charset="UTF-8" />');
    const vp = scene.meta.viewport || "width=device-width, initial-scale=1.0";
    headParts.push('<meta name="viewport" content="' + escapeHtml(vp) + '" />');
    headParts.push("<title>" + escapeHtml(scene.meta.title || scene.name) + "</title>");
    if (scene.meta.description) {
        headParts.push('<meta name="description" content="' +
            escapeHtml(scene.meta.description) +
            '" />');
    }
    if (scene.meta.themeColor) {
        headParts.push('<meta name="theme-color" content="' +
            escapeHtml(scene.meta.themeColor) +
            '" />');
    }
    if (scene.meta.favicon) {
        headParts.push('<link rel="icon" href="' + escapeHtml(scene.meta.favicon) + '" />');
    }
    if (scene.meta.language) {
        headParts.push('<meta http-equiv="content-language" content="' +
            escapeHtml(scene.meta.language) +
            '" />');
    }
    if (scene.meta.customHead) {
        headParts.push(scene.meta.customHead);
    }
    // Compile root page node's style into the scene-root wrapper
    const rootStyle = compileInlineStyle(root.style);
    let bodyContent = "";
    for (const childId of root.childrenIds) {
        const child = allNodes[childId];
        if (child) {
            bodyContent += renderNode(child, allNodes);
        }
    }
    const sceneRootStyle = [
        "position: relative",
        "width: 100%",
        "min-height: 100vh",
        "overflow: hidden",
        rootStyle,
    ]
        .filter(Boolean)
        .join("; ");
    bodyContent =
        '<div id="scene-root" style="' +
            escapeHtml(sceneRootStyle) +
            '">' +
            bodyContent +
            "</div>";
    const headHtml = headParts.join("\n    ");
    const lang = scene.meta.language || "en";
    return ("<!DOCTYPE html>\n" +
        '<html lang="' +
        lang +
        '">\n' +
        "  <head>\n" +
        "    " +
        headHtml +
        "\n" +
        "  </head>\n" +
        "  <body>\n" +
        "    " +
        bodyContent +
        "\n" +
        "  </body>\n" +
        "</html>");
}
//# sourceMappingURL=html-generator.js.map