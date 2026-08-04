/**
 * @module runtime
 * @description NexusWeb Runtime Engine — Phase 1
 *
 * The runtime loads a NexusScene and mounts it into a DOM container.
 * Every node gets a lifecycle: _ready → _process → _exit
 */

export * from "./engine.js";
export * from "./node-instance.js";
export * from "./signal-bus.js";
export * from "./dom-renderer.js";