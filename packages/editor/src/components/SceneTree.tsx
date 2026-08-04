import { useState, useRef, useEffect } from "react";
import { useEditorStore } from "../store.ts";
import {
  ChevronRight,
  ChevronDown,
  Lock,
  FileText,
  Box,
  Image,
  Link,
  MousePointerClick,
  Type,
  Layout,
  Grid3X3,
  Layers,
  ScrollText,
  Timer,
  GitBranch,
  Database,
  Globe,
  Mail,
  Settings,
  Monitor,
  Plus,
  Copy,
  Trash2,
  Pencil,
} from "lucide-react";

const TYPE_ICON_MAP: Record<string, React.ElementType> = {
  page: Monitor,
  container: Box,
  text: Type,
  image: Image,
  link: Link,
  button: MousePointerClick,
  input: FileText,
  textarea: ScrollText,
  select: Settings,
  video: Monitor,
  canvas: Layers,
  svg: Image,
  flex: Layout,
  grid: Grid3X3,
  stack: Layers,
  scroll: ScrollText,
  timer: Timer,
  counter: Timer,
  condition: GitBranch,
  variable: Settings,
  router: Globe,
  http_request: Globe,
  form_validator: FileText,
  api_endpoint: Globe,
  database_table: Database,
  database_query: Database,
  auth_provider: Lock,
  storage_bucket: Box,
  websocket_room: Globe,
  cron_job: Timer,
  email_sender: Mail,
};

function NodeIcon({ type }: { type: string }) {
  const Icon = TYPE_ICON_MAP[type] ?? Box;
  return <Icon size={12} className="text-nexus-muted shrink-0" />;
}

export function SceneTree() {
  const scene = useEditorStore((s) => s.scene);
  const selectedId = useEditorStore((s) => s.selectedNodeId);
  const expandedIds = useEditorStore((s) => s.expandedIds);
  const selectNode = useEditorStore((s) => s.selectNode);
  const toggleExpand = useEditorStore((s) => s.toggleExpand);
  const addNode = useEditorStore((s) => s.addNode);
  const deleteNode = useEditorStore((s) => s.deleteNode);
  const duplicateNode = useEditorStore((s) => s.duplicateNode);
  const renameNode = useEditorStore((s) => s.renameNode);
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    nodeId: string;
  } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Close context menu on click outside
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [contextMenu]);

  // Auto-focus rename input
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  if (!scene) return null;

  const startRename = (nodeId: string, name: string) => {
    setEditingId(nodeId);
    setDraftName(name);
    setContextMenu(null);
  };

  const commitRename = () => {
    if (editingId && draftName.trim()) {
      renameNode(editingId, draftName.trim());
    }
    setEditingId(null);
  };

  const handleContextMenu = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    if (nodeId === scene.rootId) return;
    setContextMenu({ x: e.clientX, y: e.clientY, nodeId });
  };

  const renderNode = (nodeId: string, depth = 0) => {
    const node = scene.nodes[nodeId];
    if (!node) return null;

    const hasChildren = node.childrenIds.length > 0;
    const isExpanded = expandedIds.has(nodeId);
    const isSelected = selectedId === nodeId;

    return (
      <div key={nodeId}>
        <div
          className={`g-tree-row group ${isSelected ? "g-tree-row-selected" : ""}`}
          style={{ paddingLeft: `${8 + depth * 16}px` }}
          onClick={() => selectNode(nodeId)}
          onContextMenu={(e) => handleContextMenu(e, nodeId)}
        >
          <span
            className="w-4 h-4 flex items-center justify-center shrink-0 text-nexus-muted"
            onClick={(e) => {
              e.stopPropagation();
              hasChildren && toggleExpand(nodeId);
            }}
          >
            {hasChildren ? (
              isExpanded ? (
                <ChevronDown size={12} />
              ) : (
                <ChevronRight size={12} />
              )
            ) : null}
          </span>

          <span className="mr-1.5">
            <NodeIcon type={node.type} />
          </span>

          {editingId === nodeId ? (
            <input
              ref={inputRef}
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onBlur={commitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitRename();
                if (e.key === "Escape") setEditingId(null);
              }}
              className="flex-1 bg-nexus-bg border border-nexus-accent text-xs text-nexus-text px-1 py-0 rounded outline-none"
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="text-xs truncate flex-1">{node.name}</span>
          )}

          <span className="text-xxs text-nexus-muted px-1.5 py-0.5 bg-nexus-bg rounded ml-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {node.type}
          </span>

          {node.meta?.locked && (
            <Lock size={10} className="ml-1.5 text-yellow-500" />
          )}
        </div>

        {hasChildren &&
          isExpanded &&
          node.childrenIds.map((childId) => renderNode(childId, depth + 1))}
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto py-1">
      {renderNode(scene.rootId)}

      {/* Godot-style context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 w-44 bg-nexus-panel border border-nexus-border rounded shadow-xl py-1"
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-nexus-text hover:bg-nexus-accent"
            onClick={() => {
              addNode("container", "New Child", contextMenu.nodeId);
              setContextMenu(null);
            }}
          >
            <Plus size={12} /> Add Child
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-nexus-text hover:bg-nexus-accent"
            onClick={() => {
              duplicateNode(contextMenu.nodeId);
              setContextMenu(null);
            }}
          >
            <Copy size={12} /> Duplicate
          </button>
          <button
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-nexus-text hover:bg-nexus-accent"
            onClick={() => {
              const node = scene.nodes[contextMenu.nodeId];
              if (node) startRename(contextMenu.nodeId, node.name);
            }}
          >
            <Pencil size={12} /> Rename
          </button>
          <div className="h-px bg-nexus-border my-1" />
          <button
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-400 hover:bg-red-500/20"
            onClick={() => {
              deleteNode(contextMenu.nodeId);
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
