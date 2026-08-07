import type { NexusScene } from "./types/scene.js";
import type { NexusComponent } from "./types/component.js";
import type { NexusAssetRegistry } from "./types/asset.js";

/**
 * @module project
 * @description Project manifest / root file model for NexusWeb.
 *
 * A project is a single root file (`project.nexus.json`) that describes a
 * versioned tree of files: folders, scene files, component files, and an
 * asset registry. Scenes/components are stored as references in the manifest
 * and their payloads are kept in the `files` map so the whole project can be
 * serialized to one human-readable, versioned JSON document.
 */

export type ProjectFileKind = "folder" | "scene" | "component";

export interface ProjectFile {
  id: string;
  kind: ProjectFileKind;
  name: string;
  parentId: string | null;
  children: string[];
  /** Present for scene files. */
  scene?: NexusScene;
  /** Present for component files. */
  component?: NexusComponent;
}

export interface ProjectManifestMeta {
  title?: string;
  description?: string;
  author?: string;
  version?: string;
}

export interface NexusProjectManifest {
  /** Format version of the manifest itself. */
  formatVersion: string;
  /** Schema version of the NexusWeb data model. */
  version: string;
  id: string;
  name: string;
  meta: ProjectManifestMeta;
  /** ID of the entrypoint scene file (root file). */
  rootFileId: string;
  /** Root of the file tree. */
  rootId: string;
  /** All files (folders, scenes, components) keyed by id. */
  files: Record<string, ProjectFile>;
  /** Shared asset registry for the whole project. */
  assets: NexusAssetRegistry;
  createdAt: string;
  updatedAt: string;
}

const PROJECT_FORMAT_VERSION = "1.0.0";

/**
 * Create an empty project manifest rooted at a single folder.
 */
export function createProjectManifest(
  name: string,
  rootScene: NexusScene,
  rootSceneFileId: string,
): NexusProjectManifest {
  const now = new Date().toISOString();
  const rootId = crypto.randomUUID();

  const rootFile: ProjectFile = {
    id: rootId,
    kind: "folder",
    name,
    parentId: null,
    children: [rootSceneFileId],
  };

  const sceneFile: ProjectFile = {
    id: rootSceneFileId,
    kind: "scene",
    name: rootScene.name,
    parentId: rootId,
    children: [],
    scene: rootScene,
  };

  return {
    formatVersion: PROJECT_FORMAT_VERSION,
    version: "0.1.0",
    id: crypto.randomUUID(),
    name,
    meta: {},
    rootFileId: rootSceneFileId,
    rootId,
    files: {
      [rootId]: rootFile,
      [rootSceneFileId]: sceneFile,
    },
    assets: rootScene.assets,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Serialize a project manifest to a human-readable JSON string.
 */
export function serializeProject(project: NexusProjectManifest): string {
  return JSON.stringify(project, null, 2);
}

/**
 * Parse a project manifest from a JSON string.
 */
export function parseProject(json: string): NexusProjectManifest {
  const parsed = JSON.parse(json) as NexusProjectManifest;
  if (!parsed.formatVersion || !parsed.files || !parsed.rootFileId) {
    throw new Error("Invalid project manifest: missing required fields");
  }
  return parsed;
}

/**
 * Collect all scene files in a project, in tree order.
 */
export function collectScenes(
  project: NexusProjectManifest,
): ProjectFile[] {
  const result: ProjectFile[] = [];
  const walk = (fileId: string) => {
    const file = project.files[fileId];
    if (!file) return;
    if (file.kind === "scene") result.push(file);
    for (const childId of file.children) walk(childId);
  };
  walk(project.rootId);
  return result;
}

/**
 * Collect all component files in a project.
 */
export function collectComponents(
  project: NexusProjectManifest,
): ProjectFile[] {
  const result: ProjectFile[] = [];
  const walk = (fileId: string) => {
    const file = project.files[fileId];
    if (!file) return;
    if (file.kind === "component") result.push(file);
    for (const childId of file.children) walk(childId);
  };
  walk(project.rootId);
  return result;
}

/**
 * Resolve the active entrypoint scene file.
 */
export function getRootSceneFile(
  project: NexusProjectManifest,
): ProjectFile | null {
  const file = project.files[project.rootFileId];
  return file && file.kind === "scene" ? file : null;
}
