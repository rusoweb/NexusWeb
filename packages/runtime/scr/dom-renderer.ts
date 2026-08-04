/**
 * @module dom-renderer
 * @description Renders NexusNodes to actual DOM elements.
 * Maps node types to HTML tags and applies computed styles.
 */

import type { NexusNode } from "@nexusweb/core";
import { NODE_TYPE_DEFAULT_TAG } from "@nexusweb/core";
import { SignalBus } from "./signal-bus.js";

export class DOMRenderer {
  private container: HTMLElement;
  private elements = new Map<string, HTMLElement>();
  private signalBus: SignalBus;

  constructor(container: HTMLElement, signalBus: SignalBus) {
    this.container = container;
    this.signalBus = signalBus;
  }

  /**
   * Mount a node to the DOM.
   */
  mount(node: NexusNode, parentElement: HTMLElement | null): HTMLElement {
    const tag = node.tag ?? NODE_TYPE_DEFAULT_TAG[node.type as keyof typeof NODE_TYPE_DEFAULT_TAG] ?? "div";
    const el = document.createElement(tag);

    // Set ID and data attributes
    el.id = node.id;
    el.dataset.nodeType = node.type;
    if (node.name) el.dataset.nodeName = node.name;

    // Apply inline styles
    this.applyStyles(el, node);

    // Apply type-specific DOM attributes
    this.applyTypeAttributes(el, node);

    // Wire signal outputs to DOM events
    this.wireEvents(el, node);

    // Mount to parent
    const target = parentElement ?? this.container;
    target.appendChild(el);

    this.elements.set(node.id, el);
    return el;
  }

  /**
   * Get a mounted element by node ID.
   */
  getElement(nodeId: string): HTMLElement | null {
    return this.elements.get(nodeId) ?? null;
  }

  /**
   * Unmount all elements.
   */
  unmountAll(): void {
    for (const el of this.elements.values()) {
      el.remove();
    }
    this.elements.clear();
  }

  /**
   * Update a node's styles at runtime.
   */
  updateStyles(nodeId: string, styles: Record<string, string>): void {
    const el = this.elements.get(nodeId);
    if (!el) return;
    for (const [key, value] of Object.entries(styles)) {
      el.style.setProperty(this.toCssProperty(key), value);
    }
  }

  private applyStyles(el: HTMLElement, node: NexusNode): void {
    const style = node.style;
    if (style.backgroundColor) el.style.backgroundColor = style.backgroundColor;
    if (style.color) el.style.color = style.color;
    if (style.fontSize) el.style.fontSize = style.fontSize;
    if (style.fontWeight) el.style.fontWeight = String(style.fontWeight);
    if (style.fontFamily) el.style.fontFamily = style.fontFamily;
    if (style.textAlign) el.style.textAlign = style.textAlign;
    if (style.padding) el.style.padding = typeof style.padding === "string" ? style.padding : `${style.padding.top} ${style.padding.right} ${style.padding.bottom} ${style.padding.left}`;
    if (style.margin) el.style.margin = typeof style.margin === "string" ? style.margin : `${style.margin.top} ${style.margin.right} ${style.margin.bottom} ${style.margin.left}`;
    if (style.borderRadius) el.style.borderRadius = style.borderRadius;
    if (style.borderWidth) el.style.borderWidth = style.borderWidth;
    if (style.borderColor) el.style.borderColor = style.borderColor;
    if (style.borderStyle) el.style.borderStyle = style.borderStyle;
    if (style.display) el.style.display = style.display;
    if (style.flexDirection) el.style.flexDirection = style.flexDirection;
    if (style.justifyContent) el.style.justifyContent = style.justifyContent;
    if (style.alignItems) el.style.alignItems = style.alignItems;
    if (style.gap) el.style.gap = style.gap;
    if (style.overflow) el.style.overflow = style.overflow;
    if (style.opacity !== undefined) el.style.opacity = String(style.opacity);
    if (style.cursor) el.style.cursor = style.cursor;
    if (style.width) el.style.width = style.width;
    if (style.height) el.style.height = style.height;
    if (style.maxWidth) el.style.maxWidth = style.maxWidth;
    if (style.minWidth) el.style.minWidth = style.minWidth;
    if (style.maxHeight) el.style.maxHeight = style.maxHeight;
    if (style.minHeight) el.style.minHeight = style.minHeight;
    if (style.boxShadow) el.style.boxShadow = style.boxShadow;
    if (style.transition) el.style.transition = style.transition;

    // Transform
    const transforms: string[] = [];
    if (node.transform.x !== "0" || node.transform.y !== "0") {
      transforms.push(`translate(${node.transform.x}, ${node.transform.y})`);
    }
    if (node.transform.rotation) transforms.push(`rotate(${node.transform.rotation}deg)`);
    if (node.transform.scaleX !== undefined || node.transform.scaleY !== undefined) {
      transforms.push(`scale(${node.transform.scaleX ?? 1}, ${node.transform.scaleY ?? 1})`);
    }
    if (transforms.length > 0) {
      el.style.transform = transforms.join(" ");
    }

    // Z-index
    if (node.transform.zIndex !== undefined) {
      el.style.zIndex = String(node.transform.zIndex);
    }
  }

  private applyTypeAttributes(el: HTMLElement, node: NexusNode): void {
    const data = node.data;

    switch (node.type) {
      case "text":
        if (data.content) el.textContent = data.content;
        break;
      case "image":
        if (data.assetRef) (el as HTMLImageElement).src = data.assetRef;
        if (data.alt) (el as HTMLImageElement).alt = data.alt;
        break;
      case "link":
        if (data.href) (el as HTMLAnchorElement).href = data.href;
        if (data.openInNewTab) (el as HTMLAnchorElement).target = "_blank";
        if (data.text) el.textContent = data.text;
        break;
      case "button":
        if (data.text) el.textContent = data.text;
        if (data.submit) (el as HTMLButtonElement).type = "submit";
        break;
      case "input":
        if (data.inputType) (el as HTMLInputElement).type = data.inputType;
        if (data.name) (el as HTMLInputElement).name = data.name;
        if (data.value) (el as HTMLInputElement).value = data.value;
        if (data.placeholder) (el as HTMLInputElement).placeholder = data.placeholder;
        if (data.required) (el as HTMLInputElement).required = true;
        if (data.disabled) (el as HTMLInputElement).disabled = true;
        break;
    }

    // ARIA
    if (node.ariaRole) el.setAttribute("role", node.ariaRole);
    if (node.ariaLabel) el.setAttribute("aria-label", node.ariaLabel);
  }

  private wireEvents(el: HTMLElement, node: NexusNode): void {
    // Wire button "pressed" output to click event
    if (node.type === "button" && node.outputs.some((o) => o.id === "pressed")) {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        this.signalBus.emit(`${node.id}:pressed`, { timestamp: Date.now() }, node.id, "pressed");
      });
    }

    // Wire input "changed" output
    if (node.type === "input" && node.outputs.some((o) => o.id === "changed")) {
      el.addEventListener("input", () => {
        const value = (el as HTMLInputElement).value;
        this.signalBus.emit(`${node.id}:changed`, value, node.id, "changed");
      });
    }
  }

  private toCssProperty(key: string): string {
    // Convert camelCase to kebab-case
    return key.replace(/([A-Z])/g, "-$1").toLowerCase();
  }
}