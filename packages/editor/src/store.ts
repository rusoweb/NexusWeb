import { create } from "zustand";
import { enablePatches, produce, applyPatches, type Patch } from "immer";
import type {
  NexusScene,
  NexusNode,
  NodeType,
  NexusStyle,
  NexusComponent,
  ComponentLibrary,
  NexusProjectManifest,
} from "@nexusweb/core";
import {
  createEmptyScene,
  createNode,
  addChild,
  removeNode,
  moveNode,
  parseScene,
  serializeScene,
  extractSubtree,
  createProjectManifest,
} from "@nexusweb/core";
import { compileScene, downloadCompiledScene } from "@nexusweb/compiler";
import { fileSystem } from "./fs.ts";

export type ProjectItem =
  | {
      id: string;
      kind: "folder";
      name: string;
      parentId: string | null;
      children: string[];
    }
  | {
      id: string;
      kind: "scene";
      name: string;
      parentId: string | null;
      scene: NexusScene;
    };

const PROJECT_STORAGE_KEY = "nexusweb-editor-project";
const COMPONENT_LIBRARY_STORAGE_KEY = "nexusweb_component_library";

function cloneScene(scene: NexusScene): NexusScene {
  if (typeof structuredClone === "function") {
    return structuredClone(scene);
  }
  return JSON.parse(JSON.stringify(scene)) as NexusScene;
}

function createDemoScene(name: string): NexusScene {
  const scene = createEmptyScene(name);
  let nodes = scene.nodes;

  const headerId = crypto.randomUUID();
  const header = createNode(headerId, "container", "Header", {
    transform: { x: "0", y: "0", width: "100%", height: "64px" },
    style: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "0 24px",
      backgroundColor: "#252526",
    },
  });
  nodes = addChild(scene.rootId, header, nodes);

  const logo = createNode(crypto.randomUUID(), "text", "Logo", {
    parentId: headerId,
    data: { content: "NexusWeb" },
    style: { fontSize: "20px", fontWeight: "700", color: "#ffffff" },
  });
  nodes = addChild(headerId, logo, nodes);

  const nav = createNode(crypto.randomUUID(), "container", "Navigation", {
    parentId: headerId,
    transform: { x: "0", y: "0", width: "auto", height: "auto" },
    style: { display: "flex", gap: "24px" },
  });
  nodes = addChild(headerId, nav, nodes);

  const heroId = crypto.randomUUID();
  const hero = createNode(heroId, "container", "Hero", {
    parentId: scene.rootId,
    transform: { x: "0", y: "64px", width: "100%", height: "400px" },
    style: {
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      padding: "80px 24px",
      gap: "16px",
    },
  });
  nodes = addChild(scene.rootId, hero, nodes);

  const title = createNode(crypto.randomUUID(), "text", "Title", {
    parentId: heroId,
    data: { content: "Build like Godot" },
    style: {
      fontSize: "48px",
      fontWeight: "700",
      color: "#ffffff",
      textAlign: "center",
    },
  });
  nodes = addChild(heroId, title, nodes);

  const subtitle = createNode(crypto.randomUUID(), "text", "Subtitle", {
    parentId: heroId,
    data: { content: "Everything is a node." },
    style: { fontSize: "20px", color: "#888888", textAlign: "center" },
  });
  nodes = addChild(heroId, subtitle, nodes);

  const btn = createNode(crypto.randomUUID(), "button", "CTA", {
    parentId: heroId,
    data: { text: "Get Started", variant: "primary" },
    style: {
      padding: "12px 24px",
      backgroundColor: "#2563eb",
      color: "#ffffff",
      borderRadius: "6px",
      border: "none",
      cursor: "pointer",
    },
    outputs: [{ id: "pressed", label: "pressed", type: "event" }],
  });
  nodes = addChild(heroId, btn, nodes);

  return { ...scene, nodes };
}

function createDefaultProjectState(sceneName = "Main Scene") {
  const scene = createDemoScene(sceneName);
  const projectRootId = crypto.randomUUID();
  const sceneId = crypto.randomUUID();

  const projectItems: Record<string, ProjectItem> = {
    [projectRootId]: {
      id: projectRootId,
      kind: "folder",
      name: "Project",
      parentId: null,
      children: [sceneId],
    },
    [sceneId]: {
      id: sceneId,
      kind: "scene",
      name: sceneName,
      parentId: projectRootId,
      scene,
    },
  };

  return {
    scene,
    projectRootId,
    projectItems,
    selectedProjectItemId: sceneId,
  } as {
    scene: NexusScene;
    projectRootId: string;
    projectItems: Record<string, ProjectItem>;
    selectedProjectItemId: string | null;
  };
}

function persistProjectState(state: {
  projectRootId: string;
  projectItems: Record<string, ProjectItem>;
  selectedProjectItemId: string | null;
}) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(
      PROJECT_STORAGE_KEY,
      JSON.stringify({
        projectRootId: state.projectRootId,
        projectItems: state.projectItems,
        selectedProjectItemId: state.selectedProjectItemId,
      }),
    );
  } catch {
    // Ignore persistence failures in browser storage.
  }
}

function readProjectStateFromStorage() {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(PROJECT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as {
      scene?: NexusScene;
      projectRootId: string;
      projectItems: Record<string, ProjectItem>;
      selectedProjectItemId: string | null;
    };
  } catch {
    return null;
  }
}

function createStarterComponentLibrary(): ComponentLibrary {
  return {
    version: "0.1.0",
    components: [
      {
        id: crypto.randomUUID(),
        name: "Navbar",
        description: "A simple navigation bar",
        category: "Navigation",
        exports: [
          {
            name: "title",
            label: "Title",
            type: "string",
            defaultValue: "NexusWeb",
          },
          {
            name: "links",
            label: "Links",
            type: "string",
            defaultValue: "Home, Docs",
          },
        ],
        scene: createDemoScene("Navbar"),
        version: "0.1.0",
      },
      {
        id: crypto.randomUUID(),
        name: "HeroSection",
        description: "A call-to-action hero section",
        category: "Layout",
        exports: [
          {
            name: "title",
            label: "Title",
            type: "string",
            defaultValue: "Build like Godot",
          },
          {
            name: "subtitle",
            label: "Subtitle",
            type: "string",
            defaultValue: "Everything is a node.",
          },
          {
            name: "buttonText",
            label: "Button Text",
            type: "string",
            defaultValue: "Get Started",
          },
        ],
        scene: createDemoScene("HeroSection"),
        version: "0.1.0",
      },
      {
        id: crypto.randomUUID(),
        name: "ButtonPrimary",
        description: "Primary styled button",
        category: "Forms",
        exports: [
          {
            name: "label",
            label: "Label",
            type: "string",
            defaultValue: "Click me",
          },
        ],
        scene: createDemoScene("ButtonPrimary"),
        version: "0.1.0",
      },
      {
        id: crypto.randomUUID(),
        name: "InputField",
        description: "A labeled input",
        category: "Forms",
        exports: [
          {
            name: "placeholder",
            label: "Placeholder",
            type: "string",
            defaultValue: "Enter text",
          },
        ],
        scene: createDemoScene("InputField"),
        version: "0.1.0",
      },
    ],
  };
}

function readComponentLibraryFromStorage(): ComponentLibrary {
  if (typeof window === "undefined") return createStarterComponentLibrary();

  try {
    const raw = window.localStorage.getItem(COMPONENT_LIBRARY_STORAGE_KEY);
    if (!raw) return createStarterComponentLibrary();
    const parsed = JSON.parse(raw) as ComponentLibrary;
    return parsed && parsed.components
      ? parsed
      : createStarterComponentLibrary();
  } catch {
    return createStarterComponentLibrary();
  }
}

function persistComponentLibrary(library: ComponentLibrary): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      COMPONENT_LIBRARY_STORAGE_KEY,
      JSON.stringify(library),
    );
  } catch {
    // Ignore storage failures.
  }
}

enablePatches();

export type Breakpoint = "mobile" | "tablet" | "desktop";

export interface NodeBehavior {
  onClick?: {
    action:
      | "none"
      | "navigate"
      | "show"
      | "hide"
      | "toggle"
      | "scrollTo"
      | "submit"
      | "custom";
    targetId?: string;
    url?: string;
    customScript?: string;
  };
  onHover?: {
    action: "none" | "show" | "hide" | "toggle";
    targetId?: string;
  };
}

interface HistoryEntry {
  patches: Patch[];
  inversePatches: Patch[];
}

interface EditorState {
  scene: NexusScene | null;
  selectedNodeId: string | null;
  expandedIds: Set<string>;
  activeBreakpoint: Breakpoint;
  previewMode: boolean;
  previewWindow: Window | null;
  projectRootId: string;
  projectItems: Record<string, ProjectItem>;
  selectedProjectItemId: string | null;
  projectManifest: NexusProjectManifest | null;

  history: HistoryEntry[];
  historyIndex: number;

  // Actions
  loadScene: () => void;
  selectNode: (id: string | null) => void;
  toggleExpand: (id: string) => void;
  setBreakpoint: (bp: Breakpoint) => void;
  togglePreviewMode: () => void;
  refreshPreview: () => void;

  // Node CRUD
  addNode: (type: NodeType, name: string, parentId?: string) => void;
  deleteNode: (id: string) => void;
  moveNode: (nodeId: string, newParentId: string | null) => void;
  duplicateNode: (id: string) => void;
  getNodeParentId: (id: string) => string | null;

  // Transform & Style
  updateNodePosition: (id: string, x: number, y: number) => void;
  updateNodeSize: (id: string, width: number, height: number) => void;
  updateNodeStyle: (id: string, style: Partial<NexusStyle>) => void;
  updateNodeData: (id: string, data: Partial<NexusNode["data"]>) => void;
  updateNodeBehavior: (id: string, behavior: Partial<NodeBehavior>) => void;
  renameNode: (id: string, name: string) => void;

  // Project filing
  createProjectFolder: (parentId?: string | null, name?: string) => void;
  createProjectScene: (parentId?: string | null, name?: string) => void;
  openProjectItem: (itemId: string) => void;
  saveCurrentSceneToProject: (targetId?: string | null) => void;
  renameProjectItem: (id: string, name: string) => void;
  deleteProjectItem: (id: string) => void;
  moveProjectItem: (itemId: string, newParentId: string | null) => void;
  saveProject: () => Promise<void>;
  openProjectFile: () => Promise<void>;
  saveFile: (fileId: string) => Promise<void>;

  // Component system
  componentLibrary: ComponentLibrary;
  loadComponentLibrary: () => void;
  saveAsComponent: (nodeId: string, name: string, category: string) => void;
  instantiateComponent: (componentId: string, parentId: string) => void;
  updateNodeProps: (nodeId: string, props: Record<string, unknown>) => void;

  // Compile & Save/Load
  compile: () => void;
  exportZip: () => void;
  download: (filename: string) => void;
  loadSceneFromFile: (file: File) => void;

  // Undo/Redo
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

const MAX_HISTORY = 50;

function recordHistory(
  getState: () => EditorState,
  setState: (partial: Partial<EditorState>) => void,
  mutator: (draft: NexusScene) => void,
): void {
  const state = getState();
  if (!state.scene) return;

  let patches: Patch[] = [];
  let inversePatches: Patch[] = [];

  const nextScene = produce(state.scene, mutator, (p, ip) => {
    patches = p;
    inversePatches = ip;
  });

  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push({ patches, inversePatches });
  if (newHistory.length > MAX_HISTORY) newHistory.shift();

  setState({
    scene: nextScene,
    history: newHistory,
    historyIndex: newHistory.length - 1,
  });
}

const persistedProject = readProjectStateFromStorage();
const initialProject = persistedProject ?? createDefaultProjectState();
const initialScene = initialProject.scene ?? createDemoScene("Main Scene");

function createInitialProjectManifest(scene: NexusScene): NexusProjectManifest {
  const sceneFileId = crypto.randomUUID();
  return createProjectManifest(scene.name || "Project", scene, sceneFileId);
}

export const useEditorStore = create<EditorState>((set, get) => ({
  scene: initialScene,
  selectedNodeId: null,
  expandedIds: new Set([initialScene.rootId]),
  activeBreakpoint: "desktop",
  previewMode: false,
  previewWindow: null,
  projectRootId: initialProject.projectRootId,
  projectItems: initialProject.projectItems,
  selectedProjectItemId: initialProject.selectedProjectItemId,
  /* eslint-disable @typescript-eslint/no-explicit-any */
  projectManifest: createInitialProjectManifest(initialScene) as any,
  componentLibrary: readComponentLibraryFromStorage(),
  history: [],
  historyIndex: -1,

  loadScene: () => {
    const persisted = readProjectStateFromStorage();
    const defaultProject = createDefaultProjectState();

    if (persisted) {
      const selectedItem =
        persisted.projectItems[persisted.selectedProjectItemId ?? ""];
      const scene =
        selectedItem?.kind === "scene"
          ? selectedItem.scene
          : defaultProject.scene;

      set({
        scene,
        selectedNodeId: null,
        expandedIds: new Set([scene.rootId]),
        projectRootId: persisted.projectRootId,
        projectItems: persisted.projectItems,
        selectedProjectItemId: persisted.selectedProjectItemId,
        history: [],
        historyIndex: -1,
      });
      return;
    }

    const scene = defaultProject.scene;
    const projectItems = defaultProject.projectItems;
    const projectRootId = defaultProject.projectRootId;
    const selectedProjectItemId = defaultProject.selectedProjectItemId;

    set({
      scene,
      selectedNodeId: null,
      expandedIds: new Set([scene.rootId]),
      projectRootId,
      projectItems,
      selectedProjectItemId,
      history: [],
      historyIndex: -1,
    });

    persistProjectState({
      projectRootId,
      projectItems,
      selectedProjectItemId,
    });
  },

  createProjectFolder: (parentId = null, name = "New Folder") => {
    const state = get();
    const parent = parentId ?? state.projectRootId;
    const folderId = crypto.randomUUID();
    const nextItems: Record<string, ProjectItem> = {
      ...state.projectItems,
      [folderId]: {
        id: folderId,
        kind: "folder",
        name,
        parentId: parent,
        children: [],
      },
    };

    if (state.projectItems[parent]?.kind === "folder") {
      nextItems[parent] = {
        ...state.projectItems[parent],
        children: [...state.projectItems[parent].children, folderId],
      } as ProjectItem;
    }

    set({ projectItems: nextItems });
    persistProjectState({
      projectRootId: state.projectRootId,
      projectItems: nextItems,
      selectedProjectItemId: folderId,
    });
  },

  createProjectScene: (parentId = null, name = "New Scene") => {
    const state = get();
    const parent = parentId ?? state.projectRootId;
    const sceneId = crypto.randomUUID();
    const scene = createDemoScene(name);
    const nextItems: Record<string, ProjectItem> = {
      ...state.projectItems,
      [sceneId]: {
        id: sceneId,
        kind: "scene",
        name,
        parentId: parent,
        scene,
      },
    };

    if (state.projectItems[parent]?.kind === "folder") {
      nextItems[parent] = {
        ...state.projectItems[parent],
        children: [...state.projectItems[parent].children, sceneId],
      } as ProjectItem;
    }

    set({
      scene,
      selectedNodeId: null,
      expandedIds: new Set([scene.rootId]),
      projectItems: nextItems,
      selectedProjectItemId: sceneId,
      history: [],
      historyIndex: -1,
    });
    persistProjectState({
      projectRootId: state.projectRootId,
      projectItems: nextItems,
      selectedProjectItemId: sceneId,
    });
  },

  openProjectItem: (itemId) => {
    const state = get();
    const item = state.projectItems[itemId];
    if (!item) return;

    if (item.kind === "scene") {
      set({
        scene: item.scene,
        selectedNodeId: null,
        expandedIds: new Set([item.scene.rootId]),
        selectedProjectItemId: item.id,
        history: [],
        historyIndex: -1,
      });
      persistProjectState({
        projectRootId: state.projectRootId,
        projectItems: state.projectItems,
        selectedProjectItemId: item.id,
      });
    }
  },

  saveCurrentSceneToProject: (targetId = null) => {
    const state = get();
    if (!state.scene) return;
    const target = targetId ?? state.selectedProjectItemId;
    if (!target) return;

    const nextItems: Record<string, ProjectItem> = {
      ...state.projectItems,
      [target]: {
        ...state.projectItems[target],
        kind: "scene",
        name: state.scene.name || "Scene",
        scene: cloneScene(state.scene),
      } as ProjectItem,
    };

    set({ projectItems: nextItems });
    persistProjectState({
      projectRootId: state.projectRootId,
      projectItems: nextItems,
      selectedProjectItemId: target,
    });
  },

  renameProjectItem: (id, name) => {
    const state = get();
    if (!state.projectItems[id]) return;
    const nextItems: Record<string, ProjectItem> = {
      ...state.projectItems,
      [id]: {
        ...state.projectItems[id],
        name,
      },
    };
    set({ projectItems: nextItems });
    persistProjectState({
      projectRootId: state.projectRootId,
      projectItems: nextItems,
      selectedProjectItemId: state.selectedProjectItemId,
    });
  },

  deleteProjectItem: (id) => {
    const state = get();
    if (!state.projectItems[id]) return;
    if (id === state.projectRootId) return;

    const nextItems: Record<string, ProjectItem> = { ...state.projectItems };
    const item = nextItems[id];
    delete nextItems[id];

    if (item?.parentId) {
      const parentItem = nextItems[item.parentId];
      if (parentItem?.kind === "folder") {
        nextItems[item.parentId] = {
          ...parentItem,
          children: parentItem.children.filter(
            (childId: string) => childId !== id,
          ),
        };
      }
    }

    set({ projectItems: nextItems });
    persistProjectState({
      projectRootId: state.projectRootId,
      projectItems: nextItems,
      selectedProjectItemId:
        state.selectedProjectItemId === id ? null : state.selectedProjectItemId,
    });
  },

  moveProjectItem: (itemId, newParentId) => {
    const state = get();
    if (!state.projectItems[itemId]) return;
    if (itemId === state.projectRootId) return;
    if (newParentId === itemId) return;

    const nextItems: Record<string, ProjectItem> = { ...state.projectItems };
    const item = nextItems[itemId];

    // Remove from old parent
    if (item.parentId && nextItems[item.parentId]?.kind === "folder") {
      const oldParent = nextItems[item.parentId];
      if (oldParent.kind === "folder") {
        nextItems[item.parentId] = {
          ...oldParent,
          children: oldParent.children.filter((cid: string) => cid !== itemId),
        };
      }
    }

    // Add to new parent
    if (newParentId && nextItems[newParentId]?.kind === "folder") {
      const newParent = nextItems[newParentId];
      if (newParent.kind === "folder") {
        nextItems[newParentId] = {
          ...newParent,
          children: [...newParent.children, itemId],
        };
      }
    }

    nextItems[itemId] = { ...item, parentId: newParentId };

    set({ projectItems: nextItems });
    persistProjectState({
      projectRootId: state.projectRootId,
      projectItems: nextItems,
      selectedProjectItemId: state.selectedProjectItemId,
    });
  },

  saveProject: async () => {
    const state = get();
    if (!state.projectManifest) return;
    // Sync the current scene into the manifest root scene file if present.
    const manifest = {
      ...state.projectManifest,
      files: { ...state.projectManifest.files },
    };
    if (
      state.scene &&
      manifest.rootFileId &&
      manifest.files[manifest.rootFileId]
    ) {
      manifest.files[manifest.rootFileId] = {
        ...manifest.files[manifest.rootFileId],
        scene: cloneScene(state.scene),
      };
    }
    manifest.updatedAt = new Date().toISOString();
    set({ projectManifest: manifest });
    await fileSystem.saveProject(manifest, manifest.name);
  },

  openProjectFile: async () => {
    const state = get();
    const manifest = await fileSystem.openProject();
    if (!manifest) return;
    const rootSceneFile = (() => {
      const file = manifest.files[manifest.rootFileId];
      return file && file.kind === "scene" ? file : null;
    })();
    const scene = rootSceneFile?.scene ?? state.scene;
    set({
      projectManifest: manifest,
      scene,
      selectedNodeId: null,
      expandedIds: scene ? new Set([scene.rootId]) : new Set(),
      history: [],
      historyIndex: -1,
    });
  },

  saveFile: async (fileId) => {
    const state = get();
    if (!state.projectManifest) return;
    const manifest = {
      ...state.projectManifest,
      files: { ...state.projectManifest.files },
    };

    // If saving the root scene file, sync current scene.
    if (fileId === manifest.rootFileId && state.scene) {
      manifest.files[fileId] = {
        ...manifest.files[fileId],
        scene: cloneScene(state.scene),
      };
    }
    manifest.updatedAt = new Date().toISOString();
    set({ projectManifest: manifest });
    await fileSystem.saveFile(manifest, fileId);
  },

  loadComponentLibrary: () => {
    const library = readComponentLibraryFromStorage();
    set({ componentLibrary: library });
  },

  saveAsComponent: (nodeId, name, category) => {
    const state = get();
    if (!state.scene) return;
    const node = state.scene.nodes[nodeId];
    if (!node) return;

    const subtree = extractSubtree(nodeId, state.scene.nodes);
    const rootNode = subtree[nodeId];
    if (!rootNode) return;

    const componentScene: NexusScene = {
      ...state.scene,
      id: crypto.randomUUID(),
      name,
      isComponent: true,
      nodes: subtree,
      rootId: nodeId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const component: NexusComponent = {
      id: crypto.randomUUID(),
      name,
      description: `${name} component`,
      category,
      exports: [
        {
          name: "content",
          label: "Content",
          type: "string",
          defaultValue: node.data.content ?? node.data.text ?? "",
        },
      ],
      scene: componentScene,
      version: "0.1.0",
    };

    const nextLibrary: ComponentLibrary = {
      version: "0.1.0",
      components: [...state.componentLibrary.components, component],
    };

    set({ componentLibrary: nextLibrary });
    persistComponentLibrary(nextLibrary);
  },

  instantiateComponent: (componentId, parentId) => {
    const state = get();
    if (!state.scene) return;
    const component = state.componentLibrary.components.find(
      (entry) => entry.id === componentId,
    );
    if (!component) return;

    const targetParentId = parentId || state.scene.rootId;
    const nodeId = crypto.randomUUID();
    const instanceNode = createNode(nodeId, "component", component.name, {
      parentId: targetParentId,
      data: {
        componentRef: component.id,
        props: {},
      },
    });

    recordHistory(get, set, (draft) => {
      draft.nodes = addChild(targetParentId, instanceNode, draft.nodes);
    });

    set((s) => ({
      selectedNodeId: nodeId,
      expandedIds: new Set([...s.expandedIds, targetParentId]),
    }));
  },

  updateNodeProps: (nodeId, props) => {
    const state = get();
    if (!state.scene) return;
    recordHistory(get, set, (draft) => {
      const node = draft.nodes[nodeId];
      if (node) {
        node.data.props = { ...(node.data.props ?? {}), ...props };
      }
    });
  },

  selectNode: (id) => set({ selectedNodeId: id }),

  toggleExpand: (id) =>
    set((state) => {
      const next = new Set(state.expandedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { expandedIds: next };
    }),

  setBreakpoint: (bp) => set({ activeBreakpoint: bp }),
  togglePreviewMode: () => set((s) => ({ previewMode: !s.previewMode })),

  addNode: (type: NodeType, name: string, parentId?: string) => {
    const state = get();
    if (!state.scene) return;

    let targetParent = parentId;
    if (!targetParent) {
      const selId = state.selectedNodeId;
      if (selId && state.scene.nodes[selId]) {
        targetParent = selId;
      } else {
        targetParent = state.scene.rootId;
      }
    }

    const initialData: Partial<NexusNode["data"]> = (() => {
      switch (type) {
        case "text":
          return { content: "Text" };
        case "button":
          return { text: "Button" };
        case "link":
          return { text: "Link" };
        case "input":
          return { placeholder: "Enter text" };
        case "textarea":
          return { placeholder: "Enter text" };
        case "select":
          return { value: "Option" };
        default:
          return {};
      }
    })();

    // Give new nodes a sensible default size so they don't collapse into
    // tiny 10×10 boxes at the container's top-left corner.
    const defaultSize = (() => {
      switch (type) {
        case "page":
          return { width: "100%", height: "100%" };
        case "container":
          return { width: "240px", height: "120px" };
        case "text":
          return { width: "160px", height: "28px" };
        case "button":
        case "link":
          return { width: "160px", height: "36px" };
        case "input":
        case "select":
          return { width: "200px", height: "32px" };
        case "textarea":
          return { width: "240px", height: "80px" };
        case "image":
          return { width: "200px", height: "150px" };
        case "video":
          return { width: "320px", height: "180px" };
        default:
          return { width: "160px", height: "40px" };
      }
    })();

    const node = createNode(crypto.randomUUID(), type, name, {
      transform: {
        x: "0",
        y: "0",
        ...defaultSize,
      },
      data: initialData,
    });

    recordHistory(get, set, (draft) => {
      draft.nodes = addChild(targetParent, node, draft.nodes);
      draft.updatedAt = new Date().toISOString();
    });

    set((s) => ({
      selectedNodeId: node.id,
      expandedIds: new Set([...s.expandedIds, targetParent]),
    }));
  },

  duplicateNode: (id) => {
    const state = get();
    if (!state.scene) return;
    const original = state.scene.nodes[id];
    if (!original || id === state.scene.rootId) return;
    // Deep clone the subtree
    const clonedNodes = extractSubtree(id, state.scene.nodes);
    // Re-generate IDs to avoid collisions
    const idMap = new Map<string, string>();
    const newNodes: Record<string, NexusNode> = {};
    for (const oldId of Object.keys(clonedNodes)) {
      const newId = crypto.randomUUID();
      idMap.set(oldId, newId);
    }
    for (const [oldId, node] of Object.entries(clonedNodes)) {
      const newId = idMap.get(oldId)!;
      newNodes[newId] = {
        ...node,
        id: newId,
        parentId: node.parentId ? (idMap.get(node.parentId) ?? null) : null,
        childrenIds: node.childrenIds.map((c) => idMap.get(c) ?? c),
        name: oldId === id ? `${node.name} (copy)` : node.name,
      };
    }
    const newRootId = idMap.get(id)!;
    const parentId = original.parentId ?? state.scene.rootId;
    recordHistory(get, set, (draft) => {
      Object.assign(draft.nodes, newNodes);
      draft.nodes = addChild(parentId, draft.nodes[newRootId], draft.nodes);
    });
    set((s) => ({
      selectedNodeId: newRootId,
      expandedIds: new Set([...s.expandedIds, parentId, newRootId]),
    }));
  },

  getNodeParentId: (id) => {
    const state = get();
    if (!state.scene) return null;
    const node = state.scene.nodes[id];
    return node ? node.parentId : null;
  },

  deleteNode: (id) => {
    const state = get();
    if (!state.scene || id === state.scene.rootId) return;

    recordHistory(get, set, (draft) => {
      draft.nodes = removeNode(id, draft.nodes);
    });

    set((s) => ({
      selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
    }));
  },

  moveNode: (nodeId, newParentId) => {
    recordHistory(get, set, (draft) => {
      draft.nodes = moveNode(nodeId, newParentId, draft.nodes);
    });
  },

  updateNodePosition: (id, x, y) => {
    const state = get();
    if (!state.scene) return;
    const node = state.scene.nodes[id];
    if (!node) return;

    // Resolve a dimension value the same way the Canvas does (handles px and %).
    const bp = state.activeBreakpoint;
    const bpWidths: Record<Breakpoint, number> = {
      mobile: 375,
      tablet: 768,
      desktop: 1440,
    };
    const resolveDim = (value: string | undefined): number => {
      if (!value) return 0;
      if (value.endsWith("%")) {
        return (bpWidths[bp] * parseFloat(value)) / 100;
      }
      const parsed = parseFloat(value);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    // Compute the parent's absolute (world) position by walking up the chain,
    // using the same dimension resolution as the Canvas.
    const getWorldPosition = (
      nodeId: string,
      nodes: Record<string, NexusNode>,
    ): { x: number; y: number } => {
      const n = nodes[nodeId];
      if (!n) return { x: 0, y: 0 };
      const localX = resolveDim(n.transform.x);
      const localY = resolveDim(n.transform.y);
      if (!n.parentId || !nodes[n.parentId]) return { x: localX, y: localY };
      const parentWorld = getWorldPosition(n.parentId, nodes);
      return { x: parentWorld.x + localX, y: parentWorld.y + localY };
    };

    const parentWorld = node.parentId
      ? getWorldPosition(node.parentId, state.scene.nodes)
      : { x: 0, y: 0 };

    // Store the position relative to the parent. Do NOT clamp to 0 — this
    // previously snapped nodes to the top-left whenever the drop point was
    // before the parent's computed origin.
    const localX = x - parentWorld.x;
    const localY = y - parentWorld.y;

    set({
      scene: produce(state.scene, (draft) => {
        const n = draft.nodes[id];
        if (n) {
          n.transform.x = `${localX}px`;
          n.transform.y = `${localY}px`;
          draft.updatedAt = new Date().toISOString();
        }
      }),
    });

    const previewWindow = state.previewWindow;
    if (previewWindow && !previewWindow.closed) {
      get().refreshPreview();
    }
  },

  updateNodeSize: (id, width, height) => {
    const state = get();
    if (!state.scene) return;
    const node = state.scene.nodes[id];
    if (!node) return;

    const minWidth = 10;
    const minHeight = 10;
    const nextWidth = Math.max(minWidth, width);
    const nextHeight = Math.max(minHeight, height);

    recordHistory(get, set, (draft) => {
      const n = draft.nodes[id];
      if (n) {
        n.transform.width = `${nextWidth}px`;
        n.transform.height = `${nextHeight}px`;
      }
    });
  },

  updateNodeStyle: (id, styleUpdate) => {
    recordHistory(get, set, (draft) => {
      const n = draft.nodes[id];
      if (n) Object.assign(n.style, styleUpdate);
    });
  },

  updateNodeData: (id, dataUpdate) => {
    recordHistory(get, set, (draft) => {
      const n = draft.nodes[id];
      if (n) Object.assign(n.data, dataUpdate);
    });
  },

  updateNodeBehavior: (id, behavior) => {
    recordHistory(get, set, (draft) => {
      const n = draft.nodes[id];
      if (n) {
        if (!n.data.behavior) n.data.behavior = {};
        Object.assign(n.data.behavior, behavior);
      }
    });
  },

  renameNode: (id, name) => {
    recordHistory(get, set, (draft) => {
      const n = draft.nodes[id];
      if (n) n.name = name;
    });
  },

  undo: () => {
    const state = get();
    if (!state.canUndo() || !state.scene) return;
    const entry = state.history[state.historyIndex];
    const nextScene = produce(state.scene, (draft) => {
      applyPatches(draft, entry.inversePatches);
    });
    set({ scene: nextScene, historyIndex: state.historyIndex - 1 });
  },

  redo: () => {
    const state = get();
    if (!state.canRedo() || !state.scene) return;
    const entry = state.history[state.historyIndex + 1];
    const nextScene = produce(state.scene, (draft) => {
      applyPatches(draft, entry.patches);
    });
    set({ scene: nextScene, historyIndex: state.historyIndex + 1 });
  },

  canUndo: () => get().historyIndex >= 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  compile: () => {
    const state = get();
    if (!state.scene) return;
    try {
      const result = compileScene(state.scene);
      const updateWindow = (win: Window, focus = true) => {
        win.document.open();
        win.document.write(result.html);
        win.document.close();
        if (focus) win.focus();
      };

      let previewWindow = state.previewWindow;
      if (!previewWindow || previewWindow.closed) {
        previewWindow = window.open("", "nexusweb-preview");
      }
      if (!previewWindow) return;

      updateWindow(previewWindow, true);
      set({ previewWindow });
    } catch (err) {
      console.error("Compile failed:", err);
    }
  },

  refreshPreview: () => {
    const state = get();
    if (!state.scene) return;
    const previewWindow = state.previewWindow;
    if (!previewWindow || previewWindow.closed) {
      return;
    }

    try {
      const result = compileScene(state.scene);
      previewWindow.document.open();
      previewWindow.document.write(result.html);
      previewWindow.document.close();
    } catch (err) {
      console.error("Preview refresh failed:", err);
    }
  },

  download: (filename: string) => {
    const state = get();
    if (!state.scene) return;
    const serialized = serializeScene(state.scene);
    const blob = new Blob([serialized], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    const dlName = filename.endsWith(".nexus") ? filename : filename + ".nexus";
    anchor.download = dlName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  },

  exportZip: () => {
    const state = get();
    if (!state.scene) return;
    try {
      downloadCompiledScene(state.scene, state.scene.name || "export");
    } catch (err) {
      console.error("Export failed:", err);
    }
  },

  loadSceneFromFile: (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const scene = parseScene(text);
        set({
          scene: scene as unknown as NexusScene,
          selectedNodeId: null,
          expandedIds: new Set([scene.rootId]),
          history: [],
          historyIndex: -1,
        });
      } catch (err) {
        console.error("Failed to load scene:", err);
      }
    };
    reader.readAsText(file);
  },
}));
