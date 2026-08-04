import type { NexusScene } from "./scene.js";

export interface ComponentExport {
  name: string;
  label: string;
  type: "string" | "number" | "boolean" | "color" | "asset" | "node" | "enum";
  defaultValue?: unknown;
  options?: string[];
  description?: string;
  category?: string;
}

export interface NexusComponent {
  id: string;
  name: string;
  description?: string;
  category: string;
  tags?: string[];
  thumbnail?: string;
  exports: ComponentExport[];
  scene: NexusScene;
  version: string;
}

export interface ComponentLibrary {
  version: string;
  components: NexusComponent[];
}
