import { useMemo, useState, useEffect } from "react";
import {
  Folder,
  FolderPlus,
  FileText,
  Plus,
  Pencil,
  Trash2,
  Save,
} from "lucide-react";
import { useEditorStore } from "../store.ts";

function ProjectPanel() {
  const projectItems = useEditorStore((s) => s.projectItems);
  const projectRootId = useEditorStore((s) => s.projectRootId);
  const selectedProjectItemId = useEditorStore((s) => s.selectedProjectItemId);
  const createProjectFolder = useEditorStore((s) => s.createProjectFolder);
  const createProjectScene = useEditorStore((s) => s.createProjectScene);
  const openProjectItem = useEditorStore((s) => s.openProjectItem);
  const saveCurrentSceneToProject = useEditorStore(
    (s) => s.saveCurrentSceneToProject,
  );
  const renameProjectItem = useEditorStore((s) => s.renameProjectItem);
  const deleteProjectItem = useEditorStore((s) => s.deleteProjectItem);
  const scene = useEditorStore((s) => s.scene);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    itemId: string;
  } | null>(null);

  // Close context menu on click outside
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [contextMenu]);

  const rootItem = projectItems[projectRootId];
  const childIds = rootItem?.kind === "folder" ? rootItem.children : [];

  const items = useMemo(
    () => childIds.map((id) => projectItems[id]).filter(Boolean),
    [childIds, projectItems],
  );

  const startRename = (item: { id: string; name: string }) => {
    setEditingId(item.id);
    setDraftName(item.name);
  };

  const commitRename = () => {
    if (editingId) {
      renameProjectItem(editingId, draftName.trim() || "Untitled");
    }
    setEditingId(null);
    setDraftName("");
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="px-3 py-1.5 bg-nexus-panelAlt/60 border-b border-nexus-border flex items-center justify-between">
        <span className="text-xxs font-semibold uppercase tracking-wider text-nexus-muted">
          Project
        </span>
        <div className="flex items-center gap-1">
          <button
            className="p-1 rounded hover:bg-nexus-panelHover text-nexus-muted"
            onClick={() => createProjectFolder(projectRootId)}
            title="New folder"
          >
            <FolderPlus size={12} />
          </button>
          <button
            className="p-1 rounded hover:bg-nexus-panelHover text-nexus-muted"
            onClick={() => createProjectScene(projectRootId)}
            title="New scene"
          >
            <Plus size={12} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-1">
        {items.map((item) => {
          const isSelected = selectedProjectItemId === item.id;
          const isFolder = item.kind === "folder";
          const childIds = isFolder ? item.children : [];

          return (
            <div key={item.id} className="px-1">
              <div
                className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs cursor-pointer ${
                  isSelected
                    ? "bg-nexus-accent text-white"
                    : "text-nexus-text hover:bg-nexus-bg"
                }`}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setContextMenu({
                    x: e.clientX,
                    y: e.clientY,
                    itemId: item.id,
                  });
                }}
              >
                <span className="text-nexus-muted shrink-0">
                  {isFolder ? <Folder size={12} /> : <FileText size={12} />}
                </span>
                {editingId === item.id ? (
                  <input
                    value={draftName}
                    autoFocus
                    onChange={(e) => setDraftName(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename();
                      if (e.key === "Escape") {
                        setEditingId(null);
                        setDraftName("");
                      }
                    }}
                    className="flex-1 bg-transparent outline-none"
                  />
                ) : (
                  <button
                    className="flex-1 text-left truncate"
                    onClick={() => openProjectItem(item.id)}
                  >
                    {item.name}
                  </button>
                )}
                <div className="flex items-center gap-1 opacity-70">
                  {isFolder ? null : (
                    <button
                      className="p-0.5 rounded hover:bg-black/10"
                      title="Save current scene here"
                      onClick={(e) => {
                        e.stopPropagation();
                        saveCurrentSceneToProject(item.id);
                      }}
                    >
                      <Save size={10} />
                    </button>
                  )}
                  <button
                    className="p-0.5 rounded hover:bg-black/10"
                    title="Rename"
                    onClick={(e) => {
                      e.stopPropagation();
                      startRename(item);
                    }}
                  >
                    <Pencil size={10} />
                  </button>
                  <button
                    className="p-0.5 rounded hover:bg-black/10"
                    title="Delete"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteProjectItem(item.id);
                    }}
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              </div>

              {isFolder && childIds.length > 0 && (
                <div className="ml-4 border-l border-nexus-border pl-2 py-1 space-y-1">
                  {childIds.map((childId) => {
                    const child = projectItems[childId];
                    if (!child) return null;
                    return (
                      <div
                        key={child.id}
                        className="flex items-center gap-2 px-2 py-1 rounded text-xs text-nexus-muted hover:bg-nexus-bg"
                      >
                        <span className="shrink-0">
                          {child.kind === "folder" ? (
                            <Folder size={10} />
                          ) : (
                            <FileText size={10} />
                          )}
                        </span>
                        <button
                          className="flex-1 text-left truncate"
                          onClick={() => openProjectItem(child.id)}
                        >
                          {child.name}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="px-3 py-2 border-t border-nexus-border text-xxs text-nexus-muted">
        {scene ? `Active: ${scene.name}` : "No scene"}
      </div>

      {/* Godot-style context menu for FileSystem items */}
      {contextMenu && (
        <div
          className="fixed z-50 w-44 bg-nexus-panel border border-nexus-border rounded shadow-xl py-1"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-nexus-text hover:bg-nexus-accent"
            onClick={() => {
              createProjectFolder(contextMenu.itemId);
              setContextMenu(null);
            }}
          >
            <FolderPlus size={12} /> New Folder
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-nexus-text hover:bg-nexus-accent"
            onClick={() => {
              createProjectScene(contextMenu.itemId);
              setContextMenu(null);
            }}
          >
            <Plus size={12} /> New Scene
          </button>
          <div className="h-px bg-nexus-border my-1" />
          <button
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-nexus-text hover:bg-nexus-accent"
            onClick={() => {
              const item = projectItems[contextMenu.itemId];
              if (item) startRename(item);
              setContextMenu(null);
            }}
          >
            <Pencil size={12} /> Rename
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20"
            onClick={() => {
              deleteProjectItem(contextMenu.itemId);
              setContextMenu(null);
            }}
          >
            <Trash2 size={12} /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

export { ProjectPanel };
