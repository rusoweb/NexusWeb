/**
 * @module engine
 * @description The main runtime engine. Loads scenes and manages the node tree.
 */

import type { NexusScene, NexusNode, LiveNode } from "@nexusweb/core";
import { flattenTree } from "@nexusweb/core";
import { SignalBus } from "./signal-bus.js";
import { DOMRenderer } from "./dom-renderer.js";

export interface EngineOptions {
  /** DOM element to mount the scene into. */
  container: HTMLElement;
  /** Optional: initial global state. */
  initialState?: Record<string, unknown>;
}

/**
 * The NexusWeb Runtime Engine.
 * Owns the scene, signal bus, and DOM renderer.
 */
export class NexusEngine {
  private scene: NexusScene;
  private container: HTMLElement;
  private liveNodes = new Map<string, LiveNode>();
  private signalBus: SignalBus;
  private renderer: DOMRenderer;
  private state: Record<string, unknown>;
  private running = false;
  private animationFrameId: number | null = null;

  constructor(scene: NexusScene, options: EngineOptions) {
    this.scene = scene;
    this.container = options.container;
    this.state = options.initialState ?? {};
    this.signalBus = new SignalBus();
    this.renderer = new DOMRenderer(this.container, this.signalBus);
  }

  /**
   * Start the engine. Mounts all nodes and begins the process loop.
   */
  start(): void {
    if (this.running) return;
    this.running = true;

    const allNodes = flattenTree(this.scene.rootId, this.scene.nodes);

    // Phase 1: Create live node instances
    for (const node of allNodes) {
      this.liveNodes.set(node.id, {
        definition: node,
        computedStyle: {},
        computedTransform: {},
        mounted: false,
      });
    }

    // Phase 2: Mount to DOM (top-down)
    for (const node of allNodes) {
      this.renderer.mount(node, this.findParentElement(node));
    }

    // Phase 3: Call _ready on all nodes (bottom-up)
    for (let i = allNodes.length - 1; i >= 0; i--) {
      this.callReady(allNodes[i]);
    }

    // Phase 4: Start process loop
    this.loop();

    console.log(`[NexusEngine] Scene "${this.scene.name}" mounted with ${allNodes.length} nodes.`);
  }

  /**
   * Stop the engine. Unmounts all nodes and cleans up.
   */
  stop(): void {
    if (!this.running) return;
    this.running = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    const allNodes = flattenTree(this.scene.rootId, this.scene.nodes);
    for (let i = allNodes.length - 1; i >= 0; i--) {
      this.callExit(allNodes[i]);
    }

    this.renderer.unmountAll();
    this.liveNodes.clear();
    this.signalBus.clear();

    console.log(`[NexusEngine] Scene "${this.scene.name}" stopped.`);
  }

  /**
   * Get a live node by ID.
   */
  getNode(id: string): LiveNode | undefined {
    return this.liveNodes.get(id);
  }

  /**
   * Get global state.
   */
  getState(): Record<string, unknown> {
    return { ...this.state };
  }

  /**
   * Set global state (triggers reactive updates).
   */
  setState(key: string, value: unknown): void {
    this.state[key] = value;
    this.signalBus.emit("stateChange", { key, value });
  }

  private loop = (): void => {
    if (!this.running) return;

    const allNodes = flattenTree(this.scene.rootId, this.scene.nodes);
    for (const node of allNodes) {
      this.callProcess(node);
    }

    this.animationFrameId = requestAnimationFrame(this.loop);
  };

  private findParentElement(node: NexusNode): HTMLElement | null {
    if (!node.parentId) return this.container;
    return this.renderer.getElement(node.parentId);
  }

  private callReady(node: NexusNode): void {
    const live = this.liveNodes.get(node.id);
    if (!live) return;

    // TODO: Call user-defined _ready hook
    // For now, mark as ready
    live.mounted = true;
  }

  private callProcess(node: NexusNode): void {
    const live = this.liveNodes.get(node.id);
    if (!live || !live.mounted) return;

    // TODO: Call user-defined _process(delta) hook
    // For now, no-op (DOM mutations are event-driven)
  }

  private callExit(node: NexusNode): void {
    const live = this.liveNodes.get(node.id);
    if (!live) return;

    // TODO: Call user-defined _exit hook
    live.mounted = false;
  }
}