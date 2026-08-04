/**
 * @module signal-bus
 * @description The internal pub/sub system for node communication.
 * Decoupled from DOM events. Wires connect output ports to input ports.
 */

import type { NexusSignalLink, SignalPayload, SignalHandler } from "@nexusweb/core";

type HandlerEntry = { handler: SignalHandler; linkId: string };

export class SignalBus {
  private subscriptions = new Map<string, HandlerEntry[]>();
  private links: NexusSignalLink[] = [];

  /**
   * Register all signal links from a scene.
   */
  loadLinks(links: NexusSignalLink[]): void {
    this.links = links;
  }

  /**
   * Subscribe to a specific signal channel.
   * Channels are named: "nodeId:portId"
   */
  subscribe(channel: string, handler: SignalHandler, linkId: string): () => void {
    const entries = this.subscriptions.get(channel) ?? [];
    entries.push({ handler, linkId });
    this.subscriptions.set(channel, entries);

    // Return unsubscribe function
    return () => {
      const current = this.subscriptions.get(channel) ?? [];
      this.subscriptions.set(
        channel,
        current.filter((e) => e.linkId !== linkId)
      );
    };
  }

  /**
   * Emit a signal on a channel.
   */
  emit<T>(channel: string, value: T, fromNodeId?: string, fromPortId?: string): void {
    const entries = this.subscriptions.get(channel);
    if (!entries || entries.length === 0) return;

    const payload: SignalPayload<T> = {
      linkId: "manual",
      from: fromNodeId ?? "unknown",
      fromPort: fromPortId ?? "unknown",
      value,
      timestamp: Date.now(),
    };

    for (const entry of entries) {
      try {
        entry.handler(payload);
      } catch (err) {
        console.error(`[SignalBus] Handler failed for ${channel}:`, err);
      }
    }
  }

  /**
   * Connect two ports via a link.
   * Automatically routes source output → target input.
   */
  connect(link: NexusSignalLink): void {
    const sourceChannel = `${link.source}:${link.sourceOutput}`;
    const targetChannel = `${link.target}:${link.targetInput}`;

    this.subscribe(sourceChannel, (payload) => {
      this.emit(targetChannel, payload.value, link.source, link.sourceOutput);
    }, link.id);
  }

  /**
   * Auto-connect all links in the scene.
   */
  autoConnect(links: NexusSignalLink[]): void {
    for (const link of links) {
      this.connect(link);
    }
  }

  /**
   * Clear all subscriptions.
   */
  clear(): void {
    this.subscriptions.clear();
    this.links = [];
  }

  /**
   * Debug: list active channels.
   */
  debug(): void {
    console.log("[SignalBus] Active channels:");
    for (const [channel, entries] of this.subscriptions) {
      console.log(`  ${channel}: ${entries.length} handler(s)`);
    }
  }
}