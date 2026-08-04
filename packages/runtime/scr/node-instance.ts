/**
 * @module node-instance
 * @description Per-node runtime behavior and lifecycle hooks.
 */

import type { NexusNode, LiveNode } from "@nexusweb/core";

/**
 * Base class for node runtime behavior.
 * Extend this to create custom node types with logic.
 */
export abstract class NodeBehavior {
  protected node: NexusNode;
  protected live: LiveNode;

  constructor(node: NexusNode, live: LiveNode) {
    this.node = node;
    this.live = live;
  }

  /** Called once when the node enters the tree and DOM is ready. */
  abstract _ready(): void;

  /** Called every frame (requestAnimationFrame). Delta is in seconds. */
  abstract _process(delta: number): void;

  /** Called once when the node is removed from the tree. */
  abstract _exit(): void;

  /** Called when an input signal is received. */
  abstract _onSignal(portId: string, value: unknown): void;
}

/**
 * Default behavior for visual nodes (no-op logic).
 */
export class VisualNodeBehavior extends NodeBehavior {
  _ready(): void {
    // Default: nothing
  }

  _process(_delta: number): void {
    // Default: nothing
  }

  _exit(): void {
    // Default: nothing
  }

  _onSignal(_portId: string, _value: unknown): void {
    // Default: nothing
  }
}