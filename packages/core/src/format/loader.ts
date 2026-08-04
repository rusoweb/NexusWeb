import JSZip from "jszip";
import type { NexusScene } from "../types/scene.js";
import type { ValidatedNexusScene } from "../schema/validator.js";
import { NexusSceneSchema } from "../schema/validator.js";

export interface NexusBundle {
  scene: ValidatedNexusScene;
  assets: Map<string, Uint8Array>;
}

export function parseScene(jsonString: string): ValidatedNexusScene {
  const parsed = JSON.parse(jsonString);
  return NexusSceneSchema.parse(parsed);
}

export function serializeScene(
  scene: NexusScene | ValidatedNexusScene,
): string {
  return JSON.stringify(scene, null, 2);
}

export async function loadBundle(source: Blob): Promise<NexusBundle> {
  const zip = await JSZip.loadAsync(source);

  const sceneFile = zip.file("scene.json");
  if (!sceneFile) {
    throw new Error("Invalid .nexus bundle: missing scene.json");
  }

  const sceneJson = await sceneFile.async("string");
  const scene = parseScene(sceneJson);

  const assets = new Map<string, Uint8Array>();
  const promises: Promise<void>[] = [];

  const assetFolder = zip.folder("assets");
  assetFolder?.forEach((relativePath: string, file: any) => {
    if (!file.dir) {
      promises.push(
        file.async("uint8array").then((data: Uint8Array) => {
          assets.set(relativePath, data);
        }),
      );
    }
  });

  await Promise.all(promises);
  return { scene, assets };
}

export async function saveBundle(bundle: NexusBundle): Promise<Blob> {
  const zip = new JSZip();
  zip.file("scene.json", serializeScene(bundle.scene));

  const assetFolder = zip.folder("assets");
  if (assetFolder) {
    bundle.assets.forEach((data: Uint8Array, path: string) => {
      assetFolder.file(path, data);
    });
  }

  return zip.generateAsync({ type: "blob" });
}

export function createEmptyScene(name: string): NexusScene {
  const rootId = crypto.randomUUID();
  const now = new Date().toISOString();

  return {
    version: "0.1.0",
    id: crypto.randomUUID(),
    name,
    isComponent: false,
    meta: { title: name, language: "en" },
    nodes: {
      [rootId]: {
        id: rootId,
        type: "page",
        name: "Root",
        parentId: null,
        childrenIds: [],
        transform: { x: "0", y: "0", width: "100%", height: "100%" },
        style: { backgroundColor: "#0d0d0d", color: "#cccccc" },
        inputs: [],
        outputs: [],
        data: {},
        meta: {},
      },
    },
    rootId,
    signals: [],
    assets: { version: "0.1.0", assets: [] },
    createdAt: now,
    updatedAt: now,
  };
}
