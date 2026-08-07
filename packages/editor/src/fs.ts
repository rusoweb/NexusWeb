import type { NexusProjectManifest } from "@nexusweb/core";
import { serializeProject, parseProject } from "@nexusweb/core";

/**
 * @module fs
 * @description Filesystem abstraction for NexusWeb projects.
 *
 * Provides a `FileSystemProvider` interface that can be backed by:
 *  - The browser File System Access API (Chrome/Edge) for real folder access
 *  - A download/upload fallback (Firefox/Safari) using `.nexus.json` bundles
 *
 * The Node/Electron backend is stubbed so it only activates in a Node-like
 * environment and never breaks the browser build.
 */

export interface ProjectSaveResult {
  path: string;
  name: string;
}

export interface FileSystemProvider {
  /** Open a project from a folder (FS Access API) or a file (fallback). */
  openProject(): Promise<NexusProjectManifest | null>;
  /** Save the whole project to disk. */
  saveProject(
    project: NexusProjectManifest,
    suggestedName?: string,
  ): Promise<ProjectSaveResult | null>;
  /** Save a single scene/component file. */
  saveFile(
    project: NexusProjectManifest,
    fileId: string,
  ): Promise<ProjectSaveResult | null>;
  /** Whether real folder access is available. */
  supportsFolders: boolean;
}

/* ------------------------------------------------------------------ */
/*  Download / upload fallback (works everywhere)                      */
/* ------------------------------------------------------------------ */

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function safeProjectName(name: string): string {
  const clean = name
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return clean || "untitled-project";
}

/* ------------------------------------------------------------------ */
/*  Browser File System Access API provider                            */
/* ------------------------------------------------------------------ */

interface FileSystemHandle {
  kind: "file" | "directory";
  name: string;
  getFile?: () => Promise<File>;
  values?: () => AsyncIterable<FileSystemHandle>;
  getDirectoryHandle?: (
    name: string,
    opts?: { create?: boolean },
  ) => Promise<FileSystemHandle>;
  getFileHandle?: (
    name: string,
    opts?: { create?: boolean },
  ) => Promise<FileSystemHandle>;
  createWritable?: () => Promise<{
    write: (data: Blob | string) => Promise<void>;
    close: () => Promise<void>;
  }>;
  queryPermission?: (opts: { mode: "read" | "readwrite" }) => Promise<string>;
  requestPermission?: (opts: { mode: "read" | "readwrite" }) => Promise<string>;
}

interface WindowWithFS extends Window {
  showDirectoryPicker?: () => Promise<FileSystemHandle>;
  showOpenFilePicker?: (opts?: {
    multiple?: boolean;
    types?: Array<{ description: string; accept: Record<string, string[]> }>;
  }) => Promise<FileSystemHandle[]>;
  showSaveFilePicker?: (opts?: {
    suggestedName?: string;
    types?: Array<{ description: string; accept: Record<string, string[]> }>;
  }) => Promise<FileSystemHandle>;
}

function hasFSAccess(): boolean {
  return typeof window !== "undefined" && !!("showDirectoryPicker" in window);
}

async function readManifestFromHandle(
  dirHandle: FileSystemHandle,
): Promise<NexusProjectManifest | null> {
  if (!dirHandle.getFileHandle) return null;
  try {
    const fileHandle = await dirHandle.getFileHandle("project.nexus.json");
    if (!fileHandle.getFile) return null;
    const file = await fileHandle.getFile();
    const text = await file.text();
    return parseProject(text);
  } catch {
    return null;
  }
}

async function saveManifestToHandle(
  dirHandle: FileSystemHandle,
  project: NexusProjectManifest,
): Promise<string> {
  if (!dirHandle.getFileHandle) return "";
  const fileHandle = await dirHandle.getFileHandle("project.nexus.json", {
    create: true,
  });
  const createWritable = fileHandle.createWritable;
  if (!createWritable) return "";
  const writable = await createWritable.call(fileHandle);
  await writable.write(serializeProject(project));
  await writable.close();
  return "project.nexus.json";
}

async function pickFolder(): Promise<FileSystemHandle | null> {
  const w = window as WindowWithFS;
  if (!w.showDirectoryPicker) return null;
  try {
    return await w.showDirectoryPicker();
  } catch {
    return null; // user cancelled
  }
}

const browserProvider: FileSystemProvider = {
  supportsFolders: hasFSAccess(),

  async openProject() {
    // Try FS Access API first
    if (hasFSAccess()) {
      const dir = await pickFolder();
      if (dir) {
        const manifest = await readManifestFromHandle(dir);
        if (manifest) return manifest;
      }
    }

    // Fallback: file picker for a .nexus.json bundle
    return new Promise((resolve) => {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".nexus.json,application/json";
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return resolve(null);
        try {
          const text = await file.text();
          resolve(parseProject(text));
        } catch {
          resolve(null);
        }
      };
      input.click();
    });
  },

  async saveProject(project, suggestedName) {
    const name = safeProjectName(
      suggestedName || project.name || "untitled-project",
    );

    if (hasFSAccess()) {
      const dir = await pickFolder();
      if (dir) {
        const path = await saveManifestToHandle(dir, project);
        if (path) return { path, name: `${name}.nexus.json` };
      }
    }

    // Fallback: download the bundle
    const blob = new Blob([serializeProject(project)], {
      type: "application/json",
    });
    downloadBlob(blob, `${name}.nexus.json`);
    return { path: `${name}.nexus.json`, name: `${name}.nexus.json` };
  },

  async saveFile(project, fileId) {
    const file = project.files[fileId];
    if (!file) return null;
    const name = safeProjectName(file.name);
    if (file.kind === "folder") {
      const blob = new Blob([serializeProject(project)], {
        type: "application/json",
      });
      downloadBlob(blob, `${name}.folder.nexus.json`);
      return {
        path: `${name}.folder.nexus.json`,
        name: `${name}.folder.nexus.json`,
      };
    }
    const payload =
      file.kind === "scene"
        ? JSON.stringify(file.scene, null, 2)
        : JSON.stringify(file.component, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const ext = file.kind === "scene" ? "scene" : "component";
    downloadBlob(blob, `${name}.${ext}.nexus.json`);
    return {
      path: `${name}.${ext}.nexus.json`,
      name: `${name}.${ext}.nexus.json`,
    };
  },
};

/* ------------------------------------------------------------------ */
/*  Node backend stub (only active in Node/Electron-like env)          */
/* ------------------------------------------------------------------ */

// Guarded so it never runs in the browser.
const isNodeEnv =
  typeof process !== "undefined" &&
  !!process.versions &&
  !!process.versions.node;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let nodeProvider: FileSystemProvider | null = null;

if (isNodeEnv) {
  // Dynamic require so bundlers don't try to resolve 'node:fs' in the browser.
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const fsModule = require("node:fs") as typeof import("node:fs");
    const pathModule = require("node:path") as typeof import("node:path");

    nodeProvider = {
      supportsFolders: true,
      async openProject() {
        return null; // Implemented via IPC in a real desktop shell.
      },
      async saveProject(project, suggestedName) {
        const name = (suggestedName || project.name || "project").replace(
          /[^\w\s-]/g,
          "",
        );
        const dir = process.cwd();
        const filePath = pathModule.join(dir, `${name}.nexus.json`);
        fsModule.writeFileSync(filePath, serializeProject(project), "utf-8");
        return { path: filePath, name: `${name}.nexus.json` };
      },
      async saveFile(project, fileId) {
        const file = project.files[fileId];
        if (!file) return null;
        const name = (file.name || "file").replace(/[^\w\s-]/g, "");
        const filePath = pathModule.join(
          process.cwd(),
          `${name}.${file.kind}.nexus.json`,
        );
        const payload =
          file.kind === "scene"
            ? JSON.stringify(file.scene, null, 2)
            : file.kind === "component"
              ? JSON.stringify(file.component, null, 2)
              : serializeProject(project);
        fsModule.writeFileSync(filePath, payload, "utf-8");
        return { path: filePath, name: `${name}.${file.kind}.nexus.json` };
      },
    };
  } catch {
    nodeProvider = null;
  }
}

/**
 * The active filesystem provider for the current environment.
 */
export const fileSystem: FileSystemProvider = nodeProvider ?? browserProvider;
