import type { NexusNode } from "./node.js";
import type { NexusAssetRegistry } from "./asset.js";
import type { NexusSignalLink } from "./signal.js";

export interface SceneMeta {
  title: string;
  description?: string;
  language?: string;
  favicon?: string;
  themeColor?: string;
  viewport?: string;
  customHead?: string;
}

export interface NexusScene {
  version: string;
  id: string;
  name: string;
  isComponent: boolean;
  meta: SceneMeta;
  nodes: Record<string, NexusNode>;
  rootId: string;
  signals: NexusSignalLink[];
  assets: NexusAssetRegistry;
  globalStyle?: {
    css?: string;
    tokens?: Record<string, string>;
  };
  createdAt: string;
  updatedAt: string;
}

export interface SceneInstance {
  scene: NexusScene;
  liveNodes: Map<string, LiveNode>;
  subscriptions: Map<string, Set<string>>;
  state: Record<string, unknown>;
}

export interface LiveNode {
  definition: NexusNode;
  computedStyle: Record<string, string>;
  computedTransform: Record<string, number | string>;
  mounted: boolean;
  element?: HTMLElement;
  instanceProps?: Record<string, unknown>;
}